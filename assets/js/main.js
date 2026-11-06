// =====================================================================
//  CONFIG : URL du script Google Sheets qui enregistre les réponses.
//  Colle ici l'URL de l'application Web (elle finit par /exec).
//  Tant que c'est vide, le site marche mais rien n'est partagé/enregistré.
//  Mode d'emploi : voir google-apps-script/Code.gs
// =====================================================================
const API_URL = 'https://script.google.com/macros/s/AKfycbzcGOcD7OZFLIzKt-Ho9kUIKjhtDDdb9Jyt_ynur1mbaSC-8OLLP44Y_yKcp43gdq70RQ/exec';

// ============ 1. PRELOADER 100% + RIDEAU ============
let loadVal = 0;
const loaderNum = document.getElementById('loader-num');
const preloader = document.getElementById('preloader');
const laserBar = document.getElementById('laser-bar');

const loadInterval = setInterval(() => {
  loadVal = Math.min(100, loadVal + Math.floor(Math.random() * 14) + 8);
  loaderNum.textContent = loadVal;
  if (loadVal === 100) {
    clearInterval(loadInterval);
    setTimeout(() => {
      laserBar.style.opacity = '0';
      preloader.classList.add('open');
      document.body.classList.add('is-loaded'); // lance l'entrée du hero
      setTimeout(() => { preloader.style.display = 'none'; }, 950);
    }, 250);
  }
}, 60);

// ============ 2. CURSEUR NÉON ============
const cursor = document.getElementById('custom-cursor');
window.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});

// ============ 3. BOULE DISCO (noire, avec quelques carrés lumineux qui scintillent) ============
const canvas = document.getElementById('discoCanvas');
const ctx = canvas.getContext('2d');
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = 320 * dpr;
canvas.height = 320 * dpr;
ctx.scale(dpr, dpr);

const BALL_COLORS = [[255, 255, 255], [200, 185, 255], [214, 255, 41], [255, 95, 195], [150, 125, 255]];
const hash = (a, b, c = 0) => {
  const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return s - Math.floor(s);
};
let angleY = 0;

function drawDiscoBall(time) {
  const W = 320, cx = 160, cy = 160, radius = 112;
  ctx.clearRect(0, 0, W, W);

  // léger halo
  const glow = ctx.createRadialGradient(cx, cy, radius * .8, cx, cy, radius * 1.4);
  glow.addColorStop(0, 'rgba(255, 60, 170, .28)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#040406';
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

  const latBands = 14;
  const tilt = 0.2;
  const flickFrame = Math.floor((time || 0) / 160);

  for (let i = 0; i < latBands; i++) {
    const t1 = (i / latBands) * Math.PI, t2 = ((i + 1) / latBands) * Math.PI, tm = (t1 + t2) / 2;
    const lonSteps = Math.max(6, Math.round(Math.sin(tm) * 28));

    for (let j = 0; j < lonSteps; j++) {
      const p1 = (j / lonSteps) * Math.PI * 2 + angleY;
      const p2 = ((j + 1) / lonSteps) * Math.PI * 2 + angleY;
      const padT = 0.02, padP = (Math.PI * 2 / lonSteps) * 0.09;

      const project = (t, p) => {
        const x = Math.sin(t) * Math.sin(p);
        const yr = -Math.cos(t), zr = Math.sin(t) * Math.cos(p);
        const y = yr * Math.cos(tilt) - zr * Math.sin(tilt);
        const z = yr * Math.sin(tilt) + zr * Math.cos(tilt);
        return { x: cx + x * radius, y: cy + y * radius, nx: x, ny: y, nz: z };
      };

      const c = project(tm, (p1 + p2) / 2);
      if (c.nz < 0) continue;
      const a = project(t1 + padT, p1 + padP), b = project(t1 + padT, p2 - padP);
      const d = project(t2 - padT, p2 - padP), e = project(t2 - padT, p1 + padP);

      // facette sombre, avec un reflet rose à gauche et violet à droite
      const shade = 9 + c.nz * 20;
      const pinkRim = Math.pow(Math.max(0, -c.nx * 0.85 + c.nz * 0.5), 4);
      const violetRim = Math.pow(Math.max(0, c.nx * 0.85 + c.nz * 0.5), 4);
      let r = shade + pinkRim * 120 + violetRim * 60;
      let g = shade + pinkRim * 15 + violetRim * 35;
      let bl = shade + 8 + pinkRim * 80 + violetRim * 150;

      // quelques carrés allumés (fixes) + d'autres qui clignotent
      const h = hash(i, j);
      const lit = h > 0.91 || hash(i, j, flickFrame) > 0.985;
      if (lit) {
        const col = BALL_COLORS[Math.floor(hash(j, i) * BALL_COLORS.length)];
        const k = 0.45 + 0.55 * c.nz;
        r = col[0] * k; g = col[1] * k; bl = col[2] * k;
      }

      ctx.fillStyle = `rgb(${r | 0}, ${g | 0}, ${bl | 0})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(d.x, d.y); ctx.lineTo(e.x, e.y);
      ctx.closePath(); ctx.fill();
    }
  }

  // ombre sur les bords pour donner du volume
  const shadow = ctx.createRadialGradient(cx - 10, cy - 20, radius * .35, cx, cy, radius);
  shadow.addColorStop(0, 'transparent');
  shadow.addColorStop(.8, 'rgba(0,0,0,.25)');
  shadow.addColorStop(1, 'rgba(0,0,0,.85)');
  ctx.fillStyle = shadow;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();

  angleY += 0.006;
  requestAnimationFrame(drawDiscoBall);
}
requestAnimationFrame(drawDiscoBall);

// ============ 4. ALIZÉE découpé en lettres (chacune sort du fond en fondu) ============
const heroTitle = document.getElementById('hero-title');
heroTitle.innerHTML = [...heroTitle.textContent.trim()]
  .map((ch, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${ch}</span>`)
  .join('');

// ============ 5. SCROLL : parallax du hero + programme épinglé qui défile à l'horizontale ============
const heroStage = document.querySelector('.hero-stage');
const heroPhoto = document.getElementById('hero-photo');

// Photo du hero tirée au hasard à chaque rechargement.
// Pour en ajouter une : mets le fichier dans assets/img/ et ajoute son nom ici.
const HERO_PHOTOS = ['assets/img/alizee1.png', 'assets/img/alizee2.png', 'assets/img/alizee3.png'];
document.getElementById('hero-photo-img').src = HERO_PHOTOS[Math.floor(Math.random() * HERO_PHOTOS.length)];
const programSection = document.getElementById('program-section');
const programSticky = programSection.querySelector('.program-sticky');
const programTrack = document.getElementById('program-track');
const programCards = [...programTrack.children];
let programMax = 0;
let scrollTicking = false;

// La section fait "1 écran + la distance que les cartes doivent parcourir" de haut :
// tant qu'on scrolle dedans, elle reste collée et on fait glisser les cartes.
function sizeProgram() {
  const pad = parseFloat(getComputedStyle(programSticky).paddingLeft);
  const visible = programSticky.clientWidth - pad * 2;
  programMax = Math.max(0, programTrack.scrollWidth - visible);
  programSection.style.height = `${window.innerHeight + programMax * 1.25}px`;
}

function onScroll() {
  scrollTicking = false;
  const y = window.scrollY;
  const vh = window.innerHeight;
  if (y < vh) {
    heroStage.style.transform = `translate3d(0, ${y * 0.3}px, 0)`;
    // la photo descend un peu moins vite et tourne légèrement pendant le scroll
    heroPhoto.style.transform = `translate3d(0, ${y * 0.18}px, 0) rotate(${y * 0.02}deg)`;
  }

  // programme : avancement 0 -> 1 pendant que la section est collée
  const rect = programSection.getBoundingClientRect();
  const scrollable = programSection.offsetHeight - vh;
  const progress = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 0;
  programTrack.style.transform = `translate3d(${-progress * programMax}px, 0, 0)`;

  // la carte qui sort par la gauche s'efface
  const leftEdge = programSticky.getBoundingClientRect().left + parseFloat(getComputedStyle(programSticky).paddingLeft);
  programCards.forEach((card) => {
    const r = card.getBoundingClientRect();
    const out = Math.max(0, leftEdge - r.left) / r.width;
    card.style.opacity = Math.max(0.12, 1 - out * 1.5).toFixed(3);
  });
}
window.addEventListener('scroll', () => {
  if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
// sur mobile, la barre d'adresse qui apparaît/disparaît déclenche "resize" :
// on ne recalcule que si la largeur change, sinon la page sauterait
let lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth !== lastWidth) { lastWidth = window.innerWidth; sizeProgram(); onScroll(); }
});
window.addEventListener('load', () => { sizeProgram(); onScroll(); });
sizeProgram();
onScroll();

// ============ 6. APPARITIONS AU SCROLL ============
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-inview');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
document.querySelectorAll('.genz-title, .reveal-blur, .reveal-tilt, .guest-wall').forEach((el) => revealObserver.observe(el));

// Pastilles : chacune part d'une position au hasard et vient se ranger
const guestWall = document.getElementById('guest-wall');
function preparePill(pill) {
  const rand = (min, max) => (Math.random() * (max - min) + min).toFixed(0);
  pill.style.setProperty('--x', rand(-240, 240) + 'px');
  pill.style.setProperty('--y', rand(-200, 100) + 'px');
  pill.style.setProperty('--r', rand(-35, 35) + 'deg');
  pill.style.setProperty('--d', (Math.random() * 0.45).toFixed(2) + 's');
}
guestWall.querySelectorAll('.pill').forEach(preparePill);
guestWall.addEventListener('click', (e) => {
  const pill = e.target.closest('.pill');
  if (pill) burstConfettiFromEl(pill);
});

// Dress code : "son 31" se fait barrer, puis "21" (le jour de la soirée) apparaît avec des étincelles
const dressCard = document.getElementById('dresscode-card');
const dcObserver = new IntersectionObserver((entries) => {
  if (!entries[0].isIntersecting) return;
  dcObserver.disconnect();
  setTimeout(() => {
    document.getElementById('dc-strike').style.width = '106%';
    setTimeout(() => {
      document.getElementById('dc-31').classList.add('is-struck');
      document.getElementById('dc-new').classList.add('is-on');
      triggerCardSparkles();
    }, 450);
  }, 900);
}, { threshold: 0.65 });
dcObserver.observe(dressCard);

function triggerCardSparkles() {
  const sp = document.getElementById('sparkleCanvas');
  const sctx = sp.getContext('2d');
  sp.width = dressCard.offsetWidth;
  sp.height = dressCard.offsetHeight;
  const dcNew = document.getElementById('dc-new').getBoundingClientRect();
  const box = dressCard.getBoundingClientRect();
  const ox = dcNew.left - box.left + dcNew.width / 2;
  const oy = dcNew.top - box.top + dcNew.height / 2;
  const parts = Array.from({ length: 32 }, () => ({
    x: ox, y: oy,
    vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.7) * 5,
    r: Math.random() * 2.5 + 1, color: Math.random() > 0.5 ? '#d6ff29' : '#ff2a9d', a: 1
  }));
  (function anim() {
    sctx.clearRect(0, 0, sp.width, sp.height);
    let alive = false;
    parts.forEach((p) => {
      if (p.a <= 0.02) return;
      alive = true;
      p.x += p.vx; p.y += p.vy; p.a -= 0.022;
      sctx.globalAlpha = Math.max(0, p.a);
      sctx.fillStyle = p.color;
      sctx.beginPath(); sctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); sctx.fill();
    });
    if (alive) requestAnimationFrame(anim);
  })();
}

// ============ 7. COMPTE À REBOURS (une tuile par chiffre) ============
const targetDate = new Date('2027-02-21T21:00:00+01:00').getTime();
const cdEls = ['cd-days', 'cd-hours', 'cd-mins', 'cd-secs'].map((id) => document.getElementById(id));

function renderDigits(el, value) {
  const str = String(value).padStart(2, '0');
  while (el.children.length < str.length) {
    const d = document.createElement('span');
    d.className = 'cd-digit';
    el.appendChild(d);
  }
  while (el.children.length > str.length) el.lastChild.remove();
  [...str].forEach((ch, i) => {
    const tile = el.children[i];
    if (tile.textContent === ch) return;
    const first = tile.textContent === '';
    tile.textContent = ch;
    if (!first) {
      tile.classList.remove('flip');
      void tile.offsetWidth;
      tile.classList.add('flip');
    }
  });
}

function updateCountdown() {
  const diff = Math.max(0, targetDate - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  [d, h, m, s].forEach((v, i) => renderDigits(cdEls[i], v));
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ============ 8. AGENDA & WHATSAPP ============
function openGoogleCalendar() {
  const url = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' +
    encodeURIComponent('🪩 ALIZÉE — 22 ANS') +
    '&dates=20270221T200000Z/20270222T040000Z' +
    '&details=' + encodeURIComponent('On fête mes 22 ans ! Dress code : Sur son 21. Musique, bulles et fiesta.') +
    '&location=' + encodeURIComponent('104 rue Nollet, 75017 Paris');
  window.open(url, '_blank');
}

function downloadICS() {
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Alizee 22 Ans//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:alizee-22ans-2027@party.fr',
    'SUMMARY:🪩 Anniversaire Alizée (22 ans)',
    'DTSTART:20270221T200000Z',
    'DTEND:20270222T040000Z',
    'LOCATION:104 rue Nollet\\, 75017 Paris',
    'DESCRIPTION:RDV à 21h ! Dress code : Sur son 21 ✨',
    'STATUS:CONFIRMED',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const link = document.createElement('a');
  link.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  link.download = 'alizee-22ans.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function shareWhatsApp() {
  const text = "🪩 T'es invité(e) aux 22 ans d'Alizée ! Dimanche 21 février à 21h (104 rue Nollet, Paris 17e). Confirme ta présence ici : " + window.location.href;
  window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(text), '_blank');
}

// ============ 9. RSVP ============
let rsvpStatus = 'yes';
function selectStatus(status, btn) {
  rsvpStatus = status;
  document.querySelectorAll('.rsvp-pill').forEach((b) => b.classList.toggle('is-active', b === btn));
}

async function submitRSVP(e) {
  e.preventDefault();
  const form = e.target;
  const nameInput = document.getElementById('rsvp-name');
  const songInput = document.getElementById('rsvp-song');
  const clubInput = form.querySelector('.check input');
  const submitBtn = form.querySelector('button[type="submit"]');
  const name = nameInput.value.trim().slice(0, 40);
  const song = songInput.value.trim().slice(0, 80);
  if (!name) return;

  // on retient le prénom sur ce téléphone (pour les musiques ajoutées ensuite)
  store.set('alizee-name', name);

  // affichage immédiat, sans attendre le serveur
  upsertLocalRsvp({ name, status: rsvpStatus, song });
  if (song) addLocalSong({ title: song, by: name });
  renderShared();

  submitBtn.disabled = true;
  const oldLabel = submitBtn.textContent;
  submitBtn.textContent = 'Envoi…';
  const ok = await sendToSheet({ type: 'rsvp', name, status: rsvpStatus, song, club: clubInput.checked });
  submitBtn.disabled = false;
  submitBtn.textContent = oldLabel;

  if (!ok) {
    showToast("Oups, ta réponse n'a pas pu être envoyée. Réessaie dans un instant 🙏");
    return;
  }
  const msg = { yes: `C'est noté ${name}, à dimanche ! 🪩`, maybe: `Ok ${name}, on croise les doigts 🤞`, no: `Dommage ${name}, tu vas nous manquer 🥲` };
  showToast(msg[rsvpStatus]);
  if (rsvpStatus === 'yes') burstConfetti(window.innerWidth / 2, window.innerHeight / 2);
  songInput.value = '';
  loadShared();
}

// ============ 10. SONDAGE (une carte, Avant / Après) ============
const pollSteps = [...document.querySelectorAll('.poll-step')];
const pollSegs = [...document.querySelectorAll('.poll-progress span')];
let currentPollStep = 0;

function changeStep(direction) {
  const next = Math.max(0, Math.min(pollSteps.length - 1, currentPollStep + direction));
  if (next === currentPollStep) return;
  currentPollStep = next;
  pollSteps.forEach((st, i) => st.classList.toggle('is-active', i === currentPollStep));
  pollSegs.forEach((seg, i) => seg.classList.toggle('is-on', i <= currentPollStep));
  document.getElementById('poll-counter').textContent = `${currentPollStep + 1}/${pollSteps.length}`;
  document.getElementById('poll-prev').disabled = currentPollStep === 0;
  document.getElementById('poll-next').disabled = currentPollStep === pollSteps.length - 1;
}
document.getElementById('poll-prev').disabled = true;

// swipe gauche / droite sur la carte (téléphone)
const pollCard = document.getElementById('poll-card');
let swipeX = null;
pollCard.addEventListener('touchstart', (e) => { swipeX = e.touches[0].clientX; }, { passive: true });
pollCard.addEventListener('touchend', (e) => {
  if (swipeX === null) return;
  const dx = e.changedTouches[0].clientX - swipeX;
  swipeX = null;
  if (Math.abs(dx) > 50) changeStep(dx < 0 ? 1 : -1);
});

function voteOption(btn) {
  const st = btn.closest('.poll-step');
  const q = st.dataset.q;
  const option = btn.dataset.opt;
  st.querySelectorAll('.poll-option').forEach((o) => o.classList.toggle('is-picked', o === btn));
  st.classList.add('has-voted');

  // un vote par question sur ce téléphone (un nouveau clic remplace l'ancien)
  const myVotes = store.getJSON('alizee-votes', {});
  myVotes[q] = option;
  store.set('alizee-votes', JSON.stringify(myVotes));

  if (!API_URL) return;
  shared.votes = shared.votes.filter((v) => !(v.q === q && v.voter === voterId)).concat({ q, option, voter: voterId });
  renderPoll();
  sendToSheet({ type: 'vote', q, option, voter: voterId });
}

async function proposeClub() {
  const input = document.getElementById('custom-club-input');
  const val = input.value.trim().slice(0, 50);
  if (!val) return;
  if (!shared.clubs.some((c) => norm(c) === norm(val))) shared.clubs.push(val);
  renderPoll();
  input.value = '';
  const ok = await sendToSheet({ type: 'club', name: val });
  if (ok) showToast(`${val} ajoutée au sondage 📍`);
}

// ============ 11. PLAYLIST & VINYLE ============
function appendSongToPlaylist(song) {
  const li = document.createElement('li');
  li.className = 'is-new';
  li.textContent = song;
  document.getElementById('playlist-tracks').appendChild(li);
}

function toggleSongInput() {
  const box = document.getElementById('add-song-box');
  box.hidden = !box.hidden;
  if (!box.hidden) document.getElementById('quick-song').focus();
}

async function addQuickSong() {
  const input = document.getElementById('quick-song');
  const title = input.value.trim().slice(0, 80);
  if (!title) return;
  const by = store.get('alizee-name') || 'Invité';
  addLocalSong({ title, by });
  renderSongs();
  input.value = '';
  const ok = await sendToSheet({ type: 'song', title, by });
  if (ok) showToast('Ajoutée à la playlist 🎶');
}

function toggleVinyl() {
  document.querySelector('.vinyl-disc').classList.toggle('paused');
}

// ============ 12. CONFETTIS ============
function burstConfettiFromEl(el) {
  const r = el.getBoundingClientRect();
  burstConfetti(r.left + r.width / 2, r.top + r.height / 2);
}

function burstConfetti(x, y) {
  for (let i = 0; i < 18; i++) {
    const dot = document.createElement('div');
    Object.assign(dot.style, {
      position: 'fixed', left: x + 'px', top: y + 'px', width: '7px', height: '7px',
      borderRadius: '50%', pointerEvents: 'none', zIndex: '9999',
      background: i % 2 === 0 ? '#d6ff29' : '#ff2a9d'
    });
    document.body.appendChild(dot);
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 70;
    dot.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`, opacity: 0 }
    ], { duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }).onfinish = () => dot.remove();
  }
}

// ============ 13. RÉPONSES PARTAGÉES (Google Sheets) ============
// Tout le monde voit la même chose : les RSVP "Je viens" deviennent des pastilles,
// les chansons s'ajoutent à la playlist, les votes donnent les vrais pourcentages.

// petit stockage local qui ne plante pas (navigation privée, etc.)
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* rien */ } },
  getJSON(k, fallback) { try { return JSON.parse(localStorage.getItem(k)) || fallback; } catch { return fallback; } },
};

// identifiant anonyme de ce téléphone (pour "un vote par personne")
let voterId = store.get('alizee-voter');
if (!voterId) {
  voterId = Math.random().toString(36).slice(2) + Date.now().toString(36);
  store.set('alizee-voter', voterId);
}

const shared = { rsvps: [], songs: [], votes: [], clubs: [] };

// comparaison sans majuscules / accents / emojis : "Célia ✨" == "celia"
const norm = (s) => String(s || '').toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\s+/g, ' ').trim();

async function sendToSheet(payload) {
  if (!API_URL) return true; // pas encore branché : on fait comme si c'était bon
  try {
    // corps en texte brut => pas de requête "preflight", Google l'accepte directement
    const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
    const data = await res.json();
    return !!data.ok;
  } catch (err) {
    console.error('Envoi impossible :', err);
    return false;
  }
}

async function loadShared() {
  if (!API_URL) return;
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    const data = await res.json();
    shared.rsvps = data.rsvps || [];
    shared.songs = data.songs || [];
    shared.votes = data.votes || [];
    shared.clubs = data.clubs || [];
    renderShared();
  } catch (err) {
    console.error('Chargement des réponses impossible :', err);
  }
}

function upsertLocalRsvp(r) {
  shared.rsvps = shared.rsvps.filter((x) => norm(x.name) !== norm(r.name)).concat(r);
}
function addLocalSong(s) {
  if (!shared.songs.some((x) => norm(x.title) === norm(s.title))) shared.songs.push(s);
}

// ----- pastilles "Ils seront là" -----
const PILL_COLORS = ['pill-pink', 'pill-lime', 'pill-violet', 'pill-white'];
const humanPills = () => [...guestWall.querySelectorAll('.pill:not(.pill-cat)')];
humanPills().forEach((p) => { p.dataset.name = norm(p.textContent); });

function renderGuests() {
  const firstCat = guestWall.querySelector('.pill-cat');
  shared.rsvps.forEach((r) => {
    const key = norm(r.name);
    if (!key) return;
    let pill = humanPills().find((p) => p.dataset.name === key);
    if (r.status === 'yes') {
      if (!pill) {
        pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'pill ' + PILL_COLORS[humanPills().length % PILL_COLORS.length];
        pill.textContent = r.name;
        pill.dataset.name = key;
        preparePill(pill);
        guestWall.insertBefore(pill, firstCat);
      }
      pill.hidden = false;
    } else if (pill) {
      pill.hidden = true; // a répondu "peut-être" ou "je viens pas"
    }
  });
  updateGuestCount();
}

// compteur + accord singulier/pluriel + message quand personne n'a encore confirmé
function updateGuestCount() {
  const n = humanPills().filter((p) => !p.hidden).length;
  document.getElementById('guest-count').textContent = n;
  document.getElementById('guest-count-label').textContent = n > 1 ? 'PERSONNES CONFIRMÉES' : 'PERSONNE CONFIRMÉE';
  document.getElementById('guests-empty').hidden = n > 0;
}

// ----- playlist -----
function renderSongs() {
  const list = document.getElementById('playlist-tracks');
  const have = new Set([...list.children].map((li) => norm(li.textContent)));
  shared.songs.forEach((s) => {
    if (s.title && !have.has(norm(s.title))) {
      appendSongToPlaylist(s.title);
      have.add(norm(s.title));
    }
  });
  document.getElementById('tracks-empty').hidden = list.children.length > 0;
}

// ----- sondage -----
pollSteps.forEach((st) => { st.dataset.q = st.querySelector('.poll-q').textContent.trim(); });
const optionKey = (btn) => btn.querySelector('span').textContent.replace('📍', '').trim();
document.querySelectorAll('.poll-option').forEach((b) => { b.dataset.opt = optionKey(b); });

function renderPoll() {
  // boîtes proposées par les invités
  const clubBox = document.getElementById('club-options-container');
  shared.clubs.forEach((club) => {
    const exists = [...clubBox.querySelectorAll('.poll-option')].some((b) => norm(b.dataset.opt) === norm(club));
    if (exists) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'poll-option';
    const label = document.createElement('span');
    label.textContent = '📍 ' + club;
    const pct = document.createElement('span');
    pct.className = 'pct';
    pct.textContent = '0%';
    btn.append(label, pct);
    btn.dataset.opt = club;
    btn.onclick = function () { voteOption(this); };
    clubBox.appendChild(btn);
  });

  // vrais pourcentages
  const myVotes = store.getJSON('alizee-votes', {});
  pollSteps.forEach((st) => {
    const q = st.dataset.q;
    const votes = shared.votes.filter((v) => v.q === q);
    const options = [...st.querySelectorAll('.poll-option')];
    options.forEach((btn) => {
      const n = votes.filter((v) => norm(v.option) === norm(btn.dataset.opt)).length;
      const pct = votes.length ? Math.round((n / votes.length) * 100) : 0;
      btn.style.setProperty('--pct', pct + '%');
      btn.querySelector('.pct').textContent = pct + '%';
      btn.classList.toggle('is-picked', myVotes[q] === btn.dataset.opt);
    });
    st.classList.toggle('has-voted', !!myVotes[q]);
  });
}

function renderShared() {
  renderGuests();
  renderSongs();
  renderPoll();
}

// petit message en bas de l'écran
function showToast(text) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.textContent = text;
  t.classList.remove('is-on');
  void t.offsetWidth;
  t.classList.add('is-on');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => t.classList.remove('is-on'), 3500);
}

// au démarrage
updateGuestCount();
renderSongs();
const savedName = store.get('alizee-name');
if (savedName) document.getElementById('rsvp-name').value = savedName;
if (API_URL) {
  // les faux pourcentages de la maquette sont remplacés par les vrais
  renderPoll();
  loadShared();
  // on récupère les nouvelles réponses toutes les 5 s, seulement si la page est affichée
  // (onglet en arrière-plan = pause, et on rattrape dès qu'on revient dessus)
  setInterval(() => { if (!document.hidden) loadShared(); }, 5000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loadShared(); });
} else {
  console.info('API_URL vide : les réponses ne sont pas encore partagées (voir google-apps-script/Code.gs).');
}
