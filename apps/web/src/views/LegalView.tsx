interface Props {
  page: "privacy" | "terms" | "impressum";
  onBack: () => void;
}

export default function LegalView({ page, onBack }: Props) {
  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <button className="btn-ghost" onClick={onBack} type="button">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="app-title">
            {page === "privacy" ? "Privacy Policy" : page === "terms" ? "Terms of Service" : "Impressum"}
          </span>
          <div style={{ width: 40 }} />
        </div>
      </header>
      <main className="legal-shell">
        {page === "privacy" && <PrivacyPolicy />}
        {page === "terms" && <TermsOfService />}
        {page === "impressum" && <Impressum />}
      </main>
    </>
  );
}

function PrivacyPolicy() {
  return (
    <div className="legal-content">
      <p className="legal-date">Last updated: April 25, 2026</p>

      <h2>1. Controller</h2>
      <p>
        SEOOES Tech<br />
        Email: info@seooes.tech
      </p>
      <p>
        This privacy policy explains how we collect, use, and protect your personal data
        when you use Sudoku Lithograph (&quot;the Service&quot;).
      </p>

      <h2>2. Data We Collect</h2>
      <h3>2.1 Account Data (optional)</h3>
      <p>
        If you create an account, we collect your email address and a display name (optional).
        Your password is hashed using Argon2 and is never stored in plain text.
      </p>
      <h3>2.2 Game Data</h3>
      <p>
        We store game sessions, scores, tournament entries, and statistics.
        Game data is linked to a randomly generated guest identifier or your account.
      </p>
      <h3>2.3 Technical Data</h3>
      <p>
        Our server logs may record IP addresses, request timestamps, and user agent strings
        for security and abuse prevention purposes. These logs are retained for a limited period.
      </p>

      <h2>3. Cookies &amp; Local Storage</h2>
      <p>We use the following:</p>
      <ul>
        <li><strong>gid</strong> (cookie) &mdash; A randomly generated guest identifier. Functional, no tracking. HttpOnly, SameSite=Strict.</li>
        <li><strong>sid</strong> (cookie) &mdash; Authentication session token, set only when you log in. HttpOnly, SameSite=Strict.</li>
        <li><strong>localStorage</strong> &mdash; Theme preference (no personal data).</li>
        <li><strong>IndexedDB</strong> &mdash; Local game state, settings, and completed game history for offline play.</li>
      </ul>
      <p>
        We do not use third-party cookies, analytics cookies, or tracking technologies.
      </p>

      <h2>4. How We Use Your Data</h2>
      <ul>
        <li>To provide and operate the game</li>
        <li>To save and sync your game progress</li>
        <li>To display leaderboards and tournament rankings</li>
        <li>To prevent abuse and ensure fair play</li>
        <li>To authenticate your account</li>
      </ul>

      <h2>5. Data Sharing</h2>
      <p>
        We do not sell, rent, or share your personal data with third parties.
        Display names are shown publicly on leaderboards. If you do not set a display name,
        a randomly generated guest label is used.
      </p>

      <h2>6. Data Retention</h2>
      <p>
        Account data is retained until you request deletion. Game session data is retained
        indefinitely for statistics and leaderboard purposes. You may request deletion of
        your account and associated data by contacting us at info@seooes.tech.
      </p>

      <h2>7. Your Rights (EU/EEA Users)</h2>
      <p>Under the GDPR, you have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Rectify inaccurate data</li>
        <li>Request erasure of your data</li>
        <li>Restrict or object to processing</li>
        <li>Data portability</li>
        <li>Lodge a complaint with a supervisory authority</li>
      </ul>
      <p>To exercise these rights, contact us at info@seooes.tech.</p>

      <h2>8. Your Rights (California Users)</h2>
      <p>
        Under the CCPA, California residents have the right to know what personal information
        is collected, request its deletion, and opt out of its sale. We do not sell personal
        information. To exercise your rights, contact us at info@seooes.tech.
      </p>

      <h2>9. Data Security</h2>
      <p>
        We use industry-standard security measures including encrypted passwords (Argon2),
        HttpOnly cookies, CSRF protection, and rate limiting. However, no method of
        transmission over the Internet is 100% secure.
      </p>

      <h2>10. Children</h2>
      <p>
        The Service is not directed at children under 13. We do not knowingly collect
        personal data from children under 13. If you believe a child has provided us
        with personal data, please contact us at info@seooes.tech.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update this privacy policy from time to time. Changes will be posted on this page
        with an updated date. Continued use of the Service constitutes acceptance of the updated policy.
      </p>

      <h2>12. Contact</h2>
      <p>
        For any privacy-related questions or requests:<br />
        SEOOES Tech<br />
        Email: info@seooes.tech
      </p>
    </div>
  );
}

function TermsOfService() {
  return (
    <div className="legal-content">
      <p className="legal-date">Last updated: April 25, 2026</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Sudoku Lithograph (&quot;the Service&quot;), operated by
        SEOOES Tech, you agree to be bound by these Terms of Service. If you do not
        agree, do not use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Sudoku Lithograph is a free online Sudoku game that offers daily challenges,
        tournaments, and statistics tracking. The Service may be modified or discontinued
        at any time without notice.
      </p>

      <h2>3. Accounts</h2>
      <p>
        You may use the Service as a guest without creating an account. If you create an account,
        you are responsible for maintaining the confidentiality of your credentials. You must
        provide accurate information and must not impersonate others.
      </p>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use automated tools, bots, or scripts to interact with the Service</li>
        <li>Attempt to manipulate leaderboards, scores, or tournament results</li>
        <li>Interfere with the operation of the Service or other users&apos; enjoyment</li>
        <li>Attempt to gain unauthorized access to the Service or its systems</li>
        <li>Use the Service for any unlawful purpose</li>
      </ul>

      <h2>5. Tournaments</h2>
      <p>
        Tournament participation is subject to anti-abuse detection. Entries that are
        flagged as suspicious (e.g., impossibly fast solve times) may be invalidated.
        SEOOES Tech reserves the right to disqualify entries or ban users who violate fair play rules.
      </p>

      <h2>6. Intellectual Property</h2>
      <p>
        The Service, its design, code, and content are the property of SEOOES Tech.
        Sudoku puzzles are mathematical constructs and are not subject to copyright.
        You may not reproduce, distribute, or create derivative works from the Service
        without permission.
      </p>

      <h2>7. Disclaimer of Warranties</h2>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties
        of any kind, express or implied. SEOOES Tech does not warrant that the Service
        will be uninterrupted, error-free, or free of harmful components.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, SEOOES Tech shall not be liable for any
        indirect, incidental, special, consequential, or punitive damages arising from
        your use of the Service, including loss of data or game progress.
      </p>

      <h2>9. Termination</h2>
      <p>
        We may suspend or terminate your access to the Service at any time for violation
        of these terms or for any other reason at our discretion.
      </p>

      <h2>10. Governing Law</h2>
      <p>
        These terms are governed by the laws of the Federal Republic of Germany.
        For EU consumers, mandatory consumer protection laws of your country of residence apply.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these terms from time to time. Changes will be posted on this page.
        Continued use of the Service constitutes acceptance of the updated terms.
      </p>

      <h2>12. Contact</h2>
      <p>
        SEOOES Tech<br />
        Email: info@seooes.tech
      </p>
    </div>
  );
}

function Impressum() {
  return (
    <div className="legal-content">
      <h2>Angaben gem. &sect; 5 DDG</h2>
      <p>
        SEOOES Tech<br />
        Email: info@seooes.tech
      </p>

      <h2>Kontakt</h2>
      <p>
        E-Mail: info@seooes.tech
      </p>

      <h2>Verantwortlich f&uuml;r den Inhalt gem. &sect; 18 Abs. 2 MStV</h2>
      <p>
        SEOOES Tech<br />
        Email: info@seooes.tech
      </p>

      <h2>Haftungsausschluss</h2>
      <h3>Haftung f&uuml;r Inhalte</h3>
      <p>
        Die Inhalte unserer Seiten wurden mit gr&ouml;&szlig;ter Sorgfalt erstellt.
        F&uuml;r die Richtigkeit, Vollst&auml;ndigkeit und Aktualit&auml;t der Inhalte
        k&ouml;nnen wir jedoch keine Gew&auml;hr &uuml;bernehmen.
      </p>
      <h3>Haftung f&uuml;r Links</h3>
      <p>
        Unser Angebot enth&auml;lt Links zu externen Webseiten Dritter, auf deren Inhalte
        wir keinen Einfluss haben. F&uuml;r die Inhalte der verlinkten Seiten ist stets
        der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
      </p>

      <h2>Datenschutz</h2>
      <p>
        Informationen zum Umgang mit Ihren personenbezogenen Daten finden Sie in
        unserer Datenschutzerkl&auml;rung.
      </p>
    </div>
  );
}
