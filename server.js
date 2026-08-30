require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || '*').split(',').map(o => o.trim());

app.use(cors({ origin: ALLOWED_ORIGINS.includes('*') ? true : ALLOWED_ORIGINS }));
app.use(express.json({ limit: '200kb' }));

app.get('/', (req, res) => res.send('Scholr AI backend is running.'));

// ---------- shared helpers ----------

function requireKey(res) {
  if (!GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY environment variable.');
    res.status(500).json({ error: 'The server is not configured with an API key yet.' });
    return false;
  }
  return true;
}

function buildContents(message, history) {
  const contents = [];
  if (Array.isArray(history)) {
    for (const turn of history.slice(-10)) {
      if (turn && (turn.role === 'user' || turn.role === 'assistant') &&
          typeof turn.content === 'string' && turn.content.length <= 4000) {
        contents.push({ role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: turn.content }] });
      }
    }
  }
  contents.push({ role: 'user', parts: [{ text: message }] });
  return contents;
}

// Non-streaming Gemini call used by the utility endpoints (summarize, quiz, etc.)
// generationConfig.maxOutputTokens keeps these fast + focused instead of rambling.
// A hard timeout means a slow/hung Gemini call fails cleanly instead of hanging the request.
const GEMINI_TIMEOUT_MS = 25000;

async function geminiGenerate(promptText, systemText, maxOutputTokens = 1200) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        systemInstruction: { parts: [{ text: systemText }] },
        generationConfig: { maxOutputTokens, temperature: 0.6 }
      }),
      signal: controller.signal
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Gemini error ${res.status}: ${errText}`);
    }
    const data = await res.json();
    return (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Gemini request timed out');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function textField(req, res, field, max = 6000) {
  const val = req.body && req.body[field];
  if (!val || typeof val !== 'string' || !val.trim()) {
    res.status(400).json({ error: `A "${field}" string is required.` });
    return null;
  }
  if (val.length > max) {
    res.status(400).json({ error: `"${field}" is too long (max ${max} chars).` });
    return null;
  }
  return val;
}

const CHAT_SYSTEM =
  "You're Scholr's study assistant for IB students. Help with homework, study tips, and planning. " +
  "Be clear, encouraging, and concise. Use markdown (**bold**, ## headers, - lists) to structure longer " +
  "answers. Write math in LaTeX: $...$ inline, $$...$$ for display.";

// ---------- 1. Streaming chat assistant ----------
// POST { message, history } -> SSE stream: data: {"text":"..."} ... data: {"done":true}
app.post('/api/chat', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const message = textField(req, res, 'message', 4000);
    if (!message) return;
    const { history } = req.body || {};

    const contents = buildContents(message, history);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;
    const streamController = new AbortController();
    const streamTimer = setTimeout(() => streamController.abort(), GEMINI_TIMEOUT_MS);

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: CHAT_SYSTEM }] },
        generationConfig: { maxOutputTokens: 2800, temperature: 0.6 }
      }),
      signal: streamController.signal
    }).finally(() => clearTimeout(streamTimer));

    if (!geminiRes.ok || !geminiRes.body) {
      const errText = await geminiRes.text().catch(() => '');
      console.error('Gemini API error:', geminiRes.status, errText);
      return res.status(502).json({ error: 'The AI service returned an error. Please try again shortly.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const reader = geminiRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const text = (parsed?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        } catch (_) { /* partial JSON fragment, ignore */ }
      }
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Unexpected error in /api/chat:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Something went wrong on the server.' });
    else { res.write(`data: ${JSON.stringify({ error: 'Something went wrong on the server.' })}\n\n`); res.end(); }
  }
});

// ---------- 2. Summarize a note ----------
// POST { text } -> { summary }
app.post('/api/summarize', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const text = textField(req, res, 'text');
    if (!text) return;
    const summary = await geminiGenerate(
      `Summarize the following student note in 3-6 concise bullet points:\n\n${text}`,
      'You produce short, clear study summaries in plain text with "- " bullet points. No preamble.',
      900
    );
    res.json({ summary });
  } catch (err) {
    console.error('Error in /api/summarize:', err);
    res.status(502).json({ error: 'Could not generate a summary right now.' });
  }
});

// ---------- 3. Generate flashcards from a note ----------
// POST { text, count? } -> { flashcards: [{question, answer}, ...] }
app.post('/api/flashcards', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const text = textField(req, res, 'text');
    if (!text) return;
    let count = parseInt(req.body.count, 10);
    if (!Number.isFinite(count) || count < 1) count = 8;
    count = Math.min(count, 15);

    const raw = await geminiGenerate(
      `Create exactly ${count} flashcards (question + answer) from this study material:\n\n${text}\n\n` +
      `Respond ONLY with valid JSON: an array of objects like [{"question":"...","answer":"..."}]. No markdown, no extra text.`,
      'You output only strict, valid JSON — nothing else. No code fences, no commentary.',
      2000
    );

    let flashcards;
    try {
      const cleaned = raw.replace(/^```json\s*|\s*```$/g, '').trim();
      flashcards = JSON.parse(cleaned);
      if (!Array.isArray(flashcards)) throw new Error('not an array');
    } catch (parseErr) {
      return res.status(502).json({ error: 'The AI returned an unexpected format. Please try again.' });
    }
    res.json({ flashcards });
  } catch (err) {
    console.error('Error in /api/flashcards:', err);
    res.status(502).json({ error: 'Could not generate flashcards right now.' });
  }
});

// ---------- 4. Generate a short quiz from a note ----------
// POST { text, count? } -> { questions: [{question, options:[...], answerIndex}] }
app.post('/api/quiz', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const text = textField(req, res, 'text');
    if (!text) return;
    let count = parseInt(req.body.count, 10);
    if (!Number.isFinite(count) || count < 1) count = 5;
    count = Math.min(count, 10);

    const raw = await geminiGenerate(
      `Create exactly ${count} multiple-choice quiz questions from this study material:\n\n${text}\n\n` +
      `Respond ONLY with valid JSON: an array like ` +
      `[{"question":"...","options":["A","B","C","D"],"answerIndex":0}]. answerIndex is 0-based. No markdown, no extra text.`,
      'You output only strict, valid JSON — nothing else. No code fences, no commentary.',
      2200
    );

    let questions;
    try {
      const cleaned = raw.replace(/^```json\s*|\s*```$/g, '').trim();
      questions = JSON.parse(cleaned);
      if (!Array.isArray(questions)) throw new Error('not an array');
    } catch (parseErr) {
      return res.status(502).json({ error: 'The AI returned an unexpected format. Please try again.' });
    }
    res.json({ questions });
  } catch (err) {
    console.error('Error in /api/quiz:', err);
    res.status(502).json({ error: 'Could not generate a quiz right now.' });
  }
});

// ---------- 5. Explain / simplify a concept ----------
// POST { text, level? } -> { explanation }  (level: "simple" | "detailed", default "simple")
app.post('/api/explain', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const text = textField(req, res, 'text');
    if (!text) return;
    const level = req.body.level === 'detailed' ? 'detailed' : 'simple';
    const instruction = level === 'detailed'
      ? 'Give a thorough but well-organized explanation with headers/sections where useful.'
      : 'Explain it as simply as possible, like to a student seeing it for the first time. Short paragraphs.';

    const explanation = await geminiGenerate(
      `Explain the following concept/question:\n\n${text}`,
      `You are a patient tutor. ${instruction} Use LaTeX ($...$ / $$...$$) for any math.`,
      1500
    );
    res.json({ explanation });
  } catch (err) {
    console.error('Error in /api/explain:', err);
    res.status(502).json({ error: 'Could not generate an explanation right now.' });
  }
});

// ---------- 6. Grammar / writing polish for notes ----------
// POST { text } -> { improved }
app.post('/api/polish', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const text = textField(req, res, 'text');
    if (!text) return;
    const improved = await geminiGenerate(
      `Fix grammar, spelling, and clarity in this student writing, keeping the original meaning and voice. ` +
      `Return ONLY the corrected text, nothing else:\n\n${text}`,
      'You are a careful copy editor. Output only the corrected text — no notes, no preamble.',
      1600
    );
    res.json({ improved });
  } catch (err) {
    console.error('Error in /api/polish:', err);
    res.status(502).json({ error: 'Could not polish this text right now.' });
  }
});


// ---------- 7. Essay writing assistant ----------
// POST { topic, wordCount?, tone? } -> { essay }
app.post('/api/essay', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const topic = textField(req, res, 'topic', 1000);
    if (!topic) return;
    let wordCount = parseInt(req.body.wordCount, 10);
    if (!Number.isFinite(wordCount) || wordCount < 50) wordCount = 400;
    wordCount = Math.min(wordCount, 2000);
    const tone = typeof req.body.tone === 'string' && req.body.tone.trim() ? req.body.tone.trim() : 'academic';

    const essay = await geminiGenerate(
      `Write a ${wordCount}-word ${tone} essay on: ${topic}\n\n` +
      `Give it a clear thesis, organized paragraphs, and a conclusion. Plain text, no markdown headers.`,
      'You are a skilled student essay-writing assistant. Write original, well-structured essays. ' +
      'This is a drafting aid for a student to learn from and edit, not a final submission.',
      4000
    );
    res.json({ essay });
  } catch (err) {
    console.error('Error in /api/essay:', err);
    res.status(502).json({ error: 'Could not draft an essay right now.' });
  }
});

// ---------- 8. Note-taking assistant ----------
// POST { text } -> { notes }  (turns raw text/lecture transcript into structured notes)
app.post('/api/notes', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const text = textField(req, res, 'text');
    if (!text) return;
    const notes = await geminiGenerate(
      `Turn the following material into clean, well-organized study notes with short headers and ` +
      `"- " bullet points. Keep key terms, definitions, and important facts. Use LaTeX ($...$) for any math. ` +
      `Keep it well-organized but thorough — aim for well under 600 words, and make sure you finish your last ` +
      `sentence/bullet rather than cutting off mid-thought:\n\n${text}`,
      'You are an expert note-taker for students. Be concise. Output only the notes, no preamble.',
      2200
    );
    res.json({ notes });
  } catch (err) {
    console.error('Error in /api/notes:', err);
    res.status(502).json({ error: 'Could not generate notes right now.' });
  }
});

// ---------- 9. Essay/report outline generator ----------
// POST { topic } -> { outline }
app.post('/api/outline', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const topic = textField(req, res, 'topic', 1000);
    if (!topic) return;
    const outline = await geminiGenerate(
      `Create a detailed essay/report outline for: ${topic}\n\n` +
      `Include an intro with thesis, 3-5 main sections each with sub-points, and a conclusion.`,
      'You output clear, numbered/nested outlines only, no extra commentary.',
      1300
    );
    res.json({ outline });
  } catch (err) {
    console.error('Error in /api/outline:', err);
    res.status(502).json({ error: 'Could not generate an outline right now.' });
  }
});

// ---------- 10. Study plan generator ----------
// POST { text, days? } -> { plan }
app.post('/api/studyplan', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const text = textField(req, res, 'text');
    if (!text) return;
    let days = parseInt(req.body.days, 10);
    if (!Number.isFinite(days) || days < 1) days = 7;
    days = Math.min(days, 30);

    const plan = await geminiGenerate(
      `Create a ${days}-day study plan to master this material:\n\n${text}\n\n` +
      `Format as "Day 1: ...", "Day 2: ...", etc., with specific, realistic daily tasks.`,
      'You are a study-planning assistant. Output only the day-by-day plan, no extra commentary.',
      1700
    );
    res.json({ plan });
  } catch (err) {
    console.error('Error in /api/studyplan:', err);
    res.status(502).json({ error: 'Could not generate a study plan right now.' });
  }
});

// ---------- 11. Rewrite / paraphrase / tone adjust ----------
// POST { text, tone? } -> { rewritten }  (tone: "formal" | "casual" | "concise" | "simpler", default "clearer")
app.post('/api/rewrite', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const text = textField(req, res, 'text');
    if (!text) return;
    const tone = typeof req.body.tone === 'string' && req.body.tone.trim() ? req.body.tone.trim() : 'clearer';

    const rewritten = await geminiGenerate(
      `Rewrite the following text to be ${tone}, keeping the same meaning. Return ONLY the rewritten text:\n\n${text}`,
      'You are a careful writing assistant. Output only the rewritten text — no notes, no preamble.',
      1500
    );
    res.json({ rewritten });
  } catch (err) {
    console.error('Error in /api/rewrite:', err);
    res.status(502).json({ error: 'Could not rewrite this text right now.' });
  }
});


// ---------- 12. Translate ----------
// POST { text, targetLanguage } -> { translated }
app.post('/api/translate', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const text = textField(req, res, 'text');
    if (!text) return;
    const targetLanguage = (typeof req.body.targetLanguage === 'string' && req.body.targetLanguage.trim()) || 'Spanish';
    const translated = await geminiGenerate(
      `Translate the following text to ${targetLanguage}. Return ONLY the translation:\n\n${text}`,
      'You are a precise translator. Output only the translated text — no notes.',
      1500
    );
    res.json({ translated });
  } catch (err) {
    console.error('Error in /api/translate:', err);
    res.status(502).json({ error: 'Could not translate this text right now.' });
  }
});

// ---------- 13. Brainstorm ideas ----------
// POST { topic, count? } -> { ideas: string[] }
app.post('/api/brainstorm', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const topic = textField(req, res, 'topic', 1000);
    if (!topic) return;
    let count = parseInt(req.body.count, 10);
    if (!Number.isFinite(count) || count < 1) count = 8;
    count = Math.min(count, 15);
    const raw = await geminiGenerate(
      `Brainstorm exactly ${count} distinct, creative ideas for: ${topic}\n\n` +
      `Respond ONLY with valid JSON: an array of short strings, e.g. ["idea 1","idea 2"]. No markdown, no extra text.`,
      'You output only strict, valid JSON — nothing else.',
      1400
    );
    let ideas;
    try {
      const cleaned = raw.replace(/^```json\s*|\s*```$/g, '').trim();
      ideas = JSON.parse(cleaned);
      if (!Array.isArray(ideas)) throw new Error('not an array');
    } catch (parseErr) {
      return res.status(502).json({ error: 'The AI returned an unexpected format. Please try again.' });
    }
    res.json({ ideas });
  } catch (err) {
    console.error('Error in /api/brainstorm:', err);
    res.status(502).json({ error: 'Could not brainstorm ideas right now.' });
  }
});

// ---------- 14. Citation generator ----------
// POST { source, style? } -> { citation }  (style: "APA" | "MLA" | "Chicago", default "APA")
app.post('/api/citation', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const source = textField(req, res, 'source', 1500);
    if (!source) return;
    const style = (typeof req.body.style === 'string' && req.body.style.trim()) || 'APA';
    const citation = await geminiGenerate(
      `Generate a ${style}-style citation for this source (infer missing details reasonably, note any assumptions ` +
      `briefly in [brackets] only if necessary): ${source}`,
      `You are a citation assistant. Output only the ${style} citation (plus brief bracketed notes only if truly needed).`,
      400
    );
    res.json({ citation });
  } catch (err) {
    console.error('Error in /api/citation:', err);
    res.status(502).json({ error: 'Could not generate a citation right now.' });
  }
});


// ---------- 15. Exam study-plan content generator ----------
// POST { topics: string[], examTitle, dayCount } -> { days: [ [taskString,...], ... ] }
// Content-only: the frontend supplies the actual calendar dates and just
// asks the AI to fill in what to study/do on each of dayCount days.
app.post('/api/examplan', async (req, res) => {
  try {
    if (!requireKey(res)) return;
    const { topics, examTitle } = req.body || {};
    let dayCount = parseInt(req.body.dayCount, 10);
    if (!Number.isFinite(dayCount) || dayCount < 1) {
      return res.status(400).json({ error: 'A valid "dayCount" is required.' });
    }
    dayCount = Math.min(dayCount, 30);
    const topicList = Array.isArray(topics) ? topics.filter(t => typeof t === 'string' && t.trim()).slice(0, 30) : [];
    const title = (typeof examTitle === 'string' && examTitle.trim()) ? examTitle.trim() : 'this exam';

    const raw = await geminiGenerate(
      `Create a day-by-day study plan with exactly ${dayCount} days for an upcoming exam titled "${title}"` +
      (topicList.length ? ` covering these topics: ${topicList.join(', ')}.` : ' (no specific topics given — use general review tasks).') +
      ` Distribute topics across the earlier days; make the final day (or two) cumulative review and practice/self-quiz. ` +
      `Respond ONLY with valid JSON: an array of exactly ${dayCount} arrays, one per day in order, each containing 1-2 short, ` +
      `specific, actionable task strings for that day. No markdown, no extra text.`,
      'You output only strict, valid JSON — nothing else. No code fences, no commentary.',
      1900
    );

    let days;
    try {
      const cleaned = raw.replace(/^```json\s*|\s*```$/g, '').trim();
      days = JSON.parse(cleaned);
      if (!Array.isArray(days)) throw new Error('not an array');
    } catch (parseErr) {
      return res.status(502).json({ error: 'The AI returned an unexpected format. Please try again.' });
    }
    res.json({ days });
  } catch (err) {
    console.error('Error in /api/examplan:', err);
    res.status(502).json({ error: 'Could not generate an exam study plan right now.' });
  }
});

app.listen(PORT, () => console.log(`Scholr AI backend listening on http://localhost:${PORT}`));
