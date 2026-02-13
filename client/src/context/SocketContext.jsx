import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { SOCKET_URL } from '../config/constant';
const SocketContext = createContext();
const SocketProvider = ({ children }) => {


    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (!user) return;

        const newSocket = io(SOCKET_URL, {
            // 1. VITAL: Enables passing cookies/JWT across domains
            withCredentials: true,

            // 2. VITAL: Direct WebSocket connection (bypasses Vercel's proxy limits)
            transports: ["websocket", "polling"],

            // Your existing (good) reconnection logic
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
        });

        const handleConnect = () => {
            console.log('Socket connected');
            setConnected(true);
            const token = localStorage.getItem('token');
            newSocket.emit('authenticate', { userId: user.id, token });
        };

        const handleDisconnect = () => {
            console.log(' Socket disconnected');
            setConnected(false);
        };

        const handleAuthenticated = () => {
            console.log(' Socket authenticated');
        };

        newSocket.on('connect', handleConnect);
        newSocket.on('disconnect', handleDisconnect);
        newSocket.on('authenticated', handleAuthenticated);

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(newSocket);

        return () => {
            newSocket.off('connect', handleConnect);
            newSocket.off('disconnect', handleDisconnect);
            newSocket.off('authenticated', handleAuthenticated);
            newSocket.close();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};

export { SocketContext, SocketProvider };