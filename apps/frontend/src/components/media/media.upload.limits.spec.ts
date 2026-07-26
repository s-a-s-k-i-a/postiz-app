import {
  MEDIA_UPLOAD_LIMITS,
  UploadSessionTracker,
  getUploadSessionSizeError,
  getUploadLimitForMime,
  getUploadSizeError,
} from '@gitroom/helpers/utils/media.upload.limits';
import {
  CustomFileValidationPipe,
  MEDIA_UPLOAD_MULTER_OPTIONS,
  getMaxSize,
} from '@gitroom/nestjs-libraries/upload/custom.upload.validation';

jest.mock('@uppy/xhr-upload', () => ({
  __esModule: true,
  default: class XHRUpload {},
}));
jest.mock('@uppy/aws-s3', () => ({
  __esModule: true,
  default: class AwsS3Multipart {},
}));
jest.mock('@uppy/transloadit', () => ({
  __esModule: true,
  default: class Transloadit {},
}));

const { getUppyUploadPlugin } = require('@gitroom/react/helpers/uppy.upload');

describe('generic media upload limits', () => {
  it('keeps images and GIFs at 10 MiB', () => {
    expect(getUploadLimitForMime('image/gif')).toBe(10 * 1024 * 1024);
    expect(getUploadLimitForMime('image/jpeg')).toBe(10 * 1024 * 1024);
    expect(getMaxSize('image/png')).toBe(MEDIA_UPLOAD_LIMITS.image);
  });

  it('caps videos and the local upload session at 500 MiB', () => {
    expect(getUploadLimitForMime('video/mp4')).toBe(500 * 1024 * 1024);
    expect(getMaxSize('video/mp4')).toBe(MEDIA_UPLOAD_LIMITS.video);
    expect(MEDIA_UPLOAD_LIMITS.session).toBe(500 * 1024 * 1024);
    expect(MEDIA_UPLOAD_MULTER_OPTIONS).toEqual({
      limits: { fileSize: MEDIA_UPLOAD_LIMITS.video },
    });
  });

  it('rejects cumulative additions above the 500 MiB upload session limit', () => {
    expect(
      getUploadSessionSizeError(MEDIA_UPLOAD_LIMITS.session)
    ).toBeUndefined();
    expect(getUploadSessionSizeError(MEDIA_UPLOAD_LIMITS.session + 1)).toBe(
      'Upload size limit exceeded. Maximum 500 MiB per upload session.'
    );
  });

  it('tracks successful and rejected batches without clearing in-flight uploads', () => {
    const tracker = new UploadSessionTracker();
    const fourHundredMiB = 400 * 1024 * 1024;
    const oneHundredMiB = 100 * 1024 * 1024;

    expect(tracker.tryAdd('completed', fourHundredMiB)).toBeUndefined();
    tracker.markSuccessful('completed');
    tracker.remove('completed');

    expect(tracker.tryAdd('in-flight', oneHundredMiB)).toBeUndefined();
    expect(tracker.tryAdd('rejected', 1)).toBe(
      'Upload size limit exceeded. Maximum 500 MiB per upload session.'
    );
    expect(tracker.totalBytes).toBe(MEDIA_UPLOAD_LIMITS.session);

    tracker.remove('in-flight');
    expect(tracker.totalBytes).toBe(fourHundredMiB);
  });

  it('accepts exact boundaries and rejects one byte above them', () => {
    expect(
      getUploadSizeError('image/gif', MEDIA_UPLOAD_LIMITS.image)
    ).toBeUndefined();
    expect(getUploadSizeError('image/gif', MEDIA_UPLOAD_LIMITS.image + 1)).toBe(
      'Image file is too large. Maximum size allowed is 10 MiB.'
    );
    expect(getUploadSizeError('video/mp4', MEDIA_UPLOAD_LIMITS.video + 1)).toBe(
      'Video file is too large. Maximum size allowed is 500 MiB.'
    );
  });

  it('enforces the image byte boundary in the backend pipe', async () => {
    const pipe = new CustomFileValidationPipe();
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZJbAAAAAASUVORK5CYII=',
      'base64'
    );
    const file = {
      buffer,
      fieldname: 'file',
      originalname: 'pixel.png',
      encoding: '7bit',
      mimetype: 'image/png',
      destination: '',
      filename: 'pixel.png',
      path: '',
      size: MEDIA_UPLOAD_LIMITS.image,
    } as Express.Multer.File;

    await expect(pipe.transform(file)).resolves.toBe(file);
    await expect(
      pipe.transform({ ...file, size: MEDIA_UPLOAD_LIMITS.image + 1 })
    ).rejects.toThrow('File size exceeds the maximum allowed');
  });

  it('serializes local XHR uploads to protect the Multer full-buffer path', () => {
    const { options } = getUppyUploadPlugin(
      'local',
      jest.fn(),
      'https://social.example.test/api'
    );

    expect(options).toMatchObject({
      endpoint: 'https://social.example.test/api/media/upload-server',
      withCredentials: true,
      limit: 1,
    });
  });
});
