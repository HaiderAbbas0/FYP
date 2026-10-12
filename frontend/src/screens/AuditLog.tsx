import React from "react";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";
import { outcomeTone } from "../components/severity";

interface Props { onNavigate: (s: Screen) => void; }

const MOCK_AUDIT = [
  { id: "A-1029", time: "2024-10-10 14:05:10", actor: "admin@iomt-testbed.local", action: "AUTHORIZE_RESPONSE", target: "Gateway-01", status: "SUCCESS" },
  { id: "A-1028", time: "2024-10-10 14:02:40", actor: "system", action: "CREATE_INCIDENT", target: "INC-104", status: "SUCCESS" },
  { id: "A-1027", time: "2024-10-10 10:15:00", actor: "analyst1@iomt-testbed.local", action: "ACKNOWLEDGE_INCIDENT", target: "INC-103", status: "SUCCESS" },
  { id: "A-1026", time: "2024-10-09 16:30:12", actor: "system", action: "UPDATE_BASELINE", target: "Infusion-Pump-A", status: "SUCCESS" },
  { id: "A-1025", time: "2024-10-09 09:12:05", actor: "admin@iomt-testbed.local", action: "USER_LOGIN", target: "Session", status: "SUCCESS" },
];

export default function AuditLog({ onNavigate }: Props) {
  const { user } = useAuth();

  // Mirrors the route guard in App.tsx. The backend requires the `admin` role
  // for /api/audit; the frontend name for that tier is `super_admin`. Comparing
  // against "admin" matched no role, so this branch rendered for everyone.
  if (user?.role !== "super_admin") {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="card max-w-[380px] p-8">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--critical-bg)", border: "1px solid var(--critical-line)", color: "var(--critical)" }}
            aria-hidden
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3.5" y="11" width="17" height="10.5" rx="2" />
              <path d="M7.5 11V7a4.5 4.5 0 019 0v4" />
            </svg>
          </div>
          <h2 className="text-[17px] font-semibold text-[var(--text)]">Access Denied</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-4)]">
            The Audit Log is restricted to administrative users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Audit Log</h1>
            <p className="page-sub">Immutable record of system and user actions.</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm">Export Log</button>
        </div>

        <div className="alert-info mb-5 flex items-start gap-2.5 text-[13px]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0" aria-hidden>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>
            <strong className="font-semibold">DEMONSTRATION LOG</strong> — This is an in-memory mock log for the frontend prototype. It is not persistent.
          </span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_AUDIT.map((a) => {
                const tone = outcomeTone(a.status);
                return (
                  <tr key={a.id}>
                    <td className="mono text-[12.5px] text-[var(--text-4)]">{a.id}</td>
                    <td className="mono text-[12.5px] text-[var(--text-3)]">{a.time}</td>
                    <td className="mono text-[12.5px] text-[var(--text-3)]">{a.actor}</td>
                    <td className="font-medium text-[var(--text)]">{a.action}</td>
                    <td className="mono text-[12.5px] text-[var(--text-3)]">{a.target}</td>
                    <td className="text-right">
                      <span className="badge" style={{ background: tone.bg, color: tone.text, borderColor: tone.line }}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}