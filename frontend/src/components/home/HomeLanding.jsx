/** PanKo — Home landing: wake phrase + voice status. */
export default function HomeLanding({
  isSupported,
  isListening,
  voiceLabel,
  transcript,
  onToggleListening,
}) {
  return (
    <section className="home-section home-landing">
      <div className="home-landing__content">
        <h1 className="home-landing__title">Welcome to PanKo!</h1>
        <p className="home-landing__tagline">
          Cooking made easy—hands-free recipes, step-by-step guidance, and voice
          control so you can focus on the food, not the screen. Start cooking now
          and let PanKo walk you through every step.
        </p>

        <h2 className="home-landing__prompt">What do you want to do?</h2>

        <div className="home-voice-panel">
          {!isSupported ? (
            <p className="home-voice-panel__warning">
              Voice features work best in Chrome or Edge.
            </p>
          ) : (
            <>
              <button
                type="button"
                className="voice-indicator"
                onClick={onToggleListening}
              >
                <span
                  className={
                    isListening ? 'listening-dot' : 'voice-indicator__dot'
                  }
                  aria-hidden="true"
                />
                <span style={{ fontWeight: 'bold' }}>{voiceLabel}</span>
              </button>
              <div className="home-voice-panel__status">
                <p className="home-voice-panel__heard">
                  Last heard: <em>{transcript || 'Nothing yet…'}</em>
                </p>
                <div className="home-voice-panel__hints">
                  <span className="home-voice-panel__hints-line home-voice-panel__hints-line--title">
                    Talk to PanKo!
                  </span>
                  <span className="home-voice-panel__hints-line">
                    Wake up the assistant by saying &quot;Hey PanKo&quot;, then give a
                    command like:
                  </span>
                  <span className="home-voice-panel__hints-line">
                    &quot;Go to Profile&quot;/&quot;Profile&quot;
                  </span>
                  <span className="home-voice-panel__hints-line">
                    &quot;Go to Library&quot;/&quot;Recipes&quot;
                  </span>
                  <span className="home-voice-panel__hints-line">
                    &quot;Go to Chef&apos;s Eye&quot;/&quot;Chef&apos;s Eye&quot;
                  </span>
                  <span className="home-voice-panel__hints-line">
                    &quot;Go to Blog&quot;/&quot;Blog&quot;
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
