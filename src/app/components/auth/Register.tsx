import { useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Eye, EyeOff, Zap, ArrowLeft } from "lucide-react";

function MangaArt() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "linear-gradient(160deg, #0D0815 0%, #1A0828 55%, #0A0F1A 100%)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div style={{ position: "absolute", top: "10%", right: "12%", width: 210, height: 210, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,240,255,0.2) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", bottom: "14%", left: "10%", width: 190, height: 190, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,42,122,0.2) 0%, transparent 70%)", filter: "blur(36px)" }} />
      {/* Manga panel grid decoration */}
      <div style={{ position: "absolute", top: 28, left: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, opacity: 0.12 }}>
        {[80, 50, 50, 80].map((h, i) => <div key={i} style={{ width: 52, height: h, background: "var(--mf-border-bright)", borderRadius: 4 }} />)}
      </div>
      <div style={{ position: "absolute", bottom: 48, right: 28, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, opacity: 0.1 }}>
        {[60, 40, 60, 40, 60, 40].map((h, i) => <div key={i} style={{ width: 34, height: h, background: "var(--mf-border-bright)", borderRadius: 4 }} />)}
      </div>
      <div style={{ position: "relative", textAlign: "center", zIndex: 2 }}>
        <div style={{ width: 88, height: 88, borderRadius: 22, background: "linear-gradient(135deg, var(--mf-cyan), var(--mf-magenta))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "0 0 40px var(--mf-cyan-glow), 0 0 70px var(--mf-magenta-glow)" }}>
          <BookOpen size={42} color="#fff" />
        </div>
        <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(90deg, var(--mf-cyan), var(--mf-magenta))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Join MangaFlow</div>
        <p style={{ color: "var(--mf-text-secondary)", fontSize: 13, marginTop: 8, lineHeight: 1.65, maxWidth: 260 }}>Hundreds of creators, editors, and publishers building the future of manga.</p>
        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start", maxWidth: 230, margin: "26px auto 0" }}>
          {["Upload & manage manga projects", "Collaborate with assistants in real-time", "Board-managed publishing pipeline"].map(t => (
            <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
              <span style={{ color: "var(--mf-cyan)", fontSize: 13, lineHeight: 1.5, flexShrink: 0 }}>✦</span>
              <span style={{ color: "var(--mf-text-secondary)", fontSize: 13, lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--mf-cyan), var(--mf-magenta), var(--mf-cyan))" }} />
    </div>
  );
}

function Field({ label, type = "text", placeholder, value, onChange, onFocus, onBlur }: any) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-secondary)", marginBottom: 6, letterSpacing: "0.06em" }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ width: "100%", padding: "11px 14px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border-bright)", borderRadius: 9, color: "var(--mf-text)", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
        onFocus={onFocus || ((e: any) => (e.target.style.borderColor = "var(--mf-cyan)"))}
        onBlur={onBlur || ((e: any) => (e.target.style.borderColor = "var(--mf-border-bright)"))}
      />
    </div>
  );
}

export function Register() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", password: "", address: "" });
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div className="hidden lg:block" style={{ flex: "0 0 42%", height: "100%" }}><MangaArt /></div>
      <div style={{ flex: 1, background: "var(--mf-bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 36px", overflowY: "auto" }}>
        <div style={{ width: "100%", maxWidth: 430 }}>
          <button onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)", fontSize: 13, marginBottom: 22, padding: 0 }}>
            <ArrowLeft size={13} /> Back to Login
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--mf-cyan)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BookOpen size={14} color="#000" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.05em" }}>MANGAFLOW</span>
          </div>
          <h1 style={{ fontSize: 27, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 5, color: "var(--mf-text)" }}>Create your account</h1>
          <p style={{ color: "var(--mf-text-secondary)", fontSize: 13, marginBottom: 26 }}>Set up your profile and start creating.</p>

          <form onSubmit={e => { e.preventDefault(); navigate("/"); }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <Field label="FIRST NAME" placeholder="Hiroshi" value={form.firstName} onChange={set("firstName")} />
              <Field label="LAST NAME" placeholder="Nakamura" value={form.lastName} onChange={set("lastName")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <Field label="PHONE NUMBER" type="tel" placeholder="+81 90-0000-0000" value={form.phone} onChange={set("phone")} />
              <Field label="EMAIL ADDRESS" type="email" placeholder="you@mangaflow.io" value={form.email} onChange={set("email")} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-secondary)", marginBottom: 6, letterSpacing: "0.06em" }}>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Create a strong password"
                  style={{ width: "100%", padding: "11px 42px 11px 14px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border-bright)", borderRadius: 9, color: "var(--mf-text)", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                  onFocus={e => (e.target.style.borderColor = "var(--mf-cyan)")}
                  onBlur={e => (e.target.style.borderColor = "var(--mf-border-bright)")}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)", padding: 3 }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-secondary)", marginBottom: 6, letterSpacing: "0.06em" }}>FULL ADDRESS</label>
              <textarea value={form.address} onChange={set("address")} placeholder="123 Manga Street, Akihabara, Tokyo, Japan 101-0021" rows={2}
                style={{ width: "100%", padding: "11px 14px", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border-bright)", borderRadius: 9, color: "var(--mf-text)", fontSize: 13, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "inherit", transition: "border-color 0.15s" }}
                onFocus={e => (e.target.style.borderColor = "var(--mf-cyan)")}
                onBlur={e => (e.target.style.borderColor = "var(--mf-border-bright)")}
              />
            </div>
            <button type="submit" style={{ width: "100%", padding: "13px", background: "var(--mf-magenta)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", letterSpacing: "0.04em", boxShadow: "0 0 24px var(--mf-magenta-glow)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Zap size={14} /> CREATE MY ACCOUNT
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--mf-text-muted)" }}>
            Already registered?{" "}
            <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mf-magenta)", fontWeight: 700, fontSize: 13 }}>Sign in →</button>
          </p>
        </div>
      </div>
    </div>
  );
}
