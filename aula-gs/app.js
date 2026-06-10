// ================= Aula 2.0 · app.js =================
"use strict";

// ---------- utilidades ----------
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const DAY = 86400000;
const esc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm = t => String(t).toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
const shuffle = a => { a = a.slice(); for (let i = a.length-1; i > 0; i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; };
const todayKey = () => { const d = new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };

// ---------- almacenamiento seguro ----------
const store = (() => {
  let mem = {};
  const ok = (() => { try { localStorage.setItem('_t','1'); localStorage.removeItem('_t'); return true; } catch(e){ return false; } })();
  return {
    get(k, def){ try { const v = ok ? localStorage.getItem(k) : mem[k]; return v ? JSON.parse(v) : def; } catch(e){ return def; } },
    set(k, v){ try { const s = JSON.stringify(v); if (ok) localStorage.setItem(k, s); else mem[k] = s; } catch(e){} }
  };
})();

// ---------- estado + migración v1→v2 ----------
function blankState(){
  return { v:2, srs:{}, exams:{}, exHistory:[], lessonsRead:{}, cases:{}, streak:{count:0,last:null},
           xp:0, xpLog:{}, goal:50, ach:{}, counters:{reviews:0, exercises:0},
           settings:{theme:'auto', rate:1}, onboarded:false };
}
function migrate(s){
  if (!s) return blankState();
  if (s.v === 2) return Object.assign(blankState(), s);
  const n = blankState();
  n.lessonsRead = s.lessonsRead || {};
  n.streak = s.streak || n.streak;
  if (s.exams) for (const k in s.exams) n.exams[k] = s.exams[k];
  if (s.srs) for (const k in s.srs) { const r = s.srs[k]; n.srs[k] = { ef:2.5, reps:r.box||0, ivl:[0,1,3,7,16,35][r.box||0]||0, due:r.due||0 }; }
  return n;
}
let S = migrate(store.get('aula', null));
function save(){ store.set('aula', S); }

// ---------- toast + confetti ----------
let toastTimer = null;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function confetti(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = $('#confetti'); const ctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight; cv.style.display = 'block';
  const cols = ['#3F5A44','#B97F24','#9C4A2F','#D8C7A6','#5A5244'];
  const ps = Array.from({length:90}, () => ({ x: Math.random()*cv.width, y: -20-Math.random()*120,
    vx: (Math.random()-.5)*2.4, vy: 2+Math.random()*3.5, s: 4+Math.random()*5,
    c: cols[Math.floor(Math.random()*cols.length)], r: Math.random()*Math.PI }));
  let f = 0;
  (function tick(){
    ctx.clearRect(0,0,cv.width,cv.height);
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += .08;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s/2,-p.s/2,p.s,p.s); ctx.restore(); });
    if (++f < 110) requestAnimationFrame(tick); else cv.style.display = 'none';
  })();
}

// ---------- XP, niveles, racha ----------
const levelOf = xp => Math.floor(Math.sqrt(xp/60)) + 1;
const nextLevelXP = lvl => 60*lvl*lvl;
function addXP(n){
  const before = levelOf(S.xp);
  S.xp += n;
  const k = todayKey();
  S.xpLog[k] = (S.xpLog[k]||0) + n;
  touchStreak();
  const after = levelOf(S.xp);
  save();
  if (after > before){ confetti(); toast('🎉 ¡Nivel ' + after + ' alcanzado!'); }
  checkAch();
}
function touchStreak(){
  const today = new Date().toDateString();
  if (S.streak.last === today) return;
  const yest = new Date(Date.now()-DAY).toDateString();
  S.streak.count = (S.streak.last === yest) ? S.streak.count + 1 : 1;
  S.streak.last = today;
  $('#streakNum').textContent = S.streak.count;
}

// ---------- logros ----------
const ACH = [
  { id:'primer_paso',  icon:'👣', name:'Primer paso',      desc:'Completa tu primera lección',            test:s=>Object.keys(s.lessonsRead).length>=1 },
  { id:'aplicado',     icon:'📚', name:'Aplicado',          desc:'Completa 3 lecciones',                   test:s=>Object.keys(s.lessonsRead).length>=3 },
  { id:'enciclopedia', icon:'🏛️', name:'Enciclopedia',      desc:'Completa todas las lecciones',           test:s=>Object.keys(s.lessonsRead).length>=allLessons().length },
  { id:'todoterreno',  icon:'🧭', name:'Todoterreno',       desc:'Estudia lecciones de 3 módulos distintos', test:s=>{ const m=new Set(); allLessons().forEach(l=>{ if(s.lessonsRead[l.id]) m.add(l.mod); }); return m.size>=3; } },
  { id:'racha3',       icon:'🔥', name:'En llamas',         desc:'Racha de 3 días',                        test:s=>s.streak.count>=3 },
  { id:'racha7',       icon:'☄️', name:'Imparable',         desc:'Racha de 7 días',                        test:s=>s.streak.count>=7 },
  { id:'racha30',      icon:'🌋', name:'Leyenda',           desc:'Racha de 30 días',                       test:s=>s.streak.count>=30 },
  { id:'fichas50',     icon:'🃏', name:'Repasador',         desc:'50 fichas repasadas',                    test:s=>s.counters.reviews>=50 },
  { id:'fichas200',    icon:'🧠', name:'Memoria de elefante', desc:'200 fichas repasadas',                 test:s=>s.counters.reviews>=200 },
  { id:'aprobado',     icon:'✅', name:'Aprobado',          desc:'Aprueba tu primer examen (≥5)',          test:s=>s.exHistory.some(e=>e.score/e.total>=0.5) },
  { id:'sobresaliente',icon:'🏆', name:'Sobresaliente',     desc:'Saca un 10 en un examen',                test:s=>s.exHistory.some(e=>e.score===e.total && e.total>=8) },
  { id:'negociador',   icon:'🤝', name:'Negociador',        desc:'Resuelve un caso con puntuación perfecta', test:s=>Object.values(s.cases).some(c=>c.best===c.max) },
  { id:'nivel5',       icon:'⭐', name:'Nivel 5',           desc:'Alcanza el nivel 5',                     test:s=>levelOf(s.xp)>=5 },
  { id:'nivel10',      icon:'🌟', name:'Nivel 10',          desc:'Alcanza el nivel 10',                    test:s=>levelOf(s.xp)>=10 },
  { id:'buho',         icon:'🦉', name:'Búho nocturno',     desc:'Estudia pasadas las 23:00',              test:()=>new Date().getHours()>=23 },
  { id:'madrugador',   icon:'🌅', name:'Madrugador',        desc:'Estudia antes de las 8:00',              test:()=>new Date().getHours()<8 }
];
function checkAch(){
  ACH.forEach(a => {
    if (!S.ach[a.id] && a.test(S)) {
      S.ach[a.id] = Date.now(); save();
      toast(a.icon + ' Logro: ' + a.name);
    }
  });
}

// ---------- colecciones ----------
function allLessons(){
  const out = [];
  COURSE.modules.forEach(m => m.lessons.forEach(l => out.push(Object.assign({mod:m.name, modId:m.id, color:m.color}, l))));
  return out;
}
const lessonById = id => allLessons().find(l => l.id === id);
function cardKey(lid, i){ return lid + '#' + i; }
function dueCards(){
  const now = Date.now(); const out = [];
  allLessons().forEach(l => (l.flashcards||[]).forEach((c,i) => {
    const rec = S.srs[cardKey(l.id,i)];
    if (!rec || rec.due <= now) out.push({ q:c.q, a:c.a, key:cardKey(l.id,i), mod:l.mod });
  }));
  return out;
}
function masteredCount(){
  return Object.values(S.srs).filter(r => r.ivl >= 16).length;
}
function exercisePool(){
  const read = Object.keys(S.lessonsRead);
  let src = allLessons().filter(l => read.includes(l.id));
  if (!src.length) src = allLessons();
  const out = [];
  src.forEach(l => (l.exercises||[]).forEach(e => out.push(Object.assign({mod:l.mod}, e))));
  return out;
}

// ---------- SRS: SM-2 ----------
// q: 0 = otra vez, 3 = difícil, 4 = bien, 5 = fácil
function gradeCard(key, q){
  const r = S.srs[key] || { ef:2.5, reps:0, ivl:0, due:0 };
  if (q < 3){ r.reps = 0; r.ivl = 0; r.ef = Math.max(1.3, r.ef - 0.2); r.due = Date.now() + 10*60000; }
  else {
    r.ef = Math.max(1.3, r.ef + 0.1 - (5-q)*(0.08 + (5-q)*0.02));
    r.reps += 1;
    r.ivl = r.reps === 1 ? 1 : r.reps === 2 ? (q === 3 ? 3 : 6) : Math.round(r.ivl * (q === 3 ? 1.2 : r.ef));
    r.due = Date.now() + r.ivl * DAY;
  }
  S.srs[key] = r;
  S.counters.reviews++;
  addXP(q === 0 ? 2 : 5);
}

// ---------- texto a voz ----------
let speaking = false;
function speakLesson(les, btn){
  if (!('speechSynthesis' in window)) { toast('Tu navegador no soporta voz'); return; }
  if (speaking){ speechSynthesis.cancel(); speaking = false; btn.textContent = '🔊 Escuchar lección'; return; }
  const tmp = document.createElement('div'); tmp.innerHTML = les.html;
  const text = les.title + '. ' + tmp.textContent.replace(/\s+/g,' ');
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-ES'; u.rate = S.settings.rate || 1;
  const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('es'));
  if (v) u.voice = v;
  u.onend = () => { speaking = false; btn.textContent = '🔊 Escuchar lección'; };
  speaking = true; btn.textContent = '⏹ Detener audio';
  speechSynthesis.speak(u);
}

// ---------- tema ----------
function applyTheme(){
  const t = S.settings.theme;
  const dark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
$('#themeBtn').onclick = () => {
  S.settings.theme = (document.documentElement.dataset.theme === 'dark') ? 'light' : 'dark';
  save(); applyTheme();
};

// ---------- navegación ----------
const view = $('#view');
let current = 'home';
$$('.tab').forEach(b => b.onclick = () => go(b.dataset.view));
function go(v){
  if (speaking){ speechSynthesis.cancel(); speaking = false; }
  current = v;
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  ({home:renderHome, course:renderCourse, practice:renderPractice, exam:renderExamHome, profile:renderProfile})[v]();
  window.scrollTo(0,0);
}

// ============================================================
// INICIO
// ============================================================
function renderHome(){
  const lessons = allLessons();
  const read = Object.keys(S.lessonsRead).length;
  const due = dueCards().length;
  const xpToday = S.xpLog[todayKey()] || 0;
  const pct = Math.min(100, Math.round(100*xpToday/S.goal));
  const lvl = levelOf(S.xp);
  const ring = 2*Math.PI*34;
  const nextLesson = lessons.find(l => !S.lessonsRead[l.id]);
  const week = planWeek();

  view.innerHTML = `
    <section class="card hero">
      <div class="hero-grid">
        <div>
          <span class="stamp">Hoy</span>
          <h2>Hola, Michael</h2>
          <p class="muted">Nivel ${lvl} · ${S.xp} XP totales</p>
          <p class="muted">${due ? due + ' fichas esperándote' : 'Fichas al día ✓'}</p>
        </div>
        <div class="ring-wrap" aria-label="Objetivo diario">
          <svg viewBox="0 0 80 80" class="ring">
            <circle cx="40" cy="40" r="34" class="ring-bg"/>
            <circle cx="40" cy="40" r="34" class="ring-fg" stroke-dasharray="${ring}" stroke-dashoffset="${ring*(1-pct/100)}"/>
          </svg>
          <div class="ring-label"><b>${xpToday}</b><span>/${S.goal} XP</span></div>
        </div>
      </div>
      <button class="btn" id="sessionBtn">▶ Sesión del día (fichas + ejercicios)</button>
      ${nextLesson ? `<button class="btn ghost" id="nextLessonBtn">Siguiente lección: ${esc(nextLesson.title.split('·')[1]||nextLesson.title)}</button>` : ''}
    </section>

    <section class="card">
      <span class="stamp">Plan 30 días · Semana ${week.week}</span>
      <p style="margin:6px 0 8px"><b class="serif">${esc(week.focus)}</b></p>
      <ul class="plan-list">${week.tasks.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
    </section>

    <section class="card">
      <span class="stamp">Actividad · últimas 5 semanas</span>
      <div class="heatmap" aria-hidden="true">${heatmapHTML()}</div>
    </section>

    <section class="module-list">
      ${COURSE.modules.map(m => {
        const done = m.lessons.filter(l => S.lessonsRead[l.id]).length;
        return `<div class="card mod-card" data-mod="${m.id}">
          <div class="module-row">
            <div><b class="serif">${m.icon} ${esc(m.name)}</b><br><span class="muted">${done}/${m.lessons.length} lecciones</span></div>
            <div class="mini-bar"><div style="width:${m.lessons.length?Math.round(100*done/m.lessons.length):0}%;background:${m.color}"></div></div>
          </div>
        </div>`; }).join('')}
    </section>`;

  $('#sessionBtn').onclick = startSession;
  const nb = $('#nextLessonBtn'); if (nb) nb.onclick = () => openLesson(nextLesson.id);
  $$('.mod-card').forEach(c => c.onclick = () => { go('course'); });
}
function planWeek(){
  const read = Object.keys(S.lessonsRead).length;
  const idx = read >= 7 ? 3 : read >= 6 ? 3 : read >= 5 ? 2 : read >= 3 ? 1 : 0;
  return Object.assign({week: idx+1}, COURSE.plan30[idx]);
}
function heatmapHTML(){
  let html = '';
  for (let i = 34; i >= 0; i--){
    const d = new Date(Date.now() - i*DAY);
    const k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const v = S.xpLog[k] || 0;
    const lv = v === 0 ? 0 : v < 25 ? 1 : v < 60 ? 2 : v < 120 ? 3 : 4;
    html += `<span class="hm hm-${lv}" title="${k}: ${v} XP"></span>`;
  }
  return html;
}

// ============================================================
// CURSO (lecciones + glosario)
// ============================================================
function renderCourse(){
  view.innerHTML = `
    <div class="chip-row">
      <button class="chip active" id="chipLes">Lecciones</button>
      <button class="chip" id="chipGlo">Glosario</button>
    </div>
    <div id="courseBody"></div>`;
  $('#chipLes').onclick = () => { setChip('chipLes'); drawLessonList(); };
  $('#chipGlo').onclick = () => { setChip('chipGlo'); drawGlossary(); };
  drawLessonList();
}
function setChip(id){ $$('.chip').forEach(c => c.classList.toggle('active', c.id === id)); }
function drawLessonList(){
  $('#courseBody').innerHTML = COURSE.modules.map(m => `
    <h3 class="mod-head" style="color:${m.color}">${m.icon} ${esc(m.name)}</h3>
    ${m.lessons.map(l => {
      const read = S.lessonsRead[l.id];
      const best = (S.exams[l.id]||{}).best;
      return `<div class="card lesson-row" data-id="${l.id}">
        <div>
          <b>${esc(l.title)}</b><br>
          <span class="muted">${l.minutes} min · ${l.flashcards.length} fichas · ${l.exam.length} preguntas${l.cases && l.cases.length ? ' · '+l.cases.length+' caso' : ''}</span>
        </div>
        <div class="lesson-badges">${read ? '<span class="badge ok-b">✓</span>' : ''}${best !== undefined ? `<span class="badge">${best}/${l.exam.length}</span>` : ''}</div>
      </div>`; }).join('')}
  `).join('');
  $$('.lesson-row').forEach(r => r.onclick = () => openLesson(r.dataset.id));
}
function drawGlossary(){
  $('#courseBody').innerHTML = `
    <input class="search" id="gloSearch" placeholder="Buscar término…" aria-label="Buscar en el glosario">
    <div id="gloList"></div>`;
  const paint = q => {
    const list = COURSE.glossary.filter(g => !q || norm(g.t+g.d).includes(norm(q)));
    $('#gloList').innerHTML = list.map(g => `<div class="card glo"><b class="serif">${esc(g.t)}</b><p>${esc(g.d)}</p></div>`).join('') || '<p class="muted">Sin resultados.</p>';
  };
  $('#gloSearch').oninput = e => paint(e.target.value);
  paint('');
}
function openLesson(id){
  const l = lessonById(id);
  const done = S.lessonsRead[id];
  view.innerHTML = `
    <article class="card lesson">
      <button class="back" id="backBtn">← Curso</button>
      <span class="stamp" style="border-color:${l.color};color:${l.color}">${esc(l.mod)} · ${l.minutes} min</span>
      <h2>${esc(l.title)}</h2>
      <button class="btn ghost slim" id="ttsBtn">🔊 Escuchar lección</button>
      ${l.html}
      <button class="btn ${done?'ghost':''}" id="doneBtn">${done ? '✓ Completada — releer suma igual' : 'Marcar como completada (+50 XP)'}</button>
      <div class="row">
        <button class="btn ghost" id="goCardsBtn">Fichas</button>
        <button class="btn ghost" id="goExamBtn">Examen</button>
      </div>
    </article>`;
  $('#backBtn').onclick = () => go('course');
  $('#ttsBtn').onclick = e => speakLesson(l, e.target);
  $('#doneBtn').onclick = () => {
    if (!S.lessonsRead[id]){ S.lessonsRead[id] = Date.now(); save(); addXP(50); toast('+50 XP · Lección completada'); }
    openLesson(id);
  };
  $('#goCardsBtn').onclick = () => { go('practice'); runFichas(dueCards(), () => go('practice')); };
  $('#goExamBtn').onclick = () => { go('exam'); startExam(l.exam, l.id, esc(l.title), false); };
}

// ============================================================
// PRÁCTICA (fichas SRS · ejercicios · casos)
// ============================================================
function renderPractice(){
  const due = dueCards().length;
  const cases = [];
  allLessons().forEach(l => (l.cases||[]).forEach(c => cases.push(Object.assign({mod:l.mod}, c))));
  view.innerHTML = `
    <section class="card">
      <span class="stamp">Fichas · repaso espaciado</span>
      <p class="muted">Algoritmo SM-2: cada ficha vuelve justo antes de que la olvides. Dominadas: ${masteredCount()}.</p>
      <button class="btn" id="pFichas">${due ? 'Repasar ' + due + ' fichas' : 'Al día ✓ (repaso libre)'}</button>
    </section>
    <section class="card">
      <span class="stamp">Ejercicios interactivos</span>
      <p class="muted">Verdadero/falso, completar, ordenar y emparejar, mezclados al azar.</p>
      <button class="btn" id="pEjer">Ronda de 6 ejercicios</button>
    </section>
    <section class="card">
      <span class="stamp">Casos prácticos</span>
      ${cases.map(c => {
        const st = S.cases[c.id];
        return `<button class="opt case-row" data-id="${c.id}"><b>${esc(c.title)}</b><br><span class="muted">${esc(c.mod)}${st ? ' · mejor: '+st.best+'/'+st.max : ''}</span></button>`;
      }).join('') || '<p class="muted">Pronto habrá más casos.</p>'}
    </section>`;
  $('#pFichas').onclick = () => {
    let cards = dueCards();
    if (!cards.length){ // repaso libre: 10 aleatorias
      const all = []; allLessons().forEach(l => l.flashcards.forEach((c,i)=>all.push({q:c.q,a:c.a,key:cardKey(l.id,i),mod:l.mod})));
      cards = shuffle(all).slice(0,10);
    }
    runFichas(cards, () => go('practice'));
  };
  $('#pEjer').onclick = () => runExercises(shuffle(exercisePool()).slice(0,6), () => go('practice'));
  $$('.case-row').forEach(b => b.onclick = () => runCase(b.dataset.id));
}

// ---------- runner de fichas ----------
function runFichas(cards, onDone, sessionStats){
  let i = 0;
  const next = () => {
    if (i >= cards.length){
      if (sessionStats) return onDone();
      view.innerHTML = `<section class="card center"><span class="stamp">Fichas</span>
        <h2 class="serif big-emoji">🧠</h2><p><b>${cards.length}</b> fichas repasadas. El algoritmo ya ha programado su regreso.</p>
        <button class="btn" id="fin">Continuar</button></section>`;
      $('#fin').onclick = onDone; return;
    }
    const c = cards[i];
    view.innerHTML = `
      <p class="muted">Ficha ${i+1} / ${cards.length} · ${esc(c.mod)}</p>
      <div class="ficha-wrap"><div class="ficha" id="ficha" role="button" tabindex="0" aria-label="Girar ficha">
        <div class="ficha-face"><p class="ficha-q">${esc(c.q)}</p><span class="ficha-hint">toca para girar</span></div>
        <div class="ficha-face ficha-back"><p class="ficha-a">${esc(c.a)}</p></div>
      </div></div>
      <div class="grade-row" id="grades" style="visibility:hidden">
        <button class="btn again">Otra vez</button>
        <button class="btn hard">Difícil</button>
        <button class="btn good">Bien</button>
        <button class="btn easy">Fácil</button>
      </div>`;
    const f = $('#ficha'); let flipped = false;
    const flip = () => { flipped = !flipped; f.classList.toggle('flip', flipped); $('#grades').style.visibility = flipped ? 'visible' : 'hidden'; };
    f.onclick = flip;
    f.onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); flip(); } };
    const g = q => { gradeCard(c.key, q); if (sessionStats) sessionStats.fichas++; i++; next(); };
    $('.again').onclick = () => g(0);
    $('.hard').onclick  = () => g(3);
    $('.good').onclick  = () => g(4);
    $('.easy').onclick  = () => g(5);
  };
  next();
}

// ---------- runner de ejercicios ----------
function runExercises(list, onDone, sessionStats){
  if (!list.length){ toast('Aún no hay ejercicios disponibles'); return onDone(); }
  let i = 0, hits = 0;
  const finish = () => {
    if (sessionStats){ sessionStats.ejercicios = hits; return onDone(); }
    view.innerHTML = `<section class="card center"><span class="stamp">Ejercicios</span>
      <p class="score-big">${hits}/${list.length}</p><p class="score-label">aciertos</p>
      <button class="btn" id="fin">Continuar</button></section>`;
    $('#fin').onclick = onDone;
  };
  const next = () => {
    if (i >= list.length) return finish();
    const e = list[i];
    const head = `<p class="muted">Ejercicio ${i+1} / ${list.length} · ${esc(e.mod||'')}</p>`;
    const after = (ok, whyHTML) => {
      if (ok){ hits++; addXP(8); }
      const foot = $('#exFoot');
      foot.innerHTML = `<div class="explain">${ok ? '✓ Correcto.' : '✗ Casi.'} ${whyHTML||''}</div><button class="btn" id="nx">Siguiente</button>`;
      $('#nx').onclick = () => { i++; next(); };
    };

    if (e.type === 'tf'){
      view.innerHTML = `${head}<section class="card"><p class="q-text">${esc(e.q)}</p>
        <div class="row"><button class="btn ghost" id="tT">Verdadero</button><button class="btn ghost" id="tF">Falso</button></div>
        <div id="exFoot"></div></section>`;
      const ans = v => { $('#tT').disabled = $('#tF').disabled = true; after(v === e.ok, esc(e.why)); };
      $('#tT').onclick = () => ans(true);
      $('#tF').onclick = () => ans(false);
    }

    else if (e.type === 'fill'){
      view.innerHTML = `${head}<section class="card"><p class="q-text">${esc(e.q)}</p>
        <input class="search" id="fillIn" autocomplete="off" autocapitalize="off" placeholder="Tu respuesta…">
        <button class="btn" id="fillOk">Comprobar</button><div id="exFoot"></div></section>`;
      const check = () => {
        const v = norm($('#fillIn').value);
        if (!v) return;
        $('#fillOk').disabled = true; $('#fillIn').disabled = true;
        after(e.accept.some(a => norm(a) === v), esc(e.why));
      };
      $('#fillOk').onclick = check;
      $('#fillIn').onkeydown = ev => { if (ev.key === 'Enter') check(); };
      $('#fillIn').focus();
    }

    else if (e.type === 'order'){
      let picked = [];
      const pool = shuffle(e.items.map((t,idx) => ({t, idx})));
      view.innerHTML = `${head}<section class="card"><p class="q-text">${esc(e.title)}</p>
        <p class="muted">Toca los elementos en el orden correcto:</p>
        <div id="ordPicked" class="ord-picked"></div>
        <div id="ordPool">${pool.map((p,k)=>`<button class="opt" data-k="${k}">${esc(p.t)}</button>`).join('')}</div>
        <div id="exFoot"></div></section>`;
      $$('#ordPool .opt').forEach(b => b.onclick = () => {
        b.disabled = true; b.classList.add('sel');
        picked.push(pool[+b.dataset.k].idx);
        $('#ordPicked').innerHTML = picked.map((ix,n)=>`<span class="badge">${n+1}. ${esc(e.items[ix])}</span>`).join(' ');
        if (picked.length === e.items.length){
          const ok = picked.every((ix,n) => ix === n);
          after(ok, ok ? '' : 'Orden correcto: ' + e.items.map(esc).join(' → '));
        }
      });
    }

    else if (e.type === 'match'){
      const left = shuffle(e.pairs.map((p,ix)=>({t:p[0], ix})));
      const right = shuffle(e.pairs.map((p,ix)=>({t:p[1], ix})));
      let selL = null, solved = 0, fails = 0;
      view.innerHTML = `${head}<section class="card"><p class="q-text">${esc(e.title)}</p>
        <div class="match-grid">
          <div>${left.map((p,k)=>`<button class="opt mL" data-ix="${p.ix}">${esc(p.t)}</button>`).join('')}</div>
          <div>${right.map((p,k)=>`<button class="opt mR" data-ix="${p.ix}">${esc(p.t)}</button>`).join('')}</div>
        </div><div id="exFoot"></div></section>`;
      $$('.mL').forEach(b => b.onclick = () => { $$('.mL').forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); selL = b; });
      $$('.mR').forEach(b => b.onclick = () => {
        if (!selL || b.disabled) return;
        if (b.dataset.ix === selL.dataset.ix){
          b.classList.add('ok'); selL.classList.add('ok');
          b.disabled = true; selL.disabled = true; selL = null;
          if (++solved === e.pairs.length) after(fails === 0, fails ? 'Resuelto con ' + fails + ' fallo(s).' : '');
        } else {
          fails++; b.classList.add('ko'); setTimeout(()=>b.classList.remove('ko'), 450);
        }
      });
    }
    else { i++; next(); }
  };
  next();
}

// ---------- runner de casos ----------
function runCase(id){
  let theCase = null, modName = '';
  allLessons().forEach(l => (l.cases||[]).forEach(c => { if (c.id === id){ theCase = c; modName = l.mod; } }));
  if (!theCase) return;
  let step = 0, score = 0;
  const max = theCase.steps.length * 2;
  const intro = () => {
    view.innerHTML = `<section class="card"><button class="back" id="bk">← Práctica</button>
      <span class="stamp">Caso práctico · ${esc(modName)}</span>
      <h2 class="serif" style="font-size:21px;margin:6px 0">${esc(theCase.title)}</h2>
      <p>${esc(theCase.intro)}</p>
      <button class="btn" id="st">Empezar</button></section>`;
    $('#bk').onclick = () => go('practice');
    $('#st').onclick = drawStep;
  };
  const drawStep = () => {
    if (step >= theCase.steps.length) return finish();
    const st = theCase.steps[step];
    view.innerHTML = `<section class="card">
      <p class="q-num">Decisión ${step+1} / ${theCase.steps.length}</p>
      <p class="q-text">${esc(st.text)}</p>
      ${shuffle(st.opts.map((o,ix)=>({o,ix}))).map(w=>`<button class="opt" data-ix="${w.ix}">${esc(w.o.t)}</button>`).join('')}
      <div id="exFoot"></div></section>`;
    $$('.opt').forEach(b => b.onclick = () => {
      if ($('#exFoot').innerHTML) return;
      const o = st.opts[+b.dataset.ix];
      score += o.good;
      b.classList.add(o.good === 2 ? 'ok' : o.good === 1 ? 'sel' : 'ko');
      $('#exFoot').innerHTML = `<div class="explain">${o.good===2?'★★ ':o.good===1?'★ ':'✗ '}${esc(o.fb)}</div><button class="btn" id="nx">${step+1<theCase.steps.length?'Siguiente decisión':'Ver resultado'}</button>`;
      $('#nx').onclick = () => { step++; drawStep(); };
    });
  };
  const finish = () => {
    const prev = S.cases[id] || { best:0, max };
    prev.best = Math.max(prev.best, score); prev.max = max;
    S.cases[id] = prev; save();
    addXP(20 + score*10);
    const r = score/max;
    if (r >= 0.8) confetti();
    view.innerHTML = `<section class="card center"><span class="stamp">Resultado del caso</span>
      <p class="score-big">${score}/${max}</p>
      <p class="score-label">${r===1?'Cierre magistral 🏆':r>=0.7?'Gran gestión: cliente contento':r>=0.4?'Sobrevives, pero repasa la lección':'Cliente perdido: vuelve a la teoría'}</p>
      <button class="btn" id="re">Reintentar</button>
      <button class="btn ghost" id="ok">Volver a práctica</button></section>`;
    $('#re').onclick = () => { step = 0; score = 0; drawStep(); };
    $('#ok').onclick = () => go('practice');
    checkAch();
  };
  intro();
}

// ---------- sesión del día ----------
function startSession(){
  const stats = { fichas:0, ejercicios:0 };
  const xpStart = S.xp;
  const cards = dueCards().slice(0, 12);
  const exs = shuffle(exercisePool()).slice(0, 5);
  const summary = () => {
    view.innerHTML = `<section class="card center"><span class="stamp">Sesión completada</span>
      <h2 class="serif big-emoji">☕</h2>
      <p><b>${stats.fichas}</b> fichas · <b>${stats.ejercicios}/${exs.length}</b> ejercicios</p>
      <p class="score-label">+${S.xp - xpStart} XP en esta sesión</p>
      <button class="btn" id="ok">Al inicio</button></section>`;
    if (S.xp - xpStart >= S.goal) confetti();
    $('#ok').onclick = () => go('home');
  };
  const partExs = () => exs.length ? runExercises(exs, summary, stats) : summary();
  cards.length ? runFichas(cards, partExs, stats) : partExs();
}

// ============================================================
// EXAMEN
// ============================================================
function renderExamHome(){
  const lessons = allLessons().filter(l => l.exam && l.exam.length);
  const hist = S.exHistory.slice(-5).reverse();
  view.innerHTML = `
    <section class="card">
      <span class="stamp">Examen global</span>
      <p class="muted">15 preguntas aleatorias de todo lo estudiado, con cronómetro. Como el examen final de un módulo real.</p>
      <button class="btn" id="globalEx">⏱ Examen global cronometrado</button>
    </section>
    <section class="card">
      <span class="stamp">Por lección</span>
      ${lessons.map(l => {
        const best = (S.exams[l.id]||{}).best;
        return `<button class="opt exam-row" data-id="${l.id}"><b>${esc(l.title)}</b><br><span class="muted">${l.exam.length} preguntas${best!==undefined?' · mejor: '+best+'/'+l.exam.length:''}</span></button>`;
      }).join('')}
    </section>
    ${hist.length ? `<section class="card"><span class="stamp">Últimos resultados</span>
      ${hist.map(h => `<div class="hist-row"><span>${esc(h.name)}</span><b>${h.score}/${h.total}</b></div>`).join('')}</section>` : ''}`;
  $('#globalEx').onclick = () => {
    const pool = [];
    allLessons().forEach(l => (l.exam||[]).forEach(q => pool.push(q)));
    startExam(shuffle(pool).slice(0, 15), 'global', 'Examen global', true);
  };
  $$('.exam-row').forEach(b => b.onclick = () => {
    const l = lessonById(b.dataset.id);
    startExam(shuffle(l.exam.slice()), l.id, l.title, false);
  });
}
let exTimerId = null;
function startExam(questions, id, name, timed){
  clearInterval(exTimerId);
  let i = 0, score = 0, remaining = questions.length * 45;
  const tickTimer = () => {
    remaining--;
    const el = $('#exTimer');
    if (el) el.textContent = '⏱ ' + Math.floor(remaining/60) + ':' + String(remaining%60).padStart(2,'0');
    if (remaining <= 0){ clearInterval(exTimerId); finish(); }
  };
  if (timed) exTimerId = setInterval(tickTimer, 1000);
  const draw = () => {
    if (i >= questions.length) return finish();
    const q = questions[i];
    view.innerHTML = `<section class="card">
      <div class="exam-head"><p class="q-num">Pregunta ${i+1} / ${questions.length}</p>${timed?'<span class="timer" id="exTimer">⏱</span>':''}</div>
      <p class="q-text">${esc(q.q)}</p>
      ${q.opts.map((o,k)=>`<button class="opt" data-k="${k}">${esc(o)}</button>`).join('')}
      <div id="exFoot"></div></section>`;
    let answered = false;
    $$('.opt').forEach(b => b.onclick = () => {
      if (answered) return; answered = true;
      const k = +b.dataset.k;
      $(`.opt[data-k="${q.ok}"]`).classList.add('ok');
      if (k === q.ok) score++; else b.classList.add('ko');
      $('#exFoot').innerHTML = `<div class="explain">${k===q.ok?'✓ Correcto. ':'✗ '}${esc(q.why)}</div><button class="btn" id="nx">${i+1<questions.length?'Siguiente':'Ver nota'}</button>`;
      $('#nx').onclick = () => { i++; draw(); window.scrollTo(0,0); };
    });
  };
  const finish = () => {
    clearInterval(exTimerId);
    const total = questions.length;
    const prev = S.exams[id] || { best:0, tries:0 };
    prev.best = Math.max(prev.best, score); prev.tries++;
    S.exams[id] = prev;
    S.exHistory.push({ id, name, score, total, date: Date.now() });
    if (S.exHistory.length > 40) S.exHistory = S.exHistory.slice(-40);
    save();
    addXP(score*10 + (score/total >= 0.9 ? 50 : 0));
    const nota = Math.round(score/total*100)/10;
    if (nota >= 7) confetti();
    view.innerHTML = `<section class="card center"><span class="stamp">Resultado</span>
      <p class="score-big">${score}/${total}</p>
      <p class="score-label">Nota ${nota}/10 · ${nota>=9?'Sobresaliente 🏆':nota>=7?'Notable, ¡muy bien!':nota>=5?'Aprobado: repasa las falladas':'A repasar y reintentar'}</p>
      <button class="btn" id="re">Repetir</button>
      <button class="btn ghost" id="bk">Volver</button></section>`;
    $('#re').onclick = () => startExam(shuffle(questions.slice()), id, name, timed);
    $('#bk').onclick = () => go('exam');
    checkAch();
  };
  draw();
}

// ============================================================
// PERFIL (nivel · logros · estadísticas · ajustes · backup)
// ============================================================
function renderProfile(){
  const lvl = levelOf(S.xp);
  const base = nextLevelXP(lvl-1), next = nextLevelXP(lvl);
  const pct = Math.round(100*(S.xp-base)/(next-base));
  const ret = retention();
  view.innerHTML = `
    <section class="card">
      <span class="stamp">Nivel</span>
      <div class="lvl-row"><span class="lvl-big serif">${lvl}</span>
        <div style="flex:1"><div class="progressbar"><div style="width:${pct}%"></div></div>
        <p class="muted">${S.xp} XP · faltan ${next-S.xp} para el nivel ${lvl+1}</p></div></div>
      <div class="statgrid">
        <div class="stat"><b>${S.counters.reviews}</b><span>repasos</span></div>
        <div class="stat"><b>${masteredCount()}</b><span>dominadas</span></div>
        <div class="stat"><b>${ret===null?'—':ret+'%'}</b><span>retención</span></div>
      </div>
    </section>
    <section class="card">
      <span class="stamp">XP últimos 7 días</span>
      <canvas id="weekChart" height="120" aria-label="Gráfica de XP semanal"></canvas>
    </section>
    <section class="card">
      <span class="stamp">Logros · ${Object.keys(S.ach).length}/${ACH.length}</span>
      <div class="ach-grid">${ACH.map(a => `<div class="ach ${S.ach[a.id]?'':'lockd'}" title="${esc(a.desc)}"><span>${a.icon}</span><b>${esc(a.name)}</b></div>`).join('')}</div>
    </section>
    <section class="card">
      <span class="stamp">Ajustes</span>
      <div class="set-row"><span>Objetivo diario</span>
        <div class="seg">${[30,50,100].map(g=>`<button class="seg-b ${S.goal===g?'on':''}" data-g="${g}">${g} XP</button>`).join('')}</div></div>
      <div class="set-row"><span>Velocidad de voz</span>
        <div class="seg">${[0.9,1,1.2].map(r=>`<button class="seg-b ${S.settings.rate===r?'on':''}" data-r="${r}">${r}×</button>`).join('')}</div></div>
      <button class="btn ghost" id="expBtn">⬇ Exportar copia de seguridad</button>
      <button class="btn ghost" id="impBtn">⬆ Importar copia</button>
      <input type="file" id="impFile" accept="application/json" hidden>
      <button class="btn warn" id="resetBtn">Borrar todo el progreso</button>
    </section>`;
  drawWeekChart();
  $$('.seg-b[data-g]').forEach(b => b.onclick = () => { S.goal = +b.dataset.g; save(); renderProfile(); });
  $$('.seg-b[data-r]').forEach(b => b.onclick = () => { S.settings.rate = +b.dataset.r; save(); renderProfile(); });
  $('#expBtn').onclick = () => {
    const blob = new Blob([JSON.stringify(S)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'aula-backup-' + todayKey() + '.json';
    a.click(); URL.revokeObjectURL(a.href);
    toast('Copia descargada');
  };
  $('#impBtn').onclick = () => $('#impFile').click();
  $('#impFile').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { S = migrate(JSON.parse(r.result)); save(); applyTheme(); toast('Progreso restaurado'); go('home'); } catch(err){ toast('Archivo no válido'); } };
    r.readAsText(f);
  };
  $('#resetBtn').onclick = () => {
    if (confirm('¿Seguro? Se borrará TODO tu progreso.')){ S = blankState(); save(); go('home'); toast('Progreso reiniciado'); }
  };
}
function retention(){
  // % de repasos con resultado positivo, aproximado por intervalos crecientes
  const recs = Object.values(S.srs);
  if (recs.length < 5) return null;
  const okc = recs.filter(r => r.reps > 0).length;
  return Math.round(100*okc/recs.length);
}
function drawWeekChart(){
  const cv = $('#weekChart'); if (!cv) return;
  const ctx = cv.getContext('2d');
  cv.width = cv.clientWidth * (window.devicePixelRatio||1);
  cv.height = 120 * (window.devicePixelRatio||1);
  ctx.scale(window.devicePixelRatio||1, window.devicePixelRatio||1);
  const w = cv.clientWidth, h = 120, days = [];
  for (let i = 6; i >= 0; i--){
    const d = new Date(Date.now()-i*DAY);
    const k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    days.push({ label:['D','L','M','X','J','V','S'][d.getDay()], v: S.xpLog[k]||0 });
  }
  const max = Math.max(S.goal, ...days.map(d=>d.v), 1);
  const bw = w/7;
  const css = getComputedStyle(document.documentElement);
  days.forEach((d,i) => {
    const bh = Math.round((h-26)*d.v/max);
    ctx.fillStyle = d.v >= S.goal ? css.getPropertyValue('--ambar') : css.getPropertyValue('--kraft-deep');
    ctx.fillRect(i*bw+bw*0.2, h-20-bh, bw*0.6, bh);
    ctx.fillStyle = css.getPropertyValue('--ink-soft');
    ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(d.label, i*bw+bw/2, h-6);
  });
  // línea de objetivo
  ctx.strokeStyle = css.getPropertyValue('--verde'); ctx.setLineDash([4,4]);
  const gy = h-20-Math.round((h-26)*S.goal/max);
  ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(w,gy); ctx.stroke();
}

// ============================================================
// ONBOARDING
// ============================================================
function onboarding(){
  if (S.onboarded) return;
  const m = $('#modal');
  m.hidden = false;
  m.innerHTML = `<div class="modal-card">
    <h2 class="serif">Bienvenido a tu Aula 🎓</h2>
    <p>Así se estudia aquí, en 3 ideas:</p>
    <p><b>1 · Lección corta</b> en la pestaña Curso (puedes escucharla en audio).</p>
    <p><b>2 · Fichas</b>: el algoritmo SM-2 te las repite justo antes de que las olvides. Sé honesto al puntuarte.</p>
    <p><b>3 · Examen</b> con nota y explicaciones. Tu objetivo: todo ≥ 8/10.</p>
    <p class="muted">Gana XP, sube de nivel y no rompas la racha 🔥</p>
    <button class="btn" id="obOk">Empezar</button></div>`;
  $('#obOk').onclick = () => { S.onboarded = true; save(); m.hidden = true; };
}

// ---------- init ----------
applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
$('#streakNum').textContent = S.streak.count;
renderHome();
onboarding();
checkAch();
