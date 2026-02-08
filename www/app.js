// FitFuel workout app
// This file handles all the logic: saving data, rendering workouts, theme toggle, and editing //

const $ = (id) => document.getElementById(id);

// Inputs and main UI elements //
const nameInput = $("workoutName");
const notesInput = $("workoutNotes");
const categoryInput = $("workoutCategory");
const addBtn = $("addBtn");

const listEl = $("workoutList");
const emptyEl = $("emptyState");
const msgEl = $("message");

const searchInput = $("searchInput");
const filterEl = $("filterCategory");

const statTotal = $("statTotal");
const statTopCat = $("statTopCat");
const statLast = $("statLast");

const themeToggle = $("themeToggle");
const clearAllBtn = $("clearAllBtn");

// Edit modal elements //
const modalBackdrop = $("modalBackdrop");
const modalClose = $("modalClose");
const modalCancel = $("modalCancel");
const modalSave = $("modalSave");
const editName = $("editName");
const editCategory = $("editCategory");
const editNotes = $("editNotes");

// Keys for saving data in the browser //
const STORAGE_KEY = "fitfuel_workouts_v2";
const THEME_KEY = "fitfuel_theme_v1";

// Main data array that holds all workouts //
let workouts = [];
let editingId = null; // keeps track of which workout we are editing //

// Load workouts from localStorage when the app starts //
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    workouts = raw ? JSON.parse(raw) : [];
  } catch {
    workouts = [];
  }
}

// Save current workouts to localStorage //
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
}

// Shows a short message under buttons (like feedback to the user) //
function showMsg(text) {
  msgEl.textContent = text;
  setTimeout(() => {
    if (msgEl.textContent === text) msgEl.textContent = "";
  }, 1500);
}

// Apply light or dark theme //
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "🌙" : "☀️";
  localStorage.setItem(THEME_KEY, theme);
}

// Switch between light and dark theme //
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "dark";
  applyTheme(cur === "dark" ? "light" : "dark");
}

// Filter workouts based on search text and category //
function filteredWorkouts() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = filterEl.value;

  return workouts.filter((w) => {
    const textOk =
      !q ||
      w.name.toLowerCase().includes(q) ||
      (w.notes && w.notes.toLowerCase().includes(q));

    const catOk = cat === "all" || w.category === cat;

    return textOk && catOk;
  });
}

// Update stats box (total workouts, top category, last workout date) //
function updateStats() {
  statTotal.textContent = workouts.length;

  if (!workouts.length) {
    statTopCat.textContent = "—";
    statLast.textContent = "—";
    return;
  }

  const counts = {};
  workouts.forEach((w) => (counts[w.category] = (counts[w.category] || 0) + 1));

  let best = "—";
  let bestCount = 0;
  Object.keys(counts).forEach((k) => {
    if (counts[k] > bestCount) {
      best = k;
      bestCount = counts[k];
    }
  });

  statTopCat.textContent = best;
  statLast.textContent = new Date(workouts[0].createdAt).toLocaleDateString();
}

// Render the workout list on the page //
function render() {
  listEl.innerHTML = "";
  updateStats();

  const items = filteredWorkouts();
  emptyEl.style.display = items.length ? "none" : "block";

  items.forEach((w) => {
    const li = document.createElement("li");
    li.className = "item";

    li.innerHTML = `
      <div class="itemTop">
        <div>
          <p class="itemTitle"></p>
          <p class="itemDate"></p>
        </div>
        <span class="chip"></span>
      </div>
      ${w.notes ? `<p class="itemNotes"></p>` : ""}
      <div class="row">
        <button class="smallBtn" type="button">Edit</button>
        <button class="delBtn" type="button">Delete</button>
      </div>
    `;

    li.querySelector(".itemTitle").textContent = w.name;
    li.querySelector(".itemDate").textContent = new Date(w.createdAt).toLocaleString();
    li.querySelector(".chip").textContent = w.category;

    if (w.notes) li.querySelector(".itemNotes").textContent = w.notes;

    const [editBtn, delBtn] = li.querySelectorAll("button");

    editBtn.addEventListener("click", () => openModal(w.id));
    delBtn.addEventListener("click", () => removeWorkout(w.id));

    listEl.appendChild(li);
  });
}

// Add a new workout //
function addWorkout() {
  const name = nameInput.value.trim();
  const notes = notesInput.value.trim();
  const category = categoryInput.value;

  if (!name) {
    showMsg("Please enter a workout name.");
    nameInput.focus();
    return;
  }

  workouts.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    notes,
    category,
    createdAt: Date.now(),
  });

  save();
  render();

  nameInput.value = "";
  notesInput.value = "";
  showMsg("Workout added.");
}

// Delete a workout //
function removeWorkout(id) {
  workouts = workouts.filter((w) => w.id !== id);
  save();
  render();
  showMsg("Workout deleted.");
}

// Clear all workouts (with confirmation) //
function clearAll() {
  if (!workouts.length) {
    showMsg("Nothing to clear.");
    return;
  }
  if (!confirm("Clear ALL workouts?")) return;

  workouts = [];
  save();
  render();
  showMsg("All cleared.");
}

// Open edit modal //
function openModal(id) {
  const w = workouts.find((x) => x.id === id);
  if (!w) return;

  editingId = id;
  editName.value = w.name;
  editCategory.value = w.category;
  editNotes.value = w.notes || "";

  modalBackdrop.classList.remove("hidden");
  editName.focus();
}

// Close edit modal //
function closeModal() {
  editingId = null;
  modalBackdrop.classList.add("hidden");
}

// Save changes from modal //
function saveModal() {
  if (!editingId) return;

  const name = editName.value.trim();
  const category = editCategory.value;
  const notes = editNotes.value.trim();

  if (!name) {
    alert("Workout name is required.");
    editName.focus();
    return;
  }

  workouts = workouts.map((w) =>
    w.id === editingId ? { ...w, name, category, notes } : w
  );

  save();
  render();
  showMsg("Workout updated.");
  closeModal();
}

// Event listeners //
addBtn.addEventListener("click", addWorkout);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addWorkout();
});

searchInput.addEventListener("input", render);
filterEl.addEventListener("change", render);

themeToggle.addEventListener("click", toggleTheme);
clearAllBtn.addEventListener("click", clearAll);

modalClose.addEventListener("click", closeModal);
modalCancel.addEventListener("click", closeModal);
modalSave.addEventListener("click", saveModal);

modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// App start //
applyTheme(localStorage.getItem(THEME_KEY) || "dark");
load();
render();
