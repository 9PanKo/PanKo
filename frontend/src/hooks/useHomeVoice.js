/** PanKo — Home voice: nav commands + library search hooks. */
import { useMemo } from 'react';
import { useVoiceAssistant } from './useVoiceAssistant';
import { getAppNavigationVoiceCommands } from '../utils/appVoiceCommands';
import { VOICE_WAKE_OPTIONS } from '../utils/voiceOptions';
import { getVoiceAssistantLabel } from '../components/VoiceAssistantFab';

export function useHomeVoice({
  setActiveSection,
  libraryVoiceCommands = [],
  onFinalTranscriptRef,
}) {
  const voiceCommands = useMemo(
    () => [...getAppNavigationVoiceCommands(setActiveSection), ...libraryVoiceCommands],
    [setActiveSection, libraryVoiceCommands],
  );

  const voice = useVoiceAssistant(voiceCommands, {
    ...VOICE_WAKE_OPTIONS,
    onFinalTranscriptRef,
  });

  const voiceLabel = getVoiceAssistantLabel({
    isListening: voice.isListening,
    isAwaitingCommand: voice.isAwaitingCommand,
    wakeWordMode: voice.wakeWordMode,
  });

  return { ...voice, voiceLabel };
}
