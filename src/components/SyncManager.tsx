import React, { useEffect } from 'react';
import { persistentData } from '../lib/persistentData';

export default function SyncManager() {
  useEffect(() => {
    // 1. Initial sync on mount if online
    if (navigator.onLine) {
      persistentData.syncAll();
    }

    // 2. Setup online/offline listeners
    const handleOnline = () => {
      console.log('App is online. Starting background sync...');
      persistentData.syncAll();
    };

    const handleOffline = () => {
      console.log('App is offline. Data will cached locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Periodic sync every 2 minutes if online
    const interval = setInterval(() => {
      if (navigator.onLine) {
        persistentData.syncAll();
      }
    }, 120000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return null; // This is a logic-only component
}
