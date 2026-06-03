/** PanKo — Shared voice assistant timing and mode presets. */
export const VOICE_ACTIVE_LISTEN_MS = 5000;

/** How long to wait for a short command after "Hey PanKo" (ms). */
export const VOICE_COMMAND_WINDOW_MS = 4000;

export const VOICE_WAKE_OPTIONS = {
  wakePhrase: 'hey panko',
  autoStart: true,
  activeListenMs: VOICE_ACTIVE_LISTEN_MS,
  commandWindowMs: VOICE_COMMAND_WINDOW_MS,
};

/** Recipe view: always listen; next/back/read work without "Hey PanKo". */
export const RECIPE_VIEW_VOICE_OPTIONS = {
  autoStart: true,
  keepListeningWhileSpeaking: true,
  directCommands: true,
  activeListenMs: VOICE_ACTIVE_LISTEN_MS,
};
