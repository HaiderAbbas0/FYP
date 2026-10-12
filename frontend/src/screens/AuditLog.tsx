import React from "react";
import type { Screen } from "../types";
import { useAuth } from "../auth/AuthContext";

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
  
  if (user?.role !== "admin") {
     return (
        <div className="h-full flex items-center justify-center p-6 text-center">
           <div>
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(245,56,56,0.1)", color: "#F53838" }}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                 </svg>
              </div>
              <h2 className="text-[18px] font-bold mb-2">Access Denied</h2>
              <p className="text-[13px] text-[var(--text-3)] max-w-[300px]">
                 The Audit Log is restricted to administrative users.
              </p>
           </div>
        </div>
     );
  }

  return (
    <div className="h-full overflow-y-auto fade-in" style={{ background: "var(--bg)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        
        {/* Header */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: "var(--text)" }}>Audit Log</h1>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-3)" }}>
               Immutable record of system and user actions.
            </p>
          </div>
          <button className="btn btn-secondary btn-sm">Export Log</button>
        </div>
        
        <div className="alert-info text-[13px] mb-6">
           <strong>DEMONSTRATION LOG</strong> — This is an in-memory mock log for the frontend prototype. It is not persistent.
        </div>

        <div className="card overflow-hidden">
           <table className="data-table">
              <thead>
                 <tr>
                    <th>Log ID</th>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Target</th>
                    <th>Status</th>
                 </tr>
              </thead>
              <tbody>
                 {MOCK_AUDIT.map(a => (
                    <tr key={a.id}>
                       <td className="mono">{a.id}</td>
                       <td className="mono">{a.time}</td>
                       <td className="mono">{a.actor}</td>
                       <td className="font-semibold" style={{ color: "var(--text-2)" }}>{a.action}</td>
                       <td className="mono">{a.target}</td>
                       <td>
                          <span className="badge" style={{ background: a.status === "SUCCESS" ? "rgba(28,201,112,0.1)" : "rgba(245,56,56,0.1)", color: a.status === "SUCCESS" ? "#1CC970" : "#F53838" }}>
                             {a.status}
                          </span>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
