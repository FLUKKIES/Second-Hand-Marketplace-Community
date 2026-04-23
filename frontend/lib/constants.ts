// Design System Constants
export const CHAT_CONFIG = {
    MESSAGE_MAX_WIDTH_PERCENT: 85,
    FLOATING_WINDOW_WIDTH: 384, // 24rem
    FLOATING_WINDOW_HEIGHT: 500, // 31.25rem
    TYPING_TIMEOUT_MS: 1000,
    JOIN_ROOM_TIMEOUT_MS: 5000,
    QUICK_REACTIONS: ['👍', '❤️', '😂', '😮', '😢', '🙏'],
    AVATAR_SIZE: 32, // 2rem
    MESSAGE_SPACING: 12, // 0.75rem
} as const;

export const ANIMATION_DURATION = {
    FAST: 150,
    NORMAL: 250,
    SLOW: 350,
} as const;

export const Z_INDEX = {
    BASE: 1,
    DROPDOWN: 10,
    STICKY: 20,
    FIXED: 30,
    MODAL_BACKDROP: 40,
    MODAL: 50,
    POPOVER: 60,
    TOOLTIP: 70,
} as const;
