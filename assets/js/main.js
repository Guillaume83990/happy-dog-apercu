/* Happy Dog Saint-Tropez · comportements de la page (aucun script dans le HTML : CSP stricte) */
(function () {
  'use strict';
  var doc = document;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EN = doc.documentElement.lang === 'en';
  var T = EN ? {
    ouvrir: 'Open the menu', fermer: 'Close the menu', ecouter: 'In a few words…', parle: 'Vanessa is speaking',
    bientot: 'Her message is coming very soon', popup: '/happy-dog-apercu/assets/data/popup-en.json',
    choisir: 'Please choose an answer.', accord: 'Please tick the box so that Vanessa can contact you.',
    wa: { bonjour: 'Hello Vanessa, here is my answer to the question on your website.', question: 'Question:', reponse: 'My answer:', prenom: 'First name:', chien: 'My dog:', tel: 'Phone:' }
  } : {
    ouvrir: 'Ouvrir le menu', fermer: 'Fermer le menu', ecouter: 'En quelques mots…', parle: 'Vanessa vous parle',
    bientot: 'Son message arrive très bientôt', popup: '/happy-dog-apercu/assets/data/popup.json',
    choisir: 'Choisissez une réponse.', accord: 'Cochez la case pour que Vanessa puisse vous recontacter.',
    wa: { bonjour: 'Bonjour Vanessa, voici ma réponse à la question de votre site.', question: 'Question :', reponse: 'Ma réponse :', prenom: 'Prénom :', chien: 'Mon chien :', tel: 'Téléphone :' }
  };
  var WHATSAPP = '33620708873'; // le numéro WhatsApp de Vanessa (le même que les boutons « Écrire sur WhatsApp »)

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

  /* ---------- CRM pop-up (22/11) : le contenu vient du tableau Google de Vanessa (outils/popup-google/Code.gs)
     3 modes : question, jeu concours, offre du moment. Les réponses repartent dans le même tableau,
     et, si Vanessa le veut (onglet « Réglages »), le message s'ouvre aussi dans WhatsApp. ---------- */
  var POPUP_SCRIPT = ''; // aperçu : mode démo
  var P = EN ? {
    jusqua: 'Until', annonce: 'Winner announced on Instagram (@happydogsainttropez) on', mois: 'en-GB',
    reponseLibre: 'Your answer', troisMots: 'In 3 words', reglement: 'Please tick the box to accept the giveaway rules.',
    envoyer: { question: 'Send my answer', jeu: 'Enter the giveaway', offre: 'Call me back' },
    note: { question: 'Your answer goes straight to Vanessa.', jeu: 'Free, no purchase necessary.', offre: 'Vanessa will call you back personally.' },
    enCours: 'Sending…',
    merci: { question: 'Vanessa has received your answer and will get back to you personally.', jeu: 'You are in! Good luck. The winner will be announced on Instagram.', offre: 'Vanessa has received your request and will call you back personally.' },
    merciWa: 'Your message is also ready in WhatsApp: just press Send.',
    echec: 'Your answer could not be sent. Please send it to Vanessa on WhatsApp:',
    boutonWa: 'Also message Vanessa on WhatsApp', boutonWaSecours: 'Send on WhatsApp',
    intro: { question: 'Hello Vanessa, here is my answer to the question on your website.', jeu: 'Hello Vanessa, I am entering the giveaway on your website.', offre: 'Hello Vanessa, I am interested in the offer on your website.' }
  } : {
    jusqua: 'Jusqu’au', annonce: 'Gagnant annoncé sur Instagram (@happydogsainttropez) le', mois: 'fr-FR',
    reponseLibre: 'Votre réponse', troisMots: 'En 3 mots', reglement: 'Cochez la case pour accepter le règlement du jeu.',
    envoyer: { question: 'Envoyer ma réponse', jeu: 'Je participe', offre: 'Être rappelé(e)' },
    note: { question: 'Votre réponse arrive directement chez Vanessa.', jeu: 'Jeu gratuit, sans obligation d’achat.', offre: 'Vanessa vous rappelle personnellement.' },
    enCours: 'Envoi…',
    merci: { question: 'Vanessa a bien reçu votre réponse et vous recontacte personnellement.', jeu: 'Votre participation est enregistrée, bonne chance ! Le gagnant sera annoncé sur Instagram.', offre: 'Vanessa a bien reçu votre demande et vous rappelle personnellement.' },
    merciWa: 'Votre message est aussi prêt dans WhatsApp : il ne reste qu’à appuyer sur Envoyer.',
    echec: 'Votre réponse n’a pas pu partir. Envoyez-la à Vanessa sur WhatsApp :',
    boutonWa: 'Écrire aussi à Vanessa sur WhatsApp', boutonWaSecours: 'Envoyer sur WhatsApp',
    intro: { question: 'Bonjour Vanessa, voici ma réponse à la question de votre site.', jeu: 'Bonjour Vanessa, je participe au jeu concours de votre site.', offre: 'Bonjour Vanessa, l’offre du moment de votre site m’intéresse.' }
  };
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
    var boutonsPopup = $$('[data-ouvrir-popup]');
    var form = $('[data-popup-form]', popup);
    var erreur = $('[data-popup-erreur]', popup);
    var autre = $('[data-popup-autre]', popup);
    var choix = $('[data-popup-choix]', popup);
    var envoyer = $('[data-popup-envoyer]', popup);
    var config = null;
    // En local seulement : « ?popup=essai » lit le faux tableau du serveur de test (outils/popup-google/essai-local.json)
    var essai = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]popup=essai/.test(location.search);
    var script = essai ? '/__popup-essai' : POPUP_SCRIPT;
    var source = script ? script + '?langue=' + (EN ? 'en' : 'fr') : T.popup;

    boutonsPopup.forEach(function (b) { b.addEventListener('click', ouvrirPopup); });
    $$('[data-fermer-popup]', popup).forEach(function (b) { b.addEventListener('click', fermerPopup); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermerPopup(); });

    function dateLisible(iso) {
      if (!iso) return '';
      return new Date(iso + 'T12:00:00').toLocaleDateString(P.mois, { day: 'numeric', month: 'long' });
    }
    function cacherBouton() { boutonsPopup.forEach(function (b) { b.hidden = true; }); }

    /* Met le pop-up dans le mode choisi par Vanessa */
    function appliquer(d) {
      config = d;
      var mode = { question: 1, jeu: 1, offre: 1 }[d.mode] ? d.mode : 'question';
      d.mode = mode;
      popup.setAttribute('data-mode', mode);
      $('[data-popup-etiquette]').textContent = d.bouton || $('[data-popup-etiquette]').textContent;
      var surtitre = $('[data-popup-surtitre]', popup);
      surtitre.textContent = d.surtitre || ''; surtitre.hidden = !d.surtitre;
      $('[data-popup-titre]', popup).textContent = d.titre;
      var texte = $('[data-popup-texte]', popup);
      texte.textContent = d.texte || ''; texte.hidden = !d.texte;
      var infos = [];
      if (d.fin && mode !== 'question') infos.push(P.jusqua + ' ' + dateLisible(d.fin));
      if (d.annonce && mode === 'jeu') infos.push(P.annonce + ' ' + dateLisible(d.annonce));
      var zoneInfos = $('[data-popup-infos]', popup);
      zoneInfos.textContent = infos.join(' · '); zoneInfos.hidden = !infos.length;

      // Choix de réponse ; sans choix (question ou jeu), le visiteur écrit sa réponse
      $$('label', choix).forEach(function (l) { l.remove(); });
      var liste = mode === 'offre' ? [] : (d.choix || []).slice();
      var libre = mode !== 'offre' && !liste.length;
      if (d.autre && liste.length) liste.push(EN ? 'Other' : 'Autre');
      liste.forEach(function (t, i) {
        var l = doc.createElement('label');
        var e = doc.createElement('input');
        e.type = 'radio'; e.name = 'reponse'; e.value = t; e.id = 'reponse-' + i;
        if (d.autre && i === liste.length - 1) e.setAttribute('data-autre', '');
        l.appendChild(e); l.appendChild(doc.createTextNode(t));
        choix.appendChild(l);
      });
      choix.hidden = !liste.length;
      autre.hidden = !libre; form.autre.required = libre;
      form.autre.maxLength = libre ? 120 : 40;
      $('[data-popup-autre-etiquette]', popup).textContent = libre ? P.reponseLibre : P.troisMots;

      // Champs propres au jeu concours
      $$('[data-seulement="jeu"]', form).forEach(function (el) { el.hidden = mode !== 'jeu'; });
      $$('[data-sauf="jeu"]', form).forEach(function (el) { el.hidden = mode === 'jeu'; });
      envoyer.textContent = P.envoyer[mode];
      $('[data-popup-note]', popup).textContent = P.note[mode];
      boutonsPopup.forEach(function (b) { b.hidden = false; b.classList.remove('est-en-attente'); });
    }

    // Lecture du pop-up du jour (5 s au plus : sinon le bouton reste caché, rien ne clignote)
    var controle = window.AbortController ? new AbortController() : null;
    var delai = setTimeout(function () { if (controle) controle.abort(); }, 5000);
    fetch(source, { cache: 'no-cache', signal: controle ? controle.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        clearTimeout(delai);
        if (!d || !d.actif || !d.titre) { cacherBouton(); return; }
        appliquer(d);
      })
      .catch(function () { cacherBouton(); });

    form.addEventListener('change', function (e) {
      if (e.target.name !== 'reponse') return;
      var oui = e.target.hasAttribute('data-autre');
      autre.hidden = !oui; form.autre.required = oui;
      if (oui) form.autre.focus();
    });
    // Messages du module de validation en anglais sur la version anglaise
    if (EN && window.SWPValidation) {
      var M = window.SWPValidation.messages;
      M.requis = 'Please fill in this field.';
      M.tel = 'Please enter a valid phone number (with +44, +1… if you are abroad).';
      M.max = 'This text is a little long ({n} characters maximum).';
      M.resume = function (n) { return n > 1 ? n + ' fields need correcting.' : 'One field needs correcting.'; };
    }

    function lienWhatsApp(mode, reponse) {
      var lignes = [P.intro[mode]];
      if (mode !== 'offre') lignes.push(T.wa.question + ' ' + config.titre, T.wa.reponse + ' ' + reponse);
      else lignes.push(config.titre);
      lignes.push(T.wa.prenom + ' ' + form.prenom.value.trim());
      if (form.chien.value.trim()) lignes.push(T.wa.chien + ' ' + form.chien.value.trim());
      lignes.push(T.wa.tel + ' ' + form.tel.value.trim());
      if (mode === 'jeu' && form.instagram.value.trim()) lignes.push('Instagram : ' + form.instagram.value.trim());
      return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lignes.join('\n'));
    }
    function merci(texte, lien, libelle, titre) {
      $('[data-popup-merci] h3', popup).textContent = titre || (EN ? 'Thank you!' : 'Merci !');
      var boutonWa = $('[data-popup-whatsapp]', popup);
      $('[data-popup-merci-texte]', popup).textContent = texte;
      boutonWa.href = lien; boutonWa.textContent = libelle;
      form.hidden = true;
      var zone = $('[data-popup-merci]', popup);
      zone.hidden = false; zone.focus();
    }

    /* Envoi : le module de validation (validation-formulaire.js) a déjà vérifié les champs texte et le téléphone */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!config) return;
      var mode = config.mode;
      var choisi = $('input[name="reponse"]:checked', form);
      var msg = '';
      if ($$('input[name="reponse"]', form).length && !choisi) msg = T.choisir;
      else if (mode === 'jeu' && !form.reglement.checked) msg = P.reglement;
      else if (mode !== 'jeu' && !form.accord.checked) msg = T.accord;
      if (msg) { erreur.textContent = msg; erreur.hidden = false; return; }
      erreur.hidden = true;

      var reponse = '';
      if (choisi) reponse = choisi.value + (choisi.hasAttribute('data-autre') ? ' : ' + form.autre.value.trim() : '');
      else if (!autre.hidden) reponse = form.autre.value.trim();
      var lien = lienWhatsApp(mode, reponse);
      var ouvrirWa = config.whatsapp !== false;

      // Démo sans tableau : WhatsApp seulement (comme avant le 22/11)
      if (!script) { window.open(lien, '_blank', 'noopener'); merci(P.merciWa, lien, EN ? 'Open WhatsApp' : 'Ouvrir WhatsApp'); return; }

      var donnees = {
        langue: EN ? 'en' : 'fr', reponse: reponse, prenom: form.prenom.value.trim(), chien: form.chien.value.trim(),
        tel: form.tel.value.trim(), instagram: mode === 'jeu' ? form.instagram.value.trim() : '',
        accord: mode !== 'jeu' && form.accord.checked, reglement: mode === 'jeu' && form.reglement.checked,
        nouvelles: mode === 'jeu' && form.nouvelles.checked, page: location.pathname,
        site_web_confirmation: form.site_web_confirmation ? form.site_web_confirmation.value : ''
      };
      // Corps en texte simple : le navigateur l'envoie sans demande préalable au serveur de Google
      var envoi = fetch(script, { method: 'POST', body: JSON.stringify(donnees), keepalive: true })
        .then(function (r) { return r.json(); })
        .then(function (r) { return !!(r && r.ok); })
        .catch(function () { return false; });

      if (ouvrirWa) {
        // WhatsApp s'ouvre tout de suite (pendant le clic, sinon le navigateur le bloque) ; la réponse part en même temps vers le tableau
        window.open(lien, '_blank', 'noopener');
        merci(P.merci[mode] + ' ' + P.merciWa, lien, P.boutonWa);
        return;
      }
      envoyer.disabled = true; envoyer.textContent = P.enCours;
      envoi.then(function (ok) {
        envoyer.disabled = false; envoyer.textContent = P.envoyer[mode];
        if (ok) merci(P.merci[mode], lien, P.boutonWa);
        else merci(P.echec, lien, P.boutonWaSecours, EN ? 'Almost there' : 'Presque fini');  // aucune réponse perdue : WhatsApp en secours
      });
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

  /* ---------- En images : 4 vidéos. 24/11 (Vanessa) : plus de lecture automatique.
     Chaque vidéo démarre avec SON bouton lecture, avec le son ; lancer une vidéo arrête les autres :
     une seule joue à la fois. Hors de l'écran, elle se met en pause. ---------- */
  var cartesVideo = $$('[data-video]');
  function etiquetteSon(bouton, actif) {
    if (!bouton) return;
    bouton.setAttribute('aria-pressed', actif ? 'true' : 'false');
    bouton.setAttribute('aria-label', actif ? (EN ? 'Turn sound off' : 'Couper le son') : (EN ? 'Turn sound on' : 'Activer le son'));
  }
  function arreterLesAutres(garde) {
    cartesVideo.forEach(function (c) {
      var v = $('video', c);
      if (c !== garde && v && !v.paused) v.pause();
    });
  }
  function charger(video) {
    var source = video.getAttribute('data-src');
    if (!source || video.getAttribute('src')) return;
    video.preload = 'metadata';
    video.src = source + '#t=0.001'; /* la première image s'affiche, rien ne joue */
    video.load();
  }
  cartesVideo.forEach(function (carte) {
    var video = $('video', carte);
    var son = $('[data-video-son]', carte);
    var cadre = $('.video__cadre', carte);
    video.loop = false;
    video.removeAttribute('loop');
    /* bouton lecture posé sur la vidéo (même rond que l'attente) */
    var jouer = document.createElement('button');
    jouer.type = 'button';
    jouer.className = 'video__jouer';
    jouer.setAttribute('aria-label', EN ? 'Play the video' : 'Lire la vidéo');
    var rond = $('.video__lecture', carte);
    if (rond) jouer.appendChild(rond.cloneNode(true));
    cadre.appendChild(jouer);
    function lancer() {
      if (!video.getAttribute('data-src')) return; /* carte sans vidéo */
      charger(video);
      arreterLesAutres(carte);
      video.muted = false;
      etiquetteSon(son, true);
      video.play().catch(function () {
        video.muted = true; etiquetteSon(son, false);
        video.play().catch(function () {});
      });
    }
    video.addEventListener('loadeddata', function () { carte.classList.add('est-prete'); });
    video.addEventListener('play', function () { carte.classList.add('en-lecture'); });
    video.addEventListener('pause', function () { carte.classList.remove('en-lecture'); });
    video.addEventListener('ended', function () { carte.classList.remove('en-lecture'); video.currentTime = 0; });
    cadre.addEventListener('click', function (e) {
      if (e.target.closest('[data-video-son]')) return;
      if (video.paused) lancer(); else video.pause();
    });
    if (son) son.addEventListener('click', function () {
      if (video.paused) { lancer(); return; }
      video.muted = !video.muted;
      etiquetteSon(son, !video.muted);
    });
  });
  if (cartesVideo.length && 'IntersectionObserver' in window) {
    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        var video = $('video', e.target);
        if (e.isIntersecting) charger(video); /* on prépare la première image, sans lancer */
        else if (!video.paused) video.pause();
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

    // En images : les 4 vidéos apparaissent en montant, puis restent alignées ; le fil cuivre les relie
    if ($('[data-travail]') && window.matchMedia('(min-width: 901px)').matches) {
      gsap.from('.video', { y: 140, opacity: 0, duration: 1.2, stagger: .18, ease: 'power3.out', scrollTrigger: { trigger: '[data-travail]', start: 'top 82%' } });
      /* 24/11 (Guillaume) : plus de décalage des vidéos au défilement : elles mordaient sur le titre et sur leurs textes */
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

    // 21/11 (page Auteur) : « Ce que le chien révèle », les trois mots s'éclairent l'un après l'autre, au rythme du défilement
    $$('.revele li').forEach(function (li) {
      gsap.fromTo(li, { opacity: .2 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: li, start: 'top 86%', end: 'top 58%', scrub: .5 } });
      var h = $('h3', li);
      if (h) gsap.fromTo(h, { x: -18 }, { x: 0, ease: 'none', scrollTrigger: { trigger: li, start: 'top 86%', end: 'top 58%', scrub: .5 } });
    });

    // 21/11 (page Coach en visio) : sous chaque sujet, une ligne cuivre se trace au rythme du défilement
    $$('[data-sujet]').forEach(function (li) {
      gsap.fromTo(li, { '--trait': 0 }, { '--trait': 1, ease: 'none', scrollTrigger: { trigger: li, start: 'top 88%', end: 'top 60%', scrub: .6 } });
    });

    // 21/11 (page Coach en visio) : le fil cuivre relie les villes une à une, chaque point s'allume quand le fil l'atteint
    var rangee = $('[data-horloges]');
    if (rangee) {
      var filH = $('.horloges__fil', rangee); var villes = $$('.horloge', rangee);
      if (filH) gsap.fromTo(filH, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: rangee, start: 'top 85%', end: 'top 45%', scrub: .6,
        onUpdate: function (st) { villes.forEach(function (v, i) { v.classList.toggle('est-allumee', st.progress >= i / Math.max(1, villes.length - 1) - .02); }); } } });
    }

    // 21/11 (page Qui suis-je) : la frise du parcours, le fil cuivre se trace et chaque étape s'éclaire quand il l'atteint
    var frise = $('[data-frise]');
    if (frise) {
      var filF = $('.parcours__fil', frise); var etapes = $$('.parcours__etape', frise);
      var allumer = function () {
        var basFil = filF.getBoundingClientRect().top + filF.getBoundingClientRect().height * (+gsap.getProperty(filF, 'scaleY') || 0);
        etapes.forEach(function (e) { e.classList.toggle('est-allumee', e.getBoundingClientRect().top + 14 <= basFil); });
      };
      if (filF) gsap.fromTo(filF, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: frise, start: 'top 65%', end: 'bottom 65%', scrub: .5, onUpdate: allumer, onRefresh: allumer } }); /* la pointe du fil reste aux deux tiers de l'écran */
    }

    // 21/11 (page Auteur) : le livre se redresse doucement pendant qu'on lit sa présentation
    var livre = $('[data-livre] .livre-objet__couv');
    if (livre) gsap.fromTo(livre, { rotateY: -28, rotateX: 4 }, { rotateY: -7, rotateX: 0, ease: 'none', scrollTrigger: { trigger: '.livre-page', start: 'top 85%', end: 'bottom 65%', scrub: .8 } });

    // 21/11 (page Auteur) : les extraits du livre se lisent au rythme du défilement, une marge cuivre se trace le long du texte
    $$('[data-lecture]').forEach(function (bloc) {
      $$('p', bloc).forEach(function (p) {
        var mots = p.textContent.trim().split(/[ \t\r\n]+/); /* les espaces insécables restent dans le mot (« : », « ? ») */
        p.textContent = '';
        mots.forEach(function (m, i) {
          var s = doc.createElement('span'); s.className = 'mot'; s.textContent = m;
          p.appendChild(s);
          if (i < mots.length - 1) p.appendChild(doc.createTextNode(' '));
        });
      });
      gsap.to($$('.mot', bloc), { opacity: 1, stagger: .03, ease: 'none', scrollTrigger: { trigger: bloc, start: 'top 80%', end: 'bottom 55%', scrub: .6 } });
      var marge = $('.lecture__marge', bloc.parentNode);
      if (marge) gsap.fromTo(marge, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: bloc, start: 'top 80%', end: 'bottom 55%', scrub: .6 } });
    });

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

/* 20/11 : page Auteur / Conférencier : un seul extrait du livre joue à la fois */
(function () {
  var films = Array.prototype.slice.call(document.querySelectorAll('[data-extrait]'));
  films.forEach(function (f) {
    f.addEventListener('play', function () { films.forEach(function (autre) { if (autre !== f && !autre.paused) autre.pause(); }); });
  });
})();

/* 21/11 : page Coach en visio : les horloges donnent l'heure réelle de chaque ville (calculée par le navigateur), mise à jour chaque minute */
(function () {
  var heures = Array.prototype.slice.call(document.querySelectorAll('[data-fuseau]'));
  if (!heures.length || !window.Intl) return;
  function majHeures() {
    var maintenant = new Date();
    heures.forEach(function (el) {
      try {
        el.textContent = new Intl.DateTimeFormat(el.getAttribute('data-langue') === 'en' ? 'en-GB' : 'fr-FR',
          { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: el.getAttribute('data-fuseau') }).format(maintenant);
      } catch (e) { /* fuseau inconnu : on garde « --:-- » */ }
    });
  }
  majHeures();
  setTimeout(function () { majHeures(); setInterval(majHeures, 60000); }, (60 - new Date().getSeconds()) * 1000);
  /* toutes les villes allumées quand il n'y a pas d'animation */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    Array.prototype.slice.call(document.querySelectorAll('.horloge')).forEach(function (v) { v.classList.add('est-allumee'); });
  }
})();

/* 21/11 : page Où j'interviens : la commune lue s'allume, dans la liste et dans l'index (fonctionne aussi sans animation) */
(function () {
  var communes = Array.prototype.slice.call(document.querySelectorAll('[data-commune]'));
  if (!communes.length || !('IntersectionObserver' in window)) return;
  var liens = {};
  Array.prototype.slice.call(document.querySelectorAll('[data-index-commune]')).forEach(function (a) { liens[a.getAttribute('data-index-commune')] = a; });
  var activer = function (c) {
    communes.forEach(function (x) {
      var actif = x === c; x.classList.toggle('est-active', actif);
      if (actif) x.classList.add('est-lue');
      if (liens[x.id]) liens[x.id].classList.toggle('est-active', actif);
    });
  };
  /* la commune active est celle qui traverse la bande située à 40 % de la hauteur de l'écran */
  var obs = new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) { if (e.isIntersecting) activer(e.target); });
  }, { rootMargin: '-40% 0px -55% 0px' });
  communes.forEach(function (c) { obs.observe(c); });
})();
