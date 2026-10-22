> **Esempio Poseidon-X aggiornato 22 ottobre 2026:** il [nuovo audit fotografico](POSEIDON_X_FAMILY_AUDIT_2026-10-22.md) corregge il precedente esempio storico: originale1993 ITEM49568/JAN4950344495689; ristampa2006 ITEM94584/JAN4950344945849. Identità e foto originali trovate, proposta dati salvata ma NON ancora applicata (accesso scrittura bloccato). La sezione di esempio in fondo conserva il punto di partenza del vecchio audit, non la nuova conclusione storica. Non duplicare gli UUID né dichiarare completata la pubblicazione.

# TrackDash — Inserimento e completamento di famiglie e Release

Aggiornata: 22 ottobre 2026. Procedura operativa da applicare autonomamente quando Sebastiano chiede di inserire o completare una famiglia. Integra il [Metodo Master](TRACKDASH_METHOD_MASTER.md) e rende esplicite le regole attuali che sostituiscono le vecchie istruzioni incompatibili. Non è una dichiarazione che una famiglia sia già completata.

## 1. Riprendere lo stato reale prima di inserire

- Leggere Metodo Master, [Project State](TRACKDASH_STATE.md), [Operations](TRACKDASH_OPERATIONS.md), audit della famiglia e ultimo checkpoint di ripristino: [Creativeweb, 21 ottobre](recovery/creativeweb-staged-2026-10-21.md).
- Verificare branch, commit realmente online tramite `/api/version`, progetto Supabase attivo e dati canonici. Gli snapshot datati non provano lo stato odierno; il branch di ripristino può essere avanti a Production e diverso da `main`.
- Consultare Product, Release, UUID, fonti, immagini, identificativi, Collection/Wishlist, segnali e code già esistenti. Completare ciò che manca preservando ciò che è corretto; non reinserire una famiglia già presente né rigenerare gli UUID.
- Operare sul nuovo Supabase Frankfurt `uhojhqxnzrolmnopwgpy`. Conservare intatto il vecchio progetto. Mai segreti o dati personali nei report.
- Individuare cosa è già autorizzato: la guida non autorizza da sola merge, deployment, cambio di visibilità o invio notifiche. Preparare e verificare tutto il lavoro consentito; chiedere soltanto accessi o autorizzazioni realmente mancanti, senza ripetere quelle già ricevute.

## 2. Ricostruire tutta la famiglia

Cercare originali, ristampe, Premium, Black/Color/Metallic/Clear Special, limited, eventi, anniversari, collaborazioni e varianti regionali. Fonti: Tamiya e cataloghi/archivi ufficiali, fonti contemporanee affidabili, negozi specializzati; marketplace come ulteriore prova. Registrare URL, data di verifica e campi effettivamente dimostrati.

Per ogni candidata compilare: famiglia, Item Number, JAN/alias, edizione, anno/data, chassis, colore, mercato, tipo di Release, stato produttivo, rarità documentata e discriminanti fisici. Distinguere kit completi, carrozzerie/accessori, componenti e confezioni multiple. Un accessorio non diventa una Release del kit.

- Stesso Item/JAN/specifiche senza differenze fisiche verificabili: una Release, con successive production waves/restock documentate.
- Item riutilizzato: separare generazioni solo con prove e discriminanti reali. Anno stampato sullo stampo o titolo del venditore, da soli, non identificano una tiratura.
- Dato non dimostrato: sconosciuto/parziale. Non indovinare JAN, giorno di uscita, MSRP europeo, rarità o produzione interrotta. La scarsità di annunci non dimostra rarità né cessata produzione.

Preparare una matrice per TUTTE le Release, comprese quelle non pubblicabili. Non limitarsi a una sola edizione di esempio.

## 3. Inserimento canonico e identificazione scanner

- Riutilizzare Product e Release corretti, chiavi stabili e UUID; aggiungere soltanto le nuove identità. Controllare conflitti, duplicati e riferimenti esistenti.
- Inserire provenienza per campo in `release_sources`, identificativi verificati in `release_identifiers`, descrizioni IT/EN e stato di verifica. I campi compatibili del Product derivano dalla Release canonica secondo i trigger esistenti.
- Usare migrazioni nuove, mirate e ripetibili; non riscrivere seed/migrazioni già applicate né sostituire l'intero catalogo da un seed storico incompleto.
- Verificare JAN con checksum e fonte, alias e Item Number nel normale scanner TrackDash. Un codice condiviso o ambiguo deve portare alla selezione/revisione corretta, non a un'assegnazione arbitraria. Nessun JAN inventato per sbloccare l'automazione.
- Eventuali correzioni di identità devono preservare copie, desideri, prezzi pagati, note, foto personali e collegamenti utente. Documentare le riconciliazioni necessarie prima di applicarle.

## 4. Ricercare e collegare subito la foto esatta

Ricercare per ciascuna Release: Tamiya/archivi, fonte contemporanea o retailer exact-product, poi immagini marketplace con match forte. Esaminare davvero l'immagine e confrontare Item/JAN, edizione, colore, chassis e scatola. Classificare `EXACT VERIFIED`, `HIGH-CONFIDENCE MATCHED` oppure gap motivato.

- Salvare l'associazione in `release_images` per quella precisa Release, con URL pagina sorgente e motivazione nell'audit/provenienza; usare manifest/seed solo dove richiesto dal percorso di catalogo esistente.
- `product_images` serve come rappresentazione della famiglia, non come prova della foto di ogni edizione. Il resolver corrente `lib/images/resolve.ts` ammette nella vista Release soltanto la sua foto esatta, altrimenti placeholder. Il vecchio fallback Product → Release descritto in `IMAGES_MVP.md` è superato.
- Verificare HTTP/asset, formato e dimensioni, stabilità dell'URL, identità visiva e rendering attraverso Next Image. Aggiungere eventuale host/path strettamente necessario alla configurazione, dopo aver letto le istruzioni Next installate. Registrare soltanto termini d'uso realmente conosciuti, senza inventare licenze.
- Se manca la foto, effettuare un secondo passaggio mirato; conservare il placeholder quando il match rimane dubbio. Mai riutilizzare una sorella/ristampa per riempire il vuoto.
- Controllare famiglia, card Release, dettaglio, scanner, Collection e PWA sulla stessa associazione canonica. Una foto di una copia personale non diventa automaticamente una foto pubblica di catalogo.

## 5. Initial Market Audit reale, durante lo stesso incarico

Iscrivere una Release in coda NON significa averla scansionata. Cercare ed eseguire il primo controllo sulle fonti supportate, con batch contenuti. Registrare per ogni fonte esito, data, esecuzione effettiva ed eventuale blocco. Un canary tecnico non prova ingestione; una richiesta HTTP riuscita non prova un'offerta accettata.

1. **Offerte correnti:** eBay Active e retailer exact-product supportati. Verificare Release, condizione nuovo/completo, prezzo articolo, valuta, spedizione realmente documentata, disponibilità e provenienza geografica. Salvare le pagine exact, non categorie/search come endpoint di acquisto.
2. **Vendite concluse:** cercare transazioni verificabili tramite fonti effettivamente accessibili e consentite. Conservare prezzo, valuta, data/periodo, quantità dimostrata e attribuzione alla Release. Deduplicare transazioni e finestre sovrapposte. Il Browse API eBay dà offerte attive: non equivale a una sorgente SOLD automatica.
3. **Storico:** MSRP, listini vecchi, pagine già esaurite e riferimenti datati restano storico. Non sostengono un'offerta corrente. Disponibilità reale prevale su metadata obsoleti: per esempio JSON-LD `InStock` non supera un checkout con quantità zero/non disponibile.
4. **Stock esaurito:** la transizione osservata in-stock → out-of-stock può essere registrata come evento di disponibilità, senza inventare prezzo pagato, data della transazione o numero vendite. Non inserirla come SOLD confermato senza prova della transazione.

Applicare matching, deduplica listing/venditore/merchant, Price Guard e pipeline correnti. Un candidato `needs_review` non è un'offerta accettata. Per Item condivisi verificare edizione/JAN/packaging: non assegnare automaticamente alla prima Release.

Ricercare anche RCJaz per Item esatto e documentare endpoint utili, ma distinguere ricerca da eseguibilità. Fonti `planned`/`manual`, endpoint non verificati, 403/challenge o API non autorizzate restano bloccati/limitati; non abilitarli come `ready`, aggirare i blocchi o dichiararli operativi. Amazon e nuove fonti richiedono prima un accesso supportato verificato. Nessun servizio a pagamento.

## 6. Ricalcolo canonico, valori e trend

- Alimentare le tabelle di evidenza previste e la coda esistente; eseguire il recompute canonico per ogni Release inserita/completata. Verificare il segnale `new_complete_unbuilt`, metodo corrente, `computed_at` ed esito della coda. Anche un segnale correttamente NULL deve risultare realmente calcolato.
- **Market Value:** soltanto il risultato pubblicato dalla policy canonica, mai una cifra scritta a mano per riempire la scheda. Il retail europeo usa gli stessi merchant comparabili per anchor, requisiti di pubblicazione e confidenza. Le offerte giapponesi restano contesto: non forniscono il secondo merchant europeo né sopprimono una stima europea valida.
- **Vendite concluse:** una singola vendita attribuibile può essere un riferimento visibile, senza diventare automaticamente MV. Non gonfiare i conteggi o confondere SOLD e offerte di negozio.
- **Prezzo richiesto:** usare la proiezione esistente, solo kit: un venditore → sua richiesta minima valida; due o più → mediana con un voto per venditore. Le offerte internazionali sono ammesse in questa statistica con provenienza corretta. Non ripristinare le vecchie regole “almeno tre venditori” o filtro UE della mediana. La quotazione acquistabile Wishlist mantiene la propria semantica separata.
- **Recenza:** marketplace 15 giorni, retail 31 giorni per lo stato corrente; un prezzo ancora visibile su una pagina esaurita non è disponibile. La cadenza di scansione non prolunga la TTL.
- **Trend:** richiede storico confrontabile. Non dedurlo da un solo prezzo né dal prezzo pagato dall'utente. Preservare l'ultimo movimento materiale confermato quando un recompute non trova nuovo movimento; il trend ASK resta separato e usa snapshot con la stessa `basis_version`. Dove la UI mostra due medie SOLD, verificare medie, conteggi, finestre e coerenza con il segnale persistito. Nessuno storico → nessun trend numerico inventato.
- Conservare UI e diciture già strutturate. Collection/Dashboard usano la medesima regola corrente per copie sigillate: MV, poi riferimento SOLD, poi ASK corrente qualificato; il guadagno personale resta legato al MV. Non applicare moltiplicatori arbitrari alle condizioni.

Se il mercato resta vuoto, eseguire l'**Empty Market Challenge**: secondo passaggio su marketplace, retail, SOLD e regioni rilevanti, documentando perché ogni risultato è valido, storico, esaurito, condizione sbagliata o edizione ambigua. Distinguere “ricerca conclusa senza prove utilizzabili” da “fonte non accessibile”: il secondo è un limite aperto, non prova di assenza di mercato.

## 7. Refresh automatico e controllo salute

- Verificare realmente enrollment e readiness di fonte/endpoint/Release, coda abilitata quando sicura, ultimo tentativo, ultimo successo, errori e prossimo controllo. Un record di compatibilità non eseguibile non conta come copertura.
- Mantenere la pipeline già esistente: nuove evidenze → recompute → proiezione condivisa → superfici pubbliche/utente. Health Watch controlla salute e copertura; acquisizione e ricalcolo avvengono nei worker. La presenza del monitor non dimostra che una Release sia stata processata.
- Snapshot operativo del ripristino, da riconfermare al prossimo intervento: unico clock GitHub orario, batch massimo 2 retail + 1 eBay Active + 4 recompute, scheduler Vercel duplicato disabilitato. Non aggiungere un cron per famiglia né attivare due sistemi in parallelo.
- Cadenze attuali: eBay con ASK recente HOT/NORMAL/COLD 7/10/12 giorni; senza ASK 14/30/45; retail 28/42/84. Lasciare distribuire il lavoro e rispettare le quote. L'initial scan può richiedere un'attivazione mirata una tantum, non il reset globale delle scadenze.
- Non dichiarare automatico il SOLD finché manca una sorgente autorizzata, funzionante e collaudata. Conservare i limiti e verificare la consegna notifiche Health Watch prima di promettere alert.

## 8. Pubblicazione, QA e chiusura

Applicare il [Release Publication Gate](RELEASE_PUBLICATION_GATE.md): identità sufficientemente verificata + almeno una foto exact/high-confidence O un'evidenza di mercato credibile e attribuibile. MV consolidato non obbligatorio. Identità dubbia, oppure assenza sia di foto sia di evidenza → `research_only`, conservata per ricerca. Una Release può essere pubblicabile e avere ancora un gap di foto/mercato documentato; non dichiarare completa tutta la famiglia per questo.

Prima dell'attivazione preparare un diff mirato, migrazioni e conteggi attesi; verificare catalogo/UUID/identificativi, immagini, matching, pipeline, mercato, trend e assenza di regressioni. Eseguire i controlli pertinenti e il gate di repository `pnpm verify` sul codice esatto destinato al rilascio. Controllare IT/EN, canonical/hreflang, sitemap e assenza di indicizzazione delle Release research-only.

Rilasciare solo entro le autorizzazioni della sessione. SQL necessario → codice compatibile → build READY → verifica commit online → attivazione visibilità quando prevista e autorizzata. Un lavoro solo dati non richiede un deploy di codice inutile. Se la famiglia è già available, non ripetere il passaggio coming_soon → available. Verificare il trigger esistente di notifica famiglia, evitando duplicati e notifiche di test agli utenti.

Dopo l'attivazione controllare realmente: foto e dettagli, valori/dicitura, scanner, Catalogo, Collection/Dashboard, Wishlist e PWA; stesso UUID e stessa proiezione canonica. Riportare separatamente i test pubblici e quelli autenticati effettivamente eseguiti. Un HTTP 200 non certifica login o interazioni private.

Aggiornare audit famiglia, conteggi ricercate/pubbliche/research-only, gap foto/mercato, stato fonti e code, test eseguiti, commit/deployment ove presenti e prossima azione. Aggiornare Project State e Operations se cambia il comportamento. Non dichiarare completamento se il risultato esiste soltanto nella chat.

Matrice minima per ogni Release:

| Identità/UUID | Foto e fonte | Status/rarità | Audit iniziale/esito | SOLD/ASK/MV | Trend e base | Scanner | Refresh e blocchi | Visibilità | QA e gap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| dati verificati o mancanti | exact/high-confidence/gap | prove o unknown | eseguito, data o limite | evidenze distinte | storico valido o assente | JAN/alias/ambiguità | readiness e ultimo successo | public/research_only | test effettivi e lavoro residuo |

## Esempio già inserito: Poseidon-X

Leggere l'[audit Poseidon-X](POSEIDON_X_FAMILY_AUDIT_2026-10-10.md) e le migrazioni 0218–0222; verificare nuovamente il DB prima di proseguire. È un esempio documentato, non una nuova verifica live del 22 ottobre.

- Item 94584: originale 1993 e ristampa 2006, UUID distinti già esistenti. Non duplicarli e non assegnare il JAN 2006 all'originale.
- 2006: JAN 4950344945849, foto exact/high-confidence collegata alla sola ristampa, pubblicazione già avvenuta. Uno scan iniziale reale e recompute erano stati eseguiti; la mancanza di offerte accettabili non va risolta assegnando l'annuncio ambiguo a caso.
- 1993: conservata `research_only` nell'audit per mancanza sia di foto esatta sia di mercato attribuibile; proseguire sulle prove mancanti. Non mostrarle la foto 2006.
- 94076/94817 sono carrozzerie/accessori; 94583 è un box multiplo. Non contarli come kit standalone della famiglia.

Questa famiglia è quindi un caso di pubblicazione parziale: completare i gap documentati prima di affermare che tutte le sue Release siano pubbliche o complete.
