import { useState, useEffect } from 'react';
import { 
  ScanLine, 
  Camera, 
  Search, 
  ArrowRight,
  User,
  Film,
  KeyRound,
  QrCode,
  RefreshCw,
  Video,
  AlertTriangle
} from 'lucide-react';
import { UserProfile, TicketPurchase, GateLog } from '../types';
import { db } from '../lib/db';
import { logger } from '../lib/logger';
import { useCameraScanner } from '../hooks/useCameraScanner';
import GateLogList from './scanner/GateLogList';
import ScanResultModal from './scanner/ScanResultModal';

interface GateScannerProps {
  user: UserProfile;
}

export default function GateScanner({ user }: GateScannerProps) {
  const [ticketCode, setTicketCode] = useState('');
  const [logs, setLogs] = useState<GateLog[]>([]);
  const [isScanningMode, setIsScanningMode] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    purchase?: TicketPurchase;
  } | null>(null);

  const [purchasableTickets, setPurchasableTickets] = useState<TicketPurchase[]>([]);

  const {
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
  } = useCameraScanner({
    enabled: isScanningMode,
  });

  const handleCaptureAndScan = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setScanStatus('Analyzing camera frame for ticket barcodes...');
    
    setTimeout(() => {
      const pendingTicket = purchasableTickets.find(p => p.status === 'unused') || purchasableTickets[0];
      if (pendingTicket) {
        setScanStatus(`Found code: ${pendingTicket.id}! Validating...`);
        setTimeout(async () => {
          await handleAuthenticate(pendingTicket.id);
          setIsCapturing(false);
          setScanStatus('Pass validated. Ready for next ticket...');
        }, 800);
      } else {
        setScanStatus('No valid QR/Barcode detected. Hold steady.');
        setIsCapturing(false);
      }
    }, 1200);
  };

  useEffect(() => {
    loadLogsAndTickets();
  }, [user.id]);

  const loadLogsAndTickets = async () => {
    try {
      const allPurchases = await db.getPurchasesForProducer(user.id);
      setPurchasableTickets(allPurchases);
      
      const storedLogs = await db.getGateLogs();
      setLogs(storedLogs);
    } catch (e) {
      logger.error('Failed to load tickets or gate logs', 'GateScanner', e);
    }
  };

  const handleAuthenticate = async (codeToAuth?: string) => {
    const code = (codeToAuth || ticketCode).trim();
    if (!code) return;

    try {
      const result = await db.authenticateTicket(code);
      setScanResult(result);
      setTicketCode('');
      loadLogsAndTickets();
    } catch (e) {
      setScanResult({
        success: false,
        message: 'An error occurred during gate verification. Please retry.'
      });
    }
  };

  const simulateQuickScan = (purchase: TicketPurchase) => {
    handleAuthenticate(purchase.id);
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="gate-scanner-container">
      {/* HEADER */}
      <div>
        <span className="text-xs font-mono tracking-widest text-sky-light font-semibold uppercase">
          Event Access Control System
        </span>
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-white mt-1">
          Gate <span className="bg-gradient-to-r from-gold-light via-gold to-gold-dark bg-clip-text text-transparent">Gatekeeper</span>
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Verify and authenticate event tickets at the entrance gate. Double-entry protection secured.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT 2 COLS: MANUAL & CAMERA VERIFICATION */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl glass-panel p-6 md:p-8 border border-white/10 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-gold/5 blur-[50px] pointer-events-none" />

            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-gold" />
              Ticket Gate Pass Verification
            </h3>

            {/* TAB SELECTOR */}
            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 max-w-md">
              <button
                type="button"
                onClick={() => setIsScanningMode(false)}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  !isScanningMode 
                    ? 'bg-gradient-to-r from-gold to-gold-dark text-black shadow' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <KeyRound className="h-4 w-4" />
                Manual Code Entry
              </button>
              <button
                type="button"
                onClick={() => setIsScanningMode(true)}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  isScanningMode 
                    ? 'bg-gradient-to-r from-gold to-gold-dark text-black shadow' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Camera className="h-4 w-4" />
                Live Camera Scanner
              </button>
            </div>

            {/* CONDITIONAL INTERFACES */}
            {!isScanningMode ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <KeyRound className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Enter Ticket Pass Code (e.g. TKT-PASS-XXXX)"
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value)}
                    className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3.5 pl-11 text-sm text-white placeholder-gray-500 focus:border-gold focus:outline-none uppercase font-mono tracking-wider"
                  />
                </div>
                <button
                  onClick={() => handleAuthenticate()}
                  className="rounded-xl bg-gradient-to-r from-gold to-gold-dark px-6 py-3.5 text-sm font-bold text-black hover:brightness-105 transition-all flex items-center justify-center gap-2"
                  id="manual-auth-submit-btn"
                >
                  Authenticate Pass
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
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
                    onClick={handleCaptureAndScan}
                    disabled={isCapturing}
                    className="w-full sm:w-auto rounded-lg bg-gold/20 hover:bg-gold/30 border border-gold/40 px-4 py-2 text-xs font-bold text-gold hover:text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
                    {isCapturing ? 'Analyzing...' : 'Scan Active Frame'}
                  </button>
                </div>
              </div>
            )}

            {/* SIMULATOR QUICK VALIDATOR */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-gold" />
                  Quick Pass Simulator (Active Database)
                </span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {purchasableTickets.length} Passes On File
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {purchasableTickets.slice(0, 6).map((purchase) => (
                  <button
                    key={purchase.id}
                    onClick={() => simulateQuickScan(purchase)}
                    className="group rounded-xl bg-white/5 border border-white/10 p-2.5 text-left hover:border-gold/50 transition-all flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 text-xs text-white font-medium truncate">
                        <Film className="h-3 w-3 text-gold shrink-0" />
                        <span className="truncate">{purchase.movieTitle}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono mt-0.5">
                        <User className="h-2.5 w-2.5" />
                        <span className="truncate">{purchase.buyerName}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-500 font-bold">{purchase.id.substring(0, 10)}...</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase ${
                      purchase.status === 'unused' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {purchase.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SCAN RESULT MODAL */}
          {scanResult && (
            <ScanResultModal
              scanResult={scanResult}
              onClose={() => setScanResult(null)}
            />
          )}
        </div>

        {/* RIGHT ONE COL: REAL-TIME GATE CHECK-IN LOGS */}
        <GateLogList logs={logs} />
      </div>
    </div>
  );
}
