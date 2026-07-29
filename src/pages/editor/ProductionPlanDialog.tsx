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
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--mf-border)",
  background: "var(--mf-bg-elevated)",
  color: "var(--mf-text)",
  fontSize: 13,
} as const;

export function ProductionPlanDialog({ projectId, onClose, onSuccess }: ProductionPlanDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default start date is today
  // User input fields
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

    // Validation
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
      // Concatenate Start/End dates into Schedule since Backend doesn't support them directly
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
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, padding: 20, background: "rgba(0,0,0,0.68)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "min(800px, 100%)", maxHeight: "90vh", display: "flex", flexDirection: "column", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border-bright)", borderRadius: 16, boxShadow: "0 24px 70px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--mf-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 900, display: "flex", alignItems: "center", gap: 10 }}>
            <Calendar size={18} color="var(--mf-magenta)" />
            Create Production Plan
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close" style={{ background: "none", border: "none", color: "var(--mf-text-muted)", cursor: saving ? "not-allowed" : "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="editor-minimal-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {error && (
            <div style={{ padding: "12px 16px", borderRadius: 8, color: "var(--mf-magenta)", background: "rgba(255,42,122,0.08)", border: "1px solid rgba(255,42,122,0.25)", fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>
              START DATE
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={saving} style={fieldStyle} required />
            </label>
            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>
              END DATE
              <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} disabled={saving} style={fieldStyle} required />
            </label>
            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>
              DEADLINE
              <input type="date" value={deadline} min={endDate || startDate} onChange={e => setDeadline(e.target.value)} disabled={saving} style={fieldStyle} required />
            </label>
          </div>

          <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>
            PRIORITY
            <select value={priority} onChange={e => setPriority(e.target.value)} disabled={saving} style={fieldStyle}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>

          <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>
            MILESTONES
            <textarea placeholder="List major project milestones..." value={milestones} onChange={e => setMilestones(e.target.value)} disabled={saving} rows={3} style={{ ...fieldStyle, resize: "vertical" }} />
          </label>

          <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>
            CHAPTER TIMELINE
            <textarea placeholder="Timeline for individual chapters..." value={chapterTimeline} onChange={e => setChapterTimeline(e.target.value)} disabled={saving} rows={2} style={{ ...fieldStyle, resize: "vertical" }} />
          </label>
        </form>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--mf-border)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button type="button" onClick={onClose} disabled={saving} style={{ padding: "10px 18px", borderRadius: 8, background: "transparent", color: "var(--mf-text)", border: "1px solid var(--mf-border)", fontWeight: 800, fontSize: 13, cursor: saving ? "not-allowed" : "pointer" }}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving} style={{ padding: "10px 18px", borderRadius: 8, background: "var(--mf-magenta)", color: "#fff", border: "none", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", gap: 8, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={15} className="mf-spin" /> : <Save size={15} />}
            {saving ? "Creating..." : "Create Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
