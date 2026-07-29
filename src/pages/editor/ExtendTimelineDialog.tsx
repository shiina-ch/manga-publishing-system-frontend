import { useState } from "react";
import { Loader2, Save, X, Calendar } from "lucide-react";
import { toast } from "react-toastify";
import { extendProductionPlanTimeline, type ExtendTimelinePayload } from "../../services/projectApi";
import { tokenStorage } from "../../storage/tokenStorage";

interface ExtendTimelineDialogProps {
  planId: number;
  currentEndDate?: string | null;
  currentPublishDate?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const fieldStyle = {
  width: "100%",
  padding: "12px 16px",
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  outline: "none",
  transition: "border-color 0.15s ease",
  marginTop: 8,
  boxSizing: "border-box"
} as const;

const labelStyle = {
  display: "block",
  fontSize: 10,
  fontWeight: 800,
  color: "var(--mf-text-muted)",
  marginBottom: 8,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
};

export function ExtendTimelineDialog({ planId, currentEndDate, currentPublishDate, onClose, onSuccess }: ExtendTimelineDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newEndDate, setNewEndDate] = useState(currentEndDate ? currentEndDate.split("T")[0] : "");
  const [newPublishDate, setNewPublishDate] = useState(currentPublishDate ? currentPublishDate.split("T")[0] : "");
  const [reasonCode, setReasonCode] = useState("CLIENT_CHANGE");
  const [reasonNote, setReasonNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setError(null);

    if (!newEndDate) {
      setError("New End Date is required.");
      return;
    }
    if (!newPublishDate) {
      setError("New Publish Date is required.");
      return;
    }
    if (!reasonCode) {
      setError("Reason Code is required.");
      return;
    }
    if (!reasonNote.trim()) {
      setError("Reason Note is required.");
      return;
    }

    setSaving(true);

    try {
      const requesterId = tokenStorage.getAccount()?.id;
      if (!requesterId) throw new Error("Authentication required");

      const payload: ExtendTimelinePayload = {
        newEndDate: newEndDate,
        publishDate: newPublishDate ? newPublishDate : undefined,
        reasonCode,
        reasonNote,
      };

      await extendProductionPlanTimeline(planId, requesterId, payload);
      toast.success("Timeline extended successfully!");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to extend timeline.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200,
    }}>
      <div style={{
        background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
        borderRadius: 16, width: "100%", maxWidth: 500, boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column"
      }}>
        <div style={{
          padding: "24px 32px 18px", display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.01)", flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "rgba(0, 240, 255, 0.1)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--mf-cyan)", flexShrink: 0
            }}>
              <Calendar size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>Extend Timeline</div>
              <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>
                Request an extension for the production plan
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 10, cursor: "pointer", color: "var(--mf-text-muted)",
              width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0, 240, 255, 0.1)"; e.currentTarget.style.color = "var(--mf-cyan)"; e.currentTarget.style.borderColor = "rgba(0, 240, 255, 0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; e.currentTarget.style.color = "var(--mf-text-muted)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "28px 32px 32px" }}>
          {error && (
            <div style={{
              padding: "12px 16px", background: "rgba(255,42,109,0.1)",
              border: "1px solid rgba(255,42,109,0.3)", color: "var(--mf-magenta)",
              borderRadius: 10, fontSize: 13, marginBottom: 20, fontWeight: 700
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={labelStyle}>NEW END DATE</label>
              <input
                type="date"
                value={newEndDate}
                onChange={e => setNewEndDate(e.target.value)}
                disabled={saving}
                style={fieldStyle}
                required
                onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            <div>
              <label style={labelStyle}>NEW PUBLISH DATE </label>
              <input
                type="date"
                value={newPublishDate}
                onChange={e => setNewPublishDate(e.target.value)}
                disabled={saving}
                style={fieldStyle}
                min={newEndDate}
                required
                onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            <div>
              <label style={labelStyle}>REASON CODE</label>
              <select
                value={reasonCode}
                onChange={e => setReasonCode(e.target.value)}
                disabled={saving}
                style={fieldStyle}
                required
                onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              >
                <option value="CLIENT_CHANGE" style={{ background: "var(--mf-bg-deep)" }}>Client Change</option>
                <option value="RESOURCE_SHORTAGE" style={{ background: "var(--mf-bg-deep)" }}>Resource Shortage</option>
                <option value="TECHNICAL_ISSUE" style={{ background: "var(--mf-bg-deep)" }}>Technical Issue</option>
                <option value="OTHER" style={{ background: "var(--mf-bg-deep)" }}>Other</option>
                <option value="DELAY_DEADLINE" style={{ background: "var(--mf-bg-deep)" }}>Delay Deadline</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>REASON NOTE</label>
              <textarea
                placeholder="Provide additional details..."
                value={reasonNote}
                onChange={e => setReasonNote(e.target.value)}
                disabled={saving}
                required
                rows={3}
                style={{ ...fieldStyle, resize: "vertical" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  padding: "10px 18px", background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10, color: "var(--mf-text)", fontSize: 13, fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer", transition: "border-color 0.15s ease"
                }}
                onMouseEnter={e => !saving && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")}
                onMouseLeave={e => !saving && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "10px 22px", background: "var(--mf-cyan)", border: "none",
                  borderRadius: 10, color: "#000", fontSize: 13, fontWeight: 800,
                  cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
                  boxShadow: "0 0 15px rgba(0,240,255,0.4)", display: "flex", alignItems: "center", gap: 8
                }}
              >
                {saving ? <Loader2 size={15} className="mf-spin" /> : <Save size={15} />}
                {saving ? "Extending..." : "Confirm Extension"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
