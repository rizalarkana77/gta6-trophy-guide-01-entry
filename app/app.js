// Leonida Legend — GTA VI trophy tracker. Plain ES module, no build step, no network.
// Data lives in data/trophies.json and data/roadmap.json next to this file; progress
// lives in localStorage under leonida-legend-progress-v1 and never leaves the browser.

const STORAGE_KEY = 'leonida-legend-progress-v1';
const DEMO_EARNED = [2, 3, 4, 5, 6, 8, 9, 10, 16, 20, 21, 35];

const KIND_LABELS = {
  story: 'Story',
  'side-quests': 'Side quests',
  collectibles: 'Collectibles',
  activities: 'Activities',
  platinum: 'Platinum & 100%',
};
const KIND_CHIPS = ['all', 'story', 'side-quests', 'collectibles', 'activities', 'platinum', 'missable', 'online'];

const state = {
  trophies: [],
  roadmap: null,
  earned: new Set(),
  demo: false,
  kind: 'all',
  grade: '',
  status: '',
  query: '',
  spoiler: false,
  open: new Set(),
  topId: null,
};

const $ = (id) => document.getElementById(id);

async function loadGuideData() {
  const [trophiesRes, roadmapRes] = await Promise.all([
    fetch('data/trophies.json'),
    fetch('data/roadmap.json'),
  ]);
  if (!trophiesRes.ok || !roadmapRes.ok) throw new Error('could not load guide data');
  const trophiesDoc = await trophiesRes.json();
  state.trophies = trophiesDoc.trophies;
  state.roadmap = await roadmapRes.json();
  const saved = loadSavedProgress();
  state.earned = new Set(saved);
}

function loadSavedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => Number.isInteger(id));
  } catch {
    return [];
  }
}

function saveProgress() {
  if (state.demo) return; // demo ticks are in-memory only
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.earned].sort((a, b) => a - b)));
  } catch {
    // storage full or unavailable — the page still works, it just cannot persist
  }
}

function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('demo') === '1') {
    state.demo = true;
    state.earned = new Set(DEMO_EARNED);
  }
  const view = params.get('view');
  if (view === 'list') $('roadmap-section').hidden = true;
  if (view === 'roadmap') $('list-section').hidden = true;
  const kind = params.get('kind');
  if (kind && (KIND_CHIPS.includes(kind) || kind === 'missable')) state.kind = kind;
  if (params.get('spoiler') === 'on') state.spoiler = true;
  const open = Number(params.get('open'));
  if (Number.isInteger(open) && open > 0) state.open.add(open);
  const top = Number(params.get('top'));
  if (Number.isInteger(top) && top > 0) state.topId = top;
}

function renderRoadmap() {
  const roadmap = state.roadmap;
  if (!roadmap) return;
  const factsEl = $('roadmap-facts');
  factsEl.innerHTML = '';
  for (const fact of roadmap.facts) {
    const wrap = document.createElement('div');
    wrap.className = 'fact';
    const dt = document.createElement('dt');
    dt.textContent = fact.label;
    const dd = document.createElement('dd');
    dd.textContent = fact.value;
    const dl = document.createElement('dl');
    dl.append(dt, dd);
    wrap.append(dl);
    factsEl.append(wrap);
  }
  const stepsEl = $('roadmap-steps');
  stepsEl.innerHTML = '';
  for (const step of roadmap.steps) {
    const li = document.createElement('li');
    const h4 = document.createElement('h4');
    h4.textContent = `Step ${step.n}: ${step.title}`;
    const hours = document.createElement('span');
    hours.className = 'step-hours';
    hours.textContent = step.hours;
    h4.append(hours);
    const p = document.createElement('p');
    p.textContent = step.details;
    li.append(h4, p);
    stepsEl.append(li);
  }
  const checklistEl = $('roadmap-checklist');
  checklistEl.innerHTML = '';
  for (const item of roadmap.checklist) {
    const li = document.createElement('li');
    li.textContent = item.label;
    const b = document.createElement('b');
    b.textContent = `${item.have} / ${item.need}`;
    li.append(b);
    checklistEl.append(li);
  }
  $('missable-warning').textContent = roadmap.missable_warning;
}

function renderKindChips() {
  const wrap = $('kind-chips');
  wrap.innerHTML = '';
  for (const kind of KIND_CHIPS) {
    const label = kind === 'all' ? 'All' : kind === 'missable' ? 'Missable' : kind === 'online' ? 'Online' : KIND_LABELS[kind];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(state.kind === kind));
    button.addEventListener('click', () => {
      state.kind = kind;
      renderKindChips();
      renderTrophyList();
    });
    wrap.append(button);
  }
}

function trophyMatches(trophy) {
  if (state.kind === 'missable' && !trophy.missable) return false;
  if (state.kind === 'online') return false; // GTA VI has no online trophies
  if (state.kind !== 'all' && state.kind !== 'missable' && trophy.kind !== state.kind) return false;
  if (state.grade && trophy.grade !== state.grade) return false;
  if (state.status === 'earned' && !state.earned.has(trophy.id)) return false;
  if (state.status === 'unearned' && state.earned.has(trophy.id)) return false;
  if (state.query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(state.query)) return false;
  }
  return true;
}

function trophyCard(trophy) {
  const card = document.createElement('article');
  card.className = 'trophy' + (state.earned.has(trophy.id) ? ' earned' : '');
  card.id = `trophy-${trophy.id}`;
  card.dataset.id = String(trophy.id);

  const head = document.createElement('div');
  head.className = 'trophy-head';

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'trophy-check';
  check.checked = state.earned.has(trophy.id);
  check.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  check.addEventListener('change', () => {
    if (check.checked) state.earned.add(trophy.id);
    else state.earned.delete(trophy.id);
    saveProgress();
    updateProgress();
    card.classList.toggle('earned', check.checked);
    if (state.status) renderTrophyList();
  });

  const titleWrap = document.createElement('div');
  titleWrap.className = 'trophy-title';
  const titleBtn = document.createElement('button');
  titleBtn.type = 'button';
  titleBtn.setAttribute('aria-expanded', String(state.open.has(trophy.id)));
  const hiddenBySpoiler = state.spoiler && trophy.hidden && !state.earned.has(trophy.id);
  titleBtn.textContent = hiddenBySpoiler ? 'Hidden story trophy' : trophy.name;
  titleBtn.addEventListener('click', () => {
    if (state.open.has(trophy.id)) state.open.delete(trophy.id);
    else state.open.add(trophy.id);
    titleBtn.setAttribute('aria-expanded', String(state.open.has(trophy.id)));
    guideEl.hidden = !state.open.has(trophy.id);
  });
  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = hiddenBySpoiler ? 'Hidden story trophy — earn it to reveal.' : trophy.description;
  titleWrap.append(titleBtn, desc);

  const grade = document.createElement('span');
  grade.className = `grade-tag grade-${trophy.grade}`;
  grade.textContent = trophy.grade;

  head.append(check, titleWrap, grade);

  if (trophy.missable) {
    const tag = document.createElement('span');
    tag.className = 'tag tag-missable';
    tag.textContent = 'Missable';
    titleWrap.append(tag);
  }
  if (trophy.unconfirmed) {
    const tag = document.createElement('span');
    tag.className = 'tag tag-unconfirmed';
    tag.textContent = 'Unconfirmed';
    titleWrap.append(tag);
  }
  const kindTag = document.createElement('span');
  kindTag.className = 'tag tag-kind';
  kindTag.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
  titleWrap.append(kindTag);

  const guideEl = document.createElement('div');
  guideEl.className = 'trophy-guide';
  guideEl.hidden = !state.open.has(trophy.id);
  if (hiddenBySpoiler) {
    const p = document.createElement('p');
    p.className = 'spoiler-hidden';
    p.textContent = 'This trophy is hidden until you earn it. Turn off “Hide story spoilers” to read its guide.';
    guideEl.append(p);
  } else {
    const p = document.createElement('p');
    p.textContent = trophy.guide;
    guideEl.append(p);
    if (trophy.missable_note) {
      const note = document.createElement('p');
      note.innerHTML = '';
      const strong = document.createElement('strong');
      strong.textContent = 'Missable — ';
      note.append(strong, document.createTextNode(trophy.missable_note));
      guideEl.append(note);
    }
    if (trophy.sources && trophy.sources.length) {
      const src = document.createElement('p');
      src.className = 'trophy-sources';
      src.append(document.createTextNode('Sources: '));
      trophy.sources.forEach((source, index) => {
        if (index > 0) src.append(document.createTextNode(', '));
        const a = document.createElement('a');
        a.href = source.url;
        a.textContent = source.name;
        a.rel = 'noopener';
        src.append(a);
      });
      guideEl.append(src);
    }
  }

  card.append(head, guideEl);
  return card;
}

function renderTrophyList() {
  const list = $('trophy-list');
  list.innerHTML = '';
  let shown = state.trophies.filter(trophyMatches);
  if (state.topId) {
    shown = [...shown].sort((a, b) => (a.id === state.topId ? -1 : b.id === state.topId ? 1 : 0));
  }
  for (const trophy of shown) list.append(trophyCard(trophy));
  $('empty-state').hidden = shown.length > 0;
}

function updateProgress() {
  const total = state.trophies.length;
  const earned = state.earned.size;
  const percent = total ? Math.round((earned / total) * 100) : 0;
  $('progress-fill').style.width = `${percent}%`;
  $('progress-text').textContent = `${earned} / ${total} earned (${percent}%)`;
  $('progress-pill').textContent = `${earned} / ${total}`;
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of state.trophies) {
    if (state.earned.has(trophy.id)) counts[trophy.grade]++;
  }
  $('grade-counts').textContent =
    `Platinum ${counts.platinum}/1 · Gold ${counts.gold}/2 · Silver ${counts.silver}/6 · Bronze ${counts.bronze}/46`;
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...state.earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProgress() {
  const input = $('import-file');
  input.value = '';
  input.click();
}

async function handleImportFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const earned = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(earned)) throw new Error('not a progress file');
    const valid = new Set(state.trophies.map((t) => t.id));
    const next = new Set(earned.filter((id) => Number.isInteger(id) && valid.has(id)));
    state.earned = next;
    state.demo = false;
    saveProgress();
    updateProgress();
    renderTrophyList();
  } catch {
    alert('That file is not a Leonida Legend progress export.');
  }
}

function bindControls() {
  $('search').addEventListener('input', (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderTrophyList();
  });
  $('grade-filter').addEventListener('change', (event) => {
    state.grade = event.target.value;
    renderTrophyList();
  });
  $('status-filter').addEventListener('change', (event) => {
    state.status = event.target.value;
    renderTrophyList();
  });
  $('spoiler-toggle').addEventListener('change', (event) => {
    state.spoiler = event.target.checked;
    renderTrophyList();
  });
  $('export-btn').addEventListener('click', exportProgress);
  $('import-btn').addEventListener('click', importProgress);
  $('import-file').addEventListener('change', handleImportFile);
  $('reset-btn').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies? This cannot be undone.')) return;
    state.earned = new Set();
    state.demo = false;
    saveProgress();
    updateProgress();
    renderTrophyList();
  });
}

async function init() {
  await loadGuideData();
  applyUrlParams();
  $('grade-filter').value = '';
  $('status-filter').value = '';
  $('spoiler-toggle').checked = state.spoiler;
  bindControls();
  renderRoadmap();
  renderKindChips();
  renderTrophyList();
  updateProgress();
}

init().catch((error) => {
  console.error(error);
  $('trophy-list').innerHTML = '<p class="empty">Could not load the trophy data. Open this page from the app folder (or run node serve.ts) and try again.</p>';
});
