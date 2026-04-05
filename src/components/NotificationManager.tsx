import React, { useEffect } from 'react';
import { notificationService } from '../lib/notifications';

export default function NotificationManager() {
  useEffect(() => {
    // Initial check on mount
    notificationService.checkReminders();
    
    // Poll every minute for upcoming reminders
    const interval = setInterval(() => {
      notificationService.checkReminders();
    }, 60000); // Check every 60 seconds

    // Also request permission if not granted yet
    const requestOnFirstInteraction = async () => {
      await notificationService.requestPermission();
      window.removeEventListener('click', requestOnFirstInteraction);
    };
    window.addEventListener('click', requestOnFirstInteraction);

    return () => clearInterval(interval);
  }, []);

  return null; // This is a logic-only component
}
