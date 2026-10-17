# P0.6A — unica proposta finale: Supabase, Vercel, GitHub

**17 ottobre 2026, Europe/Rome. Draft PR #430. Nessuna migrazione, configurazione, attivazione o deployment Production eseguito.** Questa proposta sostituisce il percorso AWS del commit `7b338123`: SDK, journal DynamoDB, stack, Lambda, SNS, bundle dedicato ed emulatore sono rimossi. Nessun account, servizio, abbonamento o documento aggiuntivo richiesto. I rapporti precedenti restano evidenze storiche; il piano operativo corrente è soltanto questo.

**Aggiornamento di compatibilità:** il nuovo gate sui trigger nativi rileva un FAIL RCJAZ42501 con ACL reali. Nessuna correzione di privilegi applicata; dettagli e risultati distinti nella verifica aggiuntiva in fondo. La PR resta Draft / Production NO-GO.

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

**A2 ancora da verificare nel gestito:** grant Vault storici di service_role, owner autorizzato per revoche e consumatori legittimi. **Non eseguire altre revoche globali service_role/Vault** e non applicare `p06a-runtime-vault-revocations.sql` né la precedente capability export di `p06a-vault-backup-privileges.sql`. I tentativi gestiti precedenti non dimostrano una revoca effettiva; il trattamento del grant legacy resta un problema distinto di autorità/consumatori da risolvere con il provider. La revoca da non-owner può non rimuovere i grant dell'owner. Servono inoltre canary sui log gateway/provider, scadenza/rotazione JWT e recuperabilità del pepper. Nessuna credenziale sostituita per ipotesi.

**PGRST303 resta separato:** diagnostica con solo codice/fase/durata/request ID, niente messaggio DB o Authorization; questa PR non dimostra la causa intermittente Production.

## Verifica e costo

Baseline del commit `318f401`: **PASS, exit0**, `pnpm verify`, Typecheck separato, `ebay:erasure:postgres:test`, `ebay:erasure:e2e:test`, `ebay:erasure:final:test`; `git diff --check` pulito. L'ultimo include PostgreSQL17.6/PostgREST13.0.7 reali, firma sintetica, ruoli scoped, transazione inbox, errore insert, risposta persa, duplicati, worker stale, ripresa dopo esaurimento senza reset, privacy canary, parità prezzi e restore con prova esplicita della finestra persa. Nessun emulatore AWS, installazione Moto o build Lambda in CI. Il test A1 originale e controllo negativo non sono indeboliti.

Le prove isolate non certificano root key/Vault gestito, configurazione gateway, consegna delle notifiche Actions e capacità sulle dimensioni effettive. La verifica aggiuntiva sotto copre i nuovi signal e gli otto trigger, ma rileva un FAIL reale sul ruolo HTTP RCJAZ. Gli ultimi risultati CI devono riferirsi al nuovo SHA, non al precedente commit AWS. Il vecchio test capsula rimane un esperimento storico eseguibile separatamente, non il percorso runtime né una prova di durabilità indipendente attuale.

**Costo fisso di nuovi servizi: USD0.** Nessun abbonamento/upgrade/PITR/risorsa AWS. Con controllo ogni5 minuti:288 chiamate worker/giorno, circa8.640/mese, più altrettante RPC monitor dirette. Idle worker una RPC; sotto lavoro max4 claim/45s per invocazione. Durata Vercel indicativa:1s medio ~2,4 ore-funzione/mese; a45s sempre ~108 ore-funzione/mese. Moltiplicare per la memoria effettiva del progetto per ottenere GB-ore; non si presume il limite512MiB della Lambda rimossa. CPU, memoria reale e limiti del piano vanno verificati prima di attivare. Non è promessa di costo incrementale totale zero: quote e fatturazione Vercel/Supabase esistenti vanno controllate prima di attivare. GitHub runner standard è gratuito per repository pubblico; le schedule non sono garantite. Non usare un loop o un aumento delle scansioni per completare cancellazioni.

## Sequenza unica di rilascio

1. Review della stessa Draft PR, correzione separatamente autorizzata del FAIL RCJAZ sotto e CI sullo SHA esatto; nessuna Preview o attivazione. Main/Production precedente non viene modificata.
2. Concordare esplicitamente i limiti sopra: perdita registro/backup e assenza dead-man indipendente da GitHub. Verificare backup esistenti, chiave recuperabile e procedura di quarantena; non attivare PITR a pagamento. Se l'obbligo richiede protezioni non disponibili, STOP/NO-GO.
3. Con approvazione distinta per l'ambiente, verificare schema/trigger/ACL/Vault e credenziali scoped, log canary e prezzi. Nessuna ulteriore revoca globale Vault; chiarire separatamente il grant legacy con il provider. Nessun accesso Production implicito nel test locale.
4. Solo dopo autorizzazione Production: quarantena e drain writer; applicare nella stessa transazione nell'ordine `p06a-ebay-erasure.sql`, `p06a-recovery-and-fence.sql`, `p06a-ingress-suppression.sql`, `p06a-minimization-and-token-recovery.sql`; provisioning chiavi/guard secondo A1 via canale protetto. Non applicare i due SQL Vault di revoca/export; nessuna capability export. Non applicare un sottoinsieme.
5. Pubblicare app con nuovo webhook inizialmente disabilitato e fencing compatibile; configurare ruoli JWT, token recovery e flag senza log. Abilitare minimizzazione/backfill con `activate-minimization.review.sql` sotto lock e confrontare output prezzi. Ogni fallimento mantiene quarantena.
6. Con autorizzazione all'attivazione, installare l'esempio workflow esistente come workflow attiva, abilitare variabile repo/worker e verificare invocazione reale, monitor DB e ricezione di un fallimento sintetico senza webhook live. Solo dopo heartbeat reale recente abilitare webhook202 e riaprire ingressi. Nessuna modifica delle frequenze scanner.
7. Osservare pendenze/età/errori/fence e quote. Rollback: disabilitare nuovi ACK e mantenere worker, inbox, tombstone, chiavi e outbox; tornare soltanto a codice compatibile con suppression/fence. Mai cancellare schema/obblighi, disabilitare guard o ripristinare un backup sopra il registro corrente senza averne preservato lo stato. Nessun purge automatico.

**Esito:** implementazione minima candidata alla review, non GO Production. Restano i limiti espliciti di durabilità/schedule e le verifiche operative gestite; non si dichiara A2–A5 chiuso per il solo PASS locale.


## Verifica aggiuntiva schema e trigger — 17 ottobre 2026

**Verdetto: FAIL compatibilità RCJAZ; Draft / Production NO-GO.** Sono pubblicati soltanto fixture, test e questo rapporto. Nessun cambiamento runtime, SQL di rilascio, grant, RLS, ruoli P06, scanner o formule. Main e Production READY rilevati a `f8e27c0f72458a4daeac7e98323981fb0cfeb4ce`; baseline PR `318f40180c6b5a5830c00cfd76909b01ef88bb7e`.

### Evidenze gestite già acquisite e perimetro nuovo

Riletti i tre rapporti della PR: [staging del 17/10](https://github.com/mercseba-afk/trackdash/pull/430#issuecomment-6234507681), [lacune schema](https://github.com/mercseba-afk/trackdash/pull/430#issuecomment-6234938735), [probe trigger BEGIN/ROLLBACK](https://github.com/mercseba-afk/trackdash/pull/430#issuecomment-6235051920). I PASS gestiti restano acquisiti, non ripetuti: erasure/suppression, numeri conservati, outbox, ruoli e probe RCJAZ/queue/hard-delete con owner. Non certificavano il caller HTTP effettivo né tutte le dipendenze.

Il nuovo rilievo remoto è **solo catalogo/metadata**, senza righe personali o segreti: Production PostgreSQL17.6.1.166; staging preesistente PostgreSQL17.11.0.003, Vault0.3.1/pgcrypto1.3 dal rapporto gestito. I tre ruoli dedicati staging restano NOLOGIN/membri di authenticator; solo worker BYPASSRLS. Nessuna mutazione dello staging né creazione di risorse; i conteggi baseline risultano coerenti con il precedente rollback.

Snapshot congelato `scripts/fixtures/p06a-native-trigger-schema.json`:28 tabelle con colonne/default/not-null, PK/unique/check/FK, indici, ACL tabella/colonna, RLS/policy e14 funzioni reali con owner/grant. Il loader costruisce tutte le dipendenze e installa esattamente gli **otto trigger sulle cinque tabelle interessate**. Test di parità del DDL nativo e installazione delle quattro proposte P06 nel laboratorio; i CHECK vengono riparsati da PostgreSQL per confrontare la forma canonica, senza eliminare vincoli o parentesi semanticamente significative.

**Limite esplicito:** i trigger delle tabelle di dipendenza Catalogo/Collezione/conversazioni/offerte non sono installati; quelle righe sono seed sintetici, non test di mutazione del Catalogo. Auth e Vault sono facciate locali sintetiche; postgres locale è superuser, non il postgres gestito. Le ACL di colonna confrontano ruolo/colonna/privilegio; il rilievo non cattura il relativo grant option. La prova non equivale a certificazione integrale del progetto Supabase. Nessun trigger target è disabilitato o modificato.

### Matrice degli otto trigger

| Trigger / percorso | Esito e prova |
| --- | --- |
| `market_release_signals_auto_enroll_scans` e helper | PASS locale: vero INSERT di signal dalla pubblicazione canonica, dipendenze enrollment/uniqueness reali; due fonti abilitate, interne escluse; eBay1008h, UPDATE conserva la cadenza777h della fixture; item ambiguo parcheggiato, JAN distinto ripristina enrollment tramite nuovo signal di altra condizione |
| Auto-enroll RCJAZ | **FAIL HTTP service_role42501**, descritto sotto; PASS solo owner per il comportamento del trigger, nessun grant aggiunto; controllo negativo eBay non iscrive endpoint RCJAZ |
| Revalidation candidate/release | PASS HTTP: cambio Release invalida i point collegati e richiede revalidation |
| Queue price point | PASS INSERT/UPDATE, coalescenza per Release/condizione e ricalcolo durante erasure |
| Hard delete price point | PASS: DELETE HTTP negato da ACL; distinta prova owner raggiunge l'eccezione append-preserved, righe conservate |
| Queue aggregate | PASS INSERT/UPDATE/DELETE con vincoli reali monthly/FX; DELETE in transazione annullata; erasure preserva il prezzo numerico e genera lavoro recuperabile |
| Queue marketplace sale | PASS owner: conferma e DELETE accodano un solo lavoro per chiave; vendita interna estranea resta evidence canonica SOLD EUR80 durante erasure e pubblicazione |
| Notification marketplace sale | PASS owner: INSERT pending notifica buyer, UPDATE confirmed notifica seller una sola volta; UPDATE ripetuto/DELETE non duplicano notifiche |

Le scritture dirette HTTP `service_role` su marketplace_sales sono correttamente negate dalle ACL reali: non sono state abilitate per il test. L'app usa le funzioni `trackdash_report_marketplace_sale` / `trackdash_respond_marketplace_sale` tramite `lib/db/queries/deals.ts`; il nuovo test riguarda i due trigger, non certifica quel flusso UI/RPC completo.

### Difetto dimostrato, non corretto automaticamente

Un INSERT HTTP/PostgREST di candidate RCJAZ accettato/exact, con URL valido, richiama `trackdash_auto_enroll_rcjaz_candidate` -> `trackdash_enroll_rcjaz_endpoint`. L'helper è **SECURITY INVOKER** e tenta INSERT/ON CONFLICT UPDATE su market_scan_endpoints. Nel catalogo Production `service_role` ha UPDATE e EXECUTE helper ma **non INSERT**, neppure a livello delle sette colonne necessarie. Il rilievo `has_table_privilege`/`has_column_privilege` conferma false; la fixture che riproduce le ACL risponde **42501 permission denied for table market_scan_endpoints** e annulla l'INSERT candidate.

È una incompatibilità nativa/legacy già presente, non introdotta dalle cancellazioni P06. Il PASS owner dello staging non copriva questo percorso. Impatto: un writer service_role può fallire accettando un candidate RCJAZ che deve iscrivere un endpoint, anche con dati non eBay.

Correzione minima **candidata, solo descritta, NON applicata e NON verificata come fix**:

```sql
GRANT INSERT (release_id, source_id, endpoint_url, parser_kind,
              exact_release_verified, enabled, updated_at)
ON public.market_scan_endpoints TO service_role;
```

Richiede approvazione distinta, audit del caller e nuova prova completa INSERT/ON CONFLICT con ruolo reale: non si presume sufficiente senza esecuzione. Nessun grant di DELETE, nessuna policy RLS o modifica SECURITY DEFINER proposta. Non viene inserita automaticamente negli SQL di rilascio. Il nuovo gate resta rosso finché l'incompatibilità non viene davvero risolta e il catalogo atteso aggiornato mediante revisione; non si trasforma42501 in un PASS globale.

### Cancellazione, controlli e lacune operative

PASS locale, PostgreSQL17.6/PostgREST13.0.7 reali con JWT sintetici dei ruoli dedicati: duplicato concorrente -> una inbox; interruzione dopo erase con compute fallito -> stato erased/outbox durevoli; lease scaduto -> ripresa concorrente/completamento; publish precedente all'erase -> PT409; vecchio writer e tentativo di riabilitare point soppressi. Prezzo EUR9999 conservato ma escluso dal calcolo canonico, confronto con controllo privo di quella evidenza; aggregato EUR26 conservato senza campo seller. Release estranea conserva pubblicazione SOLD EUR80, vendita e digest notifiche invariati. Ingress/monitor/anon/authenticated non leggono direttamente tabelle non concesse. A1 originale e controllo negativo restano invariati, non sostituiti dal test nuovo.

**BLOCKED gestito HTTP:** l'ambiente connesso non dispone dei JWT scoped di ingress/worker/monitor né dei token endpoint di test. Non vengono lette/esportate credenziali esistenti per aggirare il limite. Firma e rifiuto credenziali sono provati dalle suite sintetiche già presenti, non da una nuova chiamata webhook gestita/live. PGRST303 resta distinto, senza sostituzioni speculative.

**BLOCKED Actions notifiche:** il connettore non espone le impostazioni private di notifica/delivery (lettura endpoint permissions rifiutata); nessuna attivazione schedule né invio dedicato di allarmi; la ricezione di eventuali notifiche native del nuovo fallimento CI non è verificabile da questo accesso. Serve operatore iscritto e prova autorizzata di ricezione reale prima del GO. Restano aperti senza attenuazioni la perdita inbox/tombstone dopo restore precedente all'ACK e il trigger GitHub condiviso senza dead-man esterno.

**Vault:** nessun ulteriore tentativo globale di revoca. Il report gestito mostra che il precedente comando da non-owner non certifica la revoca dei grant supabase_admin. Isolamento dei tre ruoli dedicati PASS nelle prove disponibili; posture legacy service_role, recuperabilità chiavi, log provider e backup restano gate operativi, non risultati impliciti della facciata locale.

### File, validazione e costo di questa verifica

Modificati soltanto questo rapporto, `scripts/p06-postgrest-isolated.mjs` (opzione fixture, default precedente conservato), `scripts/test-ebay-erasure-final.mjs` (esecuzione gate aggiuntivo); aggiunti snapshot, loader e `scripts/test-ebay-erasure-native-triggers.mjs`. Nessun file runtime/migrazione/workflow/package modificato. Nessuna variazione Market Method, TTL, frequenze, batch, Catalogo/Collezione o ruoli.

Risultati aggiornati sul commit finale e link CI sono riportati nella descrizione PR per evitare uno SHA autoreferenziale nel commit. Un branch check fallito sul nuovo42501 è un **FAIL di compatibilità**, non un certificato verde; Typecheck/verify e suite precedenti restano risultati distinti. Prerequisito di pubblicazione: risolvere il grant RCJAZ con autorizzazione separata e completare i controlli gestiti/operativi sopra. La PR resta pronta alla lettura delle evidenze, **bloccata per signoff/rilascio**.

Costo della sessione: **nessuna nuova risorsa, chiamata worker Vercel o servizio a pagamento**; solo SELECT catalogo/metadata remoti e laboratorio locale. Nessun costo infrastrutturale aggiuntivo impegnato; non è misurazione della fattura provider o del credito incluso residuo. Il dato Vercel precedente (~USD2,71 effective con piano pro-rata, ~USD0 billed nel periodo) non equivale a saldo20USD: ricontrollare headroom e quote prima di qualsiasi futura attivazione. La frequenza proposta sopra rimane inattiva e una stima, non consumo attuale.

Misura laboratorio per il nuovo gate:30.837ms complessivi incluse DDL/seed/cleanup e138 richieste HTTP locali. Non è latenza webhook o previsione CPU Production. `pnpm verify` e Typecheck separato PASS; nuovo gate exit1 esclusivamente per `RCJAZ_HTTP_SERVICE_ROLE_INSERT_DENIED`, dopo il completamento delle altre prove.

| Verifica locale di questa sessione | Esito |
| --- | --- |
| `pnpm verify` e `pnpm typecheck` separato | PASS exit0; inclusi prezzi, Release, Catalogo/Collezione, scanner, SEO e UI nei test sintetici esistenti; nessun test browser/live aggiuntivo |
| `pnpm ebay:erasure:postgres:test` | PASS exit0 |
| `pnpm ebay:erasure:e2e:test` | PASS exit0, incluso A1 originale senza modifiche |
| Suite final preesistente (minimizzazione, acceptance/restore, monitor) | PASS exit0 prima del collegamento del nuovo gate; codici runtime invariati |
| Nuovo test nativo autonomo | FAIL exit1 esclusivamente RCJAZ42501; tutte le altre fasi completate |
| Comando `pnpm ebay:erasure:final:test` dopo collegamento | Verificato anche `node scripts/test-ebay-erasure-final.mjs` integrato: exit1 esclusivamente al nuovo gate, dopo tutti gli altri PASS; CI esegue questo collegamento. I successivi acceptance/monitor della catena non vengono raggiunti in quel run CI: sono PASS separatamente nel run locale precedente |
| Controllo negativo A1 | PASS del controllo: exit1, assert `true !== false` alla riga32 originale quando si disabilita deliberatamente la sola protezione nel laboratorio; codice invariato |
| `git diff --check` | PASS sul diff pubblicato |


## Verifica del GRANT RCJAZ in fixture — 17 ottobre 2026

**Perimetro ridotto:** questo aggiornamento risolve *nel laboratorio e nella fixture CI* l'unico errore RCJAZ `42501` riscontrato sul commit `386523414dc611577ba996b21c50f06cbf42bb94`. Non risolve né sostituisce automaticamente le restanti verifiche di cancellazione eBay. La sezione di audit sopra documenta storicamente il FAIL della baseline Production, che è ancora reale finché il grant non viene applicato separatamente sul database gestito.

**Evidenza gestita:** nella staging Supabase Free esistente, con funzioni RCJAZ originali di Production e `SET LOCAL ROLE service_role`, la transazione `BEGIN/ROLLBACK` ha verificato PASS: inserimento candidato/endpoint, aggiornamento `ON CONFLICT DO UPDATE`, assenza di duplicati, controllo negativo URL eBay, nessun INSERT concesso ad `anon`, `authenticated` o ai tre ruoli P0.6A. Il primo tentativo del test aveva scoperto soltanto ACL di default troppo permissive sulle tabelle sintetiche appena create; il secondo ha esplicitamente revocato tali privilegi e verificato la baseline reale prima di applicare il grant minimo. Tutti i dati sintetici e le modifiche di prova sono stati annullati; Production ha tuttora `service_role INSERT=false`.

**Modifiche GitHub limitate:**
- Nuovo file `proposals/p06a-rcjaz-scoped-insert.review.sql`, marcato REVIEW ONLY: solo il GRANT INSERT sulle sette colonne necessarie a `service_role`, senza CREATE/ALTER POLICY, revoche o permessi DELETE, e non collegato alle migrazioni P0.6A o al deploy.
- `scripts/test-ebay-erasure-native-triggers.mjs`: verifica prima l'effettivo `42501` con ACL congelate di Production; prova l'assenza di inserimento parziale; applica **solo alla fixture isolata** la proposta SQL; verifica le 7 colonne, il mancato accesso ad altre colonne e ruoli, l'INSERT via PostgREST con JWT service_role, il conflitto UPDATE, l'unicità e il controllo negativo eBay. Non disabilita i trigger e non usa l'owner come sostituto del caller HTTP. Il test continua poi tutte le fasi native di erasure, prezzi e ruoli.

**Significato dell'eventuale CI verde:** verde = comportamento atteso di P0.6A con il grant **proposto** applicato nell'ambiente sintetico di test. Non significa che la configurazione attuale di Production funzioni, né che sia stato autorizzato quel grant, né chiude i BLOCKED gestiti o i due rischi operativi (restore pre-ACK, schedule GitHub senza dead-man). Non dichiarare A2–A5 chiusi. Nessun deployment, merge, nuove risorse, scanner o costi di infrastruttura attivati.

**Rilascio differito:** dopo verifica indipendente e consenso esplicito sulla sicurezza di `service_role`, applicare il grant solo con una **autorizzazione separata** e dopo aver verificato il caller effettivo. Rileggere quindi le ACL reali, eseguire smoke test HTTP non distruttivo in ambiente autorizzato e rieseguire gli allarmi prima di considerare il GO. Il ramo rimane Draft e Production NO-GO.

**CI:** gli esiti finali verificati sullo SHA GitHub aggiornato vanno registrati con il relativo run/check; i precedenti FAIL rimangono evidenza della baseline senza grant, non della soluzione con grant proposto.
