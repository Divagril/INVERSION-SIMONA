import React, { createContext, useState, useContext, type ReactNode } from 'react';

interface NotificationContextType {
  showNotification: (msg: string, isError?: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notif, setNotif] = useState<{ msg: string; isError: boolean } | null>(null);

  const showNotification = (msg: string, isError = false) => {
    setNotif({ msg, isError });
    setTimeout(() => setNotif(null), 3000);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notif && (
        <div style={{
          position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
          backgroundColor: notif.isError ? '#E74C3C' : '#27AE60', color: 'white',
          padding: '20px 40px', borderRadius: '15px', fontWeight: 'bold', zIndex: 99999,
          fontSize: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '3px solid white'
        }}>
          {notif.isError ? '⚠️ ' : '✅ '} {notif.msg}
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification debe usarse dentro de un Provider");
  return context;
};