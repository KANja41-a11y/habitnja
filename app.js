// ===== Habitnja App =====
const STORAGE_KEY = 'habitnja_data';
const THEME_KEY = 'habitnja_theme';

let habits = [];
let editingId = null;
let selectedColor = '#7BA3C9';
let currentFilter = 'all';
let calendarDate = new Date(); // bulan yang sedang ditampilkan

// ===== DOM Elements =====
const habitListEl = document.getElementById('habitList');
const emptyStateEl = document.getElementById('emptyState');
const modalEl = document.getElementById('modal');
const habitForm = document.getElementById('habitForm');
const habitNameInput = document.getElementById('habitName');
const modalTitle = document.getElementById('modalTitle');
const todayDateEl = document.getElementById('todayDate');
const calendarGrid = document.getElementById('calendarGrid');
const calendarTitle = document.getElementById('calendarTitle');

// ===== Utility =====
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateID(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== Storage =====
function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    habits = raw ? JSON.parse(raw) : [];
  } catch {
    habits = [];
  }
}

function saveHabits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

// ===== Theme =====
function loadTheme() {
  const theme = localStorage.getItem(THEME_KEY) || 'light';
  if (theme === 'dark') document.body.classList.add('dark');
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

// ===== Streak & Progress =====
function calculateStreak(completedDates) {
  if (!completedDates || completedDates.length === 0) return 0;
  const sorted = [...completedDates].sort().reverse();
  const today = todayStr();
  let streak = 0;
  let current = new Date(today);

  if (!sorted.includes(today)) {
    current.setDate(current.getDate() - 1);
  }

  while (true) {
    const dateStr = current.toISOString().slice(0, 10);
    if (sorted.includes(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function getLast7DaysStatus(completedDates) {
  const result = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const str = d.toISOString().slice(0, 10);
    result.push(completedDates.includes(str));
  }
  return result;
}

// ===== Stats =====
function updateStats() {
  const total = habits.length;
  const today = todayStr();
  const completedToday = habits.filter(h => h.completedDates.includes(today)).length;

  let bestStreak = 0;
  habits.forEach(h => {
    const s = calculateStreak(h.completedDates);
    if (s > bestStreak) bestStreak = s;
  });

  let possible = 0;
  let done = 0;
  habits.forEach(h => {
    const last7 = getLast7DaysStatus(h.completedDates);
    possible += 7;
    done += last7.filter(Boolean).length;
  });
  const rate = possible === 0 ? 0 : Math.round((done / possible) * 100);

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statCompleted').textContent = completedToday;
  document.getElementById('statStreak').textContent = bestStreak;
  document.getElementById('statRate').textContent = rate + '%';
}

// ===== Calendar =====
function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  calendarTitle.textContent = new Date(year, month).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay(); // 0 = Minggu
  const totalDays = lastDay.getDate();

  // Hitung berapa habit selesai per tanggal di bulan ini
  const completionMap = {};
  habits.forEach(h => {
    h.completedDates.forEach(dateStr => {
      const d = new Date(dateStr);
      if (d.getFullYear() === year && d.getMonth() === month) {
        completionMap[dateStr] = (completionMap[dateStr] || 0) + 1;
      }
    });
  });

  const totalHabits = habits.length || 1;

  calendarGrid.innerHTML = '';

  // Hari kosong sebelum tanggal 1
  for (let i = 0; i < startWeekday; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day other-month';
    calendarGrid.appendChild(empty);
  }

  const today = todayStr();

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const count = completionMap[dateStr] || 0;
    const ratio = count / totalHabits;

    let heatClass = 'none';
    if (ratio >= 0.8) heatClass = 'high';
    else if (ratio >= 0.4) heatClass = 'mid';
    else if (ratio > 0) heatClass = 'low';

    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    if (dateStr === today) cell.classList.add('today');

    cell.innerHTML = `
      <span>${day}</span>
      <span class="heat ${heatClass}"></span>
    `;
    calendarGrid.appendChild(cell);
  }
}

// ===== Render Habits =====
function renderHabits() {
  habitListEl.innerHTML = '';
  const today = todayStr();

  let filtered = [...habits];

  if (currentFilter === 'done') {
    filtered = filtered.filter(h => h.completedDates.includes(today));
  } else if (currentFilter === 'pending') {
    filtered = filtered.filter(h => !h.completedDates.includes(today));
  }

  // Sort: incomplete first
  filtered.sort((a, b) => {
    const aDone = a.completedDates.includes(today);
    const bDone = b.completedDates.includes(today);
    if (aDone !== bDone) return aDone ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  if (habits.length === 0) {
    emptyStateEl.classList.remove('hidden');
    updateStats();
    renderCalendar();
    return;
  }

  emptyStateEl.classList.add('hidden');

  if (filtered.length === 0) {
    habitListEl.innerHTML = `
      <div class="empty-state" style="padding:40px 20px">
        <div class="empty-icon">🔍</div>
        <h3>Tidak ada habit</h3>
        <p>Tidak ada habit yang cocok dengan filter ini.</p>
      </div>
    `;
  } else {
    filtered.forEach(habit => {
      const isCompleted = habit.completedDates.includes(today);
      const streak = calculateStreak(habit.completedDates);
      const last7 = getLast7DaysStatus(habit.completedDates);

      const card = document.createElement('div');
      card.className = `habit-card ${isCompleted ? 'completed' : ''}`;
      card.style.setProperty('--habit-color', habit.color);

      card.innerHTML = `
        <button class="habit-check" data-id="${habit.id}" title="Tandai selesai">
          ${isCompleted ? '✓' : ''}
        </button>
        <div class="habit-info">
          <div class="habit-name">${escapeHtml(habit.name)}</div>
          <div class="habit-meta">
            <span class="streak-badge">🔥 ${streak} hari</span>
            <div class="progress-mini">
              ${last7.map(done => `<div class="progress-dot ${done ? 'done' : ''}"></div>`).join('')}
            </div>
          </div>
        </div>
        <div class="habit-actions">
          <button class="action-btn edit" data-id="${habit.id}" title="Edit">✏️</button>
          <button class="action-btn delete" data-id="${habit.id}" title="Hapus">🗑️</button>
        </div>
      `;
      habitListEl.appendChild(card);
    });
  }

  updateStats();
  renderCalendar();
}

// ===== Actions =====
function toggleComplete(id) {
  const habit = habits.find(h => h.id === id);
  if (!habit) return;

  const today = todayStr();
  const idx = habit.completedDates.indexOf(today);

  if (idx === -1) {
    habit.completedDates.push(today);
  } else {
    habit.completedDates.splice(idx, 1);
  }

  saveHabits();
  renderHabits();
}

function deleteHabit(id) {
  if (!confirm('Yakin ingin menghapus habit ini?')) return;
  habits = habits.filter(h => h.id !== id);
  saveHabits();
  renderHabits();
}

function openModal(editHabit = null) {
  editingId = editHabit ? editHabit.id : null;
  modalTitle.textContent = editHabit ? 'Edit Habit' : 'Tambah Habit Baru';
  habitNameInput.value = editHabit ? editHabit.name : '';
  selectedColor = editHabit ? editHabit.color : '#7BA3C9';

  document.querySelectorAll('.color-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === selectedColor);
  });

  modalEl.classList.remove('hidden');
  habitNameInput.focus();
}

function closeModal() {
  modalEl.classList.add('hidden');
  editingId = null;
  habitForm.reset();
}

function saveHabit(e) {
  e.preventDefault();
  const name = habitNameInput.value.trim();
  if (!name) return;

  if (editingId) {
    const habit = habits.find(h => h.id === editingId);
    if (habit) {
      habit.name = name;
      habit.color = selectedColor;
    }
  } else {
    habits.push({
      id: generateId(),
      name,
      color: selectedColor,
      completedDates: [],
      createdAt: todayStr()
    });
  }

  saveHabits();
  renderHabits();
  closeModal();
}

// ===== Export / Import =====
function exportData() {
  if (habits.length === 0) {
    alert('Belum ada data habit untuk diexport.');
    return;
  }
  const dataStr = JSON.stringify(habits, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habitnja-backup-${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('Format tidak valid');

      // Validasi sederhana
      const valid = data.every(h => h.id && h.name && Array.isArray(h.completedDates));
      if (!valid) throw new Error('Data habit tidak valid');

      if (habits.length > 0) {
        const ok = confirm('Data lama akan diganti dengan data import. Lanjutkan?');
        if (!ok) return;
      }

      habits = data;
      saveHabits();
      renderHabits();
      alert('Data berhasil diimport!');
    } catch (err) {
      alert('Gagal import: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// ===== Event Listeners =====
document.getElementById('addHabitBtn').addEventListener('click', () => openModal());
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);
document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('exportBtn').addEventListener('click', exportData);

document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('importInput').click();
});

document.getElementById('importInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) importData(file);
  e.target.value = '';
});

habitForm.addEventListener('submit', saveHabit);

// Color picker
document.getElementById('colorPicker').addEventListener('click', (e) => {
  const btn = e.target.closest('.color-option');
  if (!btn) return;
  selectedColor = btn.dataset.color;
  document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
});

// Filter
document.querySelector('.filter-bar').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  currentFilter = btn.dataset.filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderHabits();
});

// Calendar navigation
document.getElementById('prevMonth').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

// Habit list delegation
habitListEl.addEventListener('click', (e) => {
  const checkBtn = e.target.closest('.habit-check');
  if (checkBtn) {
    toggleComplete(checkBtn.dataset.id);
    return;
  }

  const editBtn = e.target.closest('.action-btn.edit');
  if (editBtn) {
    const habit = habits.find(h => h.id === editBtn.dataset.id);
    if (habit) openModal(habit);
    return;
  }

  const deleteBtn = e.target.closest('.action-btn.delete');
  if (deleteBtn) {
    deleteHabit(deleteBtn.dataset.id);
  }
});

// Keyboard
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalEl.classList.contains('hidden')) {
    closeModal();
  }
});

// ===== Init =====
function init() {
  loadTheme();
  loadHabits();
  todayDateEl.textContent = formatDateID(new Date());
  renderHabits();
}

init();
