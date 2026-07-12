const DEFAULT_DIGEST_INTERVAL_MINUTES = 60;
const MIN_DIGEST_INTERVAL_MINUTES = 1;
const MAX_DIGEST_INTERVAL_MINUTES = 1440;

export function resolveEmailDigestIntervalMinutes(
  raw: string | undefined = process.env.EMAIL_DIGEST_INTERVAL_MINUTES
): number {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return DEFAULT_DIGEST_INTERVAL_MINUTES;
  }

  const parsed = Number(raw.trim());
  if (
    !Number.isFinite(parsed) ||
    !Number.isInteger(parsed) ||
    parsed < MIN_DIGEST_INTERVAL_MINUTES ||
    parsed > MAX_DIGEST_INTERVAL_MINUTES
  ) {
    return DEFAULT_DIGEST_INTERVAL_MINUTES;
  }

  return parsed;
}

export function resolveImmediateFailureEmails(
  raw: string | undefined = process.env.EMAIL_FAILURE_NOTIFICATIONS_IMMEDIATE
): boolean {
  return typeof raw === 'string' && raw.trim().toLowerCase() === 'true';
}

export function emailDigestWorkflowId(
  organizationId: string,
  intervalMinutes: number
): string {
  const base = `digest_email_workflow_${organizationId}`;
  if (intervalMinutes === DEFAULT_DIGEST_INTERVAL_MINUTES) {
    // Keep the historical id so upgraded instances reuse the existing workflow.
    return base;
  }
  // A changed interval must not silently keep an old running workflow's
  // start arguments (signalWithStart + USE_EXISTING never replaces args).
  return `${base}_m${intervalMinutes}`;
}

export const EMAIL_DIGEST_DEFAULTS = {
  DEFAULT_DIGEST_INTERVAL_MINUTES,
  MIN_DIGEST_INTERVAL_MINUTES,
  MAX_DIGEST_INTERVAL_MINUTES,
} as const;
