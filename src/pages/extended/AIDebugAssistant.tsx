import { useState } from 'react';
import { Bot, Lightbulb, Wrench } from 'lucide-react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? '';

async function analyzeErrorWithGemini(text: string): Promise<{ ok: boolean; fix: string; autoFix: string }> {
  if (!GEMINI_API_KEY) {
    return {
      ok: false,
      fix: 'Gemini API key is not configured. Set VITE_GEMINI_API_KEY in your .env file.',
      autoFix: '',
    };
  }
  if (!text || typeof text !== 'string') {
    return { ok: false, fix: 'No error text provided.', autoFix: '' };
  }

  const prompt = [
    'You are an AI debug assistant for npm, node, winget, and Windows developer tools.',
    'Given the following error output, respond ONLY with a JSON object with keys "fix" and "autoFix".',
    'The "fix" field should be a short explanation (2-4 sentences) of what is wrong and how to fix it.',
    'The "autoFix" field should be a single CLI command that can be run to fix the issue, or an empty string if no single safe command exists.',
    'Error output:',
    text,
  ].join('\n\n');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    return {
      ok: false,
      fix: `Gemini API request failed with status ${res.status}.`,
      autoFix: '',
    };
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const rawText = parts.map((p: { text?: string }) => p.text || '').join('\n').trim();

  let parsed: { fix?: string; autoFix?: string };
  try {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    parsed = JSON.parse(rawText.slice(start, end + 1));
  } catch {
    parsed = { fix: rawText || 'Unable to parse Gemini response.', autoFix: '' };
  }

  return {
    ok: true,
    fix: typeof parsed.fix === 'string' ? parsed.fix : String(parsed.fix ?? ''),
    autoFix: typeof parsed.autoFix === 'string' ? parsed.autoFix : '',
  };
}

export function AIDebugAssistant() {
  const [errorText, setErrorText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState<{ fix: string; autoFix: string } | null>(null);

  const analyze = async () => {
    if (!errorText.trim()) return;
    setAnalyzing(true);
    setSuggestion(null);

    try {
      const res = await analyzeErrorWithGemini(errorText);
      setSuggestion({ fix: res.fix, autoFix: res.autoFix });
    } catch (err) {
      setSuggestion({
        fix: `AI analysis failed: ${String(err)}`,
        autoFix: '',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>AI Debug Assistant</h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
          Paste error (e.g. npm ERR! code ERESOLVE). Get suggested fix and optional auto-fix. OpenAI API or offline rule engine.
        </p>
      </header>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Paste error output</label>
        <textarea
          value={errorText}
          onChange={(e) => setErrorText(e.target.value)}
          placeholder="e.g. npm ERR! code ERESOLVE..."
          rows={6}
          style={{ width: '100%', padding: 14, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'Consolas, monospace', resize: 'vertical' }}
        />
        <button type="button" onClick={analyze} disabled={analyzing || !errorText.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: analyzing ? 'wait' : 'pointer', alignSelf: 'flex-start' }}>
          <Bot size={18} />
          {analyzing ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {suggestion && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={20} style={{ color: 'var(--warning)' }} />
            Suggested fix
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{suggestion.fix}</p>
          {suggestion.autoFix && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <code style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-primary)', fontSize: 12, fontFamily: 'Consolas, monospace', color: 'var(--text-primary)' }}>{suggestion.autoFix}</code>
              <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, border: 'none', background: 'var(--success)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <Wrench size={16} />
                Auto-Fix
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
