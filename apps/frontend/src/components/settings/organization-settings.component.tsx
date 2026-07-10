'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@gitroom/react/form/button';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import {
  OrganizationWithLogo,
  useOrganizations,
} from '@gitroom/frontend/components/layout/organization.selector';
import { showMediaBox } from '@gitroom/frontend/components/media/media.component';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useSWRConfig } from 'swr';

const getOrganizationLabel = (name?: string) => {
  return name?.split('###')[0]?.trim() || name || 'Organization';
};

const getInitials = (name: string) => {
  const words = getOrganizationLabel(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!words.length) {
    return 'O';
  }

  return words.map((word) => word[0]).join('').toUpperCase();
};

const normalizeMediaValue = (
  values: { id: string; path: string } | { id: string; path: string }[]
) => {
  return Array.isArray(values) ? values[0]?.path : values?.path;
};

export const OrganizationSettingsComponent = () => {
  const user = useUser();
  const fetch = useFetch();
  const toaster = useToaster();
  const t = useT();
  const swr = useSWRConfig();
  const { data, mutate } = useOrganizations();
  const [name, setName] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const currentOrganization = useMemo<OrganizationWithLogo | undefined>(() => {
    return data?.find((org) => org.id === user?.orgId);
  }, [data, user?.orgId]);

  const canManageOrganization =
    user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  useEffect(() => {
    if (!currentOrganization) {
      return;
    }

    setName(getOrganizationLabel(currentOrganization.name));
    setLogo(currentOrganization.logo || null);
  }, [currentOrganization]);

  const openMedia = useCallback(() => {
    showMediaBox((values) => {
      const path = normalizeMediaValue(values as any);
      if (path) {
        setLogo(path);
      }
    }, 'image');
  }, []);

  const removeLogo = useCallback(() => {
    setLogo(null);
  }, []);

  const submit = useCallback(async () => {
    if (!currentOrganization || name.trim().length < 2) {
      toaster.show(
        t('organization_name_min_length', 'Organization name must be at least 2 characters'),
        'warning'
      );
      return;
    }

    setSaving(true);
    try {
      const updatedOrganization = (await (
        await fetch('/settings/organization', {
          method: 'PUT',
          body: JSON.stringify({
            name: name.trim(),
            logo,
          }),
        })
      ).json()) as Pick<OrganizationWithLogo, 'id' | 'name' | 'logo'>;

      await mutate((organizations) => {
        return organizations?.map((org) =>
          org.id === updatedOrganization.id
            ? { ...org, ...updatedOrganization }
            : org
        );
      }, false);
      await swr.mutate('organizations');
      toaster.show(t('organization_updated', 'Organization updated'), 'success');
    } finally {
      setSaving(false);
    }
  }, [currentOrganization, fetch, logo, mutate, name, swr, toaster, t]);

  if (!canManageOrganization || !currentOrganization) {
    return null;
  }

  return (
    <div className="my-[16px] mt-[16px] bg-sixth border-fifth border rounded-[4px] p-[24px] flex flex-col gap-[24px]">
      <div className="mt-[4px]">{t('organization', 'Organization')}</div>
      <div className="flex items-center gap-[16px]">
        <div className="h-[56px] w-[56px] overflow-hidden rounded-full border border-tableBorder bg-btnPrimary flex items-center justify-center text-[16px] font-bold text-white">
          {logo ? (
            <img
              src={logo}
              alt=""
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span>{getInitials(name || currentOrganization.name)}</span>
          )}
        </div>
        <div className="flex flex-col gap-[4px]">
          <div className="text-[14px] text-newTextColor">
            {getOrganizationLabel(currentOrganization.name)}
          </div>
          <div className="text-[12px] text-customColor18">
            {t(
              'organization_settings_description',
              'Manage the name and logo shown in the organization switcher.'
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[8px]">
        <label className="text-[14px]" htmlFor="organization-name">
          {t('organization_name', 'Organization name')}
        </label>
        <input
          id="organization-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="bg-newBgColorInner h-[42px] border-newTableBorder border rounded-[8px] text-textColor placeholder-textColor px-[16px] text-[14px]"
          placeholder={t('organization_name', 'Organization name')}
        />
      </div>
      <div className="flex flex-wrap gap-[12px]">
        <Button onClick={openMedia} secondary={true}>
          {t('upload_logo', 'Upload logo')}
        </Button>
        {logo && (
          <Button onClick={removeLogo} secondary={true}>
            {t('remove_logo', 'Remove logo')}
          </Button>
        )}
        <Button onClick={submit} loading={saving}>
          {t('save', 'Save')}
        </Button>
      </div>
    </div>
  );
};
