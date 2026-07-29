import { useState } from "react";
import { AlertCircle, FileText, Loader2, Save, X } from "lucide-react";
import { toast } from "react-toastify";
import { createChapter, updateChapter, assignMangakaToProject, assignChapterToMangaka, type CreateChapterPayload } from "../../services/projectApi";
import { searchAccountByEmail } from "../../services/accountApi";
import { UserPlus } from "lucide-react";

interface CreateChapterDialogProps {
  projectId: number;
  planId: number;
  chapterId?: number | null;
  initialTitle?: string;
  initialMangakaId?: number | null;
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

export function CreateChapterDialog({ projectId, planId, chapterId, initialTitle, initialMangakaId, onClose, onSuccess }: CreateChapterDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [chapterNumber, setChapterNumber] = useState(1);
  const [title, setTitle] = useState(initialTitle || "");
  const [targetPageCount, setTargetPageCount] = useState(20);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [publishDate, setPublishDate] = useState("");

  const [mangakaEmail, setMangakaEmail] = useState("");
  const [mangakaId, setMangakaId] = useState(initialMangakaId ? String(initialMangakaId) : "");

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

    if (end <= start) {
      setError("End Date (Deadline) must be strictly after Start Date.");
      return;
    }
    const twoDaysAfterEnd = new Date(end.getTime() + 2 * 24 * 60 * 60 * 1000);
    if (pub < twoDaysAfterEnd) {
      setError("Publish Date must be at least 2 days after Deadline.");
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

      let savedChapterId: number | null = chapterId || null;
      if (chapterId) {
        const updated = await updateChapter(chapterId, payload);
        if (updated && updated.id) savedChapterId = updated.id;
      } else {
        const created = await createChapter(projectId, payload);
        if (created && created.id) savedChapterId = created.id;
      }

      if (finalMangakaId) {
        try {
          await assignMangakaToProject(projectId, finalMangakaId);
          if (savedChapterId) {
            await assignChapterToMangaka(savedChapterId, finalMangakaId);
          }
          try {
             const cachedStr = localStorage.getItem("project_mangaka_assignments") || "{}";
             const cached = JSON.parse(cachedStr);
             cached[projectId] = { 
               id: finalMangakaId, 
               name: mangakaEmail || `Mangaka #${finalMangakaId}`,
               status: "MANGAKA_ASSIGNED",
               deadline: payload.endDate,
               chapterId: savedChapterId
             };
             localStorage.setItem("project_mangaka_assignments", JSON.stringify(cached));
          } catch (e) {}
          toast.success(chapterId ? "Chapter updated successfully!" : "Chapter assigned & Mangaka assigned to Project successfully!");
        } catch (assignErr: any) {
          toast.error("Chapter saved, but failed to assign Mangaka: " + (assignErr.message || "Unknown error"));
        }
      } else {
        toast.success(chapterId ? "Chapter updated successfully!" : "Chapter assigned successfully! Default tasks generated.");
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
              <FileText size={20} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>
                {chapterId ? "Update Assigned Chapter" : "Assign New Chapter"}
              </div>
              <div style={{ fontSize: 12, color: "var(--mf-text-muted)", marginTop: 4 }}>
                Setup chapter details and assign mangaka
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
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 16 }}>
              <div>
                <label style={labelStyle}>CH. NUMBER</label>
                <input
                  type="number"
                  min={1}
                  value={chapterNumber}
                  onChange={e => setChapterNumber(parseInt(e.target.value))}
                  disabled={saving}
                  style={fieldStyle}
                  required
                  onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
              <div>
                <label style={labelStyle}>CHAPTER TITLE</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={saving}
                  placeholder="E.g. A New Beginning"
                  style={fieldStyle}
                  required
                  onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>TARGET PAGE COUNT</label>
              <input
                type="number"
                min={1}
                value={targetPageCount}
                onChange={e => setTargetPageCount(parseInt(e.target.value))}
                disabled={saving}
                style={fieldStyle}
                required
                onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

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
                <label style={labelStyle}>PUBLISH DATE</label>
                <input
                  type="date"
                  value={publishDate}
                  min={endDate || startDate}
                  onChange={e => setPublishDate(e.target.value)}
                  disabled={saving}
                  style={fieldStyle}
                  required
                  onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              </div>
            </div>

            <div style={{
              padding: "20px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.01)",
              border: "1px dashed rgba(255,255,255,0.15)",
              marginTop: 4
            }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--mf-cyan)" }}>
                <UserPlus size={16} color="var(--mf-cyan)" /> Assign Mangaka
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>MANGAKA EMAIL</label>
                  <input
                    type="email"
                    value={mangakaEmail}
                    onChange={e => setMangakaEmail(e.target.value)}
                    disabled={saving || Boolean(mangakaId)}
                    placeholder="Enter Mangaka's email..."
                    style={{ ...fieldStyle, opacity: mangakaId ? 0.55 : 1 }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                    onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
                <div>
                  <label style={labelStyle}>OR MANGAKA ACCOUNT ID</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={mangakaId}
                    onChange={e => setMangakaId(e.target.value)}
                    disabled={saving || Boolean(mangakaEmail)}
                    placeholder="Enter account ID directly..."
                    style={{ ...fieldStyle, opacity: mangakaEmail ? 0.55 : 1 }}
                    onFocus={e => e.currentTarget.style.borderColor = "var(--mf-cyan)"}
                    onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                  />
                </div>
              </div>
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
                {saving ? "Saving..." : "Assign Chapter"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
