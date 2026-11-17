/* Happy Dog Saint-Tropez · comportements de la page (aucun script dans le HTML : CSP stricte) */
(function () {
  'use strict';
  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EN = doc.documentElement.lang === 'en';
  var T = EN ? {
    ouvrir: 'Open the menu', fermer: 'Close the menu', ecouter: 'Listen to Vanessa', parle: 'Vanessa is speaking',
    bientot: 'Her message is coming very soon', popup: '/happy-dog-apercu/assets/data/popup-en.json',
    choisir: 'Please choose an answer.', email: 'This e-mail address looks incomplete.', accord: 'Please tick the box so that Vanessa can reply.'
  } : {
    ouvrir: 'Ouvrir le menu', fermer: 'Fermer le menu', ecouter: 'Écouter Vanessa', parle: 'Vanessa vous parle',
    bientot: 'Son message arrive très bientôt', popup: '/happy-dog-apercu/assets/data/popup.json',
    choisir: 'Choisissez une réponse.', email: 'Cette adresse e-mail semble incomplète.', accord: 'Cochez la case pour que Vanessa puisse vous répondre.'
  };

  /* ---------- En-tête qui se colle au défilement ---------- */
  var entete = $('[data-entete]');
  function majEntete() { if (entete) entete.classList.toggle('est-colle', window.scrollY > 30); }
  majEntete();
  window.addEventListener('scroll', majEntete, { passive: true });

  /* ---------- Sous-menu « Éducation et comportement » ---------- */
  $$('[data-sous-menu]').forEach(function (groupe) {
    var bouton = $('button', groupe);
    var minuterie;
    function ouvrir(oui) { groupe.classList.toggle('est-ouvert', oui); bouton.setAttribute('aria-expanded', oui ? 'true' : 'false'); }
    bouton.addEventListener('click', function () { ouvrir(!groupe.classList.contains('est-ouvert')); });
    groupe.addEventListener('mouseenter', function () { clearTimeout(minuterie); ouvrir(true); });
    groupe.addEventListener('mouseleave', function () { minuterie = setTimeout(function () { ouvrir(false); }, 180); });
    groupe.addEventListener('keydown', function (e) { if (e.key === 'Escape') { ouvrir(false); bouton.focus(); } });
    doc.addEventListener('click', function (e) { if (!groupe.contains(e.target)) ouvrir(false); });
  });

  /* ---------- Menu téléphone ---------- */
  var burger = $('[data-burger]');
  var menu = $('[data-menu-mobile]');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var ouvert = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', ouvert ? 'false' : 'true');
      burger.setAttribute('aria-label', ouvert ? T.ouvrir : T.fermer);
      menu.hidden = ouvert;
      doc.body.style.overflow = ouvert ? '' : 'hidden';
    });
  }

  /* ---------- Le message audio de Vanessa ---------- */
  var boutonAudio = $('[data-audio]');
  var audio = $('[data-audio-fichier]');
  if (boutonAudio && audio) {
    var titre = $('[data-audio-titre]', boutonAudio);
    var detail = $('[data-audio-detail]', boutonAudio);
    var detailInitial = detail.textContent;
    function etat(lecture) {
      boutonAudio.classList.toggle('est-en-lecture', lecture);
      titre.textContent = lecture ? T.parle : T.ecouter;
      boutonAudio.setAttribute('aria-pressed', lecture ? 'true' : 'false');
    }
    boutonAudio.addEventListener('click', function () {
      if (audio.paused) {
        var p = audio.play();
        if (p && p.catch) p.catch(function () { detail.textContent = T.bientot; });
      } else { audio.pause(); }
    });
    audio.addEventListener('play', function () { etat(true); });
    audio.addEventListener('pause', function () { etat(false); });
    audio.addEventListener('ended', function () { etat(false); detail.textContent = detailInitial; });
    audio.addEventListener('error', function () { etat(false); detail.textContent = T.bientot; });
    audio.addEventListener('timeupdate', function () {
      if (!audio.duration) return;
      var reste = Math.max(0, Math.round(audio.duration - audio.currentTime));
      detail.textContent = '0:' + (reste < 10 ? '0' : '') + reste;
    });
  }

  /* ---------- CRM pop-up : le contenu vient de assets/data/popup.json (géré par Vanessa) ---------- */
  var popup = $('[data-popup]');
  var dernierFocus = null;
  function fermerPopup() {
    if (!popup || popup.hidden) return;
    popup.hidden = true; doc.body.classList.remove('popup-ouverte');
    if (dernierFocus) dernierFocus.focus();
  }
  function ouvrirPopup() {
    if (!popup) return;
    dernierFocus = doc.activeElement;
    popup.hidden = false; doc.body.classList.add('popup-ouverte');
    var premier = $('input, button', $('.popup__boite', popup));
    setTimeout(function () { (premier || popup).focus(); }, 30);
  }
  if (popup) {
    $$('[data-ouvrir-popup]').forEach(function (b) { b.addEventListener('click', ouvrirPopup); });
    $$('[data-fermer-popup]', popup).forEach(function (b) { b.addEventListener('click', fermerPopup); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerPopup(); });

    fetch(T.popup, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.actif) { $$('[data-ouvrir-popup]').forEach(function (b) { b.hidden = true; }); return; }
        $('[data-popup-etiquette]').textContent = d.bouton;
        $('[data-popup-surtitre]', popup).textContent = d.surtitre;
        $('[data-popup-titre]', popup).textContent = d.titre;
        var choix = $('[data-popup-choix]', popup);
        (d.choix || []).forEach(function (texte, i) {
          var l = doc.createElement('label');
          var e = doc.createElement('input');
          e.type = 'radio'; e.name = 'reponse'; e.value = texte; e.id = 'reponse-' + i;
          l.appendChild(e); l.appendChild(doc.createTextNode(texte));
          choix.appendChild(l);
        });
      })
      .catch(function () { /* sans contenu, la pop-up garde son texte par défaut */ });

    var form = $('[data-popup-form]', popup);
    var erreur = $('[data-popup-erreur]', popup);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var choisi = $('input[name="reponse"]:checked', form);
      var email = form.email.value.trim();
      var msg = '';
      if ($$('input[name="reponse"]', form).length && !choisi) msg = T.choisir;
      else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) msg = T.email;
      else if (!form.accord.checked) msg = T.accord;
      if (msg) { erreur.textContent = msg; erreur.hidden = false; return; }
      erreur.hidden = true;
      /* APERÇU : l'envoi vers l'espace privé de Vanessa sera branché à la mise en ligne. Rien n'est envoyé ici. */
      form.hidden = true;
      $('[data-popup-merci]', popup).hidden = false;
    });
  }

  /* ---------- Ruban d'avis : la liste est doublée pour un défilement sans couture (copies cachées aux lecteurs d'écran) ---------- */
  $$('.ruban').forEach(function (ruban) {
    var piste = $('.ruban__piste', ruban);
    Array.prototype.slice.call(piste.children).forEach(function (li) {
      var copie = li.cloneNode(true);
      copie.setAttribute('aria-hidden', 'true');
      piste.appendChild(copie);
    });
    ruban.classList.add('est-double');
  });

  /* ---------- La voir travailler : 3 vidéos, chargées et lues seulement quand on les voit ---------- */
  var cartesVideo = $$('[data-video]');
  function etiquetteSon(bouton, actif) {
    bouton.setAttribute('aria-pressed', actif ? 'true' : 'false');
    bouton.setAttribute('aria-label', actif ? (EN ? 'Turn sound off' : 'Couper le son') : (EN ? 'Turn sound on' : 'Activer le son'));
  }
  function couperLesAutres(garde) {
    cartesVideo.forEach(function (c) {
      var v = $('video', c);
      if (c !== garde && v && !v.muted) { v.muted = true; etiquetteSon($('[data-video-son]', c), false); }
    });
  }
  cartesVideo.forEach(function (carte) {
    var video = $('video', carte);
    var bouton = $('[data-video-son]', carte);
    video.addEventListener('loadeddata', function () { carte.classList.add('est-prete'); });
    bouton.addEventListener('click', function () {
      var activer = video.muted;
      if (activer) couperLesAutres(carte);
      video.muted = !activer;
      if (activer && video.paused) video.play().catch(function () {});
      etiquetteSon(bouton, activer);
    });
    if (calme) carte.addEventListener('click', function (e) {
      if (e.target.closest('[data-video-son]')) return;
      if (video.paused) video.play().catch(function () {}); else video.pause();
    });
  });
  if (cartesVideo.length && 'IntersectionObserver' in window) {
    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        var video = $('video', e.target);
        if (e.isIntersecting) {
          if (!video.getAttribute('src')) { video.src = video.getAttribute('data-src'); video.load(); }
          if (!calme) video.play().catch(function () { /* vidéo pas encore arrivée */ });
        } else if (!video.paused) { video.pause(); }
      });
    }, { rootMargin: '200px 0px' });
    cartesVideo.forEach(function (c) { observateur.observe(c); });
  }

  /* ---------- Animations (GSAP, en local) ---------- */
  function animer() {
    if (calme || !window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);
    doc.documentElement.classList.add('js-anime');

    // Ouverture : la photo se dévoile, la phrase monte mot à mot (après l'introduction s'il y en a une)
    var accroche = $('.ouverture [data-titre-anime]');
    if (accroche) decouperMots(accroche);
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, paused: doc.documentElement.classList.contains('intro-en-cours') });
    if (tl.paused()) doc.addEventListener('hd:intro-sortie', function () { tl.play(); }, { once: true });
    tl.from('[data-photo] img', { scale: 1.12, duration: 2.2, ease: 'power2.out' }, 0)
      .from('.ouverture .mot-int', { yPercent: 110, duration: 1, stagger: .06 }, .2)
      .to('.ouverture [data-apparition]', { opacity: 1, y: 0, duration: .9, stagger: .1 }, .5);

    // La citation s'allume mot à mot au défilement
    var citation = $('[data-mots] p');
    if (citation) {
      var mots = citation.textContent.trim().split(/\s+/);
      citation.textContent = '';
      mots.forEach(function (m, i) {
        var s = doc.createElement('span'); s.className = 'mot'; s.textContent = m;
        citation.appendChild(s);
        if (i < mots.length - 1) citation.appendChild(doc.createTextNode(' '));
      });
      gsap.to('.vision__citation .mot', { opacity: 1, stagger: .05, ease: 'none',
        scrollTrigger: { trigger: citation, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    }

    // Le fil « le lien » se dessine entre le chien, l'humain et la relation
    var fil = $('[data-fil]');
    if (fil && fil.getTotalLength) {
      var long = fil.getTotalLength();
      gsap.set(fil, { strokeDasharray: long, strokeDashoffset: long });
      gsap.to(fil, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.trio', start: 'top 85%', end: 'top 35%', scrub: true } });
    }

    // La voir travailler : les cadres montent en escalier, le fil cuivre les relie, chacun à sa vitesse
    if ($('[data-travail]') && window.matchMedia('(min-width: 901px)').matches) {
      gsap.from('.video', { y: 140, opacity: 0, duration: 1.2, stagger: .18, ease: 'power3.out', scrollTrigger: { trigger: '[data-travail]', start: 'top 82%' } });
      [-40, -110, -60].forEach(function (y, i) {
        var c = $$('.video .video__cadre')[i];
        if (c) gsap.to(c, { y: y, ease: 'none', scrollTrigger: { trigger: '[data-travail]', start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      var filT = $('[data-fil-travail]');
      if (filT && filT.getTotalLength) {
        var lt = filT.getTotalLength();
        gsap.set(filT, { strokeDasharray: lt, strokeDashoffset: lt });
        gsap.to(filT, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '[data-travail]', start: 'top 75%', end: 'center 40%', scrub: true } });
      }
    }

    // Apparitions douces des blocs (hors ouverture)
    $$('main section:not(.ouverture) [data-apparition]').forEach(function (el) {
      gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });

    // Le chiffre des avis compte jusqu'à 106
    var compteur = $('[data-compteur]');
    if (compteur) {
      var cible = +compteur.getAttribute('data-compteur'); var obj = { v: 0 };
      gsap.to(obj, { v: cible, duration: 1.8, ease: 'power2.out', scrollTrigger: { trigger: compteur, start: 'top 85%' },
        onUpdate: function () { compteur.textContent = Math.round(obj.v); } });
    }

    // La question finale monte mot à mot
    var question = $('.question [data-titre-anime]');
    if (question) {
      decouperMots(question);
      gsap.from('.question .mot-int', { yPercent: 110, duration: 1, stagger: .05, ease: 'power3.out', scrollTrigger: { trigger: question, start: 'top 80%' } });
    }
  }

  // Découpe un titre en mots (en gardant l'italique) pour les faire monter un par un
  function decouperMots(el) {
    var morceaux = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      var texte = n.textContent; var italique = n.nodeType === 1 && n.tagName === 'EM';
      texte.split(/(\s+)/).forEach(function (m) { if (m) morceaux.push({ m: m, em: italique }); });
    });
    el.textContent = '';
    morceaux.forEach(function (p) {
      if (/^\s+$/.test(p.m)) { el.appendChild(doc.createTextNode(' ')); return; }
      var ext = doc.createElement('span'); ext.className = 'mot-ext';
      var int = doc.createElement(p.em ? 'em' : 'span'); int.className = 'mot-int'; int.textContent = p.m;
      ext.appendChild(int); el.appendChild(ext);
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', animer); else animer();
})();
