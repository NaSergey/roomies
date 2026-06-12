'use client';

import { getWebApp } from './use-telegram-web-app';

export function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  getWebApp()?.HapticFeedback?.impactOccurred(style);
}

export function hapticNotify(type: 'success' | 'warning' | 'error') {
  getWebApp()?.HapticFeedback?.notificationOccurred(type);
}
