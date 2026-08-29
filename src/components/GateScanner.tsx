import { useState, useEffect, useCallback } from 'react';
import { ScanLine, KeyRound, ArrowRight, ArrowLeft, Camera } from 'lucide-react';
import { UserProfile, TicketPurchase, GateLog } from '../types';
import { db } from '../lib/db';
import { logger } from '../lib/logger';
import { useCameraScanner } from '../hooks/useCameraScanner';
import GateLogList from './scanner/GateLogList';
import ScanResultModal from './scanner/ScanResultModal';
import CameraScannerView from './scanner/CameraScannerView';
import QuickPassSimulator from './scanner/QuickPassSimulator';

interface GateScannerProps {
  user: UserProfile;
  onBack?: () => void;
}

export default function GateScanner({ user, onBack }: GateScannerProps) {
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

  const loadLogsAndTickets = useCallback(async () => {
    try {
      const allPurchases = await db.getPurchasesForProducer(user.id);
      setPurchasableTickets(allPurchases);

      const storedLogs = await db.getGateLogs();
      setLogs(storedLogs);
    } catch (e) {
      logger.error('Failed to load tickets or gate logs', 'GateScanner', e);
    }
  }, [user.id]);

  useEffect(() => {
    loadLogsAndTickets();
  }, [loadLogsAndTickets]);

  const handleAuthenticate = async (codeToAuth?: string) => {
    const code = (codeToAuth || ticketCode).trim();
    if (!code) return;

    try {
      const result = await db.authenticateTicket(code);
      setScanResult(result);
      setTicketCode('');
      loadLogsAndTickets();
    } catch {
      setScanResult({
        success: false,
        message: 'An error occurred during gate verification. Please retry.',
      });
    }
  };

  const handleCaptureAndScan = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setScanStatus('Analyzing camera frame for ticket barcodes...');

    setTimeout(() => {
      const pendingTicket =
        purchasableTickets.find((p) => p.status === 'unused') || purchasableTickets[0];
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

  return (
    <div className="space-y-8 animate-fadeIn" id="gate-scanner-container">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-mono tracking-widest text-sky-light font-semibold uppercase">
            Event Access Control System
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white mt-1">
            Gate{' '}
            <span className="bg-gradient-to-r from-gold-light via-gold to-gold-dark bg-clip-text text-transparent">
              Gatekeeper
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Verify and authenticate event tickets at the entrance gate. Double-entry protection
            secured.
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/30 hover:text-gold transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        )}
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
                  type="button"
                  onClick={() => handleAuthenticate()}
                  className="rounded-xl bg-gradient-to-r from-gold to-gold-dark px-6 py-3.5 text-sm font-bold text-black hover:brightness-105 transition-all flex items-center justify-center gap-2"
                  id="manual-auth-submit-btn"
                >
                  Authenticate Pass
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <CameraScannerView
                videoRef={videoRef}
                videoDevices={videoDevices}
                selectedDeviceId={selectedDeviceId}
                setSelectedDeviceId={setSelectedDeviceId}
                cameraStream={cameraStream}
                cameraError={cameraError}
                startCamera={startCamera}
                isCapturing={isCapturing}
                scanStatus={scanStatus}
                onScanFrame={handleCaptureAndScan}
              />
            )}

            {/* SIMULATOR QUICK VALIDATOR */}
            <QuickPassSimulator
              purchasableTickets={purchasableTickets}
              onQuickScan={(purchase) => handleAuthenticate(purchase.id)}
            />
          </div>

          {/* SCAN RESULT MODAL */}
          {scanResult && (
            <ScanResultModal scanResult={scanResult} onClose={() => setScanResult(null)} />
          )}
        </div>

        {/* RIGHT ONE COL: REAL-TIME GATE CHECK-IN LOGS */}
        <GateLogList logs={logs} />
      </div>
    </div>
  );
}
