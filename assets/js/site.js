(function(){
  var sel = document.getElementById('langSel');
  if(!sel) return;
  var btn = sel.querySelector('.lang-btn');
  var cur = sel.querySelector('.cur');
  var items = sel.querySelectorAll('.lang-menu a');
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    var open = sel.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  items.forEach(function(a){
    a.addEventListener('click', function(e){
      e.preventDefault();
      cur.textContent = a.getAttribute('data-lang');
      items.forEach(function(x){ x.classList.remove('active'); });
      a.classList.add('active');
      sel.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    });
  });
  document.addEventListener('click', function(){
    sel.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
  });
})();
(function(){
  var car = document.getElementById('shopCarousel');
  if(!car) return;
  var slides = car.querySelectorAll('.slide');
  var dots = car.querySelectorAll('.dots button');
  var i = 0, timer;
  function go(n){
    slides[i].classList.remove('active');
    if(dots[i]) dots[i].classList.remove('active');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('active');
    if(dots[i]) dots[i].classList.add('active');
  }
  function start(){ timer = setInterval(function(){ go(i+1); }, 4000); }
  function reset(){ clearInterval(timer); start(); }
  dots.forEach(function(dot){
    dot.addEventListener('click', function(){
      go(parseInt(dot.getAttribute('data-i'),10));
      reset();
    });
  });
  start();
})();
(function(){
  var btn = document.querySelector('.menu-btn');
  if(!btn) return;
  var root = document.documentElement;
  function set(open){
    root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  btn.addEventListener('click', function(){ set(!root.classList.contains('menu-open')); });
  document.querySelectorAll('.mnav a').forEach(function(a){
    a.addEventListener('click', function(){ set(false); });
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') set(false); });
  window.addEventListener('resize', function(){ if(window.innerWidth > 980) set(false); });
})();
(function(){
  // Section entrances: only for content below the first screen, so nothing visible ever blinks.
  if(!('IntersectionObserver' in window)) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var sel = '.sec-h,.about .txt>*,.about .visual,.feat,.nc,.match,.acad-head>*,.acad-cat,.tr,.mcard,' +
            '.pt-head,.pt-cell,.shop .img,.shop .promo,.shop .carousel,.sp-band .l,.sp-band .r,' +
            '.article>*,.pc,.squad-h,.fx,.fx-month,.standings,.nf-main,.nf-card,.ncard,.club-sec>*';
  var els = [].slice.call(document.querySelectorAll(sel));
  var fold = window.innerHeight;
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach(function(el){
    if(el.getBoundingClientRect().top < fold) return;
    var sibs = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
    el.style.setProperty('--d', Math.min(sibs, 6) * 70 + 'ms');
    el.classList.add('rv');
    io.observe(el);
  });
})();
