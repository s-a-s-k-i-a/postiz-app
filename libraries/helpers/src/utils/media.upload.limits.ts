export const MIB = 1024 * 1024;

export const MEDIA_UPLOAD_LIMITS = Object.freeze({
  image: 10 * MIB,
  video: 500 * MIB,
  session: 500 * MIB,
  facebookPhoto: 10 * MIB,
  instagramImage: 8 * MIB,
  instagramReel: 300 * MIB,
  instagramStoryVideo: 100 * MIB,
  linkedinVideo: 500 * MIB,
  linkedinVideoTemporary: 2 * MIB - 1,
  linkedinVideoMinimum: 75 * 1024,
});

export function getUploadLimitForMime(mimeType: string): number {
  if (mimeType.startsWith('image/')) {
    return MEDIA_UPLOAD_LIMITS.image;
  }
  if (mimeType.startsWith('video/')) {
    return MEDIA_UPLOAD_LIMITS.video;
  }
  throw new Error('Unsupported file type.');
}

export function getUploadSizeError(
  mimeType: string,
  size: number
): string | undefined {
  if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
    return undefined;
  }
  const limit = getUploadLimitForMime(mimeType);
  if (size <= limit) {
    return undefined;
  }
  const mediaType = mimeType.startsWith('image/') ? 'Image' : 'Video';
  return `${mediaType} file is too large. Maximum size allowed is ${
    limit / MIB
  } MiB.`;
}

export function getUploadSessionSizeError(
  totalSize: number
): string | undefined {
  if (totalSize <= MEDIA_UPLOAD_LIMITS.session) {
    return undefined;
  }
  return 'Upload size limit exceeded. Maximum 500 MiB per upload session.';
}

export class UploadSessionTracker {
  private readonly trackedFiles = new Map<string, number>();
  private readonly successfulFiles = new Set<string>();
  private bytes = 0;

  get totalBytes(): number {
    return this.bytes;
  }

  tryAdd(fileId: string, size: number): string | undefined {
    const sizeError = getUploadSessionSizeError(this.bytes + size);
    if (sizeError) {
      return sizeError;
    }
    this.trackedFiles.set(fileId, size);
    this.bytes += size;
    return undefined;
  }

  markSuccessful(fileId: string): void {
    if (this.trackedFiles.has(fileId)) {
      this.successfulFiles.add(fileId);
    }
  }

  remove(fileId: string): void {
    const size = this.trackedFiles.get(fileId);
    if (size === undefined) {
      return;
    }
    if (!this.successfulFiles.has(fileId)) {
      this.bytes -= size;
    }
    this.trackedFiles.delete(fileId);
    this.successfulFiles.delete(fileId);
  }
}

export function hasMediaExtension(
  path: string | undefined | null,
  extension: string
): boolean {
  if (!path) {
    return false;
  }
  try {
    const pathname = new URL(path, 'https://postiz.invalid').pathname;
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    return pathname.toLowerCase().endsWith(ext.toLowerCase());
  } catch {
    return false;
  }
}
