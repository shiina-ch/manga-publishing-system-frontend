import { useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Eye, EyeOff, Zap } from "lucide-react";

function MangaArt() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "linear-gradient(160deg, #1A0D2E 0%, #0D0815 45%, #120820 100%)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      {/* Glow orbs */}
      <div style={{ position: "absolute", top: "12%", left: "15%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,42,122,0.22) 0%, transparent 70%)", filter: "blur(36px)" }} />
      <div style={{ position: "absolute", bottom: "18%", right: "12%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,240,255,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
      {/* Speed lines */}
      {[...Array(14)].map((_, i) => (
        <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: 2, height: `${55 + i * 16}px`, background: `linear-gradient(to bottom, transparent, ${i % 2 === 0 ? "rgba(255,42,122,0.25)" : "rgba(0,240,255,0.18)"})`, transformOrigin: "top center", transform: `translateX(-50%) rotate(${i * 25.7}deg)` }} />
      ))}
      {/* Halftone dots TL */}
      <div style={{ position: "absolute", top: 24, right: 28, opacity: 0.14 }}>
        {[...Array(5)].map((_, r) => <div key={r} style={{ display: "flex", gap: 9, marginBottom: 9 }}>{[...Array(5)].map((_, c) => <div key={c} style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--mf-cyan)" }} />)}</div>)}
      </div>
      {/* Halftone dots BL */}
      <div style={{ position: "absolute", bottom: 48, left: 28, opacity: 0.14 }}>
        {[...Array(4)].map((_, r) => <div key={r} style={{ display: "flex", gap: 9, marginBottom: 9 }}>{[...Array(4)].map((_, c) => <div key={c} style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--mf-magenta)" }} />)}</div>)}
      </div>
      {/* Manga panel silhouettes */}
      <div style={{ position: "absolute", bottom: 60, left: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, opacity: 0.1 }}>
        {[80, 50, 50, 80].map((h, i) => <div key={i} style={{ width: 48, height: h, background: "var(--mf-border-bright)", borderRadius: 3 }} />)}
      </div>
      {/* Logo center */}
      <div style={{ position: "relative", textAlign: "center", zIndex: 2 }}>
        <div style={{ width: 96, height: 96, borderRadius: 24, background: "linear-gradient(135deg, var(--mf-magenta), var(--mf-cyan))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 0 40px var(--mf-magenta-glow), 0 0 80px var(--mf-cyan-glow)" }}>
          <BookOpen size={46} color="#fff" />
        </div>
        <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(90deg, var(--mf-magenta), var(--mf-cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>MangaFlow</div>
        <p style={{ color: "var(--mf-text-secondary)", fontSize: 12, marginTop: 10, letterSpacing: "0.14em" }}>CREATE · COLLABORATE · PUBLISH</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 22 }}>
          {["Mangaka", "Editor", "Board", "Assistant"].map(r => (
            <div key={r} style={{ padding: "3px 10px", borderRadius: 100, border: "1px solid var(--mf-border-bright)", fontSize: 10, color: "var(--mf-text-muted)", letterSpacing: "0.07em", background: "rgba(255,255,255,0.03)" }}>{r}</div>
          ))}
        </div>
      </div>
      {/* Bottom strip */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--mf-magenta), var(--mf-cyan), var(--mf-magenta))" }} />
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", remember: false });

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Art panel */}
      <div className="hidden lg:block" style={{ flex: "0 0 46%", height: "100%" }}>
        <MangaArt />
      </div>
      {/* Form panel */}
      <div style={{ flex: 1, background: "var(--mf-bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 36px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 38 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 22 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--mf-magenta)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen size={16} color="#fff" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.05em", color: "var(--mf-text)" }}>MANGAFLOW</span>
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 6, color: "var(--mf-text)" }}>Welcome back</h1>
            <p style={{ color: "var(--mf-text-secondary)", fontSize: 14 }}>Sign in to continue creating manga.</p>
          </div>

          <form onSubmit={e => { e.preventDefault(); navigate("/editor"); }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-secondary)", marginBottom: 7, letterSpacing: "0.06em" }}>EMAIL ADDRESS</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@mangaflow.io"
                style={{ width: "100%", padding: "12px 15px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border-bright)", borderRadius: 10, color: "var(--mf-text)", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                onFocus={e => (e.target.style.borderColor = "var(--mf-magenta)")}
                onBlur={e => (e.target.style.borderColor = "var(--mf-border-bright)")}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-secondary)", marginBottom: 7, letterSpacing: "0.06em" }}>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••••"
                  style={{ width: "100%", padding: "12px 46px 12px 15px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border-bright)", borderRadius: 10, color: "var(--mf-text)", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                  onFocus={e => (e.target.style.borderColor = "var(--mf-magenta)")}
                  onBlur={e => (e.target.style.borderColor = "var(--mf-border-bright)")}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)", padding: 4 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 26 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                <input type="checkbox" checked={form.remember} onChange={e => setForm({ ...form, remember: e.target.checked })} style={{ accentColor: "var(--mf-magenta)", width: 14, height: 14 }} />
                <span style={{ fontSize: 13, color: "var(--mf-text-secondary)" }}>Remember me</span>
              </label>
              <button type="button" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mf-cyan)", fontSize: 13, fontWeight: 700 }}>Forgot password?</button>
            </div>
            <button type="submit" style={{ width: "100%", padding: "13px", background: "var(--mf-magenta)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", letterSpacing: "0.04em", boxShadow: "0 0 24px var(--mf-magenta-glow)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 40px var(--mf-magenta-glow)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 24px var(--mf-magenta-glow)")}
            >
              <Zap size={15} /> LOGIN TO WORKSPACE
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: "var(--mf-text-muted)" }}>
            Don't have an account?{" "}
            <button onClick={() => navigate("/register")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mf-cyan)", fontWeight: 700, fontSize: 13 }}>Submit information →</button>
          </p>


        </div>
      </div>
    </div>
  );
}
