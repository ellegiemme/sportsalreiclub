// AI translation of a news article between Portuguese (pt-PT) and English, for the admin.
// Needs the ANTHROPIC_API_KEY secret on the Worker.
import Anthropic from '@anthropic-ai/sdk';

const FIELDS = ['title', 'excerpt', 'body', 'pull', 'gfx_cap'];

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [...FIELDS, 'facts'],
  properties: {
    ...Object.fromEntries(FIELDS.map((f) => [f, { type: 'string' }])),
    facts: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
  },
};

const SYSTEM = `You translate news articles for the website of Sport Sal Rei Club, a football club from Sal Rei, on the island of Boa Vista, Cape Verde.

Rules:
- Portuguese means European Portuguese as written in Cape Verde (pt-PT spelling and football vocabulary: "equipa", "guarda-redes", "golo", "jornada", "época", "plantel").
- English means British English.
- Keep names of people, clubs, competitions, stadiums and places exactly as written (Liga Kabrer, Taça Bubista, Estádio Arsénio Ramos, Supertaça...).
- "body" is HTML. Keep every tag and attribute exactly as it is (p, p class="lead", h2, h3, ul, ol, li, strong, em, a, blockquote); translate only the text between tags.
- "facts" is a list of [label, value] pairs: translate both, keep the order.
- Keep the tone of the original: factual, warm, proud of the club. Do not add, remove or invent information.
- If a field is empty, return it empty.`;

export async function translateArticle(env, from, to, fields) {
  if (!env.ANTHROPIC_API_KEY) throw new Error('missing-key');
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const source = { ...Object.fromEntries(FIELDS.map((f) => [f, fields[f] || ''])), facts: fields.facts || [] };
  const names = { pt: 'Portuguese (pt-PT)', en: 'English' };

  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: `Translate this article from ${names[from]} to ${names[to]}. Return the same fields.\n\n${JSON.stringify(source, null, 2)}`,
    }],
  });

  if (response.stop_reason === 'refusal') throw new Error('refused');
  if (response.stop_reason === 'max_tokens') throw new Error('too-long');
  const text = response.content.find((b) => b.type === 'text')?.text;
  if (!text) throw new Error('empty');
  return JSON.parse(text);
}
