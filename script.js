const STORAGE_KEY = "habitnja_data_v1";
const THEME_KEY = "habitnja_theme_v1";


const fallbackData = {

  version: 1,

  habits: [

    {
      id:"water",
      name:"Minum Air",
      icon:"💧",
      color:"#3b82f6",
      category:"Health",
      note:"Jaga tubuh tetap terhidrasi.",
      schedule:[0,1,2,3,4,5,6],
      history:{}
    },

    {
      id:"reading",
      name:"Baca 10 Menit",
      icon:"📖",
      color:"#8b5cf6",
      category:"Study",
      note:"Sedikit membaca setiap hari.",
      schedule:[0,1,2,3,4,5,6],
      history:{}
    },

    {
      id:"journal",
      name:"Journaling",
      icon:"📝",
      color:"#ec4899",
      category:"Mind",
      note:"Tulis satu hal yang kamu syukuri.",
      schedule:[1,2,3,4,5],
      history:{}
    },

    {
      id:"exercise",
      name:"Stretching",
      icon:"🧘",
      color:"#10b981",
      category:"Health",
      note:"Gerak sebentar supaya badan rileks.",
      schedule:[1,3,5],
      history:{}
    }

  ]

};


const state = {

  habits:[],

  view:"dashboard",

  selectedDate:new Date(),

  calendarDate:new Date(),

  search:"",

  category:"all",

  theme:localStorage.getItem(THEME_KEY) || "light"

};


const $ = id => document.getElementById(id);



/* ================= DATE ================= */

function uid(){

  return "h_" +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2,7);

}


function dateKey(date){

  const d = new Date(date);

  return `${d.getFullYear()}-${String(
    d.getMonth()+1
  ).padStart(2,"0")}-${String(
    d.getDate()
  ).padStart(2,"0")}`;

}


function parseKey(key){

  const [y,m,d] = key.split("-").map(Number);

  return new Date(y,m-1,d);

}


function sameDay(a,b){

  return dateKey(a) === dateKey(b);

}



function normalizeHabit(h){

  return {

    id:h.id || uid(),

    name:h.name || "New Habit",

    icon:h.icon || "✦",

    color:h.color || "#8b5cf6",

    category:h.category || "Other",

    note:h.note || "",

    schedule:
      Array.isArray(h.schedule) && h.schedule.length
        ? h.schedule.map(Number)
        : [0,1,2,3,4,5,6],

    history:
      h.history &&
      typeof h.history === "object"
        ? h.history
        : {},

    createdAt:
      h.createdAt ||
      new Date().toISOString()

  };

}



/* ================= STORAGE ================= */

function save(){

  localStorage.setItem(

    STORAGE_KEY,

    JSON.stringify({
      version:1,
      habits:state.habits
    })

  );

}



async function load(){

  const saved =
    localStorage.getItem(STORAGE_KEY);


  if(saved){

    try{

      const parsed =
        JSON.parse(saved);

      state.habits =
        (parsed.habits || [])
        .map(normalizeHabit);

    }

    catch{

      state.habits =
        fallbackData.habits
        .map(normalizeHabit);

    }

  }

  else{

    try{

      const response =
        await fetch("data.json");

      if(!response.ok)
        throw new Error();

      const data =
        await response.json();

      state.habits =
        (data.habits || fallbackData.habits)
        .map(normalizeHabit);

    }

    catch{

      state.habits =
        fallbackData.habits
        .map(normalizeHabit);

    }

    save();

  }


  document.body.classList.toggle(
    "dark",
    state.theme === "dark"
  );


  updateThemeButtons();

  render();

}



/* ================= HABIT LOGIC ================= */

function isScheduled(habit,date){

  return habit.schedule.includes(
    new Date(date).getDay()
  );

}


function isComplete(habit,date){

  return habit.history[
    dateKey(date)
  ] === true;

}


function toggleComplete(id,date){

  const habit =
    state.habits.find(
      h => h.id === id
    );


  if(
    !habit ||
    !isScheduled(habit,date)
  ){
    return;
  }


  const key =
    dateKey(date);


  habit.history[key] =
    !habit.history[key];


  save();

  render();


  if(habit.history[key]){

    showToast(
      "✓",
      "Habit selesai! Keep going ✨"
    );

  }

  else{

    showToast(
      "↩",
      "Progress dikembalikan."
    );

  }

}



/* ================= STREAK ================= */

function getStreak(habit){

  let d = new Date();


  if(!isComplete(habit,d)){

    d.setDate(
      d.getDate()-1
    );

  }


  let count = 0;


  for(let i=0;i<370;i++){

    if(!isScheduled(habit,d)){

      d.setDate(
        d.getDate()-1
      );

      continue;

    }


    if(isComplete(habit,d)){

      count++;

      d.setDate(
        d.getDate()-1
      );

    }

    else{

      break;

    }

  }


  return count;

}



function getBestStreak(habit){

  const dates =
    Object.keys(habit.history)

      .filter(
        key => habit.history[key]
      )

      .sort();


  let best = 0;

  let current = 0;

  let previous = null;


  for(const key of dates){

    const d =
      parseKey(key);


    if(!isScheduled(habit,d))
      continue;


    if(previous){

      const expected =
        new Date(previous);

      expected.setDate(
        expected.getDate()+1
      );


      while(
        !isScheduled(
          habit,
          expected
        ) &&
        expected < d
      ){

        expected.setDate(
          expected.getDate()+1
        );

      }


      if(
        dateKey(expected) === key
      ){

        current++;

      }

      else{

        current=1;

      }

    }

    else{

      current=1;

    }


    best =
      Math.max(
        best,
        current
      );


    previous=d;

  }


  return best;

}



/* ================= STATS ================= */

function totalCompleted(){

  return state.habits.reduce(

    (sum,habit) =>

      sum +
      Object.values(
        habit.history
      ).filter(Boolean).length,

    0

  );

}



function scheduledCount(date){

  return state.habits.filter(

    habit =>
      isScheduled(habit,date)

  ).length;

}



function completedCount(date){

  return state.habits.filter(

    habit =>

      isScheduled(
        habit,
        date
      ) &&

      isComplete(
        habit,
        date
      )

  ).length;

}



function progressForDate(date){

  const total =
    scheduledCount(date);

  const completed =
    completedCount(date);


  if(!total)
    return 0;


  return Math.round(
    completed / total * 100
  );

}



function overallBestStreak(){

  return state.habits.reduce(

    (max,habit) =>

      Math.max(
        max,
        getBestStreak(habit)
      ),

    0

  );

}



/* ================= FORMAT ================= */

function formatLongDate(date){

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      weekday:"long",
      day:"numeric",
      month:"long",
      year:"numeric"
    }
  ).format(date);

}



function formatMonth(date){

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      month:"long",
      year:"numeric"
    }
  ).format(date);

}



function greeting(){

  const hour =
    new Date().getHours();


  if(hour < 11)
    return "Good morning ✨";


  if(hour < 16)
    return "Good afternoon ☁";


  if(hour < 19)
    return "Good evening 🌷";


  return "Good night 🌙";

}



/* ================= RENDER ================= */

function render(){

  renderHeader();

  renderCategories();

  renderDashboard();

  renderCalendar();

  renderStats();

  renderAchievements();

}



function renderHeader(){

  $("todayLabel").textContent =
    formatLongDate(
      state.selectedDate
    );


  const titles = {

    dashboard:greeting(),

    calendar:"Your calendar ✦",

    stats:"Look how far you've come ♡",

    achievements:"You earned these ✨",

    settings:"Make it yours ⚙"

  };


  $("pageTitle").textContent =
    titles[state.view] ||
    greeting();

}



/* ================= CATEGORIES ================= */

function renderCategories(){

  const select =
    $("categoryFilter");


  const categories =
    [
      ...new Set(
        state.habits
          .map(h => h.category)
          .filter(Boolean)
      )
    ].sort();


  select.innerHTML =
    `<option value="all">All</option>` +

    categories.map(

      category =>
        `<option value="${escapeHtml(category)}">
          ${escapeHtml(category)}
        </option>`

    ).join("");


  select.value =
    categories.includes(
      state.category
    )
      ? state.category
      : "all";

}



/* ================= DASHBOARD ================= */

function renderDashboard(){

  const date =
    state.selectedDate;


  const percent =
    progressForDate(date);


  $("progressRing")
    .style
    .setProperty(
      "--progress",
      `${percent}%`
    );


  $("progressPercent")
    .textContent =
    `${percent}%`;


  if(percent === 100){

    $("progressTitle")
      .textContent =
      "Perfect! ✨";

    $("progressText")
      .textContent =
      "Semua habit terjadwal hari ini selesai!";

  }

  else if(percent > 0){

    $("progressTitle")
      .textContent =
      "Nice progress!";

    $("progressText")
      .textContent =
      `${completedCount(date)} dari ${scheduledCount(date)} habit selesai.`;

  }

  else{

    $("progressTitle")
      .textContent =
      "Let's start!";

    $("progressText")
      .textContent =
      "Complete your first habit today.";

  }


  $("bestStreak")
    .textContent =
    `${overallBestStreak()} days`;


  $("totalCompleted")
    .textContent =
    totalCompleted();


  $("activeHabits")
    .textContent =
    state.habits.length;



  const search =
    state.search.toLowerCase();


  const habits =
    state.habits.filter(

      habit => {

        const matchSearch =
          habit.name
            .toLowerCase()
            .includes(search);


        const matchCategory =
          state.category === "all" ||
          habit.category === state.category;


        return (
          matchSearch &&
          matchCategory
        );

      }

    );



  if(!habits.length){

    $("habitsList").innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          ☁️
        </div>

        <h3>
          No habits found
        </h3>

        <p>
          Try another search or create a new habit.
        </p>

        <button
          class="primary-button"
          onclick="openAddModal()"
        >
          ＋ Add Habit
        </button>

      </div>

    `;

  }

  else{

    $("habitsList").innerHTML =
      habits
        .map(habitCard)
        .join("");

  }


  renderWeek();

  setQuote();

}



/* ================= HABIT CARD ================= */

function habitCard(habit){

  const scheduled =
    isScheduled(
      habit,
      state.selectedDate
    );


  const completed =
    isComplete(
      habit,
      state.selectedDate
    );


  const streak =
    getStreak(habit);


  return `

    <article
      class="
        habit-card
        ${completed ? "completed" : ""}
        ${!scheduled ? "unscheduled" : ""}
      "
    >

      <div
        class="habit-icon"
        style="
          --habit-light:
          ${hexToRgba(habit.color,.12)}
        "
      >
        ${escapeHtml(habit.icon)}
      </div>


      <div class="habit-main">

        <div class="habit-name">
          ${escapeHtml(habit.name)}
        </div>


        <div class="habit-meta">

          <span>
            ${escapeHtml(habit.category)}
          </span>


          ${
            habit.note
              ? `
                <span>•</span>

                <span class="habit-note">
                  ${escapeHtml(habit.note)}
                </span>
              `
              : ""
          }


          ${
            streak
              ? `
                <span>•</span>

                <span class="habit-streak">
                  🔥 ${streak}
                </span>
              `
              : ""
          }

        </div>

      </div>


      <div class="habit-actions">

        <button
          class="edit-habit"
          onclick="openEditModal('${habit.id}')"
          title="Edit"
        >
          ✎
        </button>


        <button
          class="
            check-button
            ${completed ? "completed" : ""}
          "
          style="
            --habit-color:
            ${habit.color}
          "
          onclick="
            toggleComplete(
              '${habit.id}',
              state.selectedDate
            )
          "
          ${!scheduled ? "disabled" : ""}
        >
          ${completed ? "✓" : ""}
        </button>

      </div>

    </article>

  `;

}



/* ================= WEEK ================= */

function renderWeek(){

  const start =
    new Date(
      state.selectedDate
    );


  start.setDate(
    start.getDate() -
    start.getDay()
  );


  const names =
    [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat"
    ];


  $("weekCard").innerHTML =

    Array.from(
      {length:7},
      (_,i) => {

        const date =
          new Date(start);


        date.setDate(
          start.getDate()+i
        );


        const progress =
          progressForDate(date);


        return `

          <div
            class="
              week-day
              ${sameDay(
                date,
                new Date()
              ) ? "today" : ""}
            "
            onclick="
              selectDate(
                '${dateKey(date)}'
              )
            "
          >

            <div class="week-day-name">
              ${names[i]}
            </div>

            <div class="week-day-number">
              ${date.getDate()}
            </div>

            <div class="week-progress">

              <span
                style="
                  width:${progress}%
                "
              ></span>

            </div>

          </div>

        `;

      }

    ).join("");

}



function selectDate(key){

  state.selectedDate =
    parseKey(key);


  state.view =
    "dashboard";


  setView("dashboard");

  render();

}



/* ================= CALENDAR ================= */

function renderCalendar(){

  $("calendarMonth")
    .textContent =
    formatMonth(
      state.calendarDate
    );


  const year =
    state.calendarDate
      .getFullYear();


  const month =
    state.calendarDate
      .getMonth();


  const first =
    new Date(
      year,
      month,
      1
    );


  const last =
    new Date(
      year,
      month+1,
      0
    );


  let html = "";


  for(
    let i=0;
    i<first.getDay();
    i++
  ){

    html +=
      `<div class="calendar-day empty"></div>`;

  }


  for(
    let day=1;
    day<=last.getDate();
    day++
  ){

    const date =
      new Date(
        year,
        month,
        day
      );


    const progress =
      progressForDate(date);


    html += `

      <div
        class="
          calendar-day
          ${sameDay(
            date,
            new Date()
          ) ? "today" : ""}
        "
        onclick="
          selectDate(
            '${dateKey(date)}'
          )
        "
      >

        <div class="calendar-number">
          ${day}
        </div>


        <div class="calendar-score">

          <span
            style="
              width:${progress}%
            "
          ></span>

        </div>

      </div>

    `;

  }


  $("calendarGrid")
    .innerHTML =
    html;

}



/* ================= STATS ================= */

function renderStats(){

  const total =
    totalCompleted();


  const best =
    overallBestStreak();


  let scheduled = 0;

  let completed = 0;


  for(
    let i=0;
    i<90;
    i++
  ){

    const date =
      new Date();


    date.setDate(
      date.getDate()-i
    );


    scheduled +=
      scheduledCount(date);


    completed +=
      completedCount(date);

  }


  const rate =
    scheduled
      ? Math.round(
          completed /
          scheduled *
          100
        )
      : 0;


  $("statsTotal")
    .textContent =
    total;


  $("statsBest")
    .textContent =
    best;


  $("statsRate")
    .textContent =
    `${rate}%`;



  const days = [];


  for(
    let i=6;
    i>=0;
    i--
  ){

    const date =
      new Date();


    date.setDate(
      date.getDate()-i
    );


    days.push(date);

  }


  const max =
    Math.max(
      ...days.map(
        date =>
          completedCount(date)
      ),
      1
    );


  $("barChart")
    .innerHTML =

    days.map(

      date => {

        const count =
          completedCount(date);


        const height =
          Math.max(
            4,
            Math.round(
              count /
              max *
              160
            )
          );


        const day =
          new Intl.DateTimeFormat(
            "id-ID",
            {weekday:"short"}
          ).format(date);


        return `

          <div class="bar-item">

            <strong>
              ${count}
            </strong>

            <div
              class="bar"
              style="
                height:${height}px
              "
            ></div>

            <span>
              ${day}
            </span>

          </div>

        `;

      }

    ).join("");



  $("habitStatsList")
    .innerHTML =

    state.habits.length

      ? state.habits.map(

          habit => `

            <div class="habit-stat">

              <div
                class="habit-icon"
                style="
                  --habit-light:
                  ${hexToRgba(
                    habit.color,
                    .12
                  )}
                "
              >
                ${escapeHtml(
                  habit.icon
                )}
              </div>


              <div class="habit-stat-main">

                <strong>
                  ${escapeHtml(
                    habit.name
                  )}
                </strong>

                <span>
                  Best streak:
                  ${getBestStreak(habit)}
                  days
                </span>

              </div>


              <div class="habit-stat-number">

                ${
                  Object.values(
                    habit.history
                  ).filter(Boolean).length
                }

              </div>

            </div>

          `

        ).join("")

      :

        `

          <div class="empty-state">

            <h3>
              No habits yet
            </h3>

            <p>
              Create your first habit.
            </p>

          </div>

        `;

}



/* ================= ACHIEVEMENTS ================= */

function renderAchievements(){

  const total =
    totalCompleted();


  const best =
    overallBestStreak();


  const active =
    state.habits.length;


  const achievements = [

    {
      icon:"🌱",
      title:"First Step",
      desc:"Complete your first habit.",
      ok:total>=1
    },

    {
      icon:"✨",
      title:"Getting Started",
      desc:"Complete 5 habits.",
      ok:total>=5
    },

    {
      icon:"🔥",
      title:"7 Day Streak",
      desc:"Reach a 7 day streak.",
      ok:best>=7
    },

    {
      icon:"💜",
      title:"Habit Lover",
      desc:"Create 5 active habits.",
      ok:active>=5
    },

    {
      icon:"🌷",
      title:"Consistency",
      desc:"Complete 25 habits.",
      ok:total>=25
    },

    {
      icon:"👑",
      title:"Habit Master",
      desc:"Complete 100 habits.",
      ok:total>=100
    }

  ];


  $("achievementGrid")
    .innerHTML =

    achievements.map(

      achievement => `

        <div
          class="
            achievement
            ${achievement.ok
              ? "unlocked"
              : ""}
          "
        >

          <div class="achievement-icon">
            ${achievement.icon}
          </div>


          <h3>
            ${achievement.title}
          </h3>


          <p>
            ${achievement.desc}
          </p>


          <span class="achievement-status">

            ${
              achievement.ok
                ? "UNLOCKED ✦"
                : "LOCKED"
            }

          </span>

        </div>

      `

    ).join("");

}



/* ================= QUOTE ================= */

function setQuote(){

  const quotes = [

    "You don't have to be perfect. You just have to keep going.",

    "Tiny habits create big changes.",

    "Your future self will thank you.",

    "One small step today is still progress.",

    "Consistency is more important than perfection.",

    "Be proud of yourself for showing up."

  ];


  const index =
    Math.floor(
      Date.now()/86400000
    ) % quotes.length;


  $("quoteText")
    .textContent =
    quotes[index];

}



/* ================= MODAL ================= */

function openAddModal(){

  $("habitForm").reset();


  $("habitId").value = "";


  $("modalTitle")
    .textContent =
    "Add new habit";


  document
    .querySelectorAll(
      ".day-check"
    )
    .forEach(
      checkbox =>
        checkbox.checked=true
    );


  document
    .querySelector(
      'input[name="habitColor"][value="#8b5cf6"]'
    )
    .checked=true;


  $("habitModal")
    .classList.add("show");


  setTimeout(
    () =>
      $("habitName").focus(),
    100
  );

}



function openEditModal(id){

  const habit =
    state.habits.find(
      h => h.id === id
    );


  if(!habit)
    return;


  $("habitId")
    .value =
    habit.id;


  $("habitName")
    .value =
    habit.name;


  $("habitIcon")
    .value =
    habit.icon;


  $("habitCategory")
    .value =
    habit.category;


  $("habitNote")
    .value =
    habit.note;


  document
    .querySelectorAll(
      ".day-check"
    )
    .forEach(
      checkbox => {

        checkbox.checked =
          habit.schedule.includes(
            Number(
              checkbox.value
            )
          );

      }
    );


  const radio =
    document.querySelector(
      `input[name="habitColor"][value="${habit.color}"]`
    );


  if(radio)
    radio.checked=true;


  $("modalTitle")
    .textContent =
    "Edit habit";


  $("habitModal")
    .classList.add("show");

}



function closeModal(){

  $("habitModal")
    .classList.remove("show");

}



/* ================= FORM ================= */

$("habitForm")
  .addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const name =
        $("habitName")
          .value
          .trim();


      const schedule =
        [
          ...document
            .querySelectorAll(
              ".day-check:checked"
            )
        ]
        .map(
          checkbox =>
            Number(
              checkbox.value
            )
        );


      if(!name){

        showToast(
          "!",
          "Nama habit belum diisi."
        );

        return;

      }


      if(!schedule.length){

        showToast(
          "!",
          "Pilih minimal satu hari."
        );

        return;

      }


      const id =
        $("habitId").value;


      const color =
        document
          .querySelector(
            'input[name="habitColor"]:checked'
          )
          .value;



      if(id){

        const habit =
          state.habits.find(
            h => h.id === id
          );


        if(habit){

          habit.name =
            name;

          habit.icon =
            $("habitIcon")
              .value
              .trim() ||
            "✦";

          habit.category =
            $("habitCategory")
              .value
              .trim() ||
            "Other";

          habit.note =
            $("habitNote")
              .value
              .trim();

          habit.schedule =
            schedule;

          habit.color =
            color;

        }


        showToast(
          "✓",
          "Habit berhasil diperbarui."
        );

      }


      else{

        state.habits.push(

          normalizeHabit({

            id:uid(),

            name:name,

            icon:
              $("habitIcon")
                .value
                .trim() ||
              "✦",

            category:
              $("habitCategory")
                .value
                .trim() ||
              "Other",

            note:
              $("habitNote")
                .value
                .trim(),

            schedule:

              schedule,

            color:color,

            history:{},

            createdAt:
              new Date()
                .toISOString()

          })

        );


        showToast(
          "✦",
          "Habit baru berhasil dibuat!"
        );

      }


      save();

      closeModal();

      render();

    }
  );



/* ================= EVENTS ================= */

$("addHabitButton")
  .addEventListener(
    "click",
    openAddModal
  );


$("closeModal")
  .addEventListener(
    "click",
    closeModal
  );


$("cancelModal")
  .addEventListener(
    "click",
    closeModal
  );


$("habitModal")
  .addEventListener(
    "click",
    event => {

      if(
        event.target ===
        $("habitModal")
      ){

        closeModal();

      }

    }
  );


$("todayButton")
  .addEventListener(
    "click",
    () => {

      state.selectedDate =
        new Date();

      setView(
        "dashboard"
      );

      render();

    }
  );


$("habitSearch")
  .addEventListener(
    "input",
    event => {

      state.search =
        event.target.value;

      renderDashboard();

    }
  );


$("categoryFilter")
  .addEventListener(
    "change",
    event => {

      state.category =
        event.target.value;

      renderDashboard();

    }
  );


$("prevMonth")
  .addEventListener(
    "click",
    () => {

      state.calendarDate
        .setMonth(
          state.calendarDate
            .getMonth()-1
        );

      renderCalendar();

    }
  );


$("nextMonth")
  .addEventListener(
    "click",
    () => {

      state.calendarDate
        .setMonth(
          state.calendarDate
            .getMonth()+1
        );

      renderCalendar();

    }
  );



/* NAVIGATION */

document
  .querySelectorAll(
    ".nav-item"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () =>
          setView(
            button.dataset.view
          )
      );

    }
  );



function setView(view){

  state.view =
    view;


  document
    .querySelectorAll(
      ".view"
    )
    .forEach(
      section => {

        section.classList.toggle(
          "active",
          section.id ===
          `${view}View`
        );

      }
    );


  document
    .querySelectorAll(
      ".nav-item"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.view ===
          view
        );

      }
    );


  renderHeader();

}



/* ================= THEME ================= */

function toggleTheme(){

  state.theme =
    document.body.classList.contains(
      "dark"
    )
      ? "light"
      : "dark";


  document.body.classList.toggle(
    "dark",
    state.theme === "dark"
  );


  localStorage.setItem(
    THEME_KEY,
    state.theme
  );


  updateThemeButtons();

}



function updateThemeButtons(){

  const dark =
    state.theme === "dark";


  $("themeIcon")
    .textContent =
    dark ? "☀" : "☾";


  $("mobileThemeButton")
    .textContent =
    dark ? "☀" : "☾";


  $("themeButton")
    .lastElementChild
    .textContent =
    dark
      ? "Light mode"
      : "Dark mode";

}


$("themeButton")
  .addEventListener(
    "click",
    toggleTheme
  );


$("mobileThemeButton")
  .addEventListener(
    "click",
    toggleTheme
  );


$("settingsThemeButton")
  .addEventListener(
    "click",
    toggleTheme
  );



/* ================= EXPORT ================= */

$("exportButton")
  .addEventListener(
    "click",
    () => {

      const data = {

        app:"HabitNJA",

        version:1,

        exportedAt:
          new Date()
            .toISOString(),

        habits:
          state.habits

      };


      const blob =
        new Blob(
          [
            JSON.stringify(
              data,
              null,
              2
            )
          ],
          {
            type:
              "application/json"
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        url;


      link.download =
        `HabitNJA-backup-${dateKey(
          new Date()
        )}.json`;


      link.click();


      URL.revokeObjectURL(
        url
      );


      showToast(
        "↓",
        "Data berhasil diexport."
      );

    }
  );



/* ================= IMPORT ================= */

$("importButton")
  .addEventListener(
    "click",
    () =>
      $("importFile").click()
  );


$("importFile")
  .addEventListener(
    "change",
    async event => {

      const file =
        event.target.files[0];


      if(!file)
        return;


      try{

        const text =
          await file.text();


        const data =
          JSON.parse(text);


        if(
          !Array.isArray(
            data.habits
          )
        ){

          throw new Error();

        }


        state.habits =
          data.habits.map(
            normalizeHabit
          );


        save();

        render();


        showToast(
          "↑",
          "Data berhasil diimport."
        );

      }

      catch{

        showToast(
          "!",
          "File JSON tidak valid."
        );

      }


      event.target.value = "";

    }
  );



/* ================= RESET ================= */

$("resetButton")
  .addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "Yakin ingin menghapus semua habit dan progress?"
        );


      if(!confirmed)
        return;


      localStorage.removeItem(
        STORAGE_KEY
      );


      state.habits=[];


      render();


      showToast(
        "↺",
        "Semua data berhasil direset."
      );

    }
  );



/* ================= TOAST ================= */

function showToast(
  icon,
  message
){

  $("toastIcon")
    .textContent =
    icon;


  $("toastMessage")
    .textContent =
    message;


  $("toast")
    .classList.add(
      "show"
    );


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(
      () =>
        $("toast")
          .classList.remove(
            "show"
          ),
      2500
    );

}



/* ================= HELPERS ================= */

function escapeHtml(value){

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}



function hexToRgba(
  hex,
  alpha
){

  const clean =
    hex.replace(
      "#",
      ""
    );


  const number =
    parseInt(
      clean,
      16
    );


  const r =
    (number >> 16) & 255;


  const g =
    (number >> 8) & 255;


  const b =
    number & 255;


  return `rgba(
    ${r},
    ${g},
    ${b},
    ${alpha}
  )`;

}



/* ESC = CLOSE */

document
  .addEventListener(
    "keydown",
    event => {

      if(
        event.key === "Escape"
      ){

        closeModal();

      }

    }
  );



/* START APP */

load();
