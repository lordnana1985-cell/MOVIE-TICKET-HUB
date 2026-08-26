import { useState, useCallback } from 'react';
import { db } from '../lib/db';

interface UploadOptions {
  userId: string;
  ticketId: string;
  coverSource: 'template' | 'file';
  coverFile: File | null;
  selectedCover: string;
  customCover: string;
  videoSource: 'url' | 'file';
  videoFile: File | null;
  trailerUrl: string;
}

export interface UploadResult {
  coverUrl: string;
  trailerUrl: string;
}

export function formatTrailerUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return 'https://www.youtube.com/embed/dQw4w9WgXcQ';
  }
  if (trimmed.includes('youtube.com/watch?v=')) {
    const id = trimmed.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  if (trimmed.includes('youtu.be/')) {
    const id = trimmed.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  return trimmed;
}

export function useAssetUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  const processAndUploadAssets = useCallback(
    async (options: UploadOptions): Promise<UploadResult> => {
      const {
        userId,
        ticketId,
        coverSource,
        coverFile,
        selectedCover,
        customCover,
        videoSource,
        videoFile,
        trailerUrl,
      } = options;

      setIsUploading(true);
      setUploadStatus('Initializing asset upload...');

      try {
        let finalCoverUrl = customCover.trim() || selectedCover;

        if (coverSource === 'file' && coverFile) {
          if (coverFile.size > 10 * 1024 * 1024) {
            throw new Error(
              `The selected cover image is too large (${(coverFile.size / (1024 * 1024)).toFixed(1)}MB). Please upload an image under 10MB.`
            );
          }
          setUploadStatus('Uploading cover artwork: 0%');
          const ext = coverFile.name.split('.').pop() || 'jpg';
          const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          const cleanPath = `${userId}/covers/${ticketId}/${uuid}.${ext}`;
          finalCoverUrl = await db.uploadFile(
            'producers-assets',
            cleanPath,
            coverFile,
            true,
            (percent) => {
              setUploadStatus(`Uploading cover artwork: ${percent}%`);
            }
          );
        }

        let formattedTrailer = trailerUrl.trim();

        if (videoSource === 'file' && videoFile) {
          if (videoFile.size > 50 * 1024 * 1024) {
            throw new Error(
              `The selected video trailer is too large (${(videoFile.size / (1024 * 1024)).toFixed(1)}MB). Please compress your video or use a YouTube URL instead.`
            );
          }
          setUploadStatus('Uploading trailer video: 0%');
          const ext = videoFile.name.split('.').pop() || 'mp4';
          const uuid = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          const cleanPath = `${userId}/videos/${ticketId}/${uuid}.${ext}`;
          formattedTrailer = await db.uploadFile(
            'producers-assets',
            cleanPath,
            videoFile,
            true,
            (percent) => {
              setUploadStatus(`Uploading trailer video: ${percent}%`);
            }
          );
        } else {
          formattedTrailer = formatTrailerUrl(formattedTrailer);
        }

        return {
          coverUrl: finalCoverUrl,
          trailerUrl: formattedTrailer,
        };
      } finally {
        setIsUploading(false);
        setUploadStatus('');
      }
    },
    []
  );

  return {
    isUploading,
    uploadStatus,
    setUploadStatus,
    processAndUploadAssets,
  };
}
