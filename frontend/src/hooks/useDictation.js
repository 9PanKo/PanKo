/** PanKo — One-shot Web Speech dictation for form fields. */
import { useState, useRef } from 'react';

export function useDictation() {
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef(null);

  const startDictating = (onComplete) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsDictating(true);
    recognition.onend = () => setIsDictating(false);

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript.trim();
      onComplete(spokenText);
    };

    recognition.onerror = () => setIsDictating(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  return { isDictating, startDictating };
}
