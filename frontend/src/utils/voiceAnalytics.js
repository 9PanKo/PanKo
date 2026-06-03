import { supabase } from '../supabaseClient';

/** PanKo — Log voice commands for admin analytics (fire-and-forget). */
export function logVoiceCommand({ commandText, wakePhraseUsed = false, pageContext = '' }) {
  const text = String(commandText || '').trim();
  if (!text) return;

  supabase.auth.getUser().then(({ data: { user } }) => {
    supabase.from('voice_analytics_logs').insert([
      {
        user_id: user?.id ?? null,
        command_text: text.slice(0, 500),
        wake_phrase_used: Boolean(wakePhraseUsed),
        page_context: pageContext.slice(0, 120),
      },
    ]);
  });
}
