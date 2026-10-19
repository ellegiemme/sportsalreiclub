import { html, raw } from '../lib/html.js';
import { hashPassword } from './auth.js';
import { adminPage, htmlResponse, redirect } from './ui.js';
import { adminT, ADMIN_LANGS } from './i18n.js';

export async function accountPage({ db, user, url }) {
  const A = adminT(user.lang).account;
  const { results: users } = user.is_owner ? await db.prepare('SELECT id, name, email, is_owner, lang FROM admin_users ORDER BY id').all() : { results: [] };
  const body = html`<div class="head"><div><h1>${user.is_owner ? A.title : A.mine}</h1><p>${user.name} · ${user.email}</p></div></div>
<div class="grid2">
  <form class="panel" method="post" action="/admin/account">
    <h2>${A.password}</h2>
    <div class="field"><label for="current">${A.current}</label><input id="current" name="current" type="password" required autocomplete="current-password"></div>
    <div class="field"><label for="next">${A.next} <span class="hint">${A.min}</span></label><input id="next" name="next" type="password" minlength="10" required autocomplete="new-password"></div>
    <button class="btn dark" type="submit" name="action" value="password">${A.change}</button>
  </form>
  ${user.is_owner ? html`<section class="panel">
    <h2>${A.people}</h2>
    <div class="list" style="margin-bottom:18px">${users.map((u) => html`<div class="row"><span class="grow"><span class="t">${u.name}</span><span class="s">${u.email} · ${ADMIN_LANGS[u.lang]?.langName || u.lang}${u.is_owner ? ` · ${A.owner}` : ''}</span></span>
      ${u.id !== user.id ? html`<form method="post" action="/admin/account"><input type="hidden" name="uid" value="${u.id}"><button class="btn small danger" type="submit" name="action" value="remove" data-confirm="${A.confirmRemove(u.name)}">${A.remove}</button></form>` : ''}</div>`)}</div>
    <form method="post" action="/admin/account">
      <h3 style="margin-bottom:10px">${A.addTitle}</h3>
      <div class="field"><label for="n_name">${A.name}</label><input id="n_name" name="name" type="text" required></div>
      <div class="field"><label for="n_email">${A.email}</label><input id="n_email" name="email" type="email" required></div>
      <div class="field"><label for="n_lang">${A.lang}</label><select id="n_lang" name="lang">${Object.values(ADMIN_LANGS).map((l) => html`<option value="${l.lang}"${l.lang === 'pt' ? raw(' selected') : ''}>${l.langName}</option>`)}</select></div>
      <div class="field"><label for="n_pass">${A.initial} <span class="hint">${A.initialHint}</span></label><input id="n_pass" name="password" type="text" minlength="10" required autocomplete="off"></div>
      <button class="btn" type="submit" name="action" value="add">${A.add}</button>
    </form>
  </section>` : ''}
</div>`;
  return htmlResponse(adminPage({ user, active: 'users', title: user.is_owner ? A.title : A.mine, body, url }));
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
    return redirect(`/admin/accedi?msg=password&lang=${user.lang}`);
  }
  if (!user.is_owner) return redirect('/admin/account');
  if (action === 'add') {
    const name = String(form.get('name') || '').trim(), email = String(form.get('email') || '').trim(), pass = String(form.get('password') || '');
    const lang = ADMIN_LANGS[form.get('lang')] ? form.get('lang') : 'pt';
    if (!name || !/^[^@\s]+@[^@\s]+$/.test(email) || pass.length < 10) return redirect('/admin/account?msg=invalid');
    if (await db.prepare('SELECT 1 FROM admin_users WHERE email = ?').bind(email).first()) return redirect('/admin/account?msg=invalid');
    const h = await hashPassword(pass);
    await db.prepare('INSERT INTO admin_users (email, name, pass_hash, pass_salt, lang) VALUES (?, ?, ?, ?, ?)').bind(email, name, h.hash, h.salt, lang).run();
    return redirect('/admin/account?msg=created');
  }
  if (action === 'remove') {
    const uid = Number(form.get('uid'));
    if (uid && uid !== user.id) await db.prepare('DELETE FROM admin_users WHERE id = ?').bind(uid).run();
    return redirect('/admin/account?msg=deleted');
  }
  return redirect('/admin/account');
}

export async function setLanguage({ db, user, form }) {
  const lang = ADMIN_LANGS[form.get('lang')] ? form.get('lang') : user.lang;
  await db.prepare('UPDATE admin_users SET lang = ? WHERE id = ?').bind(lang, user.id).run();
  const back = String(form.get('back') || '/admin');
  return redirect(back.startsWith('/admin') && !back.startsWith('//') ? back : '/admin');
}
