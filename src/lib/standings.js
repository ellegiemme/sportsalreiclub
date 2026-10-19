// League table from played matches.
// Points 3/1/0 (FCF Regulamento Geral, art. 93). Teams level on points are separated by
// (FCF art. 95, extended to 3+ teams the way the Portuguese federation does it):
//   1. points in the matches between the tied teams
//   2. goal difference in those matches
//   3. goals scored in those matches
//   (1–3 re-applied to any smaller group still level)
//   4. overall goal difference
//   5. overall goals scored
//   6. manual order (drawing of lots / play-off), from the tie_order table
// The ARFBV has not published its own regulation; change the order here if it does.

function blank(team) {
  return { team, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
}

function tally(teamIds, matches) {
  const rows = new Map(teamIds.map((id) => [id, blank(id)]));
  for (const m of matches) {
    const h = rows.get(m.home_id), a = rows.get(m.away_id);
    if (!h || !a) continue;
    h.p++; a.p++;
    h.gf += m.home_score; h.ga += m.away_score;
    a.gf += m.away_score; a.ga += m.home_score;
    if (m.home_score > m.away_score) { h.w++; a.l++; h.pts += 3; }
    else if (m.home_score < m.away_score) { a.w++; h.l++; a.pts += 3; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  }
  for (const r of rows.values()) r.gd = r.gf - r.ga;
  return rows;
}

// Split `ids` into ordered groups by key (higher is better), keeping equal keys together.
function groupBy(ids, key) {
  const sorted = [...ids].sort((x, y) => key(y) - key(x));
  const groups = [];
  for (const id of sorted) {
    const last = groups[groups.length - 1];
    if (last && key(last[0]) === key(id)) last.push(id); else groups.push([id]);
  }
  return groups;
}

function headToHead(ids, played, depth = 0) {
  if (ids.length < 2) return [ids];
  const set = new Set(ids);
  const mini = tally(ids, played.filter((m) => set.has(m.home_id) && set.has(m.away_id)));
  const keys = [(id) => mini.get(id).pts, (id) => mini.get(id).gd, (id) => mini.get(id).gf];
  let groups = [ids];
  for (const k of keys) groups = groups.flatMap((g) => (g.length > 1 ? groupBy(g, k) : [g]));
  // A smaller group that is still level starts again with only its own matches.
  if (groups.length > 1 && depth < 5) {
    groups = groups.flatMap((g) => (g.length > 1 && g.length < ids.length ? headToHead(g, played, depth + 1) : [g]));
  }
  return groups;
}

export function computeTable(teamIds, matches, tieOrder = {}) {
  const played = matches.filter((m) => m.status === 'played' && m.home_score != null && m.away_score != null);
  const all = tally(teamIds, played);
  const order = [];
  for (const level of groupBy(teamIds, (id) => all.get(id).pts)) {
    for (const h2h of headToHead(level, played)) {
      for (const g of groupBy(h2h, (id) => all.get(id).gd)) {
        for (const g2 of groupBy(g, (id) => all.get(id).gf)) {
          g2.sort((x, y) => (tieOrder[x] ?? 99) - (tieOrder[y] ?? 99) || x.localeCompare(y));
          order.push(...g2);
        }
      }
    }
  }
  return order.map((id, i) => ({ pos: i + 1, ...all.get(id) }));
}
