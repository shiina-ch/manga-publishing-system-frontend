import { useState } from "react";
import { AlertCircle, FileText, Loader2, Save, X } from "lucide-react";
import { toast } from "react-toastify";
import { createChapter, assignMangakaToProject, type CreateChapterPayload } from "../../services/projectApi";
import { searchAccountByEmail } from "../../services/accountApi";
import { UserPlus } from "lucide-react";

interface CreateChapterDialogProps {
  projectId: number;
  planId: number;
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

export function CreateChapterDialog({ projectId, planId, onClose, onSuccess }: CreateChapterDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [chapterNumber, setChapterNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [targetPageCount, setTargetPageCount] = useState(20);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [publishDate, setPublishDate] = useState("");

  const [mangakaEmail, setMangakaEmail] = useState("");
  const [mangakaId, setMangakaId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setError(null);

    if (!title.trim()) {
      setError("Chapter title is required.");
      return;
    }
    if (!endDate) {
      setError("End Date (deadline) is required.");
      return;
    }
    if (!publishDate) {
      setError("Publish Date is required.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const pub = new Date(publishDate);

    if (end < start) {
      setError("End Date cannot be before Start Date.");
      return;
    }
    if (pub < end) {
      setError("Publish Date cannot be before End Date.");
      return;
    }

    setSaving(true);

    try {
      let finalMangakaId: number | null = null;
      if (mangakaEmail.trim()) {
        const found = await searchAccountByEmail(mangakaEmail.trim());
        if (found && found.id) {
          finalMangakaId = found.id;
        } else {
          setError("No account found with this email. Please check the Mangaka's email.");
          setSaving(false);
          return;
        }
      } else if (mangakaId.trim()) {
        finalMangakaId = Number(mangakaId.trim());
        if (isNaN(finalMangakaId) || finalMangakaId <= 0) {
          setError("Please enter a valid positive Mangaka Account ID.");
          setSaving(false);
          return;
        }
      }

      const payload: CreateChapterPayload = {
        planId,
        chapterNumber,
        title: title.trim(),
        targetPageCount,
        startDate,
        endDate,
        publishDate,
      };

      await createChapter(projectId, payload);

      if (finalMangakaId) {
        try {
          await assignMangakaToProject(projectId, finalMangakaId);
          toast.success("Chapter assigned & Mangaka assigned to Project successfully!");
        } catch (assignErr: any) {
          toast.error("Chapter assigned, but failed to assign Mangaka: " + (assignErr.message || "Unknown error"));
        }
      } else {
        toast.success("Chapter assigned successfully! Default tasks generated.");
      }

      onSuccess();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "message" in err ? String(err.message) : "Failed to create chapter.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, padding: 20, background: "rgba(0,0,0,0.68)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "min(600px, 100%)", maxHeight: "90vh", display: "flex", flexDirection: "column", background: "var(--mf-bg-surface)", border: "1px solid var(--mf-border-bright)", borderRadius: 16, boxShadow: "0 24px 70px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--mf-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 900, display: "flex", alignItems: "center", gap: 10 }}>
            <FileText size={18} color="var(--mf-cyan)" />
            Assign New Chapter
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

          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>
              CH. NUMBER
              <input type="number" min={1} value={chapterNumber} onChange={e => setChapterNumber(parseInt(e.target.value))} disabled={saving} style={fieldStyle} required />
            </label>
            <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>
              CHAPTER TITLE
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} disabled={saving} placeholder="E.g. A New Beginning" style={fieldStyle} required />
            </label>
          </div>

          <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>
            TARGET PAGE COUNT
            <input type="number" min={1} value={targetPageCount} onChange={e => setTargetPageCount(parseInt(e.target.value))} disabled={saving} style={fieldStyle} required />
          </label>

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
              PUBLISH DATE
              <input type="date" value={publishDate} min={endDate || startDate} onChange={e => setPublishDate(e.target.value)} disabled={saving} style={fieldStyle} required />
            </label>
          </div>

          <div style={{ padding: "16px", borderRadius: 8, border: "1px solid var(--mf-border)", background: "var(--mf-bg-surface)", marginTop: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <UserPlus size={16} color="var(--mf-magenta)" /> Assign Mangaka
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>
                MANGAKA EMAIL
                <input type="email" value={mangakaEmail} onChange={e => setMangakaEmail(e.target.value)} disabled={saving || Boolean(mangakaId)} placeholder="Enter Mangaka's email..." style={{ ...fieldStyle, opacity: mangakaId ? 0.55 : 1 }} />
              </label>
              <label style={{ fontSize: 11, fontWeight: 800, color: "var(--mf-text-muted)" }}>
                OR MANGAKA ACCOUNT ID
                <input type="number" min={1} step={1} value={mangakaId} onChange={e => setMangakaId(e.target.value)} disabled={saving || Boolean(mangakaEmail)} placeholder="Enter account ID directly..." style={{ ...fieldStyle, opacity: mangakaEmail ? 0.55 : 1 }} />
              </label>
            </div>
          </div>
        </form>

        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--mf-border)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <button type="button" onClick={onClose} disabled={saving} style={{ padding: "10px 20px", borderRadius: 100, border: "1px solid var(--mf-border)", background: "transparent", color: "var(--mf-text)", fontSize: 13, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer" }}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 100, border: "none", background: "var(--mf-cyan)", color: "#000", fontSize: 13, fontWeight: 900, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 size={16} style={{ animation: "editor-spin 1s linear infinite" }} /> : <Save size={16} />}
            {saving ? "Saving..." : "Assign Chapter"}
          </button>
        </div>
      </div>
    </div>
  );
}
