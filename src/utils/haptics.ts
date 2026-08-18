import * as Haptics from 'expo-haptics';

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'tick' | 'success' | 'warning' | 'error' | 'delete') => {
  try {
    switch (type) {
      case 'light':
      case 'tick':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
      case 'delete':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // Haptics might fail in simulator or unsupported devices
  }
};
