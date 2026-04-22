import type { Metadata } from "next";
import "./globals.css";

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
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

/* ── Header Component ────────────────────────── */
function Header() {
  return (
    <header style={headerStyles.header}>
      <nav className="container" style={headerStyles.nav} aria-label="Main navigation">
        <a href="/" style={headerStyles.logo}>
          <span style={headerStyles.logoIcon}>🗳️</span>
          <span style={headerStyles.logoText}>
            Elect<span style={headerStyles.logoAccent}>Ed</span>
          </span>
        </a>

        <div style={headerStyles.links}>
          <a href="/timeline" style={headerStyles.navLink}>Timeline</a>
          <a href="/quiz" style={headerStyles.navLink}>Quizzes</a>
          <a href="/glossary" style={headerStyles.navLink}>Glossary</a>
          <a href="/timeline" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}>
            Start Learning
          </a>
        </div>
      </nav>
    </header>
  );
}

const headerStyles: Record<string, React.CSSProperties> = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: 'rgba(10, 14, 26, 0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '72px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    color: 'var(--text-primary)',
  },
  logoIcon: {
    fontSize: '1.75rem',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontSize: '1.5rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  logoAccent: {
    color: 'var(--color-primary-400)',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  navLink: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    fontSize: '0.9375rem',
    fontWeight: 500,
    transition: 'color 0.2s',
  },
};

/* ── Footer Component ────────────────────────── */
function Footer() {
  return (
    <footer style={footerStyles.footer}>
      <div className="container" style={footerStyles.inner}>
        <div style={footerStyles.brand}>
          <span style={{ fontSize: '1.5rem' }}>🗳️</span>
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
        </div>

        <div style={footerStyles.bottom}>
          <p style={footerStyles.copyright}>
            © {new Date().getFullYear()} ElectEd. Built for civic empowerment.
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
