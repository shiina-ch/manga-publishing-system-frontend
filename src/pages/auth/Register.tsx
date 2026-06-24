import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Zap, ArrowLeft, ChevronDown, MailCheck, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { ApiRequestError, registerAccount } from "../../services/adminApi";
import { toast } from "react-toastify";
import {
  PUBLIC_REQUESTED_ROLE_OPTIONS,
  isPublicRequestedRole,
  type RegistrationRequest,
} from "../../types/account";

type RegistrationForm = Omit<RegistrationRequest, "requestedRole"> & {
  requestedRole: RegistrationRequest["requestedRole"] | "";
};

type RegistrationField = keyof RegistrationForm;
type FieldErrors = Partial<Record<RegistrationField, string>>;

const GMAIL_PATTERN = /^[A-Z0-9._%+-]+@gmail\.com$/i;
const PHONE_PATTERN = /^0\d{9}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const FIELD_LABELS: Record<RegistrationField, string> = {
  firstName: "First name",
  lastName: "Last name",
  phoneNumber: "Phone number",
  email: "Email",
  password: "Password",
  requestedRole: "Role",
};

function MangaArt() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "linear-gradient(160deg, #0D0815 0%, #1A0828 55%, #0A0F1A 100%)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      <div style={{ position: "absolute", top: "10%", right: "12%", width: 210, height: 210, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,240,255,0.2) 0%, transparent 70%)", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", bottom: "14%", left: "10%", width: 190, height: 190, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,42,122,0.2) 0%, transparent 70%)", filter: "blur(36px)" }} />
      <div style={{ position: "absolute", top: 28, left: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, opacity: 0.12 }}>
        {[80, 50, 50, 80].map((h, i) => <div key={i} style={{ width: 52, height: h, background: "var(--mf-border-bright)", borderRadius: 4 }} />)}
      </div>
      <div style={{ position: "relative", textAlign: "center", zIndex: 2 }}>
        <div style={{ width: 88, height: 88, borderRadius: 22, background: "linear-gradient(135deg, var(--mf-cyan), var(--mf-magenta))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: "0 0 40px var(--mf-cyan-glow), 0 0 70px var(--mf-magenta-glow)" }}>
          <BookOpen size={42} color="#fff" />
        </div>
        <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em", background: "linear-gradient(90deg, var(--mf-cyan), var(--mf-magenta))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Join MangaFlow</div>
        <p style={{ color: "var(--mf-text-secondary)", fontSize: 13, marginTop: 8, lineHeight: 1.65, maxWidth: 260 }}>Hundreds of creators, editors, and publishers building the future of manga.</p>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--mf-cyan), var(--mf-magenta), var(--mf-cyan))" }} />
    </div>
  );
}

interface FieldProps {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

function Field({ label, type = "text", placeholder, value, onChange, error }: FieldProps) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-secondary)", marginBottom: 6, letterSpacing: "0.06em" }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        aria-invalid={Boolean(error)}
        style={{ width: "100%", padding: "11px 14px", background: "var(--mf-bg-surface)", border: `1px solid ${error ? "var(--mf-magenta)" : "var(--mf-border-bright)"}`, borderRadius: 9, color: "var(--mf-text)", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
        onFocus={(event) => (event.currentTarget.style.borderColor = "var(--mf-cyan)")}
        onBlur={(event) => (event.currentTarget.style.borderColor = error ? "var(--mf-magenta)" : "var(--mf-border-bright)")}
      />
      {error && <div style={{ color: "var(--mf-magenta)", fontSize: 10, marginTop: 5, lineHeight: 1.35 }}>{error}</div>}
    </div>
  );
}

function validateRegistration(form: RegistrationForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required.";
  if (!form.lastName.trim()) errors.lastName = "Last name is required.";
  if (!PHONE_PATTERN.test(form.phoneNumber.trim())) errors.phoneNumber = "Phone number must contain exactly 10 digits and start with 0.";
  if (!GMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid @gmail.com address.";
  if (!PASSWORD_PATTERN.test(form.password)) errors.password = "Password must be at least 8 characters and include uppercase, lowercase, number, and special characters.";
  if (!form.requestedRole) errors.requestedRole = "Select a role.";
  return errors;
}

function backendFieldErrors(details: Record<string, unknown> | null): FieldErrors {
  if (!details) return {};
  const source = typeof details.errors === "object" && details.errors !== null && !Array.isArray(details.errors)
    ? details.errors as Record<string, unknown>
    : details;

  return Object.keys(FIELD_LABELS).reduce<FieldErrors>((errors, key) => {
    const field = key as RegistrationField;
    const value = source[field];
    if (typeof value === "string") errors[field] = value;
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) errors[field] = value.join(" ");
    return errors;
  }, {});
}

export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegistrationForm>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    password: "",
    requestedRole: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownFocused, setDropdownFocused] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const set = (field: RegistrationField) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value } as RegistrationForm));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validateRegistration(form);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.warning("Please review your registration details.");
      return;
    }

    if (!isPublicRequestedRole(form.requestedRole)) return;

    setLoading(true);
    try {
      await registerAccount({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        password: form.password,
        requestedRole: form.requestedRole,
      });
      setSubmitted(true);
    } catch (error: unknown) {
      if (error instanceof ApiRequestError) {
        const backendErrors = backendFieldErrors(error.details);
        setFieldErrors((current) => ({ ...current, ...backendErrors }));
        toast.error(Object.keys(backendErrors).length > 0 ? "Please review the highlighted fields." : error.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <div className="hidden lg:block" style={{ flex: "0 0 42%", height: "100%" }}><MangaArt /></div>
        <div style={{ flex: 1, background: "var(--mf-bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 36px" }}>
          <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
            <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 28px" }}>
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg, var(--mf-cyan), var(--mf-magenta))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px var(--mf-cyan-glow)", position: "relative", zIndex: 1 }}>
                <MailCheck size={42} color="#fff" />
              </div>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,240,255,0.08)", border: "1px solid rgba(0,240,255,0.2)", borderRadius: 100, padding: "4px 14px", marginBottom: 18 }}>
              <CheckCircle2 size={12} style={{ color: "var(--mf-cyan)" }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-cyan)", letterSpacing: "0.08em" }}>SUBMITTED SUCCESSFULLY</span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.02em", color: "var(--mf-text)", marginBottom: 14 }}>Registration request submitted</h1>
            <p style={{ fontSize: 14, color: "var(--mf-text-secondary)", lineHeight: 1.75, marginBottom: 32 }}>
              Your account is pending approval and cannot sign in yet.<br />
              Please return after your request has been reviewed.
            </p>
            <button onClick={() => navigate("/")} style={{ padding: "12px 32px", background: "var(--mf-magenta)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: "0 0 24px var(--mf-magenta-glow)" }}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 style={{ fontSize: 27, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 5, color: "var(--mf-text)" }}>Create Account</h1>
          <p style={{ color: "var(--mf-text-secondary)", fontSize: 13, marginBottom: 26 }}>Set up your profile and start creating.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <Field label="FIRST NAME" placeholder="Hiroshi" value={form.firstName} onChange={set("firstName")} error={fieldErrors.firstName} />
              <Field label="LAST NAME" placeholder="Nakamura" value={form.lastName} onChange={set("lastName")} error={fieldErrors.lastName} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <Field label="PHONE NUMBER" type="tel" placeholder="0912345678" value={form.phoneNumber} onChange={set("phoneNumber")} error={fieldErrors.phoneNumber} />
              <Field label="EMAIL ADDRESS" type="email" placeholder="you@gmail.com" value={form.email} onChange={set("email")} error={fieldErrors.email} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-secondary)", marginBottom: 6, letterSpacing: "0.06em" }}>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Min 8 chars, uppercase, number, special (@#$...)"
                  value={form.password}
                  onChange={set("password")}
                  aria-invalid={Boolean(fieldErrors.password)}
                  style={{ width: "100%", padding: "11px 42px 11px 14px", background: "var(--mf-bg-surface)", border: `1px solid ${fieldErrors.password ? "var(--mf-magenta)" : "var(--mf-border-bright)"}`, borderRadius: 9, color: "var(--mf-text)", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                  onFocus={(event) => (event.currentTarget.style.borderColor = "var(--mf-cyan)")}
                  onBlur={(event) => (event.currentTarget.style.borderColor = fieldErrors.password ? "var(--mf-magenta)" : "var(--mf-border-bright)")}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--mf-text-muted)", padding: 4 }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {fieldErrors.password && <div style={{ color: "var(--mf-magenta)", fontSize: 10, marginTop: 5, lineHeight: 1.35 }}>{fieldErrors.password}</div>}
            </div>

            {/* Role dropdown */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--mf-text-secondary)", marginBottom: 6, letterSpacing: "0.06em" }}>
                WHAT'S YOUR ROLE IN THE PROJECT
              </label>
              <div style={{ position: "relative" }}>
                <select
                  value={form.requestedRole}
                  onChange={set("requestedRole")}
                  onFocus={() => setDropdownFocused(true)}
                  onBlur={() => setDropdownFocused(false)}
                  style={{
                    width: "100%", padding: "11px 38px 11px 14px",
                    background: "var(--mf-bg-surface)",
                    border: `1px solid ${dropdownFocused ? "var(--mf-cyan)" : fieldErrors.requestedRole ? "var(--mf-magenta)" : "var(--mf-border-bright)"}`,
                    borderRadius: 9, color: form.requestedRole ? "var(--mf-text)" : "var(--mf-text-muted)",
                    fontSize: 13, outline: "none", boxSizing: "border-box",
                    appearance: "none", WebkitAppearance: "none", cursor: "pointer", transition: "border-color 0.15s",
                  }}
                >
                  <option value="" disabled style={{ color: "var(--mf-text-muted)", background: "var(--mf-bg-surface)" }}>Select a role…</option>
                  {PUBLIC_REQUESTED_ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} style={{ background: "var(--mf-bg-surface)", color: "var(--mf-text)" }}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--mf-text-muted)", pointerEvents: "none" }} />
              </div>
              {fieldErrors.requestedRole && <div style={{ color: "var(--mf-magenta)", fontSize: 10, marginTop: 5 }}>{fieldErrors.requestedRole}</div>}
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "13px", background: loading ? "var(--mf-border-bright)" : "var(--mf-magenta)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.04em", boxShadow: "0 0 24px var(--mf-magenta-glow)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = "0 0 40px var(--mf-magenta-glow)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 0 24px var(--mf-magenta-glow)")}
            >
              <Zap size={14} /> {loading ? "SUBMITTING..." : "SUBMIT"}
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
