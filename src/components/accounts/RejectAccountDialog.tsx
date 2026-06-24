import { useState, type FormEvent } from "react";
import type { AccountResponse } from "../../types/account";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        style={{
          background: "var(--mf-bg-surface)",
          borderColor: "var(--mf-border-bright)",
          color: "var(--mf-text)",
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reject account request</DialogTitle>
            <DialogDescription style={{ color: "var(--mf-text-secondary)" }}>
              Provide a reason for rejecting the request from <strong style={{ color: "var(--mf-text)" }}>{fullName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div style={{ marginTop: 20 }}>
            <label htmlFor="rejection-reason" style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
              Rejection reason
            </label>
            <Textarea
              id="rejection-reason"
              value={reason}
              maxLength={1000}
              disabled={submitting}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "rejection-reason-error rejection-reason-count" : "rejection-reason-count"}
              onChange={(event) => {
                setReason(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Provide a clear reason so the applicant can understand this decision..."
              style={{ minHeight: 130, background: "var(--mf-bg-elevated)", color: "var(--mf-text)", borderColor: error ? "var(--mf-magenta)" : "var(--mf-border-bright)" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 6, minHeight: 18 }}>
              <span id="rejection-reason-error" role="alert" style={{ color: "var(--mf-magenta)", fontSize: 11 }}>
                {error}
              </span>
              <span id="rejection-reason-count" style={{ color: "var(--mf-text-muted)", fontSize: 11, marginLeft: "auto" }}>
                {reason.length}/1000
              </span>
            </div>
          </div>

          <DialogFooter style={{ marginTop: 20 }}>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleOpenChange(false)}
              style={{ padding: "10px 18px", borderRadius: 9, border: "1px solid var(--mf-border-bright)", background: "transparent", color: "var(--mf-text-secondary)", cursor: submitting ? "not-allowed" : "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "10px 18px", borderRadius: 9, border: "none", background: "var(--mf-magenta)", color: "#fff", fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.65 : 1 }}
            >
              {submitting ? "Rejecting..." : "Confirm rejection"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
