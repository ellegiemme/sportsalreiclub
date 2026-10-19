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
