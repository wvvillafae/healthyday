const DEFAULT_ITEMS = [
  { id: "breakfast", name: "Desayuno", time: "08:00", emoji: "🍳", description: "Empieza tu día con energía" },
  { id: "water1", name: "Tomar agua", time: "10:00", emoji: "💧", description: "Un momento para hidratarte" },
  { id: "lunch", name: "Almuerzo", time: "13:00", emoji: "🍲", description: "Disfruta tu comida" },
  { id: "snack", name: "Merienda", time: "16:00", emoji: "🍎", description: "Recarga energías" },
  { id: "dinner", name: "Cena", time: "19:30", emoji: "🥗", description: "Termina el día con calma" }
];
const WATER_GOAL = 8;
const todayKey = new Date().toLocaleDateString("en-CA");
const $ = (selector) => document.querySelector(selector);
let items = load("hd-items", DEFAULT_ITEMS);
let completed = load("hd-completed", {});
let water = load("hd-water", 0);
let points = load("hd-points", 0);
let notified = new Set();

function load(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (key === "hd-completed" || key === "hd-water" || key === "hd-points") {
      const savedDate = localStorage.getItem("hd-date");
      if (savedDate !== todayKey) return fallback;
    }
    return value ?? structuredClone(fallback);
  } catch { return structuredClone(fallback); }
}
function save() {
  localStorage.setItem("hd-items", JSON.stringify(items));
  localStorage.setItem("hd-completed", JSON.stringify(completed));
  localStorage.setItem("hd-water", JSON.stringify(water));
  localStorage.setItem("hd-points", JSON.stringify(points));
  localStorage.setItem("hd-date", todayKey);
}
function formatTime(time) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "p. m." : "a. m.";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2,"0")} ${suffix}`;
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function render() {
  const doneCount = items.filter(item => completed[item.id]).length;
  const total = items.length;
  const percent = total ? Math.round(doneCount / total * 100) : 0;
  $("#progress-number").textContent = `${percent}%`;
  $("#progress-ring").style.background = `conic-gradient(var(--green) ${percent * 3.6}deg,#edf4ef 0deg)`;
  $("#progress-bar").style.width = `${percent}%`;
  $("#progress-message").textContent = percent === 100 ? "¡Lo lograste!" : percent >= 60 ? "¡Lo estás haciendo genial!" : percent > 0 ? "¡Buen comienzo!" : "¡Empecemos!";
  $("#progress-detail").textContent = percent === 100 ? "Has completado todos tus hábitos de hoy." : `Has completado ${doneCount} de ${total} hábitos. ¡Sigue avanzando!`;
  $("#hero-points").textContent = points;
  $("#hero-done").textContent = `${doneCount}/${total}`;
  $("#routine-list").innerHTML = items.map(item => `
    <article class="routine-item ${completed[item.id] ? "done" : ""}">
      <div class="routine-top"><span class="routine-emoji">${item.emoji}</span>
        <button class="routine-check" data-complete="${item.id}" aria-label="Marcar ${item.name} como completado">${completed[item.id] ? "✓" : ""}</button>
      </div>
      <h3>${escapeHTML(item.name)}</h3>
      <div class="routine-time">${formatTime(item.time)}</div>
      <div class="routine-state">${completed[item.id] ? "✓ ¡Completado!" : "○ Pendiente"}</div>
    </article>`).join("");
  $("#water-count").textContent = water;
  $("#water-goal").textContent = WATER_GOAL;
  $("#water-fill").style.height = `${Math.min(water / WATER_GOAL, 1) * 100}%`;
  $("#water-message").textContent = water >= WATER_GOAL ? "¡Meta alcanzada! 🌟" : water === 0 ? "¡Cada sorbo cuenta!" : "¡Vas muy bien!";
  $("#first-badge").textContent = doneCount > 0 ? "🏅" : "🔒";
  $("#water-badge").textContent = water >= WATER_GOAL ? "🏅" : "🔒";
  updateNext();
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function updateNext() {
  const now = new Date();
  const current = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const next = items.filter(item => !completed[item.id] && item.time >= current).sort((a,b) => a.time.localeCompare(b.time))[0]
    || items.filter(item => !completed[item.id]).sort((a,b) => a.time.localeCompare(b.time))[0];
  if (next) {
    $("#next-emoji").textContent = next.emoji;
    $("#next-title").textContent = next.name;
    $("#next-time").textContent = `A las ${formatTime(next.time)}`;
  } else {
    $("#next-emoji").textContent = "🎉";
    $("#next-title").textContent = "¡Rutina completada!";
    $("#next-time").textContent = "Has cumplido tus hábitos de hoy";
  }
}
function completeItem(id) {
  const item = items.find(entry => entry.id === id);
  if (!item) return;
  if (completed[id]) {
    completed[id] = false;
    points = Math.max(0, points - 10);
    showToast("Hábito desmarcado. Puedes volver a intentarlo.");
  } else {
    completed[id] = true;
    points += 10;
    showToast(`¡${item.name} completado! +10 puntos ⭐`);
  }
  save(); render();
}
$("#routine-list").addEventListener("click", event => {
  const button = event.target.closest("[data-complete]");
  if (button) completeItem(button.dataset.complete);
});
$("#add-water").addEventListener("click", () => {
  if (water >= WATER_GOAL) { showToast("¡Ya alcanzaste tu meta de agua! 💧"); return; }
  water += 1; points += 2; save(); render(); showToast("¡Un vaso más! +2 puntos 💧");
});
$("#remove-water").addEventListener("click", () => {
  if (!water) return;
  water -= 1; points = Math.max(0, points - 2); save(); render(); showToast("Se quitó el último vaso registrado.");
});

function openSchedule() {
  $("#schedule-fields").innerHTML = items.map(item => `
    <label class="schedule-field"><span>${item.emoji} ${escapeHTML(item.name)}</span>
      <input type="time" name="${item.id}" value="${item.time}" required>
    </label>`).join("");
  $("#schedule-dialog").showModal();
}
$("#edit-schedule").addEventListener("click", openSchedule);
$("#schedule-form").addEventListener("submit", event => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  items = items.map(item => ({...item, time: formData.get(item.id) || item.time}));
  save(); render(); $("#schedule-dialog").close(); showToast("¡Tus horarios se actualizaron!");
});

async function enableNotifications() {
  if (!("Notification" in window)) {
    showToast("Este navegador no permite notificaciones.");
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    showToast("¡Notificaciones activadas! Te avisaremos con la página abierta 🔔");
    new Notification("HealthyDay", { body: "¡Recordatorios activados! Cuida de ti. 💚" });
    $("#notify-btn").textContent = "🔔";
  } else {
    showToast("No se concedió permiso para las notificaciones.");
  }
}
$("#notify-btn").addEventListener("click", enableNotifications);

function checkReminders() {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  items.forEach(item => {
    const key = `${todayKey}-${item.id}-${time}`;
    if (item.time === time && !completed[item.id] && !notified.has(key)) {
      notified.add(key);
      const message = `¡Es hora de ${item.name.toLowerCase()}! ${item.emoji}`;
      showToast(message);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("HealthyDay 💚", { body: message });
      }
    }
  });
}
const now = new Date();
$("#today-label").textContent = now.toLocaleDateString("es-PE", {weekday:"long", day:"numeric", month:"long"}).toUpperCase();
$("#date-chip").textContent = now.toLocaleDateString("es-PE", {day:"numeric",month:"short"});
render();
setInterval(() => { checkReminders(); updateNext(); }, 15000);

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
