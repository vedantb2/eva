import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notifications to show when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const setupDailyReminder = async () => {
  try {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }

    // Cancel any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule daily notification at 5 PM
    const trigger = {
      hour: 17, // 5 PM
      minute: 0,
      repeats: true,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Log Your Hours',
        body: 'Don\'t forget to log your hours for today!',
        data: { screen: 'log-hours' },
      },
      trigger: Platform.OS === 'ios' ? trigger : {
        ...trigger,
        channelId: 'daily-reminder',
      },
    });

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily-reminder', {
        name: 'Daily Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#007AFF',
      });
    }
  } catch (error) {
    console.error('Error setting up notifications:', error);
  }
};

export const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
  const screen = response.notification.request.content.data?.screen;
  if (screen) {
    // Navigate to the specified screen
    // This will be handled in app/_layout.tsx
  }
}; 