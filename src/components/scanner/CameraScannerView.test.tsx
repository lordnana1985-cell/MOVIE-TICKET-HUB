import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CameraScannerView from './CameraScannerView';

describe('CameraScannerView Component', () => {
  const dummyRef = { current: null };

  it('renders video element and default scan status without camera error', () => {
    render(
      <CameraScannerView
        videoRef={dummyRef}
        videoDevices={[]}
        selectedDeviceId=""
        setSelectedDeviceId={vi.fn()}
        cameraStream={null}
        cameraError={null}
        startCamera={vi.fn()}
        isCapturing={false}
        scanStatus="Ready to scan"
        onScanFrame={vi.fn()}
      />
    );

    expect(screen.getByText('Ready to scan')).toBeInTheDocument();
    expect(screen.getByTestId('scan-active-frame-btn')).toBeInTheDocument();
  });

  it('renders error state and handles camera retry', () => {
    const startCameraMock = vi.fn();
    render(
      <CameraScannerView
        videoRef={dummyRef}
        videoDevices={[]}
        selectedDeviceId=""
        setSelectedDeviceId={vi.fn()}
        cameraStream={null}
        cameraError="Camera access denied"
        startCamera={startCameraMock}
        isCapturing={false}
        scanStatus="Idle"
        onScanFrame={vi.fn()}
      />
    );

    expect(screen.getByText('Camera access denied')).toBeInTheDocument();
    const retryBtn = screen.getByText('Retry Camera');
    fireEvent.click(retryBtn);
    expect(startCameraMock).toHaveBeenCalledTimes(1);
  });

  it('allows switching lens when multiple video devices exist', () => {
    const setSelectedDeviceIdMock = vi.fn();
    const devices = [
      { deviceId: 'cam1', label: 'Front Lens' } as MediaDeviceInfo,
      { deviceId: 'cam2', label: 'Back Lens' } as MediaDeviceInfo,
    ];

    render(
      <CameraScannerView
        videoRef={dummyRef}
        videoDevices={devices}
        selectedDeviceId="cam1"
        setSelectedDeviceId={setSelectedDeviceIdMock}
        cameraStream={null}
        cameraError={null}
        startCamera={vi.fn()}
        isCapturing={false}
        scanStatus="Ready"
        onScanFrame={vi.fn()}
      />
    );

    const select = screen.getByTestId('camera-device-select');
    fireEvent.change(select, { target: { value: 'cam2' } });
    expect(setSelectedDeviceIdMock).toHaveBeenCalledWith('cam2');
  });

  it('triggers onScanFrame when button is clicked', () => {
    const onScanMock = vi.fn();
    render(
      <CameraScannerView
        videoRef={dummyRef}
        videoDevices={[]}
        selectedDeviceId=""
        setSelectedDeviceId={vi.fn()}
        cameraStream={null}
        cameraError={null}
        startCamera={vi.fn()}
        isCapturing={false}
        scanStatus="Ready"
        onScanFrame={onScanMock}
      />
    );

    fireEvent.click(screen.getByTestId('scan-active-frame-btn'));
    expect(onScanMock).toHaveBeenCalledTimes(1);
  });
});
