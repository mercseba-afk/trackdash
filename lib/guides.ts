export type GuideLocale = "it" | "en"
type GuideText = { title: string; description: string; category: string; answer: string; sections: { title: string; paragraphs: string[] }[]; imageAlt: string }
export type Guide = { slug: string; published: string; image: string; sourceLinks: { label: string; url: string }[]; relatedPath: string; relatedLabel: string; it: GuideText; en: GuideText }

// Only reviewed, approved articles belong here. Dates describe editorial changes,
// not page views or deployments. No scheduler or database reads are required.
export const guides: Guide[] = [
  {
    slug: "quale-motore-scegliere-mini-4wd", published: "2026-11-16",
    image: "https://www.tamiya.com/japan_contents/img/usr/item/1/18646/18646_1.jpg",
    relatedPath: "/catalog/dcr-01", relatedLabel: "DCR-01",
    sourceLinks: [
      { label: "Tamiya · Mini 4WD Motor Guide", url: "https://www.tamiya.com/cms/english/mini4wd/setupguide/motorguide.pdf" },
      { label: "Tamiya · Atomic-Tuned 2 #15486", url: "https://www.tamiya.com/english/products/15486/index.html" },
      { label: "Tamiya · Atomic-Tuned 2 PRO #15489", url: "https://www.tamiya.com/english/products/15489/index.html" },
      { label: "Tamiya · DCR-01 #18646", url: "https://www.tamiya.com/english/products/18646/index.html" },
    ],
    it: {
      title: "Quale motore scegliere per una Mini 4WD? Guida per iniziare",
      description: "Motore normale o PRO? Parti dal telaio, confronta Torque, Atomic e Rev Tuned e scegli il primo upgrade per la tua Mini 4WD.",
      category: "Motori e pista", imageAlt: "Tamiya DCR-01 #18646 con telaio MA, per motori a doppio albero",
      answer: "Per iniziare, prova il motore del kit. Quando vuoi un primo upgrade, valuta la serie Tuned nella versione compatibile con il tuo telaio. L’Atomic-Tuned 2 è un buon punto di partenza se cerchi equilibrio tra velocità e coppia.",
      sections: [
        { title: "Motore normale o PRO: cosa cambia?", paragraphs: ["Prima del nome, controlla gli alberi: i motori PRO ne hanno due, uno per lato. Le versioni a singolo albero e quelle PRO non sono intercambiabili. Il telaio e le istruzioni del kit sono il riferimento per scegliere.", "Un esempio concreto: la DCR-01 #18646 ha telaio MA e un motore a doppio albero. Per un Atomic-Tuned 2, la versione PRO è la #15489; la #15486 è quella a singolo albero. Due nomi quasi uguali, due prodotti diversi."] },
        { title: "Torque, Atomic o Rev Tuned?", paragraphs: ["Torque-Tuned 2: privilegia la coppia. Atomic-Tuned 2: cerca un equilibrio tra coppia e velocità. Rev-Tuned 2: privilegia il regime di rotazione. Sono tre punti di partenza da provare sulla propria pista, scegliendo sempre la variante compatibile.", "Nella guida Tamiya, la serie Tuned è indicata per chi comincia a migliorare le prestazioni. Il consiglio pratico di TrackDash: cambia un componente alla volta e osserva come si comporta la macchina per diversi giri."] },
        { title: "Come capisco se il nuovo motore va meglio?", paragraphs: ["Confronta i giri sulla stessa pista, con la stessa configurazione e batterie in condizioni comparabili. Annota tempo e numero di giri completati: il risultato interessante è una macchina veloce che riesce a finire il percorso.", "Se dopo il cambio esce spesso, torna alla configurazione precedente e lavora sull’assetto. Scegliere subito un motore più potente rende più difficile capire quale modifica ha migliorato davvero il comportamento."] },
        { title: "Posso usarlo in gara?", paragraphs: ["Controlla il regolamento dell’evento prima di acquistare: categorie e organizzatori possono prevedere motori ammessi specifici. Porta con te il codice esatto del motore, compresa l’eventuale dicitura PRO."] },
        { title: "Cosa controllare prima dell’acquisto?", paragraphs: ["Tre cose: il telaio della tua release, il codice del motore compatibile e le regole della pista in cui correrai. Poi scegli il tuo primo upgrade: Atomic per partire da un compromesso, Torque o Rev quando vuoi confrontare un comportamento diverso."] },
      ],
    },
    en: {
      title: "Which motor should you choose for a Mini 4WD? A beginner’s guide",
      description: "Single-shaft or PRO? Check your chassis, compare Torque, Atomic and Rev Tuned, and choose your first Mini 4WD motor upgrade.",
      category: "Motors and racing", imageAlt: "Tamiya DCR-01 #18646 with MA chassis for double-shaft motors",
      answer: "Start with the kit motor. For your first upgrade, consider a Tuned-series motor that fits your chassis. The Atomic-Tuned 2 is a useful starting point for a balance of speed and torque.",
      sections: [
        { title: "What is different about a PRO motor?", paragraphs: ["PRO motors have two shafts, one at each end. Single-shaft motors and PRO motors are not interchangeable: check your chassis and kit instructions before buying.", "For example, the DCR-01 #18646 uses an MA chassis and a double-shaft motor. The Atomic-Tuned 2 PRO is item #15489; item #15486 is the single-shaft version."] },
        { title: "Torque, Atomic or Rev Tuned?", paragraphs: ["Torque-Tuned 2 prioritizes torque, Atomic-Tuned 2 balances torque and speed, and Rev-Tuned 2 prioritizes rotational speed. Choose the compatible version and compare its behavior on your track.", "Tamiya’s motor guide positions the Tuned series as an entry point for performance upgrades. Our practical advice: change one component at a time and observe several laps."] },
        { title: "How can I compare performance?", paragraphs: ["Use the same track and setup, with batteries in comparable condition. Record both lap times and completed laps. Consistent finishes matter alongside speed.", "If the car frequently leaves the track after a change, return to the previous setup before making further adjustments. This makes it easier to identify which change actually helped."] },
        { title: "Can I use it in a race?", paragraphs: ["Check the event rules before buying. Classes and organizers may specify eligible motors. Use the exact item number, including whether it is a PRO version."] },
        { title: "What should I check before buying?", paragraphs: ["Check your release’s chassis, the compatible motor’s item number and your local event rules. Atomic offers a balanced starting point; Torque and Rev let you explore different characteristics."] },
      ],
    },
  },
  {
    slug: "mini-4wd-prima-edizione-o-ristampa", published: "2026-11-16",
    image: "https://www.tamiya.com/japan_contents/img/usr/item/1/18014/18014_1.jpg",
    relatedPath: "/catalog/avante-jr", relatedLabel: "Avante Jr.",
    sourceLinks: [{ label: "Tamiya · Avante Jr. #18014", url: "https://www.tamiya.com/japan/products/18014/index.html" }],
    it: {
      title: "Come riconoscere una Mini 4WD originale da una ristampa?",
      description: "Prima edizione o ristampa Tamiya? Ecco cosa controllare su codice, scatola e contenuto per identificare la release della tua Mini 4WD.",
      category: "Release e collezionismo", imageAlt: "Avante Jr. #18014 nella foto del catalogo Tamiya attuale: illustrazione del modello, non prova di un esemplare del 1988",
      answer: "Una ristampa Tamiya è comunque un prodotto originale. Per distinguere una prima edizione da una produzione successiva, confronta la release precisa, le fotografie della scatola e il contenuto: il nome del modello, da solo, non basta.",
      sections: [
        { title: "Originale, prima edizione e ristampa: cosa significano?", paragraphs: ["Quando un annuncio dice “originale”, chiedi cosa intende: prodotto autentico Tamiya oppure esemplare della prima produzione? Sono due informazioni diverse. Una ristampa ufficiale può riproporre un modello storico senza appartenere alla sua prima edizione.", "Per cercare e confrontare gli esemplari, parti da una domanda precisa: quale release voglio identificare? Nome, codice articolo ed eventuale edizione speciale aiutano a restringere la ricerca."] },
        { title: "Il codice articolo basta per conoscere l’anno?", paragraphs: ["Non sempre. L’Avante Jr. #18014 è un esempio utile: la pagina attuale Tamiya presenta una ristampa e ricorda il debutto del modello nel dicembre 1988. Il solo numero 18014 non dimostra che una scatola in vendita sia stata prodotta nel 1988.", "Usa quindi il codice per trovare il prodotto e poi confronta le informazioni della specifica edizione. Quando il catalogo distingue più release con lo stesso codice, apri le singole schede prima di attribuire un anno al tuo esemplare."] },
        { title: "Quali foto chiedere al venditore?", paragraphs: ["Chiedi una foto nitida del coperchio, dei lati della scatola con codici e scritte, delle istruzioni e del contenuto, se la confezione è già aperta. Sono i dettagli su cui basare un confronto, insieme alle informazioni documentate della release.", "Puoi scrivere: “Mi mandi una foto dei codici sui lati della scatola e, se è già aperta, delle istruzioni e dei pezzi? Vorrei capire a quale edizione appartiene.” È una richiesta semplice e molto più utile di una sola foto generica del modellino."] },
        { title: "Come confronto scatola e contenuto?", paragraphs: ["Tieni davanti le foto dell’esemplare e la scheda della release: confronta codice, dicitura dell’edizione, telaio e componenti documentati. Una corrispondenza di colore o forma è un indizio da approfondire, non una datazione completa.", "Se alcuni dettagli non coincidono, chiedi se sono stati sostituiti componenti o se la scatola appartiene a un altro esemplare. Conserva le foto e il riferimento usato per il confronto nella tua documentazione di collezionista."] },
        { title: "Una prima edizione vale sempre di più?", paragraphs: ["Per valutarla, identifica prima la release e le condizioni dell’esemplare. Poi confronta dati riferiti a quella versione: su TrackDash trovi distinti il Riferimento mercato e i Prezzi negli annunci. Un prezzo richiesto descrive ciò che chiede il venditore; una vendita documentata racconta un risultato diverso.", "Se l’edizione resta incerta, completa l’identificazione prima di trattare il prezzo come quello di una prima produzione. È il modo più utile per confrontare acquisti davvero simili."] },
      ],
    },
    en: {
      title: "How can you tell a first-edition Mini 4WD from a reissue?",
      description: "Check the item number, packaging and contents to identify a Tamiya Mini 4WD release and distinguish a first edition from an official reissue.",
      category: "Releases and collecting", imageAlt: "Avante Jr. #18014 in Tamiya’s current catalog photo; model illustration, not evidence of a 1988 specimen",
      answer: "An official Tamiya reissue is still a genuine product. To identify a first edition, compare the exact release, box photographs and contents. The model name alone does not establish when a particular kit was produced.",
      sections: [
        { title: "Does original mean first edition?", paragraphs: ["Ask what the seller means by original: genuine Tamiya, or from the first production run? Those are different claims. An official reissue can reproduce a classic model without being a first edition.", "Start with the specific release you want to identify. Its name, item number and special-edition designation help narrow the search."] },
        { title: "Does the item number establish the year?", paragraphs: ["Not always. Tamiya’s current Avante Jr. #18014 page describes a reissue and recalls the model’s December 1988 debut. The number 18014 alone does not prove that a particular box was made in 1988.", "Find the product first, then compare the documented release details. If several releases share an item number, inspect their individual records before assigning a year."] },
        { title: "Which photos should I request?", paragraphs: ["Ask for clear photographs of the lid, box sides with codes and text, instructions and contents if the box is already open. Compare these with documentation for the specific release.", "A simple message works: “Could you send photos of the codes on the box sides and, if already open, the instructions and parts? I would like to identify the edition.”"] },
        { title: "How should I compare the contents?", paragraphs: ["Compare the item number, edition wording, chassis and documented components against the release record. A matching color or shape is a starting point rather than a complete production date.", "If details differ, ask whether components were replaced or the box came from another kit. Keep the photographs and the references used for your identification."] },
        { title: "Is a first edition always worth more?", paragraphs: ["Identify the release and condition before comparing prices. TrackDash distinguishes Market reference from Listing prices. A seller’s asking price and a documented sale provide different information.", "When the edition remains uncertain, resolve the identification before valuing it as a first production. This helps you compare like-for-like examples."] },
      ],
    },
  },
]
