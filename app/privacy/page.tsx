import Link from 'next/link';

const updated = 'November 8, 2026';
export default function PrivacyPage() {
  return <main className="app-shell min-vh-100">
    <header className="topbar"><div className="container"><Link href="/" className="text-decoration-none text-dark fw-bold">bettercamsur.ph</Link></div></header>
    <article className="container legal-page">
      <Link href="/" className="small text-success text-decoration-none">← Back to bettercamsur.ph</Link>
      <div className="eyebrow mt-4">Legal and transparency</div>
      <h1 className="display-6 fw-bold mt-2">Privacy Notice</h1>
      <p className="muted">Last updated: {updated}</p>
      <div className="notice mb-4"><strong>Publication checklist:</strong> Before public launch, the platform operator must replace the bracketed controller and privacy-contact details below, confirm the government offices that will receive reports, and have this notice reviewed by its Data Protection Officer or Philippine privacy counsel.</div>

      <h2>1. Who is responsible for your information?</h2>
      <p>Personal information collected through bettercamsur.ph is controlled by <strong>[INSERT THE LEGAL NAME OF THE PLATFORM OPERATOR OR PERSONAL INFORMATION CONTROLLER]</strong> (the “Platform Operator”). The Platform Operator is responsible for deciding why and how personal information is processed, subject to applicable law and any separate responsibilities of government offices that receive reports.</p>
      <p>Privacy contact / Data Protection Officer: <strong>[INSERT OFFICIAL PRIVACY CONTACT EMAIL]</strong><br/>Office address: <strong>[INSERT OFFICIAL POSTAL OR OFFICE ADDRESS]</strong></p>

      <h2>2. Information we may collect</h2>
      <ul>
        <li><strong>Report details:</strong> title, description, issue category, selected severity, report reference, status, and messages or updates associated with the report.</li>
        <li><strong>Location:</strong> map coordinates, address, barangay, municipality or city, province, and nearby landmarks supplied with a report.</li>
        <li><strong>Evidence:</strong> photographs and their file names or technical metadata when uploaded.</li>
        <li><strong>Contact details:</strong> name, email address, or other contact details you choose to provide. These fields may be optional for public reports.</li>
        <li><strong>Account information:</strong> when you sign in using Google or Facebook, the platform receives identity information made available by the identity provider, such as your provider account identifier, name, and email address. Authentication is handled through Keycloak.</li>
        <li><strong>Technical and security information:</strong> timestamps, request information, audit and security events, and diagnostic data needed to operate and protect the service.</li>
      </ul>

      <h2>3. Why we use this information</h2>
      <p>We use report information to receive, classify, map, route, review, assign, investigate, and track community issues; communicate report references and updates; associate reports with a resident account when the resident chooses to sign in; identify duplicate or related reports; protect the platform from spam, fraud, and abuse; maintain security and auditability; and produce aggregated service statistics.</p>

      <h2>4. Public visibility and sharing</h2>
      <p>Reports are designed to support public accountability. Depending on the information submitted and the platform's publication settings, report titles, descriptions, categories, approximate or precise locations, status, severity, report references, and uploaded evidence may be shown on public pages or maps. Do not include passwords, government identification numbers, financial information, private medical details, or another person's private information in a report or photograph.</p>
      <p>Report information may be made available to the relevant provincial, city, municipal, barangay, or departmental office so that it can review and act on the reported issue. The Platform Operator may use hosting, database, identity, email, object-storage, security, and infrastructure providers to operate the service. Those providers should only process information for authorized service purposes and under appropriate safeguards.</p>
      <p>We do not describe this platform as an emergency service. Do not rely on a report submission to request urgent police, fire, ambulance, disaster-response, or other emergency assistance.</p>

      <h2>5. Legal basis and privacy principles</h2>
      <p>Personal information will be processed only for declared and legitimate purposes and on an applicable lawful basis, which may include your consent, steps you request, a legal obligation, a public-authority mandate, protection of vital interests, or another basis permitted by law. The Platform Operator should document the applicable basis for each processing activity and should collect only information that is relevant and proportionate to that purpose.</p>

      <h2>6. Retention and security</h2>
      <p>Information is retained only for as long as reasonably necessary for report handling, public accountability, audit, security, legal claims, or applicable records-retention requirements. The Platform Operator should adopt and publish a retention schedule covering reports, attachments, account information, and security logs. Reasonable technical and organizational safeguards are used, but no internet service can guarantee absolute security.</p>

      <h2>7. Your rights and how to contact us</h2>
      <p>Subject to applicable law and its conditions, you may ask to be informed about processing, request access to or correction of your personal information, object to certain processing, request erasure or blocking where appropriate, seek data portability where applicable, and lodge a complaint with the National Privacy Commission.</p>
      <p>To exercise a privacy right, contact <strong>[INSERT OFFICIAL PRIVACY CONTACT EMAIL]</strong> and include enough information for the Platform Operator to verify and respond to your request. Do not send passwords or sensitive identity documents through an ordinary email unless a secure verification process is provided.</p>

      <h2>8. Cookies and external identity providers</h2>
      <p>The service may use strictly necessary session, security, or preference technologies. If optional analytics or tracking technologies are introduced, this notice should be updated before they are enabled. Google and Facebook process information under their own policies when you choose to use their sign-in services.</p>

      <h2>9. Changes to this notice</h2>
      <p>We may update this notice when platform functionality, data flows, providers, or legal requirements change. The latest version and its revision date will be posted on this page.</p>

      <h2>10. Official information</h2>
      <p>For information about Philippine data-protection rights and the Data Privacy Act of 2012, see the <a href="https://privacy.gov.ph/data-privacy-act/" target="_blank" rel="noreferrer">National Privacy Commission's Data Privacy Act resource</a> and its <a href="https://privacy.gov.ph/data-subject-rights/" target="_blank" rel="noreferrer">data subject rights guide</a>.</p>
      <div className="legal-nav"><Link href="/terms">Terms of Use</Link><Link href="/">Home</Link></div>
      <p className="small muted mt-4">This is a product-specific draft notice, not a legal certification or a substitute for review by the responsible Personal Information Controller and its Data Protection Officer.</p>
    </article>
  </main>;
}
