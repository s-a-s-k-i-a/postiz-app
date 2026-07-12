import {
  EMAIL_DIGEST_DEFAULTS,
  emailDigestWorkflowId,
} from './email.digest.config';

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
