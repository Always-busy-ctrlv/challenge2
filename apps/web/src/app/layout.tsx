import type { Metadata } from "next";
import "./globals.css";
import { FirebaseProvider } from "../lib/firebase-context";
import { Header } from "../components/Header";

export const metadata: Metadata = {
  title: "ElectEd — Your Election Education Assistant",
  description:
    "An interactive, AI-powered web assistant that makes understanding the election process engaging and accessible for every citizen.",
  keywords: ["election", "voting", "education", "civic", "democracy", "registration"],
  openGraph: {
    title: "ElectEd — Election Process Education",
    description: "Learn how elections work — from registration to results.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <FirebaseProvider>
          <Header />
          <main id="main-content" role="main">{children}</main>
          <Footer />
        </FirebaseProvider>
      </body>
    </html>
  );
}



/* ── Footer Component ────────────────────────────────────── */
function Footer() {
  return (
    <footer style={footerStyles.footer} role="contentinfo">
      <div className="container" style={footerStyles.inner}>
        <div style={footerStyles.brand}>
          <span style={{ fontSize: '1.5rem' }} aria-hidden="true">🗳️</span>
          <span style={footerStyles.brandText}>
            Elect<span style={{ color: 'var(--color-primary-400)' }}>Ed</span>
          </span>
          <p style={footerStyles.tagline}>
            Making civic education accessible for everyone.
          </p>
        </div>

        <div style={footerStyles.linksGroup}>
          <div>
            <h4 style={footerStyles.linksHeading}>Learn</h4>
            <a href="/timeline" style={footerStyles.footerLink}>Election Timeline</a>
            <a href="/quiz" style={footerStyles.footerLink}>Knowledge Quizzes</a>
            <a href="/glossary" style={footerStyles.footerLink}>Glossary</a>
          </div>
          <div>
            <h4 style={footerStyles.linksHeading}>Resources</h4>
            <a href="https://vote.gov" target="_blank" rel="noopener noreferrer" style={footerStyles.footerLink}>
              Vote.gov ↗
            </a>
            <a href="https://www.usa.gov/voter-registration" target="_blank" rel="noopener noreferrer" style={footerStyles.footerLink}>
              USA.gov ↗
            </a>
          </div>
          <div>
            <h4 style={footerStyles.linksHeading}>Platform</h4>
            <span style={{ ...footerStyles.footerLink, display: 'block' }}>
              Powered by Google Cloud
            </span>
            <span style={{ ...footerStyles.footerLink, display: 'block' }}>
              Firebase • Vertex AI • Cloud Run
            </span>
          </div>
        </div>

        <div style={footerStyles.bottom}>
          <p style={footerStyles.copyright}>
            © {new Date().getFullYear()} ElectEd. Built for civic empowerment. Hosted on Google Cloud Platform.
          </p>
          <p style={footerStyles.disclaimer}>
            ElectEd is an educational tool. Always verify information with official government sources.
          </p>
        </div>
      </div>
    </footer>
  );
}

const footerStyles: Record<string, React.CSSProperties> = {
  footer: {
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    background: 'rgba(10, 14, 26, 0.9)',
    paddingTop: '3rem',
    paddingBottom: '2rem',
    marginTop: '4rem',
  },
  inner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  brand: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  brandText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.25rem',
    fontWeight: 800,
  },
  tagline: {
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
    maxWidth: '300px',
  },
  linksGroup: {
    display: 'flex',
    gap: '4rem',
    flexWrap: 'wrap',
  },
  linksHeading: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
    marginBottom: '0.75rem',
  },
  footerLink: {
    display: 'block',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '0.875rem',
    padding: '0.25rem 0',
    transition: 'color 0.2s',
  },
  bottom: {
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  copyright: {
    color: 'var(--text-muted)',
    fontSize: '0.8125rem',
  },
  disclaimer: {
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    fontStyle: 'italic',
  },
};
