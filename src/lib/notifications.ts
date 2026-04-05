import { supabase } from './supabase';

class NotificationService {
  private hasPermission: boolean = false;

  constructor() {
    this.checkPermission();
  }

  private async checkPermission() {
    if (!('Notification' in window)) return;
    this.hasPermission = Notification.permission === 'granted';
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    this.hasPermission = permission === 'granted';
    return this.hasPermission;
  }

  public async show(title: string, options?: NotificationOptions) {
    if (!this.hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) return;
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification(title, {
        icon: '/app-icon.jpg',
        badge: '/app-icon.jpg',
        vibrate: [200, 100, 200],
        ...options
      } as any);
    } else {
      new Notification(title, options);
    }
  }

  // Check and fire reminders that are due
  public async checkReminders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const now = new Date().toISOString();
    const lastCheck = localStorage.getItem('last_notification_check') || now;
    
    // Fetch reminders due between lastCheck and now
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_done', false)
      .lte('remind_at', now)
      .gt('remind_at', lastCheck);

    if (!error && data && data.length > 0) {
      data.forEach(reminder => {
        this.show(`Reminder: ${reminder.title}`, {
          body: reminder.description || 'You have a scheduled reminder.',
          tag: `reminder-${reminder.id}`
        });
      });
    }

    localStorage.setItem('last_notification_check', now);
    
    // Also check for task deadlines due in the next hour if we haven't checked for them yet
    this.checkTaskDeadlines(session.user.id, now);
  }

  private async checkTaskDeadlines(userId: string, now: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'done')
      .lte('due_date', now)
      .gt('due_date', localStorage.getItem('last_task_check') || now);

    if (!error && data && data.length > 0) {
      data.forEach(task => {
        this.show(`Task Due: ${task.title}`, {
          body: `This task is due now!`,
          tag: `task-${task.id}`
        });
      });
    }
    localStorage.setItem('last_task_check', now);
  }
}

export const notificationService = new NotificationService();

