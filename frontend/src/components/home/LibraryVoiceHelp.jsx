/** PanKo — First-run tooltip for library voice commands. */
import { useEffect, useState } from 'react';

const TUTORIAL_SEEN_KEY = 'panko_library_voice_tutorial_seen';

export default function LibraryVoiceHelp() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    try {
      setShowBubble(localStorage.getItem(TUTORIAL_SEEN_KEY) !== '1');
    } catch {
      setShowBubble(false);
    }
  }, []);

  const markTutorialSeen = () => {
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
    } catch {
      // ignore storage errors
    }
    setShowBubble(false);
  };

  const openHelp = () => {
    markTutorialSeen();
    setHelpOpen(true);
  };

  const closeHelp = () => setHelpOpen(false);

  return (
    <>
      <div className="library-search__help-anchor">
        <button
          type="button"
          className={`library-search__help${showBubble ? ' library-search__help--highlight' : ''}`}
          onClick={openHelp}
          aria-label="Voice activation help"
          title="Voice commands help"
        >
          <i className="fa-solid fa-circle-question" aria-hidden="true" />
        </button>

        {showBubble && (
          <button
            type="button"
            className="library-voice-tutorial-bubble"
            onClick={openHelp}
            aria-label="Voice Activation Tutorial"
          >
            <span className="library-voice-tutorial-bubble__label">
              Voice Activation Tutorial
            </span>
          </button>
        )}
      </div>

      {helpOpen && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={closeHelp}
        >
          <div
            className="modal library-voice-help-modal"
            role="dialog"
            aria-labelledby="library-voice-help-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal__header">
              <h2 className="modal__title" id="library-voice-help-title">
                Voice commands
              </h2>
              <button
                type="button"
                className="modal__close"
                onClick={closeHelp}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal__body library-voice-help-modal__body">
              <p>
                Wake up the assistant by saying &quot;Hey PanKo&quot;.
              </p>
              <p>State your request right after, such as:</p>
              <ul className="library-voice-help-modal__list">
                <li>
                  <span aria-hidden="true"><i class="fa-solid fa-magnifying-glass"></i></span>{' '}
                  &quot;Search...&quot; to filter recipes.
                </li>
                <li>
                  <span aria-hidden="true"><i class="fa-solid fa-eye"></i></span>{' '}
                  &quot;View [Recipe Name]&quot; to open a dish.
                </li>
                <li>
                  <span aria-hidden="true"><i class="fa-solid fa-x"></i></span>{' '}
                  &quot;Clear search&quot; to reset the view.
                </li>
              </ul>
            </div>
            <div className="modal__footer">
              <button type="button" className="btn" onClick={closeHelp}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
