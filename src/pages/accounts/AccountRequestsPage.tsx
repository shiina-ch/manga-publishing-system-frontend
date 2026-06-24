import { useEffect, useState } from "react";
import { CheckCircle, Clock, Inbox, RefreshCw, Shield, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { RejectAccountDialog } from "../../components/accounts/RejectAccountDialog";
import { AppLayout } from "../../components/layout/AppLayout";
import {
  approveAccountRequest,
  getAccountRequests,
  rejectAccountRequest,
} from "../../services/accountRequestApi";
import { ApiRequestError } from "../../services/adminApi";
import { tokenStorage } from "../../storage/tokenStorage";
import {
  PUBLIC_REQUESTED_ROLE_LABELS,
  type AccountResponse,
} from "../../types/account";

function requestErrorMessage(error: unknown): string {
  if (!(error instanceof ApiRequestError)) return "Unable to process the request. Please try again.";

  switch (error.errorCode) {
    case "ACCESS_DENIED":
      return "You do not have permission to view or process account requests.";
    case "INVALID_ACCOUNT_STATE":
      return "This request has already been processed or is no longer pending.";
    case "NOT_FOUND":
      return "This account request could not be found.";
    case "AUTHENTICATION_REQUIRED":
      return "Your session is invalid. Please sign in again.";
    case "VALIDATION_ERROR":
      return error.message || "The submitted information is invalid.";
    default:
      return "Unable to process the request. Please try again.";
  }
}

export function AccountRequestsPage() {
  const [requests, setRequests] = useState<AccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AccountResponse | null>(null);

  const isManagerOnly = tokenStorage.hasRole("MANAGER") && !tokenStorage.hasRole("ADMIN");

  async function loadRequests() {
    setLoading(true);
    setLoadError(null);
    try {
      setRequests(await getAccountRequests("PENDING"));
    } catch (error: unknown) {
      setLoadError(requestErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    getAccountRequests("PENDING")
      .then((rows) => {
        if (!cancelled) setRequests(rows);
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(requestErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function handleApprove(account: AccountResponse) {
    if (submittingId !== null) return;
    setSubmittingId(account.id);
    try {
      await approveAccountRequest(account.id);
      setRequests((current) => current.filter((request) => request.id !== account.id));
      toast.success(`Approved the account for ${account.firstName} ${account.lastName}.`);
    } catch (error: unknown) {
      toast.error(requestErrorMessage(error));
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleReject(reason: string): Promise<boolean> {
    if (!rejectTarget || submittingId !== null) return false;
    const account = rejectTarget;
    setSubmittingId(account.id);
    try {
      await rejectAccountRequest(account.id, reason);
      setRequests((current) => current.filter((request) => request.id !== account.id));
      toast.success(`Rejected the request from ${account.firstName} ${account.lastName}.`);
      setRejectTarget(null);
      return true;
    } catch (error: unknown) {
      toast.error(requestErrorMessage(error));
      return false;
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <AppLayout role={isManagerOnly ? "manager" : "admin"} activeNav="Account Requests">
      <div style={{ minHeight: "100%", padding: "24px", background: "var(--mf-bg-deep)", color: "var(--mf-text)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, marginBottom: 22 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
              <Shield size={19} color="var(--mf-cyan)" />
              <h1 style={{ margin: 0, fontSize: 25, fontWeight: 900 }}>Account Requests</h1>
            </div>
            <p style={{ margin: 0, color: "var(--mf-text-secondary)", fontSize: 13 }}>
              Review pending public registration requests.
            </p>
            {isManagerOnly && (
              <p style={{ margin: "8px 0 0", color: "var(--mf-orange)", fontSize: 11 }}>
                Manager scope: Mangaka and Assistant requests. The server enforces this scope.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void loadRequests()}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 9, border: "1px solid var(--mf-border-bright)", background: "var(--mf-bg-surface)", color: "var(--mf-text-secondary)", cursor: loading ? "not-allowed" : "pointer" }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {loading && (
          <div style={{ minHeight: 300, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, color: "var(--mf-text-muted)" }}>
            <Clock size={18} /> Loading pending requests...
          </div>
        )}

        {!loading && loadError && (
          <div role="alert" style={{ padding: 18, borderRadius: 12, border: "1px solid rgba(255,42,122,0.3)", background: "var(--mf-magenta-dim)", color: "var(--mf-magenta)" }}>
            {loadError}
          </div>
        )}

        {!loading && !loadError && requests.length === 0 && (
          <div style={{ minHeight: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, border: "1px solid var(--mf-border)", borderRadius: 14, background: "var(--mf-bg-surface)", color: "var(--mf-text-muted)" }}>
            <Inbox size={36} style={{ opacity: 0.55 }} />
            <span>There are no pending account requests.</span>
          </div>
        )}

        {!loading && !loadError && requests.length > 0 && (
          <div style={{ overflowX: "auto", border: "1px solid var(--mf-border)", borderRadius: 14, background: "var(--mf-bg-surface)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ color: "var(--mf-text-muted)", fontSize: 10, letterSpacing: "0.07em", textAlign: "left" }}>
                  {["ID", "FULL NAME", "EMAIL", "PHONE", "REQUESTED ROLE", "STATUS", "ACTIONS"].map((heading) => (
                    <th key={heading} style={{ padding: "13px 15px", borderBottom: "1px solid var(--mf-border)" }}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((account) => {
                  const isSubmitting = submittingId === account.id;
                  const actionsDisabled = submittingId !== null;
                  return (
                    <tr key={account.id} style={{ borderBottom: "1px solid var(--mf-border)", fontSize: 12 }}>
                      <td style={{ padding: 15, color: "var(--mf-text-muted)" }}>#{account.id}</td>
                      <td style={{ padding: 15, fontWeight: 800 }}>{account.firstName} {account.lastName}</td>
                      <td style={{ padding: 15, color: "var(--mf-text-secondary)" }}>{account.email}</td>
                      <td style={{ padding: 15, color: "var(--mf-text-secondary)" }}>{account.phoneNumber}</td>
                      <td style={{ padding: 15, color: "var(--mf-cyan)", fontWeight: 700 }}>
                        {account.requestedRole ? PUBLIC_REQUESTED_ROLE_LABELS[account.requestedRole] : "—"}
                      </td>
                      <td style={{ padding: 15 }}>
                        <span style={{ padding: "3px 8px", borderRadius: 100, background: "rgba(255,140,66,0.14)", color: "var(--mf-orange)", fontWeight: 800 }}>{account.status}</span>
                      </td>
                      <td style={{ padding: 15 }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            disabled={actionsDisabled}
                            onClick={() => void handleApprove(account)}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 11px", border: "none", borderRadius: 8, background: "var(--mf-green)", color: "#07120c", fontWeight: 800, cursor: actionsDisabled ? "not-allowed" : "pointer", opacity: actionsDisabled && !isSubmitting ? 0.5 : 1 }}
                          >
                            <CheckCircle size={13} /> {isSubmitting ? "Processing..." : "Approve"}
                          </button>
                          <button
                            type="button"
                            disabled={actionsDisabled}
                            onClick={() => setRejectTarget(account)}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 11px", border: "1px solid rgba(255,42,122,0.4)", borderRadius: 8, background: "var(--mf-magenta-dim)", color: "var(--mf-magenta)", fontWeight: 800, cursor: actionsDisabled ? "not-allowed" : "pointer", opacity: actionsDisabled ? 0.5 : 1 }}
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RejectAccountDialog
        account={rejectTarget}
        open={rejectTarget !== null}
        submitting={rejectTarget !== null && submittingId === rejectTarget.id}
        onOpenChange={(open) => { if (!open) setRejectTarget(null); }}
        onConfirm={handleReject}
      />
    </AppLayout>
  );
}
