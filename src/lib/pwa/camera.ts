// Camera Integration for PWA

import type { CameraCapture, MediaDeviceInfo } from './types';

// Check if camera is supported
export function isCameraSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getUserMedia' in navigator.mediaDevices
  );
}

// Get available cameras
export async function getAvailableCameras(): Promise<MediaDeviceInfo[]> {
  if (!isCameraSupported()) return [];

  try {
    // Need to request permission first to get device labels
    await navigator.mediaDevices.getUserMedia({ video: true });

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter(device => device.kind === 'videoinput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 4)}`,
        kind: device.kind as 'videoinput',
      }));
  } catch {
    return [];
  }
}

// Open camera stream
export async function openCamera(
  videoElement: HTMLVideoElement,
  deviceId?: string,
  facingMode: 'user' | 'environment' = 'environment'
): Promise<MediaStream> {
  if (!isCameraSupported()) {
    throw new Error('Camera is not supported on this device');
  }

  const constraints: MediaStreamConstraints = {
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      facingMode: deviceId ? undefined : facingMode,
      deviceId: deviceId ? { exact: deviceId } : undefined,
    },
    audio: false,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoElement.srcObject = stream;
    await videoElement.play();
    return stream;
  } catch (error) {
    if (error instanceof DOMException) {
      switch (error.name) {
        case 'NotAllowedError':
          throw new Error('Camera access was denied. Please enable camera permissions.');
        case 'NotFoundError':
          throw new Error('No camera found on this device.');
        case 'NotReadableError':
          throw new Error('Camera is in use by another application.');
        default:
          throw new Error(`Camera error: ${error.message}`);
      }
    }
    throw error;
  }
}

// Close camera stream
export function closeCamera(stream: MediaStream): void {
  stream.getTracks().forEach(track => track.stop());
}

// Capture photo from video stream
export function capturePhoto(
  videoElement: HTMLVideoElement,
  quality: number = 0.9
): CameraCapture {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.drawImage(videoElement, 0, 0);

  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  // Convert to blob
  const byteString = atob(dataUrl.split(',')[1]);
  const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8Array = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([arrayBuffer], { type: mimeType });

  return {
    dataUrl,
    blob,
    width: canvas.width,
    height: canvas.height,
    timestamp: new Date(),
  };
}

// Capture photo from file input (for fallback)
export async function captureFromFile(file: File): Promise<CameraCapture> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

        resolve({
          dataUrl,
          blob: file,
          width: img.width,
          height: img.height,
          timestamp: new Date(),
        });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Resize image
export function resizeImage(
  capture: CameraCapture,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<CameraCapture> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const byteString = atob(dataUrl.split(',')[1]);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);

      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });

      resolve({
        dataUrl,
        blob,
        width,
        height,
        timestamp: capture.timestamp,
      });
    };

    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = capture.dataUrl;
  });
}

// Upload captured image
export async function uploadCapture(
  capture: CameraCapture,
  endpoint: string,
  fieldName: string = 'image',
  additionalData?: Record<string, string>
): Promise<Response> {
  const formData = new FormData();
  formData.append(fieldName, capture.blob, `capture-${Date.now()}.jpg`);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return fetch(endpoint, {
    method: 'POST',
    body: formData,
  });
}
