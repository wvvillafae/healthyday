const defaults = [
  {id:"breakfast",name:"Desayuno",time:"06:30",emoji:"🍳"},
  {id:"snack",name:"Lonchera saludable",time:"09:30",emoji:"🥪"},
  {id:"lunch",name:"Almuerzo",time:"13:30",emoji:"🍲"},
  {id:"water",name:"Pausa para tomar agua",time:"15:30",emoji:"💧"},
  {id:"dinner",name:"Cena",time:"19:00",emoji:"🥗"},
  {id:"sleep",name:"Prepararse para dormir",time:"21:00",emoji:"🌙"}
];
const $ = selector => document.querySelector(selector);
const GOAL = 6;
const GLASS_ML = 250;
const localDateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
const today = localDateKey(new Date());
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const storedDay = localStorage.getItem("healthyday-current-date");
let items = read("healthyday-items", defaults);
let done = storedDay === today ? read("healthyday-done", {}) : {};
let water = storedDay === today ? read("healthyday-water", 0) : 0;
let points = storedDay === today ? read("healthyday-points", 0) : 0;
let history = read("healthyday-history", {});
let sent = new Set();

function save() {
  localStorage.setItem("healthyday-current-date", today);
  localStorage.setItem("healthyday-items", JSON.stringify(items));
  localStorage.setItem("healthyday-done", JSON.stringify(done));
  localStorage.setItem("healthyday-water", JSON.stringify(water));
  localStorage.setItem("healthyday-points", JSON.stringify(points));
  updateHistory();
}
function updateHistory() {
  const completed = items.filter(item => done[item.id]).length;
  history[today] = {completed, total:items.length, water, points, active:completed > 0 || water > 0};
  localStorage.setItem("healthyday-history", JSON.stringify(history));
}
function fmt(time) {
  const [h,m] = time.split(":").map(Number);
  return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"p. m.":"a. m."}`;
}
function dateForOffset(offset) { const d = new Date(); d.setDate(d.getDate()+offset); return d; }
function toast(message) {
  const element = $("#toast"); element.textContent = message; element.classList.add("show");
  clearTimeout(toast.timer); toast.timer = setTimeout(() => element.classList.remove("show"), 2400);
}
function activeDay(dateKey) { return !!history[dateKey]?.active; }
function getStreak() {
  let start = today;
  if (!activeDay(today)) { const yesterday = localDateKey(dateForOffset(-1)); if (!activeDay(yesterday)) return 0; start = yesterday; }
  let count = 0;
  const cursor = new Date(`${start}T12:00:00`);
  while (activeDay(localDateKey(cursor))) { count++; cursor.setDate(cursor.getDate()-1); }
  return count;
}
function getLongestStreak() {
  const days = Object.keys(history).filter(key => history[key]?.active).sort();
  let best = 0, current = 0, previous = null;
  for (const day of days) {
    const d = new Date(`${day}T12:00:00`);
    const gap = previous ? Math.round((d-previous)/86400000) : 1;
    current = gap === 1 ? current+1 : 1;
    best = Math.max(best,current); previous = d;
  }
  return best;
}
function renderStreak() {
  const streak = getStreak();
  $("#streak").textContent = streak;
  $("#streak-big").textContent = streak;
  $("#streak-message").textContent = streak ? "¡Sigue sumando días saludables!" : "Empieza hoy con un pequeño hábito.";
  const holder = $("#streak-dots");
  holder.innerHTML = Array.from({length:7},(_,i) => {
    const date = dateForOffset(i-6), key = localDateKey(date);
    return `<span class="${activeDay(key)?"active":""}" title="${date.toLocaleDateString("es-PE",{weekday:"long",day:"numeric"})}"></span>`;
  }).join("");
}
function renderRoutine() {
  const count = items.filter(item => done[item.id]).length;
  const percent = Math.round(count/items.length*100);
  $("#percent").textContent = `${percent}%`;
  $("#bar").style.width = `${percent}%`;
  $("#points").textContent = points;
  $("#done").textContent = `${count}/${items.length}`;
  $("#progress-title").textContent = percent===100 ? "¡Excelente trabajo!" : percent>=50 ? "¡Vas muy bien!" : count ? "¡Buen comienzo!" : "¡Empecemos!";
  $("#progress-text").textContent = `Has completado ${count} de ${items.length} actividades de tu rutina.`;
  $("#badge1").textContent = count ? "🏅" : "🔒";
  $("#badge2").textContent = water>=GOAL ? "🏅" : "🔒";
  $("#routine").innerHTML = items.map(item => `
    <article class="routine-item ${done[item.id]?"done":""}">
      <div class="routine-top"><span class="routine-emoji">${item.emoji}</span><button class="check-button" data-id="${item.id}" aria-label="${done[item.id]?"Desmarcar":"Completar"} ${item.name}">${done[item.id]?"✓":"＋"}</button></div>
      <h3>${item.name}</h3><time>${fmt(item.time)}</time><div class="routine-state">${done[item.id]?"✓ ¡Completado!":"○ Pendiente"}</div>
    </article>`).join("");
  const mealIds = {breakfast:0,lunch:1,dinner:2,snack:3};
  const tiles = [...$("#meal-grid").children];
  Object.entries(mealIds).forEach(([id,index]) => {
    const item = items.find(x=>x.id===id);
    if (item && tiles[index]) { tiles[index].querySelector("b").textContent = item.name.replace("saludable","").trim(); tiles[index].classList.toggle("meal-done",!!done[id]); }
  });
  nextReminder();
}
function renderWater() {
  $("#water").textContent = water;
  $("#water-total").textContent = (water*GLASS_ML).toLocaleString("es-PE");
  $("#fill").style.height = `${Math.min(water/GOAL,1)*100}%`;
}
function nextReminder() {
  const now = `${String(new Date().getHours()).padStart(2,"0")}:${String(new Date().getMinutes()).padStart(2,"0")}`;
  const next = items.filter(item => !done[item.id] && item.time>=now).sort((a,b)=>a.time.localeCompare(b.time))[0]
    || items.filter(item => !done[item.id]).sort((a,b)=>a.time.localeCompare(b.time))[0];
  $("#nextemoji").textContent = next?.emoji || "🎉";
  $("#nextname").textContent = next?.name || "¡Rutina completada!";
  $("#nexttime").textContent = next ? `A las ${fmt(next.time)}` : "Has cumplido tus actividades";
}
function lastSevenDays() { return Array.from({length:7},(_,i)=>{const date=dateForOffset(i-6);return {key:localDateKey(date),label:date.toLocaleDateString("es-PE",{weekday:"short"}).replace(".","").slice(0,3)};}); }
function renderChart(target, values, max, suffix="") {
  $(target).innerHTML = values.map(entry => {
    const h = entry.value ? Math.max(4,entry.value/max*100) : 2;
    return `<div class="chart-column" title="${entry.label}: ${entry.value}${suffix}"><span class="bar-value">${entry.value}${suffix}</span><div class="bar-track"><div class="bar-fill" style="height:${h}%"></div></div><small>${entry.day}</small></div>`;
  }).join("");
}
function renderStatistics() {
  const days = lastSevenDays();
  const hasUserData = days.some(day => history[day.key]?.active);
  const demoHabits = [3,4,2,5,4,6,3], demoWater = [3,4,2,5,3,6,4];
  const habitData = days.map((day,index) => ({day:day.label,label:day.key,value:hasUserData?(history[day.key]?.completed||0):(demoHabits[index])}));
  const waterData = days.map((day,index) => ({day:day.label,label:day.key,value:hasUserData?(history[day.key]?.water||0):(demoWater[index])}));
  renderChart("#habits-chart",habitData,items.length);
  renderChart("#water-chart",waterData,GOAL);
  $("#week-habits").textContent = habitData.reduce((sum,x)=>sum+x.value,0);
  $("#week-water").textContent = waterData.reduce((sum,x)=>sum+x.value,0);
  $("#data-tag").textContent = hasUserData ? "TUS DATOS" : "EJEMPLO VISUAL";
  $("#chart-note").textContent = hasUserData ? "Las gráficas muestran los registros guardados en este dispositivo durante los últimos siete días. Los días sin actividad aparecen en cero." : "Las barras de demostración son solo una vista previa; no representan promedios de estudiantes. Registra tus hábitos y las gráficas mostrarán tus propios datos.";
}
function render() { renderRoutine(); renderWater(); updateHistory(); renderStreak(); renderStatistics(); }

$("#routine").addEventListener("click",event=>{
  const button=event.target.closest("[data-id]"); if(!button)return;
  const item=items.find(x=>x.id===button.dataset.id); if(!item)return;
  done[item.id]=!done[item.id]; points=Math.max(0,points+(done[item.id]?10:-10)); save(); render(); toast(done[item.id]?`¡${item.name} completado! +10 puntos ⭐`:"Actividad desmarcada.");
});
$("#addwater").addEventListener("click",()=>{if(water>=GOAL)return toast("¡Ya completaste tus 6 registros de agua! 💧");water++;points+=2;save();render();toast("¡Registraste un vaso de agua! +2 puntos 💧");});
$("#undo").addEventListener("click",()=>{if(!water)return;water--;points=Math.max(0,points-2);save();render();toast("Registro de agua deshecho.");});
$("#edit").addEventListener("click",()=>{$("#fields").innerHTML=items.map(item=>`<label class="field">${item.emoji} ${item.name}<input type="time" name="${item.id}" value="${item.time}"></label>`).join("");$("#modal").showModal();});
$("#modal form").addEventListener("submit",event=>{if(event.submitter?.value==="cancel")return;event.preventDefault();const form=new FormData(event.currentTarget);items=items.map(item=>({...item,time:form.get(item.id)||item.time}));save();render();$("#modal").close();toast("¡Rutina actualizada!");});
$("#notify").addEventListener("click",async()=>{if(!("Notification" in window))return toast("Tu navegador no permite notificaciones.");const permission=await Notification.requestPermission();if(permission==="granted"){new Notification("HealthyDay 💛",{body:"¡Recordatorios activados! Cuida de ti."});toast("Avisos activados mientras la página esté abierta.");}else toast("No se concedió permiso.");});
function reminders(){const now=new Date(),time=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;items.forEach(item=>{const key=today+time+item.id;if(item.time===time&&!done[item.id]&&!sent.has(key)){sent.add(key);const message=`¡Es hora de ${item.name.toLowerCase()}! ${item.emoji}`;toast(message);if("Notification" in window&&Notification.permission==="granted")new Notification("HealthyDay 💛",{body:message});}});}

const now=new Date();
$("#date").textContent=now.toLocaleDateString("es-PE",{day:"numeric",month:"short"});
$("#date-square").innerHTML=`${now.getDate()}<br><small>${now.toLocaleDateString("es-PE",{month:"short"}).replace(".","")}</small>`;
if(storedDay!==today){localStorage.setItem("healthyday-current-date",today);localStorage.setItem("healthyday-done",JSON.stringify(done));localStorage.setItem("healthyday-water",JSON.stringify(water));localStorage.setItem("healthyday-points",JSON.stringify(points));}
render();setInterval(()=>{reminders();nextReminder();},15000);
