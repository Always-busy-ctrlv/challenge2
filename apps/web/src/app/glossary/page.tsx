"use client";

import { useState, useMemo } from "react";

const TERMS = [
  { term:"Absentee Ballot", slug:"absentee-ballot", definition:"A ballot cast by mail or in person before Election Day for voters who cannot visit their polling place.", category:"Voting Methods", related:["Mail-in Ballot","Early Voting","Provisional Ballot"] },
  { term:"Ballot Initiative", slug:"ballot-initiative", definition:"Citizens propose new laws or amendments by collecting petition signatures to place measures on the ballot.", category:"Direct Democracy", related:["Referendum"] },
  { term:"Caucus", slug:"caucus", definition:"A local gathering where party members discuss and vote on candidates through multiple rounds.", category:"Primaries", related:["Primary Election","Delegate"] },
  { term:"Delegate", slug:"delegate", definition:"A person chosen to represent their state at a party's national convention to nominate presidential candidates.", category:"Primaries", related:["Superdelegate","Convention"] },
  { term:"Electoral College", slug:"electoral-college", definition:"The body of 538 electors who formally elect the President. A candidate needs 270 electoral votes to win.", category:"Presidential Elections", related:["Elector","Swing State","Popular Vote"] },
  { term:"Elector", slug:"elector", definition:"A member of the Electoral College who casts electoral votes based on the state's popular vote results.", category:"Presidential Elections", related:["Electoral College","Faithless Elector"] },
  { term:"Early Voting", slug:"early-voting", definition:"A process allowing voters to cast ballots in person during a designated period before Election Day.", category:"Voting Methods", related:["Absentee Ballot","Mail-in Ballot"] },
  { term:"Faithless Elector", slug:"faithless-elector", definition:"An elector who votes differently than pledged. The Supreme Court ruled states can penalize this (2020).", category:"Presidential Elections", related:["Elector","Electoral College"] },
  { term:"FEC", slug:"fec", definition:"The Federal Election Commission — an independent agency enforcing campaign finance laws.", category:"Campaign Finance", related:["Super PAC","PAC"] },
  { term:"Gerrymandering", slug:"gerrymandering", definition:"Manipulating electoral district boundaries to favor a party. Named after Governor Elbridge Gerry (1812).", category:"Electoral Systems", related:["Redistricting"] },
  { term:"Mail-in Ballot", slug:"mail-in-ballot", definition:"A ballot sent to voters by mail, completed at home, and returned by mail or drop-off. Some states are all-mail.", category:"Voting Methods", related:["Absentee Ballot","Early Voting"] },
  { term:"Midterm Elections", slug:"midterm-elections", definition:"Federal elections held mid-presidential term. All House seats and one-third of Senate seats are contested.", category:"Election Types", related:["General Election"] },
  { term:"PAC", slug:"pac", definition:"Political Action Committee — pools contributions from members and donates to campaigns or ballot measures.", category:"Campaign Finance", related:["Super PAC","FEC"] },
  { term:"Popular Vote", slug:"popular-vote", definition:"The total individual votes cast for a candidate. The popular vote winner may differ from the EC winner.", category:"Presidential Elections", related:["Electoral College"] },
  { term:"Primary Election", slug:"primary-election", definition:"An election to determine which candidates represent each party. Can be open, closed, or semi-open.", category:"Primaries", related:["Caucus","Delegate"] },
  { term:"Provisional Ballot", slug:"provisional-ballot", definition:"A ballot for voters whose eligibility is questioned. Counted only after officials verify eligibility.", category:"Voting Methods", related:["Absentee Ballot","Voter ID"] },
  { term:"Redistricting", slug:"redistricting", definition:"Redrawing electoral district boundaries after each census (every 10 years) to reflect population changes.", category:"Electoral Systems", related:["Gerrymandering"] },
  { term:"Referendum", slug:"referendum", definition:"A direct vote where the electorate accepts or rejects a proposal, often legislation already passed.", category:"Direct Democracy", related:["Ballot Initiative"] },
  { term:"Super PAC", slug:"super-pac", definition:"Can raise/spend unlimited funds for independent expenditures but cannot donate to or coordinate with candidates.", category:"Campaign Finance", related:["PAC","FEC"] },
  { term:"Superdelegate", slug:"superdelegate", definition:"An unpledged Democratic Party delegate (party leaders/officials) who can support any convention candidate.", category:"Primaries", related:["Delegate","Convention"] },
  { term:"Swing State", slug:"swing-state", definition:"A competitive state where either major candidate could win. Also called battleground states.", category:"Presidential Elections", related:["Electoral College","Popular Vote"] },
  { term:"Voter ID Laws", slug:"voter-id", definition:"State laws requiring identification to vote. Requirements range from strict photo ID to no ID at all.", category:"Voting Rights", related:["Provisional Ballot"] },
  { term:"Voter Registration", slug:"voter-registration", definition:"The process of signing up to vote. Required in all states except North Dakota.", category:"Voting Rights", related:["Voter ID Laws"] },
  { term:"Voter Turnout", slug:"voter-turnout", definition:"Percentage of eligible voters who cast a ballot. U.S. presidential turnout ranges from 50-66%.", category:"Voting Rights", related:["Voter Registration"] },
];

const CATEGORIES = [...new Set(TERMS.map(t => t.category))].sort();

export default function GlossaryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let results = [...TERMS];
    if (activeCategory) results = results.filter(t => t.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(t => t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q));
    }
    return results.sort((a, b) => a.term.localeCompare(b.term));
  }, [search, activeCategory]);

  // Group by first letter
  const grouped = useMemo(() => {
    const map = new Map<string, typeof TERMS>();
    for (const t of filtered) {
      const letter = t.term[0].toUpperCase();
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(t);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="container section">
      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:"2.5rem", display:"flex", flexDirection:"column", alignItems:"center", gap:"0.75rem" }}>
        <span className="badge badge-primary">Reference Library</span>
        <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(2rem,4vw,3rem)", fontWeight:900, letterSpacing:"-0.03em" }}>Election Glossary</h1>
        <p style={{ color:"var(--text-secondary)", maxWidth:560, lineHeight:1.6 }}>
          {TERMS.length} election terms defined in plain language. Search, filter, and explore.
        </p>
      </div>

      {/* Search */}
      <div style={{ maxWidth:600, margin:"0 auto 2rem", position:"relative" }}>
        <input
          type="search"
          placeholder="Search terms..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search glossary terms"
          style={{ width:"100%", padding:"0.875rem 1.25rem 0.875rem 3rem", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"var(--radius-lg)", color:"var(--text-primary)", fontFamily:"var(--font-body)", fontSize:"1rem", outline:"none", transition:"border-color 0.2s" }}
        />
        <span style={{ position:"absolute", left:"1rem", top:"50%", transform:"translateY(-50%)", fontSize:"1.125rem", pointerEvents:"none" }}>🔍</span>
      </div>

      {/* Category filters */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", justifyContent:"center", marginBottom:"2.5rem" }}>
        <button onClick={() => setActiveCategory(null)} className={`badge ${!activeCategory ? "badge-primary" : ""}`}
          style={{ cursor:"pointer", padding:"0.375rem 1rem", fontSize:"0.8125rem", background: !activeCategory ? undefined : "rgba(255,255,255,0.03)", border: !activeCategory ? undefined : "1px solid rgba(255,255,255,0.08)", color: !activeCategory ? undefined : "var(--text-secondary)" }}>
          All ({TERMS.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = TERMS.filter(t => t.category === cat).length;
          const isActive = activeCategory === cat;
          return (
            <button key={cat} onClick={() => setActiveCategory(isActive ? null : cat)}
              className={`badge ${isActive ? "badge-primary" : ""}`}
              style={{ cursor:"pointer", padding:"0.375rem 1rem", fontSize:"0.8125rem", background: isActive ? undefined : "rgba(255,255,255,0.03)", border: isActive ? undefined : "1px solid rgba(255,255,255,0.08)", color: isActive ? undefined : "var(--text-secondary)" }}>
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"3rem", color:"var(--text-muted)" }}>
          <p style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>🔍</p>
          <p>No terms found for &quot;{search}&quot;</p>
        </div>
      ) : (
        <div style={{ maxWidth:800, margin:"0 auto" }}>
          {grouped.map(([letter, terms]) => (
            <div key={letter} style={{ marginBottom:"2rem" }}>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"1.5rem", fontWeight:800, color:"var(--color-primary-400)", marginBottom:"0.75rem", paddingBottom:"0.5rem", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {letter}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                {terms.map(t => {
                  const isOpen = expandedTerm === t.slug;
                  return (
                    <button key={t.slug} onClick={() => setExpandedTerm(isOpen ? null : t.slug)}
                      className="glass-card" aria-expanded={isOpen}
                      style={{ width:"100%", textAlign:"left", cursor:"pointer", color:"inherit", fontFamily:"inherit", padding:"1rem 1.25rem", border:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", gap: isOpen ? "0.75rem" : "0.25rem" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <h3 style={{ fontFamily:"var(--font-display)", fontSize:"1.0625rem", fontWeight:700, color:"var(--text-primary)" }}>{t.term}</h3>
                        <span style={{ fontSize:"0.75rem", transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition:"transform 0.2s", color:"var(--text-muted)" }}>▼</span>
                      </div>
                      <span className="badge" style={{ alignSelf:"flex-start", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"var(--text-muted)", fontSize:"0.6875rem" }}>{t.category}</span>
                      {isOpen && (
                        <div className="animate-fade-in">
                          <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)", lineHeight:1.7, marginTop:"0.25rem" }}>{t.definition}</p>
                          {t.related.length > 0 && (
                            <div style={{ marginTop:"0.75rem", display:"flex", flexWrap:"wrap", gap:"0.375rem", alignItems:"center" }}>
                              <span style={{ fontSize:"0.75rem", color:"var(--text-muted)", fontWeight:600 }}>Related:</span>
                              {t.related.map(r => (
                                <span key={r} className="badge badge-primary" style={{ fontSize:"0.6875rem" }}>{r}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Count */}
      <div style={{ textAlign:"center", marginTop:"2rem", color:"var(--text-muted)", fontSize:"0.875rem" }}>
        Showing {filtered.length} of {TERMS.length} terms
      </div>
    </div>
  );
}
