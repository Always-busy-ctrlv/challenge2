"use client";

import { useState } from "react";

const STAGES = [
  {
    id: "voter-registration",
    order: 1,
    title: "Voter Registration",
    icon: "📋",
    color: "#3b82f6",
    summary: "The first step in exercising your right to vote. Learn about eligibility, deadlines, and how to register in your state.",
    details: [
      { heading: "Who Can Register?", content: "You must be a U.S. citizen, meet your state's residency requirements, and be 18 years old by Election Day. Some states allow 16- and 17-year-olds to pre-register." },
      { heading: "How to Register", content: "Register online at vote.gov, by mail using the National Voter Registration Form, or in person at your local election office, DMV, or other public agencies." },
      { heading: "Deadlines", content: "Registration deadlines vary by state, from 30 days before an election to same-day registration. Check your state's specific deadline." },
      { heading: "Checking Your Status", content: "Verify your registration status online through your state's Secretary of State website before every election." },
    ],
    facts: [
      "North Dakota is the only state that doesn't require voter registration.",
      "The Motor Voter Act (1993) requires DMVs to offer voter registration.",
      "22 states plus D.C. offer same-day voter registration.",
    ],
  },
  {
    id: "primary-elections",
    order: 2,
    title: "Primary Elections",
    icon: "🗳️",
    color: "#8b5cf6",
    summary: "Where parties choose their candidates. Understand open vs. closed primaries, caucuses, and delegate allocation.",
    details: [
      { heading: "What Are Primaries?", content: "Primary elections are intra-party contests where registered voters help select their party's candidates for the general election." },
      { heading: "Open vs. Closed", content: "Closed primaries require party membership. Open primaries allow any registered voter to participate in either party's primary." },
      { heading: "Caucuses vs. Primaries", content: "Caucuses are local gatherings with multiple rounds of voting. Most states have moved to primaries for accessibility." },
      { heading: "Delegate Allocation", content: "Democrats allocate proportionally; Republicans use a mix of winner-take-all and proportional systems." },
    ],
    facts: [
      "Florida held the first U.S. presidential primary in 1901.",
      "Wisconsin adopted the first statewide primary law in 1903.",
      "COVID-19 caused 19 states to postpone their 2020 primaries.",
    ],
  },
  {
    id: "candidate-nomination",
    order: 3,
    title: "Candidate Nomination",
    icon: "🎤",
    color: "#06b6d4",
    summary: "From conventions to debates — how candidates become official nominees and qualify for the ballot.",
    details: [
      { heading: "National Conventions", content: "Each major party holds a convention where delegates formally nominate their presidential candidate and adopt the party platform." },
      { heading: "Ballot Qualification", content: "Candidates must collect signatures, pay filing fees, or both. Requirements vary by state and office." },
      { heading: "Third Parties", content: "Third-party and independent candidates face higher barriers to ballot access and debate participation." },
      { heading: "Debates", content: "Presidential debates require meeting polling and fundraising thresholds. The first TV debate was Kennedy vs. Nixon in 1960." },
    ],
    facts: [
      "The first televised debate was Kennedy vs. Nixon in 1960.",
      "Lincoln was nominated on the third ballot in 1860.",
      "Superdelegates can play a decisive role in Democratic nominations.",
    ],
  },
  {
    id: "campaign-period",
    order: 4,
    title: "Campaign Period",
    icon: "📢",
    color: "#f59e0b",
    summary: "The intense period of rallies, ads, and debates. Learn about campaign finance, media, and voter outreach.",
    details: [
      { heading: "Campaign Finance", content: "The FEC regulates contributions. Individual limits are $3,300 per election. Super PACs can raise unlimited funds for independent expenditures." },
      { heading: "Media & Advertising", content: "Campaigns invest in TV ads, digital marketing, and social media. The equal time rule requires equal airtime opportunities." },
      { heading: "Ground Game", content: "Volunteer networks, phone banks, and door-to-door canvassing often make the difference in close races." },
      { heading: "Polls", content: "Polling data helps campaigns allocate resources. Aggregators combine polls for more accurate predictions." },
    ],
    facts: [
      "The 2020 cycle cost ~$14 billion — the most expensive ever.",
      "Eisenhower ran the first TV campaign ads in 1952.",
      "Swing states receive over 90% of campaign spending.",
    ],
  },
  {
    id: "election-day",
    order: 5,
    title: "Election Day",
    icon: "🏛️",
    color: "#10b981",
    summary: "The big day! Understand voting methods, polling locations, ID requirements, and your rights.",
    details: [
      { heading: "Voting Methods", content: "Vote in person, through early voting, or via absentee/mail-in ballots. Deadlines and requirements vary by state." },
      { heading: "Polling Locations", content: "Your polling place is determined by your registered address. Find it through your state's election website or vote.gov." },
      { heading: "Voter ID", content: "Requirements range from strict photo ID to no ID at all. Most states offer provisional ballot options." },
      { heading: "Your Rights", content: "You can vote free from intimidation, receive disability assistance, cast a provisional ballot, and report problems." },
    ],
    facts: [
      "Election Day was set in 1845 as the first Tuesday after the first Monday in November.",
      "Oregon was the first all-mail voting state (2000).",
      "159 million people voted in 2020 — highest turnout in 120 years.",
    ],
  },
  {
    id: "results-certification",
    order: 6,
    title: "Results & Certification",
    icon: "✅",
    color: "#ef4444",
    summary: "From counting to certification — how votes become official and the Electoral College decides.",
    details: [
      { heading: "Vote Counting", content: "Some states pre-canvass mail ballots, others start on Election Day. This can delay final results." },
      { heading: "Audits & Recounts", content: "Post-election audits verify accuracy. Automatic recounts trigger when margins are below 0.5%." },
      { heading: "Electoral College", content: "A candidate needs 270 of 538 electoral votes. Most states use winner-take-all; Maine and Nebraska split." },
      { heading: "Certification", content: "States certify results by their deadlines. Congress counts electoral votes on Jan. 6. Inauguration is Jan. 20." },
    ],
    facts: [
      "Five presidents won the Electoral College but lost the popular vote.",
      "Only two elections were decided by the House (1800 & 1824).",
      "The 20th Amendment moved Inauguration from March 4 to January 20.",
    ],
  },
];

export default function TimelinePage() {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<string | null>(null);

  return (
    <div className="container section">
      {/* Page Header */}
      <div style={styles.header}>
        <span className="badge badge-primary">Interactive Timeline</span>
        <h1 style={styles.pageTitle}>The Election Journey</h1>
        <p style={styles.pageSubtitle}>
          Follow the complete path from voter registration to results
          certification. Click each stage to explore in depth.
        </p>
      </div>

      {/* Timeline */}
      <div style={styles.timeline} role="list" aria-label="Election timeline stages">
        {STAGES.map((stage, index) => {
          const isExpanded = expandedStage === stage.id;
          return (
            <div
              key={stage.id}
              id={`stage-${stage.order}`}
              role="listitem"
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Timeline connector */}
              {index > 0 && (
                <div style={styles.connector} aria-hidden="true">
                  <div
                    style={{
                      ...styles.connectorLine,
                      background: `linear-gradient(to bottom, ${STAGES[index - 1].color}40, ${stage.color}40)`,
                    }}
                  />
                </div>
              )}

              {/* Stage Card */}
              <button
                onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                style={styles.stageButton}
                className="glass-card"
                aria-expanded={isExpanded}
                aria-controls={`stage-content-${stage.id}`}
              >
                <div style={styles.stageTop}>
                  <div
                    style={{
                      ...styles.stageIcon,
                      background: `linear-gradient(135deg, ${stage.color}20, ${stage.color}08)`,
                      border: `1px solid ${stage.color}40`,
                      boxShadow: `0 0 24px ${stage.color}15`,
                    }}
                  >
                    <span style={{ fontSize: "1.75rem" }}>{stage.icon}</span>
                  </div>
                  <div style={styles.stageInfo}>
                    <div style={styles.stageLabel}>Stage {stage.order} of 6</div>
                    <h2 style={styles.stageTitle}>{stage.title}</h2>
                    <p style={styles.stageSummary}>{stage.summary}</p>
                  </div>
                  <div
                    style={{
                      ...styles.chevron,
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                    aria-hidden="true"
                  >
                    ▼
                  </div>
                </div>

                {/* Did You Know chips */}
                <div style={styles.factsRow}>
                  {stage.facts.slice(0, 2).map((fact, i) => (
                    <div key={i} style={styles.factChip}>
                      💡 {fact}
                    </div>
                  ))}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div
                  id={`stage-content-${stage.id}`}
                  style={styles.expandedContent}
                  className="animate-fade-in-up"
                  role="region"
                  aria-label={`${stage.title} details`}
                >
                  {stage.details.map((detail, di) => {
                    const detailKey = `${stage.id}-${di}`;
                    const isDetailOpen = expandedDetail === detailKey;
                    return (
                      <button
                        key={di}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedDetail(isDetailOpen ? null : detailKey);
                        }}
                        style={styles.accordion}
                        aria-expanded={isDetailOpen}
                      >
                        <div style={styles.accordionHeader}>
                          <div
                            style={{
                              ...styles.accordionDot,
                              background: stage.color,
                            }}
                          />
                          <h3 style={styles.accordionTitle}>{detail.heading}</h3>
                          <span
                            style={{
                              ...styles.accordionChevron,
                              transform: isDetailOpen ? "rotate(90deg)" : "rotate(0deg)",
                            }}
                          >
                            ▶
                          </span>
                        </div>
                        {isDetailOpen && (
                          <p style={styles.accordionContent}>{detail.content}</p>
                        )}
                      </button>
                    );
                  })}

                  {/* All facts in expanded view */}
                  <div style={styles.allFacts}>
                    <h4 style={styles.factsHeading}>💡 Did You Know?</h4>
                    {stage.facts.map((fact, fi) => (
                      <div key={fi} style={styles.factItem}>
                        <span style={{ color: stage.color, fontWeight: 700 }}>•</span> {fact}
                      </div>
                    ))}
                  </div>

                  <a
                    href={`/quiz?stage=${stage.id}`}
                    className="btn btn-primary"
                    style={{ alignSelf: "flex-start", marginTop: "0.5rem" }}
                  >
                    Take the Quiz for Stage {stage.order} →
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div style={styles.bottomCta}>
        <p style={styles.bottomCtaText}>
          Completed all 6 stages? Test your knowledge!
        </p>
        <a href="/quiz" className="btn btn-accent" style={{ padding: "0.875rem 2rem" }}>
          Take the Full Quiz 🧠
        </a>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    textAlign: "center",
    marginBottom: "3rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
  },
  pageTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "clamp(2rem, 4vw, 3rem)",
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },
  pageSubtitle: {
    fontSize: "1.0625rem",
    color: "var(--text-secondary)",
    maxWidth: "560px",
    lineHeight: 1.6,
  },
  timeline: {
    maxWidth: "880px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
  },
  connector: {
    display: "flex",
    justifyContent: "center",
    padding: "0.25rem 0",
  },
  connectorLine: {
    width: "2px",
    height: "32px",
    borderRadius: "2px",
  },
  stageButton: {
    width: "100%",
    textAlign: "left",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    color: "inherit",
    fontFamily: "inherit",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  stageTop: {
    display: "flex",
    gap: "1.25rem",
    alignItems: "flex-start",
  },
  stageIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "var(--radius-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stageInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  stageLabel: {
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  stageTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "1.375rem",
    fontWeight: 700,
    color: "var(--text-primary)",
  },
  stageSummary: {
    fontSize: "0.9375rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
  chevron: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    transition: "transform 0.3s ease",
    flexShrink: 0,
    marginTop: "0.5rem",
  },
  factsRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  factChip: {
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
    padding: "0.375rem 0.75rem",
    background: "rgba(245,158,11,0.06)",
    border: "1px solid rgba(245,158,11,0.15)",
    borderRadius: "var(--radius-full)",
    lineHeight: 1.4,
  },
  expandedContent: {
    maxWidth: "880px",
    margin: "0.75rem auto 0",
    padding: "1.5rem",
    background: "rgba(255,255,255,0.015)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid rgba(255,255,255,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  accordion: {
    width: "100%",
    textAlign: "left",
    padding: "1rem",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    color: "inherit",
    fontFamily: "inherit",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    transition: "background 0.2s",
  },
  accordionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  accordionDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  accordionTitle: {
    fontFamily: "var(--font-display)",
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    flex: 1,
  },
  accordionChevron: {
    fontSize: "0.625rem",
    color: "var(--text-muted)",
    transition: "transform 0.2s ease",
  },
  accordionContent: {
    fontSize: "0.9375rem",
    color: "var(--text-secondary)",
    lineHeight: 1.7,
    paddingLeft: "1.75rem",
  },
  allFacts: {
    padding: "1rem",
    background: "rgba(245,158,11,0.04)",
    border: "1px solid rgba(245,158,11,0.1)",
    borderRadius: "var(--radius-md)",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  factsHeading: {
    fontFamily: "var(--font-display)",
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "var(--color-accent-400)",
  },
  factItem: {
    fontSize: "0.875rem",
    color: "var(--text-secondary)",
    display: "flex",
    gap: "0.5rem",
    lineHeight: 1.5,
  },
  bottomCta: {
    textAlign: "center",
    marginTop: "3rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
  },
  bottomCtaText: {
    color: "var(--text-secondary)",
    fontSize: "1.0625rem",
  },
};
