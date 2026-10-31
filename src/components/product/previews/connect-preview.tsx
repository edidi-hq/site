/**
 * ConnectPreview — browser-frame for /product/connect. Shows API keys and
 * webhook subscriptions, matching the real integration panel.
 */

import type { ReactNode } from "react";
import { PreviewBody, PreviewList, Tag } from "./preview-primitives";

const API_KEYS = [
  {
    name: "Accounting sync (prod)",
    status: "Active",
    background: "var(--color-success-wash)",
    colour: "var(--color-success)",
    used: "2m ago",
  },
  {
    name: "Data warehouse export",
    status: "Active",
    background: "var(--color-success-wash)",
    colour: "var(--color-success)",
    used: "18m ago",
  },
  {
    name: "Legacy bridge",
    status: "Revoked",
    background: "rgba(var(--color-text-subtle-rgb), 0.12)",
    colour: "var(--color-text-muted)",
    used: "Never",
  },
] as const;

const WEBHOOKS = [
  { event: "document.sanctioned", endpoint: "hooks.finance.acme.ng/approvals", success: "127 / 127" },
  { event: "document.bank_ready", endpoint: "erp.acme.ng/webhooks/approvals", success: "84 / 84" },
  { event: "user.role_changed", endpoint: "hris.acme.ng/sync", success: "12 / 12" },
] as const;

/** A section title with its "+ New …" link on the right. */
function SectionTitle({ title, action }: { title: string; action: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
      <h4
        style={{
          fontSize: "var(--text-xs)",
          fontWeight: 500,
          color: "var(--color-text-muted)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {title}
      </h4>
      <span style={{ fontSize: "var(--text-2xs)", fontWeight: 500, color: "var(--color-text-primary)" }}>{action}</span>
    </div>
  );
}

export function ConnectPreview() {
  return (
    <PreviewBody>
      <div style={{ marginBottom: "14px" }}>
        <SectionTitle title="API keys" action="+ New key" />
        <PreviewList
          rows={API_KEYS.map((apiKey) => ({
            key: apiKey.name,
            content: (
              <>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-2xs)",
                    color: "var(--color-text-muted)",
                    width: "84px",
                    flexShrink: 0,
                  }}
                >
                  av_***_ak4f
                </span>
                <span
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {apiKey.name}
                </span>
                <Tag background={apiKey.background} color={apiKey.colour}>
                  {apiKey.status}
                </Tag>
                <span
                  style={{
                    fontSize: "var(--text-2xs)",
                    color: "var(--color-text-muted)",
                    minWidth: "64px",
                    textAlign: "right",
                  }}
                >
                  {apiKey.used}
                </span>
              </>
            ),
          }))}
        />
      </div>

      <div>
        <SectionTitle title="Webhooks" action="+ New webhook" />
        <PreviewList
          rows={WEBHOOKS.map((webhook) => ({
            key: webhook.event,
            content: (
              <>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-2xs)",
                    color: "var(--color-text-primary)",
                    fontWeight: 500,
                    minWidth: "140px",
                  }}
                >
                  {webhook.event}
                </span>
                <span
                  style={{
                    fontSize: "var(--text-2xs)",
                    color: "var(--color-text-muted)",
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {webhook.endpoint}
                </span>
                <span
                  style={{
                    fontFeatureSettings: '"tnum" 1',
                    fontSize: "var(--text-2xs)",
                    color: "var(--color-success)",
                    fontWeight: 500,
                  }}
                >
                  {webhook.success}
                </span>
              </>
            ),
          }))}
        />
      </div>
    </PreviewBody>
  );
}
