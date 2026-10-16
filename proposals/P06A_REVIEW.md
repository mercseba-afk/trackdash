# P0.6A — rapporto tecnico per revisione Draft

> Aggiornamento A2/A3: [P06A_A23_REVIEW.md](P06A_A23_REVIEW.md), configurazioni effettive Vault/logging e prove sintetiche di restore. A2/A3 restano **aperti**, rilascio **NO-GO**. Nessuna modifica alla logica A1 o a Production.

> Chiusura locale A1: `P06A_A1_REVIEW.md` aggiorna SQL, enforcement ingressi, chiavi private e matrice di regressione. A2–A5 e il NO-GO complessivo restano. Le descrizioni storiche di sole due proposte/sei tabelle non includono la terza proposta A1, mai applicata in Production.

> Preflight 16/10: **NO-GO rilascio**. Vedi `P06A_PREFLIGHT.md` per confronto schema gestito, riproduzione della reintroduzione da ingestion, architettura worker/monitor e rollout/rollback. La modalità monitor attuale non è un dominio indipendente. Le verifiche funzionali sotto non chiudono quei gate.

Base ricontrollata: GitHub main e Vercel Production READY `f8e27c0f72458a4daeac7e98323981fb0cfeb4ce`. Branch `fix/p06a-ebay-erasure-recovery-20261016`, ripresa dalla patch locale precedente. P0.6B/PR #429 resta indipendente. Nessuna modifica a Production, credenziali esistenti, scanner, cron, Release o formule MV/SOLD/ASK. Questo codice non è attivato e non certifica il completamento delle notifiche storiche del 16 ottobre.

## SQL proposto, non applicato

Due parti da registrare in futuro come un'unica migrazione atomica:

- `p06a-ebay-erasure.sql`: inbox notifiche, dipendenze dei ricalcoli, cancellazione atomica delle cinque tabelle già individuate nell'indagine.
- `p06a-recovery-and-fence.sql`: stato del fencing, allarmi, heartbeat, recupero persistente e pubblicazione protetta.

Sei nuove tabelle nello schema privato `trackdash_erasure`: notifications, recomputes, notification_work, fence, alerts, heartbeat. RLS attiva su tutte, nessun accesso anon/authenticated e nessuna policy RLS aggiunta o modificata sulle tabelle esistenti. Le RPC sono SECURITY INVOKER, search_path fissato, EXECUTE limitato a service_role. I privilegi sulle nuove tabelle sono espliciti, non grant generali su public. Tre nuovi trigger impediscono scritture canoniche non protette su market_release_signals/monthly_signals/ask_snapshots quando il guard è esplicitamente abilitato. Il guard nasce disabilitato. Nessuna funzione di scheduler/cron viene installata.

## Comportamento

La verifica della firma eBay rimane invariata e precede ogni accesso al DB. L'identità della notifica usa SHA-256 della notification ID; il confronto del payload immutabile usa HMAC versionato. Data/numero del tentativo non cambiano identità. L'inbox salva identificativi minimi cifrati AES-256-GCM, IV casuale, AAD legata alla notifica e chiave versionata esterna al DB; chiavi di cifratura e digest sono derivate con domini distinti. Sono dati personali cifrati, non anonimi. Nessun segreto è hardcoded o configurato in Production da questa PR.

La registrazione è persistente prima della cancellazione. Le fonti sono l'unione completa delle policy eBay e degli slug storici ebay_%, senza filtro attivo. Candidate, offer, price point dipendenti, JSON aggregati e statistiche mensili vengono trattati nella stessa transazione dell'outbox ricalcoli. Un errore prima del commit ripristina tutto: il retry non ricostruisce il legame candidate/price point da righe già scrubbed. Gli importi, le date, le quantità aggregate e i riferimenti non personali restano conservati. La precedente invalidazione della qualità dei price point senza seller rimane, senza cambiare formule o soglie.

Il ciphertext viene eliminato nello stesso commit che registra la cancellazione e i ricalcoli pendenti. Questi ultimi si riprendono senza dati personali. I contatori originali della cancellazione restano nel registro: un retry a zero non è una nuova prova di identità/completamento storico.

Il recupero reclama un job con lease/token persistenti, un job e massimo quattro ricalcoli per tick. Backoff persistente da 30s, crescita x3 fino a 6h, otto tentativi senza progresso; il progresso verificato sui ricalcoli azzera il contatore dei fallimenti consecutivi. Un crash dopo il claim non perde il job: scadenza del lease e next_attempt_at lo rendono riprendibile. Non servono altri retry eBay dopo l'inbox commit. Gli esauriti restano persistenti, non completed.

Lo sweep registra allarmi overdue (>15 minuti), exhausted e heartbeat del worker assente (>15 minuti). Consegna con lease e acknowledgment solo dopo successo del sink; massimo 12 tentativi automatici di invio, almeno 5 minuti tra tentativi, poi allarme ancora visibile nella salute non sana. Il monitor indipendente restituisce 503 per pendenze critiche o mancata consegna: anche l'indisponibilità del sink/worker richiede rilevazione esterna. Nuovi episodi di downtime producono nuovi ID allarme, evitando dedupliche erronee del destinatario. Gli allarmi risolti conservano distinzione tra risoluzione e consegna.

Il webhook restituisce 204 solo dopo completed; pending/error restano non-successo (503 con Retry-After per il recupero). Nessun 202 anticipato. L'endpoint recovery/monitor è POST autenticato con segreto dedicato e disabilitato per default. Il modulo non avvia timer o subscriber. Non è stato attivato alcun processo periodico: la futura attivazione di due invocazioni durevoli indipendenti, worker e monitor, è una condizione di rilascio, non un risultato già operativo.

## Concorrenza con il mercato

La pubblicazione ordinaria usa lo stesso repository e lo stesso mapping, bufferizzando gli upsert. Prima delle letture registra la generazione della Release/condition e la ricontrolla nella pubblicazione atomica. La cancellazione e la pubblicazione condividono un breve lock transazionale. Un ricalcolo iniziato prima della cancellazione non può sovrascrivere quello nuovo, neppure dopo la conclusione della notifica; notifiche sovrapposte invalidano claim obsoleti tramite generazione/token/lease. Una cancellazione senza dati relativi non invalida ricalcoli non coinvolti.

Il rifiuto applicativo usa SQLSTATE PT409/HTTP 409. Nella fixture PostgREST, l'uso iniziale di 40001 non terminava il caso obsoleto in modo utile; PT409 produce il rifiuto deterministico senza affidarsi al percorso di retry delle serialization failure. Nessun retry applicativo aggiunto agli scanner. Prima del rilascio bisogna inventariare eventuali writer esterni a questo repository: con il guard attivo, scritture non protette falliscono anziché pubblicare dati obsoleti.

## Verifiche

- Firma/challenge/parser/redazione e diagnostica esistenti; unit test di cifratura, binding AAD, tamper, rotazione chiavi, chiavi mancanti, deadline, budget, route disabilitata e rifiuto non autenticato prima del DB.
- PostgreSQL 17.6: rollback in ogni fase e prima dell'outbox commit, timeout, fonti inattive, dipendenza candidate/point, duplicati, claim scaduti, notifiche sovrapposte, rollback della pubblicazione invalida e ACL private.
- PostgREST 13.0.7 reale e SDK installato: DDL delle tabelle di mercato, FK/check/indici e trigger reali caricati dai file del repository, senza history di migrazione o dati Production. Auth/conversazioni sono dipendenze sintetiche minime: non è un clone integrale di Supabase Production né una prova di compatibilità con ogni estensione/runtime gestito.
- Percorso completo firmato con chiave sintetica e OAuth/public-key mock: webhook -> PostgREST -> cancellazione/ricalcolo -> 204; replay e payload alterato respinto prima del DB.
- Ripresa autonoma da received, perdita della risposta dopo inbox/erase commit, crash dopo claim, retry senza nuove consegne eBay, errori SQL in tutte le fasi, timeout imposto da PostgREST (100ms nel test), duplicati concorrenti e vero ricalcolo ordinario sospeso prima della pubblicazione.
- Otto fallimenti dei ricalcoli -> stato persistente + exhausted; sink in errore -> allarme non ack; successivo invio -> ack. Monitor heartbeat, risoluzione e nuovo episodio; tick idle da una sola RPC.
- Controllo canary su diagnostica applicativa, messaggi di allarme e stdout/stderr dei container: nessun identificativo o chiave sintetica esposto. Non costituisce audit dei log gestiti Production: configurazione di logging SQL/HTTP/APM, campionamento body e retention devono essere verificati prima dell'attivazione.
- pnpm verify, Typecheck, diff check e matrice HTTP sono i gate locali. La CI della Draft esegue anche PostgreSQL/PostgREST in container senza rete esterna, immagini fissate per digest. La Preview è disabilitata solo per questa branch.

## PGRST303 separato

La fixture rifiuta un JWT scaduto con 401/PGRST303 e conserva il codice diagnostico in una risposta 401 iniettata, senza stampare il messaggio. Questo dimostra trattamento e rilevazione dell'errore, non la causa dell'incidente Production: il precedente errore intermittente con chiave secret, seguito da richieste riuscite, non dimostra che la credenziale stabile fosse scaduta. Nessuna rotazione, nuovo grant o presunta correzione di quella causa.

## Runtime e costi

Budget richiesta 45s, HTTP/RPC 12s, statement SQL 10s, lock timeout 250ms, lease 90s. SDK retries disabilitati nel percorso di cancellazione e pubblicazione. Il monitor/worker a vuoto usa una sola RPC su metadati e non legge candidate/evidenze. Il percorso erase trasferisce al DB gli identificativi minimi, non scarica più intere pagine di JSON. Nel campione sintetico con 2.000 payload storici, erase è una RPC e circa 0,4s wall, con risposta 205 byte; include l'overhead del trasporto locale Docker e non è una stima di latency/CPU Production.

Rimangono scansioni complete dei payload delle fonti pertinenti, ricorsione JSON, WAL e trigger; a volumi maggiori l'atomicità può superare il budget e richiedere un manifest/chunking durevole prima dello scrub. Nessun timeout esteso per nascondere questo rischio. Servono misure su clone rappresentativo prima del rilascio. L'indagine precedente aveva osservato 9 letture logiche sequenziali e 1.623 righe trasferite nel vecchio percorso: non è un benchmark attuale della Production.

La frequenza futura di worker/monitor non è configurata qui. A titolo di capacità, un controllo ogni 5 minuti significa 8.640 invocazioni al mese per ciascun chiamante: non chiamarlo gratuito né approvare il costo senza tariffe/budget aggiornati. Il consumo idle è su ledger, non su mercato; l'attivazione dovrà scegliere frequenza e SLA appropriati, allarmi indipendenti e limiti di concorrenza (inizialmente uno). Inbox/allarmi crescono con notifiche e incidenti: retention/purge rimangono operazioni da approvare e non devono eliminare obblighi incompleti.

## Sequenza sicura di rilascio — richiede nuova autorizzazione

1. Revisionare SQL/diff; confrontare su clone isolato i DDL/ACL/trigger effettivi e la versione PostgREST gestita. Verificare logging senza bind/body personali e capacità su backlog realistico. Nessun replay o test di cancellazione in Production.
2. Approvare separatamente gestione chiavi, retention/backups, destinatario allarmi, monitor esterno e scheduler durevole. Le variabili nuove sono solo previste: EBAY_ERASURE_KEYS, EBAY_ERASURE_CURRENT_KEY, EBAY_ERASURE_RECOVERY_TOKEN, EBAY_ERASURE_ALERT_URL/TOKEN e tre flag distinti. Le chiavi vecchie vanno mantenute finché servono per inbox e idempotenza; non promettere cancellazione crittografica delle copie di backup con il solo sealed=NULL.
3. Dopo approvazione esplicita, registrare la migrazione con la CLI normale e applicare entrambe le parti in una transazione, guard disabilitato. Nessun filename numerato inventato: la CLI locale nota non inizializza il proprio percorso read-only e questa PR mantiene SQL in proposals, fuori dall'applicazione automatica.
4. Distribuire il codice con EBAY_ERASURE_FENCING_ENABLED=true e webhook/worker ancora disabilitati. Attendere il termine di tutte le vecchie invocazioni; verificare il fencing, poi abilitare il guard DB con operazione specificamente approvata. Un writer non aggiornato deve fallire chiuso, non ottenere bypass.
5. Attivare soltanto dopo nuova approvazione il worker dedicato (EBAY_ERASURE_WORKER_ENABLED) e il monitor indipendente, con sink provato in staging e verifica di ricezione autorizzata. Nessuna dipendenza da retry eBay, scanner o Health Watch. La mancata esecuzione del monitor stesso deve essere rilevata dal servizio esterno.
6. Abilitare EBAY_ERASURE_ENABLED soltanto dopo prove operative di heartbeat/alert e disponibilità delle chiavi; osservare le notifiche reali senza inviarne di simulate. 204 continua a significare completed.
7. In rollback disabilitare nuove accettazioni, conservare inbox/chiavi/outbox e completamento delle pendenze. Non ripristinare il vecchio erase sequenziale o disabilitare il guard con lavori in corso. Redrive di exhausted soltanto dopo correzione della causa, autorizzato e auditato, sulla stessa inbox, senza notifiche simulate verso eBay.

## Limiti espliciti

Il recupero autonomo parte dall'inbox commit. Prima di quel confine, indisponibilità del database/chiavi produce non-successo: nessun sistema può ricostruire identificativi mai persistiti. Il monitor esterno deve segnalare indisponibilità e fallimenti di accettazione; un blackout che impedisca ogni persistenza per l'intera finestra del provider richiede riconciliazione con il provider o un ulteriore ingresso durevole indipendente, da progettare/approvare. Non dichiarare una garanzia assoluta di zero perdita prima dell'accettazione.

Non è possibile identificare retroattivamente la notifica del timeout del 16 ottobre né dimostrare che successivi zero-count la riguardassero. Non vengono riparati dati storici senza evidenza dell'identità. Resta da verificare il rischio di reintroduzione da ingestion già in volo/copie o sistemi esterni: questa PR non cambia gli scanner e non introduce una lista permanente di identificativi personali per suppression. Il rilascio richiede inventario dei writer e una procedura di quiescenza/coordinamento appropriata; la concorrenza dei ricalcoli canonici è invece coperta dai test.
