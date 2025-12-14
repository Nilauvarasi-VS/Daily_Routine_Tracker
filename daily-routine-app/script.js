document.addEventListener("DOMContentLoaded", () => {

  const datePicker = document.getElementById("datePicker");
  const taskInput = document.getElementById("taskInput");
  const addTaskBtn = document.getElementById("addTaskBtn");
  const taskList = document.getElementById("taskList");
  const progressValue = document.getElementById("progressValue");
  const progressFill = document.getElementById("progressFill");

  const waterCountEl = document.getElementById("waterCount");
  const addWaterBtn = document.getElementById("addWater");
  const removeWaterBtn = document.getElementById("removeWater");

  const streakValue = document.getElementById("streakValue");
  const weeklyValue = document.getElementById("weeklyValue");
  const monthlyValue = document.getElementById("monthlyValue");

  const weeklyCtx = document.getElementById("weeklyChart").getContext("2d");
  const monthlyCtx = document.getElementById("monthlyChart").getContext("2d");

  const today = new Date().toISOString().split("T")[0];
  datePicker.value = today;

  let weeklyChart, monthlyChart;

  loadAll();

  // ---------- ADD TASK ----------
  addTaskBtn.onclick = () => {
    const text = taskInput.value.trim();
    if (!text) return;

    const tasks = getTasks();
    tasks.push({ name: text, done: false });
    saveTasks(tasks);
    taskInput.value = "";
    renderTasks(tasks);
  };

  taskInput.onkeydown = e => {
    if (e.key === "Enter") addTaskBtn.click();
  };

  datePicker.onchange = loadAll;

  // ---------- STORAGE ----------
  function getTasks() {
    return JSON.parse(localStorage.getItem(`tasks-${datePicker.value}`)) || [];
  }

  function saveTasks(tasks) {
    localStorage.setItem(`tasks-${datePicker.value}`, JSON.stringify(tasks));
  }

  // ---------- RENDER TASKS ----------
  function renderTasks(tasks) {
    taskList.innerHTML = "";

    tasks.forEach((task, index) => {
      const li = document.createElement("li");

      const left = document.createElement("div");
      left.className = "task-left";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = task.done;
      cb.onchange = () => {
  task.done = cb.checked;
  saveTasks(tasks);
  updateProgress(tasks);   // 🔴 THIS WAS MISSING
  updateAll();             // graphs + stats
};


      const span = document.createElement("span");
      span.textContent = task.name;

      const del = document.createElement("button");
      del.textContent = "X";
      del.className = "delete-btn";
      del.onclick = () => {
        tasks.splice(index, 1);
        saveTasks(tasks);
        renderTasks(tasks);
      };

      left.append(cb, span);
      li.append(left, del);
      taskList.appendChild(li);
    });

    updateProgress(tasks);
  }

  function updateProgress(tasks) {
    if (!tasks.length) {
      progressValue.textContent = "0%";
      progressFill.style.width = "0%";
      return;
    }
    const done = tasks.filter(t => t.done).length;
    const p = Math.round((done / tasks.length) * 100);
    progressValue.textContent = p + "%";
    progressFill.style.width = p + "%";
  }

  // ---------- WATER ----------
  function getWater() {
    return Number(localStorage.getItem(`water-${datePicker.value}`)) || 0;
  }

  addWaterBtn.onclick = () => {
    localStorage.setItem(`water-${datePicker.value}`, getWater() + 1);
    waterCountEl.textContent = getWater();
  };

  removeWaterBtn.onclick = () => {
    localStorage.setItem(`water-${datePicker.value}`, Math.max(0, getWater() - 1));
    waterCountEl.textContent = getWater();
  };

  // ---------- LOAD ----------
  function loadAll() {
  const tasks = getTasks();
  renderTasks(tasks);
  updateProgress(tasks);   // 🔴 FORCE PROGRESS
  waterCountEl.textContent = getWater();
  updateAll();
}


  // ---------- STATS ----------
  function updateAll() {
    updateStreak();
    updateWeekly();
    updateMonthly();
    drawWeeklyChart();
    drawMonthlyChart();
  }

  function dayCompletion(date) {
    const t = JSON.parse(localStorage.getItem(`tasks-${date}`)) || [];
    if (!t.length) return null;
    return Math.round((t.filter(x => x.done).length / t.length) * 100);
  }

  function updateStreak() {
    let s = 0;
    let d = new Date();
    while (true) {
      const val = dayCompletion(d.toISOString().split("T")[0]);
      if (val === 100) {
        s++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    streakValue.textContent = s;
  }

  function updateWeekly() {
    let sum = 0, c = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const v = dayCompletion(d.toISOString().split("T")[0]);
      if (v !== null) {
        sum += v;
        c++;
      }
    }
    weeklyValue.textContent = c ? Math.round(sum / c) + "%" : "0%";
  }

  function updateMonthly() {
    let sum = 0, c = 0;
    const now = new Date();
    for (let i = 1; i <= 31; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      if (d.getMonth() !== now.getMonth()) break;
      const v = dayCompletion(d.toISOString().split("T")[0]);
      if (v !== null) {
        sum += v;
        c++;
      }
    }
    monthlyValue.textContent = c ? Math.round(sum / c) + "%" : "0%";
  }

  // ---------- CHARTS ----------
  function drawWeeklyChart() {
    const labels = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toDateString().slice(0, 3));
      data.push(dayCompletion(d.toISOString().split("T")[0]) || 0);
    }

    if (weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(weeklyCtx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Weekly %",
          data
        }]
      }
    });
  }

  function drawMonthlyChart() {
    const labels = [];
    const data = [];
    const now = new Date();

    for (let i = 1; i <= 31; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      if (d.getMonth() !== now.getMonth()) break;
      labels.push(i.toString());
      data.push(dayCompletion(d.toISOString().split("T")[0]) || 0);
    }

    if (monthlyChart) monthlyChart.destroy();

    monthlyChart = new Chart(monthlyCtx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Monthly %",
          data,
          tension: 0.3
        }]
      }
    });
  }

});
