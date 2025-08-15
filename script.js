    let courses = JSON.parse(localStorage.getItem("plrs_courses")) || [];
    let logged = JSON.parse(localStorage.getItem("plrs_logged")) || {};
    let history = JSON.parse(localStorage.getItem("plrs_history")) || {};
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let pomodoroTimeLeft = 0;
    let onBreak = false;
    let pomodoroInterval = null;

    function saveAll() {
      localStorage.setItem("plrs_courses", JSON.stringify(courses));
      localStorage.setItem("plrs_logged", JSON.stringify(logged));
      localStorage.setItem("plrs_history", JSON.stringify(history));
    }

    function addCourse() {
      const name = document.getElementById("newCourseName").value;
      const id = name.replace(/\s+/g, "").toUpperCase();
      const P = parseFloat(document.getElementById("newP").value);
      const L = parseFloat(document.getElementById("newL").value);
      const R = parseFloat(document.getElementById("newR").value);
      const S = parseFloat(document.getElementById("newS").value);
      if (!name || isNaN(P) || isNaN(L) || isNaN(R) || isNaN(S)) return alert("Fill all fields");

      courses.push({ id, name, defaultHours: { P, L, R, S } });
      logged[id] = { P: 0, L: 0, R: 0, S: 0 };
      history[id] = { P: [], L: [], R: [], S: [] };
      saveAll();
      updateCourseDropdown();
      renderCourses();
    }

    function manualReset() {
      for (const c of courses) {
        logged[c.id] = { P: 0, L: 0, R: 0, S: 0 };
        history[c.id] = { P: [], L: [], R: [], S: [] };
      }
      saveAll();
      renderCourses();
      document.getElementById("reset-message").textContent = "Progress reset!";
      setTimeout(() => document.getElementById("reset-message").textContent = "", 3000);
    }

    function renderCourses() {
      const container = document.getElementById("courses");
      container.innerHTML = "";
      for (const course of courses) {
        const div = document.createElement("div");
        div.className = "course";
        div.innerHTML = `<h2>${course.name}</h2>`;
        ["P", "L", "R", "S"].forEach(stage => {
          const goal = course.defaultHours[stage];
          const current = logged[course.id]?.[stage] || 0;
          const percent = Math.min(current / goal * 100, 100).toFixed(1);
          div.innerHTML += `
            <div class="controls">
              <label>${stage} (Goal: ${goal}h, Logged: ${current.toFixed(2)}h)</label>
              <input type="number" min="0" step="0.25" id="${course.id}_${stage}_input" />
              <button onclick="editHours('${course.id}', '${stage}')">✏️ Edit</button>
              <button onclick="undoHours('${course.id}', '${stage}')">↩️ Undo</button>
            </div>
            <div class="bar" style="width:${percent}%"></div>
          `;
        });
        container.appendChild(div);
      }
    }

    function editHours(courseId, stage) {
      const field = document.getElementById(`${courseId}_${stage}_input`);
      const value = parseFloat(field.value);
      if (!isNaN(value)) {
        history[courseId][stage].push(logged[courseId][stage]);
        logged[courseId][stage] = value;
        saveAll();
        renderCourses();
      }
    }

    function undoHours(courseId, stage) {
      if (history[courseId][stage].length > 0) {
        logged[courseId][stage] = history[courseId][stage].pop();
        saveAll();
        renderCourses();
      }
    }

    function updateCourseDropdown() {
      const dropdown = document.getElementById("pomodoroCourse");
      dropdown.innerHTML = "";
      for (const c of courses) {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        dropdown.appendChild(opt);
      }
    }

    function renderCalendar() {
      const grid = document.getElementById("calendar");
      weekDays.forEach(day => {
        const box = document.createElement("div");
        box.className = "day-cell";
        box.textContent = day;
        grid.appendChild(box);
      });
    }

    function startPomodoro() {
      const course = document.getElementById("pomodoroCourse").value;
      const stage = document.getElementById("pomodoroStage").value;
      const focus = parseInt(document.getElementById("focusMinutes").value);
      const breakMin = parseInt(document.getElementById("breakMinutes").value);
      pomodoroTimeLeft = focus * 60;
      onBreak = false;
      runPomodoro(course, stage, breakMin * 60);
    }

    function runPomodoro(course, stage, breakTime) {
      clearInterval(pomodoroInterval);
      pomodoroInterval = setInterval(() => {
        if (pomodoroTimeLeft > 0) {
          pomodoroTimeLeft--;
          document.getElementById("pomodoroCountdown").textContent = (onBreak ? "Break: " : "Focus: ") +
            Math.floor(pomodoroTimeLeft / 60) + ":" + (pomodoroTimeLeft % 60).toString().padStart(2, "0");
        } else {
          clearInterval(pomodoroInterval);
          if (!onBreak) {
            const mins = parseInt(document.getElementById("focusMinutes").value);
            logged[course][stage] += mins / 60;
            saveAll();
            alert("Focus complete! Break time.");
            pomodoroTimeLeft = breakTime;
            onBreak = true;
            runPomodoro(course, stage, breakTime);
          } else {
            alert("Break complete! Ready for next round.");
            document.getElementById("pomodoroCountdown").textContent = "Not running";
          }
          renderCourses();
        }
      }, 1000);
    }

    updateCourseDropdown();
    renderCourses();

