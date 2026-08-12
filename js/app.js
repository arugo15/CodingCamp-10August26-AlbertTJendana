/* ============================================================
   app.js — Personal Dashboard
   Features:
     - Live clock & date
     - Time-based greeting with custom name (Challenge)
     - Light / Dark mode toggle (Challenge)
     - Focus timer with configurable duration (Challenge)
     - To-do list with add, edit, delete, done, sort
     - Duplicate task prevention (Challenge)
     - Quick links with add & delete
     - All data persisted in LocalStorage
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────
   STORAGE HELPERS
────────────────────────────────────────────── */
const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  },
};

const KEYS = {
  THEME: 'dashboard_theme',
  NAME:  'dashboard_name',
  TODOS: 'dashboard_todos',
  LINKS: 'dashboard_links',
};

/* ──────────────────────────────────────────────
   CLOCK & DATE
────────────────────────────────────────────── */
const clockEl       = document.getElementById('clock');
const dateDisplayEl = document.getElementById('date-display');

function updateClock() {
  const now = new Date();

  // Time — HH:MM:SS
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${hh}:${mm}:${ss}`;

  // Date — Weekday, Month Day, Year
  dateDisplayEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
}

setInterval(updateClock, 1000);
updateClock();

/* ──────────────────────────────────────────────
   GREETING & CUSTOM NAME  (Challenge: custom name)
────────────────────────────────────────────── */
const greetingTextEl  = document.getElementById('greeting-text');
const nameDisplayEl   = document.getElementById('name-display');
const editNameBtn     = document.getElementById('edit-name-btn');
const nameModal       = document.getElementById('name-modal');
const nameInput       = document.getElementById('name-input');
const nameSaveBtn     = document.getElementById('name-save-btn');
const nameCancelBtn   = document.getElementById('name-cancel-btn');

let userName = Storage.get(KEYS.NAME, '');

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function renderGreeting() {
  const greeting = getGreeting();
  greetingTextEl.textContent = userName
    ? `${greeting}, ${userName}! 👋`
    : `${greeting}! 👋`;
  nameDisplayEl.textContent = userName ? `Hi, ${userName}` : 'Set your name above';
}

// Update greeting every minute so it changes at correct hour boundaries
setInterval(renderGreeting, 60_000);
renderGreeting();

editNameBtn.addEventListener('click', () => {
  nameInput.value = userName;
  nameModal.classList.remove('hidden');
  nameInput.focus();
});

nameSaveBtn.addEventListener('click', saveName);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });
nameCancelBtn.addEventListener('click', () => nameModal.classList.add('hidden'));
nameModal.addEventListener('click', (e) => { if (e.target === nameModal) nameModal.classList.add('hidden'); });

function saveName() {
  const val = nameInput.value.trim();
  userName = val;
  Storage.set(KEYS.NAME, userName);
  renderGreeting();
  nameModal.classList.add('hidden');
}

/* ──────────────────────────────────────────────
   THEME  (Challenge: light / dark mode)
────────────────────────────────────────────── */
const themeToggleBtn = document.getElementById('theme-toggle');
let isDark = Storage.get(KEYS.THEME, false);

function applyTheme() {
  document.body.classList.toggle('dark', isDark);
  document.body.classList.toggle('light', !isDark);
  themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
  themeToggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}

themeToggleBtn.addEventListener('click', () => {
  isDark = !isDark;
  Storage.set(KEYS.THEME, isDark);
  applyTheme();
});

applyTheme();

/* ──────────────────────────────────────────────
   FOCUS TIMER  (Challenge: change Pomodoro time)
────────────────────────────────────────────── */
const timerDisplay      = document.getElementById('timer-display');
const timerProgress     = document.getElementById('timer-progress');
const timerStartBtn     = document.getElementById('timer-start');
const timerStopBtn      = document.getElementById('timer-stop');
const timerResetBtn     = document.getElementById('timer-reset');
const timerStatusEl     = document.getElementById('timer-status');
const timerDurationInput = document.getElementById('timer-duration');
const applyDurationBtn  = document.getElementById('apply-duration-btn');

let timerDurationMins = 25;
let totalSeconds      = timerDurationMins * 60;
let remainingSeconds  = totalSeconds;
let timerInterval     = null;
let isRunning         = false;

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerUI() {
  timerDisplay.textContent = formatTime(remainingSeconds);
  const pct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 100;
  timerProgress.style.width = `${pct}%`;
}

function startTimer() {
  if (isRunning) return;
  if (remainingSeconds <= 0) resetTimer();

  isRunning = true;
  timerStartBtn.disabled = true;
  timerStopBtn.disabled  = false;
  timerStatusEl.textContent = '';

  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerUI();

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
      timerStartBtn.disabled = false;
      timerStopBtn.disabled  = true;
      timerStatusEl.textContent = '🎉 Session complete! Take a break.';
      // Flash the display
      timerDisplay.style.color = 'var(--color-success)';
      setTimeout(() => { timerDisplay.style.color = ''; }, 3000);
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  timerStartBtn.disabled = false;
  timerStopBtn.disabled  = true;
  timerStatusEl.textContent = '⏸ Paused';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  remainingSeconds = totalSeconds;
  timerStartBtn.disabled = false;
  timerStopBtn.disabled  = true;
  timerStatusEl.textContent = '';
  timerDisplay.style.color = '';
  updateTimerUI();
}

function applyDuration() {
  const val = parseInt(timerDurationInput.value, 10);
  if (isNaN(val) || val < 1 || val > 120) {
    timerDurationInput.value = timerDurationMins;
    return;
  }
  timerDurationMins = val;
  totalSeconds      = timerDurationMins * 60;
  resetTimer();
}

timerStartBtn.addEventListener('click', startTimer);
timerStopBtn.addEventListener('click', pauseTimer);
timerResetBtn.addEventListener('click', resetTimer);
applyDurationBtn.addEventListener('click', applyDuration);
timerDurationInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyDuration(); });

updateTimerUI();

/* ──────────────────────────────────────────────
   TO-DO LIST
   Challenges: prevent duplicates, sort tasks
────────────────────────────────────────────── */
const todoInput   = document.getElementById('todo-input');
const todoAddBtn  = document.getElementById('todo-add-btn');
const todoListEl  = document.getElementById('todo-list');
const todoEmptyEl = document.getElementById('todo-empty');
const todoErrorEl = document.getElementById('todo-error');
const todoSortEl  = document.getElementById('todo-sort');

// Edit modal
const editModal      = document.getElementById('edit-modal');
const editTaskInput  = document.getElementById('edit-task-input');
const editSaveBtn    = document.getElementById('edit-save-btn');
const editCancelBtn  = document.getElementById('edit-cancel-btn');

let todos = Storage.get(KEYS.TODOS, []);
// Ensure each todo has an id
todos = todos.map((t) =>
  typeof t === 'string'
    ? { id: crypto.randomUUID(), text: t, done: false }
    : { id: t.id || crypto.randomUUID(), text: t.text, done: !!t.done }
);

let editingId = null;

function saveTodos() {
  Storage.set(KEYS.TODOS, todos);
}

function showTodoError(msg) {
  todoErrorEl.textContent = msg;
  todoErrorEl.classList.remove('hidden');
  setTimeout(() => todoErrorEl.classList.add('hidden'), 3000);
}

function getSortedTodos() {
  const order = todoSortEl.value;
  const copy = [...todos];
  if (order === 'az')   return copy.sort((a, b) => a.text.localeCompare(b.text));
  if (order === 'za')   return copy.sort((a, b) => b.text.localeCompare(a.text));
  if (order === 'done') return copy.sort((a, b) => Number(a.done) - Number(b.done));
  return copy; // default
}

function renderTodos() {
  todoListEl.innerHTML = '';
  const sorted = getSortedTodos();

  if (sorted.length === 0) {
    todoEmptyEl.classList.remove('hidden');
    return;
  }
  todoEmptyEl.classList.add('hidden');

  sorted.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type      = 'checkbox';
    checkbox.className = 'todo-item__check';
    checkbox.checked   = todo.done;
    checkbox.setAttribute('aria-label', `Mark "${todo.text}" as done`);
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    const span = document.createElement('span');
    span.className   = 'todo-item__text';
    span.textContent = todo.text;

    const actions = document.createElement('div');
    actions.className = 'todo-item__actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn--edit btn--sm';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', `Edit task: ${todo.text}`);
    editBtn.addEventListener('click', () => openEditModal(todo.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn--danger btn--sm';
    deleteBtn.textContent = '🗑';
    deleteBtn.setAttribute('aria-label', `Delete task: ${todo.text}`);
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);
    todoListEl.appendChild(li);
  });
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;

  // Challenge: prevent duplicates (case-insensitive)
  const duplicate = todos.some(
    (t) => t.text.toLowerCase() === text.toLowerCase()
  );
  if (duplicate) {
    showTodoError(`"${text}" is already in your list.`);
    todoInput.select();
    return;
  }

  todos.push({ id: crypto.randomUUID(), text, done: false });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    saveTodos();
    renderTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  renderTodos();
}

function openEditModal(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  editingId = id;
  editTaskInput.value = todo.text;
  editModal.classList.remove('hidden');
  editTaskInput.focus();
  editTaskInput.select();
}

function saveEdit() {
  const newText = editTaskInput.value.trim();
  if (!newText) return;

  // Prevent duplicate on edit (ignore the task being edited)
  const duplicate = todos.some(
    (t) => t.id !== editingId && t.text.toLowerCase() === newText.toLowerCase()
  );
  if (duplicate) {
    editTaskInput.select();
    return;
  }

  const todo = todos.find((t) => t.id === editingId);
  if (todo) {
    todo.text = newText;
    saveTodos();
    renderTodos();
  }
  closeEditModal();
}

function closeEditModal() {
  editModal.classList.add('hidden');
  editingId = null;
}

todoAddBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });
editSaveBtn.addEventListener('click', saveEdit);
editTaskInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveEdit(); });
editCancelBtn.addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });
todoSortEl.addEventListener('change', renderTodos);

renderTodos();

/* ──────────────────────────────────────────────
   QUICK LINKS
────────────────────────────────────────────── */
const linkNameInput = document.getElementById('link-name-input');
const linkUrlInput  = document.getElementById('link-url-input');
const linkAddBtn    = document.getElementById('link-add-btn');
const linksGrid     = document.getElementById('links-grid');
const linksEmptyEl  = document.getElementById('links-empty');
const linkErrorEl   = document.getElementById('link-error');

let links = Storage.get(KEYS.LINKS, []);

function saveLinks() {
  Storage.set(KEYS.LINKS, links);
}

function showLinkError(msg) {
  linkErrorEl.textContent = msg;
  linkErrorEl.classList.remove('hidden');
  setTimeout(() => linkErrorEl.classList.add('hidden'), 3000);
}

function renderLinks() {
  linksGrid.innerHTML = '';

  if (links.length === 0) {
    linksEmptyEl.classList.remove('hidden');
    return;
  }
  linksEmptyEl.classList.add('hidden');

  links.forEach((link, index) => {
    const chip = document.createElement('div');
    chip.className = 'link-chip';

    const anchor = document.createElement('a');
    anchor.href   = link.url;
    anchor.target = '_blank';
    anchor.rel    = 'noopener noreferrer';
    anchor.textContent = link.name;
    anchor.style.textDecoration = 'none';
    anchor.style.color = 'inherit';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'link-chip__delete';
    deleteBtn.textContent = '✕';
    deleteBtn.setAttribute('aria-label', `Remove link: ${link.name}`);
    deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      deleteLink(index);
    });

    chip.appendChild(anchor);
    chip.appendChild(deleteBtn);
    linksGrid.appendChild(chip);
  });
}

function normalizeUrl(url) {
  url = url.trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  return url;
}

function addLink() {
  const name = linkNameInput.value.trim();
  const rawUrl = linkUrlInput.value.trim();

  if (!name) {
    showLinkError('Please enter a label for the link.');
    linkNameInput.focus();
    return;
  }
  if (!rawUrl) {
    showLinkError('Please enter a URL.');
    linkUrlInput.focus();
    return;
  }

  const url = normalizeUrl(rawUrl);

  try {
    new URL(url); // validate URL
  } catch {
    showLinkError('Please enter a valid URL (e.g. https://example.com).');
    linkUrlInput.focus();
    return;
  }

  links.push({ name, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
}

function deleteLink(index) {
  links.splice(index, 1);
  saveLinks();
  renderLinks();
}

linkAddBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });
linkNameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') linkUrlInput.focus(); });

renderLinks();
