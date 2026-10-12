## UNIFORM CATALOG MARKET REFERENCE — 2026-10-12

The two-row Catalog Release preview must agree with the Collection and Release detail about source semantics.

1. **Riferimento mercato** / **Market reference**: published, canonical `valueEUR` has priority. If MV is null but `soldAnchorEUR>0` and `soldUnits>0`, display `≈ SOLD anchor` as a **documented completed-sale reference**, with the count in the SAME first-row header area and a concise `riferimento, non stima` caption. One real sale is a clue, not a market-wide valuation. No sale/MV means `—`.
2. **Prezzo richiesto** / **Asking price**: a separate, automatically updated seller request (single seller or seller-deduped median) selected by the existing projection, or a clearly dated historical asking price. SOLD is **never** displayed as an ASK; a badge for SOLD is never visually placed underneath the ASK row.
3. ALL Releases preserve the same two price slots and design, whether both, one or neither data sources exist. DO NOT manipulate canonical Market Value, widen price gates, or use ASK to invent SOLD.
4. Reference text is descriptive only and does NOT influence the Collection's sealed-only indicative total, canonical Market Value, Wishlist buying quote, estimated gain or scan cadence.

Audited #92280 Neo-Tridagger ZMC Next (Smoke): 1 accepted ended Yahoo Japan auction (JPY 9000, Feb 8 2026, EUR 48.58 SOLD-only reference), 0 current ASK, null canonical MV. The Catalog first slot should show `≈ 48,58 € · 1 vendita conclusa, riferimento, non stima`, and the asking slot `—`.

---

## REGRESSION: EBAY LISTING KEY MUST CAPTURE NUMERIC ID (2026-10-12)

The representative seller median builds unique listing identities from `market_candidates.external_listing_id` / `source_record_key`. Normalize different eBay ID formats using a **captured** 12-digit ID (`([0-9]{12})`) and stable `ebay:ID` key. Bare `ID`, `v1|ID|0`, `ebay:v1|ID|0` must map to the same listing; *different* IDs must always remain distinct. Never index `regexMatch[1]` if the regex lacks a capture group, or all listings will share `ebay:undefined` and median seller count collapses to one.

Audited live #95466: 11 current exact eligible offers from 9 sellers, 16.13 EUR one-sale reference, representative **32.67 EUR** asking median (9 sellers). The temporary diagnostic was removed; no change to canonical Market Value, Wishlist purchase quote, Collection valuation, or Market Method v4.


---

## PREZZO RICHIESTO — REGOLA AGGIORNATA 2026-10-12 (SUPERSEDE LA SOGLIA 3 / EUROPE-FIRST QUI SOTTO)

**Principio definitivo:** `Riferimento mercato` e `Prezzo richiesto` sono due grandezze distinte. Il primo è MV consolidato o riferimento esplicito da vendite concluse; il secondo misura **quanto chiedono i venditori**, non quanto viene realmente pagato. Non imporre all'ASK i gate di conferma geografica o numero vendite usati dal Market Value.

**Regola automatica, sul campione disponibile di venditori identificati:**
- **0 venditori correnti verificabili:** nessun nuovo ASK rappresentativo (`null`/—); un precedente riferimento storico può continuare a comparire **solo se esplicitamente datato e segnalato come non verificato** dalla presentazione già esistente, senza fingere che l'annuncio sia attivo.
- **1 venditore:** mostra il **prezzo richiesto osservato** di quell'unico venditore; se ha più annunci validi, prendi la sua richiesta minima. Etichetta `Prezzo di 1 venditore`, mai `mediana`.
- **2 o più venditori indipendenti:** **mediana** in centesimi interi dei prezzi del solo kit, un voto per venditore; con 2 è la media aritmetica dei loro due prezzi. Etichetta `Mediana di N venditori`.

Gli annunci **globali ed extra-UE sono inclusi** (non mischiare *regole di acquisto* con *statistica dei prezzi richiesti*). Comunicare la provenienza: se tutte le offerte provengono da fuori UE, `annunci extra-UE`; se le provenienze sono miste/sconosciute, `annunci internazionali / provenienza da verificare`. Solo campioni di annunci integralmente con origine UE verificata possono essere definiti `UE`. L'ASK è **solo kit**, senza importazione/spedizione; una mediana non ha una spedizione unica attribuibile.

Il dato segue la normale scansione eBay/retail, ricalcolato a lettura sullo stato corrente con TTL, senza nuovi cron né azioni manuali. Restano obbligatori matching alla Release esatta, kit nuovo/completo, candidato accepted, disponibilità verificata, seller e listing ID affidabili, deduplica per listing e seller, TTL e prezzi EUR validi. Nessuna modifica a Market Method v4, SOLD, MV, selezione ASK acquistabile di Wishlist, totale indicativo Collection, market offers o database. **Questa sezione sostituisce** la precedente richiesta di >=3 seller e il filtro Europe-first sulla *statistica di ASK visualizzata*, non le regole conservative di acquisto o di valutazione.


---

## PREZZO RICHIESTO RAPPRESENTATIVO — 2026-10-12 (ASK MEDIAN PROJECTION)

**Motivazione:** una singola inserzione giapponese da €13,39 non deve rappresentare l'intero asking market della Manta Ray Mk.II Black Special #95466 quando TrackDash osserva vari venditori, molti più costosi. L'ASK non è una vendita e non è un Market Value; nessuna formula deve "valorizzare" artificialmente una Release.

**Regola pubblica:** il secondo numero nelle card sempre uniformi si chiama **Prezzo richiesto**. Quando esistono **almeno 3 venditori distinti verificati** con kit nuovo/completo, Release esatta, annuncio accettato, disponibilità in stock e ultimo controllo entro la TTL corrente (15 giorni marketplace), il prezzo richiesto mostrato è la **mediana in EUR dei prezzi del solo kit, un voto per venditore** (per venditori con più inserzioni valide si considera la richiesta minima di quel venditore). Gli annunci duplicati tra marketplace e i record v1/legacy dello stesso ID non contano due volte. Mediana e arrotondamenti si calcolano in centesimi interi. Annunci non accettati/lotto/edizione ambigua/scaduti non entrano nel campione.

**Geografia Europe-first senza forzature:** preferenza esclusiva a prezzi con provenienza UE verificata o con origine ignota ma preventivo kit+spedizione verso l'Italia documentato per quella stessa offerta. Se c'è anche solo una quotazione EU-comparable non si mescolano i prezzi globali/extra-UE per forzare tre venditori; in tal caso si mantiene il singolo prezzo selezionato canonico o l'ultimo ASK storico con data. Solo in ASSENZA di un campione europeo, almeno tre venditori extra-UE possono produrre una mediana **informativa internazionale**, sempre con avviso extra-UE/spedizione e importazione escluse. Se mancano 3 venditori affidabili, le superfici mantengono il precedente riferimento singolo con data, mai un finto prezzo medio.

**Separazione permanente:** la mediana è prodotta a lettura dei `market_offer_states` persistiti, già alimentati dal cron eBay/retail; si aggiorna automaticamente dopo le scansioni e decade quando le osservazioni superano la TTL. Non scrive Market Method v4 / `market_release_signals`, ASK storico e trend, condizioni di Collection, selezione di acquisto della Wishlist né prezzi del venditore. `startingItemPriceEUR` e `observedMarketPrice` rimangono esattamente il riferimento canonico acquistabile con spedizione calcolabile; `representativeAskItemEUR` è una proiezione distinta, solo lettura, accompagnata da `sellerCount`, data e provenienza. Mai associare alla mediana la spedizione di una singola offerta. **Il totale della Collection resta basato su MV → SOLD → ASK canonico UE-comparabile**, non sulla mediana dei prezzi richiesti.

**Audit live 95466 (12/10/2026):** 11 inserzioni attuali, 9 venditori distinti (due venditori con inserzioni multiple), origine JP/US/MY, nessun preventivo spedizione Italia documentato: **mediana ASK internazionale €32,67** (non €13,39). Canonical SOLD anchor resta €16,13 da una sola vendita (NON MV). Nessuno di questi numeri è garanzia di realizzo.

---

## COLLECTION REFERENCE — REVISED 2026-10-12 (OVERRIDES EARLIER OCT 11 ASK FALLBACK)

The **Collection's indicative sealed-copy total** is a separate, transparent, *non-canonical* reference. It must never overwrite or derive the canonical `market_release_signals.market_value_eur` or per-copy personal gain. When a physical copy is **Sealed**:

1. Prefer the exact Release's published canonical **Market Value**, kit-only.
2. If MV is unavailable, accept the canonical exact-Release **SOLD anchor** with `sold_units > 0` as an **indicative completed-sale reference** even when it is one thin sale; it is **NOT** a new MV or an independently verified European selling price. The Collection summary counts these weak references separately.
3. If MV/SOLD are unavailable, use **only current, TTL-qualified, canonically selected ASK** when its origin is explicitly EU, OR when origin is unknown but the same offer carries a consistent item+shipping quote verified for delivery in Italy. Never use a known extra-EU origin as a European owned-kit valuation, even when delivery costs are only partly known.
4. **Never** use historical/expired ASK to value a copy. It remains visible and dated in the Release / Collection card as shopping context, not a portfolio calculation. Never promote sold references to canonical MV. No guessed shipping, import duty or condition-based multipliers.

Per-source tally `marketValueCount` / `soldReferenceCount` / `observedPriceCount` is exposed under the stable overall headline **Valore indicativo · copie sigillate**. Entries without safe evidence are excluded, not valued at zero. The returned total is an *evidence-based indicative reference*, not guaranteed resale income.

**Audited case, Oct 12 2026:** user's four Sealed Releases: 95467 Dyna MV €14.92, 95450 Proto-Emperor MV €12.72, 95466 Manta Ray exact 1 SOLD €16.13 (a Japan-origin €13.39 ASK without shipping does not set portfolio value), 95425 Avante 2018 re-release selected kit ASK €16.05 with verified €11.31 shipment to Italy (shipping excluded from portfolio value); indicative combined reference **€59.82** at this snapshot. Previous €57.08 was €14.92 + €12.72 + €13.39 + €16.05 and prioritized Japan-only ASK over a documented sale for 95466. Older ~€140 headline added some kit+shipping advertised asks and is not a comparable historical market collapse. Future scans can change the totals.

**UI terminology:** retain the identical two-price market layout everywhere; second label is **Prezzo richiesto** / **Asking price**, not Offerta sul mercato / Market offer. A quote can be lower than the completed-sale reference because seller asking and sold transaction are different measurements. Continue to indicate historical freshness and extra-EU shipping caveats separately.


---

# TRACKDASH — METODO OPERATIVO MASTER

> Mini 4WD vertical state / continuation index: `docs/MINI4WD_VERTICAL.md`
> Global runtime/project checkpoint: `docs/TRACKDASH_STATE.md`
> Gate pubblicazione Release: `docs/RELEASE_PUBLICATION_GATE.md`

Stiamo lavorando su **TrackDash**, piattaforma indipendente per collezionisti Tamiya Mini 4WD.
Questo documento definisce il metodo operativo permanente da utilizzare ogni volta che viene richiesto di:

- inserire una famiglia;
- completare una famiglia;
- scansionare una famiglia;
- aggiungere nuove Release;
- aggiornare il mercato di una famiglia.

Quando l'utente dice semplicemente:
**“Inserisci / facciamo / completa la famiglia [NOME]”**
devi applicare automaticamente tutto il workflow seguente, senza che l'utente debba ricordare ogni singolo passaggio.

---

# PRINCIPI FONDAMENTALI

## 1. Release esatta

TrackDash cataloga **Release**, non genericamente modelli.
Ogni Release deve essere identificata tramite il massimo possibile di:

- Item Number;
- JAN;
- anno/data;
- chassis;
- edizione;
- colore;
- release type;
- production status;
- fonti;
- immagini;
- storia produttiva.

---

## 2. UNKNOWN > INVENTED

Non inventare mai:

- Item Number;
- JAN;
- anno;
- data;
- foto;
- prezzo;
- SOLD;
- production status;
- rarità;
- differenze fra ristampe.

Se un dato non può essere dimostrato, mantenerlo sconosciuto/parziale e documentare il motivo.

---

## 3. Non essere inutilmente rigidi sul mercato

Vale anche il principio opposto:
**DATO REALE DISPONIBILE > “DATI DI MERCATO IN ARRIVO” CAUSATO DA REGOLE TROPPO RIGIDE**
Non aspettare arbitrariamente 5 o 10 SOLD prima di mostrare un'informazione utile.

**Regola del trend comprensibile in Collection (2026-10-11):** non mostrare più il `trendPercent` isolato o accanto al «Pagato» perché si può scambiare per guadagno personale. La Collection usa SOLO un confronto reale e attribuibile di **due medie SOLD**, già registrato in `market_aggregate_observations.raw_payload.trend_evidence` con le cifre medie precedenti e recenti, numero vendite, ampiezza delle due finestre e data dell'analisi. La proiezione pubblica normalizza e convalida **corrispondenza esatta con `market_release_signals.trend_percent`, `trend_window_months`, `trend_basis='sold'` e `trend_updated_at`**, più coerenza matematica (tollerando solo arrotondamenti). Le sole informazioni sintetiche convalidate attraversano il boundary server→client; raw audit resta privato. In anteprima: «Valore stimato · sigillato ≈ €14,92», «Prezzi medi delle vendite · due periodi di 3 mesi», «€12,45 → €14,92 ↑ +19,9%», «Confronto rilevato set 2026 · campione di un venditore» se pertinente; NON mostrare in questa card prezzo pagato né delta personale. Quando mancano medie SOLD verificabili non mostrare percentuali disancorate, neanche se il segnale canonico conserva il trend per altri usi. Non dedurre la base dal Market Value corrente, dal costo personale o da ASK. La logica del Price Engine v4, trend calcolato, persistenza delle direzioni e valutazione portafoglio restano invariati.

**Regola permanente di elasticità veritiera:** una vendita conclusa **recente, realmente osservata, correttamente attribuita all'edizione e alle condizioni della Release**, inclusa una singola vendita, è una prova di mercato utilizzabile e deve essere presentata come **Vendite concluse** (≈, con conteggio), anche se il Market Value canonico rimane NULL. Il numero minimo di vendite e la corroborazione sono gate della **stima Market Value**, non della **visibilità SOLD**. Non promuovere ASK, aste non aggiudicate, inserzioni ambigue, lotti, copie montate o ristampe non distinguibili a SOLD della Release esatta; non inventare costi di spedizione, dogana, quantità o cambio EUR. Conservare prezzi e provenienza in valuta d'origine e usare soltanto FX storici verificati. Nel dettaglio/anteprime mostrare ASK solo se l'offerta è ancora TTL-valida; non usare anchor retail/ASK memorizzati come fallback di offerte attuali.
Quando esiste mercato reale ma non ancora abbastanza robusto per un Market Value, utilizzare:
**Prezzo minimo richiesto \~€XX**

---

## 4. RESEARCHED NON SIGNIFICA PUBBLICATO

Una Release può essere reale e documentata ma non ancora sufficientemente utile per il catalogo pubblico.

Regola permanente:
- identità sufficientemente verificata + foto exact/high-confidence + mercato → PUBLIC;
- identità sufficientemente verificata + mercato credibile ma foto mancante → PUBLIC, continuare ricerca foto;
- identità sufficientemente verificata + foto exact/high-confidence ma mercato insufficiente → PUBLIC, mostrare il fallback mercato corretto;
- identità sufficientemente verificata + nessuna foto exact/high-confidence + nessun mercato credibile → RESEARCH_ONLY, conservare nel master/database ma non mostrare nel catalogo pubblico;
- identità ancora parziale/dubbia → non pubblicare finché non viene risolta.

Non è necessario un Market Value consolidato per superare il gate; è sufficiente un segnale di mercato reale e attribuibile alla Release esatta. Un listing ambiguo non basta.

La visibilità di pubblicazione è distinta da `verification_status`. Non falsare immagini o mercato per rendere pubblicabile una Release.

Vedi `docs/RELEASE_PUBLICATION_GATE.md`.

# INVARIANTE GLOBALE — COERENZA DELLE SUPERFICI MERCATO

Ogni superficie TrackDash deve rappresentare **la stessa Release con lo stesso stato di mercato canonico**.

Fonte di verità:
- `market_release_signals` per il segnale canonico corrente;
- `ReleaseMarketSignalMap` / servizio pubblico condiviso per la proiezione UI;
- nessuna schermata deve mantenere un motore prezzi, fallback o snapshot indipendente.

Superfici incluse:
- Catalogo / righe Release;
- dettaglio Release;
- Scanner;
- Collezione;
- dettaglio copia;
- Dashboard / home app;
- Market;
- Wishlist, con la sola eccezione semantica descritta sotto.

Regole permanenti di presentazione:
- **Market Value**: usare esclusivamente `valueEUR`; non sostituirlo con ASK o SOLD.
- **Prezzo richiesto corrente (ASK)**: usare il selettore condiviso `observedMarketPrice` per il **solo kit** in EUR, dalla stessa offerta selezionata dal motore Europe-first e ancora TTL-valida. Il motore può continuare a scegliere l'offerta per costo d'acquisto, ma non va chiamato «ASK più basso del solo kit» se non è stato verificato il minimo assoluto del prezzo articolo.
- **Fallback visuale SOLD**: quando non esistono MV/ASK ma esiste `soldAnchorEUR`, può essere mostrato tramite `observedMarketDisplayPrice` come riferimento da vendite concluse, con semantica approssimativa `≈`.
- Il fallback SOLD è **solo display**: non deve entrare nel valore portafoglio, performance personale o logica target-price Wishlist.
- **Wishlist**: un target d'acquisto va confrontato SOLO con `observedMarketKnownPurchaseCost` (prezzo kit + spedizione effettivamente indicata sulla stessa offerta europea selezionata), mai con il solo prezzo del kit quando la spedizione non è nota. Importazione o IVA non documentate non sono incluse e non si possono presumere. Il valore stimato e il SOLD non sono prezzi di acquisto.
- **Collector trend**: usare soltanto `trendPercent` + `trendWindowMonths` + `trendBasis` (SOLD/MV).
- **ASK trend**: resta separato e può essere mostrato soltanto con le guardie condivise; non usare `askTrendWindowDays` per etichettare un collector trend.
- ASK non è SOLD; SOLD non è MV. Le tre semantiche devono rimanere visivamente e logicamente distinte.
- ASK deve essere mostrato come prezzo richiesto, senza prefisso `≈`; SOLD come riferimento da vendite concluse con `≈`.
- **Dettaglio Release / dettaglio copia:** mostrare in primo piano SOLO **Vendite concluse** (SOLD, ≈, solo kit) e **Prezzo richiesto · solo kit** (ASK TTL-valido, dall'offerta Europe-first selezionata), quando presenti; non ripetere il Market Value come terza cifra se corrisponde al SOLD. Se né SOLD né ASK sono disponibili, mantenere il fallback al Market Value canonico, quando esiste, oppure «Mercato in osservazione». È una scelta di presentazione, NON una sostituzione del Market Value in Collection, Market, Wishlist e altri calcoli. Nessun trend numerico aggiuntivo nel box mercato del dettaglio.

- **Anteprima della Collection (non il dettaglio):** mostrare la cifra principale utile a quella copia (MV per sigillati; in alternativa un SOLO riferimento di mercato corrente, ASK o SOLD con semantica distinta), poi **trend collezionistico canonico con direzione esplicita** «Mercato in crescita / Mercato in calo / Mercato stabile» e percentuale, SOLO quando esiste `trendPercent` affidabile. Prezzo effettivamente pagato in testo molto piccolo, opzionale. NON mostrare qui `personalGainEUR` (+0,72 €/−0,08 €), doppioni ASK aggiuntivi, `askTrendPercent` o altri indicatori tecnici; guadagno/perdita personale e dati completi stanno nel dettaglio della copia. Non inventare trend o svalutazioni per copie aperte: il mercato di riferimento riguarda kit nuovi/sigillati.

Freschezza:
- non introdurre cache/snapshot indipendenti per una singola superficie mercato;
- Catalogo, Release detail, Collezione, Dashboard, Scanner e Market devono consumare la stessa snapshot pubblica condivisa;
- un refresh/recompute di mercato non deve poter produrre per la stessa Release due numeri diversi su schermate diverse.

Cadence mercato collezionistico:
- il cron ricorrente è un dispatcher, non una scansione quotidiana di ogni Release;
- non aumentare la frequenza solo perché una coda contiene più Release: distribuire i job nel tempo;
- il ricambio di singoli annunci, a segnale canonico sostanzialmente invariato, non rende una Release HOT;
- per l'eBay Active lane, il cambio di cadenza usa il segnale canonico dopo recompute e considera materiale una variazione di prezzo pari o superiore al 5%, oppure l'ingresso/uscita completa dal mercato corrente;
- per gli exact-retail endpoint, una variazione prezzo inferiore al 5% non rende il job HOT; i cambi di disponibilità restano materiali;
- la cadenza ricorrente corrente per eBay Active ed exact retail è HOT 28 giorni / NORMAL 42 giorni / COLD 84 giorni;
- ogni cambiamento di offer state può comunque causare recompute: **recompute necessario** e **mercato materialmente cambiato** sono concetti distinti.

Regression gate:
- `scripts/test-market-public-surfaces.mjs` deve impedire la reintroduzione di motori/fallback/cache divergenti;
- ogni modifica alle superfici mercato deve passare l'intera `pnpm verify` prima del merge.

---

# WORKFLOW COMPLETO

L'ordine operativo corretto è sempre:

### FASE 1 — AUDIT CATALOGO

### FASE 2 — IMMAGINI

### FASE 3 — RARITÀ / STATUS

### FASE 4 — INITIAL MARKET SCAN

### FASE 5 — RECOMPUTE

### FASE 6 — QA PRODUCTION

### FASE 7 — ENROLLMENT CRON

### FASE 8 — COMPLETION GATE

Non dichiarare una famiglia completata prima di aver attraversato tutte queste fasi.

---

# FASE 1 — AUDIT CATALOGO

Ricostruisci prima l'intera genealogia della famiglia.
Cerca:

- Original Release;
- reissue;
- Premium;
- Black Special;
- White Special;
- Color Special;
- Metallic;
- Clear;
- Japan Cup;
- Anniversary;
- Finished/Semi-Finished;
- limited;
- regional release;
- collaboration;
- event release;
- promotional release;
- varianti prive di Item Number autonomo.

Per ogni Release determina quando possibile:

- Product parent;
- Item Number;
- JAN;
- nome esatto;
- anno;
- data;
- chassis;
- colore;
- Edition Type;
- Release Type;
- mercato geografico;
- production status;
- eventuali ristampe/wave;
- fonte.

Gerarchia fonti:

1. Tamiya ufficiale;
2. cataloghi / PDF / archivi Tamiya;
3. fonti storiche contemporanee affidabili;
4. retailer specializzati;
5. fonti archivistiche;
6. marketplace come corroborazione.

---

# RISTAMPE / PRODUCTION WAVES

Non creare automaticamente una nuova Release per ogni ristampa.
Se abbiamo:

- stesso Item Number;
- stesso JAN;
- stessa macchina;
- stesse specifiche;
- nessun discriminante fisico affidabile;

allora mantenere **una sola Release**.
Le date successive vengono registrate come:
**production waves / restock / reissue history**
Esempio:
95466 — Manta Ray Mk.II Black Special

- prima uscita: 2019;
- nuova production wave: 2023;
- stesso Item;
- stesso JAN;
- nessuna differenza fisica verificabile;

→ UNA SOLA RELEASE.
Separare due Release soltanto quando esiste un discriminante reale e utilizzabile dal collezionista.

---

# FASE 2 — IMMAGINI

Ogni Release deve ricevere subito un audit immagini.
Non rimandare le foto a una fase futura.

## Obiettivo permanente

Ridurre i placeholder il più possibile **senza sacrificare l'identità della Release**.

La gerarchia di ricerca è:

1. Tamiya ufficiale;
2. Tamiya archive/catalog;
3. fonte contemporanea affidabile;
4. retailer exact-product affidabile;
5. marketplace / annunci con match Release ad alta confidenza;
6. placeholder solo quando il match resta realmente dubbio.

Fonti marketplace ammesse come supporto immagini includono, quando utili:

- eBay;
- Mercari;
- Yahoo Auctions / Yahoo Flea;
- Suruga;
- Mandarake;
- altri marketplace o retailer con pagina associata alla Release.

## Livelli di confidenza immagine

### EXACT VERIFIED

Usare quando l'immagine è attribuibile direttamente alla Release tramite fonte ufficiale o exact-product page affidabile, con identità coerente.

### HIGH-CONFIDENCE MATCHED

È ammessa anche un'immagine proveniente da marketplace/listing/retailer non ufficiale quando il match con la Release è forte e non esistono segnali concreti di mismatch.

Il match deve essere sostenuto dal maggior numero possibile di discriminanti:

- Item Number esatto;
- JAN, se visibile;
- nome edizione;
- colore/variante;
- chassis/configurazione;
- packaging coerente;
- anno/serie;
- eventuale testo o foto della scatola che conferma la Release.

Non è necessario che la fonte sia ufficiale se l'immagine è chiaramente associata alla Release corretta.

### PLACEHOLDER

Usare solo quando, dopo una ricerca reale e sufficientemente ampia, rimane un dubbio materiale sull'identità dell'immagine.

## Regola fondamentale

Una Release specifica **NON deve ereditare silenziosamente**:

- immagine Product generica;
- immagine Release sorella;
- immagine di un'altra variante.

Ma il principio permanente NON è:
**“solo foto ufficiali o placeholder”.**

Il principio corretto è:
**“migliore immagine disponibile con identità della Release sufficientemente affidabile”.**

Quindi, se una foto è associata a un annuncio/pagina della Release e:

- Item Number / nome / variante coincidono;
- l'aspetto visivo è coerente;
- non ci sono elementi che facciano pensare a una Release diversa;

la foto può essere usata anche se non proviene da Tamiya.

## Quando NON usare una foto

Scartarla se:

- titolo e immagine sono incoerenti;
- Item Number o variante non corrispondono;
- la foto è chiaramente generica o di repertorio per un'altra Release;
- il colore o packaging contraddice la Release;
- il listing raggruppa più Release senza poter attribuire la foto;
- la fonte mostra una release sorella/base al posto della variante;
- il match rimane solo “sembra simile”.

## Requisiti tecnici

Verificare sempre:

- URL raggiungibile;
- HTTP valido;
- asset immagine diretto o comunque utilizzabile stabilmente;
- host/path compatibile con Next Image;
- rendering Production.

Registrare, quando possibile, la fonte dell'immagine e il livello di confidenza nel source/audit note della Release.

## Completion Gate immagini

Una famiglia NON deve fermarsi al primo “immagine non trovata”.

Prima di lasciare un placeholder bisogna fare almeno un secondo passaggio mirato su:

- retailer exact-product;
- eBay;
- Mercari;
- Yahoo Auctions;
- Suruga / Mandarake;
- altre fonti plausibili per quella Release.

Se dopo questo secondo passaggio il match rimane dubbio:
**IMAGE NOT FOUND WITH SUFFICIENT CONFIDENCE**
e si mantiene il placeholder.

In sintesi:
**foto high-confidence corretta > placeholder**
ma
**placeholder > foto probabilmente sbagliata**.

---

# FASE 3 — PRODUCTION STATUS E RARITÀ

## Production status

Verificare possibilmente su fonte ufficiale:

- active;
- discontinued;
- limited/event;
- unknown.

Salvare anche la data dell'ultimo controllo.

## Rarità

La rarità è **Release-specific**.
NON ereditare automaticamente la rarità dal Product parent.
Valutare:

- tiratura/distribuzione;
- event-only;
- regional-only;
- limited;
- età;
- durata produzione;
- ristampe;
- disponibilità retail;
- frequenza annunci;
- mercato europeo;
- persistenza sul mercato.

Vocabolario:
Common
Uncommon
Rare
Very Rare
Grail
Non usare semplicemente:
“vecchia = rara”.

---

# FASE 4 — INITIAL MARKET SCAN

Ogni nuova Release deve ricevere subito il suo **Initial Market Audit**.
Inserire la Release nella queue NON equivale a fare lo scan.
L'initial scan deve essere eseguito durante lo stesso incarico.

---

# TIPI DI MARKET SCAN

## A. ACTIVE MARKETPLACE SCAN

Cerca disponibilità corrente.
Fonti possibili:

- eBay;
- Vinted;
- Mercari;
- Yahoo Flea;
- Amazon;
- marketplace locali;
- altri marketplace osservabili.

Raccogli:

- item price;
- shipping;
- currency;
- seller;
- regione;
- disponibilità;
- data osservazione;
- exact Release match.

---

## B. RETAIL SCAN

Cerca negozi correnti o storici.
Fonti possibili:

- RCJaz;
- Pieroni;
- iModellini;
- Hobby Search;
- HLJ;
- AmiAmi;
- Mandarake;
- Tamiya Shop;
- retailer europei;
- retailer giapponesi;
- altri negozi affidabili.

### RCJAZ — REGOLA PERMANENTE

Durante ogni Initial Market Audit, cercare RCJaz sistematicamente tramite **Item Number exact**.

Quando viene trovata una vera pagina prodotto RCJaz della Release:

- salvare la pagina come fonte/evidenza exact;
- persistere l'endpoint RCJaz della Release;
- permettere l'enrollment nel refresh retail secondo la policy della sorgente.

Non trattare come endpoint exact:

- pagine categoria;
- pagine search;
- bundle / Memorial Box che contengono più Release;
- pagine il cui URL/identità non attribuisce la Release in modo sicuro.

Per Item Number riutilizzati/condivisi:
**FAIL CLOSED**.
L'enrollment automatico non deve scegliere una Release arbitrariamente.
È ammesso soltanto un endpoint già verificato esplicitamente come exact Release.

La presenza RCJaz dimostra disponibilità/ampiezza di mercato, ma essendo extra-UE resta valida la regola Europe-first:
senza landed cost europeo noto, il prezzo RCJaz è **item-only context** e non può da solo abbassare o definire il prezzo europeo.

Raccogli:

- prezzo;
- disponibilità;
- shipping quando determinabile;
- sold-out;
- restock;
- storico.

---

## C. SOLD / COMPLETED MARKET RESEARCH

Cerca transazioni concluse.
Possibili fonti:

- eBay Product Research / SOLD;
- Yahoo Auctions closed;
- Yahoo Flea closed;
- Mandarake auctions;
- Mercari sold;
- Vinted quando verificabile;
- TrackDash verified sales;
- manual verified transactions.

Non limitarti a eBay.

---

# FASE 4A — EUROPE-FIRST

TrackDash ha come riferimento principale il mercato europeo.
La domanda a cui deve rispondere è:
**“Quanto costa realisticamente oggi questa Release a un collezionista europeo?”**
Priorità:

1. transazioni europee;
2. offerte europee;
3. retailer europei;
4. offerte internazionali con costo consegnato noto;
5. mercato globale;
6. Giappone / USA come supporto.

Non ignorare Giappone e USA, ma non farli dominare automaticamente il prezzo europeo.

---

# REGIONI

Propagare quando possibile il marketplace reale:

- EBAY_IT;
- EBAY_DE;
- EBAY_FR;
- EBAY_GB;
- EBAY_US;
- EBAY_JP;
- ecc.

Non trattare tutto come genericamente `global` se la regione è nota.

---

# UI SEMPLICE E RIFERIMENTI ASK OSSERVATI (2026-10-11, FIX LIVE)

- **Una base unica** in OGNI Release: SOLD, ASK e Market Value sono **prezzi del solo kit, spedizione esclusa**. Per 95467 Dyna-Hawk: SOLD ≈ €14,92 e **ultimo ASK osservato €46,36**, NON €58,56 (questo è €46,36 articolo + €12,20 spedizione indicata). La spedizione è sempre informazione separata, anche in presenza di importi storici; non stimare IVA/dogana.
- **Una sola card neutra** («Mercato»), con al massimo due righe: «Vendite concluse» e «Prezzo richiesto osservato», entrambe con kit-only EUR. Nessuna alternanza di box verdi/gialli, nessuna spiegazione tecnica ripetitiva. In calce «Prezzi del solo kit · spedizione esclusa» e, se abbiamo ASK, «Offerta osservata [data]», «Spedizione indicata +€X (non inclusa)» oppure «Spedizione da verificare», più un breve richiamo agli oneri extra-UE.
- La **freschezza dell'annuncio** e l'**esistenza di un ultimo prezzo osservato** sono concetti distinti: il dato ASK storico non deve scomparire soltanto perché è scaduto il TTL per considerarlo *attualmente acquistabile*. L'interfaccia può presentarlo come «Ultimo prezzo richiesto osservato · disponibilità da verificare», con data reale e orizzonte di evidenza **max 180 giorni**, dalla stessa `market_offer_states`, senza inventare prezzo o quantità. Non chiamarlo «annuncio attivo», «disponibile da» né usarlo per la valutazione v4/scan.
- La Collection mostra un totale **indicativo** delle copie sigillate (MV quando esiste; in alternativa ultimo prezzo richiesto osservato *solo kit*, opportunamente dichiarato anche se il venditore potrebbe non essere più attivo). Prezzo pagato e guadagno personale rimangono distinti; shipping non entra mai nel valore della copia. La Wishlist confronta i target di acquisto **solo con prezzi correnti e spese di spedizione documentate**, e non riutilizza ASK storici per segnalare offerte.
- Se non esistono MV né ASK entro l'orizzonte, usare il SOLD solo come **evidenza consultabile** (non come valore fittizio portafoglio). Nessuna modifica a Market Method v4, pesi, colonne canoniche o cron. Questo fix è di proiezione/presentazione, non di stima.

## Standard unico card mercato, shipping e origine (2026-10-11)

- In tutte le card Collection, nello stesso ordine, mostrare **Riferimento mercato · kit sigillato** (MV se presente, altrimenti SOLD con disclaimer esplicito «riferimento, non stima») e **Prezzo richiesto · solo kit** (ASK attuale selezionato, altrimenti ultimo ASK storico datato entro 180 giorni, segnalato «da verificare»). In assenza di dato mostrare «—», senza cambiare struttura. Mai stimare copie aperte come sigillate.
- Badge piccolo con il numero di vere vendite concluse quando disponibili; andamento SOLD solo se vengono mostrati entrambi i prezzi medi del confronto (es. €12,45 → €14,92 +19,9%) e finestra. Mai mostrare una percentuale confondibile con il prezzo pagato personalmente. Le icone di gestione stanno fuori dal blocco dei prezzi.
- Dettaglio Release e dettaglio copia condividono esattamente un box neutro Mercato: due righe fisse, dato o —, stato sintetico, dicitura **Spedizione esclusa** in evidenza, e +€ indicati quando riferiti alla medesima offerta ASK. Niente lunghi disclaimer automatici nel box.
- Badge **Extra-UE · possibili oneri d'importazione** SOLO quando la provenienza della **stessa offerta ASK** è verificata fuori Unione europea: itemLocationCountry salvato da eBay Browse, oppure una sorgente geograficamente extra-UE. EBAY_IT, EBAY_US e simili rappresentano il marketplace, NON l'ubicazione del venditore. Fonte global/europe o origine ignota NON consente avviso doganale. Su nuovo scan con origine Italia/UE il badge scompare automaticamente; se il nuovo scan documenta Giappone/USA compare.
- ASK datato rimane informazione storica, mai disponibilità verificata, né prezzo d'acquisto Wishlist. Prezzi del solo kit, MV, SOLD, FX, metodo v4 e storico NON vengono modificati. Nessuna migrazione DB, nessuna nuova scansione o cron.

# REGOLA DEFINITIVA DI COMPARABILITÀ (2026-10-11)

**Sono due dimensioni economiche, NON due stime concorrenti:**

1. **Quanto vale il kit**: `Market Value` e SOLD (solo articolo, EUR, al netto della spedizione quando verificabile) e ASK pubblico (prezzo del solo articolo sulla stessa offerta qualificata). Le tre etichette rimangono distinte: SOLD è transato, ASK è richiesto, MV è una stima. Collection aggrega soltanto MV e, come riferimento alternativo chiaramente etichettato, ASK kit-only di copie sigillate; non somma spedizioni al valore dei beni posseduti.
2. **Quanto costa comprarlo**: prezzo articolo + **spedizione indicata/effettivamente pertinente all'offerta**, solo quando documentata e aritmeticamente verificata; eventuale IVA/dogana/oneri ulteriori solo quando documentati. Il totale `kit + spedizione indicata` non è automaticamente un prezzo **finale consegnato in Italia**. Se la spedizione manca, non calcolare il totale e non mostrare un target/badge Wishlist raggiunto per un budget d'acquisto. Non stimare la spedizione per media di altre vendite.

**Regola geografica:** i prezzi di origine giapponese/USA restano evidenze reali del mercato di origine. Un extra-UE con costo d'importazione sconosciuto non può apparire come «disponibile da» europeo. Se il motore Europe-first non ha un `starting_offer_candidate_id` attuale e verificato, il frontend NON deve fare fallback a un annuncio fresco casuale; conserva SOLD/MV/storico come prove, ma non inventa un prezzo ASK europeo.

**Convenzione UX:** nella preview mostrare massimo un numero principale, con il qualificatore `solo kit` dove serve; il dettaglio Release distingue SOLD e ASK, mostra spese e subtotale solo se attendibili e lascia le spiegazioni lunghe fuori dalla preview. I trend % mostrati nella Collection hanno SOLO basi SOLD documentate (media precedente → media recente) e mai correlazioni implicite con ASK o Pagato. In ogni pagina il riferimento di prezzo del solo kit ha la stessa definizione.

**Compatibilità:** questa è una normalizzazione di proiezione/prezzi mostrati e logica budget dell'acquisto, NON un cambiamento a `Market Method v4`, fonti SOLD, valori canonici, cron o sicurezza. Qualunque futura modifica al modo in cui il v4 pondera ASK con shipping richiede un audit separato, test espliciti e versione di metodo.

---

# FASE 4B — SHIPPING E COSTO EFFETTIVO

Il motore deve distinguere:

- item price;
- shipping;
- effective acquisition cost.

Formula:
**effective cost = item + shipping**
quando shipping è nota.
Esempio:
€17 prodotto

- €13 spedizione
  \= €30 costo effettivo.

Per il mercato europeo, €30 è il dato economicamente significativo.

---

# OFFERTE EXTRA-UE

Un prodotto in Giappone da €7 NON equivale a un prodotto da €7 in Europa.
Se shipping internazionale è sconosciuta:
classificare come:
**EXTRA-EU ITEM-ONLY / LANDED COST UNKNOWN**
e ridurne il peso.
Regola:
**un'offerta extra-UE senza costo europeo noto non può da sola definire o abbassare il Prezzo minimo richiesto europeo.**
Se IVA/dogana/import non sono determinabili con affidabilità:
NON inventarli.

---

# FASE 4C — EVIDENZA DI MERCATO

Distinguere almeno:

## CONFIRMED TRANSACTION

Transazione realmente osservata.
Peso massimo.

## OBSERVED SELL-THROUGH

TrackDash vede:
IN STOCK → SOLD OUT.
È forte evidenza di assorbimento mercato.
NON inventare quantità vendute.

## CURRENT MARKET OBSERVATION

Offerta attualmente disponibile.
È vera evidenza di mercato anche senza SOLD.

## HISTORICAL MARKET REFERENCE

Prezzo vecchio / sold-out storico / MSRP / vendita molto datata.
Serve per storia e trend.

---

# SOLD-OUT

## Se TrackDash osserva direttamente:

IN STOCK → SOLD OUT
registrare:
**Observed Sell-Through**

## Se scopri una pagina già sold-out:

non assumere quando sia avvenuta la vendita.
Registrare:
**Historical retail reference — sell-through date unknown**

---

# RECENZA

Baseline:
0–90 giorni
→ peso pieno
91–180 giorni
→ peso alto
181–365 giorni
→ peso ridotto
12–24 mesi
→ principalmente storico/fallback
oltre 24 mesi
→ storico
Le evidenze vecchie restano nel database ma non devono distorcere il prezzo corrente.

---

# CLUSTER PREZZI

Non fare medie semplici di tutti gli annunci.
Prima:

- exact Release match;
- deduplica;
- seller dedup;
- condizione confrontabile;
- mercato europeo;
- delivered cost;
- Price Guard;
- outlier filtering;
- cluster detection.

Esempio:
€30
€32
€34
€37
€38
€65
€90
€115
il cluster plausibile è circa €30–38.
Gli ASK aspirazionali non devono gonfiare il dato.

---

# TREND COLLEZIONISTICO — STATO PERSISTENTE

Il **trend collezionistico** non è la differenza fra l'ultima scansione e quella precedente.

È lo stato direzionale dell'ultimo movimento di valore/SOLD sufficientemente significativo e verificato.

Regola permanente:

- una Release senza movimento storico significativo resta **in osservazione / trend non disponibile**;
- NON etichettare come "stabile" una Release solo perché esiste un solo prezzo;
- quando emerge un movimento SOLD/valore materiale, il trend diventa rising o falling;
- una scansione successiva con lo stesso prezzo NON azzera e NON neutralizza il trend;
- un recompute senza nuova evidenza direzionale deve preservare l'ultimo trend confermato;
- una piccola oscillazione sotto la soglia materiale non deve cancellare un trend già valido;
- un movimento opposto sufficientemente significativo può ribaltare la direzione;
- un nuovo movimento nella stessa direzione aggiorna lo stato solo se è più forte del segnale già confermato;
- il trend ASK resta separato e non deve sostituire automaticamente il trend collezionistico;
- `trend_updated_at` indica quando il trend collezionistico è stato realmente confermato/aggiornato, non quando è avvenuto l'ultimo scan;
- `trend_basis` indica se il trend deriva da SOLD o da Market Value consolidato.

Soglia operativa corrente per considerare materiale un nuovo movimento direzionale: **5%**.

Quindi:
**SCAN INVARIATO ≠ TREND STABILE.**

E:
**NESSUN NUOVO TREND ≠ CANCELLA IL TREND PRECEDENTE.**

---

# ASK TREND — BASE COMPARABILE

Il trend dei prezzi richiesti può confrontare soltanto snapshot costruiti con la **stessa base economica e lo stesso metodo di comparabilità**.

Regola permanente:

- item-only e delivered cost NON sono confrontabili nello stesso trend;
- un cambio di shipping semantics, Europe-first policy o metodologia ASK richiede una nuova `basis_version`;
- `market_release_ask_snapshots.basis_version` identifica la base del dato;
- il recompute deve usare per `ask_trend_percent` soltanto snapshot con la basis corrente;
- snapshot legacy/incompatibili restano conservati come storico tecnico ma sono esclusi dalla matematica del trend;
- non correggere un trend scrivendo manualmente la percentuale nel segnale canonico: correggere la base/evidenza e rilanciare il recompute.

Un ASK trend misura il movimento dei **prezzi richiesti osservati**, non equivale automaticamente a un trend del Market Value.

---

# FASE 5 — RECOMPUTE

Il **Recompute NON è uno scan**.
Non cerca nuovi annunci.
Prende tutti i dati già raccolti e applica il motore TrackDash.
Il recompute deve calcolare:

- market regime;
- Prezzo minimo richiesto;
- fascia recente;
- Market Value se giustificato;
- retail anchor;
- active anchor;
- SOLD anchor;
- confidence;
- trend quando possibile.

---

# PREZZO MINIMO RICHIESTO

Se esiste mercato reale ma non abbastanza robusto per Market Value:
mostrare:
**Prezzo minimo richiesto \~€XX**
Non mostrare:
“Dati di mercato in arrivo”
se i dati esistono già.

---

# MARKET VALUE

Mostrare:
**Valore stimato €XX**
solo quando l'evidenza è sufficientemente robusta.
Non usare una soglia rigida tipo:
5 SOLD
10 SOLD
Il mercato Mini 4WD è lento.
Il Market Value può essere sostenuto da convergenza fra:

- SOLD;
- sell-through;
- retailer;
- marketplace;
- più fonti;
- recenza;
- delivered cost.

---

## CONCENTRAZIONE SOLD VS AMPIEZZA DEL MERCATO

La concentrazione dei SOLD in una singola sorgente o in un singolo venditore descrive la qualità di **quel campione SOLD**; non dimostra che l'intero mercato abbia un solo venditore.

Regola permanente:

- più vendite attribuibili allo stesso seller sono evidenza reale di sell-through;
- un retailer indipendente, anche extra-UE, dimostra che la Release circola su più canali;
- però la presenza di un canale extra-UE con landed cost europeo sconosciuto NON corrobora automaticamente il valore numerico europeo;
- un campione SOLD concentrato in un venditore puo sostenere un Market Value con confidence bassa SOLO se la finestra rolling recente contiene almeno 5 transazioni eBay Research documentate, con attribuzione release_exact, e ultima vendita entro 365 giorni. Senza queste prove resta solo contesto SOLD;
- **Eccezione separata per finestre recenti ristrette ma corroborate:** 3–4 SOLD `release_exact`, `rolling_window`, `indicative` ed entro 365 giorni possono definire un Market Value di confidence **bassa** se esiste, per la stessa Release e la stessa sorgente, uno storico `full_history` anch'esso `release_exact` con almeno 8 vendite, almeno 2 venditori documentati, un intervallo che comprende l'intera finestra recente e un prezzo medio compatibile (scostamento massimo 30%). Il valore usa SOLO la media della finestra recente; i SOLD storici NON si sommano e la seller diversity storica NON viene attribuita automaticamente alla finestra attuale. Se manca uno qualsiasi dei requisiti, resta solo il riferimento SOLD. Esempio audit: Avante Mk.II 95525, 3 recenti ≈€48,79 con storico di 18 vendite e 6 seller a ≈€40,09.
- può sostenere un Market Value quando esiste corroborazione di prezzo indipendente e confrontabile, preferibilmente Europe-first / delivered-cost;
- in assenza di convergenza, mantenere SOLD anchor/storico/trend come evidenza reale e pubblicare il Prezzo minimo richiesto corrente quando disponibile.

Quindi:
**SINGLE SELLER NEL DATASET SOLD ≠ SINGLE SELLER NEL MERCATO.**
Ma anche:
**MERCATO MULTI-CANALE ≠ PREZZO SOLD AUTOMATICAMENTE VALIDATO COME MARKET VALUE.**

---

# SOLD 0

Non mostrare pubblicamente:
**SOLD 0**
Zero SOLD osservati significa soltanto:
**nessuna vendita conclusa osservata nelle fonti disponibili**
NON:
**nessuna vendita avvenuta.**

---

# FASE 6 — QA PRODUCTION

Dopo il recompute verificare il sito vero.
Per ogni Release controllare:

- pagina 200;
- immagine;
- Item Number;
- anno;
- chassis;
- JAN;
- nome;
- production status;
- rarità;
- Prezzo minimo richiesto / Market Value;
- fallback;
- Collection preview;
- scanner;
- assenza di SOLD 0;
- assenza di “Dati in arrivo” se il mercato è già stato analizzato.

Verificare:
`main = Production commit`
tramite `/api/version`.

---

# PIPELINE CHECK

Il flusso deve essere:
market scan
→ candidate
→ matching
→ offer state
→ sold/sell-through/history
→ recompute
→ market_release_signal
→ public market service
→ UI
Se dati validi esistono nei livelli inferiori ma la UI non li mostra:
**BLOCKED — PIPELINE**
non “nessun mercato”.

---

# FASE 7 — AUTOMATIC REFRESH / CRON

Dopo l'Initial Scan la Release entra nel sistema automatico.
NON rifare quotidianamente tutto l'Initial Scan.
Il cron gira come dispatcher e processa solo job `due`.

---

# CADENZA MARKETPLACE

HOT
72 ore
NORMAL
7 giorni
COLD
14 giorni

---

# CADENZA RETAIL

HOT
7 giorni
NORMAL
14 giorni
COLD
30 giorni

---

# CADENZA SOLD RESEARCH

HOT
14 giorni
NORMAL
30 giorni
COLD
60 giorni

---

# HOT / NORMAL / COLD

HOT se:

- nuova offerta;
- prezzo cambia significativamente;
- restock;
- sold-out;
- nuovo SOLD;
- nuova attività.

NORMAL:
mercato stabile ma attivo.
COLD:
Release stabile da molto tempo.
Activity tier deve modificare realmente:
`scan_interval_hours`
e non soltanto una label.

---

# CRON

Il cron deve:

1. claimare solo job `due`;
2. processare solo adapter READY;
3. usare batch piccoli;
4. dare priorità agli overdue;
5. isolare le failure;
6. eseguire recompute dopo cambiamenti;
7. non scansionare tutto il catalogo ogni giorno.

---

# MANUAL / PLANNED SOURCES

Distinguere:
READY
MANUAL
PLANNED
Non fingere che una fonte manuale sia automaticamente aggiornata.
Il fatto che SOLD research non sia automatizzato NON deve cancellare un Prezzo minimo richiesto valido.

---

# RETRY

Se uno scan fallisce:
NON segnare `last_success_at`.
Lasciare il job `due` o schedularne il retry.
Mai falsificare uno scan come riuscito.
Un retry NON equivale a rifare tutta la famiglia.

---

# DIFFERENZA FRA LE OPERAZIONI

## Audit catalogo

Identifica cosa esiste.

## Initial Market Scan

Cerca dati nuovi sul mercato.

## Recompute

Ricalcola il segnale usando dati già raccolti.

## QA

Controlla che il risultato appaia correttamente sul sito.

## Cron Refresh

Aggiorna in futuro soltanto le sorgenti scadute.
Queste operazioni NON vanno confuse fra loro.


---

# EMPTY MARKET CHALLENGE — HARD COMPLETION GATE

This is a permanent invariant, not an optional refinement.

After canonical recompute, every Release whose public signal would show no Market Value and no observed/current price must receive a **second-pass targeted market challenge before the family can be COMPLETE**.

The challenge must search the exact Release identity across multiple source classes, using the exact Item Number plus edition/model discriminants where needed:

- current marketplaces;
- current/specialist retail;
- SOLD/completed sources;
- regional sources (Europe first, then Japan/other markets);
- exact product/search pages when individual listing URLs are not exposed.

A Release may remain publicly without a price only when this second pass documents that:

1. no valid current offer was found;
2. no sufficiently attributable current/recent SOLD was found;
3. any evidence found is genuinely historical, out-of-stock, ambiguous, wrong condition, wrong Release, or otherwise valuation-ineligible.

**Historical-only evidence is not proof that the current market is empty.**

A family must not be marked `COMPLETE — MARKET THIN` merely because the first scan produced only historical/out-of-stock evidence.  
The thin-market result is allowed only **after the Empty Market Challenge is passed for every empty Release**.

## Completion invariant

Before closing a family, the family-specific audit must have:

- **0 current valid offers hidden by an empty public signal**;
- **0 stale market-method signals** relative to the current market method;
- **0 empty Release left unchallenged** after Initial Scan + recompute;
- every remaining empty Release explicitly classified with a documented reason.

If any one of these is non-zero:

**DO NOT DECLARE THE FAMILY COMPLETE.**

## Market method version invariant

When the public market method changes, all signals still on an older `market_method_version` must be re-enqueued and recomputed before Completion Gate.

A READY deployment with stale market signals is not a completed market migration.


# FASE 8 — COMPLETION GATE

Prima di dire:
**“Famiglia completata”**
verificare ogni Release tramite una matrice concettuale:
ITEM
RELEASE
IDENTITY
IMAGE
STATUS
RARITY
MARKET AUDITED
OBSERVED PRICE
MARKET VALUE
LAST AUDIT
PIPELINE
PRODUCTION
RESULT

---

# RESULT AMMESSI

**COMPLETE**
Tutte le aree principali chiuse.
**COMPLETE — MARKET THIN**
Audit completo ma mercato realmente scarso.
**PARTIAL — IMAGE NOT FOUND**
Immagine cercata seriamente ma non reperibile.
**PARTIAL — MARKET NOT FOUND**
Mercato cercato seriamente ma non osservabile.
**BLOCKED — IDENTITY**
Release non attribuibile con sufficiente sicurezza.
**BLOCKED — PIPELINE**
Dati presenti ma pipeline/UI non funzionante.

---

# IMPORTANTE

La famiglia può essere considerata operativamente completa anche se rimangono:

- retry cron futuri;
- refresh automatici;
- monitoraggio mercato;
- una foto non reperibile dopo audit serio;
- mercato realmente scarso.

Questi elementi devono però essere esplicitamente documentati.
Non deve rimanere lavoro non eseguito semplicemente perché:
“lo faremo dopo”.

---

# REGOLA FINALE

Ogni volta che l'utente dice:
**“Facciamo la famiglia X”**
eseguire automaticamente:
**AUDIT CATALOGO**
**→ FOTO**
**→ STATUS/RARITÀ**
**→ INITIAL MARKET SCAN**
**→ RECOMPUTE**
**→ QA PRODUCTION**
**→ CRON ENROLLMENT**
**→ COMPLETION GATE**
per **tutte le Release della famiglia**.
Solo dopo dichiarare la famiglia completata.
L'obiettivo TrackDash non è né inventare prezzi né essere così rigido da non pubblicare mai nulla.
L'obiettivo è:
**usare il massimo dell'evidenza reale disponibile, distinguendo chiaramente osservazione, storia e stima.**

---

# PERSISTENT PROJECT STATE PROTOCOL

TrackDash must not rely on chat memory as the primary source of project continuity.

The repository has three persistent authorities:

1. `docs/TRACKDASH_METHOD_MASTER.md`  
   Defines **how** TrackDash work must be performed.

2. `docs/TRACKDASH_STATE.md`  
   Defines **where the project currently is**, what is complete, what is blocked and the exact next action.

3. `docs/TRACKDASH_OPERATIONS.md`  
   Defines **what operational controls actually do**: Admin buttons, cron, worker batch sizes, queue behavior, security and production checks.

## Mandatory session bootstrap

At the start of any new TrackDash chat/session or when resuming after context loss:

1. read the Method Master;
2. read Project State;
3. read Operations when the task touches Admin/cron/market workers/deploy;
4. verify live facts that may have changed since the snapshot;
5. only then modify code or Production data.

Do not ask the user to reconstruct information that is already documented in the repository.

## Mandatory maintenance

Update `TRACKDASH_STATE.md` in the **same work unit** whenever a material change affects:

- current family;
- Release identity/count;
- migration state;
- market audit coverage;
- queue/blocker state when it changes the next action;
- Production/main alignment;
- Completion Gate;
- exact next action.

Update `TRACKDASH_OPERATIONS.md` whenever operational behavior changes, including:

- Admin button behavior;
- worker composition;
- batch size;
- queue ordering;
- cron behavior;
- authorization/security;
- deployment/version verification.

Update the Method Master only when the **method itself** changes.

## Runtime/documentation reconciliation

Repository documentation is the persistent continuity source, but executable code and live Production remain authoritative for current runtime behavior.

If runtime/code contradicts the documentation:

1. verify the actual behavior;
2. correct the implementation or documentation as appropriate;
3. reconcile the persistent docs immediately in the same work unit.

Do not leave a known contradiction for a future chat.

## Completion documentation gate

A family/work block is not operationally closed if the only accurate final state exists in chat.

Before declaring completion:

- Project State must reflect the result;
- Operations must reflect any changed controls;
- repository verification and Production gates from this Master must still pass.

---

**Repository gate note — 2026-09-21:** family work is not complete until the full `pnpm verify` gate passes on the exact code intended for `main`.

---

# MARKET REFERENCE UI CONTRACT — 25/09/2026

Public collector-facing market surfaces must keep three different concepts visually and semantically distinct:

1. **Market Value / Valore stimato**
   - TrackDash consolidated valuation only when the engine has sufficient evidence.
   - Must never be visually interchangeable with ASK or SOLD.

2. **SOLD / Vendite concluse**
   - Historical evidence from completed sales.
   - Collector-facing wording: **Vendite concluse** / **Prezzo da vendite concluse**.
   - Visual treatment: green/emerald semantic treatment with completed-sale iconography.

3. **ASK / Annunci attivi**
   - Current seller requests, not completed transactions.
   - Collector-facing wording: **Annunci attivi** / **Prezzo richiesto più basso**.
   - Visual treatment: amber semantic treatment with listing/tag iconography.
   - When useful, explicitly state that it is a seller request and not a completed sale.

## Release family preview rule

In the compact Release rows inside a model/family page:

- if only ASK exists, show the ASK reference;
- if only SOLD exists, show the SOLD reference;
- if both ASK and SOLD exist and no consolidated Market Value exists, show **both at the same time** in two compact rows:
  - SOLD in green, e.g. `Vendite concluse ≈ €19,51`
  - ASK in amber, e.g. `Annunci attivi da €88,00`
- this dual-row treatment is intentionally scoped to Release-family previews where there is enough room;
- tighter compact surfaces such as Collection may keep one primary reference, but must retain the semantic SOLD/ASK badge and wording.

This contract is **global for every Release and every future family**. It is not family-specific.

### Global compact Release-card standard

The family/model page must use one shared compact Release-card layout for **all current and future Mini 4WD families**, regardless of when or under which historical workflow the family was first inserted.

The compact card standard is:

- exact Release image in a compact 3:2 area;
- title;
- one metadata row: Item Number · chassis · year;
- compact rarity / production / ownership badges;
- one-line market boxes:
  - Market Value: distinct brand treatment;
  - SOLD: green/emerald `Vendite concluse ≈ €X`;
  - ASK: amber `Annunci attivi da €X`;
  - SOLD + ASK: both boxes, one line each;
  - no long explanatory SOLD-vs-ASK sentence in the preview;
- compact action buttons.

Older families awaiting re-audit may still contain legacy or incomplete **data**, but they must not retain legacy **preview layouts or wording**. Re-auditing a family changes canonical data/evidence, not the shared Release-card structure.

No family ID, Item Number, release date or audit generation may be used to opt into/out of this layout.

---

# SEO PUBLICATION FRESHNESS CONTRACT — 25/09/2026

The public website, installable PWA and search-engine-facing catalog must remain projections of the same canonical DB-backed catalog.

For public Mini 4WD catalog pages:

- family/model pages and exact Release pages use the same DB-backed catalog data used by the app;
- `research_only` Releases must not be exposed as indexable public catalog entries or sitemap Release URLs;
- canonical Release changes must propagate to the public website/PWA without a separate manual synchronization step;
- public pages remain server-rendered so core identity, images and market references are present in crawlable HTML;
- sitemap `lastmod` must follow the latest meaningful public change available from canonical Release updates, production-status checks, publication-gate changes, verified source checks and market-signal recomputation;
- catalog and market index routes should inherit the latest meaningful child freshness where available.

Do not use a DB child-image trigger solely to touch `product_releases.updated_at`: Release updates can participate in other operational triggers. SEO freshness should be derived from existing authoritative timestamps instead of creating side effects in the Market Engine.

This rule is global for every current and future public Release.



---

# PUBLIC SEO LOCALE CONTRACT — 2026-10-02

This contract is global for every current and future public TrackDash Mini 4WD family and Release.

## One canonical catalog, multiple language projections

Language localization must **never** duplicate canonical Product or ProductRelease records.

Italian and English public pages must read the same DB-backed:
- Product identity;
- ProductRelease identity;
- Item Number;
- release year/date;
- chassis;
- images;
- publication visibility;
- market evidence;
- Market Value / SOLD / ASK;
- Collection/Wishlist references.

A language version is a presentation and SEO projection, not a separate catalog.

## Public URL architecture

Italian is the default public language and owns the existing unprefixed readable URL set:
- `/`
- `/catalog`
- `/market`
- `/catalog/<family>`
- `/catalog/<family>/releases/<release>`

English is published under the `/en` prefix:
- `/en`
- `/en/catalog`
- `/en/market`
- `/en/catalog/<family>`
- `/en/catalog/<family>/releases/<release>`

Do not migrate the Italian URLs to `/it` unless there is a separately approved migration plan based on real Search Console evidence.

## Search-engine contract

For every public language pair:
- server-render the correct language on first response;
- set the correct HTML `lang`;
- self-canonicalize each language URL;
- emit reciprocal `hreflang="it"` and `hreflang="en"`;
- emit `x-default` to the unprefixed Italian/default URL;
- keep metadata, Open Graph, Twitter and structured-data wording aligned with route language;
- keep public internal links inside the active locale;
- include both language variants in the public sitemap;
- keep UUID routes out of the sitemap.

## Translation fallback rule

Italian public pages must **never** fall back to an English descriptive paragraph.

When dedicated Italian editorial copy exists, use it.

When Italian editorial copy is absent:
- generate only a short factual Italian fallback from canonical fields already known for that Product/Release;
- do not invent historical claims;
- do not translate by mutating canonical identity fields;
- do not alter official/canonical edition names merely to make them look Italian.

Display labels may be localized independently from canonical values.

Examples of display-only localization:
- Wishlist → Desideri
- Reissue (generic type/label) → Ristampa
- JAN barcode → Codice JAN
- MSRP → Prezzo di listino
- Market Value → Valore di mercato

Canonical names such as `Black Special`, `Finished Model`, event names, collaboration names and edition titles remain unchanged when they identify the exact Release.

## Regression gate

Any change affecting public localization must preserve:
- one canonical Product/ProductRelease graph;
- identical Release identity/data across IT and EN;
- locale-aware public path tests;
- localization regression tests;
- full repository `pnpm verify` gate;
- Preview QA before Production merge.

The locale system must never become a second source of catalog truth.
