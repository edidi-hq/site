/**
 * Browser-framed mockups for each layer of the security stack page.
 * Mirrors the real-UI visual language used on /product/how-it-works and
 * the individual module pages — no decorative illustration, just small,
 * scannable representations of the platform's actual security surface.
 */

import { Check, X, AlertTriangle, ShieldCheck, Clock } from "lucide-react";
import { FEATURED_VOUCHER, abbreviatedName, formatDemoTime, roleLabel } from "./demo-fixtures";


function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-3xs)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--color-text-muted)",
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

/* ── 01. Isolation ──────────────────────────────────────────────── */

export function IsolationMockup() {
  return (
    <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "18px", backgroundColor: "var(--color-bg-light)" }}>
      <Label>DATABASE · EVERY REQUEST</Label>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-xs)",
          lineHeight: 1.65,
          color: "var(--color-text-primary)",
          backgroundColor: "var(--color-navy-primary)",
          borderRadius: "var(--radius-card)",
          padding: "18px",
          overflowX: "auto",
        }}
      >
        <div style={{ color: "var(--color-text-muted)" }}>{"// every request belongs to one organisation"}</div>
        <div style={{ color: "var(--color-border)" }}>
          request <span style={{ color: "var(--color-code-keyword)" }}>for</span>{" "}
          <span style={{ color: "var(--color-gold)" }}>Tenant A</span>
        </div>
        <div style={{ color: "var(--color-border)", paddingLeft: "16px" }}>
          <span style={{ color: "var(--color-code-keyword)" }}>→</span> database checks every row
        </div>
        <div style={{ color: "var(--color-border)", paddingLeft: "16px" }}>
          <span style={{ color: "var(--color-code-keyword)" }}>→</span> returns{" "}
          <span style={{ color: "var(--color-gold)" }}>Tenant A</span> rows only
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
        }}
      >
        <div
          style={{
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>Tenant A</span>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
            182 vouchers · 47 users
          </span>
        </div>
        <div
          style={{
            backgroundColor: "var(--color-white)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>Tenant B</span>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
            94 vouchers · 22 users
          </span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-secondary)",
          backgroundColor: "var(--color-gold-ghost)",
          border: "1px solid var(--color-gold-divider)",
          borderRadius: "var(--radius-md)",
          padding: "10px 12px",
        }}
      >
        <ShieldCheck size={14} color="var(--color-gold)" strokeWidth={2} aria-hidden="true" />
        <span>
          A request that is not tied to an organisation gets no rows back.
        </span>
      </div>
    </div>
  );
}

/* ── 02. Authority ──────────────────────────────────────────────── */

/** The role columns, in order — the header and every row read this one list. */
const ROLE_COLUMNS = [
  { key: "staff", label: "STAFF" },
  { key: "hod", label: "DEPT HEAD" },
  { key: "finance", label: "FINANCE" },
  { key: "md", label: "MD" },
  { key: "admin", label: "ADMIN" },
] as const;

const AUTHORITY_ROWS = [
  { capability: "Raise voucher / PO", staff: true, hod: true, finance: true, md: true, admin: true },
  { capability: "Approve for a department", staff: false, hod: true, finance: false, md: false, admin: false },
  { capability: "Finance review", staff: false, hod: false, finance: true, md: false, admin: false },
  { capability: "MD sanction", staff: false, hod: false, finance: false, md: true, admin: false },
  { capability: "Change a role", staff: false, hod: false, finance: false, md: false, admin: true },
  { capability: "Export audit bundle", staff: false, hod: false, finance: true, md: true, admin: true },
];

export function AuthorityMockup() {
  return (
    <div style={{ padding: "22px", backgroundColor: "var(--color-bg-light)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <Label>PERMISSION MATRIX · EXCERPT</Label>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: "var(--color-text-muted)", letterSpacing: "0.04em" }}>
          Fine-grained permissions · multi-role
        </span>
      </div>
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <div
          className="grid-cols-[minmax(0,1fr)_repeat(5,1.75rem)] gap-x-1 sm:grid-cols-[1.6fr_repeat(5,1fr)] sm:gap-x-1.5"
          style={{
            display: "grid",
            alignItems: "end",
            padding: "10px 14px",
            backgroundColor: "var(--color-bg-light)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: "var(--color-text-muted)", letterSpacing: "0.06em" }}>
            CAPABILITY
          </span>
          {ROLE_COLUMNS.map(({ key, label }) => (
            <span
              key={key}
              // Phones: headings stand on end so five roles fit beside the capability column.
              className="justify-self-center rotate-180 [writing-mode:vertical-rl] sm:rotate-0 sm:[writing-mode:horizontal-tb]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-3xs)",
                color: "var(--color-text-muted)",
                letterSpacing: "0.06em",
                textAlign: "center",
              }}
            >
              {label}
            </span>
          ))}
        </div>
        {AUTHORITY_ROWS.map((row, i) => (
          <div
            key={row.capability}
            className="grid-cols-[minmax(0,1fr)_repeat(5,1.75rem)] gap-x-1 sm:grid-cols-[1.6fr_repeat(5,1fr)] sm:gap-x-1.5"
            style={{
              display: "grid",
                padding: "10px 14px",
              borderTop: i === 0 ? "none" : "1px solid var(--color-bg)",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-primary)" }}>{row.capability}</span>
            {ROLE_COLUMNS.map(({ key }) => (
              <span key={key} style={{ display: "flex", justifyContent: "center" }}>
                {row[key] ? (
                  <Check size={14} style={{ color: "var(--color-success)" }} strokeWidth={2.5} aria-label="allowed" />
                ) : (
                  <X size={14} style={{ color: "var(--color-text-inverse-muted)" }} strokeWidth={2} aria-label="not allowed" />
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-secondary)",
          backgroundColor: "var(--color-gold-ghost)",
          border: "1px solid var(--color-gold-divider)",
          borderRadius: "var(--radius-md)",
          padding: "10px 12px",
          marginTop: "12px",
          lineHeight: 1.55,
        }}
      >
        <AlertTriangle size={14} color="var(--color-gold)" strokeWidth={2} aria-hidden="true" style={{ marginTop: "2px" }} />
        <span>
          <b>Separation of duties</b> — the submitter of a voucher cannot also approve it. Enforced by the system,
          not just hidden on screen.
        </span>
      </div>
    </div>
  );
}

/* ── 03. Session integrity ──────────────────────────────────────── */

export function SessionMockup() {
  return (
    <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "14px", backgroundColor: "var(--color-bg-light)" }}>
      <Label>SESSION REVOCATION · LIVE</Label>
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-card)",
          padding: "16px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "var(--radius-circle)",
                backgroundColor: "var(--color-gold)",
              }}
            />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)" }}>
              Role changed · Amaka Bello
            </span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>14:32:08 UTC</span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            fontSize: "var(--text-xs)",
          }}
        >
          <div style={{ color: "var(--color-text-muted)" }}>
            Previous · <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>Finance</span>
          </div>
          <div style={{ color: "var(--color-text-muted)" }}>
            New · <span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>Dept head</span>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "var(--color-bg-light)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <ShieldCheck size={14} style={{ color: "var(--color-success)" }} strokeWidth={2} aria-hidden="true" />
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-primary)" }}>
            <b>All active sessions ended</b> · signing in again is required
          </span>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-card)",
          padding: "14px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: "var(--color-text-muted)", letterSpacing: "0.06em" }}>
          REVOKED ON
        </span>
        {[
          "Role changed",
          "Account deactivated",
          "Password changed",
          "Access expiry hit",
          "Company-wide sign-out",
        ].map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Check size={12} color="var(--color-gold)" strokeWidth={2.5} aria-hidden="true" />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-body)" }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 04. Audit trail ────────────────────────────────────────────── */

// The featured voucher's own trail, newest first — the same people and times
// every other page shows for it.
const AUDIT_EVENTS = [...FEATURED_VOUCHER.trail].reverse().map((entry) => ({
  time: formatDemoTime(entry.at, { seconds: true }),
  actor: abbreviatedName(entry.person),
  role: roleLabel(entry.person),
  action: entry.label.toLowerCase(),
  entity: FEATURED_VOUCHER.reference,
}));

export function AuditMockup() {
  return (
    <div style={{ padding: "22px", backgroundColor: "var(--color-bg-light)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <Label>AUDIT TRAIL · {FEATURED_VOUCHER.reference}</Label>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: "var(--color-gold-on-light)", letterSpacing: "0.06em" }}>
          TAMPER-EVIDENT
        </span>
      </div>
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        {AUDIT_EVENTS.map((e, i) => (
          <div
            key={e.time}
            style={{
              padding: "14px 16px",
              borderTop: i === 0 ? "none" : "1px solid var(--color-bg)",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>{e.time}</span>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-primary)" }}>
                  {e.actor}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-3xs)",
                    color: "var(--color-gold-on-light)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {e.role}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-2xs)",
                  color: "var(--color-text-primary)",
                  backgroundColor: "var(--color-bg-light)",
                  borderRadius: "var(--radius-xs)",
                  padding: "2px 6px",
                }}
              >
                {e.action}
              </span>
            </div>
            <span style={{ fontSize: "var(--text-2xs)", color: "var(--color-text-muted)" }}>
              {e.entity} · via web
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          fontSize: "var(--text-xs)",
          color: "var(--color-text-secondary)",
          backgroundColor: "var(--color-gold-ghost)",
          border: "1px solid var(--color-gold-divider)",
          borderRadius: "var(--radius-md)",
          padding: "10px 12px",
          marginTop: "12px",
          lineHeight: 1.55,
        }}
      >
        <ShieldCheck size={14} color="var(--color-gold)" strokeWidth={2} aria-hidden="true" style={{ marginTop: "2px" }} />
        <span>
          No one can edit or delete a record, not even our own staff.
        </span>
      </div>
    </div>
  );
}

/* ── 05. Access lifecycle ───────────────────────────────────────── */

export function LifecycleMockup() {
  return (
    <div style={{ padding: "22px", backgroundColor: "var(--color-bg-light)" }}>
      <Label>USER · AUDIT ACCESS</Label>
      <div
        style={{
          backgroundColor: "var(--color-white)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-card)",
          padding: "18px",
          marginTop: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div>
          <div style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--color-text-primary)" }}>
            Temidayo A. · External Auditor
          </div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "2px" }}>
            temidayo@auditfirm.example
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div
            style={{
              backgroundColor: "var(--color-bg-light)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "10px 12px",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: "var(--color-text-muted)", letterSpacing: "0.06em" }}>
              ACCESS GRANTED
            </div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-primary)", marginTop: "4px" }}>
              2026-04-01
            </div>
          </div>
          <div
            style={{
              backgroundColor: "var(--color-gold-tint)",
              border: "1px solid var(--color-gold-divider)",
              borderRadius: "var(--radius-md)",
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-3xs)", color: "var(--color-text-muted)", letterSpacing: "0.06em" }}>
              EXPIRES
            </div>
            <div
              style={{
                fontSize: "var(--text-sm)",
                fontWeight: 500,
                color: "var(--color-text-primary)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Clock size={12} color="var(--color-gold)" strokeWidth={2} aria-hidden="true" />
              2026-05-15 · auto-revoke
            </div>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "var(--color-bg-light)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-3xs)",
              color: "var(--color-text-muted)",
              letterSpacing: "0.06em",
              marginBottom: "6px",
            }}
          >
            PROVISIONED VIA
          </div>
          <div
            style={{
              fontSize: "var(--text-sm)",
              color: "var(--color-text-primary)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            SCIM 2.0 · Okta
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 06. Encryption & infra ─────────────────────────────────────── */

const STACK_LAYERS = [
  { label: "Browser", detail: "Modern TLS · strict browser-side policies" },
  { label: "Edge / app", detail: "Autoscaling compute · secure session cookies" },
  { label: "Database", detail: "Encrypted at rest · daily snapshots" },
  { label: "Sensitive fields", detail: "Encrypted again, with keys per company" },
  { label: "Object storage", detail: "Encrypted · short-lived per-upload delivery URLs" },
];

export function InfraMockup() {
  return (
    <div style={{ padding: "22px", backgroundColor: "var(--color-bg-light)" }}>
      <Label>PLATFORM STACK</Label>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginTop: "12px",
        }}
      >
        {STACK_LAYERS.map((layer) => (
          <div
            key={layer.label}
            style={{
              backgroundColor: "var(--color-white)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-2xs)",
                color: "var(--color-gold-on-light)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                minWidth: "110px",
              }}
            >
              {layer.label}
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-body)", textAlign: "right" }}>
              {layer.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
