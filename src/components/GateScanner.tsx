import { useState, useEffect, useRef } from 'react';
import { 
  ScanLine, 
  Camera, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Activity, 
  Search, 
  ArrowRight,
  User,
  Film,
  KeyRound,
  History,
  QrCode,
  RefreshCw,
  Video
} from 'lucide-react';
import { UserProfile, TicketPurchase, GateLog } from '../types';
import { db } from '../lib/db';

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

  // For simulation picker
  const [purchasableTickets, setPurchasableTickets] = useState<TicketPurchase[]>([]);

  // Camera Scanner Refs and States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');

  // Stop camera tracks helper
  const stopCamera = (streamToStop: MediaStream | null) => {
    if (streamToStop) {
      streamToStop.getTracks().forEach(track => track.stop());
    }
  };

  // Enumerate camera devices
  const getCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        const backCam = videoInputs.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('environment') || 
          d.label.toLowerCase().includes('rear')
        );
        setSelectedDeviceId(backCam ? backCam.deviceId : videoInputs[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating cameras:', err);
    }
  };

  // Start camera stream
  const startCamera = async (deviceId: string) => {
    setCameraError(null);
    try {
      if (cameraStream) {
        stopCamera(cameraStream);
      }
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: 'environment' }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      await getCameraDevices();
    } catch (err: any) {
      console.error('Error starting camera:', err);
      setCameraError(
        'Could not access the camera. Inside previews or iframe environments, security features may restrict camera feed access. Please verify camera permissions or use the quick simulation options below.'
      );
    }
  };

  // Bind camera stream to video tag
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Handle camera toggles and cleanup
  useEffect(() => {
    if (isScanningMode) {
      startCamera(selectedDeviceId);
    } else {
      if (cameraStream) {
        stopCamera(cameraStream);
        setCameraStream(null);
      }
    }
    return () => {
      if (cameraStream) {
        stopCamera(cameraStream);
      }
    };
  }, [isScanningMode, selectedDeviceId]);

  // Camera frame scanning/analyzing simulation
  const handleCaptureAndScan = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setScanStatus('Analyzing camera frame for ticket barcodes...');
    
    setTimeout(() => {
      // Find a purchased/unused ticket from list to authenticate
      const pendingTicket = purchasableTickets.find(p => p.status === 'purchased') || purchasableTickets[0];
      if (pendingTicket) {
        setScanStatus(`Found code: ${pendingTicket.id}! Validating...`);
        setTimeout(async () => {
          await handleAuthenticate(pendingTicket.id);
          setIsCapturing(false);
          setScanStatus('');
        }, 800);
      } else {
        setScanStatus('No valid barcode found. Hold ticket code up to the camera lens or enter it manually.');
        setTimeout(() => {
          setIsCapturing(false);
          setScanStatus('');
        }, 2200);
      }
    }, 1200);
  };

  const loadLogsAndTickets = async () => {
    try {
      const myLogs = await db.getGateLogs(user.id);
      setLogs(myLogs);

      // Load all purchases across the system to simulate scans easily
      const allTickets = await db.getTickets();
      const myTicketIds = allTickets.filter(t => t.producerId === user.id).map(t => t.id);

      // Get purchases for my tickets to list them as scan simulations
      const purchases = await db.getPurchasesForProducer(user.id);
      setPurchasableTickets(purchases);
    } catch (e) {
      console.error('Error loading gate logs:', e);
    }
  };

  useEffect(() => {
    loadLogsAndTickets();
  }, [user.id]);

  const handleAuthenticate = async (codeToUse?: string) => {
    const code = (codeToUse || ticketCode).trim().toUpperCase();
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

            {/* TAB SELECTOR: MANUAL ENTRY VS LIVE WEBCAM SCANNER */}
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
              /* MANUAL CODE FIELD */
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
              /* LIVE WEBCAM SCANNER HUD VIEWPORT */
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

                {/* DEVICE SELECTOR ROW */}
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

                {/* VIEWPORT CONTROLLER CONTAINER */}
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-white/10 shadow-2xl flex flex-col justify-center items-center">
                  
                  {/* Holographic HUD corner reticles */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-gold/60 pointer-events-none z-10" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-gold/60 pointer-events-none z-10" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-gold/60 pointer-events-none z-10" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-gold/60 pointer-events-none z-10" />

                  {/* ACTIVE VIEWPORT STATES */}
                  {cameraError ? (
                    <div className="p-6 text-center max-w-sm space-y-3 z-10">
                      <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                        <AlertTriangle className="h-6 w-6" />
                      </div>
                      <p className="text-xs text-gray-300 font-mono leading-relaxed">
                        {cameraError}
                      </p>
                      <button
                        type="button"
                        onClick={() => startCamera(selectedDeviceId)}
                        className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-white/10 transition-all flex items-center gap-1.5 mx-auto"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry Camera Access
                      </button>
                    </div>
                  ) : !cameraStream ? (
                    <div className="text-center p-6 space-y-3 z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold border-t-transparent mx-auto" />
                      <p className="text-xs text-gold/80 font-mono font-bold tracking-widest animate-pulse">
                        INITIALIZING DEVICE CAMERA FEED...
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Live sweeping laser */}
                      <div className="scanner-laser" />

                      {/* Video feedback */}
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Bottom scan trigger HUD overlay */}
                      <div className="absolute bottom-4 inset-x-4 bg-black/80 backdrop-blur-md rounded-xl p-3 border border-white/10 flex items-center justify-between z-20">
                        <div className="min-w-0">
                          <span className="text-[9px] font-mono font-bold text-emerald-400 block tracking-widest uppercase animate-pulse">
                            ● DEVICE CAMERA ACTIVE
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono block truncate">
                            {scanStatus || "Ready to capture and authenticate ticket passes"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleCaptureAndScan}
                          disabled={isCapturing}
                          className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {isCapturing ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-black border-t-transparent" />
                              <span>Scanning...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="h-3.5 w-3.5" />
                              <span>Capture & Scan</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Helpful instructions / support disclaimer */}
                <p className="text-[11px] text-gray-500 leading-normal bg-white/5 rounded-xl p-3 border border-white/5">
                  <strong>💡 Pro-tip:</strong> Align the client's ticket pass barcode inside the camera frame and click <strong>Capture & Scan</strong>. You can also click any of the purchased tickets in the quick simulation row below to mock-scan them immediately!
                </p>
              </div>
            )}

            {/* LIVE SIMULATOR SCROLL ROW */}
            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                  Simulate Live Gate QR Scan
                </h4>
                <span className="text-[10px] text-sky-light/80 font-mono">CLICK TO SCAN TICKET</span>
              </div>

              {purchasableTickets.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">
                  No purchases found to simulate scans with. Go to the marketplace and buy a ticket!
                </p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {purchasableTickets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => simulateQuickScan(p)}
                      className={`shrink-0 rounded-xl bg-white/5 border px-3 py-2.5 text-left transition-all hover:bg-white/10 ${
                        p.status === 'used' ? 'border-white/5 opacity-50' : 'border-sky-light/10 hover:border-sky-light/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <QrCode className="h-4 w-4 text-gold shrink-0" />
                        <span className="text-[10px] font-mono text-gray-400">{p.id}</span>
                      </div>
                      <span className="text-xs font-bold text-white block max-w-[150px] truncate">{p.buyerName}</span>
                      <span className="text-[10px] text-sky-light block truncate max-w-[150px]">{p.movieTitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC ACCESS GRANTED / ACCESS DENIED FEEDBACK SCREEN */}
          {scanResult && (
            <div 
              className={`rounded-2xl p-6 md:p-8 border animate-slideDown flex flex-col md:flex-row items-center gap-6 ${
                scanResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-white' 
                  : scanResult.purchase?.status === 'used'
                  ? 'bg-amber-500/10 border-amber-500/20 text-white'
                  : 'bg-red-500/10 border-red-500/20 text-white'
              }`}
            >
              <div className="shrink-0">
                {scanResult.success ? (
                  <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                ) : scanResult.purchase?.status === 'used' ? (
                  <div className="h-16 w-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="h-10 w-10 animate-pulse" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                    <XCircle className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className={`text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                    scanResult.success 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {scanResult.success ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                  </span>
                  {scanResult.purchase && (
                    <span className="text-xs text-gray-400 font-mono">
                      Ref: {scanResult.purchase.id}
                    </span>
                  )}
                </div>

                <h4 className="text-xl font-bold font-display leading-tight">
                  {scanResult.message}
                </h4>

                {scanResult.purchase && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 mt-3 border-t border-white/10 text-left text-xs font-mono text-gray-300">
                    <div>
                      <span className="text-gray-500 text-[10px] block">MOVIE SHOW</span>
                      <span className="font-bold text-white truncate block">{scanResult.purchase.movieTitle}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">TICKET HOLDER</span>
                      <span className="font-bold text-white truncate block">{scanResult.purchase.buyerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">AMOUNT PAID</span>
                      <span className="font-bold text-gold-light">₦{scanResult.purchase.amountPaid.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] block">PAYMENT REF</span>
                      <span className="font-bold text-sky-light truncate block">{scanResult.purchase.paystackRef.substring(0, 10)}...</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setScanResult(null)}
                className="rounded-lg p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT ONE COL: REAL-TIME GATE CHECK-IN LOGS */}
        <div className="space-y-4">
          {/* Gate Auth System status card from Geometric Balance theme */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl">
            <p className="text-[10px] text-white/40 uppercase font-bold mb-2 tracking-tighter font-mono">Gate Auth System</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              </div>
              <span className="text-xs font-medium text-white/80">Scanner Active: Terminal 04</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-sky-light" />
              Gate Entrance Logs
            </h3>
            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider flex items-center gap-1">
              <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
              SECURE LOGS
            </span>
          </div>

          <div className="rounded-2xl glass-panel p-4 border border-white/10 space-y-3 max-h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500">
                No tickets checked in at the gate yet. Enter code above to begin.
              </div>
            ) : (
              logs.map((log) => (
                <div 
                  key={log.id} 
                  className={`rounded-xl bg-white/5 border p-3 flex flex-col gap-1 hover:bg-white/10 transition-colors ${
                    log.status === 'success' 
                      ? 'border-emerald-500/10' 
                      : log.status === 'already_used'
                      ? 'border-amber-500/10'
                      : 'border-red-500/10'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-white block truncate max-w-[140px]">{log.buyerName}</span>
                      <span className="text-[10px] text-gray-400 block truncate max-w-[160px]">{log.movieTitle}</span>
                    </div>

                    <span className={`rounded px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase ${
                      log.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : log.status === 'already_used'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {log.status === 'success' ? 'GRANTED' : log.status === 'already_used' ? 'USED' : 'INVALID'}
                    </span>
                  </div>

                  <div className="mt-1 pt-1.5 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-gray-500">
                    <span>Code: {log.purchaseId.substring(0, 14)}...</span>
                    <span>{new Date(log.scannedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
