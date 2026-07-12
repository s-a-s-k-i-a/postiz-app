'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { Button } from '@gitroom/react/form/button';
import { Slider } from '@gitroom/react/form/slider';
import { useToaster } from '@gitroom/react/toaster/toaster';

interface NotificationSettings {
  emailDigestIntervalMinutes: number;
  emailFailureNotificationsImmediate: boolean;
  updatedAt?: string;
}

const useNotificationSettings = (enabled: boolean) => {
  const fetch = useFetch();
  return useSWR<NotificationSettings>(
    enabled ? '/admin/notification-settings' : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to load notification settings');
      }
      return response.json();
    },
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
};

export const AdminNotificationSettingsComponent = () => {
  const fetch = useFetch();
  const toaster = useToaster();
  const { user } = useUser();
  const isSuperAdmin = Boolean(user?.isSuperAdmin);
  const { data, error, isLoading, mutate } =
    useNotificationSettings(isSuperAdmin);
  const [digestMinutes, setDigestMinutes] = useState(60);
  const [failuresImmediate, setFailuresImmediate] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setDigestMinutes(data.emailDigestIntervalMinutes);
    setFailuresImmediate(data.emailFailureNotificationsImmediate);
  }, [data]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !Number.isInteger(digestMinutes) ||
      digestMinutes < 1 ||
      digestMinutes > 1440
    ) {
      toaster.show(
        'Digest interval must be a whole number from 1 to 1440 minutes.',
        'warning'
      );
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/admin/notification-settings', {
        method: 'PUT',
        body: JSON.stringify({
          emailDigestIntervalMinutes: digestMinutes,
          emailFailureNotificationsImmediate: failuresImmediate,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save notification settings');
      }
      await mutate(await response.json(), false);
      toaster.show('Notification settings updated.', 'success');
    } catch {
      toaster.show('Could not update notification settings.', 'warning');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return <div className="p-[20px]">Super-admin access is required.</div>;
  }
  if (isLoading) {
    return <div className="p-[20px]">Loading notification settings…</div>;
  }
  if (error) {
    return (
      <div className="p-[20px]">Could not load notification settings.</div>
    );
  }

  return (
    <form onSubmit={save} className="max-w-[720px] flex flex-col gap-[20px]">
      <div>
        <h1 className="text-[24px] font-[600]">Email notification delivery</h1>
        <p className="text-[13px] text-customColor18 mt-[6px]">
          Instance-wide defaults for publishing notification emails. Individual
          users can still opt out of success or failure emails in their
          settings.
        </p>
      </div>

      <div className="border border-newTableBorder rounded-[8px] p-[20px] bg-newBgColorInner flex flex-col gap-[20px]">
        <label className="flex flex-col gap-[8px]">
          <span className="text-[14px] font-[500]">
            Success digest interval
          </span>
          <span className="text-[12px] text-customColor18">
            Start a fixed batching window after the first success notification.
            Additional successes in that window are sent in the same email.
          </span>
          <div className="flex items-center gap-[10px]">
            <input
              type="number"
              min={1}
              max={1440}
              step={1}
              value={digestMinutes}
              onChange={(event) => setDigestMinutes(Number(event.target.value))}
              className="w-[120px] rounded-[6px] border border-newTableBorder bg-newBgColorInner px-[12px] py-[8px]"
              required
            />
            <span className="text-[13px]">minutes (1–1440)</span>
          </div>
        </label>

        <div className="flex items-center justify-between gap-[20px]">
          <div>
            <div className="text-[14px] font-[500]">
              Send failure emails immediately
            </div>
            <div className="text-[12px] text-customColor18 mt-[4px]">
              Bypass the success digest for failed publishes. User-level failure
              email preferences still apply.
            </div>
          </div>
          <Slider
            value={failuresImmediate ? 'on' : 'off'}
            onChange={(value) => setFailuresImmediate(value === 'on')}
            fill={true}
          />
        </div>
      </div>

      <div className="text-[12px] text-customColor18">
        Changes apply to new notifications. A digest window already in progress
        finishes with its previous interval.
      </div>

      <div>
        <Button type="submit" loading={saving}>
          Save notification settings
        </Button>
      </div>
    </form>
  );
};
