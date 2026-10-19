import { html } from '../lib/html.js';
import { hashPassword } from './auth.js';
import { adminPage, htmlResponse, redirect } from './ui.js';

export async function accountPage({ db, user, url }) {
  const { results: users } = user.is_owner ? await db.prepare('SELECT id, name, email, is_owner FROM admin_users ORDER BY id').all() : { results: [] };
  const body = html`<div class="head"><div><h1>${user.is_owner ? 'Account' : 'Il mio account'}</h1><p>${user.name} · ${user.email}</p></div></div>
<div class="grid2">
  <form class="panel" method="post" action="/admin/account">
    <h2>Cambia password</h2>
    <div class="field"><label for="current">Password attuale</label><input id="current" name="current" type="password" required autocomplete="current-password"></div>
    <div class="field"><label for="next">Nuova password <span class="hint">(almeno 10 caratteri)</span></label><input id="next" name="next" type="password" minlength="10" required autocomplete="new-password"></div>
    <button class="btn dark" type="submit" name="action" value="password">Cambia password</button>
  </form>
  ${user.is_owner ? html`<section class="panel">
    <h2>Persone che possono usare il pannello</h2>
    <div class="list" style="margin-bottom:18px">${users.map((u) => html`<div class="row"><span class="grow"><span class="t">${u.name}</span><span class="s">${u.email}${u.is_owner ? ' · gestisce gli account' : ''}</span></span>
      ${u.id !== user.id ? html`<form method="post" action="/admin/account"><input type="hidden" name="uid" value="${u.id}"><button class="btn small danger" type="submit" name="action" value="remove" data-confirm="Togliere l’accesso a ${u.name}?">Togli accesso</button></form>` : ''}</div>`)}</div>
    <form method="post" action="/admin/account">
      <h3 style="margin-bottom:10px">Aggiungi una persona</h3>
      <div class="field"><label for="n_name">Nome</label><input id="n_name" name="name" type="text" required></div>
      <div class="field"><label for="n_email">Email</label><input id="n_email" name="email" type="email" required></div>
      <div class="field"><label for="n_pass">Password iniziale <span class="hint">(almeno 10 caratteri — comunicala a voce, poi potrà cambiarla)</span></label><input id="n_pass" name="password" type="text" minlength="10" required autocomplete="off"></div>
      <button class="btn" type="submit" name="action" value="add">Aggiungi</button>
    </form>
  </section>` : ''}
</div>`;
  return htmlResponse(adminPage({ user, active: 'users', title: 'Account', body, url }));
}

export async function saveAccount({ db, user, form }) {
  const action = form.get('action');
  if (action === 'password') {
    const me = await db.prepare('SELECT * FROM admin_users WHERE id = ?').bind(user.id).first();
    const { hash } = await hashPassword(String(form.get('current') || ''), me.pass_salt);
    const next = String(form.get('next') || '');
    if (hash !== me.pass_hash || next.length < 10) return redirect('/admin/account?msg=invalid');
    const h = await hashPassword(next);
    await db.batch([
      db.prepare('UPDATE admin_users SET pass_hash = ?, pass_salt = ? WHERE id = ?').bind(h.hash, h.salt, user.id),
      db.prepare('DELETE FROM admin_sessions WHERE user_id = ?').bind(user.id),
    ]);
    return redirect('/admin/accedi?msg=password');
  }
  if (!user.is_owner) return redirect('/admin/account');
  if (action === 'add') {
    const name = String(form.get('name') || '').trim(), email = String(form.get('email') || '').trim(), pass = String(form.get('password') || '');
    if (!name || !/^[^@\s]+@[^@\s]+$/.test(email) || pass.length < 10) return redirect('/admin/account?msg=invalid');
    if (await db.prepare('SELECT 1 FROM admin_users WHERE email = ?').bind(email).first()) return redirect('/admin/account?msg=invalid');
    const h = await hashPassword(pass);
    await db.prepare('INSERT INTO admin_users (email, name, pass_hash, pass_salt) VALUES (?, ?, ?, ?)').bind(email, name, h.hash, h.salt).run();
    return redirect('/admin/account?msg=created');
  }
  if (action === 'remove') {
    const uid = Number(form.get('uid'));
    if (uid && uid !== user.id) await db.prepare('DELETE FROM admin_users WHERE id = ?').bind(uid).run();
    return redirect('/admin/account?msg=deleted');
  }
  return redirect('/admin/account');
}
