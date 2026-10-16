# P0.6A — recupero automatico implementato, non attivato

> Preflight finale: `P06A_PREFLIGHT.md`. Rilascio bloccato da reintroduzione ingestion dimostrata, indipendenza operativa non implementata e gate schema/runtime/DR. Il meccanismo locale non è una garanzia operativa già attiva.

Il piano precedente è stato implementato localmente. SQL, prove, costi, limiti e sequenza di rilascio sono in `P06A_REVIEW.md`. Nessun worker, cron, servizio, chiave o migrazione Production attivato. La Draft PR è una richiesta di revisione, non un'autorizzazione al rilascio.

- Inbox persistente cifrata prima della prima modifica, HMAC versionato per idempotenza, decrittazione autenticata e purge del ciphertext al commit erase.
- Cancellazione atomica e dipendenze ricalcoli persistenti: crash prima/dopo commit e dopo claim recuperabili senza consegne eBay successive.
- Consumer dedicato preparato, claim con token/lease, next_attempt_at/backoff persistenti e limite dei fallimenti consecutivi. Non basta più il solo helper del vecchio piano: received conserva dati recuperabili cifrati.
- Fencing per Release/condition anche sui publisher ordinari; nessuna modifica alle formule e nessun ricalcolo inutile dopo cancellazioni non pertinenti.
- Allarmi overdue/exhausted/heartbeat persistenti, consegna con acknowledgment e retry limitati. Le pendenze e gli allarmi non consegnati rimangono salute non sana. Monitor indipendente ed osservazione esterna necessari anche se worker, DB o sink sono indisponibili.
- Entrypoint di worker/monitor disabilitato per default. Non viene aggiunto un cron né avviato un processo permanente; il futuro scheduler durevole e il destinatario allarmi richiedono approvazione e verifica operativa prima di abilitare il webhook.

Decisioni non attivate: provisioning/rotazione dei segreti dedicati, retention di inbox/ledger e backup, frequenza/SLA e budget del recupero, provider di scheduling e monitoraggio esterno. Il meccanismo non garantisce il recupero di notifiche mai registrate per indisponibilità antecedenti all'inbox commit; non identificare notifiche storiche dai successivi conteggi a zero.
