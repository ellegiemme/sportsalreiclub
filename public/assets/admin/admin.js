// Sal Rei site admin: editor, image upload, AI translation, confirmations.
(function () {
  var MSG = {
    it: {
      linkUrl: 'Indirizzo del link (https://…)', uploading: 'Caricamento in corso…', uploaded: 'Caricata. Ricordati di salvare.',
      uploadFailed: 'Caricamento non riuscito. Usa una foto JPG o PNG sotto i 10 MB.', noPhoto: 'Nessuna foto: verrà mostrata la grafica',
      removed: 'Foto tolta. Ricordati di salvare.', writeFirst: 'Scrivi prima il testo nell’altra lingua.',
      replace: 'Sostituire il testo già scritto in questa lingua con la traduzione?', translating: 'Traduzione in corso…',
      translated: 'Tradotto ✓ — rileggi e salva', failed: 'Traduzione non riuscita. Riprova tra poco.',
      'missing-key': 'La traduzione automatica non è ancora attiva: manca la chiave ANTHROPIC_API_KEY su Cloudflare.',
      refused: 'Il servizio di traduzione non ha tradotto questo testo. Prova a tradurlo a mano.',
      'too-long': 'Il testo è troppo lungo per una traduzione sola. Prova a dividerlo.',
      whiteLogo: 'Caricato, ma il logo ha lo sfondo bianco: sul sito apparirà dentro un riquadro bianco. Se puoi, usa un PNG con sfondo trasparente. Ricordati di salvare.'
    },
    pt: {
      linkUrl: 'Endereço da ligação (https://…)', uploading: 'A carregar…', uploaded: 'Carregada. Não se esqueça de guardar.',
      uploadFailed: 'Não foi possível carregar. Use uma fotografia JPG ou PNG com menos de 10 MB.', noPhoto: 'Sem fotografia: será mostrado o gráfico',
      removed: 'Fotografia retirada. Não se esqueça de guardar.', writeFirst: 'Escreva primeiro o texto na outra língua.',
      replace: 'Substituir o texto já escrito nesta língua pela tradução?', translating: 'A traduzir…',
      translated: 'Traduzido ✓ — reveja e guarde', failed: 'Não foi possível traduzir. Tente novamente daqui a pouco.',
      'missing-key': 'A tradução automática ainda não está ativa: falta a chave ANTHROPIC_API_KEY no Cloudflare.',
      refused: 'O serviço de tradução não traduziu este texto. Traduza-o manualmente.',
      'too-long': 'O texto é demasiado longo para uma só tradução. Experimente dividi-lo.',
      whiteLogo: 'Carregado, mas o logótipo tem fundo branco: no site vai aparecer dentro de um retângulo branco. Se possível, use um PNG com fundo transparente. Não se esqueça de guardar.'
    }
  };
  var T = MSG[document.body.getAttribute('data-lang')] || MSG.it;
  // Confirm destructive buttons.
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-confirm]');
    if (b && !confirm(b.getAttribute('data-confirm'))) e.preventDefault();
  });

  // ---------- rich text editors ----------
  var editors = document.querySelectorAll('.editor[data-for]');
  // New lines become paragraphs, not <div>s.
  try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}
  function sync() {
    editors.forEach(function (ed) {
      var ta = ed.parentNode.querySelector('textarea[name="' + ed.getAttribute('data-for') + '"]');
      if (ta) ta.value = ed.innerHTML;
    });
  }
  editors.forEach(function (ed) {
    if (!ed.innerHTML.trim()) ed.innerHTML = '<p><br></p>';
    ed.addEventListener('input', function () { dirty = true; });
    // Paste as plain text, split into paragraphs, so formatting from Word or WhatsApp doesn't leak in.
    ed.addEventListener('paste', function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text/plain');
      var htmlText = text.split(/\n\s*\n|\r\n\s*\r\n/).map(function (p) {
        return '<p>' + p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>') + '</p>';
      }).join('');
      document.execCommand('insertHTML', false, htmlText);
    });
  });
  document.querySelectorAll('.tools button[data-cmd]').forEach(function (b) {
    b.addEventListener('mousedown', function (e) { e.preventDefault(); });
    b.addEventListener('click', function () {
      var cmd = b.getAttribute('data-cmd');
      var ed = b.closest('.field').querySelector('.editor');
      ed.focus();
      if (cmd === 'link') {
        var url = prompt(T.linkUrl);
        if (url && /^https?:\/\//.test(url)) document.execCommand('createLink', false, url);
        return;
      }
      document.execCommand(cmd, false, b.getAttribute('data-arg') ? '<' + b.getAttribute('data-arg') + '>' : null);
      dirty = true;
    });
  });

  // Warn before leaving with unsaved changes.
  var dirty = false;
  var bar = document.querySelector('.bar');
  var form = bar && bar.closest('form');
  if (form) {
    form.addEventListener('input', function () { dirty = true; });
    form.addEventListener('submit', function () { sync(); dirty = false; });
    window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  }

  // ---------- image upload (resized in the browser before sending) ----------
  var fileInput = document.getElementById('img-file');
  var status = document.getElementById('img-status');
  var preview = document.getElementById('img-preview');
  var hidden = document.getElementById('image');
  function resize(file, max) {
    return new Promise(function (resolve) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve(file);
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        if (scale === 1 && file.size < 1.5e6) return resolve(file);
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        var type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        c.toBlob(function (b) { resolve(b ? new File([b], file.name, { type: type }) : file); }, type, 0.85);
      };
      img.onerror = function () { resolve(file); };
      img.src = URL.createObjectURL(file);
    });
  }
  // Logos: cut away empty borders (transparent or plain white) so every logo fills its space.
  function trimLogo(file) {
    return new Promise(function (resolve) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve({ file: file });
      var img = new Image();
      img.onload = function () {
        // Trim at high resolution first, then bring the result down to 800 px at most.
        var scale = Math.min(1, 3000 / Math.max(img.width, img.height));
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        var g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
        var d = g.getImageData(0, 0, w, h).data;
        var corner = d[3] > 200 && d[0] > 235 && d[1] > 235 && d[2] > 235; // opaque white background
        function empty(i) { return d[i + 3] < 16 || (corner && d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235); }
        var x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
          if (!empty((y * w + x) * 4)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
        if (x1 < 0) return resolve({ file: file, white: corner });
        var pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.02);
        x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
        var cw = x1 - x0 + 1, ch = y1 - y0 + 1, k = Math.min(1, 800 / Math.max(cw, ch));
        var o = document.createElement('canvas'); o.width = Math.round(cw * k); o.height = Math.round(ch * k);
        o.getContext('2d').drawImage(c, x0, y0, cw, ch, 0, 0, o.width, o.height);
        o.toBlob(function (b) { resolve({ file: b ? new File([b], file.name.replace(/\.\w+$/, '') + '.png', { type: 'image/png' }) : file, white: corner }); }, 'image/png');
      };
      img.onerror = function () { resolve({ file: file }); };
      img.src = URL.createObjectURL(file);
    });
  }
  if (fileInput) {
    fileInput.addEventListener('change', function () {
      var f = fileInput.files[0];
      if (!f) return;
      var kind = fileInput.getAttribute('data-kind') || 'news';
      status.textContent = T.uploading;
      var whiteBg = false;
      (kind === 'logo' ? trimLogo(f).then(function (r) { whiteBg = r.white; return r.file; }) : resize(f, 2000)).then(function (small) {
        var data = new FormData();
        data.append('file', small);
        data.append('kind', kind);
        return fetch('/admin/api/immagine', { method: 'POST', body: data, credentials: 'same-origin' });
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (!res.url) throw new Error(res.error || 'upload');
        hidden.value = res.url;
        preview.style.backgroundImage = "url('" + res.url + "')";
        preview.textContent = '';
        status.textContent = whiteBg ? T.whiteLogo : T.uploaded;
        dirty = true;
      }).catch(function () {
        status.textContent = T.uploadFailed;
      });
    });
  }
  var remove = document.getElementById('img-remove');
  if (remove) remove.addEventListener('click', function () {
    hidden.value = ''; preview.style.backgroundImage = ''; preview.textContent = T.noPhoto;
    status.textContent = T.removed; dirty = true;
  });
  var pos = document.getElementById('image_pos');
  if (pos && preview) pos.addEventListener('change', function () { preview.style.backgroundPosition = pos.value; });

  // ---------- AI translation ----------
  var FIELDS = ['title', 'excerpt', 'pull', 'gfx_cap'];
  function collect(l) {
    sync();
    var f = {};
    FIELDS.forEach(function (k) { var el = document.querySelector('[name="' + k + '_' + l + '"]'); f[k] = el ? el.value : ''; });
    f.body = document.querySelector('.editor[data-for="body_' + l + '"]').innerHTML;
    f.facts = [];
    for (var i = 0; i < 3; i++) {
      var k = document.querySelector('[name="fact_k_' + l + '_' + i + '"]').value, v = document.querySelector('[name="fact_v_' + l + '_' + i + '"]').value;
      if (k || v) f.facts.push([k, v]);
    }
    return f;
  }
  function fill(l, f) {
    FIELDS.forEach(function (k) { var el = document.querySelector('[name="' + k + '_' + l + '"]'); if (el) el.value = f[k] || ''; });
    document.querySelector('.editor[data-for="body_' + l + '"]').innerHTML = f.body || '';
    for (var i = 0; i < 3; i++) {
      document.querySelector('[name="fact_k_' + l + '_' + i + '"]').value = (f.facts[i] || [])[0] || '';
      document.querySelector('[name="fact_v_' + l + '_' + i + '"]').value = (f.facts[i] || [])[1] || '';
    }
    sync(); dirty = true;
  }
  document.querySelectorAll('[data-translate]').forEach(function (b) {
    b.addEventListener('click', function () {
      var parts = b.getAttribute('data-translate').split(':'), from = parts[0], to = parts[1];
      var src = collect(from);
      if (!src.title.trim() && !src.body.replace(/<[^>]+>/g, '').trim()) { alert(T.writeFirst); return; }
      var target = collect(to);
      if ((target.title.trim() || target.body.replace(/<[^>]+>/g, '').trim()) && !confirm(T.replace)) return;
      var label = b.textContent;
      b.disabled = true; b.textContent = T.translating;
      fetch('/admin/api/traduci', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ from: from, to: to, fields: src }) })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.fields) throw new Error(res.error || 'failed');
          fill(to, res.fields);
          b.textContent = T.translated;
          setTimeout(function () { b.textContent = label; b.disabled = false; }, 4000);
        })
        .catch(function (e) {
          alert(T[e.message] || T.failed);
          b.textContent = label; b.disabled = false;
        });
    });
  });
})();
