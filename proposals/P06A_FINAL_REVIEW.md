# P0.6A — unica proposta finale: Supabase, Vercel, GitHub

**17 ottobre 2026, Europe/Rome. Draft PR #430. Nessuna migrazione, configurazione, attivazione o deployment Production eseguito.** Questa proposta sostituisce il percorso AWS del commit `7b338123`: SDK, journal DynamoDB, stack, Lambda, SNS, bundle dedicato ed emulatore sono rimossi. Nessun account, servizio, abbonamento o documento aggiuntivo richiesto. I rapporti precedenti restano evidenze storiche; il piano operativo corrente è soltanto questo.

## Proposta minima implementata

1. **Webhook Vercel esistente:** verifica firma prima di qualsiasi scrittura. Una sola RPC Supabase prepara i token HMAC e registra la notifica nella inbox privata, nella stessa transazione con commit sincrono. Solo dopo conferma del commit restituisce202. Errore DB/risposta incerta => non-successo. Se il worker è spento o il suo heartbeat è più vecchio di15 minuti, la notifica viene comunque salvata ma l'endpoint risponde503: nessun successo prematuro e l'obbligo può ripartire senza altra consegna eBay. Un duplicato già completato non richiede worker attivo. GET challenge e firma eBay non cambiano.
2. **Supabase esistente:** la tabella notifications è l'unico registro autorevole, senza una seconda coda/journal, contatori esterni o cursor di restore. Le nuove notifiche conservano token HMAC, digest e ID delle fonti; niente username/userId/EIAS in chiaro o ciphertext del payload originale. Resta la compatibilità con le inbox legacy cifrate. Cancellazione, tombstone, marker candidate, outbox dei ricalcoli e avanzamento di stato sono transazionali. Un candidato già scrubbed non fa perdere i price point collegati.
3. **Worker Vercel già presente:** endpoint protetto con token dedicato, disabilitato per default, client DB con ruolo worker ristretto. Una chiamata usa al massimo45 secondi e quattro claim; nessun retry HTTP immediato. Dopo otto errori, il job resta visibile/allarmato e viene riprovato al massimo ogni sei ore, senza reset manuale degli attempts né dipendere dai retry eBay. Lease e fencing proteggono duplicati/concorrenza. L'idle richiede una sola RPC, senza letture delle tabelle mercato.
4. **Controllo GitHub leggero:** esempio inattivo del workflow ogni cinque minuti, con due job senza dipendenza reciproca: una chiamata al worker e una lettura aggregata diretta Supabase con ruolo monitor. Non legge seller, token, chiavi Vault o tabelle mercato. Errori di Vercel/DB/auth, heartbeat fermo, obblighi oltre15 minuti e retry esauriti producono check fallito. Nessun endpoint di allarme aggiuntivo: usare le notifiche native di fallimento Actions con operatore iscritto e consegna verificata prima dell'attivazione. Gli allarmi DB non vengono marcati come consegnati da una chiamata fittizia; si risolvono quando l'obbligo viene completato.

Il workflow resta `ops/ebay-erasure/monitor-workflow.yml.example`, fuori dalle workflow attive. Non è stata cambiata alcuna frequenza/batch scanner, cron esistente, Market Method, Release, Catalogo o Collezione. Le condizioni di deployment della branch continuano a impedire Preview automatiche.

Contratto ufficiale [eBay](https://developer.ebay.com/develop/guides/sell/marketplace-user-account-deletion):202 è ammesso; la riconsegna del provider è limitata e non è una strategia di completamento. La nostra firma viene controllata prima della persistenza/ACK. Non sono inviate notifiche simulate o retry a Production.

## Minimizzazione e prezzi

Si conserva l'inventario aggregato già rilevato senza identificativi reali:1.113 candidate e370 offer con seller_fingerprint; payload aggregati con campi seller e alcune note libere. Snapshot non segreto in `scripts/fixtures/p06a-final-managed-inventory.json`. Non si dichiara che ogni testo libero sia stato classificato esaustivamente: titolo/item ID/URL di listing restano provenienza potenzialmente correlabile e coperta dal percorso storico di cancellazione.

La proposta SQL mantiene HMAC autenticato di uguaglianza esatta più token normalizzati di tutte le parti d'identità A1. Conserva le distinzioni originali case/prefisso/compositi per deduplicazione e ricerca delle cancellazioni, senza memorizzare username nei nuovi ingressi minimizzati. MAC contraffatti sono respinti; i vecchi writer passano dai trigger DB. Payload libero e review_notes eliminati, conservando country/marketplace validati e provenienza numerica del trend, comprese le stringhe numeriche effettivamente lette dal codice.

**Prova prima/dopo HMAC:** stesso calcolo canonico di pubblicazione MV/SOLD/ASK, esclusi timestamp; stessa mediana ASK pubblica EUR20 e tre seller; trend e country invariati. I prezzi numerici non personali restano dopo la cancellazione. Non si promette che il ricalcolo successivo alla rimozione di evidenza personale restituisca sempre lo stesso prezzo: le formule restano quelle correnti.

A1 ingress-suppression, lock, tombstone e fence restano invariati. L'estensione riconosce HMAC senza cambiare il ramo raw; il solo SQL recovery precedente cambia il backoff per non abbandonare i job esauriti. L'attivazione della minimizzazione/backfill resta transazionale e separata dalla definizione degli oggetti.

## Garanzie e rischi indispensabili, senza nuovi servizi

| Caso | Garanzia / limite |
| --- | --- |
| Timeout, crash Vercel, risposta persa dopo commit, riavvio worker | Inbox e outbox restano nel DB; ripresa idempotente automatica, anche senza nuove consegne eBay |
| Duplicati, fonti inattive/storiche, vecchi writer e ricalcoli concorrenti | A1 persistente e token HMAC, shared/exclusive lock, marker relazionali e fencing; test SQL/PostgREST |
| Backup che contiene inbox e tombstone | Restore conserva quegli obblighi; chiavi identiche e quarantena esterna sono prerequisiti, ricalcoli pendenti riprendibili |
| Perdita del DB o restore a un backup precedente a una notifica accettata | **Rischio aperto reale:** l'unico registro può perdere notifica/tombstone insieme ai dati. Il test pg_restore dimostra questa perdita. Nessuna promessa di RPO0 o replay indipendente. Non viene nascosta con un export periodico o un witness in memoria |
| Restore di dati storici | Obbligatoria quarantena fuori DB prima del restore, scanner/publisher drenati; non riaprire finché gli obblighi/tombstone correnti non sono disponibili e riscrub/ricalcoli verificati. Non ricostruibili => mantenere quarantena, non far riapparire dati personali. Minimizzazione non rende automaticamente anonimi i backup storici |
| Vercel/worker fermo, DB/auth in errore | Il monitor GitHub diretto può rilevarli se viene eseguito; ricezione delle notifiche native va provata |
| GitHub fermo/schedule perso | **Rischio aperto:** worker e monitor condividono il trigger GitHub; non c'è dead-man esterno né SLA. GitHub può ritardare/scartare schedule e disabilitarle dopo60 giorni senza attività. L'heartbeat evita nuovi ACK riusciti quando il worker è fermo, ma da solo non notifica un operatore |

La richiesta di non introdurre infrastrutture è rispettata. Non viene dichiarata eliminata una perdita totale del registro né una sorveglianza indipendente da tutti i provider. Questi limiti richiedono un'accettazione operativa esplicita prima del GO; se è indispensabile RPO0 anche dopo perdita DB, questa soluzione minima non soddisfa quel requisito e non va pubblicata fingendo il contrario. Nessuna ulteriore architettura viene progettata in questa PR.

## Privilegi, chiavi e log

Ingress può eseguire soltanto la RPC di accettazione; worker accede a ledger/evidenze/output necessari con grant oggetto/colonna e BYPASSRLS per le tabelle private esistenti; monitor legge una sola salute aggregata. Nessuna policy RLS esistente modificata e nessun fallback service_role nei nuovi client. JWT dedicati con scadenza, token endpoint Vercel e keyring vengono configurati solo nel secret store esistente, mai in chat/log/Git. Ingress e monitor non possono cancellare direttamente dati mercato.

Il pepper HMAC resta in Vault, con chiave di uguaglianza fissata per conservare le partizioni. Rotazione wrapping/JWT/credenziali distinta dal cambio del pepper; conservare le versioni necessarie a inbox legacy, tombstone, ricerca e backup. Niente rimozione di chiavi/token prima che sia impossibile una reintroduzione storica. Receipt token-only completate perdono il payload sealed al momento dell'erase; metadati/idempotenza e tombstone non hanno un purge automatico. Retention e backup devono rispettare il perimetro di reimportazione ammesso.

**A2 ancora da verificare nel gestito:** grant Vault storici di service_role, owner autorizzato per revoche e consumatori legittimi. Usare solo `p06a-runtime-vault-revocations.sql` dopo audit/autorità effettiva; non installare la precedente capability export di `p06a-vault-backup-privileges.sql`. La revoca da non-owner può non rimuovere i grant dell'owner. Servono inoltre canary sui log gateway/provider, scadenza/rotazione JWT e recuperabilità del pepper. Nessuna credenziale sostituita per ipotesi.

**PGRST303 resta separato:** diagnostica con solo codice/fase/durata/request ID, niente messaggio DB o Authorization; questa PR non dimostra la causa intermittente Production.

## Verifica e costo

Esiti locali finali: **PASS, exit0**, `pnpm verify`, Typecheck separato, `ebay:erasure:postgres:test`, `ebay:erasure:e2e:test`, `ebay:erasure:final:test`; `git diff --check` pulito. L'ultimo include PostgreSQL17.6/PostgREST13.0.7 reali, firma sintetica, ruoli scoped, transazione inbox, errore insert, risposta persa, duplicati, worker stale, ripresa dopo esaurimento senza reset, privacy canary, parità prezzi e restore con prova esplicita della finestra persa. Nessun emulatore AWS, installazione Moto o build Lambda in CI. Il test A1 originale e controllo negativo non sono indeboliti.

Le prove isolate non certificano Vault/ACL/root key, versione gateway e tutti i trigger gestiti. Restano da eseguire controlli autorizzati del gestito, specialmente INSERT di un nuovo market signal con enrollment, notifiche Actions e capacità sulle dimensioni effettive. Gli ultimi risultati CI devono riferirsi al nuovo SHA, non al precedente commit AWS. Il vecchio test capsula rimane un esperimento storico eseguibile separatamente, non il percorso runtime né una prova di durabilità indipendente attuale.

**Costo fisso di nuovi servizi: USD0.** Nessun abbonamento/upgrade/PITR/risorsa AWS. Con controllo ogni5 minuti:288 chiamate worker/giorno, circa8.640/mese, più altrettante RPC monitor dirette. Idle worker una RPC; sotto lavoro max4 claim/45s per invocazione. Durata Vercel indicativa:1s medio ~2,4 ore-funzione/mese; a45s sempre ~108 ore-funzione/mese. Moltiplicare per la memoria effettiva del progetto per ottenere GB-ore; non si presume il limite512MiB della Lambda rimossa. CPU, memoria reale e limiti del piano vanno verificati prima di attivare. Non è promessa di costo incrementale totale zero: quote e fatturazione Vercel/Supabase esistenti vanno controllate prima di attivare. GitHub runner standard è gratuito per repository pubblico; le schedule non sono garantite. Non usare un loop o un aumento delle scansioni per completare cancellazioni.

## Sequenza unica di rilascio

1. Review della stessa Draft PR, diff semplificato e CI sullo SHA esatto; nessuna Preview o attivazione. Main/Production precedente non viene modificata.
2. Concordare esplicitamente i limiti sopra: perdita registro/backup e assenza dead-man indipendente da GitHub. Verificare backup esistenti, chiave recuperabile e procedura di quarantena; non attivare PITR a pagamento. Se l'obbligo richiede protezioni non disponibili, STOP/NO-GO.
3. Con approvazione distinta per l'ambiente, verificare schema/trigger/ACL/Vault e credenziali scoped, log canary e prezzi. Audit/revoche Vault come autorità effettiva. Nessun accesso Production implicito nel test locale.
4. Solo dopo autorizzazione Production: quarantena e drain writer; applicare nella stessa transazione nell'ordine `p06a-ebay-erasure.sql`, `p06a-recovery-and-fence.sql`, `p06a-ingress-suppression.sql`, `p06a-minimization-and-token-recovery.sql`; provisioning chiavi/guard secondo A1 via canale protetto. SQL revoche separato con audit; nessuna capability export. Non applicare un sottoinsieme.
5. Pubblicare app con nuovo webhook inizialmente disabilitato e fencing compatibile; configurare ruoli JWT, token recovery e flag senza log. Abilitare minimizzazione/backfill con `activate-minimization.review.sql` sotto lock e confrontare output prezzi. Ogni fallimento mantiene quarantena.
6. Con autorizzazione all'attivazione, installare l'esempio workflow esistente come workflow attiva, abilitare variabile repo/worker e verificare invocazione reale, monitor DB e ricezione di un fallimento sintetico senza webhook live. Solo dopo heartbeat reale recente abilitare webhook202 e riaprire ingressi. Nessuna modifica delle frequenze scanner.
7. Osservare pendenze/età/errori/fence e quote. Rollback: disabilitare nuovi ACK e mantenere worker, inbox, tombstone, chiavi e outbox; tornare soltanto a codice compatibile con suppression/fence. Mai cancellare schema/obblighi, disabilitare guard o ripristinare un backup sopra il registro corrente senza averne preservato lo stato. Nessun purge automatico.

**Esito:** implementazione minima candidata alla review, non GO Production. Restano i limiti espliciti di durabilità/schedule e le verifiche operative gestite; non si dichiara A2–A5 chiuso per il solo PASS locale.
