"use client";

import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header style={headerStyles.header} role="banner">
      <nav className="container" style={headerStyles.nav} aria-label="Main navigation">
        <a href="/" style={headerStyles.logo} aria-label="ElectEd home">
          <span style={headerStyles.logoIcon} aria-hidden="true">🗳️</span>
          <span style={headerStyles.logoText}>
            Elect<span style={headerStyles.logoAccent}>Ed</span>
          </span>
        </a>

        <div style={headerStyles.links} role="menubar">
          <a href="/timeline" style={{ ...headerStyles.navLink, color: pathname === "/timeline" ? "var(--color-primary-400)" : "var(--text-secondary)" }} aria-current={pathname === "/timeline" ? "page" : undefined} role="menuitem">Timeline</a>
          <a href="/quiz" style={{ ...headerStyles.navLink, color: pathname === "/quiz" ? "var(--color-primary-400)" : "var(--text-secondary)" }} aria-current={pathname === "/quiz" ? "page" : undefined} role="menuitem">Quizzes</a>
          <a href="/glossary" style={{ ...headerStyles.navLink, color: pathname === "/glossary" ? "var(--color-primary-400)" : "var(--text-secondary)" }} aria-current={pathname === "/glossary" ? "page" : undefined} role="menuitem">Glossary</a>
          <a href="/timeline" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }} role="menuitem">
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
    textDecoration: 'none',
    fontSize: '0.9375rem',
    fontWeight: 500,
    transition: 'color 0.2s',
  },
};
