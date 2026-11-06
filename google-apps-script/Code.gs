/**
 * =====================================================================
 *  ALIZÉE 22 ANS — enregistrement des réponses dans Google Sheets
 * =====================================================================
 *
 *  MISE EN PLACE (une seule fois, ~5 minutes) :
 *
 *  1. Va sur https://sheets.google.com et crée un tableur vide
 *     (nomme-le par exemple « Anniv Alizée »).
 *  2. Dans le tableur : menu Extensions > Apps Script.
 *  3. Efface tout le code qui s'affiche, colle TOUT ce fichier à la place,
 *     puis clique sur l'icône disquette (Enregistrer).
 *  4. En haut à droite : Déployer > Nouveau déploiement.
 *       - Clique sur la roue dentée à côté de « Sélectionner le type » > Application Web
 *       - Exécuter en tant que : Moi
 *       - Qui a accès : Tout le monde
 *       - Clique sur Déployer, puis autorise l'accès avec ton compte Google
 *         (si Google affiche « application non validée » : Paramètres avancés >
 *          Accéder au projet — c'est normal, c'est ton propre script).
 *  5. Copie l'« URL de l'application Web » (elle finit par /exec)
 *     et colle-la dans assets/js/main.js, ligne :  const API_URL = '...';
 *
 *  Les onglets RSVP, Musiques, Votes et Boites se créent tout seuls
 *  à la première réponse. Tu peux y supprimer une ligne (spam, doublon) :
 *  elle disparaîtra du site au prochain rafraîchissement.
 *
 *  Si tu modifies ce script plus tard : Déployer > Gérer les déploiements >
 *  crayon > Version : Nouvelle version > Déployer (l'URL reste la même).
 * =====================================================================
 */

const TABS = {
  rsvp:  { name: 'RSVP',     header: ['Date', 'Prénom', 'Réponse', 'Chanson', 'Chaud·e pour la boîte', 'Clé'] },
  songs: { name: 'Musiques', header: ['Date', 'Titre', 'Proposé par'] },
  votes: { name: 'Votes',    header: ['Date', 'Question', 'Choix', 'Votant'] },
  clubs: { name: 'Boites',   header: ['Date', 'Boîte'] },
};

const STATUS_LABELS = { yes: 'Je viens', maybe: 'Peut-être', no: 'Je viens pas' };
const STATUS_CODES = { 'Je viens': 'yes', 'Peut-être': 'maybe', 'Je viens pas': 'no' };

// ---------- lecture : le site récupère tout en une fois ----------
function doGet() {
  const data = {
    rsvps: rows_('rsvp').filter(r => r[1]).map(r => ({
      name: String(r[1]),
      status: STATUS_CODES[String(r[2]).trim()] || 'yes',
      song: String(r[3] || ''),
    })),
    songs: rows_('songs').filter(r => r[1]).map(r => ({ title: String(r[1]), by: String(r[2] || '') })),
    votes: rows_('votes').filter(r => r[1] && r[2]).map(r => ({ q: String(r[1]), option: String(r[2]), voter: String(r[3] || '') })),
    clubs: rows_('clubs').filter(r => r[1]).map(r => String(r[1])),
  };
  return json_(data);
}

// ---------- écriture : une réponse, une chanson, un vote ou une boîte ----------
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // évite que deux réponses simultanées s'écrasent
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    const now = new Date();

    if (d.type === 'rsvp') {
      const name = clean_(d.name, 40);
      if (!name) return json_({ ok: false, error: 'prénom manquant' });
      const status = STATUS_LABELS[d.status] ? d.status : 'yes';
      const song = clean_(d.song, 80);
      // même prénom = on met à jour sa réponse au lieu d'ajouter un doublon
      upsert_('rsvp', r => r[5] === key_(name),
        [now, name, STATUS_LABELS[status], song, d.club ? 'Oui' : 'Non', key_(name)]);
      if (song) addSong_(now, song, name);

    } else if (d.type === 'song') {
      const title = clean_(d.title, 80);
      if (!title) return json_({ ok: false, error: 'titre manquant' });
      addSong_(now, title, clean_(d.by, 40));

    } else if (d.type === 'vote') {
      const q = clean_(d.q, 120), option = clean_(d.option, 80), voter = clean_(d.voter, 40);
      if (!q || !option || !voter) return json_({ ok: false, error: 'vote incomplet' });
      // un seul vote par personne et par question : un nouveau vote remplace l'ancien
      upsert_('votes', r => r[1] === q && r[3] === voter, [now, q, option, voter]);

    } else if (d.type === 'club') {
      const club = clean_(d.name, 50);
      if (!club) return json_({ ok: false, error: 'nom manquant' });
      const exists = rows_('clubs').some(r => key_(r[1]) === key_(club));
      if (!exists) tab_('clubs').appendRow([now, club]);

    } else {
      return json_({ ok: false, error: 'type inconnu' });
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// ---------- outils ----------
function tab_(type) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TABS[type].name);
  if (!sh) {
    sh = ss.insertSheet(TABS[type].name);
    sh.appendRow(TABS[type].header);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, TABS[type].header.length).setFontWeight('bold');
  }
  return sh;
}

function rows_(type) {
  const values = tab_(type).getDataRange().getValues();
  values.shift(); // enlève la ligne d'en-tête
  return values;
}

function upsert_(type, match, row) {
  const sh = tab_(type);
  const rows = rows_(type);
  const i = rows.findIndex(match);
  if (i === -1) sh.appendRow(row);
  else sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
}

function addSong_(date, title, by) {
  const exists = rows_('songs').some(r => key_(r[1]) === key_(title));
  if (!exists) tab_('songs').appendRow([date, title, by]);
}

// texte propre : pas de retours à la ligne, longueur limitée, pas de formule Sheets
function clean_(s, max) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/^[=+\-@]+/, '')
    .trim()
    .slice(0, max);
}

// clé de comparaison : minuscules, sans accents, espaces simplifiés
function key_(s) {
  return String(s == null ? '' : s).toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
