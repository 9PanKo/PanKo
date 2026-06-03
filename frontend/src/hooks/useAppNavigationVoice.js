import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoiceAssistant } from './useVoiceAssistant';
import { getAppNavigationVoiceCommands } from '../utils/appVoiceCommands';
import { VOICE_WAKE_OPTIONS } from '../utils/voiceOptions';

/** PanKo — Voice + nav on standalone pages (create, /chefseye). */
export function useAppNavigationVoice(voiceOptions = VOICE_WAKE_OPTIONS) {
  const navigate = useNavigate();

  const voiceCommands = useMemo(
    () =>
      getAppNavigationVoiceCommands((section) =>
        navigate(`/home?section=${section}`),
      ),
    [navigate],
  );

  return useVoiceAssistant(voiceCommands, voiceOptions);
}
