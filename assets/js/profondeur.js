/* Happy Dog Saint-Tropez · la profondeur du site (16/11/2026)
   Règle : pas d'animation pour l'animation. Chaque mouvement met en valeur une photo, un titre ou une preuve.
   Inspiration 21st (Text Reveal Mask, Mask Reveal, Parallax Image), réécrit en GSAP sans React.
   - défilement fluide (Lenis, en local) synchronisé avec les animations
   - ouverture : la photo glisse plus lentement que la page, le texte s'éloigne en douceur
   - titres de section : les mots montent un à un derrière un masque
   - photos : dévoilées par un rideau, puis légère parallaxe à l'intérieur du cadre
   - livre : la couverture se redresse et flotte au défilement
   - communes, preuves, sujets : apparitions en cascade, discrètes
   Rien ne bouge pour les personnes qui demandent moins d'animations. */
(function () {
  'use strict';
  var doc = document;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.gsap || !window.ScrollTrigger) return;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var grandEcran = window.matchMedia('(min-width: 901px)').matches;

  /* ---------- Défilement fluide ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return 1 - Math.pow(1 - t, 3); }, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    // À l'arrêt pendant l'intro, la pop-up et le menu téléphone
    var majArret = function () {
      var bloque = doc.documentElement.classList.contains('intro-en-cours') || doc.body.classList.contains('popup-ouverte') || doc.body.style.overflow === 'hidden';
      if (bloque) lenis.stop(); else lenis.start();
    };
    majArret();
    new MutationObserver(majArret).observe(doc.body, { attributes: true, attributeFilter: ['class', 'style'] });
    new MutationObserver(majArret).observe(doc.documentElement, { attributes: true, attributeFilter: ['class'] });
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var cible = $(id);
        if (!cible) return;
        e.preventDefault();
        lenis.scrollTo(cible, { offset: -80, duration: 1.4 });
      });
    });
  }

  /* ---------- Ouverture : profondeur entre la photo et le texte ---------- */
  var photoOuverture = $('[data-photo] img');
  if (photoOuverture) {
    gsap.to(photoOuverture, { yPercent: 9, ease: 'none', scrollTrigger: { trigger: '.ouverture', start: 'top top', end: 'bottom top', scrub: true } });
  }
  if (grandEcran && $('.ouverture__texte')) {
    gsap.to('.ouverture__texte', { y: -90, opacity: .15, ease: 'none', scrollTrigger: { trigger: '.ouverture', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- Titres : les mots montent un à un derrière un masque ---------- */
  function decouper(el) {
    var mots = [];
    (function parcourir(noeud, parent) {
      Array.prototype.slice.call(noeud.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (m) {
            if (!m) return;
            if (/^\s+$/.test(m)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var ext = doc.createElement('span'); ext.className = 'mot-ext';
            var int = doc.createElement('span'); int.className = 'mot-int'; int.textContent = m;
            ext.appendChild(int); frag.appendChild(ext); mots.push(int);
          });
          parent.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          parcourir(n, n);
        }
      });
    })(el, el);
    return mots;
  }
  $$('main .titre-section').forEach(function (titre) {
    var mots = decouper(titre);
    gsap.from(mots, { yPercent: 115, duration: 1.1, stagger: .06, ease: 'power4.out', scrollTrigger: { trigger: titre, start: 'top 86%' } });
  });
  // Les petits surtitres s'ouvrent comme un souffle
  $$('main section:not(.ouverture) .surtitre').forEach(function (s) {
    gsap.from(s, { opacity: 0, letterSpacing: '.5em', duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 90%' } });
  });

  /* ---------- Photos : dévoilées par un rideau, puis parallaxe dans le cadre ---------- */
  $$('.vanessa__photo').forEach(function (fig) {
    var img = $('img', fig);
    gsap.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0% round 20px)' }, { clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 1.5, ease: 'power4.inOut', scrollTrigger: { trigger: fig, start: 'top 82%' } });
    gsap.fromTo(img, { scale: 1.3 }, { scale: 1.12, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: fig, start: 'top 82%' } });
    gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- Le livre : la couverture se redresse en montant ---------- */
  var couverture = $('.livre__couverture');
  if (couverture) {
    gsap.fromTo(couverture, { rotationY: 26, rotationX: 4, y: 70 }, { rotationY: 6, rotationX: 0, y: -30, ease: 'none', scrollTrigger: { trigger: '.livre', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from(couverture, { opacity: 0, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: '.livre', start: 'top 75%' } });
  }

  /* ---------- Cascades discrètes ---------- */
  function cascade(selecteur, declencheur, vars) {
    var els = $$(selecteur);
    if (!els.length) return;
    gsap.from(els, Object.assign({ opacity: 0, y: 24, duration: .9, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: declencheur || els[0], start: 'top 85%' } }, vars || {}));
  }
  cascade('.preuves li', '.preuves');
  cascade('.zones__communes li', '.zones__communes', { y: 16, scale: .92, stagger: .05 });

  // Ce qui vous amène : chaque ligne se trace, puis son texte arrive
  $$('.sujets__liste li').forEach(function (li) {
    gsap.from(li, { '--trait': 0, duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: li, start: 'top 88%' } });
  });

  /* ---------- Sections sombres : le contenu glisse un peu moins vite que la page ---------- */
  if (grandEcran) {
    [['.sujets__liste', '.sujets'], ['.question__titre', '.question'], ['.livre__texte', '.livre']].forEach(function (p) {
      if (!$(p[0])) return;
      gsap.fromTo(p[0], { y: 50 }, { y: -50, ease: 'none', scrollTrigger: { trigger: p[1], start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- 24/11 (Vanessa : « plus vivant ») : plus de rythme, sans rien changer à la mise en page ----------
     Tout ce qui arrivait d'un bloc (paragraphes, boutons, photos, crédits) arrive maintenant en cascade, juste après son titre.
     Seulement ce qui n'a pas déjà sa propre animation (on ne double jamais un effet). */
  function dejaAnime(el) {
    for (var e = el; e && e !== doc.body; e = e.parentElement) { if (gsap.getTweensOf(e).length) return true; }
    return false;
  }
  // Grandes photos pleine largeur : elles s'agrandissent au défilement, du cadre arrondi jusqu'à toute la largeur
  $$('.pause__image').forEach(function (fig) {
    var img = $('img', fig);
    gsap.fromTo(fig, { clipPath: grandEcran ? 'inset(0% 9% 0% 9% round 28px)' : 'inset(0% 5% 0% 5% round 20px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: fig, start: 'top 95%', end: 'center 55%', scrub: .6 } });
    if (img) gsap.fromTo(img, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: .6 } });
  });
  // Photos des pages (couverture du livre, photos des étapes…) : dévoilées par un rideau, comme la photo de Vanessa
  $$('main section:not(.ouverture) figure').forEach(function (fig) {
    var img = $('img', fig);
    if (!img || dejaAnime(fig) || fig.closest('.video') || fig.classList.contains('lecture__extrait')) return;
    var rayon = getComputedStyle(fig).borderTopLeftRadius || '0px';
    gsap.fromTo(fig, { clipPath: 'inset(100% 0% 0% 0% round ' + rayon + ')' }, { clipPath: 'inset(0% 0% 0% 0% round ' + rayon + ')', duration: 1.4, ease: 'power4.inOut', scrollTrigger: { trigger: fig, start: 'top 85%' } });
    gsap.fromTo(img, { scale: 1.2 }, { scale: 1, duration: 1.8, ease: 'power3.out', scrollTrigger: { trigger: fig, start: 'top 85%' } });
  });
  // Textes et boutons : chaque section déroule son contenu dans l'ordre de lecture, après son titre
  $$('main section:not(.ouverture)').forEach(function (section) {
    var els = $$('p, blockquote, .bouton', section).filter(function (el) {
      if (el.closest('.titre-section, .surtitre, .ruban, [data-apparition], .video, .lecture__extrait, nav, form, .popup')) return false;
      if (el.classList.contains('surtitre') || el.classList.contains('travail__glisser')) return false;
      if (el.parentElement && el.parentElement.closest('.bouton')) return false;
      return !dejaAnime(el) && el.offsetParent !== null;
    });
    els.forEach(function (el, i) {
      var bouton = el.classList.contains('bouton');
      var credit = el.classList.contains('credit-photo');
      gsap.from(el, { opacity: 0, y: credit ? 0 : (bouton ? 14 : 26), duration: credit ? 1 : .95, delay: credit ? .6 : Math.min(i, 5) * .07, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%' } });
    });
  });

  // Les polices et images changent les hauteurs : on recalcule une fois tout chargé
  window.addEventListener('load', function () { ST.refresh(); });
})();
