import React from 'react';
import { Video, AlertTriangle, QrCode, RefreshCw } from 'lucide-react';

export interface CameraScannerViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  cameraStream: MediaStream | null;
  cameraError: string | null;
  startCamera: () => void;
  isCapturing: boolean;
  scanStatus: string;
  onScanFrame: () => void;
}

export default function CameraScannerView({
  videoRef,
  videoDevices,
  selectedDeviceId,
  setSelectedDeviceId,
  cameraStream,
  cameraError,
  startCamera,
  isCapturing,
  scanStatus,
  onScanFrame,
}: CameraScannerViewProps) {
  return (
    <div className="space-y-4" data-testid="camera-scanner-view">
      <style>{`
        @keyframes scan {
          0% { top: 8%; }
          50% { top: 92%; }
          100% { top: 8%; }
        }
        .scanner-laser {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(234, 179, 8, 0.9), transparent);
          box-shadow: 0 0 12px rgba(234, 179, 8, 0.9);
          animation: scan 2.5s infinite linear;
          pointer-events: none;
          z-index: 20;
        }
      `}</style>

      {videoDevices.length > 1 && (
        <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs">
          <Video className="h-3.5 w-3.5 text-gold shrink-0" />
          <span className="text-gray-400 font-mono text-[10px]">SELECT LENS:</span>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="bg-transparent border-none text-white text-xs font-mono focus:outline-none flex-1 cursor-pointer"
            data-testid="camera-device-select"
          >
            {videoDevices.map((device, idx) => (
              <option key={device.deviceId} value={device.deviceId} className="bg-black text-white">
                {device.label || `Camera ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-white/10 shadow-2xl flex flex-col justify-center items-center">
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-gold/60 pointer-events-none z-10" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-gold/60 pointer-events-none z-10" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-gold/60 pointer-events-none z-10" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-gold/60 pointer-events-none z-10" />

        {cameraError ? (
          <div className="p-6 text-center max-w-sm space-y-3 z-10">
            <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="text-xs text-red-400 font-mono">{cameraError}</p>
            <button
              type="button"
              onClick={() => startCamera()}
              className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs text-white transition-colors"
            >
              Retry Camera
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className={`h-full w-full object-cover transition-opacity duration-500 ${
                cameraStream ? 'opacity-90' : 'opacity-0'
              }`}
            />

            {cameraStream && <div className="scanner-laser" />}

            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/40 backdrop-blur-[2px] pointer-events-none">
              <div className="w-48 h-48 sm:w-56 sm:h-56 border border-gold/40 rounded-2xl relative flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.15)]">
                <QrCode className="h-16 w-16 text-gold/30" />
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/30 border border-white/5 rounded-xl p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-300 font-mono text-[11px]">{scanStatus}</span>
        </div>
        <button
          type="button"
          onClick={onScanFrame}
          disabled={isCapturing}
          className="w-full sm:w-auto rounded-lg bg-gold/20 hover:bg-gold/30 border border-gold/40 px-4 py-2 text-xs font-bold text-gold hover:text-white transition-all flex items-center justify-center gap-1.5"
          data-testid="scan-active-frame-btn"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
          {isCapturing ? 'Analyzing...' : 'Scan Active Frame'}
        </button>
      </div>
    </div>
  );
}
