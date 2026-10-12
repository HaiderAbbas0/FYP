import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AuthShell, { ResultDisc } from "../components/auth/AuthShell";

/**
 * The verification result is decided once, on mount, and stored in state.
 * Previously the success and failure branches were unreachable in practice:
 * `success` was set unconditionally after the simulated request and `error`
 * was never assigned, so the failure card could never render. The outcome is
 * now derived from a single `status` value, and a query-string
 * `?token=invalid` forces the failure branch so the state is demonstrable.
 */
type Status = "checking" | "success" | "failed";

export default function VerifyEmail() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("token");
    if (forced === "invalid") {
      setError("The verification link is invalid or has expired.");
      setStatus("failed");
      return;
    }

    let cancelled = false;
    // Simulate token verification on load
    const verifyToken = async () => {
      await new Promise(r => setTimeout(r, 1500)); // Simulate network
      if (cancelled) return;
      setStatus("success");
    };
    verifyToken();
    return () => { cancelled = true; };
  }, []);

  return (
    <AuthShell title="Verify Email" subtitle="Confirming your identity securely.">
      {status === "checking" && (
        <div className="py-6 text-center" role="status" aria-live="polite">
          <span className="spinner mx-auto mb-4" aria-hidden />
          <div className="text-[15px] font-medium text-[var(--text)]">Verifying link...</div>
          <div className="mt-1 text-[13px] text-[var(--text-3)]">Please wait a moment.</div>
        </div>
      )}

      {status === "success" && (
        <div className="text-center">
          <ResultDisc tone="success" />
          <div className="t-h3 mb-2 text-[var(--text)]">Email Verified</div>
          <div className="mb-6 text-[14px] leading-relaxed text-[var(--text-3)]">
            Your email address has been successfully verified. Your account is now active.
          </div>
          <Link to="/login" className="btn btn-primary w-full justify-center">
            Proceed to Sign In
          </Link>
        </div>
      )}

      {status === "failed" && (
        <div className="text-center">
          <ResultDisc tone="critical" />
          <div className="t-h3 mb-2 text-[var(--text)]">Verification Failed</div>
          <div className="mb-6 text-[14px] leading-relaxed text-[var(--text-3)]">
            {error || "The verification link is invalid or has expired."}
          </div>
          <button type="button" onClick={() => window.location.reload()} className="btn btn-secondary w-full justify-center">
            Try Again
          </button>
        </div>
      )}
    </AuthShell>
  );
}