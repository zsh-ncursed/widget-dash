// Theme toggle and initialization
const themeBtn = document.getElementById('theme-toggle');
const setTheme = (dark) => {
  document.body.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
};
themeBtn.onclick = () => setTheme(!document.body.classList.contains('dark'));
window.onload = () => {
  setTheme(localStorage.getItem('theme') === 'dark');
  renderAll();
};

// Data storage and management
const STORAGE_KEY = 'startpage_data_v2';
function getData() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"pages":[{"id":1,"name":"Main","bookmarks":[],"notes":[]}],"current":1}');
}
function setData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getCurrentPage(data) {
  return data.pages.find(p => p.id === data.current);
}

let editTabId = null;
function renderTabsBar() {
  const data = getData();
  const bar = document.getElementById('tabs-bar');
  bar.innerHTML = '';
  data.pages.forEach((p, i) => {
    const tab = document.createElement('div');
    tab.className = 'tab' + (p.id === data.current ? ' active' : '');
    tab.tabIndex = 0;
    tab.title = 'Double click to rename';
    let name = p.name || (i+1).toString();
    tab.innerHTML = '';
    if (editTabId === p.id) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = name;
      input.style.width = Math.max(40, name.length * 10) + 'px';
      input.style.cursor = 'text';
      input.style.border = '1px solid #4f8cff';
      tab.appendChild(input);
      input.focus();
      input.select();
      input.onkeydown = ev => {
        if (ev.key === 'Enter') {
          p.name = input.value.trim() || (i+1).toString();
          setData(data);
          editTabId = null;
          renderTabsBar();
        }
      };
      input.onblur = () => {
        p.name = input.value.trim() || (i+1).toString();
        setData(data);
        editTabId = null;
        renderTabsBar();
      };
    } else {
      const nameSpan = document.createElement('span');
      nameSpan.textContent = name;
      nameSpan.className = 'name-span';
      let clickTimer = null;
      nameSpan.onclick = (e) => {
        if (clickTimer) return;
        clickTimer = setTimeout(() => {
          if (editTabId !== p.id) {
            data.current = p.id;
            setData(data);
            renderAll();
          }
          clickTimer = null;
        }, 250);
      };
      nameSpan.ondblclick = (e) => {
        e.stopPropagation();
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
        }
        editTabId = p.id;
        renderTabsBar();
      };
      tab.appendChild(nameSpan);
    }
    if (data.pages.length > 1) {
      const close = document.createElement('button');
      close.className = 'close-btn';
      close.innerHTML = '&times;';
      close.onclick = ev => {
        ev.stopPropagation();
        if (!confirm('Delete this page?')) return;
        data.pages = data.pages.filter(pg => pg.id !== p.id);
        if (data.current === p.id) data.current = data.pages[0].id;
        setData(data);
        renderAll();
      };
      tab.appendChild(close);
    }
    bar.appendChild(tab);
  });
  // Создаю кнопку +
  const addBtn = document.createElement('button');
  addBtn.id = 'add-page';
  addBtn.title = 'Add page';
  addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
  addBtn.onclick = () => {
    const data = getData();
    const name = (data.pages.length+1).toString();
    const id = Date.now();
    data.pages.push({id, name, bookmarks:[], notes:[]});
    data.current = id;
    setData(data);
    renderAll();
  };
  bar.appendChild(addBtn);
}

function renderPagesControl() {
  const data = getData();
  const select = document.getElementById('pages-list');
  select.innerHTML = data.pages.map(p => `<option value="${p.id}" ${p.id===data.current?'selected':''}>${p.name}</option>`).join('');
  select.onchange = e => {
    data.current = +e.target.value;
    setData(data);
    renderAll();
  };
}

let bookmarksEditMode = false;
function renderBookmarks(id = 'bookmarks-widget') {
  const data = getData();
  const page = getCurrentPage(data);
  const el = document.getElementById(id);
  let html = `<h2><i class='fa-solid fa-bookmark'></i> Bookmarks <span style='float:right;'>
    <button id='add-bm-btn-${id}' class='widget-header-btn'><i class='fa-solid fa-plus'></i></button>
    <button id='bm-edit-toggle-${id}' class='widget-header-btn'><i class='fa-solid fa-pen'></i></button>
    <button id='bm-remove-widget-${id}' class='widget-header-btn widget-header-btn-remove'><i class='fa-solid fa-xmark'></i></button>
  </span></h2>`;
  if (!page.bookmarks.length) {
    el.innerHTML = html;
    document.getElementById(`add-bm-btn-${id}`).onclick = () => showAddBookmarkInput(id);
    document.getElementById(`bm-edit-toggle-${id}`).onclick = () => toggleBookmarksEditMode(id);
    document.getElementById(`bm-remove-widget-${id}`).onclick = () => removeWidgetBySectionId(id);
    return;
  }
  html += `<ul id='bm-list-${id}'>`;
  page.bookmarks.forEach((b, i) => {
    html += `<li data-idx='${i}'>
      <img src='https://www.google.com/s2/favicons?domain=${encodeURIComponent(b.url)}' style='width:18px;height:18px;vertical-align:middle;margin-right:6px;'>
      <a href='${b.url}' target='_blank' class='bm-link'>${b.title || b.url}</a>
      <button class='bm-rename' id='bm-rename-${id}-${i}' title='Rename' style='display:${bookmarksEditMode ? 'inline-block':'none'}'><i class='fa-solid fa-pen'></i></button>
      <button class='bm-delete' id='bm-delete-${id}-${i}' title='Delete' style='display:${bookmarksEditMode ? 'inline-block':'none'}'><i class='fa-solid fa-xmark'></i></button>
    </li>`;
  });
  html += `</ul>`;
  el.innerHTML = html;
  document.getElementById(`add-bm-btn-${id}`).onclick = () => showAddBookmarkInput(id);
  document.getElementById(`bm-edit-toggle-${id}`).onclick = () => toggleBookmarksEditMode(id);
  document.getElementById(`bm-remove-widget-${id}`).onclick = () => removeWidgetBySectionId(id);
  // обработка rename/delete
  page.bookmarks.forEach((b, i) => {
    const delBtn = document.getElementById(`bm-delete-${id}-${i}`);
    if (delBtn) delBtn.onclick = function() {
      page.bookmarks.splice(i,1);
      setData(data);
      renderBookmarks(id);
    };
    const renBtn = document.getElementById(`bm-rename-${id}-${i}`);
    if (renBtn) renBtn.onclick = function() {
      showRenameBookmarkInput(id, i);
    };
  });
}

function toggleBookmarksEditMode(id) {
  bookmarksEditMode = !bookmarksEditMode;
  renderBookmarks(id);
}

function showAddBookmarkInput(id) {
  const el = document.getElementById(id);
  el.innerHTML += `<div id='bm-add-form-${id}'><input id='bm-url-${id}' placeholder='Enter URL' autofocus><button id='bm-save-${id}'><i class='fa-solid fa-check'></i></button></div>`;
  const urlInput = document.getElementById(`bm-url-${id}`);
  urlInput.focus();
  urlInput.onkeydown = e => {
    if (e.key === 'Enter') document.getElementById(`bm-save-${id}`).click();
  };
  document.getElementById(`bm-save-${id}`).onclick = () => {
    const url = urlInput.value.trim();
    if (!url) return;
    const data = getData();
    const page = getCurrentPage(data);
    page.bookmarks.push({title: '', url});
    setData(data);
    renderBookmarks(id);
  };
}

function showRenameBookmarkInput(id, idx) {
  const el = document.getElementById(id);
  const li = el.querySelector(`li[data-idx='${idx}']`);
  const span = li.querySelector('.bm-link');
  const old = span.textContent;
  span.innerHTML = `<input id='bm-title-input-${id}-${idx}' value='${old}' autofocus style='width:120px;'>`;
  const input = document.getElementById(`bm-title-input-${id}-${idx}`);
  input.focus();
  input.onkeydown = e => {
    if (e.key === 'Enter') {
      const data = getData();
      const page = getCurrentPage(data);
      page.bookmarks[idx].title = input.value.trim();
      setData(data);
      renderBookmarks(id);
    }
  };
  input.onblur = () => {
    const data = getData();
    const page = getCurrentPage(data);
    page.bookmarks[idx].title = input.value.trim();
    setData(data);
    renderBookmarks(id);
  };
}

function renderNotes(id = 'notes-widget') {
  const data = getData();
  const page = getCurrentPage(data);
  const el = document.getElementById(id);
  el.innerHTML = `<h2><i class='fa-solid fa-note-sticky'></i> Notes <span style='float:right;'>
    <button id='notes-remove-widget-${id}' class='widget-header-btn widget-header-btn-remove'><i class='fa-solid fa-xmark'></i></button>
  </span></h2>
    <textarea id="notes-area" rows="5" style="width:100%;">${page.notes.join('\n')}</textarea>`;
  const notesArea = document.getElementById('notes-area');
  notesArea.oninput = e => {
    page.notes = e.target.value.split('\n');
    setData(data);
    autoGrow(notesArea);
  };
  autoGrow(notesArea);
  document.getElementById(`notes-remove-widget-${id}`).onclick = () => removeWidgetBySectionId(id);
}

function autoGrow(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = (textarea.scrollHeight) + 'px';
}

let zoneWidgets = [[], [], []];
let zoneWidgetsCalendarState = {};
function renderZones() {
  for (let i = 0; i < 3; i++) {
    const zone = document.getElementById(`zone-${i+1}`);
    zone.innerHTML = '';
    (zoneWidgets[i] || []).forEach((type, j) => {
      const wid = `${type}-widget-${i}-${j}`;
      const wrap = document.createElement('div');
      wrap.style.width = '100%';
      wrap.innerHTML = `<section class='widget-section' id="${wid}"></section>`;
      zone.appendChild(wrap);
      if (type === 'bookmarks') {
        renderBookmarks(wid);
      } else if (type === 'notes') {
        renderNotes(wid);
      } else if (type === 'calendar') {
        renderCalendar(wid);
      } else if (type === 'todo') {
        renderTodo(wid);
      } else if (type === 'clock') {
        renderClock(wid);
      } else if (type === 'calculator') {
        renderCalculator(wid);
      }
    });
    // Кнопка + всегда под последним виджетом
    const btn = document.createElement('button');
    btn.className = 'add-widget-btn' + ((zoneWidgets[i] && zoneWidgets[i].length) ? ' after-widget' : '');
    btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
    btn.onclick = () => showWidgetMenu(i);
    zone.appendChild(btn);
  }
}
function showWidgetMenu(idx) {
  const zone = document.getElementById(`zone-${idx+1}`);
  const menu = document.createElement('div');
  menu.style.position = 'absolute';
  menu.style.top = '50px';
  menu.style.left = '50%';
  menu.style.transform = 'translate(-50%,0)';
  menu.style.background = '#fff';
  menu.style.border = '1px solid #e0e0e0';
  menu.style.borderRadius = '8px';
  menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
  menu.style.padding = '1rem';
  menu.style.zIndex = 10;
  menu.innerHTML = `<button class='widget-menu-btn' data-type='bookmarks'><i class='fa-solid fa-bookmark'></i> Bookmarks</button><br><button class='widget-menu-btn' data-type='notes'><i class='fa-solid fa-note-sticky'></i> Notes</button><br><button class='widget-menu-btn' data-type='calendar'><i class='fa-solid fa-calendar'></i> Calendar</button><br><button class='widget-menu-btn' data-type='todo'><i class='fa-solid fa-list-check'></i> ToDo</button><br><button class='widget-menu-btn' data-type='clock'><i class='fa-solid fa-clock'></i> Clock</button><br><button class='widget-menu-btn' data-type='calculator'><i class='fa-solid fa-calculator'></i> Calculator</button>`;
  zone.appendChild(menu);
  menu.querySelectorAll('.widget-menu-btn').forEach(btn => btn.onclick = function() {
    zoneWidgets[idx].push(this.dataset.type);
    renderZones();
  });
}
function getCalendarEvents(id) {
  const data = getData();
  if (!data.calendarEvents) data.calendarEvents = {};
  if (!data.calendarEvents[id]) data.calendarEvents[id] = {};
  return data.calendarEvents[id];
}
function setCalendarEvents(id, events) {
  const data = getData();
  if (!data.calendarEvents) data.calendarEvents = {};
  data.calendarEvents[id] = events;
  setData(data);
}
function renderCalendar(id = 'calendar-widget') {
  const el = document.getElementById(id);
  if (!zoneWidgetsCalendarState[id]) {
    const today = new Date();
    zoneWidgetsCalendarState[id] = { year: today.getFullYear(), month: today.getMonth() };
  }
  let { year, month } = zoneWidgetsCalendarState[id];
  const today = new Date();
  const events = getCalendarEvents(id);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  let html = `<h2><i class='fa-solid fa-calendar'></i> Calendar</h2>`;
  html += `<div class='calendar-header'>
    <button class='calendar-nav' id='cal-prev-${id}'>&lt;</button>
    <span>${monthNames[month]} ${year}</span>
    <button class='calendar-nav' id='cal-next-${id}'>&gt;</button>
  </div>`;
  html += `<div class='calendar-grid'>`;
  const weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  for (let d of weekDays) html += `<div class='calendar-cell calendar-weekday'>${d}</div>`;
  let firstDay = new Date(year, month, 1).getDay();
  if (firstDay === 0) firstDay = 7;
  for (let i = 1; i < firstDay; i++) html += `<div class='calendar-cell'></div>`;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const evs = events[dateStr] || [];
    let bgLines = '';
    if (evs.length) {
      bgLines = `<div class='calendar-bg-lines'>` +
        evs.map((ev, idx) => `<div class='calendar-bg-line' style='background:${calendarLineColor(idx)}; top:${idx*6}px;'></div>`).join('') +
        `</div>`;
    }
    html += `<div class='calendar-cell${isToday ? ' calendar-today' : ''}' data-date='${dateStr}' style='position:relative;'>${bgLines}<span class='calendar-day-num' style='position:relative;z-index:1;'>${d}</span></div>`;
  }
  html += `</div>`;
  html += `<div id='calendar-events-${id}'></div>`;
  el.innerHTML = html;
  // Обработчики стрелок
  document.getElementById(`cal-prev-${id}`).onclick = () => {
    month--;
    if (month < 0) { month = 11; year--; }
    zoneWidgetsCalendarState[id] = { year, month };
    renderCalendar(id);
  };
  document.getElementById(`cal-next-${id}`).onclick = () => {
    month++;
    if (month > 11) { month = 0; year++; }
    zoneWidgetsCalendarState[id] = { year, month };
    renderCalendar(id);
  };
  // Клик по дню
  el.querySelectorAll('.calendar-cell[data-date]').forEach(cell => {
    cell.onclick = () => showCalendarEventForm(id, cell.dataset.date);
  });
}
function showCalendarEventForm(id, dateStr) {
  const el = document.getElementById(`calendar-events-${id}`);
  const events = getCalendarEvents(id);
  let editKey = window._calEditKey || null;
  let html = `<div class='calendar-event-form'><b>${dateStr}</b><br>`;
  html += `<input id='cal-ev-time-${id}' type='time' style='width:90px;'> <input id='cal-ev-input-${id}' placeholder='Event...' style='width:55%'> <button id='cal-ev-add-${id}'>Add</button><br>`;
  if (events[dateStr] && events[dateStr].length) {
    const sorted = events[dateStr].map((ev, i) => ({...ev, _idx: i})).sort((a, b) => (a.time || '') > (b.time || '') ? 1 : -1);
    html += `<ul class='calendar-event-list'>`;
    sorted.forEach((ev, sidx) => {
      const i = ev._idx;
      const key = `${ev.time || ''}|${ev.text}`;
      if (editKey === key) {
        html += `<li><input id='cal-ev-edit-time-${id}-${i}' type='time' value='${ev.time||''}' style='width:90px;'> <input id='cal-ev-edit-input-${id}-${i}' value='${ev.text}' style='width:55%'> <button class='calendar-event-save' data-idx='${i}' data-key='${key}'>✔</button> <button class='calendar-event-cancel' data-idx='${i}'>✕</button></li>`;
      } else {
        html += `<li>${ev.time ? `<span class='calendar-event-time'>${ev.time}</span> ` : ''}${ev.text}<button class='calendar-event-edit' data-idx='${i}' data-key='${key}'>✏️</button><button class='calendar-event-del' data-idx='${i}'>✕</button></li>`;
      }
    });
    html += `</ul>`;
  }
  html += `<button id='cal-ev-close-${id}'>Close</button></div>`;
  el.innerHTML = html;
  document.getElementById(`cal-ev-input-${id}`).focus();
  document.getElementById(`cal-ev-add-${id}`).onclick = () => {
    const val = document.getElementById(`cal-ev-input-${id}`).value.trim();
    const time = document.getElementById(`cal-ev-time-${id}`).value;
    if (!val) return;
    if (!events[dateStr]) events[dateStr] = [];
    events[dateStr].push({text: val, time});
    setCalendarEvents(id, events);
    renderCalendar(id);
    showCalendarEventForm(id, dateStr);
  };
  el.querySelectorAll('.calendar-event-del').forEach(btn => btn.onclick = function() {
    const idx = +this.dataset.idx;
    events[dateStr].splice(idx,1);
    setCalendarEvents(id, events);
    renderCalendar(id);
    showCalendarEventForm(id, dateStr);
  });
  el.querySelectorAll('.calendar-event-edit').forEach(btn => btn.onclick = function() {
    window._calEditKey = this.dataset.key;
    showCalendarEventForm(id, dateStr);
  });
  el.querySelectorAll('.calendar-event-save').forEach(btn => btn.onclick = function() {
    const idx = +this.dataset.idx;
    const newText = document.getElementById(`cal-ev-edit-input-${id}-${idx}`).value.trim();
    const newTime = document.getElementById(`cal-ev-edit-time-${id}-${idx}`).value;
    if (!newText) return;
    events[dateStr][idx] = {text: newText, time: newTime};
    setCalendarEvents(id, events);
    window._calEditKey = null;
    renderCalendar(id);
    showCalendarEventForm(id, dateStr);
  });
  el.querySelectorAll('.calendar-event-cancel').forEach(btn => btn.onclick = function() {
    window._calEditKey = null;
    showCalendarEventForm(id, dateStr);
  });
  document.getElementById(`cal-ev-close-${id}`).onclick = () => {
    el.innerHTML = '';
    window._calEditKey = null;
  };
}
function calendarLineColor(idx) {
  const colors = ['#e74c3c','#4f8cff','#22c55e','#f59e42','#a855f7','#f43f5e','#14b8a6'];
  return colors[idx % colors.length];
}

function removeWidgetBySectionId(sectionId) {
  for (let i = 0; i < zoneWidgets.length; i++) {
    for (let j = 0; j < zoneWidgets[i].length; j++) {
      const wid = `${zoneWidgets[i][j]}-widget-${i}-${j}`;
      if (wid === sectionId) {
        zoneWidgets[i].splice(j, 1);
        renderZones();
        return;
      }
    }
  }
}

function getTodoList(id) {
  const data = getData();
  if (!data.todoLists) data.todoLists = {};
  if (!data.todoLists[id]) data.todoLists[id] = [];
  return data.todoLists[id];
}
function setTodoList(id, list) {
  const data = getData();
  if (!data.todoLists) data.todoLists = {};
  data.todoLists[id] = list;
  setData(data);
}
function renderTodo(id = 'todo-widget') {
  const el = document.getElementById(id);
  const list = getTodoList(id);
  let html = `<h2><i class='fa-solid fa-list-check'></i> ToDo <button id='todo-add-btn-${id}' class='widget-header-btn'><i class='fa-solid fa-plus'></i></button></h2>`;
  html += `<ul class='todo-list'>`;
  list.forEach((item, i) => {
    if (item._edit) {
      html += `<li><input id='todo-edit-input-${id}-${i}' value='${item.text}' style='width:60%'> <button class='todo-save' data-idx='${i}'>✔</button> <button class='todo-cancel' data-idx='${i}'>✕</button></li>`;
    } else {
      html += `<li><label><input type='checkbox' class='todo-check' data-idx='${i}' ${item.done ? 'checked' : ''}> <span class='${item.done ? 'todo-done' : ''}'>${item.text}</span></label> <button class='todo-edit' data-idx='${i}'>✏️</button> <button class='todo-del' data-idx='${i}'>✕</button></li>`;
    }
  });
  html += `</ul>`;
  el.innerHTML = html;
  document.getElementById(`todo-add-btn-${id}`).onclick = () => {
    list.push({text: '', done: false, _edit: true});
    setTodoList(id, list);
    renderTodo(id);
  };
  el.querySelectorAll('.todo-check').forEach(btn => btn.onchange = function() {
    const idx = +this.dataset.idx;
    list[idx].done = this.checked;
    setTodoList(id, list);
    renderTodo(id);
  });
  el.querySelectorAll('.todo-del').forEach(btn => btn.onclick = function() {
    const idx = +this.dataset.idx;
    list.splice(idx,1);
    setTodoList(id, list);
    renderTodo(id);
  });
  el.querySelectorAll('.todo-edit').forEach(btn => btn.onclick = function() {
    const idx = +this.dataset.idx;
    list.forEach((item, j) => item._edit = (j === idx));
    setTodoList(id, list);
    renderTodo(id);
  });
  el.querySelectorAll('.todo-save').forEach(btn => btn.onclick = function() {
    const idx = +this.dataset.idx;
    const val = document.getElementById(`todo-edit-input-${id}-${idx}`).value.trim();
    if (!val) return;
    list[idx].text = val;
    list[idx]._edit = false;
    setTodoList(id, list);
    renderTodo(id);
  });
  el.querySelectorAll('.todo-cancel').forEach(btn => btn.onclick = function() {
    const idx = +this.dataset.idx;
    if (!list[idx].text) list.splice(idx,1);
    else list[idx]._edit = false;
    setTodoList(id, list);
    renderTodo(id);
  });
}

function renderClock(id = 'clock-widget') {
  const el = document.getElementById(id);
  function update() {
    const now = new Date();
    const time = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    const date = now.toLocaleDateString();
    el.innerHTML = `<h2><i class='fa-solid fa-clock'></i> Clock</h2><div class='clock-time'>${time}</div><div class='clock-date'>${date}</div>`;
  }
  update();
  if (el._clockTimer) clearInterval(el._clockTimer);
  el._clockTimer = setInterval(update, 1000);
}

function calcSimple(expr) {
  // Только числа, +, -, *, /, %
  expr = expr.replace(/[^0-9+\-*/.%]/g, '');
  let tokens = expr.match(/([+\-*/])|([0-9.]+%?)|%/g);
  if (!tokens) return 'Error';
  let stack = [];
  let op = null;
  for (let t of tokens) {
    if (/[+\-*/]/.test(t)) op = t;
    else {
      let isPercent = t.endsWith('%');
      let num = parseFloat(t);
      if (isNaN(num)) return 'Error';
      if (isPercent) {
        if (stack.length === 0) return 'Error';
        let base = stack[stack.length-1];
        if (op === '*' || op === '/') {
          num = num / 100;
        } else if (op === '+' || op === '-') {
          num = base * num / 100;
        }
      }
      if (!op) stack.push(num);
      else {
        let prev = stack.pop();
        if (op === '+') stack.push(prev + num);
        else if (op === '-') stack.push(prev - num);
        else if (op === '*') stack.push(prev * num);
        else if (op === '/') stack.push(prev / num);
        op = null;
      }
    }
  }
  return stack.length ? stack[0] : 'Error';
}

function renderCalculator(id = 'calculator-widget') {
  const el = document.getElementById(id);
  let html = `<h2><i class='fa-solid fa-calculator'></i> Calculator</h2>`;
  html += `<form id='calc-form-${id}' autocomplete='off' style='display:flex;gap:0.5rem;align-items:center;'>
    <input id='calc-input-${id}' type='text' style='flex:1;font-size:1.1rem;padding:4px 8px;' placeholder='2+2*2'>
    <button id='calc-eval-${id}' type='submit'>=</button>
  </form>
  <div id='calc-result-${id}' class='calc-result'></div>`;
  el.innerHTML = html;
  const form = document.getElementById(`calc-form-${id}`);
  const input = document.getElementById(`calc-input-${id}`);
  const result = document.getElementById(`calc-result-${id}`);
  form.onsubmit = e => {
    e.preventDefault();
    let expr = input.value.trim();
    if (!expr) return;
    let res = calcSimple(expr);
    result.textContent = (res === 'Error') ? 'Error' : '= ' + res;
  };
}

function renderAll() {
  renderTabsBar();
  renderZones();
} 