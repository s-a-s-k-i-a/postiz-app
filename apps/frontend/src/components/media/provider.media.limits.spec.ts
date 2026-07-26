/** @jest-environment node */

import 'reflect-metadata';

const {
  InstagramProvider,
} = require('@gitroom/nestjs-libraries/integrations/social/instagram.provider');
const {
  FacebookProvider,
} = require('@gitroom/nestjs-libraries/integrations/social/facebook.provider');
const {
  LinkedinProvider,
} = require('@gitroom/nestjs-libraries/integrations/social/linkedin.provider');
const {
  InstagramStandaloneProvider,
} = require('@gitroom/nestjs-libraries/integrations/social/instagram.standalone.provider');

const originalFrontendUrl = process.env.FRONTEND_URL;
const originalBucketUrl = process.env.CLOUDFLARE_BUCKET_URL;

class ExposedInstagramProvider extends InstagramProvider {
  readMediaSize(path: string) {
    return this.getMediaSizeBytes(path);
  }
}

describe('provider media limits', () => {
  beforeEach(() => {
    process.env.FRONTEND_URL = 'https://media.example.test';
    delete process.env.CLOUDFLARE_BUCKET_URL;
  });

  afterAll(() => {
    process.env.FRONTEND_URL = originalFrontendUrl;
    process.env.CLOUDFLARE_BUCKET_URL = originalBucketUrl;
  });

  describe('Instagram', () => {
    it('rejects GIF image posts before scheduling', async () => {
      const provider = new InstagramProvider();

      await expect(
        provider.checkValidity([[{ path: 'uploads/animated.gif' }]], {})
      ).resolves.toBe(
        'Instagram image posts require JPEG files; use an MP4 Reel for animation.'
      );
    });

    it('rejects JPEG images above 8 MiB', async () => {
      const provider = new InstagramProvider();
      (provider as any).getMediaSizeBytes = jest
        .fn()
        .mockResolvedValue(8 * 1024 * 1024 + 1);

      await expect(
        provider.checkValidity([[{ path: 'uploads/photo.jpg' }]], {})
      ).resolves.toBe('Instagram JPEG images must not exceed 8 MiB.');
    });

    it('rejects Reel videos above 300 MiB', async () => {
      const provider = new InstagramProvider();
      (provider as any).getMediaSizeBytes = jest
        .fn()
        .mockResolvedValue(300 * 1024 * 1024 + 1);

      await expect(
        provider.checkValidity([[{ path: 'uploads/reel.mp4' }]], {})
      ).resolves.toBe('Instagram Reel videos must not exceed 300 MiB.');
    });

    it('rejects Story videos above 100 MiB', async () => {
      const provider = new InstagramProvider();
      (provider as any).getMediaSizeBytes = jest
        .fn()
        .mockResolvedValue(100 * 1024 * 1024 + 1);

      await expect(
        provider.checkValidity([[{ path: 'uploads/story.mp4' }]], {
          post_type: 'story',
        })
      ).resolves.toBe('Instagram Story videos must not exceed 100 MiB.');
    });

    it.each([
      ['uploads/photo.jpg', 8 * 1024 * 1024, {}],
      ['uploads/reel.mp4', 300 * 1024 * 1024, {}],
      ['uploads/story.mp4', 100 * 1024 * 1024, { post_type: 'story' }],
    ])(
      'accepts the exact Instagram boundary for %s',
      async (path, size, settings) => {
        const provider = new InstagramProvider();
        (provider as any).getMediaSizeBytes = jest.fn().mockResolvedValue(size);

        await expect(
          provider.checkValidity([[{ path }]], settings)
        ).resolves.toBe(true);
      }
    );

    it('fails closed when Instagram metadata cannot be read', async () => {
      const provider = new InstagramProvider();
      (provider as any).getMediaSizeBytes = jest
        .fn()
        .mockRejectedValue(new Error('metadata unavailable'));

      await expect(
        provider.checkValidity([[{ path: 'uploads/photo.jpg' }]], {})
      ).resolves.toBe(
        'Could not verify the Instagram JPEG file size. Re-upload the media and try again.'
      );
    });

    it('classifies media by the exact URL pathname extension', async () => {
      const provider = new InstagramProvider();
      (provider as any).getMediaSizeBytes = jest
        .fn()
        .mockResolvedValue(8 * 1024 * 1024 + 1);

      await expect(
        provider.checkValidity(
          [
            [
              {
                path: 'https://media.example.test/uploads/photo.jpg?next=.mp4',
              },
            ],
          ],
          {}
        )
      ).resolves.toBe('Instagram JPEG images must not exceed 8 MiB.');
    });

    it('does not accept a query-string .mp4 as a trial Reel video', async () => {
      const provider = new InstagramProvider();
      (provider as any).getMediaSizeBytes = jest.fn().mockResolvedValue(1024);

      await expect(
        provider.checkValidity(
          [
            [
              {
                path: 'https://media.example.test/uploads/photo.jpg?next=.mp4',
              },
            ],
          ],
          { is_trial_reel: true }
        )
      ).resolves.toBe('Trial Reels must be a video');
    });

    it('applies the same media gates to Instagram Standalone', async () => {
      const standalone = new InstagramStandaloneProvider();
      const probe = jest
        .spyOn(InstagramProvider.prototype as any, 'getMediaSizeBytes')
        .mockResolvedValue(8 * 1024 * 1024 + 1);

      try {
        await expect(
          standalone.checkValidity(
            [[{ path: 'https://media.example.test/uploads/photo.jpg' }]],
            {}
          )
        ).resolves.toBe('Instagram JPEG images must not exceed 8 MiB.');
      } finally {
        probe.mockRestore();
      }
    });
  });

  describe('Facebook', () => {
    it('rejects photos and GIFs above 10 MiB', async () => {
      const provider = new FacebookProvider();
      (provider as any).getMediaSizeBytes = jest
        .fn()
        .mockResolvedValue(10 * 1024 * 1024 + 1);

      await expect(
        provider.checkValidity([[{ path: 'uploads/animated.gif' }]], {})
      ).resolves.toBe('Facebook photos and GIFs must not exceed 10 MiB.');
    });

    it('accepts a photo at exactly 10 MiB', async () => {
      const provider = new FacebookProvider();
      (provider as any).getMediaSizeBytes = jest
        .fn()
        .mockResolvedValue(10 * 1024 * 1024);

      await expect(
        provider.checkValidity([[{ path: 'uploads/photo.jpg' }]], {})
      ).resolves.toBe(true);
    });

    it('validates photo and GIF attachments on comments too', async () => {
      const provider = new FacebookProvider();
      (provider as any).getMediaSizeBytes = jest
        .fn()
        .mockResolvedValue(10 * 1024 * 1024 + 1);

      await expect(
        provider.checkValidity(
          [[], [{ path: 'https://media.example.test/comment.gif' }]],
          {}
        )
      ).resolves.toBe('Facebook photos and GIFs must not exceed 10 MiB.');
    });

    it('does not let a query-string .mp4 bypass the photo limit', async () => {
      const provider = new FacebookProvider();
      (provider as any).getMediaSizeBytes = jest
        .fn()
        .mockResolvedValue(10 * 1024 * 1024 + 1);

      await expect(
        provider.checkValidity(
          [[{ path: 'https://media.example.test/photo.jpg?format=.mp4' }]],
          {}
        )
      ).resolves.toBe('Facebook photos and GIFs must not exceed 10 MiB.');
    });
  });

  describe('LinkedIn', () => {
    it('keeps MP4 fail-closed at less than 2 MiB until issue #8 is fixed', async () => {
      const provider = new LinkedinProvider();
      (provider as any).getMediaSizeBytes = jest
        .fn()
        .mockResolvedValue(2 * 1024 * 1024);

      await expect(
        provider.checkValidity([[{ path: 'uploads/video.mp4' }]], {})
      ).resolves.toBe(
        'LinkedIn MP4 files must stay below 2 MiB until multipart upload issue #8 is fixed.'
      );
    });

    it('rejects MP4 files below LinkedIn’s 75 KiB minimum', async () => {
      const provider = new LinkedinProvider();
      (provider as any).getMediaSizeBytes = jest
        .fn()
        .mockResolvedValue(75 * 1024 - 1);

      await expect(
        provider.checkValidity([[{ path: 'uploads/video.mp4' }]], {})
      ).resolves.toBe('LinkedIn MP4 files must be at least 75 KiB.');
    });

    it.each([75 * 1024, 2 * 1024 * 1024 - 1])(
      'accepts a LinkedIn MP4 at the temporary boundary %i bytes',
      async (size) => {
        const provider = new LinkedinProvider();
        (provider as any).getMediaSizeBytes = jest.fn().mockResolvedValue(size);

        await expect(
          provider.checkValidity([[{ path: 'uploads/video.mp4' }]], {})
        ).resolves.toBe(true);
      }
    );

    it('does not classify a query-string .mp4 as LinkedIn video', async () => {
      const provider = new LinkedinProvider();
      const getMediaSizeBytes = jest.fn();
      (provider as any).getMediaSizeBytes = getMediaSizeBytes;

      await expect(
        provider.checkValidity(
          [[{ path: 'https://media.example.test/photo.jpg?download=.mp4' }]],
          {}
        )
      ).resolves.toBe(true);
      expect(getMediaSizeBytes).not.toHaveBeenCalled();
    });
  });

  describe('metadata probe', () => {
    it('fails closed when Content-Length is missing', async () => {
      const provider = new ExposedInstagramProvider();
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
      } as Response);

      try {
        await expect(
          provider.readMediaSize('https://media.example.test/uploads/photo.jpg')
        ).rejects.toThrow('Media metadata is missing a valid Content-Length.');
      } finally {
        fetchMock.mockRestore();
      }
    });

    it.each(['123abc', '1e6', '0x100', '-1', '0', '9007199254740992'])(
      'rejects malformed Content-Length %s',
      async (contentLength) => {
        const provider = new ExposedInstagramProvider();
        const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-length': contentLength }),
        } as Response);

        try {
          await expect(
            provider.readMediaSize(
              'https://media.example.test/uploads/photo.jpg'
            )
          ).rejects.toThrow(
            'Media metadata is missing a valid Content-Length.'
          );
        } finally {
          fetchMock.mockRestore();
        }
      }
    );

    it('uses HEAD, rejects redirects, sets a timeout, and DNS-pins the request', async () => {
      const provider = new ExposedInstagramProvider();
      const fetchMock = jest
        .spyOn(global, 'fetch')
        .mockImplementation(async (_input, init) => {
          expect(init).toMatchObject({ method: 'HEAD', redirect: 'error' });
          expect(init?.signal).toBeInstanceOf(AbortSignal);
          expect((init as any)?.dispatcher).toBeDefined();
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-length': '1024' }),
          } as Response;
        });

      try {
        await expect(
          provider.readMediaSize('https://media.example.test/uploads/photo.jpg')
        ).resolves.toBe(1024);
      } finally {
        fetchMock.mockRestore();
      }
    });

    it('rejects same-origin paths outside the upload directory', async () => {
      const provider = new ExposedInstagramProvider();
      const fetchMock = jest.spyOn(global, 'fetch');

      try {
        await expect(
          provider.readMediaSize('https://media.example.test/admin/stats')
        ).rejects.toThrow('Media URL is outside the configured storage path.');
        expect(fetchMock).not.toHaveBeenCalled();
      } finally {
        fetchMock.mockRestore();
      }
    });

    it('rejects media URLs outside the configured storage origins', async () => {
      const provider = new ExposedInstagramProvider();
      const fetchMock = jest.spyOn(global, 'fetch');

      try {
        await expect(
          provider.readMediaSize('https://attacker.example/photo.jpg')
        ).rejects.toThrow(
          'Media URL is outside the configured storage origins.'
        );
        expect(fetchMock).not.toHaveBeenCalled();
      } finally {
        fetchMock.mockRestore();
      }
    });

    it('rejects HTTP media URLs before making a request', async () => {
      const provider = new ExposedInstagramProvider();
      const fetchMock = jest.spyOn(global, 'fetch');

      try {
        await expect(
          provider.readMediaSize('http://media.example.test/photo.jpg')
        ).rejects.toThrow('Media URL must use HTTPS.');
        expect(fetchMock).not.toHaveBeenCalled();
      } finally {
        fetchMock.mockRestore();
      }
    });
  });
});
