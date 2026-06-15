import { useState, useEffect } from "react";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  CheckCircle, X, Users, ThumbsUp, ThumbsDown, Clock, Eye,
  ChevronLeft, ChevronRight, Package, Share2, Download,
  Star, BookOpen, Zap, Shield,
} from "lucide-react";

const chapterPages = [
  { id: 1, label: "Opening — Neo-Tokyo Skyline", type: "wide" },
  { id: 2, label: "Kaito's Introduction", type: "standard" },
  { id: 3, label: "The Encounter", type: "standard" },
  { id: 4, label: "Airi's Reveal — Full Spread", type: "spread" },
  { id: 5, label: "Cliffhanger Panel", type: "standard" },
];

const precastVotes = [
  { member: "Board Member A", vote: "publish", time: "2h ago" },
  { member: "Board Member B", vote: "publish", time: "1h 45m ago" },
  { member: "Board Member C", vote: "reject", time: "1h 20m ago" },
  { member: "Board Member D", vote: "publish", time: "45m ago" },
];

const chaptersAwaitingVote = [
  { id: 1, title: "Neon Samurai Ch.1 — The Null Blade", votes: "4/5", pct: 80, status: "voting" },
  { id: 2, title: "Ghost Meridian Ch.1 — Foresight", votes: "2/5", pct: 100, status: "voting" },
  { id: 3, title: "Bloom Protocol Ch.3 — Emotion.exe", votes: "0/5", pct: 0, status: "pending" },
];

export function VotingRoom() {
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [myVote, setMyVote] = useState<"publish" | "reject" | null>(null);
  const [votes, setVotes] = useState(precastVotes);
  const [showSuccess, setShowSuccess] = useState(false);
  const [autoVotePct, setAutoVotePct] = useState(0);

  const totalVoters = 5;
  const publishVotes = votes.filter(v => v.vote === "publish").length + (myVote === "publish" ? 1 : 0);
  const rejectVotes = votes.filter(v => v.vote === "reject").length + (myVote === "reject" ? 1 : 0);
  const totalCast = votes.length + (myVote ? 1 : 0);
  const approvalPct = totalCast > 0 ? Math.round((publishVotes / totalVoters) * 100) : 0;
  const isComplete = totalCast >= totalVoters;
  const isPassed = isComplete && approvalPct >= 60;

  useEffect(() => {
    if (isPassed && !showSuccess) {
      setShowSuccess(true);
    }
  }, [isPassed]);

  // Animate approval bar
  useEffect(() => {
    const target = approvalPct;
    const timer = setInterval(() => {
      setAutoVotePct(prev => {
        if (prev >= target) { clearInterval(timer); return target; }
        return Math.min(prev + 2, target);
      });
    }, 20);
    return () => clearInterval(timer);
  }, [approvalPct]);

  const castVote = (vote: "publish" | "reject") => {
    if (myVote) return;
    setMyVote(vote);
  };

  return (
    <AppLayout role="board">
      <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

        {/* Chapter list sidebar */}
        <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid var(--mf-border)" }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.01em" }}>Publishing Votes</h2>
            <p style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 3 }}>Board approval required</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
            {/* Awaiting Vote */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mf-text-muted)", letterSpacing: "0.08em", padding: "6px 4px 8px" }}>AWAITING VOTE</div>
            {chaptersAwaitingVote.map(ch => (
              <button
                key={ch.id}
                onClick={() => setSelectedChapter(ch.id)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 14px",
                  marginBottom: 7,
                  background: selectedChapter === ch.id ? "var(--mf-bg-elevated)" : "var(--mf-bg-surface)",
                  border: `1px solid ${selectedChapter === ch.id ? "rgba(255,140,66,0.4)" : "var(--mf-border)"}`,
                  borderRadius: 11,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--mf-text)", marginBottom: 6, lineHeight: 1.3 }}>{ch.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: "var(--mf-bg-deep)", borderRadius: 100, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${ch.pct}%`, background: "var(--mf-orange)", borderRadius: 100 }} />
                  </div>
                  <span style={{ fontSize: 10, color: "var(--mf-orange)", fontWeight: 700, flexShrink: 0 }}>{ch.votes}</span>
                </div>
              </button>
            ))}

            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mf-text-muted)", letterSpacing: "0.08em", padding: "14px 4px 8px" }}>PUBLISHED CATALOG</div>
            {["One Piece Ch.1120", "Blue Lock Ch.290", "JJK Ch.265"].map(title => (
              <div key={title} style={{ padding: "9px 14px", marginBottom: 5, background: "var(--mf-bg-surface)", borderRadius: 9, border: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle size={12} color="var(--mf-green)" />
                <span style={{ fontSize: 11, color: "var(--mf-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
              </div>
            ))}

            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mf-text-muted)", letterSpacing: "0.08em", padding: "14px 4px 8px" }}>ARCHIVED</div>
            {["Neon Samurai Beta", "Ghost Meridian Pilot"].map(title => (
              <div key={title} style={{ padding: "9px 14px", marginBottom: 5, background: "var(--mf-bg-surface)", borderRadius: 9, border: "1px solid var(--mf-border)", display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={12} color="var(--mf-text-muted)" />
                <span style={{ fontSize: 11, color: "var(--mf-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Manga reader */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0A0612" }}>
          {/* Reader header */}
          <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--mf-border)", background: "var(--mf-bg-base)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <BookOpen size={15} color="var(--mf-magenta)" />
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--mf-text)" }}>Neon Samurai — Ch.1 "The Null Blade"</span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--mf-text-muted)" }}>{currentPage + 1} / {chapterPages.length}</span>
              <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} style={{ width: 28, height: 28, borderRadius: 7, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: currentPage === 0 ? "not-allowed" : "pointer", color: "var(--mf-text-muted)", opacity: currentPage === 0 ? 0.4 : 1 }}>
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setCurrentPage(Math.min(chapterPages.length - 1, currentPage + 1))} disabled={currentPage === chapterPages.length - 1} style={{ width: 28, height: 28, borderRadius: 7, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: currentPage === chapterPages.length - 1 ? "not-allowed" : "pointer", color: "var(--mf-text-muted)", opacity: currentPage === chapterPages.length - 1 ? 0.4 : 1 }}>
                <ChevronRight size={14} />
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 7 }}>
                <Eye size={12} color="var(--mf-text-muted)" />
                <span style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>Review Mode</span>
              </div>
            </div>
          </div>

          {/* Manga page display */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 20px", gap: 12 }}>
            {/* Page thumbnail placeholder */}
            <div style={{
              width: "100%",
              maxWidth: chapterPages[currentPage].type === "spread" ? 780 : 480,
              aspectRatio: chapterPages[currentPage].type === "wide" ? "16/9" : chapterPages[currentPage].type === "spread" ? "2/1.4" : "3/4",
              background: "linear-gradient(160deg, #1A0F28 0%, #0D0815 60%, #130920 100%)",
              borderRadius: 6,
              border: "2px solid var(--mf-border-bright)",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 0 80px rgba(0,0,0,0.9), 0 20px 60px rgba(0,0,0,0.6)",
            }}>
              {/* Background art simulation */}
              <div style={{ position: "absolute", inset: 0 }}>
                <svg width="100%" height="100%" viewBox="0 0 480 640" preserveAspectRatio="xMidYMid slice">
                  {/* Sky gradient */}
                  <defs>
                    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#080615" />
                      <stop offset="100%" stopColor="#1A0D2E" />
                    </linearGradient>
                    <radialGradient id="cityGlow" cx="50%" cy="80%" r="60%">
                      <stop offset="0%" stopColor="#FF2A7A" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                  </defs>
                  <rect width="480" height="640" fill="url(#sky)" />
                  <rect width="480" height="640" fill="url(#cityGlow)" />
                  {/* City buildings silhouette */}
                  {[[0,300,80,340],[90,220,60,380],[160,280,50,360],[220,180,90,460],[320,240,70,400],[400,200,80,440]].map(([x,y,w,h],i) => (
                    <rect key={i} x={x} y={y} width={w} height={h} fill={`hsl(270, 30%, ${6+i}%)`} />
                  ))}
                  {/* Window lights */}
                  {[...Array(24)].map((_,i) => (
                    <rect key={i} x={15+(i*19)%450} y={195+(i*23)%200} width={4} height={5}
                      fill={["#00F0FF","#FF2A7A","#FFD700"][i%3]} opacity={0.6} />
                  ))}
                  {/* Speed lines for action pages */}
                  {chapterPages[currentPage].type !== "wide" && [...Array(8)].map((_,i) => (
                    <line key={i} x1={240} y1={320} x2={i%2===0?-50:530} y2={100+i*60}
                      stroke="rgba(255,255,255,0.04)" strokeWidth={2+(i%3)} />
                  ))}
                  {/* Manga panel borders */}
                  <rect x="10" y="10" width="460" height="300" fill="none" stroke="white" strokeWidth="2" opacity="0.1"/>
                  <rect x="10" y="320" width="220" height="310" fill="none" stroke="white" strokeWidth="2" opacity="0.1"/>
                  <rect x="240" y="320" width="230" height="310" fill="none" stroke="white" strokeWidth="2" opacity="0.1"/>
                </svg>
              </div>
              {/* Page label */}
              <div style={{ position: "absolute", top: 12, left: 12, padding: "4px 10px", background: "rgba(0,0,0,0.7)", borderRadius: 5, fontSize: 11, color: "var(--mf-text-secondary)", fontWeight: 700 }}>
                Page {currentPage + 1} — {chapterPages[currentPage].label}
              </div>
            </div>

            {/* Webtoon-style strip previews */}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {chapterPages.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setCurrentPage(i)}
                  style={{ width: 48, height: 64, borderRadius: 5, background: i === currentPage ? "var(--mf-magenta-dim)" : "var(--mf-bg-surface)", border: `2px solid ${i === currentPage ? "var(--mf-magenta)" : "var(--mf-border)"}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, flexShrink: 0, transition: "all 0.15s" }}
                >
                  <div style={{ width: 32, height: 40, background: "var(--mf-bg-elevated)", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 8, color: "var(--mf-text-muted)" }}>P{i + 1}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Voting panel */}
        <div style={{
          width: 320,
          flexShrink: 0,
          borderLeft: "1px solid var(--mf-border)",
          background: "var(--mf-bg-base)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Success state */}
          {isPassed && (
            <div style={{
              padding: "16px 18px",
              background: "linear-gradient(135deg, var(--mf-green-dim), rgba(57,255,138,0.08))",
              borderBottom: "1px solid var(--mf-green)40",
              textAlign: "center",
            }}>
              <div style={{
                fontSize: 16,
                fontWeight: 900,
                color: "var(--mf-green)",
                letterSpacing: "0.04em",
                textShadow: "0 0 20px rgba(57,255,138,0.6)",
                marginBottom: 4,
                animation: "pulse 2s infinite",
              }}>
                #READY TO PUBLISH
              </div>
              <div style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>Board vote passed · {approvalPct}% approval</div>
            </div>
          )}

          {/* Chapter info */}
          <div style={{ padding: "18px 18px 14px", borderBottom: "1px solid var(--mf-border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 10 }}>CHAPTER UNDER REVIEW</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--mf-text)", marginBottom: 4 }}>Neon Samurai — Ch.1</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Action", "Cyberpunk"].map(g => (
                <span key={g} style={{ padding: "3px 10px", background: "var(--mf-magenta-dim)", border: "1px solid var(--mf-magenta)30", borderRadius: 100, fontSize: 10, color: "var(--mf-magenta)", fontWeight: 700 }}>{g}</span>
              ))}
            </div>
          </div>

          {/* Live vote stats */}
          <div style={{ padding: "18px", borderBottom: "1px solid var(--mf-border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Shield size={14} color="var(--mf-orange)" />
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--mf-text)" }}>Live Vote Count</span>
              </div>
              <span style={{ fontSize: 11, color: "var(--mf-orange)", fontWeight: 700 }}>{totalCast}/{totalVoters} Received</span>
            </div>

            {/* Approval bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "var(--mf-text-muted)" }}>Approval Rate</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: isPassed ? "var(--mf-green)" : approvalPct >= 60 ? "var(--mf-orange)" : "var(--mf-magenta)" }}>{autoVotePct}%</span>
              </div>
              <div style={{ height: 10, background: "var(--mf-bg-elevated)", borderRadius: 100, overflow: "hidden", position: "relative" }}>
                {/* Threshold line at 60% */}
                <div style={{ position: "absolute", left: "60%", top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.3)", zIndex: 1 }} />
                <div style={{ height: "100%", width: `${autoVotePct}%`, background: isPassed ? "linear-gradient(90deg, var(--mf-green), #5AFF9A)" : "linear-gradient(90deg, var(--mf-magenta), var(--mf-orange))", borderRadius: 100, transition: "width 0.3s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "var(--mf-text-muted)" }}>
                <span>0%</span><span>60% threshold</span><span>100%</span>
              </div>
            </div>

            {/* Vote breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ padding: "12px", background: "var(--mf-green-dim)", border: "1px solid var(--mf-green)30", borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: "var(--mf-green)" }}>{publishVotes}</div>
                <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginTop: 2 }}>PUBLISH</div>
              </div>
              <div style={{ padding: "12px", background: "var(--mf-magenta-dim)", border: "1px solid var(--mf-magenta)30", borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: "var(--mf-magenta)" }}>{rejectVotes}</div>
                <div style={{ fontSize: 10, color: "var(--mf-text-muted)", marginTop: 2 }}>REJECT</div>
              </div>
            </div>
          </div>

          {/* Anonymous votes log */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mf-text-muted)", letterSpacing: "0.07em", marginBottom: 10 }}>ANONYMOUS VOTES</div>
            {votes.map((v, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 6, background: "var(--mf-bg-surface)", borderRadius: 9, border: `1px solid ${v.vote === "publish" ? "var(--mf-green)25" : "var(--mf-magenta)25"}` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: v.vote === "publish" ? "var(--mf-green)" : "var(--mf-magenta)", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: "var(--mf-text-secondary)" }}>{v.member}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: v.vote === "publish" ? "var(--mf-green)" : "var(--mf-magenta)" }}>{v.vote === "publish" ? "PUBLISH" : "REJECT"}</span>
                <span style={{ fontSize: 10, color: "var(--mf-text-muted)" }}>{v.time}</span>
              </div>
            ))}
            {myVote && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 6, background: "var(--mf-bg-elevated)", borderRadius: 9, border: `2px solid ${myVote === "publish" ? "var(--mf-green)" : "var(--mf-magenta)"}60` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: myVote === "publish" ? "var(--mf-green)" : "var(--mf-magenta)", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: "var(--mf-text-secondary)" }}>You (Director Tanaka)</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: myVote === "publish" ? "var(--mf-green)" : "var(--mf-magenta)" }}>{myVote.toUpperCase()}</span>
                <span style={{ fontSize: 10, color: "var(--mf-text-muted)" }}>just now</span>
              </div>
            )}
          </div>

          {/* Vote buttons */}
          <div style={{ padding: "16px 18px", borderTop: "1px solid var(--mf-border)" }}>
            {myVote ? (
              <div style={{ padding: "14px", background: "var(--mf-bg-surface)", borderRadius: 12, border: "1px solid var(--mf-border)", textAlign: "center" }}>
                <CheckCircle size={20} color="var(--mf-green)" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--mf-text)" }}>Vote cast: <span style={{ color: myVote === "publish" ? "var(--mf-green)" : "var(--mf-magenta)" }}>{myVote.toUpperCase()}</span></div>
                <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginTop: 4 }}>Your vote is anonymous and final.</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, color: "var(--mf-text-muted)", marginBottom: 12, textAlign: "center", letterSpacing: "0.04em" }}>CAST YOUR VOTE — ANONYMOUS & FINAL</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    onClick={() => castVote("publish")}
                    style={{ padding: "14px 10px", background: "var(--mf-green)", border: "none", borderRadius: 12, color: "#000", fontSize: 13, fontWeight: 900, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, boxShadow: "0 0 20px rgba(57,255,138,0.3)", letterSpacing: "0.04em" }}
                  >
                    <ThumbsUp size={20} />
                    PUBLISH
                  </button>
                  <button
                    onClick={() => castVote("reject")}
                    style={{ padding: "14px 10px", background: "transparent", border: "2px solid var(--mf-magenta)", borderRadius: 12, color: "var(--mf-magenta)", fontSize: 13, fontWeight: 900, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, letterSpacing: "0.04em" }}
                  >
                    <ThumbsDown size={20} />
                    REJECT
                  </button>
                </div>
              </div>
            )}

            {/* Post-approval publish actions */}
            {isPassed && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mf-green)", letterSpacing: "0.08em", textAlign: "center", marginBottom: 4 }}>PACKAGING OPTIONS UNLOCKED</div>
                {[
                  { icon: Package, label: "Package for Platform Upload", color: "var(--mf-cyan)" },
                  { icon: Share2, label: "Push to Social Media", color: "var(--mf-magenta)" },
                  { icon: Download, label: "Export PDF / CBZ", color: "var(--mf-orange)" },
                ].map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: `${action.color}12`, border: `1px solid ${action.color}30`, borderRadius: 10, color: action.color, fontSize: 12, fontWeight: 700, cursor: "pointer", width: "100%", textAlign: "left" }}
                    >
                      <Icon size={14} /> {action.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
