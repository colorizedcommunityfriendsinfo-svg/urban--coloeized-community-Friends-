import { activities, selectActivities, cleanState } from './model.mjs';

const icons = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  chat: '<path d="M21 11a8 8 0 0 1-8 8H9l-6 3 1.5-6A8 8 0 1 1 21 11Z"/><path d="M8 10h8m-8 4h5"/>',
  book: '<path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Zm0 0v15"/>',
  leaf: '<path d="M21 3C8 0 1 8 5 16c5 9 17 3 16-13ZM3 22 16 9"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>',
  search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.spark}</svg>`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key = 'ccf-community-space-v1';
let persistent = true;
let state;
try { state = cleanState(JSON.parse(localStorage.getItem(key))); } catch { state = cleanState(null); persistent = false; }
let filters = { query: '', category: 'All', savedOnly: false };
let toastTimer;
let installPrompt;
const main = document.querySelector('main');
const dialog = document.querySelector('dialog');

function announce(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message; toast.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 3600);
}
function persist(message) {
  try { localStorage.setItem(key, JSON.stringify(state)); persistent = true; }
  catch { persistent = false; }
  announce(persistent ? message : 'Browser storage is unavailable. Changes last only while this page stays open.');
}
function card(a) {
  const saved = state.favorites.includes(a.id);
  return `<article class="activity-card"><div class="card-art ${a.color}">${icon(a.icon)}<button class="save-button" data-save="${a.id}" aria-label="${saved ? 'Unsave' : 'Save'} ${escape(a.title)}" aria-pressed="${saved}">${icon('heart')}</button></div><div class="card-body"><div class="card-meta"><span>${a.category}</span><span>${a.time} · At your pace</span></div><h3>${a.title}</h3><p>${a.description}</p><button class="card-open" data-open="${a.id}">Try this activity <span aria-hidden="true">↗</span><span class="sr-only">: ${a.title}</span></button></div></article>`;
}
function home() {
  return `<section class="hero"><div class="hero-copy"><div class="eyebrow">A community, in full color</div><h1>A little more<br>color.<br>A little more<br><em>together.</em></h1><p>Good things begin with a small connection. Find a little inspiration, make something meaningful, and bring your own color to the community.</p><div class="actions"><a href="#explore" class="button">Find your next small thing <span aria-hidden="true">↗</span></a><a href="#planner" class="text-button">Make space for it</a></div><span class="tiny-label">Come as you are. Start where you are.</span></div><div class="hero-art"><img src="/hero.svg" alt="Four colorful petals coming together around a smiling center" width="580" height="520"><span class="art-caption">Better, with you in it.</span></div></section><div class="values-strip"><span>${icon('spark')} Creativity in everyday life</span><span>${icon('chat')} Connection through stories</span><span>${icon('heart')} Care in small actions</span></div><section class="section"><div class="section-top"><div><div class="eyebrow">Small starts, real possibilities</div><h2>What will you try today?</h2></div><a href="#explore" class="text-button">Explore all activities ↗</a></div><div class="card-grid">${activities.slice(0, 3).map(card).join('')}</div></section><section class="academy-banner"><div><div class="eyebrow">On the horizon</div><h2>Stay curious.</h2></div><p>Guardian Academy is taking shape. A new space to ask better questions, explore ideas, and keep learning together.</p><a class="button" href="#academy">Meet the Academy <span aria-hidden="true">↗</span></a></section>`;
}
function explore() {
  return `<div class="page-head"><div class="eyebrow">Find your spark</div><h1>Small things.<br>Meaningful moments.</h1><p>Self-guided ideas for a more creative, connected day. Pick what feels right and make it your own.</p></div><section class="explore-section" aria-label="Activities"><div class="explore-tools"><label class="search">${icon('search')}<span class="sr-only">Search activities</span><input type="search" id="search" placeholder="Find an activity…" value="${escape(filters.query)}" maxlength="100"></label><button class="chip" id="saved-filter" aria-pressed="${filters.savedOnly}">Saved <span aria-hidden="true">♡</span></button></div><div class="filter-bar" role="group" aria-label="Activity category">${['All','Create','Connect','Care','Learn'].map(c => `<button class="chip" data-category="${c}" aria-pressed="${filters.category === c}">${c}</button>`).join('')}</div><p id="results-count" class="results-count" role="status"></p><div id="results" class="card-grid"></div></section>`;
}
function updateResults() {
  const results = selectActivities({ ...filters, favorites: state.favorites });
  document.querySelector('#results-count').textContent = `${results.length} ${results.length === 1 ? 'activity' : 'activities'} to explore`;
  document.querySelector('#results').innerHTML = results.length ? results.map(card).join('') : '<div class="empty"><h3>A little room for discovery.</h3><p>No activities match just yet. Try a different search, or explore the full collection.</p><button class="button secondary" id="reset-filters">Show all activities</button></div>';
}
function planner() {
  const saved = activities.filter(a => state.favorites.includes(a.id));
  return `<div class="page-head"><div class="eyebrow">Your space</div><h1>Make room for<br>what matters.</h1><p>A few small intentions, a little inspiration, and a place to come back to. This space is yours.</p></div><div class="planner-layout"><section class="planner-panel"><h2>Your small things</h2><p class="fine">Saved in this browser. No account needed; no cross-device sync.</p>${!persistent ? '<p class="storage-warning" role="status">Storage is unavailable. Keep this page open or export your plan to keep it.</p>' : ''}<form class="task-form" id="task-form"><label class="sr-only" for="task-title">A small thing you want to do</label><input id="task-title" name="title" placeholder="One small thing I want to do…" maxlength="160" required autocomplete="off"><button class="button" type="submit">Add <span aria-hidden="true">+</span></button></form><ul class="task-list">${state.tasks.map((t,i) => `<li class="task-row"><input type="checkbox" id="task-${i}" data-toggle="${escape(t.id)}" ${t.done ? 'checked' : ''}><label for="task-${i}">${escape(t.title)}</label><button class="delete-task" data-delete="${escape(t.id)}" aria-label="Delete ${escape(t.title)}">${icon('trash')}</button></li>`).join('') || '<li class="empty"><h3>Start with one small thing.</h3><p>Add your own intention above, or add an activity from Explore.</p><a href="#explore" class="text-button">Find some inspiration ↗</a></li>'}</ul><div class="planner-controls"><span>${state.tasks.filter(t => t.done).length} of ${state.tasks.length} completed</span><button class="text-button" id="export-plan">Export my plan</button></div></section><aside class="planner-aside">${icon('sun')}<h2>Progress can<br>be gentle.</h2><p>You don’t need a big plan to make a difference. One thoughtful action is a lovely place to start.</p><a href="#explore" class="text-button">Find a little inspiration ↗</a></aside></div><section class="saved-section"><div class="section-top"><h2>Kept for later.</h2><span class="fine">${saved.length} saved ${saved.length === 1 ? 'activity' : 'activities'}</span></div><div class="card-grid">${saved.map(card).join('') || '<div class="empty"><h3>Save what speaks to you.</h3><p>Tap the heart on an activity and it will be waiting for you here.</p><a class="button secondary" href="#explore">Explore activities ↗</a></div>'}</div></section>`;
}
function academy() {
  return `<section class="academy-page"><div class="academy-info"><div class="eyebrow">Guardian Academy · Coming soon</div><h1>Curiosity deserves<br>a good home.</h1><p>Our first course is taking shape: <strong>Words Have Histories — Etymology Without Myths.</strong> A space to explore the stories of words with care, curiosity, and evidence.</p><div class="release-note"><h3>Still growing. Not yet open.</h3><p>The course and student workbook are under review. Enrollment and workbook downloads are not available in this app. We’ll share access information after the course is approved.</p></div><a href="#explore" class="button">Keep exploring in the meantime <span aria-hidden="true">↗</span></a></div><div class="academy-cover"><span class="badge">Guardian Academy · 01</span><h2>Words<br>have<br>histories.</h2><p>Etymology Without Myths<br><span class="fine">A course in development.</span></p></div></section><section class="faq"><h2>A few things to know.</h2><details><summary>Can I download the workbook now?</summary><p>No. The student edition will be available only after approval and verification of an eligible membership through the Wix site. Draft materials are not available here.</p></details><details><summary>Where do I manage my membership or shop?</summary><p>Visit the <a href="https://www.colorizedcommunityfriends.store/" target="_blank" rel="noopener noreferrer">CCF Wix website (opens in a new tab)</a> for existing store and account services. This companion app does not process payments or change your membership.</p></details><details><summary>Where is my personal planner saved?</summary><p>In this browser, on this device. It does not sync to an account or another device. Clearing browser data removes your saved plan. Use “Export my plan” to keep a copy. Avoid putting sensitive information in a shared-device planner.</p></details></section>`;
}
function route(moveFocus = false) {
  const name = location.hash.slice(1) || 'home';
  if (name === 'main') { main.focus(); return; }
  const page = ['home','explore','planner','academy'].includes(name) ? name : 'home';
  main.innerHTML = ({ home, explore, planner, academy })[page]();
  document.title = `${({home:'A little more together',explore:'Explore',planner:'Your space',academy:'Guardian Academy'})[page]} — CCF`;
  document.querySelectorAll('[data-nav]').forEach(a => { if (a.dataset.nav === page) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current'); });
  if (page === 'explore') updateResults();
  if (moveFocus) { window.scrollTo(0,0); main.focus({preventScroll:true}); }
}
function openActivity(id) {
  const a = activities.find(a => a.id === id); if (!a) return;
  document.querySelector('#dialog-content').innerHTML = `<div class="dialog-icon ${a.color}">${icon(a.icon)}</div><div class="eyebrow">${a.category} · ${a.time}</div><h2 id="dialog-title">${a.title}</h2><p>${a.description}</p><ol>${a.steps.map(s => `<li>${s}</li>`).join('')}</ol><button class="button" data-add="${a.id}">Add to my plan <span aria-hidden="true">+</span></button><p class="fine">A self-guided activity. Adapt it to your needs and surroundings.</p>`;
  dialog.showModal();
}
function addTask(title) {
  if (state.tasks.length >= 100) { announce('Your plan holds up to 100 items. Remove an item to make room.'); return false; }
  state.tasks.push({id:crypto.randomUUID(),title:title.trim().slice(0,160),done:false});
  persist('Added to your plan.'); return true;
}
document.addEventListener('click', event => {
  const el = event.target.closest('button'); if (!el) return;
  if (el.dataset.open) openActivity(el.dataset.open);
  if (el.dataset.save) {
    const id = el.dataset.save; if (!activities.some(a => a.id === id)) return;
    const index = state.favorites.indexOf(id); if (index < 0) state.favorites.push(id); else state.favorites.splice(index,1);
    persist(index < 0 ? 'Saved for a little later.' : 'Removed from saved activities.');
    if (location.hash === '#planner') route();
    else if (location.hash === '#explore') updateResults();
    else { el.setAttribute('aria-pressed',String(index < 0)); el.setAttribute('aria-label',`${index < 0 ? 'Unsave' : 'Save'} ${activities.find(a=>a.id===id).title}`); }
  }
  if (el.dataset.category) { filters.category = el.dataset.category; document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===el))); updateResults(); }
  if (el.id === 'saved-filter') { filters.savedOnly = !filters.savedOnly; el.setAttribute('aria-pressed',String(filters.savedOnly)); updateResults(); }
  if (el.id === 'reset-filters') { filters = {query:'',category:'All',savedOnly:false}; route(); document.querySelector('#search').focus(); }
  if (el.dataset.add) { const a = activities.find(a=>a.id===el.dataset.add); if (a && addTask(a.title)) { dialog.close(); if(location.hash==='#planner') route(); } }
  if (el.dataset.delete) {
    const buttons = [...document.querySelectorAll('[data-delete]')]; const oldIndex = buttons.indexOf(el);
    state.tasks = state.tasks.filter(t=>t.id!==el.dataset.delete); persist('Removed from your plan.'); route();
    const remaining = document.querySelectorAll('[data-delete]'); (remaining[Math.min(oldIndex,remaining.length-1)] || document.querySelector('#task-title')).focus();
  }
  if (el.classList.contains('close-dialog')) dialog.close();
  if (el.id === 'export-plan') {
    const blob = new Blob([JSON.stringify({app:'Colorized Community Friends',exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url;a.download='ccf-my-plan.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Your plan is ready to save.');
  }
  if (el.id === 'install-button') install();
});
document.addEventListener('input', e => { if(e.target.id === 'search') { filters.query=e.target.value; updateResults(); } });
document.addEventListener('change', e => {
  if (e.target.dataset.toggle) { const t=state.tasks.find(t=>t.id===e.target.dataset.toggle); if(!t)return; t.done=e.target.checked; persist(t.done?'A little progress. Nicely done.':'Marked as still to do.'); document.querySelector('.planner-controls>span').textContent=`${state.tasks.filter(t=>t.done).length} of ${state.tasks.length} completed`; }
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'task-form') return; e.preventDefault();
  const input = document.querySelector('#task-title');
  if (!input.value.trim()) { input.setCustomValidity('Add a few words for your plan.'); input.reportValidity(); input.addEventListener('input',()=>input.setCustomValidity(''),{once:true}); return; }
  if(addTask(input.value)) { route();document.querySelector('#task-title').focus(); }
});
dialog.addEventListener('click', e => { if(e.target===dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close(); } });
async function install() {
  if(installPrompt) { await installPrompt.prompt(); await installPrompt.userChoice; installPrompt=null; return; }
  document.querySelector('#dialog-content').innerHTML='<div class="eyebrow">Keep CCF close</div><h2 id="dialog-title">A little space on your home screen.</h2><p>On iPhone or iPad, open this app in Safari, tap Share, then Add to Home Screen. On Android or desktop, look for Install app or Add to Home Screen in your browser menu.</p><p class="fine">Installation depends on your browser and a secure connection. Once loaded, activities and your planner can work offline. Store and account services need an internet connection.</p>';
  dialog.showModal();
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});
window.addEventListener('hashchange',()=>route(true));
window.addEventListener('storage',e=>{if(e.key===key){try{state=cleanState(JSON.parse(e.newValue));route();}catch{}}});
const connection = () => { document.querySelector('#connection-status').textContent=navigator.onLine?'Online':'Offline · your space still works'; };
window.addEventListener('online',connection);window.addEventListener('offline',connection);
route();connection();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{ /* Online functionality remains available. */ });
