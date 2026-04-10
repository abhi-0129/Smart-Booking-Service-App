import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sbs_user')); }
    catch { return null; }
  });
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const login = useCallback((data) => {
    setUser(data);
    localStorage.setItem('sbs_user', JSON.stringify(data));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('sbs_user');
    if (socket) { socket.disconnect(); setSocket(null); }
    setNotifications([]);
    setUnreadCount(0);
  }, [socket]);

  // Setup socket when user logs in
  useEffect(() => {
    if (!user?.token) return;

    const s = io('http://localhost:5000', {
      auth: { token: user.token },
      transports: ['websocket'],
    });

    s.on('connect', () => console.log('Socket connected'));
    s.on('connect_error', (e) => console.warn('Socket error:', e.message));

    s.on('notification', (notif) => {
      setNotifications(prev => [{ ...notif, id: Date.now(), is_read: false, created_at: new Date().toISOString() }, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    setSocket(s);
    return () => s.disconnect();
  }, [user?.token]);

  const addNotification = (notif) => {
    setNotifications(prev => [notif, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markNotificationsRead = () => setUnreadCount(0);

  return (
    <AuthContext.Provider value={{
      user, login, logout, socket,
      notifications, setNotifications,
      unreadCount, setUnreadCount,
      addNotification, markNotificationsRead
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
