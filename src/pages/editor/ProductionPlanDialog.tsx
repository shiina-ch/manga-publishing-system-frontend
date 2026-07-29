import { useState } from "react";
import { AlertCircle, Calendar, Loader2, Save, X, UserPlus } from "lucide-react";
import { toast } from "react-toastify";
import { createProductionPlan, type ProductionPlanPayload } from "../../services/projectApi";

interface ProductionPlanDialogProps {
  projectId: number;
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

export function ProductionPlanDialog({ projectId, onClose, onSuccess }: ProductionPlanDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [milestones, setMilestones] = useState("");
  const [chapterTimeline, setChapterTimeline] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setError(null);

    if (!endDate) {
      setError("End Date is required.");
      return;
    }
    if (!deadline) {
      setError("Deadline is required.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dl = new Date(deadline);

    if (end < start) {
      setError("End Date cannot be before Start Date.");
      return;
    }
    if (dl < end) {
      setError("Deadline cannot be before End Date.");
      return;
    }

    setSaving(true);

    try {
      const packedSchedule = `[TIMELINE]\nStart Date: ${startDate}\nEnd Date: ${endDate}`;

      const payload: ProductionPlanPayload = {
        deadline: new Date(`${deadline}T23:59:59Z`).toISOString(),
        priority: priority,
        milestones: milestones.trim() || undefined,
        schedule: packedSchedule,
        chapterTimeline: chapterTimeline.trim() || undefined,
      };

      await createProductionPlan(projectId, payload);
      toast.success("Production plan created successfully!");
      onSuccess();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to create production plan.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100,
    }}>
      <div style={{
        background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border)",
        borderRadius: 16, width: "100%", maxWidth: 600, boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column"
      }}>
        {/* Header Section */}
        <div style={{
          padding: "24px 32px 18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.01)",
          flexShrink: 0
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
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>Create Production Plan</div>
              <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>
                Set schedule and milestones for the project
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 10,
              cursor: "pointer",
              color: "var(--mf-text-muted)",
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
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
              padding: "12px 16px",
              background: "rgba(255,42,109,0.1)",
              border: "1px solid rgba(255,42,109,0.3)",
              color: "var(--mf-magenta)",
              borderRadius: 10,
              fontSize: 13,
              marginBottom: 20,
              fontWeight: 700
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>START DATE</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  disabled={saving}
                  style={fieldStyle}
                  required
                  onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
              <div>
                <label style={labelStyle}>END DATE</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                  disabled={saving}
                  style={fieldStyle}
                  required
                  onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
              <div>
                <label style={labelStyle}>DEADLINE</label>
                <input
                  type="date"
                  value={deadline}
                  min={endDate || startDate}
                  onChange={e => setDeadline(e.target.value)}
                  disabled={saving}
                  style={fieldStyle}
                  required
                  onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>PRIORITY</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                disabled={saving}
                style={fieldStyle}
                onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              >
                <option value="High" style={{ background: "var(--mf-bg-deep)" }}>High</option>
                <option value="Medium" style={{ background: "var(--mf-bg-deep)" }}>Medium</option>
                <option value="Low" style={{ background: "var(--mf-bg-deep)" }}>Low</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>MILESTONES</label>
              <textarea
                placeholder="List major project milestones..."
                value={milestones}
                onChange={e => setMilestones(e.target.value)}
                disabled={saving}
                rows={3}
                style={{ ...fieldStyle, resize: "vertical" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            <div>
              <label style={labelStyle}>CHAPTER TIMELINE</label>
              <textarea
                placeholder="Timeline for individual chapters..."
                value={chapterTimeline}
                onChange={e => setChapterTimeline(e.target.value)}
                disabled={saving}
                rows={2}
                style={{ ...fieldStyle, resize: "vertical" }}
                onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            {/* Form Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{
                  padding: "10px 18px",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: "var(--mf-text)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "border-color 0.15s ease"
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
                  padding: "10px 22px",
                  background: "var(--mf-cyan)",
                  border: "none",
                  borderRadius: 10,
                  color: "#000",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                  boxShadow: "0 0 15px rgba(0,240,255,0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                {saving ? <Loader2 size={15} className="mf-spin" /> : <Save size={15} />}
                {saving ? "Creating..." : "Create Plan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
