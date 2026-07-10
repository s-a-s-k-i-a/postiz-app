'use client';

import React, { FC, useCallback, useMemo } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import useSWR from 'swr';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import clsx from 'clsx';

export type OrganizationWithLogo = {
  id: string;
  name: string;
  logo?: string | null;
  users?: Array<{
    disabled?: boolean;
    role?: 'USER' | 'ADMIN' | 'SUPERADMIN';
  }>;
};

const fallbackColors = [
  'bg-btnPrimary',
  'bg-forth',
  'bg-seventh',
  'bg-emerald-700',
  'bg-sky-700',
  'bg-rose-700',
  'bg-amber-700',
  'bg-teal-700',
];

export const useOrganizations = () => {
  const fetch = useFetch();
  const load = useCallback(async () => {
    return (await fetch('/user/organizations')).json();
  }, [fetch]);

  return useSWR<OrganizationWithLogo[]>('organizations', load, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
    revalidateOnReconnect: false,
  });
};

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

const getColor = (name: string) => {
  const hash = getOrganizationLabel(name)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return fallbackColors[hash % fallbackColors.length];
};

export const OrganizationSelector: FC<{ asOpenSelect?: boolean }> = ({
  asOpenSelect,
}) => {
  const fetch = useFetch();
  const user = useUser();
  const { isLoading, data } = useOrganizations();

  const current = useMemo(() => {
    return data?.find((d) => d.id === user?.orgId);
  }, [data, user?.orgId]);

  const withoutCurrent = useMemo(() => {
    return data?.filter((d) => d.id !== user?.orgId);
  }, [data, user?.orgId]);

  const organizations = useMemo(() => {
    return current ? [current, ...(withoutCurrent || [])] : data;
  }, [current, data, withoutCurrent]);

  const changeOrg = useCallback(
    (org: OrganizationWithLogo) => async () => {
      if (org.id === user?.orgId) {
        return;
      }

      await fetch('/user/change-org', {
        method: 'POST',
        body: JSON.stringify({
          id: org.id,
        }),
      });
      window.location.reload();
    },
    [fetch, user?.orgId]
  );

  const handleKeyDown = useCallback(
    (org: OrganizationWithLogo) => (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        changeOrg(org)();
      }
    },
    [changeOrg]
  );

  if (isLoading || (!isLoading && data?.length === 1)) {
    return null;
  }

  if (asOpenSelect) {
    return (
      <div className="hover:text-newTextColor">
        <div className="text-[12px] relative">
          <div className="bg-btnPrimary !flex !relative max-w-[500px] mx-auto py-[12px] px-[12px]">
            Select Organization
          </div>
          {(data?.length || 0) > 1 && (
            <div
              className="py-[12px] px-[12px] z-[200] bg-third border-tableBorder border gap-[12px] cursor-pointer flex-col !flex !relative max-w-[500px] mx-auto mb-[10px]"
              role="menu"
            >
              {organizations?.map((org) => {
                const isActive = org.id === user?.orgId;
                return (
                  <div
                    key={org.id}
                    onClick={changeOrg(org)}
                    className={clsx(isActive ? 'font-bold' : '')}
                    role="menuitem"
                    aria-current={isActive ? 'true' : undefined}
                  >
                    {getOrganizationLabel(org.name)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={clsx(
          'flex items-center max-w-[112px] scroll-smooth',
          (organizations?.length || 0) > 3 &&
            'overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        )}
      >
        <div className="flex items-center py-[2px] pe-[2px]">
          {organizations?.map((org, index) => {
            const isActive = org.id === user?.orgId;
            const label = getOrganizationLabel(org.name);

            return (
              <button
                key={org.id}
                type="button"
                title={label}
                role="button"
                aria-label={`Switch to organization ${label}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={changeOrg(org)}
                onKeyDown={handleKeyDown(org)}
                className={clsx(
                  'relative flex h-[32px] w-[32px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-tableBorder text-[11px] font-bold text-white shadow-md transition-all duration-150 focus-visible:ring-2 focus-visible:ring-btnPrimary',
                  index > 0 && '-ms-2',
                  isActive
                    ? 'opacity-100 grayscale-0 ring-2 ring-btnPrimary ring-offset-2 ring-offset-newBgColorInner'
                    : 'opacity-60 grayscale hover:opacity-90 hover:grayscale-0',
                  !org.logo && getColor(org.name)
                )}
                style={{
                  zIndex: isActive
                    ? (organizations?.length || 0) + 10
                    : (organizations?.length || 0) - index,
                }}
              >
                {org.logo ? (
                  <img
                    src={org.logo}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span>{getInitials(org.name)}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="w-[1px] h-[20px] bg-blockSeparator" />
    </>
  );
};
