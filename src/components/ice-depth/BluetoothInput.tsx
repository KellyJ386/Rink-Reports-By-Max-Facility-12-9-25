'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BluetoothDevice, BluetoothReading, BluetoothConnectionState } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import {
  SignalIcon,
  SignalSlashIcon,
  ArrowPathIcon,
  BoltIcon,
  Battery50Icon,
  Battery100Icon,
  BatteryAlertIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

// Bluetooth Service UUIDs for ice thickness measurement devices
const ICE_THICKNESS_SERVICE_UUID = '00001820-0000-1000-8000-00805f9b34fb'; // Generic
const ICE_THICKNESS_CHARACTERISTIC_UUID = '00002a56-0000-1000-8000-00805f9b34fb';

// Common digital caliper/measurement device UUIDs
const MEASUREMENT_SERVICES = [
  ICE_THICKNESS_SERVICE_UUID,
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Common HM-10 module
  '0000fff0-0000-1000-8000-00805f9b34fb', // Generic measurement
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
];

interface BluetoothInputProps {
  onReading: (reading: BluetoothReading) => void;
  onConnectionChange?: (state: BluetoothConnectionState) => void;
  autoConnect?: boolean;
  unit?: 'inches' | 'mm' | 'cm';
}

export function BluetoothInput({
  onReading,
  onConnectionChange,
  autoConnect = false,
  unit = 'inches',
}: BluetoothInputProps) {
  const [connectionState, setConnectionState] = useState<BluetoothConnectionState>({
    status: 'disconnected',
    device: null,
  });
  const [lastReading, setLastReading] = useState<BluetoothReading | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);
  const [showDeviceList, setShowDeviceList] = useState(false);

  const bluetoothDeviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if Web Bluetooth is supported
  const isBluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  // Update connection state and notify parent
  const updateConnectionState = useCallback((newState: BluetoothConnectionState) => {
    setConnectionState(newState);
    onConnectionChange?.(newState);
  }, [onConnectionChange]);

  // Convert raw reading to target unit
  const convertReading = useCallback((rawValue: number, fromUnit: 'mm' | 'inches'): number => {
    if (fromUnit === unit) return rawValue;

    // Convert to mm first, then to target unit
    const mmValue = fromUnit === 'inches' ? rawValue * 25.4 : rawValue;

    switch (unit) {
      case 'inches':
        return mmValue / 25.4;
      case 'cm':
        return mmValue / 10;
      case 'mm':
      default:
        return mmValue;
    }
  }, [unit]);

  // Handle incoming Bluetooth data
  const handleCharacteristicValueChanged = useCallback((event: Event) => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;

    if (!value) return;

    // Parse the measurement value
    // Most digital calipers send data as ASCII string or raw bytes
    let measurementValue: number;

    // Try parsing as ASCII string first
    const decoder = new TextDecoder('utf-8');
    const textValue = decoder.decode(value).trim();
    measurementValue = parseFloat(textValue);

    // If that fails, try reading as raw bytes (common format: 4 bytes, little-endian)
    if (isNaN(measurementValue)) {
      const dataView = new DataView(value.buffer);
      measurementValue = dataView.getFloat32(0, true);
    }

    // If still invalid, try as integer (some devices send in 0.01mm units)
    if (isNaN(measurementValue) || !isFinite(measurementValue)) {
      const dataView = new DataView(value.buffer);
      measurementValue = dataView.getInt32(0, true) / 100; // Assume 0.01mm resolution
    }

    if (!isNaN(measurementValue) && isFinite(measurementValue)) {
      const convertedValue = convertReading(measurementValue, 'mm');

      const reading: BluetoothReading = {
        deviceId: connectionState.device?.id || 'unknown',
        value: Math.round(convertedValue * 1000) / 1000, // Round to 3 decimal places
        unit,
        timestamp: new Date(),
      };

      setLastReading(reading);
      onReading(reading);

      // Update device's last reading
      if (connectionState.device) {
        const updatedDevice = {
          ...connectionState.device,
          lastReading: reading.value,
          lastReadingTime: reading.timestamp,
        };
        updateConnectionState({
          ...connectionState,
          device: updatedDevice,
        });
      }
    }
  }, [connectionState, unit, convertReading, onReading, updateConnectionState]);

  // Scan for Bluetooth devices
  const scanForDevices = useCallback(async () => {
    if (!isBluetoothSupported) {
      updateConnectionState({
        status: 'error',
        device: null,
        error: 'Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.',
      });
      return;
    }

    setIsScanning(true);
    setShowDeviceList(true);
    setAvailableDevices([]);

    try {
      // Request device with filter for measurement services
      const device = await navigator.bluetooth.requestDevice({
        filters: MEASUREMENT_SERVICES.map(uuid => ({ services: [uuid] })),
        optionalServices: MEASUREMENT_SERVICES,
        // If no specific filter works, accept all devices
        // acceptAllDevices: true,
      });

      if (device) {
        const btDevice: BluetoothDevice = {
          id: device.id,
          name: device.name || 'Unknown Device',
          connected: false,
        };
        setAvailableDevices([btDevice]);

        // Auto-connect if only one device found
        if (autoConnect) {
          await connectToDevice(device);
        }
      }
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'NotFoundError') {
        console.error('Bluetooth scan error:', error);
        updateConnectionState({
          status: 'error',
          device: null,
          error: (error as Error).message || 'Failed to scan for devices',
        });
      }
    } finally {
      setIsScanning(false);
    }
  }, [isBluetoothSupported, autoConnect, updateConnectionState]);

  // Connect to a Bluetooth device
  const connectToDevice = useCallback(async (device: BluetoothDevice) => {
    updateConnectionState({
      status: 'connecting',
      device: { ...device, connected: false },
    });

    try {
      // Get the actual Bluetooth device
      const btDevice = await navigator.bluetooth.requestDevice({
        filters: [{ name: device.name }],
        optionalServices: MEASUREMENT_SERVICES,
      });

      // Connect to GATT server
      const server = await btDevice.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      // Find the measurement service and characteristic
      let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

      for (const serviceUuid of MEASUREMENT_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();

          // Find a characteristic that supports notifications
          for (const char of characteristics) {
            if (char.properties.notify || char.properties.indicate) {
              characteristic = char;
              break;
            }
          }
          if (characteristic) break;
        } catch {
          // Service not found, try next
          continue;
        }
      }

      if (!characteristic) {
        throw new Error('No compatible measurement characteristic found');
      }

      // Start notifications
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);
      characteristicRef.current = characteristic;

      // Handle disconnect
      btDevice.addEventListener('gattserverdisconnected', () => {
        updateConnectionState({
          status: 'disconnected',
          device: { ...device, connected: false },
        });
        characteristicRef.current = null;

        // Auto-reconnect after 3 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (autoConnect) {
            connectToDevice(device);
          }
        }, 3000);
      });

      // Update state to connected
      const connectedDevice: BluetoothDevice = {
        ...device,
        connected: true,
      };

      bluetoothDeviceRef.current = connectedDevice;
      updateConnectionState({
        status: 'connected',
        device: connectedDevice,
      });

      setShowDeviceList(false);
    } catch (error) {
      console.error('Connection error:', error);
      updateConnectionState({
        status: 'error',
        device: null,
        error: (error as Error).message || 'Failed to connect to device',
      });
    }
  }, [autoConnect, handleCharacteristicValueChanged, updateConnectionState]);

  // Disconnect from device
  const disconnect = useCallback(async () => {
    if (characteristicRef.current) {
      try {
        await characteristicRef.current.stopNotifications();
      } catch (e) {
        // Ignore errors during disconnect
      }
      characteristicRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    bluetoothDeviceRef.current = null;
    updateConnectionState({
      status: 'disconnected',
      device: null,
    });
  }, [updateConnectionState]);

  // Manual reading trigger (for devices that don't auto-send)
  const requestReading = useCallback(async () => {
    if (!characteristicRef.current) return;

    try {
      const value = await characteristicRef.current.readValue();
      handleCharacteristicValueChanged({ target: { value } } as unknown as Event);
    } catch (error) {
      console.error('Failed to read value:', error);
    }
  }, [handleCharacteristicValueChanged]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  // Battery icon helper
  const BatteryIcon = connectionState.device?.batteryLevel !== undefined
    ? connectionState.device.batteryLevel > 50
      ? Battery100Icon
      : connectionState.device.batteryLevel > 20
        ? Battery50Icon
        : BatteryAlertIcon
    : null;

  return (
    <Card>
      <CardHeader
        title="Bluetooth Measurement"
        description="Connect to a digital caliper or ice thickness gauge"
        action={
          <div className="flex items-center gap-2">
            {connectionState.status === 'connected' ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <SignalIcon className="w-4 h-4" />
                Connected
              </span>
            ) : connectionState.status === 'connecting' ? (
              <span className="flex items-center gap-1 text-yellow-600 text-sm">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Connecting...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rink-500 text-sm">
                <SignalSlashIcon className="w-4 h-4" />
                Disconnected
              </span>
            )}
          </div>
        }
      />
      <CardContent>
        {!isBluetoothSupported ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Web Bluetooth not supported.</strong> Please use Chrome, Edge, or Opera browser,
              and ensure Bluetooth is enabled on your device.
            </p>
          </div>
        ) : (
          <>
            {/* Connection controls */}
            <div className="flex gap-2 mb-4">
              {connectionState.status === 'disconnected' || connectionState.status === 'error' ? (
                <Button
                  onClick={scanForDevices}
                  disabled={isScanning}
                  leftIcon={isScanning ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <BoltIcon className="w-4 h-4" />}
                >
                  {isScanning ? 'Scanning...' : 'Connect Device'}
                </Button>
              ) : (
                <Button variant="secondary" onClick={disconnect}>
                  Disconnect
                </Button>
              )}

              {connectionState.status === 'connected' && (
                <Button variant="secondary" onClick={requestReading}>
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  Read Now
                </Button>
              )}
            </div>

            {/* Error message */}
            {connectionState.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{connectionState.error}</p>
              </div>
            )}

            {/* Device list */}
            {showDeviceList && availableDevices.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-rink-700 mb-2">Available Devices:</p>
                <div className="space-y-2">
                  {availableDevices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => connectToDevice(device)}
                      className="w-full p-3 text-left border rounded-lg hover:bg-rink-50 transition-colors"
                    >
                      <span className="font-medium">{device.name}</span>
                      <span className="block text-xs text-rink-500">{device.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Connected device info */}
            {connectionState.device && connectionState.status === 'connected' && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-green-800">{connectionState.device.name}</p>
                    <p className="text-xs text-green-600">{connectionState.device.id}</p>
                  </div>
                  {BatteryIcon && connectionState.device.batteryLevel !== undefined && (
                    <div className="flex items-center gap-1 text-green-700">
                      <BatteryIcon className="w-5 h-5" />
                      <span className="text-sm">{connectionState.device.batteryLevel}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Last reading display */}
            {lastReading && (
              <div className="p-6 bg-rink-50 rounded-lg text-center">
                <p className="text-sm text-rink-500 mb-1">Last Reading</p>
                <p className="text-4xl font-bold text-rink-900">
                  {lastReading.value.toFixed(2)}
                  <span className="text-xl ml-1">{lastReading.unit === 'inches' ? '"' : lastReading.unit}</span>
                </p>
                <p className="text-xs text-rink-400 mt-2">
                  {lastReading.timestamp.toLocaleTimeString()}
                </p>
              </div>
            )}

            {/* Instructions */}
            {connectionState.status === 'connected' && !lastReading && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Ready to receive measurements.</strong> Take a reading with your connected
                  device and it will appear here automatically.
                </p>
              </div>
            )}

            {/* Supported devices info */}
            <div className="mt-4 text-xs text-rink-500">
              <p className="font-medium mb-1">Supported Devices:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Digital calipers with Bluetooth (Mitutoyo, iGaging, etc.)</li>
                <li>Ice thickness gauges with BLE</li>
                <li>Generic measurement devices with UART service</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for using Bluetooth input
export function useBluetoothInput(options?: {
  unit?: 'inches' | 'mm' | 'cm';
  autoConnect?: boolean;
}) {
  const [readings, setReadings] = useState<BluetoothReading[]>([]);
  const [connectionState, setConnectionState] = useState<BluetoothConnectionState>({
    status: 'disconnected',
    device: null,
  });

  const handleReading = useCallback((reading: BluetoothReading) => {
    setReadings((prev) => [...prev.slice(-99), reading]); // Keep last 100 readings
  }, []);

  const handleConnectionChange = useCallback((state: BluetoothConnectionState) => {
    setConnectionState(state);
  }, []);

  const clearReadings = useCallback(() => {
    setReadings([]);
  }, []);

  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

  return {
    readings,
    latestReading,
    connectionState,
    clearReadings,
    BluetoothInputComponent: (
      <BluetoothInput
        onReading={handleReading}
        onConnectionChange={handleConnectionChange}
        unit={options?.unit || 'inches'}
        autoConnect={options?.autoConnect || false}
      />
    ),
  };
}
