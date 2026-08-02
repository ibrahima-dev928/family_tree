import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

/**
 * Gère la connexion Socket.IO au namespace /messaging.
 * Se connecte automatiquement avec le token JWT stocké, se déconnecte au démontage.
 */
export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const socket = io(`${API_BASE}/messaging`, {
      auth: { token },
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  return { socket: socketRef.current, connected };
}