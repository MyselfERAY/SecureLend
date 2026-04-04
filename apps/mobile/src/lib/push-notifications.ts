import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { api } from './api';
import { router } from 'expo-router';

/**
 * Configure how notifications are handled when the app is in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register the device for push notifications and send the token to the backend.
 * Should be called after the user has authenticated.
 */
export async function registerForPushNotifications(
  accessToken: string,
): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Varsayilan',
      description: 'SecureLend bildirimleri',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1e40af',
      sound: 'default',
    });
  }

  // Check existing permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get the Expo push token
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      undefined;

    // In Expo Go without EAS, projectId may be unavailable.
    // getExpoPushTokenAsync still works in dev if we omit it.
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : {},
    );

    const pushToken = tokenData.data;

    // Send the token to the backend
    try {
      await api('/api/v1/users/push-token', {
        method: 'POST',
        body: { token: pushToken },
        token: accessToken,
      });
      console.log('Push token registered with backend');
    } catch (error) {
      console.warn('Failed to send push token to backend:', error);
    }

    return pushToken;
  } catch (error) {
    console.warn('Failed to get push token:', error);
    return null;
  }
}

/**
 * Navigation handler: routes to the relevant screen based on notification data.
 */
function handleNotificationNavigation(
  data: Record<string, unknown>,
): void {
  const entityType = data.entityType as string | undefined;
  const entityId = data.entityId as string | undefined;
  const type = data.type as string | undefined;

  if (!type) return;

  switch (type) {
    case 'CONTRACT_CREATED':
    case 'CONTRACT_SIGNED':
    case 'CONTRACT_ACTIVATED':
    case 'CONTRACT_TERMINATED':
      if (entityId) {
        router.push(`/(tabs)/contracts/${entityId}`);
      } else {
        router.push('/(tabs)/contracts');
      }
      break;

    case 'PAYMENT_DUE':
    case 'PAYMENT_OVERDUE':
    case 'PAYMENT_COMPLETED':
      router.push('/(tabs)/payments');
      break;

    case 'KMH_APPROVED':
    case 'KMH_REJECTED':
    case 'KMH_ONBOARDING_COMPLETE':
      router.push('/(tabs)/bank');
      break;

    default:
      // For SYSTEM and unknown types, go to home
      router.push('/(tabs)');
      break;
  }
}

/**
 * Set up listeners for incoming and tapped notifications.
 * Returns a cleanup function to remove listeners.
 */
export function setupNotificationListeners(): () => void {
  // Listener for notifications received while app is foregrounded
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification: Notifications.Notification) => {
      console.log('Notification received in foreground:', notification.request.content.title);
    },
  );

  // Listener for when user taps a notification
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as Record<
        string,
        unknown
      >;
      console.log('Notification tapped, data:', data);
      handleNotificationNavigation(data);
    });

  // Return cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Check if there was a notification that launched the app (cold start).
 * Should be called once on app startup after navigation is ready.
 */
export async function handleInitialNotification(): Promise<void> {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (response) {
    const data = response.notification.request.content.data as Record<
      string,
      unknown
    >;
    console.log('App opened from notification, data:', data);
    handleNotificationNavigation(data);
  }
}
