import Link from 'next/link';

const updated = 'November 8, 2026';
export default function TermsPage() {
  return <main className="app-shell min-vh-100">
    <header className="topbar"><div className="container"><Link href="/" className="text-decoration-none text-dark fw-bold">bettercamsur.ph</Link></div></header>
    <article className="container legal-page">
      <Link href="/" className="small text-success text-decoration-none">← Back to bettercamsur.ph</Link>
      <div className="eyebrow mt-4">Using the platform</div>
      <h1 className="display-6 fw-bold mt-2">Terms of Use</h1>
      <p className="muted">Last updated: {updated}</p>
      <div className="notice mb-4"><strong>Operator details to complete:</strong> These terms are a draft. Before public launch, insert the legal name and contact details of the organization responsible for operating bettercamsur.ph and obtain appropriate legal review.</div>

      <h2>1. About the service</h2>
      <p>bettercamsur.ph is a community issue-reporting and tracking platform intended to help residents submit information about local infrastructure, sanitation, public spaces, drainage, safety, and other community concerns. Reports may be displayed publicly and may be routed to an appropriate government office or department for review.</p>
      <p>Platform operator: <strong>[INSERT LEGAL NAME OF THE OPERATING ORGANIZATION]</strong><br/>Contact: <strong>[INSERT OFFICIAL CONTACT EMAIL OR ADDRESS]</strong></p>

      <h2>2. Eligibility and accounts</h2>
      <p>You may submit a report without creating an account. Residents may optionally sign in using supported Google or Facebook identity-provider services to associate reports with a resident dashboard. Government personnel accounts are created or approved through the platform's administrative process. You are responsible for maintaining the security of any account you use and for activities carried out through it.</p>

      <h2>3. Accurate and responsible reporting</h2>
      <p>You agree to provide information that is accurate to the best of your knowledge and to avoid knowingly false, misleading, abusive, duplicate, defamatory, threatening, or unlawful submissions. Do not impersonate another person or government official, submit malicious links or files, interfere with the service, or use it to harass or expose another person's private information.</p>
      <p>Choose a severity that reasonably reflects the reported impact. Severity is an initial assessment, not a guarantee of response time or a promise that an issue will be treated as an emergency. Authorized personnel may review or change the severity and may group related reports describing the same underlying issue.</p>

      <h2>4. Public content and personal information</h2>
      <p>Report titles, descriptions, categories, locations, statuses, severity levels, and uploaded evidence may be publicly accessible, depending on publication settings. Do not upload content that you do not have permission to share or that contains sensitive personal information, private correspondence, identity documents, financial records, or identifiable details of vulnerable individuals unless the responsible office has specifically requested it through an appropriate secure channel.</p>
      <p>You retain any rights you already hold in content you submit. You grant the Platform Operator a non-exclusive, limited permission to host, store, reproduce, display, and share the submitted content as reasonably necessary to operate the reporting service, publish the report where configured, and route it to the responsible office. This permission does not transfer ownership of your content.</p>

      <h2>5. Review, routing, and status updates</h2>
      <p>Submitting a report does not mean that a government office has verified, accepted, funded, or committed to resolve the issue. Reports may be reviewed, categorized, assigned, grouped with related reports, updated, marked resolved, or rejected by authorized personnel. The platform may display status updates supplied by the responsible office.</p>

      <h2>6. No emergency or guaranteed-response service</h2>
      <p>bettercamsur.ph is not an emergency dispatch service and is not monitored as a substitute for emergency hotlines. For an immediate threat to life, health, or safety, contact the appropriate emergency service or local authority directly. The platform does not guarantee that a report will be reviewed or resolved within a particular period.</p>

      <h2>7. Acceptable uploads</h2>
      <p>Uploaded photographs must be lawful, relevant to the reported issue, and free of malware or harmful code. The Platform Operator may remove or restrict access to content that is unlawful, abusive, irrelevant, unsafe, or inconsistent with these terms. Do not attempt to upload executable files or circumvent file-size or file-type restrictions.</p>

      <h2>8. Availability and changes</h2>
      <p>The service may be changed, maintained, suspended, or discontinued to protect the platform, comply with law, or improve its operation. We may correct technical errors or remove content that threatens service integrity. We will take reasonable steps to preserve report records, but uninterrupted availability is not guaranteed.</p>

      <h2>9. Third-party services</h2>
      <p>The platform may depend on mapping, identity, email, hosting, storage, and network providers. Those services are subject to their own terms and privacy notices. The Platform Operator does not control independent third-party services.</p>

      <h2>10. Limitation and responsibility</h2>
      <p>To the extent permitted by applicable law, the platform is provided as an informational reporting tool. The Platform Operator is not responsible for government decisions, field operations, repair schedules, or actions taken by third parties based solely on a user submission. Nothing in these terms excludes liability that cannot lawfully be excluded or limits rights that applicable law grants to users.</p>

      <h2>11. Privacy</h2>
      <p>Use of personal information is described in our <Link href="/privacy">Privacy Notice</Link>. By submitting a report, you acknowledge that you have been given access to that notice. Any consent required for a particular processing activity will be requested separately where appropriate.</p>

      <h2>12. Changes to these terms</h2>
      <p>We may revise these terms as the service changes. The current version and revision date will be posted on this page. Continued use after an updated version takes effect is subject to the revised terms, to the extent permitted by law.</p>

      <div className="legal-nav"><Link href="/privacy">Privacy Notice</Link><Link href="/">Home</Link></div>
      <p className="small muted mt-4">This is an operational draft for the application and is not legal advice. Have the responsible organization review it before public launch.</p>
    </article>
  </main>;
}
