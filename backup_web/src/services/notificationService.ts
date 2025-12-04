import { LocalNotifications } from '@capacitor/local-notifications';

export interface NotificationOptions {
  title: string;
  body: string;
  id?: number;
  schedule?: Date;
}

class NotificationService {
  private async requestPermissions() {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async scheduleTaskReminder(taskName: string, date: Date): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Notification permissions not granted');
        return false;
      }

      // Schedule for 9 AM the next day
      const reminderDate = new Date(date);
      reminderDate.setDate(reminderDate.getDate() + 1);
      reminderDate.setHours(9, 0, 0, 0);

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Task Reminder',
            body: `Don't forget to log your progress on: ${taskName}`,
            id: Date.now(),
            schedule: { at: reminderDate },
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });

      return true;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  }

  async scheduleDailyReminder(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return false;
      }

      // Schedule daily reminder at 6 PM
      const reminderTime = new Date();
      reminderTime.setHours(18, 0, 0, 0);

      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Daily Check-in',
            body: 'Time to log your tasks for today!',
            id: 1001,
            schedule: { 
              at: reminderTime,
              repeats: true 
            },
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: '',
            extra: null
          }
        ]
      });

      return true;
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
      return false;
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await LocalNotifications.cancel({
        notifications: []
      });
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();