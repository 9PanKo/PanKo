/** PanKo — Floating mic toggle + status label helpers. */
export function getVoiceAssistantLabel({
  isListening,
  isAwaitingCommand = false,
  wakeWordMode = false,
  directCommandsMode = false,
}) {
  if (!isListening) {
    return wakeWordMode || directCommandsMode
      ? 'Voice assistant off'
      : 'Tap to Start Voice Assistant';
  }
  if (isAwaitingCommand) {
    return 'Hey PanKo — say a command…';
  }
  if (directCommandsMode) {
    return 'Listening for commands…';
  }
  if (wakeWordMode) {
    return 'Listening...';
  }
  return 'Listening…';
}

export default function VoiceAssistantFab({
  isListening,
  onToggle,
  isSupported = true,
  isAwaitingCommand = false,
  wakeWordMode = false,
  directCommandsMode = false,
  listeningLabel,
  idleLabel,
}) {
  if (!isSupported) return null;

  const label =
    listeningLabel && idleLabel
      ? isListening
        ? listeningLabel
        : idleLabel
      : getVoiceAssistantLabel({
          isListening,
          isAwaitingCommand,
          wakeWordMode,
          directCommandsMode,
        });

  return (
    <button
      type="button"
      className="voice-indicator voice-indicator--fixed"
      onClick={onToggle}
      aria-pressed={isListening}
      aria-label={label}
    >
      <span
        className={
          isListening || isAwaitingCommand ? 'listening-dot' : 'voice-indicator__dot'
        }
        aria-hidden="true"
      />
      <span className="voice-indicator__label">{label}</span>
    </button>
  );
}
