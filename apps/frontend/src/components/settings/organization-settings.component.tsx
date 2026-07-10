'use client';

import React, {
  ChangeEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@gitroom/react/form/button';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import {
  OrganizationWithLogo,
  useOrganizations,
} from '@gitroom/frontend/components/layout/organization.selector';
import { useUppyUploader } from '@gitroom/frontend/components/media/new.uploader';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useSWRConfig } from 'swr';
import clsx from 'clsx';

const getOrganizationLabel = (name?: string) => {
  return name?.split('###')[0]?.trim() || name || 'Organization';
};

const MAX_UPLOAD_SIZE = 1024 * 1024 * 1024; // Mirrors media.component.tsx upload session limit

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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const logoUploader = useUppyUploader({
    allowedFileTypes: 'image/*',
    onUploadSuccess: (uploadedMedia: any) => {
      const uploadedLogo = Array.isArray(uploadedMedia)
        ? uploadedMedia[0]?.path
        : uploadedMedia?.path;
      if (uploadedLogo) {
        setLogo(uploadedLogo);
      }
    },
    onStart: () => setUploadingLogo(true),
    onEnd: () => setUploadingLogo(false),
  });

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

  const openFileDialog = useCallback(() => {
    if (uploadingLogo) {
      return;
    }
    fileInputRef.current?.click();
  }, [uploadingLogo]);

  const uploadLogoFile = useCallback(
    (file?: File) => {
      if (!file || uploadingLogo) {
        return;
      }

      if (!file.type.startsWith('image/')) {
        toaster.show(
          t(
            'organization_logo_image_only',
            'Please select an image file for the logo',
          ),
          'warning',
        );
        return;
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        toaster.show(
          t(
            'upload_size_limit_exceeded',
            'Upload size limit exceeded. Maximum 1 GB per upload session.',
          ),
          'warning',
        );
        return;
      }

      try {
        logoUploader.addFiles([file] as any);
      } catch (error) {
        toaster.show(
          t(
            'organization_logo_upload_failed',
            'Logo upload failed. Please try again.',
          ),
          'warning',
        );
      }
    },
    [logoUploader, toaster, t, uploadingLogo],
  );

  const onLogoInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      uploadLogoFile(event.target.files?.[0]);
      event.target.value = '';
    },
    [uploadLogoFile],
  );

  const onLogoDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingLogo(false);
      uploadLogoFile(event.dataTransfer.files?.[0]);
    },
    [uploadLogoFile],
  );

  const onLogoDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingLogo(true);
  }, []);

  const onLogoDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingLogo(false);
  }, []);

  const onLogoKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openFileDialog();
      }
    },
    [openFileDialog],
  );

  const removeLogo = useCallback(() => {
    setLogo(null);
  }, []);

  useEffect(() => {
    const showUploadError = () => {
      toaster.show(
        t(
          'organization_logo_upload_failed',
          'Logo upload failed. Please try again.',
        ),
        'warning',
      );
    };

    logoUploader.on('upload-error', showUploadError);
    logoUploader.on('error', showUploadError);

    return () => {
      logoUploader.off('upload-error', showUploadError);
      logoUploader.off('error', showUploadError);
    };
  }, [logoUploader, toaster, t]);

  const submit = useCallback(async () => {
    if (!currentOrganization || name.trim().length < 2) {
      toaster.show(
        t(
          'organization_name_min_length',
          'Organization name must be at least 2 characters',
        ),
        'warning',
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
            : org,
        );
      }, false);
      await swr.mutate('organizations');
      toaster.show(
        t('organization_updated', 'Organization updated'),
        'success',
      );
    } finally {
      setSaving(false);
    }
  }, [currentOrganization, fetch, logo, mutate, name, swr, toaster, t]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      submit();
    },
    [submit],
  );

  if (!canManageOrganization || !currentOrganization) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="my-[16px] mt-[16px] bg-sixth border-fifth border rounded-[4px] p-[24px] flex flex-col gap-[24px]"
    >
      <div className="mt-[4px]">{t('organization', 'Organization')}</div>
      <div className="flex flex-col gap-[16px] md:flex-row md:items-start">
        <div className="relative h-[120px] w-[120px] shrink-0">
          <div
            role="button"
            tabIndex={0}
            aria-label={t(
              'organization_logo_dropzone_label',
              'Upload organization logo image',
            )}
            onClick={openFileDialog}
            onKeyDown={onLogoKeyDown}
            onDrop={onLogoDrop}
            onDragOver={onLogoDragOver}
            onDragEnter={onLogoDragOver}
            onDragLeave={onLogoDragLeave}
            className={clsx(
              'group flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-[12px] border-2 border-dashed border-tableBorder bg-third text-center text-[12px] text-newTextColor transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-btnPrimary focus-visible:ring-offset-2 focus-visible:ring-offset-newBgColorInner',
              isDraggingLogo && 'border-btnPrimary',
              uploadingLogo && 'pointer-events-none opacity-70',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onLogoInputChange}
            />
            {logo ? (
              <img
                src={logo}
                alt={t(
                  'organization_logo_preview',
                  'Organization logo preview',
                )}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-[8px] px-[10px]">
                <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-tableBorder text-[18px]">
                  +
                </div>
                <span>
                  {t('drop_logo_here', 'Logo hierher ziehen oder klicken')}
                </span>
              </div>
            )}
            {uploadingLogo && (
              <div className="absolute inset-0 flex items-center justify-center bg-third/80">
                <div className="h-[24px] w-[24px] animate-spin rounded-full border-4 border-white border-t-transparent" />
              </div>
            )}
          </div>
          {logo && !uploadingLogo && (
            <button
              type="button"
              aria-label={t('remove_logo', 'Remove logo')}
              onClick={removeLogo}
              className="absolute right-[-6px] top-[-6px] flex h-[24px] w-[24px] items-center justify-center rounded-full border border-tableBorder bg-newBgColorInner text-[14px] text-newTextColor shadow-md hover:bg-third focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-btnPrimary"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-[16px]">
          <div className="flex flex-col gap-[4px]">
            <div className="text-[14px] text-newTextColor">
              {getOrganizationLabel(currentOrganization.name)}
            </div>
            <div className="text-[12px] text-textColor">
              {t(
                'organization_settings_description',
                'Manage the name and logo shown in the organization switcher.',
              )}
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
        </div>
      </div>
      <div className="flex flex-wrap gap-[12px]">
        <Button type="submit" loading={saving} disabled={uploadingLogo}>
          {t('save', 'Save')}
        </Button>
      </div>
    </form>
  );
};
