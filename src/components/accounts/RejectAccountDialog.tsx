import { useState, type FormEvent } from "react";
import type { AccountResponse } from "../../types/account";
import { AlertCircle, X } from "lucide-react";

interface RejectAccountDialogProps {
  account: AccountResponse | null;
  open: boolean;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<boolean>;
}

export function RejectAccountDialog({
  account,
  open,
  submitting,
  onOpenChange,
  onConfirm,
}: RejectAccountDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && submitting) return;
    if (!nextOpen) {
      setReason("");
      setError(null);
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError("A rejection reason is required.");
      return;
    }
    if (trimmedReason.length > 1000) {
      setError("The reason must not exceed 1000 characters.");
      return;
    }

    setError(null);
    const succeeded = await onConfirm(trimmedReason);
    if (succeeded) {
      setReason("");
      onOpenChange(false);
    }
  }

  const fullName = account ? `${account.firstName} ${account.lastName}`.trim() : "this account";

  if (!open) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 520, background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)", borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>
        
        {/* Header Section */}
        <div style={{
          padding: "24px 32px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255, 42, 122, 0.1)", border: "1px solid rgba(255, 42, 122, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mf-magenta)", flexShrink: 0 }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>Reject account request</div>
              <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>Provide a reason for rejecting <strong style={{ color: "var(--mf-text-secondary)" }}>{fullName}</strong>.</div>
            </div>
          </div>
          <button onClick={() => handleOpenChange(false)} disabled={submitting} type="button" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, cursor: submitting ? "not-allowed" : "pointer", color: "var(--mf-text-muted)", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease" }}
            onMouseEnter={e => { if(!submitting) { e.currentTarget.style.background = "rgba(255, 42, 122, 0.1)"; e.currentTarget.style.color = "var(--mf-magenta)"; e.currentTarget.style.borderColor = "rgba(255, 42, 122, 0.3)"; } }}
            onMouseLeave={e => { if(!submitting) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "var(--mf-text-muted)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; } }}
          ><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "28px 32px 32px", display: "flex", flexDirection: "column" }}>
            <div>
              <label htmlFor="rejection-reason" style={{ display: "block", fontSize: 10, fontWeight: 800, color: "var(--mf-text-muted)", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>REJECTION REASON</label>
              <textarea
                id="rejection-reason"
                value={reason}
                maxLength={1000}
                disabled={submitting}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "rejection-reason-error rejection-reason-count" : "rejection-reason-count"}
                onChange={(event) => { setReason(event.target.value); if (error) setError(null); }}
                placeholder="Provide a clear reason so the applicant can understand this decision..."
                style={{
                  width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.02)",
                  border: error ? "1px solid var(--mf-magenta)" : "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 500, minHeight: 130,
                  outline: "none", transition: "border-color 0.15s ease", resize: "vertical", boxSizing: "border-box"
                }}
                onFocus={e => !error && (e.currentTarget.style.borderColor = "var(--mf-magenta)")}
                onBlur={e => !error && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 8, minHeight: 18 }}>
                <span id="rejection-reason-error" role="alert" style={{ color: "var(--mf-magenta)", fontSize: 11, fontWeight: 700 }}>{error}</span>
                <span id="rejection-reason-count" style={{ color: "var(--mf-text-muted)", fontSize: 11, fontWeight: 600, marginLeft: "auto" }}>{reason.length}/1000</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button type="button" onClick={() => handleOpenChange(false)} disabled={submitting} style={{ padding: "10px 18px", background: "transparent", color: "var(--mf-text)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", transition: "border-color 0.15s ease" }} onMouseEnter={e => !submitting && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")} onMouseLeave={e => !submitting && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}>Cancel</button>
              <button type="submit" disabled={submitting} style={{ padding: "10px 22px", background: "var(--mf-magenta)", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 15px rgba(255,42,122,0.4)" }}>
                {submitting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
