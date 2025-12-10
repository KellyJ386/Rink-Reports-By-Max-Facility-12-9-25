'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  CameraIcon,
  XMarkIcon,
  ArrowPathIcon,
  PhotoIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import {
  isCameraSupported,
  openCamera,
  closeCamera,
  capturePhoto,
  captureFromFile,
  resizeImage,
  getAvailableCameras,
} from '@/lib/pwa/camera';
import type { CameraCapture as CameraCaptureType, MediaDeviceInfo } from '@/lib/pwa/types';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onCapture: (capture: CameraCaptureType) => void;
  onClose?: () => void;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  allowFileUpload?: boolean;
  aspectRatio?: number;
}

export function CameraCapture({
  onCapture,
  onClose,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.85,
  allowFileUpload = true,
  aspectRatio,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>();
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [preview, setPreview] = useState<CameraCaptureType | null>(null);

  // Initialize camera
  const initCamera = useCallback(async () => {
    if (!videoRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Close existing stream
      if (streamRef.current) {
        closeCamera(streamRef.current);
      }

      const stream = await openCamera(videoRef.current, selectedCamera, facingMode);
      streamRef.current = stream;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open camera');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCamera, facingMode]);

  useEffect(() => {
    const supported = isCameraSupported();
    setIsSupported(supported);

    if (supported) {
      getAvailableCameras().then(setCameras);
      initCamera();
    } else {
      setIsLoading(false);
    }

    return () => {
      if (streamRef.current) {
        closeCamera(streamRef.current);
      }
    };
  }, [initCamera]);

  // Switch camera
  const switchCamera = () => {
    if (cameras.length > 1) {
      const currentIndex = cameras.findIndex(c => c.deviceId === selectedCamera);
      const nextIndex = (currentIndex + 1) % cameras.length;
      setSelectedCamera(cameras[nextIndex].deviceId);
    } else {
      setFacingMode(mode => mode === 'user' ? 'environment' : 'user');
    }
    initCamera();
  };

  // Capture photo
  const handleCapture = async () => {
    if (!videoRef.current) return;

    try {
      let capture = capturePhoto(videoRef.current, quality);

      // Resize if needed
      if (capture.width > maxWidth || capture.height > maxHeight) {
        capture = await resizeImage(capture, maxWidth, maxHeight, quality);
      }

      setPreview(capture);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture photo');
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let capture = await captureFromFile(file);

      // Resize if needed
      if (capture.width > maxWidth || capture.height > maxHeight) {
        capture = await resizeImage(capture, maxWidth, maxHeight, quality);
      }

      setPreview(capture);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    }
  };

  // Confirm capture
  const handleConfirm = () => {
    if (preview) {
      onCapture(preview);
      setPreview(null);
      onClose?.();
    }
  };

  // Retake photo
  const handleRetake = () => {
    setPreview(null);
    initCamera();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <h2 className="text-white font-medium">Take Photo</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10"
        >
          <XMarkIcon className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Camera View / Preview */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {error ? (
          <div className="text-center p-4">
            <p className="text-red-400 mb-4">{error}</p>
            {allowFileUpload && (
              <Button onClick={() => fileInputRef.current?.click()}>
                <PhotoIcon className="w-4 h-4 mr-2" />
                Upload Photo Instead
              </Button>
            )}
          </div>
        ) : preview ? (
          <img
            src={preview.dataUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                'max-w-full max-h-full object-contain',
                isLoading && 'opacity-0'
              )}
              style={aspectRatio ? { aspectRatio } : undefined}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ArrowPathIcon className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-black/50">
        {preview ? (
          <div className="flex items-center justify-center gap-4">
            <Button variant="secondary" onClick={handleRetake}>
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Retake
            </Button>
            <Button onClick={handleConfirm}>
              <CheckIcon className="w-4 h-4 mr-2" />
              Use Photo
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            {allowFileUpload && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20"
              >
                <PhotoIcon className="w-6 h-6 text-white" />
              </button>
            )}

            <button
              onClick={handleCapture}
              disabled={isLoading || !!error}
              className={cn(
                'w-16 h-16 rounded-full border-4 border-white',
                'flex items-center justify-center',
                'hover:bg-white/10 disabled:opacity-50'
              )}
            >
              <div className="w-12 h-12 rounded-full bg-white" />
            </button>

            {(cameras.length > 1 || isSupported) && (
              <button
                onClick={switchCamera}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20"
              >
                <ArrowPathIcon className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

// Simpler button that opens camera
interface CameraTriggerProps {
  onCapture: (capture: CameraCaptureType) => void;
  children?: React.ReactNode;
  className?: string;
}

export function CameraTrigger({ onCapture, children, className }: CameraTriggerProps) {
  const [showCamera, setShowCamera] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowCamera(true)}
        className={className}
      >
        {children || (
          <>
            <CameraIcon className="w-5 h-5 mr-2" />
            Take Photo
          </>
        )}
      </button>

      {showCamera && (
        <CameraCapture
          onCapture={(capture) => {
            onCapture(capture);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}
