import React, { useState } from "react";
import { Link } from "react-router-dom";
import Field from "../components/Field";
import AuthShell, { AuthError, PasswordField, ResultDisc, StrengthMeter } from "../components/auth/AuthShell";

export default function AcceptInvitation() {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In a real flow, this email would come from the invitation token in the URL
  const inviteEmail = "new.analyst@iomt-testbed.local";

  const isStrong = pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);
  const matched = confirm.length > 0 && confirm === pass;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !pass || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (pass !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!isStrong) {
      setError("Password does not meet requirements.");
      return;
    }

    setError(null);
    setLoading(true);

    // Mock network request
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSuccess(true);
  }

  return (
    <AuthShell title="Accept Invitation" subtitle="You have been invited to join MediSOC as an Analyst.">
      <form onSubmit={handleSubmit} noValidate>
        <AuthError message={error} />

        {success ? (
          <div className="text-center">
            <ResultDisc tone="success" />
            <div className="t-h3 mb-2 text-[var(--text)]">Account Created</div>
            <div className="mb-5 text-[14px] leading-relaxed text-[var(--text-3)]">
              Your account has been set up successfully. We sent a verification link to your email to verify your identity.
            </div>

            {/* Note for reviewers */}
            <div className="alert-info mb-5 p-3 text-left text-[12px]">
              <strong>Mock Note:</strong> Account creation is simulated. Proceeding will simulate clicking the email verification link.
            </div>

            <Link to="/verify-email" className="btn btn-secondary w-full justify-center">
              Simulate Verification Link →
            </Link>
          </div>
        ) : (
          <>
            {/* Email (Read-only) */}
            <Field label="Email Address" className="mb-4" hint="Provided by the invitation and cannot be changed here.">
              {(p) => (
                <input {...p} type="email" value={inviteEmail} readOnly disabled className={`${p.className} mono opacity-60`} />
              )}
            </Field>

            <Field label="Full Name" className="mb-4">
              {(p) => (
                <input {...p} type="text" value={name} disabled={loading} placeholder="e.g. Dr. Sarah Jenkins"
                  onChange={(e) => setName(e.target.value)} className={`${p.className} disabled:opacity-50`} />
              )}
            </Field>

            <Field label="Create Password" className="mb-4">
              {(p) => (
                <PasswordField
                  fieldProps={p}
                  value={pass}
                  onChange={setPass}
                  show={showPass}
                  onToggle={() => setShowPass(!showPass)}
                  disabled={loading}
                />
              )}
            </Field>

            <div className="mb-4">
              <StrengthMeter value={pass} />
            </div>

            <Field label="Confirm Password" className="mb-6" error={confirm.length > 0 && !matched ? "Passwords do not match" : null}>
              {(p) => (
                <PasswordField
                  fieldProps={p}
                  value={confirm}
                  onChange={setConfirm}
                  show={showPass}
                  onToggle={() => setShowPass(!showPass)}
                  placeholder="Re-enter new password"
                  disabled={loading}
                  onValidMatch={matched}
                />
              )}
            </Field>

            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </>
        )}
      </form>
    </AuthShell>
  );
}