import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

class NotificationService {
    private async requestPermissions() {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
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

            // If date is in past, don't schedule
            if (reminderDate.getTime() <= Date.now()) {
                return false;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Task Reminder',
                    body: `Don't forget to log your progress on: ${taskName}`,
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: reminderDate,
                },
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

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Daily Check-in',
                    body: 'Time to log your tasks for today!',
                    sound: true,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    hour: 18,
                    minute: 0,
                    repeats: true,
                },
            });

            return true;
        } catch (error) {
            console.error('Error scheduling daily reminder:', error);
            return false;
        }
    }

    async cancelAllNotifications(): Promise<void> {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
        } catch (error) {
            console.error('Error canceling notifications:', error);
        }
    }
}

export const notificationService = new NotificationService();
