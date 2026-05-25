// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from 'react';
import {
  MessageSquare, Copy, Send, Shield, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle,
} from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';

// ============================================================================
// FEEDBACK PANEL — SAMPLE TEMPLATE
// ============================================================================
// This is a sample feedback engine, included as a starting point for forks.
// Open Morbital itself does not collect feedback — the operator of this fork
// can wire the "Send Feedback" button to whatever channel they prefer:
//
//   - Your own GitHub Issues repo (window.open of issues/new?title=...&body=...)
//   - A mailto: link to your support email
//   - A POST to your own backend
//   - A third-party form service (Tally, Formspree, Discord webhook, etc.)
//
// To activate the "Send Feedback" button, replace SAMPLE_FEEDBACK_ENDPOINT
// below with your own URL or `mailto:` link. Until you do, the button is
// disabled and only the "Copy to Clipboard" action works (which is always
// safe — nothing leaves the user's device unless they paste it elsewhere).
//
// SECURITY NOTE FOR FORKS
// ------------------------------------------------------------------
// Do NOT use this template to harvest user emails, fingerprint devices,
// inject tracking, or run hidden analytics behind the "feedback" label.
// If you change the privacy notice text shown to users, the implementation
// MUST match what the notice claims. Honest UI is non-negotiable in this
// codebase.
// ============================================================================

const SAMPLE_FEEDBACK_ENDPOINT: string | null = null;
// Example values you can drop in:
//   const SAMPLE_FEEDBACK_ENDPOINT = 'https://github.com/your-org/your-repo/issues/new';
//   const SAMPLE_FEEDBACK_ENDPOINT = 'mailto:support@yoursite.example';
//   const SAMPLE_FEEDBACK_ENDPOINT = 'https://forms.example.com/your-form-id';

const ISSUE_TYPES = [
  'Bug report',
  'Performance issue',
  'UI / display issue',
  'Feature request',
  'Other',
] as const;

const SOURCE_TYPES = [
  'Not applicable',
  'Local file',
  'YouTube',
  'Direct URL',
  'Spotify',
  'Other',
] as const;

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/'))  return `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] ?? ''}`.trim();
  if (ua.includes('Chrome/')) return `Chrome ${ua.match(/Chrome\/([\d.]+)/)?.[1] ?? ''}`.trim();
  if (ua.includes('Firefox/')) return `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1] ?? ''}`.trim();
  if (ua.includes('Safari/') && !ua.includes('Chrome'))
    return `Safari ${ua.match(/Version\/([\d.]+)/)?.[1] ?? ''}`.trim();
  return ua.slice(0, 80);
}

function detectDevice(): string {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
}

function buildReport(
  issueType: string,
  what: string,
  sourceType: string,
  steps: string,
  device: string,
  browser: string,
): string {
  return [
    '**Open Morbital — Feedback Report**',
    '',
    `- Type: ${issueType}`,
    `- Device: ${device}`,
    `- Browser: ${browser}`,
    `- Source type: ${sourceType}`,
    '',
    '**What happened:**',
    what.trim() || '(not provided)',
    '',
    '**Steps to reproduce:**',
    steps.trim() || '(not provided)',
    '',
    '---',
    '*Privacy note: No private file names, passwords, or tokens were included by the app.*',
  ].join('\n');
}

// Decide what to do with the "Send" button at runtime, based on the operator's
// configured endpoint. Plain URLs open in a new tab (issue trackers, forms).
// `mailto:` opens the user's email client. Override this for richer flows
// (HTTP POST to your backend, Discord webhook, etc.).
function buildSendAction(endpoint: string, issueType: string, body: string): () => void {
  if (endpoint.startsWith('mailto:')) {
    return () => {
      const subject = encodeURIComponent(`Open Morbital Feedback — ${issueType}`);
      window.open(`${endpoint}?subject=${subject}&body=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
    };
  }
  // Treat as a URL with title/body query params (GitHub Issues, Linear, Jira, etc.)
  return () => {
    const title = encodeURIComponent(`[${issueType}] ${body.slice(0, 60)}`);
    const sep   = endpoint.includes('?') ? '&' : '?';
    window.open(`${endpoint}${sep}title=${title}&body=${encodeURIComponent(body)}`, '_blank', 'noopener,noreferrer');
  };
}

export function FeedbackPanel() {
  const addToast = usePlayerStore((s) => s.addToast);

  const [open, setOpen]           = useState(false);
  const [issueType, setIssueType] = useState<string>(ISSUE_TYPES[0]);
  const [what, setWhat]           = useState('');
  const [sourceType, setSourceType] = useState<string>(SOURCE_TYPES[0]);
  const [steps, setSteps]         = useState('');
  const [copied, setCopied]       = useState(false);
  const [sendWarning, setSendWarning] = useState(false);

  const device  = detectDevice();
  const browser = detectBrowser();
  const sendEnabled = typeof SAMPLE_FEEDBACK_ENDPOINT === 'string' && (SAMPLE_FEEDBACK_ENDPOINT as string).length > 0;

  async function handleCopy() {
    const text = buildReport(issueType, what, sourceType, steps, device, browser);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      addToast('Feedback copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      addToast('Clipboard not available — copy the text manually', 'error');
    }
  }

  function handleSendConfirm() {
    if (!sendEnabled || !SAMPLE_FEEDBACK_ENDPOINT) return;
    const body = buildReport(issueType, what, sourceType, steps, device, browser);
    buildSendAction(SAMPLE_FEEDBACK_ENDPOINT, issueType, body)();
    setSendWarning(false);
    addToast('Opening feedback destination…', 'success');
  }

  return (
    <div className="sonata-settings-section">
      <div className="sonata-settings-section__title">Feedback</div>

      {/* ── Toggle row ── */}
      <div className="sonata-settings-row">
        <div>
          <div className="sonata-settings-row__label">Send Feedback</div>
          <div className="sonata-settings-row__sub">
            Report a bug or share a suggestion. No files or playback history are uploaded.
          </div>
        </div>
        <button
          className="sonata-btn sonata-btn--ghost sonata-btn--sm sonata-feedback-toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <MessageSquare size={13} />
          {open ? 'Close' : 'Open'}
          {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>

      {open && (
        <div className="sonata-feedback-form">

          {/* Privacy warning */}
          <div className="sonata-feedback-privacy">
            <Shield size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--sonata-cyan)' }} />
            <span>
              <strong>Privacy notice:</strong> Do not include private file names, passwords,
              account tokens, or links to personal cloud storage. This report is assembled
              on your device — nothing is sent automatically.
            </span>
          </div>

          {/* Issue type */}
          <label className="sonata-feedback-label">
            Issue type
            <select
              className="sonata-feedback-select"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
            >
              {ISSUE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>

          {/* What happened */}
          <label className="sonata-feedback-label">
            What happened?
            <textarea
              className="sonata-feedback-textarea"
              placeholder="Describe the issue clearly. Do not include private file names or secrets."
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <span className="sonata-feedback-counter">{what.length}/1000</span>
          </label>

          {/* Source type */}
          <label className="sonata-feedback-label">
            Source type (what were you playing?)
            <select
              className="sonata-feedback-select"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
            >
              {SOURCE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>

          {/* Steps to reproduce */}
          <label className="sonata-feedback-label">
            Steps to reproduce (optional)
            <textarea
              className="sonata-feedback-textarea"
              placeholder={'1. Open library\n2. Tap a track\n3. …'}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={3}
              maxLength={600}
            />
          </label>

          {/* Auto-filled device info */}
          <div className="sonata-feedback-autoinfo">
            <Shield size={11} style={{ flexShrink: 0, color: 'var(--sonata-green)' }} />
            Auto-filled: {device} · {browser} — No file names or playback history included.
          </div>

          {/* Action buttons */}
          <div className="sonata-feedback-actions">
            <button
              className="sonata-btn sonata-btn--ghost sonata-btn--sm"
              onClick={() => void handleCopy()}
              style={copied ? { color: 'var(--sonata-green)', borderColor: 'rgba(82,255,168,0.4)' } : undefined}
            >
              {copied
                ? <><CheckCircle size={13} /> Copied!</>
                : <><Copy size={13} /> Copy to Clipboard</>}
            </button>
            <button
              className="sonata-btn sonata-btn--ghost sonata-btn--sm"
              onClick={() => setSendWarning(true)}
              disabled={!sendEnabled}
              title={sendEnabled ? 'Send to the configured feedback endpoint' : 'Not configured. Set SAMPLE_FEEDBACK_ENDPOINT in FeedbackPanel.tsx to enable.'}
            >
              <Send size={13} /> {sendEnabled ? 'Send Feedback' : 'Send (not configured)'}
            </button>
          </div>

          {!sendEnabled && (
            <div className="sonata-feedback-autoinfo" style={{ opacity: 0.7 }}>
              <Shield size={11} style={{ flexShrink: 0, color: 'var(--sonata-amber)' }} />
              "Send" is disabled because no feedback endpoint is configured. Edit
              <code style={{ margin: '0 4px' }}>src/components/shared/FeedbackPanel.tsx</code>
              and set <code>SAMPLE_FEEDBACK_ENDPOINT</code> to your own URL or
              <code style={{ margin: '0 4px' }}>mailto:</code> link.
            </div>
          )}
        </div>
      )}

      {/* ── Send-confirmation dialog ── */}
      {sendWarning && (
        <div className="sonata-dialog-overlay" onClick={() => setSendWarning(false)}>
          <div
            className="sonata-dialog"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="sonata-fb-warn-title"
            aria-describedby="sonata-fb-warn-msg"
          >
            <div className="sonata-dialog__icon" style={{ color: 'var(--sonata-cyan)' }}>
              <AlertTriangle size={22} />
            </div>

            <h2 className="sonata-dialog__title" id="sonata-fb-warn-title">
              Leaving Open Morbital
            </h2>

            <p className="sonata-dialog__msg" id="sonata-fb-warn-msg">
              This will open the configured feedback destination in a new tab.
              Your report will be prefilled. Before submitting, double-check that
              you have not included private file names, passwords, tokens, or
              personal cloud storage links.
            </p>

            <div className="sonata-dialog__actions">
              <button
                className="sonata-btn sonata-btn--ghost"
                onClick={() => setSendWarning(false)}
              >
                Cancel
              </button>
              <button
                className="sonata-btn sonata-btn--cyan"
                onClick={handleSendConfirm}
              >
                <Send size={13} /> Open
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
