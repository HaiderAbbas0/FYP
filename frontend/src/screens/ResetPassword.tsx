import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Field from "../components/Field";
import AuthShell, { AuthError, PasswordField, ResultDisc, StrengthMeter } from "../components/auth/AuthShell";

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple password strength check
  const isStrong = pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass);
  const matched = confirm.length > 0 && confirm === pass;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pass || !confirm) {
      setError("Please fill in both fields.");
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

    const result = await resetPassword(pass);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Reset failed.");
      return;
    }

    setSuccess(true);
  }

  return (
    <AuthShell title="Set New Password" subtitle="Enter a new secure password for your account.">
      <form onSubmit={handleSubmit} noValidate>
        <AuthError message={error} />

        {success ? (
          <div className="text-center">
            <ResultDisc tone="success" />
            <div className="t-h3 mb-2 text-[var(--text)]">Password Updated</div>
            <div className="mb-3 text-[14px] leading-relaxed text-[var(--text-3)]">
              Your password has been successfully reset. You can now use it to sign in.
            </div>

            {/* Note for reviewers */}
            <div className="alert-info mb-5 p-3 text-left text-[12px]">
              <strong>Mock Note:</strong> The Admin account password was updated in-memory for this session. Refreshing the browser resets the demo.
            </div>

            <Link to="/login" className="btn btn-primary w-full justify-center">
              Proceed to Sign In
            </Link>
          </div>
        ) : (
          <>
            <Field label="New Password" className="mb-4">
              {(p) => (
                <PasswordField
                  fieldProps={p}
                  value={pass}
                  onChange={setPass}
                  show={showPass}
                  onToggle={() => setShowPass(!showPass)}
                  placeholder="Enter a new password"
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
              {loading ? "Saving..." : "Update Password"}
            </button>
          </>
        )}
      </form>
    </AuthShell>
  );
}