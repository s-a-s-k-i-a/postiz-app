const DEFAULT_DIGEST_INTERVAL_MINUTES = 60;
const MIN_DIGEST_INTERVAL_MINUTES = 1;
const MAX_DIGEST_INTERVAL_MINUTES = 1440;

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
