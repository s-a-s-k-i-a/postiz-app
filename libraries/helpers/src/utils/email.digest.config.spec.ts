import {
  EMAIL_DIGEST_DEFAULTS,
  emailDigestWorkflowId,
  resolveEmailDigestIntervalMinutes,
  resolveImmediateFailureEmails,
} from './email.digest.config';

describe('resolveEmailDigestIntervalMinutes', () => {
  it('defaults to 60 when unset or empty', () => {
    expect(resolveEmailDigestIntervalMinutes(undefined)).toBe(60);
    expect(resolveEmailDigestIntervalMinutes('')).toBe(60);
    expect(resolveEmailDigestIntervalMinutes('   ')).toBe(60);
  });

  it('accepts valid integers in range', () => {
    expect(resolveEmailDigestIntervalMinutes('1')).toBe(1);
    expect(resolveEmailDigestIntervalMinutes('5')).toBe(5);
    expect(resolveEmailDigestIntervalMinutes(' 15 ')).toBe(15);
    expect(resolveEmailDigestIntervalMinutes('1440')).toBe(1440);
  });

  it('falls back to default for invalid values', () => {
    expect(resolveEmailDigestIntervalMinutes('0')).toBe(60);
    expect(resolveEmailDigestIntervalMinutes('-5')).toBe(60);
    expect(resolveEmailDigestIntervalMinutes('1441')).toBe(60);
    expect(resolveEmailDigestIntervalMinutes('2.5')).toBe(60);
    expect(resolveEmailDigestIntervalMinutes('NaN')).toBe(60);
    expect(resolveEmailDigestIntervalMinutes('Infinity')).toBe(60);
    expect(resolveEmailDigestIntervalMinutes('abc')).toBe(60);
  });
});

describe('resolveImmediateFailureEmails', () => {
  it('is false by default', () => {
    expect(resolveImmediateFailureEmails(undefined)).toBe(false);
    expect(resolveImmediateFailureEmails('')).toBe(false);
  });

  it('is true only for the string true', () => {
    expect(resolveImmediateFailureEmails('true')).toBe(true);
    expect(resolveImmediateFailureEmails('TRUE')).toBe(true);
    expect(resolveImmediateFailureEmails(' true ')).toBe(true);
    expect(resolveImmediateFailureEmails('1')).toBe(false);
    expect(resolveImmediateFailureEmails('yes')).toBe(false);
    expect(resolveImmediateFailureEmails('false')).toBe(false);
  });
});

describe('emailDigestWorkflowId', () => {
  it('keeps the historical id for the default interval', () => {
    expect(
      emailDigestWorkflowId(
        'org1',
        EMAIL_DIGEST_DEFAULTS.DEFAULT_DIGEST_INTERVAL_MINUTES
      )
    ).toBe('digest_email_workflow_org1');
  });

  it('versions the id for non-default intervals', () => {
    expect(emailDigestWorkflowId('org1', 5)).toBe(
      'digest_email_workflow_org1_m5'
    );
    expect(emailDigestWorkflowId('org1', 15)).toBe(
      'digest_email_workflow_org1_m15'
    );
  });
});
