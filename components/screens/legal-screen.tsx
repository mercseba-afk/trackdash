"use client"

import * as React from "react"
import Link from "next/link"
import { ShieldCheck, Scale } from "lucide-react"
import { useI18n } from "@/lib/i18n"

type LegalKind = "privacy" | "terms"

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="scroll-mt-24 border-t border-border pt-7 first:border-t-0 first:pt-0">
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-navy">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  )
}

function BulletList({ children }: { children: React.ReactNode }) {
  return <ul className="ml-5 list-disc space-y-2">{children}</ul>
}

function InlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="font-medium text-brand underline-offset-4 hover:underline">{children}</Link>
}

export function LegalScreen({ kind }: { kind: LegalKind }) {
  const { locale } = useI18n()
  const it = locale === "it"

  if (kind === "privacy") {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6 md:py-14 lg:px-8">
        <div className="mb-9 rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-4 grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
            <ShieldCheck className="size-5" />
          </div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
            {it ? "Privacy e dati personali" : "Privacy & personal data"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-navy sm:text-4xl">
            {it ? "Privacy Policy" : "Privacy Policy"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            {it
              ? "Questa informativa descrive quali dati personali tratta TrackDash, perché li tratta, come vengono protetti e quali scelte hai sul tuo account."
              : "This notice explains what personal data TrackDash processes, why it processes it, how it is protected, and the choices you have over your account."}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            {it ? "Ultimo aggiornamento: 20 settembre 2026" : "Last updated: September 20, 2026"}
          </p>
        </div>

        <div className="space-y-8 rounded-3xl border border-border bg-white p-6 sm:p-8">
          <Section title={it ? "1. Chi gestisce il trattamento" : "1. Who controls the processing"}>
            <p>
              {it
                ? "TrackDash è un progetto indipendente dedicato ai collezionisti di Mini 4WD. Il titolare del trattamento è il gestore del servizio TrackDash, che determina finalità e modalità dei trattamenti descritti in questa informativa."
                : "TrackDash is an independent project for Mini 4WD collectors. The data controller is the operator of the TrackDash service, which determines the purposes and means of the processing described in this notice."}
            </p>
            <p>
              {it
                ? "Per richieste relative ai dati personali puoi utilizzare la sezione Assistenza disponibile nel tuo account. Se non riesci ad accedere, puoi utilizzare il contatto di supporto pubblicato nella configurazione OAuth/Google di TrackDash."
                : "For personal-data requests you can use the Support section available in your account. If you cannot access your account, you can use the support contact published in TrackDash's Google/OAuth configuration."}
            </p>
          </Section>

          <Section title={it ? "2. Dati che possiamo trattare" : "2. Data we may process"}>
            <BulletList>
              <li>
                {it
                  ? "Dati account e profilo: email, identificativo account, username, paese, lingua e preferenze."
                  : "Account and profile data: email address, account identifier, username, country, language, and preferences."}
              </li>
              <li>
                {it
                  ? "Dati della Collection e dei Desideri: Release salvate, quantità, stato, prezzo pagato, note, visibilità e fotografie caricate volontariamente."
                  : "Collection and Wishlist data: saved Releases, quantities, condition, purchase price, notes, visibility, and photos you voluntarily upload."}
              </li>
              <li>
                {it
                  ? "Dati community e marketplace: messaggi, conversazioni, offerte, stato delle trattative, segnalazioni di vendita e conferme o contestazioni tra utenti."
                  : "Community and marketplace data: messages, conversations, offers, deal status, reported sales, and confirmations or disputes between users."}
              </li>
              <li>
                {it
                  ? "Richieste di assistenza e feedback inviati tramite TrackDash."
                  : "Support requests and feedback submitted through TrackDash."}
              </li>
              <li>
                {it
                  ? "Dati tecnici e di sicurezza necessari per autenticazione, sessioni, prevenzione abusi, diagnosi degli errori e funzionamento del servizio."
                  : "Technical and security data needed for authentication, sessions, abuse prevention, error diagnosis, and operation of the service."}
              </li>
              <li>
                {it
                  ? "Statistiche aggregate di utilizzo, come visualizzazioni di pagina e percorsi più consultati."
                  : "Aggregate usage statistics, such as page views and the most visited routes."}
              </li>
            </BulletList>
          </Section>

          <Section title={it ? "3. Accesso con Google" : "3. Sign in with Google"}>
            <p>
              {it
                ? "Se scegli “Continua con Google”, TrackDash usa Google esclusivamente come provider di autenticazione tramite Supabase Auth."
                : "If you choose “Continue with Google”, TrackDash uses Google solely as an authentication provider through Supabase Auth."}
            </p>
            <p>
              {it
                ? "Gli scope richiesti sono openid, email e profile. TrackDash può quindi ricevere l'identificativo del tuo account Google, l'indirizzo email e le informazioni di profilo di base rese disponibili da Google per autenticarti e creare o collegare la tua identità TrackDash."
                : "The requested scopes are openid, email, and profile. TrackDash may therefore receive your Google account identifier, email address, and basic profile information made available by Google so it can authenticate you and create or link your TrackDash identity."}
            </p>
            <p>
              {it
                ? "TrackDash non richiede accesso a Gmail, Google Drive, Calendario, contatti o altri contenuti del tuo account Google e non utilizza i dati Google per pubblicità o profilazione commerciale."
                : "TrackDash does not request access to Gmail, Google Drive, Calendar, contacts, or other content in your Google account, and does not use Google user data for advertising or commercial profiling."}
            </p>
          </Section>

          <Section title={it ? "4. Perché trattiamo i dati" : "4. Why we process data"}>
            <BulletList>
              <li>
                {it
                  ? "Erogare il servizio richiesto: creare e gestire l'account, Collection, Wishlist, Scanner, messaggi, offerte e funzioni community."
                  : "Provide the service you request: create and manage your account, Collection, Wishlist, Scanner, messages, offers, and community features."}
              </li>
              <li>
                {it
                  ? "Proteggere TrackDash e gli utenti: autenticazione, 2FA, controllo accessi, sicurezza, prevenzione di abusi e gestione degli errori."
                  : "Protect TrackDash and its users: authentication, 2FA, access control, security, abuse prevention, and error handling."}
              </li>
              <li>
                {it
                  ? "Migliorare il servizio attraverso metriche aggregate e non pubblicitarie."
                  : "Improve the service through aggregate, non-advertising metrics."}
              </li>
              <li>
                {it
                  ? "Rispondere a richieste di assistenza e adempiere a eventuali obblighi legali."
                  : "Respond to support requests and comply with applicable legal obligations."}
              </li>
            </BulletList>
            <p>
              {it
                ? "Le basi giuridiche possono includere l'esecuzione del servizio richiesto dall'utente, il legittimo interesse alla sicurezza e al miglioramento del servizio, il consenso quando richiesto e l'adempimento di obblighi di legge."
                : "Legal bases may include performance of the service requested by the user, legitimate interests in service security and improvement, consent where required, and compliance with legal obligations."}
            </p>
          </Section>

          <Section title={it ? "5. Fornitori e destinatari" : "5. Providers and recipients"}>
            <p>
              {it
                ? "TrackDash utilizza fornitori tecnici necessari all'erogazione del servizio. Tra questi, allo stato attuale:"
                : "TrackDash uses technical providers necessary to operate the service. At present, these include:"}
            </p>
            <BulletList>
              <li>
                {it
                  ? "Supabase: autenticazione, database e storage applicativo."
                  : "Supabase: authentication, database, and application storage."}
              </li>
              <li>
                {it
                  ? "Vercel: hosting, distribuzione dell'applicazione e Web Analytics."
                  : "Vercel: hosting, application delivery, and Web Analytics."}
              </li>
              <li>
                {it
                  ? "Google: provider di identità quando scegli volontariamente l'accesso con Google."
                  : "Google: identity provider when you voluntarily choose Google sign-in."}
              </li>
            </BulletList>
            <p>
              {it
                ? "Non vendiamo i tuoi dati personali a inserzionisti. I dati possono essere comunicati ad autorità o altri soggetti quando richiesto dalla legge o necessario per tutelare diritti e sicurezza."
                : "We do not sell your personal data to advertisers. Data may be disclosed to authorities or other parties where required by law or necessary to protect rights and security."}
            </p>
          </Section>

          <Section title={it ? "6. Analytics, cookie e tecnologie locali" : "6. Analytics, cookies, and local technologies"}>
            <p>
              {it
                ? "TrackDash usa cookie o meccanismi tecnici necessari per autenticazione, sessione e sicurezza, oltre a memorizzazione locale per preferenze come la lingua e per funzionalità della PWA."
                : "TrackDash uses cookies or equivalent technical mechanisms required for authentication, sessions, and security, plus local storage for preferences such as language and PWA functionality."}
            </p>
            <p>
              {it
                ? "Vercel Web Analytics viene utilizzato per statistiche aggregate del traffico e non usa cookie di tracciamento pubblicitario. TrackDash mantiene inoltre contatori interni aggregati delle visualizzazioni di pagina senza memorizzare in tali contatori indirizzi IP, user agent o identificativi utente."
                : "Vercel Web Analytics is used for aggregate traffic statistics and does not use advertising tracking cookies. TrackDash also keeps internal aggregate page-view counters without storing IP addresses, user agents, or user identifiers in those counters."}
            </p>
            <p>
              {it
                ? "Se in futuro verranno introdotti cookie o tecnologie non necessarie che richiedono consenso, questa informativa e le relative scelte verranno aggiornate prima dell'attivazione."
                : "If non-essential cookies or technologies requiring consent are introduced in the future, this notice and the related choices will be updated before they are enabled."}
            </p>
          </Section>

          <Section title={it ? "7. Conservazione e cancellazione" : "7. Retention and deletion"}>
            <p>
              {it
                ? "Conserviamo i dati personali per il tempo necessario a fornire TrackDash e alle finalità descritte. Puoi eliminare il tuo account dalle Impostazioni: la richiesta rimuove l'account e i dati collegati secondo il flusso tecnico previsto dal servizio."
                : "We retain personal data for as long as necessary to provide TrackDash and for the purposes described above. You can delete your account from Settings: the request removes the account and linked data according to the service's technical deletion flow."}
            </p>
            <p>
              {it
                ? "Copie tecniche, backup, log di sicurezza o dati che devono essere conservati per obblighi legali possono persistere per un periodo limitato prima della cancellazione o anonimizzazione."
                : "Technical copies, backups, security logs, or data that must be retained for legal obligations may remain for a limited period before deletion or anonymisation."}
            </p>
          </Section>

          <Section title={it ? "8. Trasferimenti internazionali" : "8. International transfers"}>
            <p>
              {it
                ? "Alcuni fornitori tecnologici possono trattare dati anche fuori dallo Spazio Economico Europeo. Quando applicabile, il trattamento avviene sulla base dei meccanismi di trasferimento e delle garanzie previste dalla normativa europea e dagli accordi del relativo fornitore."
                : "Some technology providers may process data outside the European Economic Area. Where applicable, processing relies on transfer mechanisms and safeguards provided by European law and the relevant provider agreements."}
            </p>
          </Section>

          <Section title={it ? "9. I tuoi diritti" : "9. Your rights"}>
            <p>
              {it
                ? "Nei casi previsti dalla normativa applicabile puoi chiedere accesso, rettifica, cancellazione, limitazione del trattamento, portabilità e opposizione, oltre a revocare il consenso quando il trattamento si basa sul consenso."
                : "Where provided by applicable law, you may request access, rectification, erasure, restriction of processing, portability, and objection, and withdraw consent where processing is based on consent."}
            </p>
            <p>
              {it
                ? "Hai inoltre il diritto di proporre reclamo all'autorità di protezione dei dati competente. Alcune modifiche e la cancellazione dell'account possono essere gestite direttamente dalle Impostazioni di TrackDash."
                : "You also have the right to lodge a complaint with the competent data protection authority. Some changes and account deletion can be handled directly from TrackDash Settings."}
            </p>
          </Section>

          <Section title={it ? "10. Sicurezza" : "10. Security"}>
            <p>
              {it
                ? "TrackDash adotta misure tecniche e organizzative proporzionate al servizio, tra cui autenticazione gestita, controlli di autorizzazione, Row Level Security sul database, protezione delle credenziali server-side e autenticazione a due fattori dove prevista."
                : "TrackDash uses technical and organisational measures proportionate to the service, including managed authentication, authorisation controls, database Row Level Security, server-side credential protection, and two-factor authentication where applicable."}
            </p>
          </Section>

          <Section title={it ? "11. Minori" : "11. Children"}>
            <p>
              {it
                ? "TrackDash non è progettato specificamente per raccogliere dati di minori. Se l'utilizzo del servizio da parte di un minore richiede il consenso di un genitore o tutore secondo la legge applicabile, tale autorizzazione deve essere ottenuta prima della registrazione."
                : "TrackDash is not specifically designed to collect children's data. Where applicable law requires parental or guardian consent for a minor to use the service, that authorisation must be obtained before registration."}
            </p>
          </Section>

          <Section title={it ? "12. Modifiche a questa informativa" : "12. Changes to this notice"}>
            <p>
              {it
                ? "Potremo aggiornare questa Privacy Policy quando cambiano le funzionalità, i fornitori o gli obblighi applicabili. La data di aggiornamento sarà indicata in alto e, per modifiche rilevanti, potremo fornire un avviso aggiuntivo nel servizio."
                : "We may update this Privacy Policy when features, providers, or applicable requirements change. The update date will appear above and, for material changes, we may provide an additional notice in the service."}
            </p>
          </Section>

          <div className="rounded-2xl bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            {it ? (
              <>
                Consulta anche i <InlineLink href="/terms">Termini di utilizzo</InlineLink>.
              </>
            ) : (
              <>
                See also the <InlineLink href="/terms">Terms of Use</InlineLink>.
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6 md:py-14 lg:px-8">
      <div className="mb-9 rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
          <Scale className="size-5" />
        </div>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">
          {it ? "Condizioni del servizio" : "Service conditions"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-navy sm:text-4xl">
          {it ? "Termini di utilizzo" : "Terms of Use"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
          {it
            ? "Questi Termini disciplinano l'accesso e l'utilizzo di TrackDash, incluse Collection, dati di mercato, community e funzioni di compravendita tra utenti."
            : "These Terms govern access to and use of TrackDash, including Collection, market data, community, and user-to-user trading features."}
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          {it ? "Ultimo aggiornamento: 20 settembre 2026" : "Last updated: September 20, 2026"}
        </p>
      </div>

      <div className="space-y-8 rounded-3xl border border-border bg-white p-6 sm:p-8">
        <Section title={it ? "1. Cos'è TrackDash" : "1. What TrackDash is"}>
          <p>
            {it
              ? "TrackDash è una piattaforma indipendente per collezionisti di Mini 4WD che consente di identificare Release specifiche, organizzare Collection e Wishlist, consultare informazioni e stime di mercato e interagire con altri collezionisti."
              : "TrackDash is an independent platform for Mini 4WD collectors that helps identify specific Releases, organise Collections and Wishlists, view information and market estimates, and interact with other collectors."}
          </p>
          <p>
            {it
              ? "TrackDash non è affiliato, sponsorizzato o approvato da Tamiya, salvo eventuali indicazioni espresse e documentate. Marchi, nomi di prodotti e altri segni distintivi appartengono ai rispettivi titolari."
              : "TrackDash is not affiliated with, sponsored by, or endorsed by Tamiya unless expressly and verifiably stated. Trademarks, product names, and other distinctive signs belong to their respective owners."}
          </p>
        </Section>

        <Section title={it ? "2. Account e accesso" : "2. Account and access"}>
          <p>
            {it
              ? "Per utilizzare le funzioni personali devi creare un account e fornire informazioni accurate. Sei responsabile della sicurezza delle tue credenziali e delle attività effettuate con il tuo account."
              : "To use personal features you must create an account and provide accurate information. You are responsible for the security of your credentials and activity performed through your account."}
          </p>
          <p>
            {it
              ? "Puoi accedere con email/password o, quando disponibile, con Google. L'accesso tramite Google autentica la tua identità ma non attribuisce a TrackDash accesso ai contenuti del tuo account Google oltre agli scope dichiarati nella Privacy Policy."
              : "You may sign in with email/password or, when available, with Google. Google sign-in authenticates your identity but does not give TrackDash access to Google account content beyond the scopes described in the Privacy Policy."}
          </p>
        </Section>

        <Section title={it ? "3. Collection, contenuti e visibilità" : "3. Collection, content, and visibility"}>
          <p>
            {it
              ? "Sei responsabile delle informazioni, fotografie, note e altri contenuti che carichi. Devi avere il diritto di utilizzare e condividere tali contenuti."
              : "You are responsible for information, photos, notes, and other content you upload. You must have the right to use and share that content."}
          </p>
          <p>
            {it
              ? "La Collection è privata salvo le funzioni che scegli esplicitamente di rendere condivise. Quando abiliti la condivisione o l'apertura alle offerte, le informazioni indicate dall'interfaccia possono diventare visibili ad altri utenti."
              : "Your Collection is private except for features you explicitly choose to share. When you enable sharing or openness to offers, the information indicated by the interface may become visible to other users."}
          </p>
        </Section>

        <Section title={it ? "4. Market Value, ASK e dati di mercato" : "4. Market Value, ASK, and market data"}>
          <p>
            {it
              ? "Market Value, trend, ASK, disponibilità e altri indicatori TrackDash sono stime informative costruite sui dati disponibili. Non costituiscono perizie, consulenza finanziaria, garanzie di prezzo o promessa che un oggetto possa essere comprato o venduto a un determinato importo."
              : "Market Value, trends, ASK, availability, and other TrackDash indicators are informational estimates built from available data. They are not appraisals, financial advice, price guarantees, or promises that an item can be bought or sold at a particular amount."}
          </p>
          <p>
            {it
              ? "Le fonti esterne possono essere incomplete, ritardate, modificate o errate. TrackDash cerca di distinguere Release, edizioni e segnali di mercato con criteri conservativi, ma non garantisce completezza o assenza di errori."
              : "External sources may be incomplete, delayed, changed, or inaccurate. TrackDash aims to distinguish Releases, editions, and market signals conservatively, but does not guarantee completeness or the absence of errors."}
          </p>
        </Section>

        <Section title={it ? "5. Offerte e compravendite tra utenti" : "5. Offers and user-to-user transactions"}>
          <p>
            {it
              ? "TrackDash può consentire agli utenti di contattarsi, inviare offerte e registrare l'esito di una trattativa. Salvo futura indicazione espressa, TrackDash non è il venditore, l'acquirente, il mandatario, l'intermediario finanziario o il servizio di escrow della compravendita."
              : "TrackDash may allow users to contact each other, make offers, and record the outcome of a deal. Unless expressly stated otherwise in the future, TrackDash is not the seller, buyer, agent, financial intermediary, or escrow service for the transaction."}
          </p>
          <p>
            {it
              ? "Prezzo finale, pagamento, spedizione, consegna, autenticità, condizioni dell'oggetto, imposte e rispetto delle leggi applicabili restano responsabilità delle parti coinvolte."
              : "Final price, payment, shipping, delivery, authenticity, item condition, taxes, and compliance with applicable law remain the responsibility of the parties involved."}
          </p>
          <p>
            {it
              ? "Quando venditore e compratore confermano una vendita attraverso le funzioni TrackDash, il servizio può registrare la transazione e trasferire la copia interessata nella Collection del compratore. La conferma deve riflettere una transazione reale."
              : "When seller and buyer confirm a sale through TrackDash features, the service may record the transaction and transfer the relevant copy to the buyer's Collection. Confirmation must reflect a real transaction."}
          </p>
        </Section>

        <Section title={it ? "6. Comportamenti non consentiti" : "6. Prohibited conduct"}>
          <BulletList>
            <li>{it ? "Creare offerte, vendite, recensioni o segnali di mercato falsi o manipolati." : "Creating fake or manipulated offers, sales, reviews, or market signals."}</li>
            <li>{it ? "Usare TrackDash per frodi, spam, molestie, contenuti illegali o violazione dei diritti altrui." : "Using TrackDash for fraud, spam, harassment, illegal content, or infringement of others' rights."}</li>
            <li>{it ? "Tentare di aggirare autenticazione, autorizzazioni, limiti tecnici o misure di sicurezza." : "Attempting to bypass authentication, authorisation, technical limits, or security measures."}</li>
            <li>{it ? "Accedere, estrarre o modificare dati con modalità non previste dalle normali funzioni del servizio." : "Accessing, extracting, or modifying data through methods outside the service's normal intended features."}</li>
            <li>{it ? "Impersonare altre persone o fornire informazioni deliberatamente ingannevoli." : "Impersonating others or deliberately providing misleading information."}</li>
          </BulletList>
        </Section>

        <Section title={it ? "7. Disponibilità e modifiche del servizio" : "7. Service availability and changes"}>
          <p>
            {it
              ? "TrackDash è un servizio in evoluzione. Funzioni, fonti dati, limiti, design e disponibilità possono cambiare. Possiamo sospendere temporaneamente parti del servizio per manutenzione, sicurezza o problemi tecnici."
              : "TrackDash is an evolving service. Features, data sources, limits, design, and availability may change. We may temporarily suspend parts of the service for maintenance, security, or technical issues."}
          </p>
          <p>
            {it
              ? "Facciamo il possibile per mantenere il servizio affidabile, ma non garantiamo disponibilità continua, assenza di errori o compatibilità permanente con ogni dispositivo o fonte esterna."
              : "We aim to keep the service reliable, but do not guarantee uninterrupted availability, error-free operation, or permanent compatibility with every device or external source."}
          </p>
        </Section>

        <Section title={it ? "8. Piano Free e future funzioni Pro" : "8. Free plan and future Pro features"}>
          <p>
            {it
              ? "Al momento TrackDash non effettua addebiti per un piano Pro. L'interfaccia può mostrare funzioni o strutture predisposte per futuri piani a pagamento, ma nessun addebito viene effettuato finché checkout, prezzi e condizioni economiche non vengono espressamente attivati e comunicati."
              : "TrackDash currently does not charge for a Pro plan. The interface may show features or structures prepared for future paid plans, but no charge is made until checkout, pricing, and commercial terms are expressly activated and communicated."}
          </p>
          <p>
            {it
              ? "Prima dell'introduzione di un servizio a pagamento, i relativi prezzi, rinnovi, cancellazioni e condizioni saranno indicati chiaramente."
              : "Before any paid service is introduced, its pricing, renewals, cancellation rules, and related terms will be clearly disclosed."}
          </p>
        </Section>

        <Section title={it ? "9. Sospensione e cancellazione dell'account" : "9. Suspension and account deletion"}>
          <p>
            {it
              ? "Puoi richiedere la cancellazione del tuo account dalle Impostazioni, secondo le modalità disponibili nell'app. TrackDash può limitare o sospendere account in caso di abuso, rischio di sicurezza, violazioni di questi Termini o obblighi di legge."
              : "You may request deletion of your account from Settings using the options available in the app. TrackDash may restrict or suspend accounts in cases of abuse, security risk, breach of these Terms, or legal obligations."}
          </p>
        </Section>

        <Section title={it ? "10. Proprietà intellettuale" : "10. Intellectual property"}>
          <p>
            {it
              ? "Software, design, marchio TrackDash, testi originali, struttura del catalogo e componenti creati specificamente per il servizio sono protetti nei limiti consentiti dalla legge. I diritti su marchi, immagini di prodotto e contenuti di terzi restano ai rispettivi titolari."
              : "Software, design, the TrackDash brand, original text, catalog structure, and components created specifically for the service are protected to the extent permitted by law. Rights in third-party trademarks, product images, and content remain with their respective owners."}
          </p>
          <p>
            {it
              ? "Caricando contenuti tuoi concedi a TrackDash una licenza limitata, non esclusiva e necessaria esclusivamente a memorizzarli, elaborarli e mostrarli secondo le funzioni che scegli di utilizzare."
              : "By uploading your own content, you grant TrackDash a limited, non-exclusive licence only as necessary to store, process, and display it according to the features you choose to use."}
          </p>
        </Section>

        <Section title={it ? "11. Limitazione di responsabilità" : "11. Limitation of liability"}>
          <p>
            {it
              ? "Nei limiti consentiti dalla legge, TrackDash non risponde di perdite derivanti da decisioni prese facendo affidamento esclusivamente su stime di mercato, contenuti di altri utenti, indisponibilità di fonti esterne o transazioni concluse direttamente tra utenti."
              : "To the extent permitted by law, TrackDash is not liable for losses resulting from decisions based solely on market estimates, other users' content, unavailable external sources, or transactions concluded directly between users."}
          </p>
          <p>
            {it
              ? "Nulla in questi Termini limita diritti inderogabili del consumatore o responsabilità che non possono essere escluse dalla legge applicabile."
              : "Nothing in these Terms limits mandatory consumer rights or liability that cannot be excluded under applicable law."}
          </p>
        </Section>

        <Section title={it ? "12. Privacy" : "12. Privacy"}>
          <p>
            {it ? (
              <>
                Il trattamento dei dati personali è descritto nella <InlineLink href="/privacy">Privacy Policy</InlineLink>.
              </>
            ) : (
              <>
                Personal-data processing is described in the <InlineLink href="/privacy">Privacy Policy</InlineLink>.
              </>
            )}
          </p>
        </Section>

        <Section title={it ? "13. Modifiche ai Termini" : "13. Changes to these Terms"}>
          <p>
            {it
              ? "Potremo aggiornare questi Termini per riflettere modifiche al servizio o alla normativa. La versione aggiornata indicherà la nuova data e, per modifiche sostanziali, potremo mostrare un avviso aggiuntivo."
              : "We may update these Terms to reflect changes to the service or applicable law. The updated version will show a new date and, for material changes, we may display an additional notice."}
          </p>
        </Section>
      </div>
    </div>
  )
}
