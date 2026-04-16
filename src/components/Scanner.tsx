"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ScannerProps {
  onScan: (barcode: string) => void;
  active: boolean;
}

export default function Scanner({ onScan, active }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const [error, setError] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string>("");
  const lastScanTimeRef = useRef<number>(0);
  const lastScanTextRef = useRef<string>("");

  const stopScanner = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setError("");
    try {
      const { BrowserMultiFormatReader, BarcodeFormat } = await import("@zxing/browser");
      const { DecodeHintType } = await import("@zxing/library");

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints);

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (devices.length === 0) {
        setError("No camera found on this device.");
        return;
      }

      // Prefer back/environment camera
      const backCamera =
        devices.find((d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("environment")
        ) || devices[devices.length - 1];

      const deviceId = backCamera?.deviceId ?? undefined;

      setScanning(true);

      const controls = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current!,
        (result, err, ctrl) => {
          if (result) {
            const now = Date.now();
            const text = result.getText();
            if (text !== lastScanTextRef.current || now - lastScanTimeRef.current > 2000) {
              lastScanTimeRef.current = now;
              lastScanTextRef.current = text;
              setLastScanned(text);
              onScan(text);
            }
          }
          if (err) {
            void ctrl; // suppress unused warning
            // Common: NotFoundException - no barcode in frame, ignore
          }
        }
      );

      stopRef.current = () => controls.stop();
    } catch (e: unknown) {
      setScanning(false);
      const msg = e instanceof Error ? e.message : "Camera error";
      if (msg.includes("Permission") || msg.includes("NotAllowed") || msg.includes("not allowed")) {
        setError("Camera permission denied. Please allow camera access and reload.");
      } else if (msg.includes("NotFound") || msg.includes("no device")) {
        setError("No camera found. Please connect a camera.");
      } else {
        setError(`Camera error: ${msg}`);
      }
    }
  }, [onScan]);

  useEffect(() => {
    if (active) {
      startScanner();
    } else {
      stopScanner();
      setLastScanned("");
    }
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Viewfinder */}
      <div className="relative w-full max-w-sm rounded-xl overflow-hidden bg-black border-2 border-purple-500 shadow-lg">
        <video
          ref={videoRef}
          className="w-full h-56 object-cover"
          muted
          playsInline
          autoPlay
        />
        {/* Scanning overlay */}
        {scanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-purple-400 rounded-tl-md" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-purple-400 rounded-tr-md" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-purple-400 rounded-bl-md" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-purple-400 rounded-br-md" />
          </div>
        )}
        {!active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center">
              <svg className="w-10 h-10 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9V6a1 1 0 011-1h3M21 9V6a1 1 0 00-1-1h-3M3 15v3a1 1 0 001 1h3M21 15v3a1 1 0 01-1 1h-3M8 12h8" />
              </svg>
              <p className="text-gray-400 text-sm">Scanner Off</p>
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 text-sm">
        {scanning ? (
          <>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 font-medium">Scanning for barcode...</span>
          </>
        ) : error ? (
          <>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-red-400 text-xs">{error}</span>
          </>
        ) : (
          <>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-500" />
            <span className="text-gray-400">Camera inactive</span>
          </>
        )}
      </div>

      {lastScanned && scanning && (
        <div className="w-full max-w-sm bg-purple-900/40 border border-purple-500/40 rounded-lg px-3 py-2">
          <p className="text-xs text-purple-300 font-mono truncate">
            Detected: <span className="text-white font-semibold">{lastScanned}</span>
          </p>
        </div>
      )}
    </div>
  );
}
