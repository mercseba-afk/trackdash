# TRACKDASH — METODO OPERATIVO MASTER

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
Quando esiste mercato reale ma non ancora abbastanza robusto per un Market Value, utilizzare:
**Prezzo osservato \~€XX**

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
Priorità:

1. Tamiya ufficiale;
2. Tamiya archive/catalog;
3. fonte contemporanea affidabile;
4. retailer exact-product affidabile.

Verificare sempre:

- exact Release;
- URL raggiungibile;
- HTTP valido;
- host/path compatibile con Next Image;
- rendering Production.

## Regola fondamentale

Una Release specifica **NON deve ereditare silenziosamente**:

- immagine Product generica;
- immagine Release sorella;
- immagine di un'altra variante.

Se non trovi l'immagine esatta dopo audit reale:
**EXACT IMAGE NOT FOUND AFTER AUDIT**
e mostra placeholder.
Meglio placeholder corretto che foto sbagliata.

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
**Prezzo osservato \~€XX**
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
- un cluster SOLD single-seller non deve da solo diventare Market Value solo perché il volume è alto;
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
