// Read-side queries for the public site.

// Cape Verde is UTC-1 all year.
export function today() {
  return new Date(Date.now() - 3600e3).toISOString().slice(0, 10);
}

export async function getPartners(db) {
  const { results: partners } = await db.prepare('SELECT * FROM partners WHERE active = 1 ORDER BY sort, id').all();
  const { results: slots } = await db.prepare('SELECT slot, partner_id FROM placements').all();
  const byId = new Map(partners.map((p) => [p.id, p]));
  const placements = {};
  for (const s of slots) if (byId.has(s.partner_id)) placements[s.slot] = byId.get(s.partner_id);
  return { partners, placements };
}

export async function getTeams(db) {
  const { results } = await db.prepare('SELECT * FROM teams').all();
  return new Map(results.map((t) => [t.id, t]));
}

const MATCH_COLS = `m.*, c.name_en AS comp_en, c.name_pt AS comp_pt, c.kind AS comp_kind`;

export async function getLastResult(db) {
  return db.prepare(`SELECT ${MATCH_COLS} FROM matches m JOIN competitions c ON c.id = m.competition_id
    JOIN teams h ON h.id = m.home_id JOIN teams a ON a.id = m.away_id
    WHERE m.status = 'played' AND (h.is_us = 1 OR a.is_us = 1)
    ORDER BY m.date DESC, m.time DESC LIMIT 1`).first();
}

export async function getUpcoming(db, limit = 3) {
  const { results } = await db.prepare(`SELECT ${MATCH_COLS} FROM matches m JOIN competitions c ON c.id = m.competition_id
    JOIN teams h ON h.id = m.home_id JOIN teams a ON a.id = m.away_id
    WHERE m.status = 'scheduled' AND m.date >= ? AND c.archived = 0 AND (h.is_us = 1 OR a.is_us = 1)
    ORDER BY m.date, m.time IS NULL, m.time LIMIT ?`).bind(today(), limit).all();
  return results;
}

export async function getSeason(db) {
  const { results: comps } = await db.prepare('SELECT * FROM competitions WHERE archived = 0 ORDER BY sort, id').all();
  const { results: matches } = await db.prepare(`SELECT m.* FROM matches m JOIN competitions c ON c.id = m.competition_id
    WHERE c.archived = 0 ORDER BY m.date, m.time IS NULL, m.time, m.id`).all();
  const { results: ties } = await db.prepare('SELECT * FROM tie_order').all();
  return comps.map((c) => ({
    ...c,
    matches: matches.filter((m) => m.competition_id === c.id),
    tieOrder: Object.fromEntries(ties.filter((x) => x.competition_id === c.id).map((x) => [x.team_id, x.priority])),
  }));
}

export async function getNewsList(db, { limit = 100, includeDrafts = false } = {}) {
  const { results } = await db.prepare(`SELECT id, slug, status, date, category, read_min, image, image_pos, gfx_big,
      gfx_cap_en, gfx_cap_pt, title_en, title_pt, excerpt_en, excerpt_pt, substr(body_en, 1, 600) AS body_en, substr(body_pt, 1, 600) AS body_pt
    FROM news ${includeDrafts ? '' : "WHERE status = 'published'"} ORDER BY date DESC, id DESC LIMIT ?`).bind(limit).all();
  return results;
}

export async function getArticle(db, slug, { includeDrafts = false } = {}) {
  return db.prepare(`SELECT * FROM news WHERE slug = ? ${includeDrafts ? '' : "AND status = 'published'"}`).bind(slug).first();
}
