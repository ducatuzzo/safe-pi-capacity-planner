// Socket.io-Hook für Multiuser-Synchronisation
// Verbindet zum Backend, empfängt und sendet State-Änderungen

import { useRef, useEffect, useCallback, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { AllocationType, SavedProjectState } from '../types';

export type SettingsChangeType =
  | 'employees'
  | 'pis'
  | 'feiertage'
  | 'schulferien'
  | 'blocker'
  | 'teamZielwerte';

interface UseSocketOptions {
  onAllocationChange: (employeeId: string, dateStr: string, type: AllocationType) => void;
  onSettingsChange: (type: SettingsChangeType, data: unknown) => void;
  onLockChange: (employeeId: string, locked: boolean, userName?: string) => void;
  onStateLoad: (state: SavedProjectState) => void;
}

export function useSocket({
  onAllocationChange,
  onSettingsChange,
  onLockChange,
  onStateLoad,
}: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Callbacks in Refs halten, damit die Socket-Handler immer die aktuellste Version sehen
  const onAllocationChangeRef = useRef(onAllocationChange);
  const onSettingsChangeRef = useRef(onSettingsChange);
  const onLockChangeRef = useRef(onLockChange);
  const onStateLoadRef = useRef(onStateLoad);

  useEffect(() => {
    onAllocationChangeRef.current = onAllocationChange;
    onSettingsChangeRef.current = onSettingsChange;
    onLockChangeRef.current = onLockChange;
    onStateLoadRef.current = onStateLoad;
  });

  useEffect(() => {
    // Lokal: Vite proxied /socket.io → localhost:3001 → window.location.origin
    // Produktion: VITE_BACKEND_URL zeigt auf Railway-Backend
    const backendUrl = import.meta.env.VITE_BACKEND_URL ?? window.location.origin;
    const socket = io(backendUrl, {
      path: '/socket.io',
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('state:full', (state: SavedProjectState) => {
      onStateLoadRef.current(state);
    });

    socket.on('allocation:change', (payload: {
      employeeId: string;
      dateStr: string;
      allocationType: AllocationType;
    }) => {
      onAllocationChangeRef.current(payload.employeeId, payload.dateStr, payload.allocationType);
    });

    socket.on('settings:change', (payload: { type: SettingsChangeType; data: unknown }) => {
      onSettingsChangeRef.current(payload.type, payload.data);
    });

    socket.on('lock:row', (payload: { employeeId: string; userName: string }) => {
      onLockChangeRef.current(payload.employeeId, true, payload.userName);
    });

    socket.on('unlock:row', (payload: { employeeId: string }) => {
      onLockChangeRef.current(payload.employeeId, false);
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Nur einmal beim Mount — Callbacks laufen via Refs

  const emitAllocationChange = useCallback(
    (employeeId: string, dateStr: string, allocationType: AllocationType) => {
      socketRef.current?.emit('allocation:change', { employeeId, dateStr, allocationType });
    },
    [],
  );

  const emitSettingsChange = useCallback((type: SettingsChangeType, data: unknown) => {
    socketRef.current?.emit('settings:change', { type, data });
  }, []);

  const emitLock = useCallback((employeeId: string, userName: string) => {
    socketRef.current?.emit('lock:row', { employeeId, userName });
  }, []);

  const emitUnlock = useCallback((employeeId: string) => {
    socketRef.current?.emit('unlock:row', { employeeId });
  }, []);

  return { emitAllocationChange, emitSettingsChange, emitLock, emitUnlock, isConnected };
}
