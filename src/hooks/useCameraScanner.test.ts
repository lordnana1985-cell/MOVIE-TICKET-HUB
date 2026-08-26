import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCameraScanner } from './useCameraScanner';

describe('useCameraScanner Hook', () => {
  const mockTrack = {
    stop: vi.fn(),
  };

  const mockStream = {
    getTracks: () => [mockTrack],
  } as unknown as MediaStream;

  const mockDevices = [
    { deviceId: 'cam-1', kind: 'videoinput', label: 'Front Camera' },
    { deviceId: 'cam-2', kind: 'videoinput', label: 'Back Environment Camera' },
  ] as MediaDeviceInfo[];

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
        enumerateDevices: vi.fn().mockResolvedValue(mockDevices),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default states', () => {
    const { result } = renderHook(() => useCameraScanner({ enabled: false }));

    expect(result.current.selectedDeviceId).toBe('');
    expect(result.current.cameraStream).toBeNull();
    expect(result.current.cameraError).toBeNull();
    expect(result.current.isCapturing).toBe(false);
    expect(result.current.scanStatus).toBe('');
  });

  it('starts camera stream and discovers devices when enabled', async () => {
    const { result } = renderHook(() => useCameraScanner({ enabled: true }));

    await act(async () => {
      await result.current.startCamera();
    });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
    expect(result.current.cameraStream).toBe(mockStream);
  });

  it('handles camera permission failure gracefully', async () => {
    const errorCallback = vi.fn();
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(
      new Error('Permission denied')
    );

    const { result } = renderHook(() =>
      useCameraScanner({ enabled: false, onCameraError: errorCallback })
    );

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.cameraError).toContain('Could not access the camera');
    expect(errorCallback).toHaveBeenCalled();
  });

  it('stops tracks and resets stream when stopCamera is called', async () => {
    const { result } = renderHook(() => useCameraScanner({ enabled: true }));

    await act(async () => {
      await result.current.startCamera();
    });

    act(() => {
      result.current.stopCamera();
    });

    expect(mockTrack.stop).toHaveBeenCalled();
    expect(result.current.cameraStream).toBeNull();
  });
});
