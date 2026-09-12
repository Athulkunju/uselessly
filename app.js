const KEY = "uuUltimateDataV1";

const defaultData = {
  xp: 0,
  tasks: [],
  habits: [],
  focusSessions: 0,
  focusMinutes: 0,
  bestFocus: 0,
  challengeXP: 0,
  completedChallenges: [],
  streak: 0,
  lastActive: null,
  notes: "",
  activity: [],
  unlocked: [],
  dailyGoal: 5,
  settings: {
    sound: true,
    animation: true
  }
};

let data = JSON.parse(localStorage.getItem(KEY)) || structuredClone(defaultData);

function save(){
  localStorage.setItem(KEY, JSON.stringify(data));
}

function uid(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function toast(message){
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");

  setTimeout(()=>{
    el.classList.remove("show");
  },2500);
}

function addActivity(text,xp=0){
  data.activity.unshift({
    text,
    xp,
    time:new Date().toLocaleString()
  });

  data.activity = data.activity.slice(0,30);
  save();
}

function addXP(amount){
  data.xp += amount;
  checkAchievements();
  save();
  renderAll();
}


/* =========================
   NAVIGATION
========================= */

document.querySelectorAll("nav button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const view = btn.dataset.view;

    document.querySelectorAll(".view").forEach(v=>{
      v.classList.remove("active");
    });

    document.getElementById(view).classList.add("active");

    document.querySelectorAll("nav button").forEach(b=>{
      b.classList.remove("active");
    });

    btn.classList.add("active");

    window.scrollTo({
      top:0,
      behavior:"smooth"
    });
  });
});


/* =========================
   CLOCK
========================= */

function updateClock(){

  const now = new Date();

  document.getElementById("clock").textContent =
    now.toLocaleTimeString();

  document.getElementById("date").textContent =
    now.toLocaleDateString(undefined,{
      weekday:"long",
      day:"numeric",
      month:"long",
      year:"numeric"
    });
}

setInterval(updateClock,1000);
updateClock();


/* =========================
   STREAK
========================= */

function updateStreak(){

  const today = new Date().toDateString();

  if(!data.lastActive){
    data.streak = 1;
    data.lastActive = today;
  }
  else if(data.lastActive !== today){

    const last = new Date(data.lastActive);
    const now = new Date();

    const diff =
      Math.floor((now-last)/86400000);

    if(diff === 1){
      data.streak++;
    }
    else if(diff > 1){
      data.streak = 1;
    }

    data.lastActive = today;
  }

  save();
}

updateStreak();


/* =========================
   QUOTES
========================= */

const quotes = [
  "Small progress is still progress.",
  "Start before you feel ready.",
  "Your future self will thank you.",
  "Consistency beats motivation.",
  "Do one useful thing right now.",
  "You don't need a perfect day.",
  "Focus on the next step.",
  "Make it simple. Make it happen.",
  "A little effort compounds.",
  "Done is better than endlessly planned."
];

function newQuote(){
  document.getElementById("quote").textContent =
    quotes[Math.floor(Math.random()*quotes.length)];
}

document.getElementById("newQuote").onclick = newQuote;

newQuote();


/* =========================
   DECISION MACHINE
========================= */

const decisions = [
  "Do it.",
  "Don't do it.",
  "Do it for 10 minutes.",
  "Take a short break first.",
  "Start now.",
  "Choose the simpler option.",
  "Write it down first.",
  "Ask someone you trust."
];

document.getElementById("decideBtn").onclick = ()=>{
  const result =
    decisions[Math.floor(Math.random()*decisions.length)];

  document.getElementById("decision").textContent = result;

  toast(result);
};


/* =========================
   RANDOM NUMBER
========================= */

document.getElementById("randomBtn").onclick = ()=>{

  let min = Number(document.getElementById("minNumber").value);
  let max = Number(document.getElementById("maxNumber").value);

  if(min > max){
    [min,max] = [max,min];
  }

  const number =
    Math.floor(Math.random()*(max-min+1))+min;

  document.getElementById("randomNumber").textContent = number;
};


/* =========================
   QUICK TASK
========================= */

document.getElementById("quickAdd").onclick = ()=>{

  const input = document.getElementById("quickTask");

  if(!input.value.trim()){
    toast("Enter a task first.");
    return;
  }

  data.tasks.push({
    id:uid(),
    text:input.value.trim(),
    priority:"medium",
    completed:false,
    created:Date.now()
  });

  input.value="";

  addActivity("Added a new task");
  save();
  renderAll();

  toast("Task added.");
};

document.getElementById("quickTask").addEventListener("keydown",e=>{
  if(e.key==="Enter"){
    document.getElementById("quickAdd").click();
  }
});


/* =========================
   TASKS
========================= */

function addTask(){

  const input = document.getElementById("taskInput");
  const priority = document.getElementById("priority").value;

  if(!input.value.trim()){
    toast("Enter a task.");
    return;
  }

  data.tasks.push({
    id:uid(),
    text:input.value.trim(),
    priority,
    completed:false,
    created:Date.now()
  });

  input.value="";

  addActivity("Created task");

  save();
  renderAll();

  toast("Task added.");
}

document.getElementById("addTask").onclick = addTask;

document.getElementById("taskInput").addEventListener("keydown",e=>{
  if(e.key==="Enter") addTask();
});


function toggleTask(id){

  const task = data.tasks.find(t=>t.id===id);

  if(!task)return;

  task.completed = !task.completed;

  if(task.completed){

    const reward =
      task.priority==="high" ? 20 :
      task.priority==="medium" ? 15 : 10;

    addXP(reward);
    addActivity(`Completed "${task.text}"`,reward);

    toast(`+${reward} XP`);
  }

  save();
  renderAll();
}


function deleteTask(id){

  data.tasks =
    data.tasks.filter(t=>t.id!==id);

  save();
  renderAll();

  toast("Task removed.");
}


function renderTasks(){

  const list = document.getElementById("taskList");

  const search =
    document.getElementById("taskSearch").value.toLowerCase();

  const filter =
    document.getElementById("taskFilter").value;

  let tasks = data.tasks.filter(task=>{
    if(!task.text.toLowerCase().includes(search))
      return false;

    if(filter==="active" && task.completed)
      return false;

    if(filter==="completed" && !task.completed)
      return false;

    if(filter==="high" && task.priority!=="high")
      return false;

    return true;
  });

  list.innerHTML="";

  if(tasks.length===0){
    list.innerHTML =
      `<div class="activity">No tasks found.</div>`;
  }

  tasks.forEach(task=>{

    const div = document.createElement("div");

    div.className =
      "task " + (task.completed ? "completed":"");

    div.innerHTML=`

      <div class="task-check">
        ${task.completed ? "✓":""}
      </div>

      <div class="task-text">${escapeHTML(task.text)}</div>

      <span class="priority ${task.priority}">
        ${task.priority}
      </span>

      <button class="delete">×</button>
    `;

    div.querySelector(".task-check").onclick =
      ()=>toggleTask(task.id);

    div.querySelector(".delete").onclick =
      ()=>deleteTask(task.id);

    list.appendChild(div);
  });

  const total = data.tasks.length;

  const completed =
    data.tasks.filter(t=>t.completed).length;

  const percent =
    total ? Math.round(completed/total*100):0;

  document.getElementById("taskProgressText")
    .textContent = `${completed} / ${total}`;

  document.getElementById("taskProgressPercent")
    .textContent = percent+"%";

  document.getElementById("taskProgress").style.width =
    percent+"%";
}

document.getElementById("taskSearch")
  .addEventListener("input",renderTasks);

document.getElementById("taskFilter")
  .addEventListener("change",renderTasks);


/* =========================
   HABITS
========================= */

document.getElementById("addHabit").onclick = ()=>{

  const input =
    document.getElementById("habitInput");

  if(!input.value.trim()){
    toast("Enter a habit.");
    return;
  }

  data.habits.push({
    id:uid(),
    name:input.value.trim(),
    history:[]
  });

  input.value="";

  save();
  renderAll();

  toast("Habit added.");
};


function todayKey(){
  return new Date().toISOString().slice(0,10);
}


function toggleHabit(id){

  const habit =
    data.habits.find(h=>h.id===id);

  if(!habit)return;

  const today = todayKey();

  const index =
    habit.history.indexOf(today);

  if(index>=0){
    habit.history.splice(index,1);
  }else{
    habit.history.push(today);
    addXP(5);
    addActivity(`Completed habit "${habit.name}"`,5);
    toast("+5 XP");
  }

  save();
  renderAll();
}


function habitStreak(habit){

  let streak=0;
  let date=new Date();

  while(true){

    const key =
      date.toISOString().slice(0,10);

    if(habit.history.includes(key)){
      streak++;
      date.setDate(date.getDate()-1);
    }else{
      break;
    }
  }

  return streak;
}


function renderHabits(){

  const list =
    document.getElementById("habitList");

  list.innerHTML="";

  if(data.habits.length===0){
    list.innerHTML =
      `<div class="activity">No habits yet.</div>`;
  }

  data.habits.forEach(habit=>{

    const div =
      document.createElement("div");

    div.className="habit";

    const days=[];

    for(let i=6;i>=0;i--){

      const d=new Date();

      d.setDate(d.getDate()-i);

      const key =
        d.toISOString().slice(0,10);

      days.push({
        key,
        label:d.toLocaleDateString(undefined,{
          weekday:"short"
        }).slice(0,2)
      });
    }

    div.innerHTML=`
      <div class="habit-top">
        <div class="habit-name">
          ${escapeHTML(habit.name)}
        </div>

        <div class="habit-streak">
          🔥 ${habitStreak(habit)}
        </div>
      </div>

      <div class="days">
        ${days.map(d=>`
          <button
            class="day ${habit.history.includes(d.key)?"done":""}"
            data-day="${d.key}">
            ${d.label}
          </button>
        `).join("")}
      </div>
    `;

    div.querySelectorAll(".day").forEach(btn=>{
      btn.onclick=()=>{

        const key=btn.dataset.day;

        if(key===todayKey()){
          toggleHabit(habit.id);
        }else{
          toast("Only today's habit can be changed.");
        }
      };
    });

    list.appendChild(div);
  });
}


/* =========================
   FOCUS TIMER
========================= */

let timerMinutes=25;
let remaining=25*60;
let timerRunning=false;
let targetTime=null;
let timerInterval=null;

function formatTime(seconds){

  seconds=Math.max(0,Math.floor(seconds));

  const m =
    String(Math.floor(seconds/60)).padStart(2,"0");

  const s =
    String(seconds%60).padStart(2,"0");

  return `${m}:${s}`;
}


function updateTimer(){

  if(timerRunning){

    remaining =
      Math.max(0,Math.ceil((targetTime-Date.now())/1000));

    if(remaining<=0){
      finishTimer();
      return;
    }
  }

  document.getElementById("timer")
    .textContent=formatTime(remaining);
}


function setTimer(minutes){

  timerMinutes=minutes;
  remaining=minutes*60;
  timerRunning=false;
  targetTime=null;

  clearInterval(timerInterval);

  document.getElementById("timerStatus")
    .textContent="READY";

  document.querySelectorAll(".preset")
    .forEach(btn=>btn.classList.remove("active"));

  const active =
    document.querySelector(`.preset[data-min="${minutes}"]`);

  if(active)active.classList.add("active");

  updateTimer();
}

document.querySelectorAll(".preset").forEach(btn=>{
  btn.onclick=()=>{
    setTimer(Number(btn.dataset.min));
  };
});


document.getElementById("startTimer").onclick=()=>{

  if(timerRunning)return;

  if(remaining<=0){
    remaining=timerMinutes*60;
  }

  targetTime =
    Date.now()+remaining*1000;

  timerRunning=true;

  document.getElementById("timerStatus")
    .textContent="FOCUSING";

  clearInterval(timerInterval);

  timerInterval =
    setInterval(updateTimer,250);

  updateTimer();

  toast("Focus started.");
};


document.getElementById("pauseTimer").onclick=()=>{

  if(!timerRunning)return;

  updateTimer();

  timerRunning=false;

  clearInterval(timerInterval);

  document.getElementById("timerStatus")
    .textContent="PAUSED";

  toast("Focus paused.");
};


document.getElementById("resetTimer").onclick=()=>{
  setTimer(timerMinutes);
};


function finishTimer(){

  timerRunning=false;
  clearInterval(timerInterval);

  remaining=0;

  data.focusSessions++;

  data.focusMinutes += timerMinutes;

  data.bestFocus =
    Math.max(data.bestFocus,timerMinutes);

  const reward =
    Math.max(10,timerMinutes*2);

  addXP(reward);

  addActivity(
    `Completed ${timerMinutes}-minute focus session`,
    reward
  );

  document.getElementById("timerStatus")
    .textContent="COMPLETE";

  updateTimer();

  toast(`Focus complete! +${reward} XP`);

  if(Notification.permission==="granted"){
    new Notification("Focus complete!",{
      body:`You completed ${timerMinutes} minutes of focus.`
    });
  }

  save();
  renderAll();
}


/* =========================
   CHALLENGES
========================= */

const challenges=[
  {
    id:"task3",
    icon:"⚡",
    title:"Task Starter",
    desc:"Complete 3 tasks.",
    xp:50,
    check:()=>data.tasks.filter(t=>t.completed).length>=3
  },
  {
    id:"task5",
    icon:"🔥",
    title:"Task Machine",
    desc:"Complete 5 tasks.",
    xp:100,
    check:()=>data.tasks.filter(t=>t.completed).length>=5
  },
  {
    id:"focus25",
    icon:"🧠",
    title:"Deep Focus",
    desc:"Complete a 25+ minute focus session.",
    xp:75,
    check:()=>data.bestFocus>=25
  },
  {
    id:"focus3",
    icon:"🎯",
    title:"Focus Warrior",
    desc:"Complete 3 focus sessions.",
    xp:120,
    check:()=>data.focusSessions>=3
  },
  {
    id:"xp250",
    icon:"💎",
    title:"XP Hunter",
    desc:"Reach 250 XP.",
    xp:100,
    check:()=>data.xp>=250
  },
  {
    id:"xp500",
    icon:"👑",
    title:"Getting Serious",
    desc:"Reach 500 XP.",
    xp:200,
    check:()=>data.xp>=500
  }
];


function renderChallenges(){

  const grid =
    document.getElementById("challengeGrid");

  grid.innerHTML="";

  challenges.forEach(c=>{

    const completed =
      data.completedChallenges.includes(c.id);

    const available =
      c.check();

    const div =
      document.createElement("div");

    div.className="challenge";

    div.innerHTML=`
      <div class="challenge-icon">${c.icon}</div>
      <h3>${c.title}</h3>
      <p>${c.desc}</p>

      ${
        completed
        ? `<small>✓ COMPLETED</small>`
        : available
        ? `<button class="primary claim">Claim +${c.xp} XP</button>`
        : `<small>Locked</small>`
      }
    `;

    if(!completed && available){

      div.querySelector(".claim").onclick=()=>{

        data.completedChallenges.push(c.id);

        data.challengeXP += c.xp;

        addXP(c.xp);

        addActivity(
          `Challenge completed: ${c.title}`,
          c.xp
        );

        save();
        renderAll();

        toast(`Challenge complete! +${c.xp} XP`);
      };
    }

    grid.appendChild(div);
  });
}


/* =========================
   ACHIEVEMENTS
========================= */

const achievements=[
  {
    id:"first",
    icon:"🌱",
    title:"First Step",
    desc:"Earn your first XP.",
    check:()=>data.xp>=1
  },
  {
    id:"runner",
    icon:"🏃",
    title:"Task Runner",
    desc:"Complete 10 tasks.",
    check:()=>data.tasks.filter(t=>t.completed).length>=10
  },
  {
    id:"focused",
    icon:"🧠",
    title:"Focused",
    desc:"Complete your first focus session.",
    check:()=>data.focusSessions>=1
  },
  {
    id:"focusmaster",
    icon:"🎯",
    title:"Focus Master",
    desc:"Reach 5 focus sessions.",
    check:()=>data.focusSessions>=5
  },
  {
    id:"collector",
    icon:"💎",
    title:"XP Collector",
    desc:"Reach 100 XP.",
    check:()=>data.xp>=100
  },
  {
    id:"king",
    icon:"👑",
    title:"XP King",
    desc:"Reach 1000 XP.",
    check:()=>data.xp>=1000
  },
  {
    id:"level5",
    icon:"🚀",
    title:"Level 5",
    desc:"Reach level 5.",
    check:()=>getLevel()>=5
  },
  {
    id:"challenger",
    icon:"🏆",
    title:"Challenger",
    desc:"Complete 3 challenges.",
    check:()=>data.completedChallenges.length>=3
  }
];


function getLevel(){

  return Math.floor(data.xp/100)+1;
}


function checkAchievements(){

  achievements.forEach(a=>{

    if(a.check() && !data.unlocked.includes(a.id)){

      data.unlocked.push(a.id);

      toast(`Achievement unlocked: ${a.title}`);

      addActivity(`Achievement unlocked: ${a.title}`);
    }
  });
}


function renderAchievements(){

  const grid =
    document.getElementById("achievementGrid");

  grid.innerHTML="";

  achievements.forEach(a=>{

    const unlocked =
      data.unlocked.includes(a.id);

    const div =
      document.createElement("div");

    div.className =
      "achievement " +
      (unlocked ? "":"locked");

    div.innerHTML=`
      <div class="badge">${a.icon}</div>
      <h3>${a.title}</h3>
      <p>${a.desc}</p>
      <small>${unlocked ? "UNLOCKED":"LOCKED"}</small>
    `;

    grid.appendChild(div);
  });
}


/* =========================
   STATISTICS
========================= */

function renderStats(){

  const completedTasks =
    data.tasks.filter(t=>t.completed).length;

  document.getElementById("sXP")
    .textContent=data.xp;

  document.getElementById("sTasks")
    .textContent=completedTasks;

  document.getElementById("sFocus")
    .textContent=data.focusMinutes+"m";

  document.getElementById("sHabits")
    .textContent=data.habits.length;

  document.getElementById("sChallenges")
    .textContent=data.completedChallenges.length;

  document.getElementById("sStreak")
    .textContent=data.streak;

  const list =
    document.getElementById("activityList");

  list.innerHTML="";

  if(data.activity.length===0){
    list.innerHTML=
      `<div class="activity">No activity yet.</div>`;
  }

  data.activity.slice(0,12).forEach(a=>{

    const div =
      document.createElement("div");

    div.className="activity";

    div.innerHTML=`
      <strong>${escapeHTML(a.text)}</strong>
      <br>
      <small>${a.time}
      ${a.xp ? " • +"+a.xp+" XP":""}</small>
    `;

    list.appendChild(div);
  });
}


/* =========================
   DASHBOARD
========================= */

function renderDashboard(){

  const level=getLevel();

  document.getElementById("level")
    .textContent=level;

  document.getElementById("xp")
    .textContent=data.xp;

  document.getElementById("streak")
    .textContent=data.streak;

  const completed =
    data.tasks.filter(t=>t.completed).length;

  document.getElementById("taskMetric")
    .textContent=completed;

  const levelStart=(level-1)*100;
  const levelProgress=data.xp-levelStart;

  document.getElementById("levelXP")
    .textContent=`${levelProgress}/100 XP`;

  const habitsToday =
    data.habits.filter(h=>
      h.history.includes(todayKey())
    ).length;

  const progress =
    Math.min(
      100,
      Math.round(
        ((completed+habitsToday)/
        Math.max(1,data.dailyGoal))*100
      )
    );

  document.getElementById("dailyPercent")
    .textContent=progress+"%";

  document.getElementById("dailyProgress")
    .style.width=progress+"%";

  document.getElementById("dailyText")
    .textContent=
      `${completed} tasks + ${habitsToday} habits completed today.`;
}


/* =========================
   FOCUS STATS
========================= */

function renderFocusStats(){

  document.getElementById("focusSessions")
    .textContent=data.focusSessions;

  document.getElementById("focusMinutes")
    .textContent=data.focusMinutes;

  document.getElementById("bestFocus")
    .textContent=data.bestFocus+" min";

  document.getElementById("focusXP")
    .textContent=
      Math.floor(data.focusMinutes*2)+" XP";
}


/* =========================
   NOTES
========================= */

const notes=document.getElementById("notes");

notes.value=data.notes;

document.getElementById("saveNotes").onclick=()=>{

  data.notes=notes.value;

  save();

  addActivity("Saved notes");

  toast("Notes saved.");
};


/* =========================
   THEME
========================= */

document.getElementById("themeBtn").onclick=()=>{

  document.body.classList.toggle("light");

  const light =
    document.body.classList.contains("light");

  localStorage.setItem("uuTheme",light?"light":"dark");
};

if(localStorage.getItem("uuTheme")==="light"){
  document.body.classList.add("light");
}


/* =========================
   SETTINGS
========================= */

const modal =
  document.getElementById("settingsModal");

document.getElementById("settingsBtn").onclick=()=>{

  document.getElementById("dailyGoal").value =
    data.dailyGoal;

  document.getElementById("animationToggle").checked =
    data.settings.animation;

  document.getElementById("soundToggle").checked =
    data.settings.sound;

  modal.classList.add("show");
};


document.getElementById("closeSettings").onclick=()=>{
  modal.classList.remove("show");
};


document.getElementById("dailyGoal").onchange=e=>{

  data.dailyGoal =
    Math.max(1,Number(e.target.value));

  save();
  renderDashboard();
};


document.getElementById("animationToggle").onchange=e=>{

  data.settings.animation=e.target.checked;

  document.body.classList.toggle(
    "anim-off",
    !data.settings.animation
  );

  save();
};


document.getElementById("soundToggle").onchange=e=>{

  data.settings.sound=e.target.checked;

  save();
};


/* =========================
   NOTIFICATIONS
========================= */

document.getElementById("notifyBtn").onclick=async()=>{

  if(!("Notification" in window)){
    toast("Notifications aren't supported here.");
    return;
  }

  const permission =
    await Notification.requestPermission();

  if(permission==="granted"){
    new Notification("Uselessly Useful",{
      body:"Notifications are enabled."
    });

    toast("Notifications enabled.");
  }else{
    toast("Notification permission denied.");
  }
};


/* =========================
   EXPORT
========================= */

document.getElementById("exportBtn").onclick=()=>{

  const blob =
    new Blob(
      [JSON.stringify(data,null,2)],
      {type:"application/json"}
    );

  const url =
    URL.createObjectURL(blob);

  const a=document.createElement("a");

  a.href=url;
  a.download="uselessly-useful-backup.json";

  a.click();

  URL.revokeObjectURL(url);

  toast("Backup exported.");
};


/* =========================
   IMPORT
========================= */

document.getElementById("importFile").onchange=e=>{

  const file=e.target.files[0];

  if(!file)return;

  const reader=new FileReader();

  reader.onload=event=>{

    try{

      const imported =
        JSON.parse(event.target.result);

      data={
        ...structuredClone(defaultData),
        ...imported
      };

      save();
      renderAll();

      toast("Data imported.");

    }catch{

      toast("Invalid backup file.");
    }
  };

  reader.readAsText(file);
};


/* =========================
   RESET
========================= */

document.getElementById("resetBtn").onclick=()=>{

  const ok =
    confirm(
      "Delete all tasks, XP, habits and statistics?"
    );

  if(!ok)return;

  data=structuredClone(defaultData);

  save();

  notes.value="";

  renderAll();

  toast("Everything has been reset.");
};


/* =========================
   PARTICLES
========================= */

const canvas =
  document.getElementById("particles");

const ctx=canvas.getContext("2d");

let particles=[];

function resizeCanvas(){

  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize",resizeCanvas);

for(let i=0;i<80;i++){

  particles.push({
    x:Math.random()*window.innerWidth,
    y:Math.random()*window.innerHeight,
    r:Math.random()*1.8+.4,
    vx:(Math.random()-.5)*.25,
    vy:(Math.random()-.5)*.25
  });
}


function animateParticles(){

  if(data.settings.animation){

    ctx.clearRect(
      0,0,
      canvas.width,
      canvas.height
    );

    particles.forEach(p=>{

      p.x+=p.vx;
      p.y+=p.vy;

      if(p.x<0)p.x=canvas.width;
      if(p.x>canvas.width)p.x=0;
      if(p.y<0)p.y=canvas.height;
      if(p.y>canvas.height)p.y=0;

      ctx.beginPath();

      ctx.arc(
        p.x,p.y,p.r,
        0,
        Math.PI*2
      );

      ctx.fillStyle="rgba(255,255,255,.28)";
      ctx.fill();
    });
  }

  requestAnimationFrame(animateParticles);
}

animateParticles();


/* =========================
   ESCAPE HTML
========================= */

function escapeHTML(value){

  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}


/* =========================
   RENDER EVERYTHING
========================= */

function renderAll(){

  updateStreak();
  checkAchievements();

  renderDashboard();
  renderTasks();
  renderHabits();
  renderChallenges();
  renderAchievements();
  renderStats();
  renderFocusStats();

  document.body.classList.toggle(
    "anim-off",
    !data.settings.animation
  );
}

renderAll();


/* =========================
   SERVICE WORKER
========================= */

if("serviceWorker" in navigator){

  window.addEventListener("load",()=>{
    navigator.serviceWorker
      .register("sw.js")
      .catch(err=>{
        console.log("Service worker:",err);
      });
  });

}