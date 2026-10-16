# P0.6A — preflight finale PR #430, 16 ottobre 2026

> Aggiornamento A1: protezione persistente implementata e verificata in `P06A_A1_REVIEW.md`. Il riproduttore è ora un gate di sicurezza A1 e deve terminare 0; il controllo negativo torna rosso senza protezione. Le sezioni sotto conservano la fotografia pre-correzione cd39318 e i gate A2–A5. Rilascio complessivo ancora **NO-GO**; nessun servizio esterno introdotto.

**Esito: NO-GO per il rilascio.** Il preflight è completato come revisione e riproduzione dei rischi; i blocchi elencati sotto non sono risolti dall'esito positivo della suite funzionale. Questo documento integra e prevale sulle formulazioni di readiness del rapporto precedente. Nessuna autorizzazione a migrare, attivare servizi o distribuire codice è stata esercitata.

## Checkpoint e perimetro

- PR #430 Draft, base di revisione `d34f049aa2a8196a849f3cbb13af1d208bc3ca53`; main e Production READY entrambi `f8e27c0f72458a4daeac7e98323981fb0cfeb4ce`, deployment `dpl_MEa81NEKBoP4hQQNtyHLJRN4aiMA`.
- Riletti AGENTS, TRACKDASH_STATE, TRACKDASH_OPERATIONS, TRACKDASH_METHOD_MASTER, FAMILY_COMPLETION_MASTER, P06A_REVIEW e AUTOMATIC_RECOVERY_PLAN. I checkpoint storici dei master non sostituiscono GitHub/deployment/schema effettivi.
- Solo SELECT su cataloghi/metadati Supabase, conteggi stimati pg_stat_user_tables e ricerca della versione nei log; nessuna lettura di seller reali, nessuna cancellazione/retry/notifica di prova remota. Nessuna credenziale letta, generata o cambiata. Nessuna Preview/build Next.
- La history gestita include già `20261016105840 p06b_admin_column_reads_20261016`. Questo è un fatto letto dal DB attuale, non un'applicazione effettuata durante questo lavoro. P0.6B resta separata dal diff P0.6A.

## 1. Confronto SQL/schema effettivo

Snapshot riproducibile senza righe applicative: `scripts/fixtures/p06a-managed-metadata.json`. Confronto locale: `node scripts/audit-p06a-preflight.mjs` (richiede il container isolato descritto nei test precedenti). Exit **2** indica un blocco di rilascio dimostrato, non un test funzionale superato. Non viene inserito nella CI verde come se certificasse readiness.

| Oggetto | Risultato dimostrato | Limite da chiudere |
| --- | --- | --- |
| PostgreSQL | 17.6; build gestita 17.6.1.166; fixture 17.6 | Runtime gestito non interamente replicato |
| Estensioni | plpgsql 1.0, pg_stat_statements 1.11, uuid-ossp 1.1, pgcrypto 1.3, supabase_vault 0.3.1 | Le proposte non richiedono nuove estensioni |
| Colonne delle 10 tabelle pertinenti | Nomi, tipi e nullabilità coincidono con la fixture | Non equivale a un clone completo di default, ACL e trigger |
| Indici | Conflitti canonici release/condition, release/condition/month, release/condition/snapshot_date presenti; tutti gli indici delle cinque tabelle scrubbed rappresentati | Fixture manca `idx_market_source_policies_scope_priority`; JSON/source matching non ha un indice risolutivo |
| Check | Compatibilità dei dati sintetici dimostrata | Fixture differisce per ask_snapshots.condition (gestito include new_carded), price_sources.ingestion_mode (licensed_feed), market_candidates.match_evidence (verified_endpoint_match); non cambiare i check Production per adattarli al test |
| ACL | service_role BYPASSRLS, non superuser; SELECT policy/source e SELECT/UPDATE sulle cinque tabelle; INSERT/UPDATE sui tre output canonici già disponibili | Alcuni privilegi storici DELETE/TRUNCATE esistono, non concessi da questa PR; il guard non è una protezione contro amministratori/DDL |
| RLS | Attiva su tutte le dieci tabelle; candidate/offer/aggregate/monthly source private senza policy; price_points SELECT authenticated; signal/monthly SELECT anon/authenticated; ASK snapshot senza policy pubblica | Non viene aggiunta né cambiata alcuna policy esistente |
| Nuovi oggetti P0.6A | Schema trackdash_erasure e RPC non presenti nel gestito | Le due proposte non sono applicate |
| PostgREST | Fixture reale 13.0.7 | Versione gestita **non attestata**: ricerca limitata 15/10 12:00–16/10 12:00 UTC senza banner/versione. Non dedurla dal PostgreSQL o dalla fixture |

Trigger gestiti verificati tramite pg_get_triggerdef/pg_get_functiondef:

- price_points: prevent_price_point_hard_delete e price_points_queue_market_recompute; aggregate: market_aggregate_observations_queue_recompute. Le funzioni queue sono SECURITY DEFINER postgres e chiamano trackdash_enqueue_market_recompute; l'erase conserva i trigger e può quindi alimentare anche la queue canonica esistente. Non incrementa frequenza o batch del consumer.
- candidate: market_candidates_release_revalidation (INVOKER, invalida price_points solo quando cambia resolved_release_id); trg_market_candidates_auto_enroll_rcjaz (INVOKER, solo INSERT/UPDATE delle colonne nominate). L'UPDATE scrub attuale non nomina quelle colonne.
- signal: market_release_signals_auto_enroll_scans AFTER INSERT, funzione SECURITY DEFINER postgres, chiama trackdash_enroll_release_market_scans. **Manca nella fixture precedente**: la pubblicazione di un signal nuovo deve essere provata con enrollment reale e dipendenze su clone gestito sintetico. L'upsert di righe esistenti non basta a certificare il caso INSERT.
- monthly signal/ASK/offer/monthly source: nessun trigger preesistente rilevato. I tre nuovi BEFORE statement guard coesistono con quelli esistenti, non li sostituiscono.
- Helper claim/enqueue/finish della queue: DEFINER postgres; EXECUTE service_role/trackdash_app. enroll_release_market_scans è DEFINER, EXECUTE postgres/trackdash_app (il trigger DEFINER può chiamarlo); enroll_rcjaz_endpoint INVOKER, EXECUTE anche service_role. Nessuna ACL cambiata per far passare i test.

Al checkpoint di questo preflight le due proposte erano identiche. La successiva chiusura A1 modifica erasure e aggiunge una terza proposta ingress-suppression: vedere il rapporto A1 per il diff corrente. Invoker/search_path fissato, nuovi grant solo su nuovi oggetti e funzioni, nessun allargamento RLS su tabelle esistenti. La mera compilazione SQL locale non chiude il gate di runtime gestito.

## 2. Writer, concorrenza e reintroduzione

Inventario nel repository corrente (ricerca nomi SQL e simboli Drizzle, lettura dei siti di mutazione e chiamanti):

| Writer / ingresso | Tabelle / comportamento | Copertura attuale |
| --- | --- | --- |
| market-r3-repository.upsertReleaseSignal / upsertMonthlySoldSignals / upsertAskSnapshot | Tre output canonici | Buffer e snapshot generazione quando flag fencing true; pubblicazione RPC atomica |
| market-r3-service, chiamato da automation worker, ebay-worker, recompute-worker | Consumer cron market-scan, GitHub eBay Market Watch, azione admin | Stesso service/repository; job elaborati sequenzialmente per istanza. Invocazioni sovrapposte restano possibili |
| messaging.respondMarketplaceSaleAction, vendita confermata | Ricalcolo canonico dopo commit della vendita | Stesso service; la queue già esistente conserva la ripresa se fallisce il ricalcolo immediato |
| account-deletion-recovery | Tre output via RPC erase claim/publish | Generazione/token/lease; collisioni stale rifiutate |
| pipeline/repository | Upsert/patch candidate, grouping candidate/point, revalidation, upsert point, monthly source stats | **Nessun fence di ingestion** |
| sold-ingestion-repository | Candidate e point; enqueue recompute | **Nessun fence di ingestion** |
| market-r3-repository.upsertAggregateObservation / upsertOfferState | Aggregati, offerte e storico non personale | **Nessun fence di ingestion** |
| automation/ebay-worker | Upsert candidate diretto, aggiornamenti lifecycle/offer | **Nessun fence di ingestion** |
| automation/worker | Upsert candidate diretto / retail, aggiornamenti endpoint | Non assumere che ogni futura fonte sia non eBay; inventario delle fonti obbligatorio |
| pipeline/repository.upsertEstimate/deleteEstimate/history | Legacy market_estimates/value_history, non i tre output R3 | Fuori dal nuovo guard; evitare riattivazioni/rollback al publisher legacy |
| Hot Wheels shared-market preview, public/dashboard/collection/audit | Letture, non publisher canonici | Non richiedono bypass del guard |
| SQL storici in supabase/migrations | 30 file contengono scritture dirette agli output | Non replayare data migration/repair. Future manutenzioni devono usare un publisher coordinato |
| Client esterni, SQL Editor, tooling operativo | Non enumerabili dai soli sorgenti | Richiede inventario operativo firmato; non proclamare che non esistano |

ACL effettive: service_role può INSERT/UPDATE sulle otto tabelle di input/output; anon/authenticated/trackdash_app non risultano writer diretti. postgres/supabase_admin e il ruolo predefinito pg_write_all_data hanno capacità amministrative/di scrittura, queste ultime soggette a RLS e membership. Non sono nuove concessioni P0.6A. Un ruolo proprietario può alterare/disabilitare trigger: fencing è coordinamento dei writer fidati, non un confine contro credenziali amministrative compromesse.

**Riproduzione reale:** il nuovo audit trattiene un payload scanner sintetico, esegue register+erase via PostgREST, verifica seller=NULL, poi esegue lo stesso normale upsert service_role. Seller e raw_payload vengono reinseriti con guard_enabled=true. Il lock dell'erase non è condiviso da questi writer. Anche un ricalcolo avviato *dopo* la reintroduzione può pubblicare la generazione corrente: il solo fence dei valori non risolve questo caso. Non è attribuibile a P0.5.

La sola attesa del termine degli scanner pre-deploy non risolve future importazioni/copie storiche. Non risolvo il problema bloccando indiscriminatamente gli scanner o eliminando tutti i seller: cambierebbe dati utili e pubblicazione ASK. **A1 allora aperto, ora corretto nel rapporto dedicato:** progettare/provare suppression persistente e serializzazione a livello DB su tutti e cinque gli ingressi e sugli UPDATE grouping/point. Una proposta ammissibile è token HMAC di identità normalizzata con chiave dedicata, tombstone protette e retention motivata, più normalizzazione/scrub degli ingressi nello stesso lock transazionale dell'erase. Token pseudonimi sono ancora dati personali; non conservarli in chiaro o nei log. In alternativa il writer deve presentare un epoch pre-fetch verificato, ma questo protegge solo gli in-flight: serve comunque suppression per importazioni storiche successive e per nuovi candidate ID. Prima di implementare: test writer prima/durante/dopo erase, stessa e nuova listing identity, alias e fonti inattive, insert/update/bulk, candidate->point in transazioni separate, copie e restore. Questa modifica richiede una revisione di schema/contratti di ingresso, non un bypass o una correzione cosmetica al guard.

## 3. Chiavi, logging, retention e backup — configurazione proposta

Nessun valore di segreto nel repository o in questo documento. Provisioning solo dopo nuova autorizzazione, tramite secret manager con IAM separato, accesso workload identity e audit degli accessi, mai via comandi con valore in argv/stdout o dump env. EBAY_ERASURE_KEYS/EBAY_ERASURE_CURRENT_KEY solo runtime del webhook e worker; mai NEXT_PUBLIC, browser, build/Preview o monitor. DB non conserva la chiave di cifratura. Token worker e sink diversi dalle chiavi di cifratura e dalle credenziali Supabase. Non sostituire credenziali esistenti per tentare di correggere PGRST303.

Rotazione ordinaria proposta ogni 90 giorni: creare versione nuova nel secret manager; distribuire keyring vecchia+nuova a tutti i reader; verificare health/config senza mostrare valori; cambiare CURRENT solo dopo che tutti leggono entrambe; mantenere la vecchia per sealed ricevuti, retry/duplicate ledger e copie di backup ammesse. Il digest originale dipende dalla versione vecchia anche dopo sealed=NULL: **non rimuovere la vecchia sulla sola base di inbox vuota**. Rollback CURRENT possibile senza eliminare versioni. Rewrap degli incompleti richiede un comando transazionale dedicato, audit e test, non è presente oggi. Compromissione di chiave: chiudere l'accettazione se necessario, mantenere copia protetta per gli obblighi pendenti; non distruggere la sola possibilità di decrittazione.

Policy proposta da approvare: incomplete/lease/recompute/exhausted senza purge automatico; overdue >15 min, escalation umana entro 1 ora. Ciphertext eliminato al commit erase; ledger completed e allarmi risolti conservati almeno 90 giorni **e comunque oltre la finestra contrattuale massima di retry/replay eBay da confermare**. Non attivare purge con questa PR: servono FK order, dry-run counts, piccoli batch, prova di replay oltre retention e criterio di dismissione delle generazioni (reset a zero può riaprire un vecchio publisher). Retention log operativi sanitizzati 30 giorni proposta; niente body/query param/header auth, ciphertext, digest, seller o payload nei log/APM/DLQ. Le metriche sono aggregate, non per identità.

Metadati logging gestito letti: log_statement=ddl, log_min_error_statement=error, log_parameter_max_length=-1, log_parameter_max_length_on_error=0, pgaudit.log=none, pgaudit.log_parameter=off. Non certificano sicurezza end-to-end: verificare override ruolo/sessione, error CONTEXT/dynamic SQL, PostgREST/gateway e APM. Non attivare statement logging/bind sampling; non testare segreti reali nei log. Canary sintetici hanno passato la suite locale.

[Backup Supabase](https://supabase.com/docs/guides/platform/backups): la retention effettiva del progetto/PITR/export esterni **non è stata esposta dai tool usati**, non assumere i 7 giorni del piano Pro. sealed=NULL non elimina dati personali dai backup, né dal WAL o da snapshot precedenti; la stessa keyring serve anche all'idempotenza, non garantisce crypto-erasure per notifica. **Gate A2:** inventario delle copie, retention approvata, restore drill isolato e gestione separata chiavi prima di abilitare.

Rollback applicativo non significa restore del DB. Un PITR precedente alla ricezione perde notifiche, uno precedente allo scrub ripristina PII; il ledger completed senza sealed non permette di ricalcolare gli identificativi necessari a ripulire un backup vecchio. Vietato rimettere online un restore senza riconciliazione. Per disaster recovery serve un journal di accettazioni/cancellazioni cifrato e durabile fuori dal dominio di restore DB, con policy di accesso/retention esplicita, o una procedura di riconciliazione con il provider che possa recuperare tutte le identità. Non è implementato/provisionato: **gate A3 aperto**, nessuna garanzia di zero perdita in un restore totale. Nessun export PII effettuato qui.

## 4. Worker e monitor indipendenti — architettura operativa proposta

`?mode=monitor` nella route attuale è un helper diagnostico: condivide Vercel/app, flag WORKER_ENABLED, createAdminClient, keyring e sink. Due scheduler che chiamano la stessa route non costituiscono due domini indipendenti. Non presentare il test della modalità monitor come prova di indipendenza infrastrutturale.

Configurazione proposta da revisionare, non attivata:

- **Worker:** AWS EventBridge Scheduler -> Lambda dedicata eu-west-1, artefatto fissato allo SHA approvato che importa runErasureRecoveryTick e chiama direttamente Supabase, senza passare dalla route Next.js/Health Watch/scanner. Ogni 5 minuti, concurrency 1, deadline interna 45s, runtime massimo 60s, HTTP 12s, lease 90s; 1 job/max4 ricalcoli per tick. Il wrapper non aggiunge retry ai tentativi SQL persistenti. Invocation asincrona configurata senza retry Lambda aggiuntivi; delivery retry Scheduler al massimo 1 entro 2 minuti, DLQ SQS con payload **solo comando tick** e retention 14 giorni. Allarme nativo su delivery failure, DLQ>0 e fallimento esecuzione. Non mettere notifiche eBay nella DLQ scheduler. Chiavi/credenziale worker esclusivamente nel suo secret manager, dedicata identità IAM.
- **Monitor:** Google Cloud Scheduler -> servizio Cloud Run HTTP autenticato OIDC, altra identità, progetto/fatturazione e regione europe-west1. Ogni 5 minuti, offset 2 minuti rispetto al worker, max instance/concurrency 1, min instance 0, deadline 15s, nessun retry di query. Connessione TLS verify-full al DB tramite ruolo dedicato **read-only**, accesso solo a una funzione/view aggregata di salute, nessuna keyring/API service_role o token del worker. Nessun import del codice worker. La superficie SQL minima (counts incomplete/exhausted/overdue/undelivered, oldest age e heartbeat) va proposta separatamente con owner/EXECUTE rigorosi: non concedere SELECT su sealed o intero ledger né cambiare RLS. Il monitor non aggiorna heartbeat del worker e non reclama job/allarmi.
- **Allarmi:** il worker mantiene outbox e ack; il monitor usa Cloud Monitoring e un canale di escalation diverso dal sink applicativo. DB/TLS/auth indisponibile => check failure, non healthy. Heartbeat worker >15 min, incomplete >15 min, exhausted>0, undelivered>0 e mancata consegna => incidente. Missed monitor run: metrica Scheduler/esecuzioni ed assenza di esito oltre 10 min, più dead-man esterno al progetto Google da provare. Nessuna dipendenza circolare dal DB/app per rilevare il down del DB/app.

**Gate A4:** wrapper worker, monitor aggregato con minimo privilegio, manifest IaC e test di fault nei rispettivi domini non sono presenti/certificati. Questa è una definizione concreta da implementare e poi autorizzare, non un servizio già operativo. Il monitor non deve poter completare una cancellazione o conoscere seller. Non si è attivato alcun scheduler.

Prova di accettazione in staging sintetico obbligatoria: provider eBay silente dopo register; stop worker => allarme monitor entro 20 min; stop app/Vercel => worker continua; stop DB/credenziale worker => monitor allarma da canale proprio; stop sink => undelivered permane; stop monitor => dead-man allarma entro 15 min; esaurire 8 tentativi => persistenza + escalation; 12 fallimenti sink => nessun ack e check non sano; recupero guasto => risoluzione distinta dalla consegna. Verificare **ricezione** del destinatario con ID incidente e prova audit, non solo HTTP 2xx. Nessun test di questo tipo su Production ora.

Capacità (30 giorni): 8.640 tick worker + 8.640 check monitor; idle worker 1 RPC, monitor 1 query aggregata: circa 17.280 query/mese senza scansioni di mercato. Massimo teorico worker 288 job/1.152 ricalcoli al giorno, ridotto da tempi/lease/errori; un backlog di N job non può promettere SLA inferiore a ceil(N/288) giorni con questa configurazione. Richiedere misure reali prima di aumentare concorrenza/frequenza; nessuna variazione scanner.

Budget preliminare, non autorizzazione di spesa: [Lambda listino](https://aws.amazon.com/lambda/pricing/) x86 di riferimento $0.0000166667/GB-s e $0.20/milione richieste: 512 MiB, 8.640 tick di 1s => ~$0.074/mese compute+request; tutti i tick a 45s => ~$3.242. Esclude overhead init, eventuali retry, secret manager, Scheduler, DLQ, rete/log/allarmi e Supabase; verificare regione/listino sul preventivo definitivo. [Cloud Scheduler](https://cloud.google.com/scheduler/pricing): $0.10/job/mese prima di crediti; monitor HTTP evita il minimo fatturabile di 1 minuto dei [Cloud Run Jobs](https://cloud.google.com/run/pricing). Budget obiettivo complessivo iniziale **$10/mese aggiuntivi**, alert a $5/$8/$10, non hard-stop del recupero a budget raggiunto. Costi monitor/sink/monitoraggio e piano esistente da quotare; non assumere free tier disponibile né riutilizzare il vecchio credito Vercel come conferma corrente. Nessuna necessità di aumentare piano/abilitare PITR a pagamento per questo preflight.

Volumi stimati gestiti, non payload scaricati: candidate ~1.251/1,76 MB inclusi indici, offer ~463/344 KB, point ~84/221 KB, aggregati ~89/229 KB, monthly source ~0/41 KB. Sono stime pg_stat, non conteggi esatti o benchmark. La prova sintetica 2.000 payload resta utile ma non misura lock/WAL/CPU nel gestito o comportamento dei trigger omessi. Gate A5: clone realistico dei soli metadati e dati sintetici con trigger completi, p95/p99 sotto budget SQL 10s, lock wait, statement error, WAL, coda, test di crescita; mai EXPLAIN ANALYZE di erase in Production.

## 5. Valori e diagnosi PGRST303

Formule, gate MV/SOLD/ASK, mapping, versioni metodo e condizioni Release non modificati. Repository e service continuano a usare il publisher originale bufferizzato. Suite verify include metodo, R3, ASK, Collection e cross-surface; E2E include ricalcolo ordinario sospeso, stale reject e successivo publish valido. Il mercato deve poter continuare a pubblicare su Release estranee a una cancellazione. Questo non sostituisce il caso di INSERT con auto-enrollment gestito o le prove di carico: finché A1/A5 sono aperti non si dichiara assenza di regressioni operative in Production.

Unico difetto runtime corretto in questo preflight: il catch della route recovery perdeva il codice del primo poll. Test rosso prima della correzione, verde dopo: SQL/PGRST allowlisted e DEADLINE conservati, qualsiasi altro valore diventa FAILED; HTTP resta 503, nessun messaggio DB/detail personale nei log. Nessuna modifica alla logica di cancellazione o alle credenziali.

PGRST303 rimane incidente autonomo. Registrare timestamp UTC, request/deployment correlation già disponibile e codice/status/operazione/durata; non token/JWT/header/body/query seller o hash derivati da segreti. Distinguere 401 PGRST303 da 42501 ACL, 57014 timeout, PT409 fencing e guasti trasporto. Correlare gateway/PostgREST/auth per intervallo esatto, fingerprint di versione/config non segreta, clock skew, esito delle richieste immediatamente precedenti/successive. Verificare tipo credenziale e percorso di autenticazione senza leggerne/stamparne il valore. La fixture con JWT scaduto dimostra solo un modo di produrre quel codice; non dimostra la causa del 16/10 e non giustifica sostituzioni speculative.

## 6. Piano gated di rollout e rollback

Tutte le fasi remote sotto richiedono nuova autorizzazione. Arrestarsi al primo gate non soddisfatto; niente attivazioni parziali per vedere se funziona.

| Fase | Prima / azione futura | Controllo dopo / arresto sicuro |
| --- | --- | --- |
| 0 — Revisione | Chiudere A1–A5, versione PostgREST e trigger completi; diff/CI/SHA approvati; owner operativo e budget; nessuna nuova Preview | Audit preflight deve diventare verde per **assenza** della reintroduzione, non cambiando l'assert per accettarla. Nessun provisioning finché NO-GO |
| 1 — Staging | Schema gestito aggiornato senza righe reali, logging canary, tutti writer e code; keyring e monitor separati di staging | Firma, crash/fault per fase, scadenza lease, duplicati concorrenti, in-flight ingress/canonical publish, key rotation e restore drill passano; allarmi ricevuti |
| 2 — SQL | Approvare un'unica migrazione atomica con entrambe le proposte + eventuale protezione ingress revisionata, CLI standard, nessun SQL di seed; guard inizialmente false | Verificare oggetti/indici/ACL/RLS e hash, EXECUTE solo previsti, nessun cambio policy/formule. Errore => transazione rollback; nessuna inbox ancora accettata dal nuovo codice |
| 3 — Codice/publisher | SHA fissato, Preview branch disabilitata; fencing applicativo true, webhook/worker false; piano di cutover delle notifiche eBay senza finestra cieca | Il vecchio endpoint non deve essere disabilitato per più della finestra di retry. Non inviare 2xx a notifiche non completate. Durabilità d'ingresso alternativa o riconciliazione approvata se finestra non garantibile |
| 4 — In-flight | Inventario runtime completo e drenaggio delle invocazioni del vecchio artefatto: attendere almeno durata massima effettiva più lease e dimostrarlo da log/run, non un tempo fisso ipotizzato; orchestrare protezione ingestion senza cambiare frequenze scanner | Guard DB e protezione ingress attivi solo dopo nuovi writer pronti; writer vecchio/stale rifiutato o scrubbed, nuove identità storiche suppressed; pubblicazione valida estranea funziona. Fallimento => niente accettazioni, niente bypass guard |
| 5 — Operatività | Autorizzare worker dedicato + monitor separato + dead-man + canali, artefatti/IAM/tariffe revisionati | Due cicli sani, fault drill di staging con ricevuta destinatario; verify monitor non dipende da app/worker/keyring. Nessuna notifica Production sintetica |
| 6 — Accettazione | Abilitare webhook nuovo solo con chiavi, inbox, ingress guard, worker, monitor e DR pronti | Osservare solo notifiche reali: 204 iff completed, received/erased recuperabili, progress/lease e counters senza PII, alarm/outbox sane. Non associare zero-count a notifiche storiche senza identità provata |
| 7 — Sorveglianza | 24h/7 giorni controllo aggregate age, tentativi, backlog, alarm delivery, MV/SOLD/ASK null/range e latenze, costo incrementale | Superamento soglie => escalation e roll-forward bounded; non cambiare batch/frequenza scanner, formule, key o grant per mascherare un errore |

Rollback per fase: prima di accettare notifiche nuove si può tornare all'artefatto precedente solo se la compatibilità col guard è garantita; non distribuire publisher legacy con guard attivo. Dopo l'accettazione conservare schema, tutte le sei tabelle, keyring vecchie, tombstone/ingress protection e journal esterno approvato. Preferire revert/roll-forward del codice difettoso mantenendo consumer compatibile e guard; fermare solo nuove accettazioni se necessario con non-successo, allarme immediato e limite della finestra provider. Non disabilitare worker sano, monitor o suppression come rollback generico.

Per ogni pausa/export/manutenzione: registrare conteggi per stato e oldest age senza identificativi, ultimo progresso, numero lease e allarmi non ack; attendere scadenza lease o drain, non azzerare token/generazioni/attempts indiscriminatamente. Dopo ripristino riprendere **gli stessi record persistiti**; redrive exhausted solo per causa corretta, autorizzato e auditato, senza inventare nuove notifiche o simulare eBay. Nessun DROP schema, down migration distruttiva, restore pre-inbox, purge o distruzione chiavi come rollback. DB restore resta in quarantena finché riconciliazione esterna non dimostra che nessuna notifica/cancellazione è stata perduta o ripristinata.

## Risultati dei comandi

- `pnpm verify`: PASS (include Typecheck e suite metodo/R3/ASK/Collection/cross-surface).
- `pnpm typecheck`: PASS separato.
- `pnpm ebay:erasure:postgres:test`: PASS, rollback per fase/outbox, timeout, duplicati e generazioni concorrenti.
- `pnpm ebay:erasure:e2e:test`: PASS, PostgreSQL 17.6/PostgREST 13.0.7 e SDK reale; campione sintetico finale 2.000 payload, 425ms/una RPC/205 byte. Non benchmark Production.
- `node scripts/test-ebay-erasure-recovery.mjs`: test del primo poll PGRST303 rosso prima del fix, PASS dopo; nessun messaggio/identificativo/segreto nella diagnostica catturata.
- `node scripts/audit-p06a-preflight.mjs`: **exit 2 / NO-GO atteso**, controesempio di reintroduzione riprodotto; colonne/tipi/nullabilità compatibili e drift fixture elencato. Non chiamarlo PASS né errore intermittente CI.
- `git diff --check`: PASS; entrambe le proposte SQL identiche allo SHA iniziale; scanner, formule e frequenze invariati.

## Stato finale dei blocchi

Risolti come verifiche: checkpoint main/Production; confronto colonne/tipi/indici/ACL/RLS e trigger gestiti; identificazione precisa writer repo e controesempio ingestion; diagnosi PGRST303 del primo poll (fix minimo testato); policy operativa chiavi e piano rollout/rollback documentati.

Aperti per **rilascio**, non autorizzati implicitamente da questa revisione: A1 suppression/ingress fencing e test di tutti writer/copie; A2 configurazione verificata di chiavi/log/retention/backup; A3 journal/riconciliazione DR; A4 worker/monitor indipendenti implementati e fault drill/quote approvati; A5 clone completo di trigger/runtime gestito e misure; versione PostgREST effettiva e inventario writer esterni. La Draft deve rimanere Draft e non pronta al merge.
