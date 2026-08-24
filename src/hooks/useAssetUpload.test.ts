import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAssetUpload, formatTrailerUrl } from './useAssetUpload';
import { db } from '../lib/db';

vi.mock('../lib/db', () => ({
  db: {
    uploadFile: vi.fn(),
  },
}));

describe('useAssetUpload & formatTrailerUrl Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formatTrailerUrl transforms youtube watch URLs to embed format', () => {
    const watchUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1s';
    expect(formatTrailerUrl(watchUrl)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');

    const shortUrl = 'https://youtu.be/dQw4w9WgXcQ?si=123';
    expect(formatTrailerUrl(shortUrl)).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');

    expect(formatTrailerUrl('')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(formatTrailerUrl('https://example.com/custom-stream.mp4')).toBe(
      'https://example.com/custom-stream.mp4'
    );
  });

  it('processAndUploadAssets returns template cover and formatted trailer for URL inputs', async () => {
    const { result } = renderHook(() => useAssetUpload());

    let res: any;
    await act(async () => {
      res = await result.current.processAndUploadAssets({
        userId: 'user-1',
        ticketId: 'tkt-100',
        coverSource: 'template',
        coverFile: null,
        selectedCover: 'https://example.com/cover.jpg',
        customCover: '',
        videoSource: 'url',
        videoFile: null,
        trailerUrl: 'https://youtu.be/abc1234',
      });
    });

    expect(res.coverUrl).toBe('https://example.com/cover.jpg');
    expect(res.trailerUrl).toBe('https://www.youtube.com/embed/abc1234');
    expect(result.current.isUploading).toBe(false);
  });

  it('processAndUploadAssets uploads files via db.uploadFile when source is file', async () => {
    (db.uploadFile as any).mockResolvedValueOnce('https://cdn.supabase.co/cover-uploaded.jpg');
    (db.uploadFile as any).mockResolvedValueOnce('https://cdn.supabase.co/video-uploaded.mp4');

    const { result } = renderHook(() => useAssetUpload());

    const mockCoverFile = new File(['cover content'], 'cover.png', { type: 'image/png' });
    const mockVideoFile = new File(['video content'], 'trailer.mp4', { type: 'video/mp4' });

    let res: any;
    await act(async () => {
      res = await result.current.processAndUploadAssets({
        userId: 'user-1',
        ticketId: 'tkt-100',
        coverSource: 'file',
        coverFile: mockCoverFile,
        selectedCover: 'https://example.com/cover.jpg',
        customCover: '',
        videoSource: 'file',
        videoFile: mockVideoFile,
        trailerUrl: '',
      });
    });

    expect(db.uploadFile).toHaveBeenCalledTimes(2);
    expect(res.coverUrl).toBe('https://cdn.supabase.co/cover-uploaded.jpg');
    expect(res.trailerUrl).toBe('https://cdn.supabase.co/video-uploaded.mp4');
  });

  it('rejects oversized cover image with descriptive error', async () => {
    const { result } = renderHook(() => useAssetUpload());
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });

    await expect(
      result.current.processAndUploadAssets({
        userId: 'user-1',
        ticketId: 'tkt-100',
        coverSource: 'file',
        coverFile: largeFile,
        selectedCover: '',
        customCover: '',
        videoSource: 'url',
        videoFile: null,
        trailerUrl: '',
      })
    ).rejects.toThrow(/cover image is too large/i);
  });
});
