import React, { useState } from "react";
import { Link } from "react-router-dom";
import Field from "../components/Field";
import AuthShell, { AuthError, ResultDisc } from "../components/auth/AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setError(null);
    setLoading(true);

    // Mock network request
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);

    // In a mock environment, any email gives a success message to prevent user enumeration
    setSuccess(true);
  }

  return (
    <AuthShell title="Recover Password" subtitle="Enter your email to receive reset instructions.">
      <form onSubmit={handleSubmit} noValidate>
        <AuthError message={error} />

        {success ? (
          <div className="text-center">
            <ResultDisc tone="success" />
            <div className="t-h3 mb-2 text-[var(--text)]">Check your email</div>
            <div className="mb-5 text-[14px] leading-relaxed text-[var(--text-3)]">
              If an account exists for <strong className="text-[var(--text)]">{email}</strong>, we have sent password reset instructions.
            </div>

            {/* Note for reviewers */}
            <div className="alert-info mb-5 p-3 text-left text-[12px]">
              <strong>Mock Note:</strong> No email was actually sent. Click below to continue the simulated flow.
            </div>

            <Link to="/reset-password" className="btn btn-secondary w-full justify-center">
              Simulate Email Link →
            </Link>
          </div>
        ) : (
          <>
            <Field label="Email Address" className="mb-6">
              {(p) => (
                <input {...p} type="email" value={email} disabled={loading} placeholder="admin@iomt-testbed.local"
                  onChange={(e) => setEmail(e.target.value)} className={`${p.className} mono disabled:opacity-50`} />
              )}
            </Field>

            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="mt-5 text-center">
              <Link to="/login" className="text-[13px] font-medium text-[var(--text-3)] transition-colors hover:text-[var(--lime)]">
                ← Back to Sign In
              </Link>
            </div>
          </>
        )}
      </form>
    </AuthShell>
  );
}