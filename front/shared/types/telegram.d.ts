// Минимальный тип Telegram WebApp SDK. Полная схема:
// https://core.telegram.org/bots/webapps#initializing-mini-apps
export {};

declare global {
  interface TelegramWebAppUser {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
  }

  interface TelegramWebAppThemeParams {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    header_bg_color?: string;
    accent_text_color?: string;
    section_bg_color?: string;
    section_header_text_color?: string;
    subtitle_text_color?: string;
    destructive_text_color?: string;
  }

  type TelegramPlatform =
    | 'ios'
    | 'android'
    | 'tdesktop'
    | 'macos'
    | 'web'
    | 'weba'
    | 'unknown';

  interface TelegramSafeAreaInset {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }

  interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
      user?: TelegramWebAppUser;
      auth_date?: number;
      hash?: string;
    };
    platform: TelegramPlatform;
    version: string;
    isVersionAtLeast: (version: string) => boolean;
    safeAreaInset: TelegramSafeAreaInset;
    contentSafeAreaInset: TelegramSafeAreaInset;
    colorScheme: 'light' | 'dark';
    themeParams: TelegramWebAppThemeParams;
    viewportHeight: number;
    viewportStableHeight: number;
    isExpanded?: boolean;
    isFullscreen?: boolean;
    ready: () => void;
    expand: () => void;
    requestFullscreen?: () => void;
    exitFullscreen?: () => void;
    disableVerticalSwipes?: () => void;
    enableVerticalSwipes?: () => void;
    close: () => void;
    HapticFeedback?: {
      impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
      notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
      selectionChanged: () => void;
    };
    onEvent: (eventType: string, handler: () => void) => void;
    offEvent: (eventType: string, handler: () => void) => void;
    BackButton: {
      isVisible: boolean;
      show: () => void;
      hide: () => void;
      onClick: (callback: () => void) => void;
      offClick: (callback: () => void) => void;
    };
  }

  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
