"use client";

import { useState, useEffect } from "react";

const STAGES = [
  { icon: "📋", title: "Voter Registration", desc: "Eligibility, deadlines, how to register", color: "#3b82f6" },
  { icon: "🗳️", title: "Primary Elections", desc: "Open vs. closed, caucuses, delegates", color: "#8b5cf6" },
  { icon: "🎤", title: "Candidate Nomination", desc: "Conventions, debates, ballot access", color: "#06b6d4" },
  { icon: "📢", title: "Campaign Period", desc: "Finance, media, rallies, polls", color: "#f59e0b" },
  { icon: "🏛️", title: "Election Day", desc: "Voting methods, ID, your rights", color: "#10b981" },
  { icon: "✅", title: "Results & Certification", desc: "Counting, audits, Electoral College", color: "#ef4444" },
];

const STATS = [
  { value: "6", label: "Election Stages" },
  { value: "30+", label: "Quiz Questions" },
  { value: "24", label: "Glossary Terms" },
  { value: "100%", label: "Free & Open" },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}>
      {/* ── Hero Section ──────────────────── */}
      <section style={styles.hero} aria-labelledby="hero-heading">
        <div className="container" style={styles.heroInner}>
          {/* Floating decorative orbs */}
          <div style={styles.orbBlue} className="animate-float" aria-hidden="true" />
          <div style={styles.orbPurple} className="animate-float" aria-hidden="true" />

          <div style={styles.heroBadge}>
            <span className="badge badge-primary">🇺🇸 Election Education Made Simple</span>
          </div>

          <h1 id="hero-heading" style={styles.heroTitle}>
            Understand the{" "}
            <span style={styles.heroGradient}>Election Process</span>
            <br />
            Like Never Before
          </h1>

          <p style={styles.heroSubtitle}>
            An interactive, step-by-step journey through the entire U.S. election
            lifecycle — from voter registration to results certification. Powered
            by AI, built for every citizen.
          </p>

          <div style={styles.heroCTA}>
            <a href="/timeline" className="btn btn-primary" style={{ padding: "0.875rem 2rem", fontSize: "1rem" }}>
              Start the Journey →
            </a>
            <a href="/quiz" className="btn btn-secondary" style={{ padding: "0.875rem 2rem", fontSize: "1rem" }}>
              Test Your Knowledge
            </a>
          </div>

          {/* Stats bar */}
          <div style={styles.statsBar}>
            {STATS.map((stat) => (
              <div key={stat.label} style={styles.statItem}>
                <span style={styles.statValue}>{stat.value}</span>
                <span style={styles.statLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline Preview ─────────────── */}
      <section className="section" aria-labelledby="timeline-heading">
        <div className="container">
          <div style={styles.sectionHeader}>
            <span className="badge badge-primary" style={{ marginBottom: "0.75rem" }}>
              Interactive Timeline
            </span>
            <h2 id="timeline-heading" style={styles.sectionTitle}>
              The Complete Election Journey
            </h2>
            <p style={styles.sectionSubtitle}>
              Navigate through all six stages of the election process. Each stage
              includes detailed explanations, FAQs, and fun facts.
            </p>
          </div>

          <div className="stagger-children" style={styles.stagesGrid}>
            {STAGES.map((stage, i) => (
              <a
                key={stage.title}
                href={`/timeline#stage-${i + 1}`}
                style={styles.stageCard}
                className="glass-card"
              >
                <div
                  style={{
                    ...styles.stageIcon,
                    background: `linear-gradient(135deg, ${stage.color}22, ${stage.color}08)`,
                    border: `1px solid ${stage.color}33`,
                  }}
                >
                  <span style={{ fontSize: "2rem" }}>{stage.icon}</span>
                </div>
                <div style={styles.stageNumber}>Stage {i + 1}</div>
                <h3 style={styles.stageTitle}>{stage.title}</h3>
                <p style={styles.stageDesc}>{stage.desc}</p>
                <span style={{ ...styles.stageArrow, color: stage.color }}>
                  Explore →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ─────────────── */}
      <section className="section" style={{ background: "rgba(255,255,255,0.01)" }} aria-labelledby="features-heading">
        <div className="container">
          <div style={styles.sectionHeader}>
            <span className="badge badge-warning" style={{ marginBottom: "0.75rem" }}>
              ✨ Features
            </span>
            <h2 id="features-heading" style={styles.sectionTitle}>
              Everything You Need to Be an Informed Voter
            </h2>
          </div>

          <div style={styles.featuresGrid}>
            <FeatureCard
              icon="🧠"
              title="Knowledge Quizzes"
              description="Test your understanding with per-stage quizzes. Get instant feedback, explanations, and track your progress."
            />
            <FeatureCard
              icon="📖"
              title="A-Z Glossary"
              description="24+ election terms defined in plain language with fuzzy search, related terms, and category filtering."
            />
            <FeatureCard
              icon="🤖"
              title="AI Assistant"
              description="Ask anything about elections in plain English. Powered by Vertex AI Gemini with source citations."
              badge="Coming Soon"
            />
            <FeatureCard
              icon="📅"
              title="Election Calendar"
              description="Never miss a deadline. Personalized reminders, countdown widgets, and iCal export."
              badge="Coming Soon"
            />
            <FeatureCard
              icon="🌐"
              title="Accessible by Design"
              description="WCAG 2.1 AA compliant. Keyboard navigable, screen-reader friendly, and motion-sensitive."
            />
            <FeatureCard
              icon="🔐"
              title="Secure & Private"
              description="No login required. OWASP security standards. Minimal data collection with full transparency."
            />
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────── */}
      <section className="section" aria-labelledby="cta-heading">
        <div className="container">
          <div className="glass-card animate-pulse-glow" style={styles.ctaCard}>
            <h2 id="cta-heading" style={{ ...styles.sectionTitle, marginBottom: "1rem" }}>
              Ready to Become an Informed Voter?
            </h2>
            <p style={{ ...styles.sectionSubtitle, maxWidth: "500px", margin: "0 auto 2rem" }}>
              Start with Stage 1 and work your way through the entire election
              process. It takes less than 30 minutes.
            </p>
            <a href="/timeline" className="btn btn-accent" style={{ padding: "1rem 2.5rem", fontSize: "1.0625rem" }}>
              Begin Your Journey 🚀
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  badge,
}: {
  icon: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="glass-card" style={styles.featureCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: "2rem" }}>{icon}</span>
        {badge && <span className="badge badge-warning">{badge}</span>}
      </div>
      <h3 style={{ ...styles.stageTitle, marginTop: "1rem" }}>{title}</h3>
      <p style={styles.stageDesc}>{description}</p>
    </div>
  );
}

/* ── Inline styles ───────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  hero: {
    position: "relative",
    paddingTop: "6rem",
    paddingBottom: "4rem",
    overflow: "hidden",
    minHeight: "85vh",
    display: "flex",
    alignItems: "center",
  },
  heroInner: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  orbBlue: {
    position: "absolute",
    top: "-100px",
    right: "-50px",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)",
    filter: "blur(40px)",
    pointerEvents: "none",
    animationDelay: "0s",
  },
  orbPurple: {
    position: "absolute",
    bottom: "-80px",
    left: "-60px",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)",
    filter: "blur(40px)",
    pointerEvents: "none",
    animationDelay: "3s",
  },
  heroBadge: {
    marginBottom: "1.5rem",
  },
  heroTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
    fontWeight: 900,
    lineHeight: 1.1,
    letterSpacing: "-0.03em",
    maxWidth: "800px",
    marginBottom: "1.5rem",
  },
  heroGradient: {
    background: "linear-gradient(135deg, #60a5fa, #a78bfa, #f59e0b)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSubtitle: {
    fontSize: "1.1875rem",
    color: "var(--text-secondary)",
    maxWidth: "640px",
    lineHeight: 1.7,
    marginBottom: "2rem",
  },
  heroCTA: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: "3rem",
  },
  statsBar: {
    display: "flex",
    gap: "3rem",
    padding: "1.5rem 2.5rem",
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "var(--radius-xl)",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.25rem",
  },
  statValue: {
    fontFamily: "var(--font-display)",
    fontSize: "1.5rem",
    fontWeight: 800,
    color: "var(--color-primary-400)",
  },
  statLabel: {
    fontSize: "0.8125rem",
    color: "var(--text-muted)",
    fontWeight: 500,
  },
  sectionHeader: {
    textAlign: "center",
    marginBottom: "3rem",
  },
  sectionTitle: {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    letterSpacing: "-0.02em",
  },
  sectionSubtitle: {
    fontSize: "1.0625rem",
    color: "var(--text-secondary)",
    maxWidth: "600px",
    margin: "0.75rem auto 0",
    lineHeight: 1.6,
  },
  stagesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.25rem",
  },
  stageCard: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    textDecoration: "none",
    color: "inherit",
    cursor: "pointer",
  },
  stageIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "var(--radius-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  stageNumber: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  stageTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "1.125rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  stageDesc: {
    fontSize: "0.9375rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  stageArrow: {
    fontSize: "0.875rem",
    fontWeight: 600,
    marginTop: "auto",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "1.25rem",
  },
  featureCard: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  ctaCard: {
    textAlign: "center",
    padding: "4rem 2rem",
    background: "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04))",
    border: "1px solid rgba(59,130,246,0.15)",
  },
};
