import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '../lib/logger';

export interface UseCameraScannerOptions {
  enabled?: boolean;
  onCameraError?: (error: string) => void;
}

export interface UseCameraScannerResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  cameraStream: MediaStream | null;
  cameraError: string | null;
  isCapturing: boolean;
  scanStatus: string;
  setSelectedDeviceId: (deviceId: string) => void;
  setIsCapturing: (capturing: boolean) => void;
  setScanStatus: (status: string) => void;
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => void;
  switchCamera: (deviceId: string) => Promise<void>;
  refreshDevices: () => Promise<void>;
}

export function useCameraScanner(options: UseCameraScannerOptions = {}): UseCameraScannerResult {
  const { enabled = false, onCameraError } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');

  const stopTracks = useCallback((stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === 'videoinput');
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        const backCam = videoInputs.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('rear')
        );
        setSelectedDeviceId(backCam ? backCam.deviceId : videoInputs[0].deviceId);
      }
    } catch (err: unknown) {
      logger.error('Error enumerating cameras', 'useCameraScanner', err);
    }
  }, [selectedDeviceId]);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      stopTracks(cameraStream);
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [cameraStream, stopTracks]);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      setCameraError(null);
      try {
        if (cameraStream) {
          stopTracks(cameraStream);
        }

        const targetDevice = deviceId || selectedDeviceId;
        const constraints: MediaStreamConstraints = {
          video: targetDevice ? { deviceId: { exact: targetDevice } } : { facingMode: 'environment' },
        };

        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          throw new Error('Camera API not available in this environment');
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setCameraStream(stream);
        await refreshDevices();
      } catch (err: unknown) {
        logger.error('Error starting camera', 'useCameraScanner', err);
        const errorMsg =
          'Could not access the camera. Inside previews or iframe environments, security features may restrict camera feed access. Please verify camera permissions or use the quick simulation options below.';
        setCameraError(errorMsg);
        if (onCameraError) {
          onCameraError(errorMsg);
        }
      }
    },
    [cameraStream, onCameraError, refreshDevices, selectedDeviceId, stopTracks]
  );

  const switchCamera = useCallback(
    async (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      await startCamera(deviceId);
    },
    [startCamera]
  );

  // Sync stream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Handle active enabled state changes
  useEffect(() => {
    if (enabled) {
      startCamera(selectedDeviceId);
    } else {
      stopCamera();
    }
    return () => {
      stopTracks(cameraStream);
    };
  }, [enabled, selectedDeviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    videoRef,
    videoDevices,
    selectedDeviceId,
    cameraStream,
    cameraError,
    isCapturing,
    scanStatus,
    setSelectedDeviceId,
    setIsCapturing,
    setScanStatus,
    startCamera,
    stopCamera,
    switchCamera,
    refreshDevices,
  };
}
