/* Happy Dog Saint-Tropez · l'introduction avant l'accueil (3 propositions, 16/11/2026)
   1 « Le médaillon » : le cercle du logo se dessine, puis s'ouvre en iris sur le site
   2 « Le livre »     : la phrase de son livre sur une page crème, qui s'ouvre en deux comme un livre
   3 « Le lien »      : L'humain, le chien, un fil cuivre qui les relie, puis « La relation »
   Démo : /?intro=1, /?intro=2, /?intro=3 (rejoue à chaque fois). En ligne : une seule fois par visite,
   toujours « Passer », jamais pour les personnes qui demandent moins d'animations. */
(function () {
  'use strict';
  var doc = document;
  var racine = doc.documentElement;
  var el = doc.querySelector('[data-intro]');
  if (!el) return;

  var EN = racine.lang === 'en';
  var demande = new URLSearchParams(window.location.search).get('intro');
  var force = /^[123]$/.test(demande || '');
  var variante = force ? +demande : (+el.getAttribute('data-variante') || 1);
  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dejaVue = false;
  try { dejaVue = sessionStorage.getItem('hd-intro') === '1'; } catch (e) { /* navigation privée */ }

  function retirer() {
    if (el.parentNode) el.parentNode.removeChild(el);
    racine.classList.remove('intro-en-cours');
  }
  if (!window.gsap || calme || (dejaVue && !force)) { retirer(); return; }

  var gsap = window.gsap;
  racine.classList.add('intro-en-cours');
  el.classList.add('est-pilotee', 'intro--' + ['', 'medaillon', 'livre', 'lien'][variante]);
  try { sessionStorage.setItem('hd-intro', '1'); } catch (e) { /* rien */ }

  var T = EN ? {
    passer: 'Skip intro', citation: ['A dog never comes into a life,', 'into a family, by chance.'], jamais: 'Never.',
    humain: 'The human', chien: 'The dog', relation: 'The <em>bond.</em>'
  } : {
    passer: "Passer l'intro", citation: ["Un chien n'arrive jamais par hasard", 'dans une vie, dans une famille.'], jamais: 'Jamais.',
    humain: "L'humain", chien: 'Le chien', relation: 'La <em>relation.</em>'
  };

  var termine = false, sortieLancee = false;
  var tl;
  // La page d'accueil commence son animation pendant que l'intro s'efface
  function sortie() {
    if (sortieLancee) return;
    sortieLancee = true;
    doc.dispatchEvent(new CustomEvent('hd:intro-sortie'));
  }
  function finir() {
    if (termine) return;
    termine = true;
    if (tl) tl.kill();
    retirer();
    sortie();
  }

  // Bouton « Passer » (et touche Échap)
  var passer = doc.createElement('button');
  passer.type = 'button'; passer.className = 'intro__passer'; passer.textContent = T.passer;
  passer.addEventListener('click', function () {
    sortie();
    gsap.to(el, { opacity: 0, duration: .45, ease: 'power2.out', onComplete: finir });
  });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') passer.click(); });

  function lettres(texte) {
    return texte.split('').map(function (c) { return '<span class="intro__lettre">' + (c === ' ' ? '&nbsp;' : c) + '</span>'; }).join('');
  }

  /* ---------- 1. Le médaillon ---------- */
  function medaillon() {
    el.innerHTML =
      '<div class="intro__centre">' +
        '<div class="intro__medaillon">' +
          '<svg class="intro__cercle" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="97"/></svg>' +
          '<img class="intro__dessin" src="/happy-dog-apercu/assets/img/logo-scene-2x.webp" width="528" height="366" alt="">' +
        '</div>' +
        '<p class="intro__nom">' + lettres('HAPPY DOG') + '</p>' +
        '<p class="intro__lieu">Saint-Tropez</p>' +
      '</div>';
    el.appendChild(passer);
    // L'iris s'ouvrira depuis le centre du médaillon (masque déjà en place, trou de taille 0)
    function centrer() {
      var r = el.querySelector('.intro__medaillon').getBoundingClientRect();
      el.style.setProperty('--cx', (r.left + r.width / 2) + 'px');
      el.style.setProperty('--cy', (r.top + r.height / 2) + 'px');
    }
    el.style.setProperty('--trou', '0vmax');
    centrer(); el.classList.add('intro--iris');
    window.addEventListener('resize', centrer);
    var cercle = el.querySelector('.intro__cercle circle');
    var long = 2 * Math.PI * 97;
    gsap.set(cercle, { strokeDasharray: long, strokeDashoffset: long });

    tl = gsap.timeline({ onComplete: finir });
    tl.to(cercle, { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut' }, .15)
      .from('.intro__dessin', { opacity: 0, y: 18, duration: .9, ease: 'power3.out' }, .75)
      .from('.intro__nom .intro__lettre', { opacity: 0, y: 14, duration: .6, stagger: .045, ease: 'power3.out' }, 1.1)
      .from('.intro__lieu', { opacity: 0, letterSpacing: '.9em', duration: .9, ease: 'power3.out' }, 1.5)
      .call(sortie, null, 2.75)
      .fromTo(el, { '--trou': '0vmax' }, { '--trou': '160vmax', duration: 1.25, ease: 'power3.inOut' }, 2.6)
      .to('.intro__centre', { scale: 1.25, opacity: 0, duration: .9, ease: 'power2.in' }, 2.6);
  }

  /* ---------- 2. Le livre ---------- */
  function livre() {
    var contenu =
      '<div class="intro__contenu">' +
        '<p class="intro__citation"><span>' + T.citation[0] + '</span> <span>' + T.citation[1] + '</span></p>' +
        '<p class="intro__jamais">' + T.jamais + '</p>' +
        '<p class="intro__signe">Vanessa Vanlerberghe · <cite lang="fr">Nos chiens, ces héros</cite></p>' +
      '</div>';
    el.innerHTML =
      '<div class="intro__page intro__page--g">' + contenu + '</div>' +
      '<div class="intro__page intro__page--d">' + contenu + '</div>' +
      '<span class="intro__pli" aria-hidden="true"></span>';
    el.appendChild(passer);

    tl = gsap.timeline({ onComplete: finir });
    // Rythme de lecture (demande de Guillaume, 16/11) : chaque ligne a le temps d'être lue, puis on laisse respirer
    var OUVRE = 5.9;
    tl.from('.intro__citation span', { opacity: 0, y: 16, filter: 'blur(6px)', duration: 1.2, ease: 'power3.out',
        // les deux pages portent la même phrase : chaque ligne apparaît en même temps à gauche et à droite
        stagger: function (i, cible) { return Array.prototype.indexOf.call(cible.parentNode.children, cible) * 1.1; } }, .3)
      .from('.intro__jamais', { opacity: 0, letterSpacing: '.35em', duration: 1.2, ease: 'power3.out' }, 2.9)
      .from('.intro__signe', { opacity: 0, y: 8, duration: .9, ease: 'power2.out' }, 3.7)
      .call(sortie, null, OUVRE + .25)
      .to('.intro__pli', { opacity: 0, duration: .4 }, OUVRE)
      .to('.intro__page--g', { xPercent: -100, rotationY: 18, transformOrigin: '0% 50%', duration: 1.4, ease: 'power3.inOut' }, OUVRE)
      .to('.intro__page--d', { xPercent: 100, rotationY: -18, transformOrigin: '100% 50%', duration: 1.4, ease: 'power3.inOut' }, OUVRE)
      .to(passer, { opacity: 0, duration: .3 }, OUVRE);
  }

  /* ---------- 3. Le lien ---------- */
  function lien() {
    el.innerHTML =
      '<div class="intro__duo">' +
        '<span class="intro__mot intro__mot--g">' + T.humain + '</span>' +
        '<svg class="intro__fil" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true"><path d="M2 30 C 70 2, 130 58, 200 30 S 330 2, 398 30"/></svg>' +
        '<span class="intro__mot intro__mot--d">' + T.chien + '</span>' +
      '</div>' +
      '<p class="intro__relation">' + T.relation + '</p>' +
      '<svg class="intro__courbe" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0 L100 0 Q50 100 0 0 Z"/></svg>';
    el.appendChild(passer);
    var fil = el.querySelector('.intro__fil path');
    var long = fil.getTotalLength();
    gsap.set(fil, { strokeDasharray: long, strokeDashoffset: long });

    tl = gsap.timeline({ onComplete: finir });
    tl.from('.intro__mot--g', { opacity: 0, x: -40, duration: .9, ease: 'power3.out' }, .2)
      .from('.intro__mot--d', { opacity: 0, x: 40, duration: .9, ease: 'power3.out' }, .45)
      .to(fil, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, .9)
      .to('.intro__duo', { scale: .82, opacity: 0, filter: 'blur(4px)', duration: .7, ease: 'power2.in' }, 2.15)
      .from('.intro__relation', { opacity: 0, y: 24, duration: .9, ease: 'power3.out' }, 2.55)
      .call(sortie, null, 3.8)
      .to(el, { yPercent: -100, duration: 1.15, ease: 'power3.inOut' }, 3.55)
      .to('.intro__courbe path', { attr: { d: 'M0 0 L100 0 Q50 0 0 0 Z' }, duration: 1.15, ease: 'power3.inOut' }, 3.55);
  }

  [medaillon, livre, lien][variante - 1]();
})();
