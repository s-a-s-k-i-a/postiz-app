import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SettingsPopup } from '@gitroom/frontend/components/layout/settings.component';

const mockFetch = jest.fn();
const mockToastShow = jest.fn();
const mockOrganizationMutate = jest.fn();
const mockSWRMutate = jest.fn();
const mockCloseAll = jest.fn();
const mockUploader = {
  addFiles: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

let mockOrganizations: Array<{
  id: string;
  name: string;
  logo?: string | null;
}>;
let mockOrganizationResponse: {
  ok: boolean;
  json: jest.Mock<Promise<unknown>, []>;
};

jest.mock('@gitroom/helpers/utils/custom.fetch', () => ({
  useFetch: () => mockFetch,
}));

jest.mock('@gitroom/frontend/components/layout/user.context', () => ({
  useUser: () => ({
    orgId: 'org-1',
    role: 'ADMIN',
    tier: {
      current: 'PRO',
      team_members: true,
      webhooks: false,
      autoPost: false,
      public_api: false,
    },
  }),
}));

jest.mock('@gitroom/react/helpers/variable.context', () => ({
  useVariables: () => ({
    isGeneral: true,
  }),
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
}));

jest.mock('@gitroom/frontend/components/layout/new-modal', () => ({
  useModals: () => ({
    closeAll: mockCloseAll,
  }),
}));

jest.mock('@gitroom/react/toaster/toaster', () => ({
  useToaster: () => ({
    show: mockToastShow,
  }),
}));

jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (_key: string, fallback: string) => fallback,
}));

jest.mock('swr', () => ({
  useSWRConfig: () => ({
    mutate: mockSWRMutate,
  }),
}));

jest.mock('@hookform/resolvers/class-validator', () => ({
  classValidatorResolver: () => async (values: unknown) => ({
    values,
    errors: {},
  }),
}));

jest.mock('@gitroom/nestjs-libraries/dtos/users/user.details.dto', () => ({
  UserDetailDto: class UserDetailDto {},
}));

jest.mock('@gitroom/frontend/components/layout/organization.selector', () => ({
  useOrganizations: () => ({
    data: mockOrganizations,
    mutate: mockOrganizationMutate,
  }),
}));

jest.mock('@gitroom/frontend/components/media/new.uploader', () => ({
  useUppyUploader: () => mockUploader,
}));

jest.mock('@gitroom/frontend/components/media/media.component', () => ({
  showMediaBox: jest.fn(),
}));

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => () => null,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) =>
    React.createElement('a', { href, ...props }, children),
}));

jest.mock('@gitroom/frontend/components/settings/teams.component', () => ({
  TeamsComponent: () => null,
}));
jest.mock('@gitroom/frontend/components/layout/logout.component', () => ({
  LogoutComponent: () => null,
}));
jest.mock('@gitroom/frontend/components/public-api/public.component', () => ({
  PublicComponent: () => null,
}));
jest.mock('@gitroom/frontend/components/webhooks/webhooks', () => ({
  Webhooks: () => null,
}));
jest.mock('@gitroom/frontend/components/sets/sets', () => ({
  Sets: () => null,
}));
jest.mock('@gitroom/frontend/components/settings/signatures.component', () => ({
  SignaturesComponent: () => null,
}));
jest.mock('@gitroom/frontend/components/autopost/autopost', () => ({
  Autopost: () => null,
}));
jest.mock(
  '@gitroom/frontend/components/approved-apps/approved-apps.component',
  () => ({
    ApprovedAppsComponent: () => null,
  })
);
jest.mock('@gitroom/frontend/components/launches/launches.component', () => ({
  SVGLine: () => null,
}));
jest.mock(
  '@gitroom/frontend/components/settings/email-notifications.component',
  () => ({
    __esModule: true,
    default: () => null,
  })
);
jest.mock(
  '@gitroom/frontend/components/settings/shortlink-preference.component',
  () => ({
    __esModule: true,
    default: () => null,
  })
);

const renderSettingsPopup = async () => {
  const result = render(<SettingsPopup />);
  await screen.findByLabelText('Organization name');
  return result;
};

const getCallsTo = (path: string) => {
  return mockFetch.mock.calls.filter(([url]) => url === path);
};

describe('OrganizationSettingsComponent inside SettingsPopup', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockOrganizations = [
      {
        id: 'org-1',
        name: 'Acme ### org-1',
        logo: 'https://img.test/logo.png',
      },
    ];
    mockOrganizationResponse = {
      ok: true,
      json: jest.fn(async () => ({
        id: 'org-1',
        name: 'Updated Acme',
        logo: 'https://img.test/logo.png',
      })),
    };
    mockFetch.mockImplementation(async (url: string) => {
      if (url === '/settings/organization') {
        return mockOrganizationResponse;
      }

      if (url === '/user/personal') {
        return {
          ok: true,
          json: jest.fn(async () => ({
            name: 'Profile User',
            bio: '',
            picture: null,
          })),
        };
      }

      return {
        ok: true,
        json: jest.fn(async () => ({})),
      };
    });
    mockToastShow.mockClear();
    mockOrganizationMutate.mockClear();
    mockSWRMutate.mockClear();
    mockCloseAll.mockClear();
    mockUploader.addFiles.mockClear();
    mockUploader.on.mockClear();
    mockUploader.off.mockClear();
  });

  it('does not render a nested native form for organization settings', async () => {
    const { container } = await renderSettingsPopup();

    const forms = Array.from(container.querySelectorAll('form'));

    expect(forms).toHaveLength(1);
    expect(forms.some((form) => form.querySelector('form'))).toBe(false);
  });

  it('saves organization name and logo without submitting the profile form', async () => {
    await renderSettingsPopup();

    fireEvent.change(screen.getByLabelText('Organization name'), {
      target: { value: 'Updated Acme' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(getCallsTo('/settings/organization')).toHaveLength(1);
    });

    const [, requestInit] = getCallsTo('/settings/organization')[0];
    expect(requestInit).toEqual(
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Acme',
          logo: 'https://img.test/logo.png',
        }),
      })
    );
    expect(getCallsTo('/user/personal')).toHaveLength(1);
    expect(
      mockFetch.mock.calls.some(
        ([url, request]) =>
          url === '/user/personal' && request?.method === 'POST'
      )
    ).toBe(false);
    expect(mockCloseAll).not.toHaveBeenCalled();
  });

  it('shows an error and skips cache mutation when organization update fails', async () => {
    mockOrganizationResponse = {
      ok: false,
      json: jest.fn(async () => ({
        error: 'Update failed',
      })),
    };

    await renderSettingsPopup();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(getCallsTo('/settings/organization')).toHaveLength(1);
    });

    expect(mockOrganizationMutate).not.toHaveBeenCalled();
    expect(mockSWRMutate).not.toHaveBeenCalledWith('organizations');
    expect(mockToastShow).toHaveBeenCalledWith(
      'Organization update failed. Please try again.',
      'warning'
    );
    expect(mockToastShow).not.toHaveBeenCalledWith(
      'Organization updated',
      'success'
    );
  });
});
