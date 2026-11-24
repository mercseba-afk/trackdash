export type GuideLocale = "it" | "en"
type GuideText = { title: string; description: string; category: string; answer: string; sections: { title: string; paragraphs: string[] }[]; imageAlt: string }
export type Guide = { slug: string; published: string; image: string; sourceLinks: { label: string; url: string }[]; relatedPath: string; relatedLabel: string; it: GuideText; en: GuideText }

// Only reviewed, approved articles belong here. Dates describe editorial changes,
// not page views or deployments. No scheduler or database reads are required.
export const guides: Guide[] = [
{
  "slug": "gomme-mini-4wd-standard-hard-super-hard",
  "published": "2026-11-24",
  "image": "https://www.tamiya.com/japan_contents/img/usr/item/1/15542/15542_1.jpg",
  "relatedPath": "/catalog/mach-frame",
  "relatedLabel": "Mach Frame",
  "sourceLinks": [
    {
      "label": "Tamiya · Mini 4WD Setup Guide",
      "url": "https://www.tamiya.com/english/mini4wd/setupguide/setupguide.htm"
    },
    {
      "label": "Tamiya · Super Hard 26 mm e cerchi #15542",
      "url": "https://www.tamiya.com/english/products/15542/index.html"
    },
    {
      "label": "Tamiya · Hard 26 mm e cerchi #15545",
      "url": "https://www.tamiya.com/english/products/15545index.html"
    },
    {
      "label": "Tamiya · Mach Frame #18714",
      "url": "https://www.tamiya.com/english/products/18714/index.html"
    }
  ],
  "it": {
    "title": "Gomme Mini 4WD: standard, hard o super hard?",
    "description": "Scopri cosa cambia tra gomme standard, hard e super hard per Mini 4WD: aderenza, curve, salti e controlli prima di scegliere un nuovo set.",
    "category": "Gomme e assetto",
    "imageAlt": "Set Tamiya #15542: gomme super hard a basso profilo da 26 mm e cerchi rinforzati",
    "answer": "Parti dalle gomme del kit e scegli la mescola in base al comportamento in pista. Le hard e super hard offrono generalmente meno aderenza delle gomme standard più morbide: possono aiutare in curva, ma la scelta va verificata insieme a diametro, cerchi e assetto.",
    "sections": [
      {
        "title": "Cosa cambia tra standard, hard e super hard?",
        "paragraphs": [
          "Standard indica le gomme fornite in una determinata versione del kit, non una mescola unica per tutte le Mini 4WD. Alcune release includono già gomme super hard: è il caso della Mach Frame #18714. Controlla quindi le specifiche della tua release prima di comprare un ricambio.",
          "Hard e super hard identificano mescole più dure. Un esempio documentato è il set hard #15545, che Tamiya descrive come meno aderente delle gomme standard; il set super hard #15542 è proposto anche per limitare il rimbalzo dopo i salti."
        ]
      },
      {
        "title": "Perché meno aderenza può aiutare in curva?",
        "paragraphs": [
          "Nelle Mini 4WD i rulli guidano la macchina lungo le sponde. La guida Tamiya spiega che una gomma meno aderente può ridurre la perdita di velocità in curva. Il risultato dipende anche da larghezza e forma del pneumatico: la sola durezza non descrive tutto l’assetto."
        ]
      },
      {
        "title": "Le super hard risolvono i problemi nei salti?",
        "paragraphs": [
          "Possono essere una modifica da provare, non una soluzione universale. Nella scheda #15542 Tamiya associa queste gomme a un minore rimbalzo, ma per una macchina che esce dopo un salto vanno osservati anche velocità d’ingresso, freni e mass damper. Il consiglio pratico è capire prima in quale punto perde stabilità."
        ]
      },
      {
        "title": "Cosa controllare prima di acquistare?",
        "paragraphs": [
          "Verifica il codice del set, il diametro esterno, la misura e il profilo del cerchio, lo spazio sotto la carrozzeria e la compatibilità dichiarata per il telaio. Due gomme dello stesso colore possono avere specifiche diverse. Per alcuni abbinamenti Tamiya segnala la necessità di modifiche: leggi le istruzioni del componente esatto."
        ]
      },
      {
        "title": "Come fare una prova utile?",
        "paragraphs": [
          "Metodo pratico TrackDash: annota il set iniziale, prova più giri e cambia una sola variabile. Tieni confrontabili batterie e condizioni della pista, quindi confronta tempi e giri completati. Scegli il set che funziona sul tuo percorso, rispettando il regolamento dell’evento."
        ]
      }
    ]
  },
  "en": {
    "title": "Mini 4WD tires: standard, hard or super hard?",
    "description": "Compare standard, hard and super hard Mini 4WD tires: grip, cornering, jumps and the compatibility checks to make before choosing a new set.",
    "category": "Tires and setup",
    "imageAlt": "Tamiya #15542 set: 26 mm super hard low-profile tires and reinforced wheels",
    "answer": "Start with the kit tires and choose a compound based on track behavior. Hard and super hard tires generally provide less grip than softer standard tires. They can help cornering, but diameter, wheel compatibility and the complete setup matter too.",
    "sections": [
      {
        "title": "How do standard, hard and super hard differ?",
        "paragraphs": [
          "Standard means the tires supplied with a particular kit version, not one universal compound. Some releases already include super hard tires: Mach Frame #18714 is an example. Check the specifications of your release before buying replacements.",
          "Hard and super hard describe harder compounds. Tamiya describes the hard #15545 set as having less grip than standard tires, while the super hard #15542 set is also intended to reduce bounce after jumps."
        ]
      },
      {
        "title": "Why can less grip help cornering?",
        "paragraphs": [
          "Mini 4WD rollers guide the car along the lane walls. Tamiya’s setup guide explains that less grippy tires can reduce cornering speed loss. Width and tire shape also matter, so hardness alone does not describe the whole setup."
        ]
      },
      {
        "title": "Will super hard tires solve jumping problems?",
        "paragraphs": [
          "They are a change to test rather than a universal fix. Tamiya associates the #15542 tires with less bounce, but entry speed, brakes and mass dampers also deserve attention when a car leaves the course after a jump. First observe exactly where stability is lost."
        ]
      },
      {
        "title": "What should you check before buying?",
        "paragraphs": [
          "Check the set’s item number, outer diameter, wheel size and profile, body clearance and stated chassis compatibility. Matching colors do not establish identical specifications. Tamiya notes that some combinations require modifications: read the instructions for the exact component."
        ]
      },
      {
        "title": "How should you test a new set?",
        "paragraphs": [
          "TrackDash practical method: record the starting setup, run several laps and change one variable at a time. Keep batteries and track conditions comparable, then compare lap times and completed laps. Choose what works on your course and complies with the event rules."
        ]
      }
    ]
  }
},
{
  "slug": "telaio-ma-fm-a-differenze-mini-4wd",
  "published": "2026-11-24",
  "image": "https://www.tamiya.com/japan_contents/img/usr/item/1/18714/18714_1.jpg",
  "relatedPath": "/catalog/dcr-01",
  "relatedLabel": "DCR-01",
  "sourceLinks": [
    {
      "label": "Tamiya · Mini 4WD Chassis & Compatible Parts",
      "url": "https://www.tamiya.com/english/cms/mini4wd_chassis_select.html"
    },
    {
      "label": "Tamiya · DCR-01 #18646, telaio MA",
      "url": "https://www.tamiya.com/english/products/18646/index.html"
    },
    {
      "label": "Tamiya · Mach Frame #18714, telaio FM-A",
      "url": "https://www.tamiya.com/english/products/18714/index.html"
    },
    {
      "label": "Tamiya · Motor Guide",
      "url": "https://www.tamiya.com/cms/english/mini4wd/setupguide/motorguide.pdf"
    },
    {
      "label": "Tamiya · Atomic-Tuned 2 PRO #15489",
      "url": "https://www.tamiya.com/english/products/15489/index.html"
    }
  ],
  "it": {
    "title": "Telaio MA o FM-A: differenze e quale scegliere",
    "description": "MA e FM-A a confronto: posizione del motore, compatibilità e consigli per iniziare. Gli esempi DCR-01 #18646 e Mach Frame #18714.",
    "category": "Telai e modelli",
    "imageAlt": "Tamiya Mach Frame #18714, esempio di Mini 4WD con telaio FM-A e motore anteriore",
    "answer": "Il MA ha il motore al centro e usa motori PRO a doppio albero; il FM-A lo colloca davanti e usa motori a singolo albero. Entrambi sono basi valide per iniziare: scegli il kit che ti interessa e controlla i componenti previsti per il suo telaio.",
    "sections": [
      {
        "title": "Qual è la differenza più importante?",
        "paragraphs": [
          "È la disposizione della trasmissione. Sul MA il motore centrale a doppio albero aziona la trasmissione anteriore e posteriore. Sul FM-A il motore è anteriore. Prima di scegliere un upgrade, identifica il telaio e confronta il codice del componente con le istruzioni."
        ]
      },
      {
        "title": "Cosa offre il telaio MA?",
        "paragraphs": [
          "MA significa Midship AERO. Tamiya ne evidenzia il telaio monoscocca in un solo pezzo, pensato per agevolare assemblaggio e manutenzione. La DCR-01 #18646 è un esempio di kit MA: nella scelta del motore serve la variante PRO.",
          "Per riconoscere un ricambio concreto, l’Atomic-Tuned 2 PRO #15489 è indicato da Tamiya per il MA. La parola PRO identifica qui la famiglia di motori compatibili; non significa che il kit sia riservato a piloti esperti."
        ]
      },
      {
        "title": "Cosa offre il telaio FM-A?",
        "paragraphs": [
          "La posizione anteriore del motore porta il baricentro verso il davanti. Nella Mach Frame #18714 Tamiya presenta questo schema per percorsi anche con frequenti cambi di quota; l’accesso al motore dal fondo facilita gli interventi. Sono caratteristiche del progetto, da valutare con l’assetto completo."
        ]
      },
      {
        "title": "Quale scegliere per iniziare?",
        "paragraphs": [
          "Consiglio pratico TrackDash: parti da un modello che ti piace e dai ricambi che riesci a trovare. La DCR-01 #18646 permette di iniziare sul MA; la Mach Frame #18714 sul FM-A. Monta il kit seguendo le istruzioni e prova la configurazione di partenza prima di cercare più velocità.",
          "Il nome del telaio da solo non stabilisce quale macchina vincerà: confronta la configurazione effettiva sulla stessa pista. Per una gara, controlla anche categoria e regolamento dell’organizzatore."
        ]
      },
      {
        "title": "Motori, carrozzerie e accessori sono intercambiabili?",
        "paragraphs": [
          "I motori PRO a doppio albero del MA non sostituiscono quelli a singolo albero del FM-A. Per carrozzerie, supporti e altri accessori controlla invece la compatibilità del codice specifico: alcuni pezzi coprono più telai, altri richiedono componenti o adattamenti dedicati.",
          "Nel catalogo TrackDash apri la release precisa e controlla il campo telaio. È il punto di partenza per organizzare la collezione e cercare le informazioni del tuo kit."
        ]
      }
    ]
  },
  "en": {
    "title": "MA or FM-A chassis: differences and how to choose",
    "description": "Compare MA and FM-A motor layouts, compatibility and beginner choices, using the DCR-01 #18646 and Mach Frame #18714 as practical examples.",
    "category": "Chassis and models",
    "imageAlt": "Tamiya Mach Frame #18714, an example of a Mini 4WD with a front-motor FM-A chassis",
    "answer": "MA places a double-shaft PRO motor in the center; FM-A places a single-shaft motor at the front. Both can be starting points for a beginner. Choose a kit you like and check the components specified for its chassis.",
    "sections": [
      {
        "title": "What is the main difference?",
        "paragraphs": [
          "The drivetrain layout. MA uses a central double-shaft motor to drive the front and rear transmission, while FM-A places the motor at the front. Identify the chassis and check the component’s item number against the instructions before choosing an upgrade."
        ]
      },
      {
        "title": "What does the MA chassis offer?",
        "paragraphs": [
          "MA stands for Midship AERO. Tamiya highlights its single-piece monocoque frame, designed to make assembly and maintenance approachable. DCR-01 #18646 is an MA kit: motor upgrades need the compatible PRO version.",
          "For a specific replacement example, Tamiya lists the Atomic-Tuned 2 PRO #15489 as compatible with MA. PRO identifies the compatible motor family here; it does not mean the kit is only for expert racers."
        ]
      },
      {
        "title": "What does the FM-A chassis offer?",
        "paragraphs": [
          "The front motor shifts the center of gravity forward. For Mach Frame #18714, Tamiya describes this layout as suitable for courses including frequent elevation changes. Motor access from underneath simplifies servicing. Assess these design features together with the complete setup."
        ]
      },
      {
        "title": "Which should a beginner choose?",
        "paragraphs": [
          "TrackDash practical advice: start with a model you enjoy and replacement parts you can obtain. DCR-01 #18646 offers an MA starting point; Mach Frame #18714 offers FM-A. Follow the kit instructions and test the original setup before chasing more speed.",
          "A chassis name alone does not determine which car will win. Compare the actual setups on the same course, and check the organizer’s class and event rules before racing."
        ]
      },
      {
        "title": "Are motors, bodies and accessories interchangeable?",
        "paragraphs": [
          "MA’s double-shaft PRO motors cannot replace FM-A’s single-shaft motors. For bodies, stays and other accessories, check compatibility for the exact item number. Some parts fit multiple chassis; others need dedicated components or adaptations.",
          "Open the precise release in the TrackDash catalog and check its chassis field. This is a useful starting point for organizing your collection and finding information about your kit."
        ]
      }
    ]
  }
},
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
