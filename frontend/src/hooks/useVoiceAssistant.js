/** PanKo — Core speech recognition: wake word, commands, timeouts. */
import { useState, useEffect, useRef, useCallback } from 'react';
import { logVoiceCommand } from '../utils/voiceAnalytics';
import {
  containsHeyPanko,
  textAfterHeyPanko,
  getLatestPhraseFromEvent,
  eventHasWakePhrase,
  normalizeSpeech,
} from '../utils/wakePhrase';

const DEFAULT_COMMAND_WINDOW_MS = 3000;
const DEFAULT_ACTIVE_LISTEN_MS = 3000;
const MAX_COMMAND_PHRASE_WORDS = 10;

export function useVoiceAssistant(commands, options = {}) {
  const {
    maxListenMs,
    activeListenMs = maxListenMs ?? DEFAULT_ACTIVE_LISTEN_MS,
    wakePhrase = null,
    autoStart = false,
    keepListeningWhileSpeaking = false,
    directCommands = false,
    onFinalTranscriptRef = null,
    commandWindowMs = DEFAULT_COMMAND_WINDOW_MS,
    pageContext = '',
  } = options;
  const directCommandsMode = Boolean(directCommands);
  const wakeWordMode = Boolean(wakePhrase) && !directCommandsMode;
  const continuousListen = wakeWordMode || directCommandsMode;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [voiceSessionActive, setVoiceSessionActive] = useState(false);
  const [isAwaitingCommand, setIsAwaitingCommand] = useState(false);

  const recognitionRef = useRef(null);
  const listenTimeoutRef = useRef(null);
  const commandWindowTimeoutRef = useRef(null);
  const commandsRef = useRef(commands);
  const wantsListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const commandWindowActiveRef = useRef(false);
  const wakePhraseRef = useRef(wakePhrase || 'hey panko');
  const wakeWordModeRef = useRef(wakeWordMode);
  const directCommandsModeRef = useRef(directCommandsMode);
  const continuousListenRef = useRef(continuousListen);
  const activeListenMsRef = useRef(activeListenMs);
  const keepListeningWhileSpeakingRef = useRef(keepListeningWhileSpeaking);
  const commandWindowMsRef = useRef(commandWindowMs);
  const pageContextRef = useRef(pageContext);

  commandsRef.current = commands;
  wakePhraseRef.current = wakePhrase || 'hey panko';
  wakeWordModeRef.current = wakeWordMode;
  directCommandsModeRef.current = directCommandsMode;
  continuousListenRef.current = continuousListen;
  activeListenMsRef.current = activeListenMs;
  keepListeningWhileSpeakingRef.current = keepListeningWhileSpeaking;
  commandWindowMsRef.current = commandWindowMs;
  pageContextRef.current = pageContext;

  const clearListenTimeout = useCallback(() => {
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }
  }, []);

  const clearCommandWindow = useCallback(() => {
    if (commandWindowTimeoutRef.current) {
      clearTimeout(commandWindowTimeoutRef.current);
      commandWindowTimeoutRef.current = null;
    }
    commandWindowActiveRef.current = false;
    setIsAwaitingCommand(false);
  }, []);

  const openCommandWindow = useCallback(() => {
    if (commandWindowTimeoutRef.current) {
      clearTimeout(commandWindowTimeoutRef.current);
    }
    commandWindowActiveRef.current = true;
    setIsAwaitingCommand(true);
    commandWindowTimeoutRef.current = setTimeout(() => {
      commandWindowActiveRef.current = false;
      setIsAwaitingCommand(false);
      commandWindowTimeoutRef.current = null;
    }, commandWindowMsRef.current);
  }, []);

  const isShortCommandPhrase = (text) =>
    text.split(/\s+/).filter(Boolean).length <= MAX_COMMAND_PHRASE_WORDS;

  const startActiveListenCap = useCallback(() => {
    clearListenTimeout();
    const ms = activeListenMsRef.current;
    if (!ms || !wantsListeningRef.current) return;

    listenTimeoutRef.current = setTimeout(() => {
      listenTimeoutRef.current = null;
      if (continuousListenRef.current) {
        clearCommandWindow();
        try {
          recognitionRef.current?.stop();
        } catch {
          // onend restarts when still wanted
        }
      } else {
        wantsListeningRef.current = false;
        setVoiceSessionActive(false);
        recognitionRef.current?.stop();
      }
    }, ms);
  }, [clearListenTimeout, clearCommandWindow]);

  const restartListening = useCallback(() => {
    if (!wantsListeningRef.current) return;
    if (
      isSpeakingRef.current &&
      !keepListeningWhileSpeakingRef.current
    ) {
      return;
    }
    try {
      recognitionRef.current?.start();
    } catch {
      // Already running; ignore.
    }
  }, []);

  const tryCustomTranscript = (spokenText, isFinal) => {
    const handler = onFinalTranscriptRef?.current;
    if (!handler) return false;
    return handler(normalizeSpeech(spokenText), isFinal) === true;
  };

  const runCommands = (spokenText) => {
    const sorted = [...commandsRef.current].sort(
      (a, b) => b.word.length - a.word.length,
    );
    for (const cmd of sorted) {
      const matches = cmd.match
        ? cmd.match(spokenText)
        : spokenText.includes(cmd.word.toLowerCase());
      if (matches) {
        logVoiceCommand({
          commandText: spokenText,
          wakePhraseUsed: wakeWordModeRef.current,
          pageContext: pageContextRef.current || window.location.pathname,
        });
        cmd.action(spokenText);
        return true;
      }
    }
    return false;
  };

  const handleWakeWordResult = (spokenText, isFinal, event) => {
    if (!isFinal) return;

    if (commandWindowActiveRef.current) {
      const normalized = normalizeSpeech(spokenText);
      if (!isShortCommandPhrase(normalized)) {
        clearCommandWindow();
        return;
      }
      const handled =
        tryCustomTranscript(spokenText, true) || runCommands(normalized);
      if (handled) {
        clearCommandWindow();
      } else {
        openCommandWindow();
      }
      return;
    }

    const hasWake = event
      ? eventHasWakePhrase(event)
      : containsHeyPanko(spokenText);
    if (!hasWake) return;

    const afterWake = textAfterHeyPanko(spokenText);
    if (afterWake) {
      if (tryCustomTranscript(afterWake, true)) return;
      if (runCommands(afterWake)) return;
    }
    openCommandWindow();
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuousListen;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setIsListening(true);
      startActiveListenCap();
    };

    recognition.onend = () => {
      clearListenTimeout();
      setIsListening(false);
      if (
        wantsListeningRef.current &&
        (!isSpeakingRef.current || keepListeningWhileSpeakingRef.current)
      ) {
        restartListening();
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      console.error('Speech recognition error:', event.error);
    };

    const resetAfterPhrase = () => {
      if (!wantsListeningRef.current) return;
      if (isSpeakingRef.current && !keepListeningWhileSpeakingRef.current) {
        return;
      }
      try {
        recognition.stop();
      } catch {
        // onend restarts listening with a clean phrase buffer
      }
    };

    recognition.onresult = (event) => {
      const { phraseFinal, phraseDisplay, isFinal } =
        getLatestPhraseFromEvent(event);

      if (!phraseDisplay) return;

      setTranscript(phraseDisplay);

      if (isFinal && tryCustomTranscript(phraseFinal || phraseDisplay, true)) {
        if (wakeWordModeRef.current) resetAfterPhrase();
        return;
      }

      if (wakeWordModeRef.current) {
        handleWakeWordResult(phraseFinal || phraseDisplay, isFinal, event);
        if (isFinal) resetAfterPhrase();
        return;
      }

      if (!isFinal) return;

      let commandText = normalizeSpeech(phraseFinal);
      if (containsHeyPanko(commandText)) {
        const afterWake = textAfterHeyPanko(commandText);
        if (afterWake) commandText = afterWake;
      }
      if (!tryCustomTranscript(commandText, true)) {
        runCommands(commandText);
      }
      if (directCommandsModeRef.current) resetAfterPhrase();
    };

    recognitionRef.current = recognition;

    if (autoStart) {
      wantsListeningRef.current = true;
      setVoiceSessionActive(true);
      try {
        recognition.start();
      } catch (e) {
        console.error('Failed to start background listening:', e);
      }
    }

    return () => {
      wantsListeningRef.current = false;
      clearListenTimeout();
      clearCommandWindow();
      recognition.stop();
    };
  }, [autoStart, continuousListen, clearListenTimeout, clearCommandWindow, restartListening, openCommandWindow, startActiveListenCap]);

  const toggleListening = useCallback(() => {
    if (wantsListeningRef.current) {
      wantsListeningRef.current = false;
      setVoiceSessionActive(false);
      isSpeakingRef.current = false;
      clearCommandWindow();
      window.speechSynthesis.cancel();
      clearListenTimeout();
      recognitionRef.current?.stop();
    } else {
      wantsListeningRef.current = true;
      setVoiceSessionActive(true);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error('Failed to start mic:', e);
      }
    }
  }, [clearListenTimeout, clearCommandWindow]);

  const resumeAfterSpeak = useCallback(() => {
    isSpeakingRef.current = false;
    if (wantsListeningRef.current) {
      restartListening();
    }
  }, [restartListening]);

  const speak = useCallback(
    (text) => {
      if (!text) return;

      const keepMicOn = keepListeningWhileSpeakingRef.current;

      if (!keepMicOn) {
        isSpeakingRef.current = true;
        recognitionRef.current?.stop();
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;

      if (!keepMicOn) {
        utterance.onend = resumeAfterSpeak;
        utterance.onerror = resumeAfterSpeak;
      }

      window.speechSynthesis.speak(utterance);
    },
    [resumeAfterSpeak],
  );

  return {
    isListening,
    toggleListening,
    transcript,
    speak,
    isSupported,
    activeListenMs,
    voiceSessionActive,
    isAwaitingCommand,
    wakeWordMode,
    directCommandsMode,
  };
}
