# P0.6B — letture minime del report Admin

Base verificata: GitHub main e Vercel Production READY f8e27c0f72458a4daeac7e98323981fb0cfeb4ce. Branch dedicata: fix/p06b-admin-read-grants-20261016. Questa PR contiene solo P0.6B; nessuna migrazione remota è stata applicata. Nessun merge o rilascio Production autorizzato.

## Problema e modifica

Mini4wdSoldRecoveryAudit chiama getAdminMini4wdSoldRecoveryAction, protetta da requireAdmin/MFA. Il report server usa createAdminClient con ruolo effettivo service_role. La query categories legge id e filtra slug; products legge id/name/metadata e filtra category_id. Anche le colonne nei filtri richiedono SELECT.

La proposta di migrazione `proposals/p06b-admin-read-grants.sql` contiene esclusivamente:

```sql
GRANT SELECT (id, slug) ON public.categories TO service_role;
GRANT SELECT (id, name, metadata, category_id) ON public.products TO service_role;
```

Nessun privilegio generale di tabella, DML, modifica RLS/policy, client, credenziale o logica del report. Gli altri quattro insiemi di dati usati dal report hanno già SELECT secondo l'indagine read-only approvata. Questi grant non correggono errori PGRST303/credenziali dell'altro incidente e non dipendono dalla P0.6A.

## Verifica e CI

`pnpm verify`, Typecheck e `pnpm admin:grants:postgres:test` verificati localmente. Il test rifiuta ogni variazione del SQL rispetto ai due grant esatti prima di accedere al database.

PostgreSQL 17.6 isolato con --network none e nessuna porta esposta, dati sintetici e database effimero. Il test esegue il vero getMini4wdSoldRecoveryReport/classifier sostituendo solo il trasporto Supabase con query SQL reali SET ROLE service_role. Senza grant fallisce categories; con il solo primo grant fallisce products; con entrambi il report restituisce la Release sintetica e il SOLD/classificazione attesi. Colonne extra, SELECT * e scritture restano negate; esattamente sei privilegi SELECT di colonna, ACL di tabella degli altri ruoli e policy/flag RLS invariati.

La CI branch-verify esegue lo stesso test dopo pnpm verify, riutilizzando installazione/dependencies. Immagine PostgreSQL fissata per digest, container senza rete e cleanup finale. Nessun job scanner, cron, build Next o servizio esterno aggiunto. `vercel.json` disabilita il deployment automatico solo per la branch esatta P0.6B; tutte le altre regole restano uguali. Non serve una Preview per una correzione di soli privilegi senza codice applicativo.

Limiti: fixture minima, non clone integrale di Production né test UI/MFA autenticata. I grant di colonna non limitano privilegi eventualmente già più ampi o ereditati: il preflight sul database destinazione resta obbligatorio. Nessun accesso operativo al report Production è stato eseguito.

## Procedura di applicazione futura — nuova approvazione obbligatoria

1. Identificare progetto/database corretto e commit della PR approvato. Non eseguire indiscriminatamente tutte le migrazioni locali pendenti. Questo SQL è un artefatto reviewabile in proposals, intenzionalmente fuori dal percorso di applicazione automatica.
2. Fotografare in sola lettura ACL di tabella/colonna, privilegi effettivi/ruoli ereditati e RLS/policy su categories/products. Controllare anche SELECT delle altre tabelle del report. Se il baseline diverge dai presupposti, fermare l'applicazione e riesaminare.
3. Prima della Production ripetere le prove su clone isolato dello schema corrente. Verificare che solo id/slug e id/name/metadata/category_id diventino leggibili e nessuna scrittura o altro accesso venga aggiunto.
4. Dopo autorizzazione esplicita, registrare la migrazione con il normale workflow del progetto. Per un file CLI usare `supabase migration new p06b_admin_column_reads` e copiare esattamente i due statement revisionati nel file generato; ricontrollare elenco/stato delle migrazioni prima di qualsiasi applicazione. La CLI locale attuale non può inizializzarsi nel suo percorso di configurazione read-only; nessun nome numerato è stato inventato. È ammesso solo il workflow di applicazione specificamente approvato, con tracciamento della migrazione.
5. Applicare i due grant come un'unica transazione. Ricontrollare le sei colonne con has_column_privilege, le altre colonne dell'intero schema reale, ACL DML e RLS/policy rispetto allo snapshot precedente; quindi verificare il report Admin autenticato normalmente. Nessuna modifica alle credenziali per far passare il test.
6. Nessuna build/deployment dell'app è necessaria per rendere effettivi i grant. Un eventuale rollback deve revocare soltanto i privilegi introdotti da questa migrazione, documentati nel preflight, senza toccare grant preesistenti o RLS.

Costo: modifica di metadati, nessun backfill, scansione dati, coda o cron nuovo; il report esegue le query esistenti. Rilasciare B indipendentemente prima di A, soltanto dopo le rispettive autorizzazioni.
