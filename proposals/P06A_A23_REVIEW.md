> **Proposta corrente semplificata:** [P06A_FINAL_REVIEW.md](P06A_FINAL_REVIEW.md). Solo Supabase, Vercel e GitHub; inbox transazionale e recupero limitato, senza infrastruttura AWS. Le sezioni sotto sono checkpoint storici, non il piano di rilascio. Nessuna modifica Production.

# P0.6A — A2/A3: chiavi, backup e recupero dopo restore

**16 ottobre 2026 — NO-GO. A2 e A3 rimangono aperti.** Base PR #430 `96380255bf7b4fb4c555d20a4cca38fd42601593`. A1 resta invariato; questi test non sostituiscono la prova delle configurazioni operative mancanti. Nessuna migrazione, chiave, servizio, scheduler o deployment è stato applicato/attivato.

## Configurazioni effettive, lette senza segreti

Riletti master, checkpoint, AGENTS e preflight; main/Production di riferimento `f8e27c0f72458a4daeac7e98323981fb0cfeb4ce`. Ispezione read-only di cataloghi/pg_settings del progetto gestito `piwogtdkfozbiakyjnvk`, eu-west-1, ACTIVE_HEALTHY, PostgreSQL build 17.6.1.166. Snapshot senza righe applicative: `scripts/fixtures/p06a-managed-a23-metadata.json`. Non sono stati letti nomi, valori, ciphertext, ID o conteggi dei segreti Vault.

| Controllo | Evidenza effettiva | Conseguenza |
| --- | --- | --- |
| Vault | supabase_vault 0.3.1, pgcrypto 1.3; tabella vault.secrets e vista vault.decrypted_secrets, owner supabase_admin, RLS disattiva | Cifratura disponibile; non prova portabilità della root key o ripristino in altro progetto |
| Accesso runtime | service_role ha USAGE Vault, SELECT e DELETE su entrambe; EXECUTE create_secret, update_secret e helper decrypt | **Blocco A2 concreto:** la chiave di suppression non è isolata dal ruolo runtime quanto richiesto. Non dimostra accessibilità Data API né una fuga di dati |
| Altri ruoli | anon/authenticated/trackdash_app senza USAGE e SELECT/DELETE Vault | Nessuna proposta di ampliare i loro privilegi |
| Autorità di revoca | grantor supabase_admin; postgres non superuser e non suo membro | Non presumere che un REVOKE eseguito da postgres rimuova grant di altro grantor; serve owner/amministratore autorizzato dal provider e verifica effettiva |
| Logging | log_statement=ddl, log_min_error_statement=error; log_parameter_max_length=-1, on_error=0; durata/connessioni/disconnessioni off, pgaudit.log=none/parameter=off; nessun pending_restart | Non inserire segreti in SQL DDL/literal o comandi CLI. on_error=0 non redige literal nello statement fallito. Parametri bind e log effettivi devono essere verificati nel percorso gestito |
| Override ruoli | log_statement=none per supabase_admin/auth_admin/storage_admin | Non garantisce la redazione di gateway, APM, dashboard o log di un altro ruolo |
| WAL | archive_mode=on, wal_level=logical; archiver 4392 archivi, 0 errori, ultimo 2026-10-16 19:00:04 UTC | Non prova abbonamento PITR, inventario, RPO, retention o restore riuscito |
| Backup | Tool metadata disponibili non espongono inventario backup, retention, piano PITR o root-key escrow | **A3 aperto:** richiedere evidenza non segreta del pannello/provider e una prova autorizzata su progetto isolato |
| P0.6A gestita | schema trackdash_erasure assente | Nessuna configurazione proposta è già attiva |

Non abbiamo attestazione della retention dei log, body/header capture del gateway/APM o delle policy di accesso ai backup. PGRST303 resta separato: raccogliere solo codice, fase, durata e request ID; confrontare scadenza/issuer/algoritmo e reload schema su fixture. Non cambiare credenziali per ipotesi e non registrare JWT/header/payload.

## A2 — modello delle chiavi e proposta minima

Tre domini separati: chiavi inbox AES-256-GCM/idempotenza versionate; pepper HMAC di suppression in Vault; chiave archivio AES-256-GCM indipendente dal DB e dal suo restore. UUID/versione/check HMAC nel DB non sono il segreto. Il pepper non va cambiato sotto la stessa versione: A1 lo rifiuta. Nessuna chiave generata per Production.

`p06a-vault-backup-privileges.sql` è **proposta non applicata**, dopo le tre proposte A1. Revoca soltanto i privilegi runtime Vault osservati (SELECT/DELETE sui due oggetti e EXECUTE sulle tre funzioni), conserva USAGE, non cambia RLS. Prima inventariare consumatori legittimi di service_role; se esistono, separarli con capability ristrette senza ricreare un lettore generale. Eseguire come autorità effettiva del grantor e verificare has_*_privilege/membership/default ACL dopo ogni fase. Il test replica gli ACL osservati su oggetti sintetici; non simula i poteri dell'owner gestito. La compatibilità con trigger/DEFINER A1 è verificata nel laboratorio, non ancora sul Vault gestito.

La proposta aggiunge un ruolo NOLOGIN/NOINHERIT/NOBYPASSRLS senza membri e una sola funzione privata SECURITY DEFINER STABLE con search_path fisso. Proiezione coerente delle 11 tabelle private: ciphertext incompleti, token e dipendenze; nessuna lettura Vault o payload di mercato. Runtime e ruoli pubblici non possono invocarla. Nessun accesso diretto, write, purge o restore concesso al ruolo export. La futura identità export dovrà poter assumere solo questa capability; provisioning e default ACL vanno revisionati prima dell'uso.

Provisioning futuro: canale segreti approvato, parametri bind, nessun literal DDL, output redatto; verificare i log reali con canary sintetica prima di immettere chiavi. Root/key escrow separato, accesso dual-control con audit, accesso decrypt limitato al processo autorizzato, archivio append-only e credenziali distinte dal runtime. Non conservare recovery key e backup sotto la stessa possibilità di cancellazione/rollback.

Rotazione: nuova versione prima della selezione; durante la transizione mantenere tutte le versioni richieste per cercare gli identificativi e leggere inbox/archivi. A1 richiede compatibilità del keyring completo; non riscrivere token o rimuovere vecchie versioni senza backfill e verifica su tutte le copie storiche. Rewrap archivio verificato nel test, con head nuovo collegato al precedente; mantenere la vecchia chiave finché esistono copie cifrate con essa. Revoca emergenziale: quarantena ingressi, mantenimento di inbox/tombstone, ripristino keyring validato; non disattivare suppression né cambiare key_check per aggirare un errore.

Retention proposta: payload inbox incompleto mai eliminato; payload completato già eliminato da A1. Tombstone e chiavi necessarie senza TTL automatico finché una copia/importazione storica può reintrodurre identità; revisione periodica documentata (proposta 90 giorni), non scadenza automatica. Notifiche/receipt conservate almeno per finestre retry + restore + tail journal, con policy approvata e inventario delle copie. Nessuna purge proposta da eseguire ora. Includere backup e log nella policy: cancellare solo il DB corrente non cancella gli identificativi dai backup storici.

## A3 — prova ripetibile in staging sintetico

`pnpm ebay:erasure:restore:test`, Docker locale network=none senza porte pubblicate, PostgreSQL 17.6/PostgREST 13.0.7 pin digest. Dati artificiali, nessun export Production. Il test usa un vero pg_dump/pg_restore del database con schema realistico, RPC HTTP reali e worker/ricalcoli applicativi esistenti. La facciata Vault è sintetica: non certifica root-key export/recovery di supabase_vault.

1. Snapshot DB prima di tre cancellazioni. Successivamente si producono stati received/erased/completed, dipendenze e tombstone; checkpoint atomico delle 11 tabelle, poi capsula autenticata con progetto, hash schema, versione, parent/head e key ID. Pepper escluso dal dump della facciata Vault; escrow solo in memoria sintetica.
2. Il restore reale riporta gli identificativi sintetici e perde le nuove notifiche: quarantena obbligatoria. Checkpoint vecchio/troncato/alterato, witness assente, chiave assente/errata devono fallire. La prova registra anche una quarta notifica dopo il checkpoint e ne dimostra esplicitamente l’assenza dopo il restore di quella copia: il gap resta un gate aperto, non un test di durabilità superato. Il witness fidato è conservato separatamente in memoria di test: **non è un servizio durevole implementato**.
3. Errore FK dopo gli inserimenti e lock concorrente sono testati senza stato parziale. Chiave suppression assente o errata fa rollback dell'intera riconciliazione. Recuperata la chiave corretta, union di tombstone/identità candidate/fonti storiche e notifiche; reset lease, invalidazione generazioni/fence e riapertura conservativa delle dipendenze. Notifiche completate senza payload plaintext riescono comunque a rimuovere i dati riapparsi.
4. Re-scrub attraverso gli stessi trigger A1 sulle cinque tabelle; riaccodamento delle Release/condition ripristinate, inclusi riferimenti non più nel manifest più recente. Worker erasure e consumer canonico devono completare, senza retry eBay. Claim precedente respinto. Import ripetuto riapre lavoro e conserva gli obblighi.
5. Gate sintetico: witness verificato, guard attivo, zero notifiche incomplete, zero ricalcoli privati/canonici pendenti e nessun allarme irrisolto non consegnato. Prezzi non personali conservati; nessuna formula modificata. Log applicativi/PostgREST/PostgreSQL catturati controllati contro canary personali/chiavi. Non è prova della configurazione log del provider.

`p06-local-snapshot.mjs` e `p06-restore-lab.mjs` accettano solo database p06r_* nel container locale isolato, senza connessioni remote. Non sono comandi operativi Production. Il gate di quarantena del test non configura rete/routing reali. Le failure artificiali non riducono le asserzioni A1.

## Limite essenziale: ultimo checkpoint ≠ tutte le notifiche

Un checkpoint periodico perde gli obblighi registrati dopo il checkpoint quando il DB viene riportato indietro. Nessuna combinazione di snapshot e HMAC può ricostruire un evento mai archiviato. Il witness deve attestare un head indipendente aggiornato, non essere derivato dal file che si sta verificando. Conoscere l'ultimo snapshot non dimostra che non esista un tail perso.

Protocollo minimo da implementare e provare **prima della chiusura A3**: dopo firma eBay valida, receipt cifrata append-only e head/sequence durevoli in un dominio indipendente dal restore, prima della registrazione e prima di rispondere successo. Fallimento archivio/head => nessun ACK di successo; un receipt persistito prima di un crash deve poter essere rigiocato con idempotenza. Registrazione/completamento DB e checkpoint devono riferire sequence e receipt; replay completo del tail fino all'head indipendente prima di uscire dalla quarantena. Archivio e witness indisponibili => quarantena/allarme, mai degradazione permissiva. Compattazione può eliminare ciphertext personale solo dopo che tombstone/stato completato sono coperti da checkpoint durevole verificato e tail sostitutivo; mai lasciare una finestra senza obbligo recuperabile.

Questa PR prepara formato e prova di riconciliazione, **non integra il protocollo write-ahead né sceglie/attiva un provider**. A4/A5 worker/monitor indipendenti e allarme verificabile restano separati. Supabase Storage nello stesso progetto da solo non è l'indipendenza richiesta: backup DB contiene metadati, non byte oggetti; un restore può riportare indietro l'indice, e la perdita del progetto resta un guasto comune. PITR ha RPO finito e non sostituisce il journal. Nessun AWS/Google/nuovo servizio introdotto.

## Sequenza operativa proposta, richiede nuova autorizzazione

| Fase | Prima / azione futura | Gate dopo / rollback sicuro |
| --- | --- | --- |
| 0 inventario | Backup reali, retention/PITR, root-key portability, log capture, consumatori Vault e authority dei grant | Mancanza evidenza => STOP. Nessun cambio runtime |
| 1 staging gestito | Clone sintetico autorizzato con Vault reale e ACL gestite; SQL A1 + proposta A2 revisionati | Verificare ACL anche come ruoli effettivi, rotazione/canary; rollback grant solo dopo audit, nessuna rimozione tombstone |
| 2 durabilità | Selezionare archivio/head/escrow con failure domain e costi sostenibili; implementare receipt pre-ACK, monitor indipendente e replay | Test crash tra ogni coppia receipt/head/register/erase/checkpoint, indisponibilità archive/witness/key e restore a più punti; nessun ACK non recuperabile |
| 3 restore drill | Quarantena fuori DB prima del restore; stop ingressi/publisher e scansioni in volo, acquisire latest head/receipt, snapshot delle obbligazioni correnti | Recuperare chiavi/backup; verificare firma/progetto/schema/head e union monotona, riscrub, invalidare claim e ricalcolare; zero tail perso e allarme provato |
| 4 rollout | Approvazione separata, migrazioni transazionali e credenziali ristrette; solo dopo gate durabilità/key/log e A4/A5 | Controlli prima/dopo ogni fase, monitor indipendente osservabile; nessuna attivazione in questo lavoro |
| 5 ritorno servizio | Verifica zero lavoro pendente, suppression/fencing attivi, replay tail all'head verificato, campione prezzi/identificativi sintetico | Riaprire rete/publisher solo con gate completo. Rollback app mantiene DB/journal/tombstone/chiavi e guard; vietato downgrade a writer che aggiri A1 |

Se qualcosa fallisce dopo restore, conservare quarantena e checkpoint/journal/chiavi, ripetere riconciliazione idempotente. Non ripristinare un backup sopra gli obblighi correnti senza averli messi in salvo. Un rollback che elimina schema o disabilita suppression non è ammesso.

## Costi e prestazioni

Il nuovo codice non è importato dal runtime; carico Production aggiuntivo attuale zero, nessuna frequenza scanner/cron modificata. Export STABLE legge O(notifiche + dipendenze + tombstone) in un solo snapshot: meno round-trip, ma memoria JSON e MVCC crescono con il ledger. Prototipo limitato dal buffer dump locale 32 MB; non è dimensionato per Production. Prima dell'uso servono streaming/batching con checkpoint coerente e misura su volumi realistici; nessun benchmark di scala dichiarato.

Misura locale della prova: dump 245.019 byte, capsula 5.151 byte, 3 notifiche/2 tombstone, 59 richieste HTTP complessive nel laboratorio, 39.587 ms incluso setup/restore/processi Docker. Questi numeri non sono una stima di latenza CPU/PostgREST Production.

Costo da stimare sul provider selezionato: byte archiviati = dimensione checkpoint × versioni conservate + receipt tail + copie escrow; operazioni = checkpoint/giorno + receipt/head per notifica + letture di monitor/replay; aggiungere egress e restore compute. Esempio di pianificazione (non frequenza attivata): 1 checkpoint/giorno, 30 versioni, capsule 1 MiB => 30 MiB più journal/escrow; 10 MiB => 300 MiB. Il full export frequente può costare più del tail append-only. Richiedere numero notifiche/tombstone e retention approvata prima di una cifra mensile attendibile.

Listino pubblico PITR indicativo: 7 giorni ~USD100/mese, 14 ~200, 28 ~400; non prova il piano attuale né è una raccomandazione di attivarlo. Nessun costo di nuovo servizio impegnato. RTO/RPO reali non misurabili da tre notifiche sintetiche; obiettivo erasure: nessuna receipt accettata persa, da dimostrare con journal indipendente.

Fonti consultate: [Vault](https://supabase.com/docs/guides/database/vault), [Backup](https://supabase.com/docs/guides/platform/backups), [PITR/uso](https://supabase.com/docs/guides/platform/manage-your-usage/point-in-time-recovery). Le retention generiche documentate non attestano la configurazione del progetto.

## Verifiche locali sul diff

Tutti i comandi terminati exit 0: `pnpm verify`, `pnpm typecheck` separato, `pnpm ebay:erasure:postgres:test`, `pnpm ebay:erasure:e2e:test`, `pnpm ebay:erasure:restore:test`; `git diff --check` pulito. Il comando E2E comprende matrice ingressi A1 e probe originale PostgREST, ancora verde. Le differenze note della fixture rispetto ai trigger/schema gestiti rimangono A5, non vengono nascoste dal PASS. Nessuna build/Preview richiesta. CI aggiunge una sola esecuzione restore nello stesso job Docker già esistente, senza modificare workflow scanner o schedule.

Diff rispetto a `96380255`: zero modifiche in lib/app/supabase, nei tre SQL A1, nella matrice ingressi/probe originali e in vercel.json. Dodici file aggiornati/aggiunti: proposta privilegi, tre helper laboratorio, test restore, fixture metadata, rapporto/puntatori, script package e un comando CI. Le verifiche CI remote vanno riferite al nuovo SHA esatto della PR.

## Esito e gate ancora aperti

- Risolto come verifica: ACL Vault/logging effettive inventariate senza segreti; proposta capability minima e prove isolate di crittografia, failure e restore/re-scrub/ricalcoli.
- **A2 aperto:** revoche owner-authorized e compatibilità consumatori da provare su Vault gestito sintetico; log reali/redazione/retention, escrow/root portability e policy approvate mancanti.
- **A3 aperto:** backup/PITR/inventario reali non attestati; receipt write-ahead, archivio/head indipendenti e recupero gestito da implementare/provare. Il witness in memoria non chiude questo gate.
- A1 invariato; A4/A5 aperti e separati; PGRST303 separato. Nessun successo di questi test autorizza il rilascio.
