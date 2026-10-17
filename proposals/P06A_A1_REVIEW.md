# P0.6A — A1, suppression persistente degli ingressi

**A1 corretto e verificato localmente; rilascio complessivo NO-GO.** A2–A5 restano separati e aperti. Nessuna modifica a Production, credenziali reali, scanner attivi, frequenze, batch, servizi esterni, worker o scheduler. Questo documento aggiorna il preflight del commit cd39318; non dichiara che la Production sia già protetta.

## Correzione

Il fence dei soli output canonici non proteggeva gli ingressi. La nuova proposta `p06a-ingress-suppression.sql` aggiunge enforcement nel database, senza richiedere ai writer ordinari di adottare un nuovo client/RPC o conoscere chiavi. I tre file SQL P0.6A devono essere revisionati e applicati in futuro **nella stessa transazione**, nell'ordine erasure, recovery-and-fence, ingress-suppression; non applicare soltanto il primo file modificato. Non sono migrazioni installate.

Cinque nuove tabelle private con RLS attiva e nessun privilegio a PUBLIC/anon/authenticated/service_role:

- suppression_config: interruttore amministrativo, default false. Il normale writer non può disabilitarlo.
- suppression_keys: versione, riferimento UUID al segreto Vault e verifica HMAC della chiave, mai il segreto stesso.
- suppressed_identities: PK (versione, token HMAC-SHA256 a 32 byte), data creazione e motivo di retention. Nessun username, user ID, EIAS o ciphertext dell'identità.
- suppressed_candidates: candidate UUID già coinvolti. Necessario per i price point/offer arrivati dopo lo scrub, anche se l'aggiornamento successivo usa un grouping opaco e il candidate non espone più un seller. Nessun FK cascade che dimentichi il blocco con un delete/reinsert del candidate.
- ebay_sources: memoria della provenienza eBay. Copre policy e slug storici, fonti inattive, successive rinomine/rimozioni della policy e UUID riutilizzati dopo una cancellazione amministrativa della fonte. Nessun filtro is_active.

Trigger BEFORE statement/row coprono INSERT/UPDATE sulle cinque tabelle: market_candidates, market_offer_states, price_points, market_aggregate_observations, market_monthly_source_stats. Il lock statement copre anche DELETE. Due trigger di history più i rispettivi lock sulle registry price_sources/market_source_policies coordinano i cambi di attribuzione della fonte. Non si toccano le policy RLS o i privilegi delle tabelle esistenti.

La cancellazione acquisisce il lock esclusivo già usato per il mercato, registra le tombstone e cancella i dati/outbox nella medesima transazione. Qualunque fallimento/timeout fa rollback anche delle tombstone: nessuna notifica completed con cancellazione parziale. Anche con switch false i writer prendono il lock condiviso **prima delle righe**, mediante try-lock, e consultano le tombstone nel database. Nessun epoch fornito dal chiamante può disattivare la suppression. L'attivazione richiede lo stesso lock esclusivo e una keyring valida; non può passare mentre un writer iniziato con switch false è in volo. Dopo la prima tombstone lo switch non è disattivabile con un normale UPDATE amministrativo: servirebbe un bypass DDL esplicito, fuori dal contratto e vietato nel rollback.

- Writer già in transazione prima dell'erase: il lock esclusivo fallisce in modo limitato e la notifica resta recuperabile; il retry persistente potrà cancellare anche i dati appena committati.
- Writer mentre l'erase possiede il lock: PT409, nessuna riga parziale accettata. Lo stesso payload potrà essere riscritto dopo il commit: verrà scrubbed.
- Writer dopo l'erase, nuovo candidate ID o importazione storica: HMAC corrispondente => scrub prima di persistere. Non dipende da ulteriori retry eBay, dalla data fetch o dall'attivazione della fonte.
- Transaction isolation diverso da READ COMMITTED: PT409 prima della scrittura, per non usare uno snapshot che precede le tombstone. I client PostgREST normali della pipeline continuano a usare il percorso ordinario.

La normalizzazione conserva il confronto case-insensitive già previsto, username/user ID/EIAS notificati, prefisso ebay:, segmenti composite/evidence, stringhe JSON annidate e chiavi dinamiche, URL /usr/ e /str/ e percent encoding UTF-8. Un encoding non valido fallisce con errore statico. I nomi fissi delle colonne SQL non sono trattati come chiavi JSON personali: vengono preservati nel record da riscrivere. Non si memorizzano frammenti del token EIAS come se fossero nuove identità: le tombstone sono solo degli identificativi completi notificati. Formati arbitrariamente offuscati o alias mai comunicati dal provider non sono inferibili magicamente: nuovi contratti d'ingresso/provenienza richiedono fixture e verifica prima di essere autorizzati. Un writer che falsifica una provenienza del tutto diversa è fuori dal contratto fidato, come un amministratore che disabilita i trigger.

I valori numerici, date/quantità e riferimenti di mercato non personali restano. Per candidate/offer riferiti al seller cancellato vengono rimossi fingerprint e grouping personale; i point conservano importi ma restano seller_unknown/indicative/non valuation eligible, come nel percorso erase precedente. Il marker privato impedisce di riabilitare questi point con un grouping opaco. Un'identità trovata solo in point/offer marca anch'essa il candidate. I seller estranei e gli ingressi retail estranei conservano dati e funzionamento. Le formule e il mapping MV/SOLD/ASK non sono cambiati.

## Chiavi, accessi, retention

La chiave di suppression è un pepper dedicato a 256 bit nel **Supabase Vault già esistente**, separato dalle chiavi AES/HMAC dell'inbox. Non è generato, configurato o letto in Production. Namespace verificati in sola lettura: pgcrypto 1.3 in extensions; supabase_vault 0.3.1 in vault; view decrypted_secrets con id uuid/decrypted_secret text. I test sostituiscono Vault con una tabella sintetica privata: non certificano la configurazione reale di Vault (A2/A5).

I helper sensibili sono SECURITY DEFINER nello schema privato, search_path=pg_catalog, tutti gli oggetti qualificati, nessun EXECUTE ai writer su funzioni che restituiscono/accettano il keyring. È una necessità del trigger per consultare Vault e gli indici privati senza concedere SELECT ai client, non un rimedio a un errore di permessi. Non sono RPC pubbliche. Il solo helper remember è eseguibile da service_role perché chiamato dall'erasure RPC invoker; non restituisce token/segreti. I helper puri di normalizzazione e detection non danno accesso a storage segreto. Nessun auth.uid richiesto a trigger che operano per un ruolo macchina già autorizzato a scrivere.

Il segreto è letto una volta per riga in una variabile locale del backend; non viene messo in GUC, log, session cache o risultato HTTP. key_check vincola ogni versione al suo valore: chiave assente, malformata o sostituita con un'altra chiave esadecimale valida => PT503 e nessun ingresso eBay accettato. La chiave non viene restituita nel messaggio d'errore. Le impostazioni di logging gestite e APM vanno comunque verificate in A2.

Rotazione: cambiare cifratura/wrapping di Vault preservando il pepper non cambia i token; sostituire il pepper **nella stessa versione** è vietato dal controllo di integrità. Aggiungere una nuova versione richiede mantenere tutte le vecchie necessarie: le ricerche usano tutte le versioni e ogni nuova notifica registra un token per ogni versione. Da un vecchio HMAC non si può ricavare l'identità per rehash; non promettere una rotazione distruttiva di chiavi/tombstone senza aver escluso le copie storiche. FK RESTRICT impedisce la rimozione della binding con tombstone esistenti; rimuovere il segreto Vault senza aggiornare il resto fallisce chiuso. L'operatore privilegiato resta un confine di fiducia.

Retention controllata: nessuna scadenza automatica, nessun DELETE ai ruoli runtime, timestamp e motivo obbligatorio, nessun processo di purge. Il mantenimento ha lo scopo specifico di impedire replay/importazioni storiche, non analytics o nuova profilazione. Revisione amministrativa periodica proposta ogni 90 giorni: l'eventuale fine della retention richiede dimostrare che quella identità non possa più arrivare da fonti, copie, backlog e backup, approvazione esplicita e test di restore/replay. Eliminare dopo un TTL fisso mentre importazioni storiche sono possibili riaprirebbe A1. Non si confonde questo con la retention separata di ledger/inbox o con la garanzia di crypto-erasure. A2/A3 restano aperti per configurazione effettiva e restore.

## Verifiche e prova che il test non è aggirato

`audit-p06a-preflight.mjs` conserva il payload e la sequenza reale del riproduttore cd39318: upsert iniziale, register, erase, verifica NULL, stesso identico upsert service_role via PostgREST. Il vecchio audit asseriva la presenza del bug e usciva sempre 2 anche per A4; ora la postcondizione è di sicurezza (seller assente **e** raw identity assente). Non sono cambiati dati, chiamate, sorgente, ruolo o trasporto per evitare la riproduzione; nessun mock aggiunto. A2–A5 vengono segnalati separatamente, non possono mascherare l'esito del gate A1.

**Controllo negativo:** `P06_A1_NEGATIVE_CONTROL=true node scripts/audit-p06a-preflight.mjs` disabilita esplicitamente il solo trigger amministrativo anti-disattivazione e lo switch nel database sintetico dopo l'erase. Lo stesso replay torna rosso: `true !== false`. Il comando normale torna verde con il guard vero. Il flag è esclusivamente nello script di test, non esiste nell'applicazione/Production. Il rilevamento non è stato disabilitato o reso più permissivo.

`test-ebay-erasure-ingress.mjs` usa PostgreSQL 17.6, PostgREST 13.0.7 e SDK reale:

- scanner in-flight prima dell'erase, exclusive lock durante erase, retry esatto dopo commit; nessuna tombstone parziale e attivazione coordinata con writer iniziati a switch false;
- nuove identità di listing e storiche, alias/case/EIAS completo, duplicati concorrenti, JSON dinamico/URL/percent encoding;
- repository OfferState ordinario invariato, candidate->point in transazioni separate, point-only identity, UPDATE grouping opaco e tentativo di riabilitare valuation;
- insert/update aggregati e monthly, fonte rinominata/disattivata, seller estraneo e importi/quantità conservati;
- deduplica tombstone, keyring esteso con vecchie tombstone, FK di retention; chiave mancante/malformata e sostituzione con un'altra valida falliscono chiuso;
- diniego accesso/purge a token, binding, switch, Vault e helper con segreti; diniego replica-mode/trigger bypass al normale service_role;
- canary su errori HTTP e stdout/stderr PostgreSQL/PostgREST: nessun identificativo, EIAS, pepper o nuova chiave sintetica nei messaggi catturati.

La suite SQL esistente verifica anche rollback delle due nuove tabelle di suppression in ogni fase fallita. La suite E2E già presente continua a verificare erase/recovery/firma/ricalcoli canonici e PGRST303 distinto. Il comando CI esistente ebay:erasure:e2e:test comprende ora E2E precedente, matrice ingress e riproduttore A1. Nessun workflow di scanning/scheduling è modificato, nessuna Preview attivata.

## Esito dei controlli locali

- pnpm verify: PASS, incluse le regressioni scanner, metodo, ASK/SOLD/MV, Collection e cross-surface.
- pnpm typecheck: PASS separato.
- pnpm ebay:erasure:postgres:test: PASS con rollback anche delle tombstone.
- pnpm ebay:erasure:e2e:test: PASS (suite HTTP originaria, matrice ingress e probe A1); matrice finale ripetuta anche separatamente dopo il controllo di isolamento dei lock per database e il caso bulk.
- Probe A1: PASS; negative control con enforcement rimosso nel solo DB sintetico: failure attesa, true !== false.
- Misura finale sintetica: erase di 2.000 payload 625ms/1 RPC/205 byte; batch di 64 ingressi estranei con suppression già presente 679ms/1 richiesta. Nessun importo o seller estraneo perso.
- Diff check: PASS. Nessun file scanner, cron/workflow, Market Method, formula, Release, lockfile dipendenze o configurazione Vercel modificato da A1.

## Prestazioni, rischi residui e rilascio

La prima implementazione locale aveva superato il timeout del campione storico; è stata scartata. La versione finale usa prefilter testuale conservativo prima della redazione completa dell'erase, keyring locale per riga e lookup HMAC indicizzato, senza scaricare pagine di payload o aggiungere richieste HTTP degli scanner. Zero letture sequenziali nuove dal client. Il benchmark 2.000 payload della suite rimane con una sola RPC; il risultato finale è riportato nell'esito della PR, senza estrapolare p95/CPU/WAL gestiti.

Lock condiviso per gli ingressi, esclusivo per erase/publish: in collisione breve possono fallire PT409 anche scritture concorrenti non personali. Non sono aggiunti retry, frequenze o batch agli scanner; il caller riceve non-successo e usa il proprio normale percorso di errore/ripresa. Lo statement resta atomico. Carico, durata bulk, numero versioni chiave e crescita delle tombstone vanno misurati sul runtime gestito A5; nessun aumento del timeout per nascondere il costo. Una indisponibilità Vault blocca ingressi eBay fino al ripristino, anziché accettare dati non controllati.

A1 è chiuso per gli ingressi canonici e formati verificati con il normale ruolo writer. Non è una protezione contro postgres/DDL che può rimuovere trigger, provenance fraudolenta, alias sconosciuti o ripristino di un backup che perde le tombstone (A3). Non è un rilascio: A2 chiavi/log/backup reali, A3 riconciliazione DR, A4 worker/monitor indipendenti e A5 runtime/trigger/capacità restano NO-GO. Non si implementano né selezionano AWS/Google o altri servizi in questa chiusura.

Sequenza futura, soggetta a nuova autorizzazione: chiudere A2–A5; revisione SQL/ACL e fixture gestita; tutte e tre le proposte atomiche con switch false; binding Vault e check preparati dall'operatore senza stampare chiavi; prove staging positive/negative; writer/publisher aggiornati e drenaggio; attivazione ingress guard prima di qualsiasi nuova erase (remember la richiede); poi recupero/monitor e webhook soltanto con tutti i gate verdi. In rollback conservare tombstone, candidate marker, source history e tutte le versioni chiave necessarie. Non disabilitare suppression come rollback e non ripristinare un backup pre-tombstone online. Nessuna di queste operazioni remote è stata eseguita.
