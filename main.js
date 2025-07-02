// Theme toggle and initialization
const themeBtn = document.getElementById('theme-toggle');
const themeIcon = themeBtn.querySelector('i.fa-moon, i.fa-sun');
if (themeIcon) {
  themeIcon.onclick = (e) => {
    setTheme(!document.body.classList.contains('dark'));
    e.stopPropagation();
  };
}
const setTheme = (dark) => {
  document.body.classList.toggle('dark', dark);
  localStorage.setItem('theme', dark ? 'dark' : 'light');
};
window.onload = () => {
  autoCleanZoneWidgets();
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
    tab.setAttribute('draggable', true);
    tab.dataset.idx = i;
    // Drag events
    tab.ondragstart = (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', i);
      tab.classList.add('dragging');
    };
    tab.ondragend = () => {
      tab.classList.remove('dragging');
    };
    tab.ondragover = (e) => {
      e.preventDefault();
      tab.classList.add('drag-over');
    };
    tab.ondragleave = () => {
      tab.classList.remove('drag-over');
    };
    tab.ondrop = (e) => {
      e.preventDefault();
      tab.classList.remove('drag-over');
      const fromIdx = +e.dataTransfer.getData('text/plain');
      const toIdx = i;
      if (fromIdx !== toIdx) {
        const moved = data.pages.splice(fromIdx, 1)[0];
        data.pages.splice(toIdx, 0, moved);
        setData(data);
        renderTabsBar();
      }
    };
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
      // Глобальный обработчик для клика вне input
      setTimeout(() => {
        function handleClickOutside(e) {
          if (document.activeElement !== input) return;
          if (!input.contains(e.target)) {
            input.blur();
          }
        }
        document.addEventListener('mousedown', handleClickOutside, {capture:true, once:true});
      }, 0);
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
  const widget = findWidgetById(id);
  if (editWidgetId === id) {
    el.innerHTML = `<h2><i class='fa-solid fa-bookmark'></i> <input id='edit-widget-title-${id}' value='${getWidgetTitle(widget, 'Bookmarks')}' style='font-size:1.1em;width:70%;margin-left:8px;'> <span style='float:right;'><button id='add-bm-btn-${id}' class='widget-header-btn'><i class='fa-solid fa-plus'></i></button><button id='bookmarks-remove-widget-${id}' class='widget-header-btn widget-header-btn-remove'><i class='fa-solid fa-xmark'></i></button></span></h2>`;
    const input = document.getElementById(`edit-widget-title-${id}`);
    input.focus(); input.select();
    input.onkeydown = function(e) {
      if (e.key === 'Enter') { saveWidgetTitle(id, input.value.trim() || 'Bookmarks'); editWidgetId = null; }
      else if (e.key === 'Escape') { editWidgetId = null; renderZones(); }
    };
    input.onblur = function() { saveWidgetTitle(id, input.value.trim() || 'Bookmarks'); editWidgetId = null; };
    document.getElementById(`add-bm-btn-${id}`).onclick = () => showAddBookmarkInput(id);
    document.getElementById(`bookmarks-remove-widget-${id}`).onclick = () => removeWidgetBySectionId(id);
    return;
  }
  let html = `<h2><i class='fa-solid fa-bookmark'></i> ${getWidgetTitle(widget, 'Bookmarks')} <span style='float:right;'><button id='add-bm-btn-${id}' class='widget-header-btn'><i class='fa-solid fa-plus'></i></button><button id='bookmarks-remove-widget-${id}' class='widget-header-btn widget-header-btn-remove'><i class='fa-solid fa-xmark'></i></button></span></h2>`;
  if (!page.bookmarks.length) {
    el.innerHTML = html;
    const h2 = el.querySelector('h2');
    if (h2) h2.ondblclick = () => makeWidgetTitleEditable(id, 'Bookmarks');
    document.getElementById(`add-bm-btn-${id}`).onclick = () => showAddBookmarkInput(id);
    document.getElementById(`bookmarks-remove-widget-${id}`).onclick = () => removeWidgetBySectionId(id);
    return;
  }
  html += `<ul id='bm-list-${id}' class='bm-list'>`;
  page.bookmarks.forEach((b, i) => {
    html += `<li data-idx='${i}'>
      <img src='https://www.google.com/s2/favicons?domain=${encodeURIComponent(b.url)}' style='width:18px;height:18px;vertical-align:middle;margin-right:6px;'>
      <a href='${b.url}' target='_blank' class='bm-link'>${b.title || b.url}</a>
      <button class='bm-delete' id='bm-delete-${id}-${i}' title='Удалить'><i class='fa-solid fa-xmark'></i></button>
    </li>`;
  });
  html += `</ul>`;
  el.innerHTML = html;
  const h2 = el.querySelector('h2');
  if (h2) h2.ondblclick = () => makeWidgetTitleEditable(id, 'Bookmarks');
  document.getElementById(`add-bm-btn-${id}`).onclick = () => showAddBookmarkInput(id);
  document.getElementById(`bookmarks-remove-widget-${id}`).onclick = () => removeWidgetBySectionId(id);
  // обработка удаления и двойного клика для редактирования
  page.bookmarks.forEach((b, i) => {
    const delBtn = document.getElementById(`bm-delete-${id}-${i}`);
    if (delBtn) delBtn.onclick = function(e) {
      e.stopPropagation();
      page.bookmarks.splice(i,1);
      setData(data);
      renderBookmarks(id);
    };
    const li = el.querySelector(`li[data-idx='${i}']`);
    if (li) {
      li.ondblclick = function(e) {
        e.stopPropagation();
        showRenameBookmarkInput(id, i);
      };
    }
  });
}

function toggleBookmarksEditMode(id) {
  bookmarksEditMode = !bookmarksEditMode;
  renderBookmarks(id);
}

function showAddBookmarkInput(id) {
  const el = document.getElementById(id);
  el.innerHTML += `<div id='bm-add-form-${id}'><input id='bm-url-${id}' placeholder='Enter URL' autofocus><button id='bm-save-${id}' style="color:#22c55e">&#10003;</button></div>`;
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
  if (editWidgetId === id) return;
  const data = getData();
  const page = getCurrentPage(data);
  const el = document.getElementById(id);
  const widget = findWidgetById(id);
  if (editWidgetId === id) {
    el.innerHTML = `<h2><i class='fa-solid fa-note-sticky'></i> <input id='edit-widget-title-${id}' value='${getWidgetTitle(widget, 'Notes')}' style='font-size:1.1em;width:70%;margin-left:8px;'> <span style='float:right;'><button id='notes-remove-widget-${id}' class='widget-header-btn widget-header-btn-remove'><i class='fa-solid fa-xmark'></i></button></span></h2>`;
    const input = document.getElementById(`edit-widget-title-${id}`);
    input.focus(); input.select();
    input.onkeydown = function(e) {
      if (e.key === 'Enter') { saveWidgetTitle(id, input.value.trim() || 'Notes'); editWidgetId = null; }
      else if (e.key === 'Escape') { editWidgetId = null; renderZones(); }
    };
    input.onblur = function() { saveWidgetTitle(id, input.value.trim() || 'Notes'); editWidgetId = null; };
    document.getElementById(`notes-remove-widget-${id}`).onclick = () => removeWidgetBySectionId(id);
    return;
  }
  el.innerHTML = `<h2><i class='fa-solid fa-note-sticky'></i> ${getWidgetTitle(widget, 'Notes')} <span style='float:right;'>
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
  const h2 = el.querySelector('h2');
  if (h2) h2.ondblclick = () => makeWidgetTitleEditable(id, 'Notes');
  document.getElementById(`notes-remove-widget-${id}`).onclick = () => removeWidgetBySectionId(id);
}

function autoGrow(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = (textarea.scrollHeight) + 'px';
}

let zoneWidgets = null;
let zoneWidgetsCalendarState = {};

function loadZoneWidgets() {
  const data = getData();
  const page = getCurrentPage(data);
  if (!page.zoneWidgets) page.zoneWidgets = [[], [], []];
  zoneWidgets = page.zoneWidgets;
}

function saveZoneWidgets() {
  const data = getData();
  const page = getCurrentPage(data);
  page.zoneWidgets = zoneWidgets;
  setData(data);
}

function getWidgetType(widget) {
  return typeof widget === 'string' ? widget : widget.type;
}
function getWidgetTitle(widget, def) {
  return typeof widget === 'string' ? def : (widget.title || def);
}

function renderZones() {
  for (let i = 0; i < 3; i++) {
    const zone = document.getElementById(`zone-${i+1}`);
    zone.innerHTML = '';
    (zoneWidgets[i] || []).forEach((widget, j) => {
      const widgetType = getWidgetType(widget);
      const wid = `${widgetType}-widget-${i}-${j}`;
      const wrap = document.createElement('div');
      wrap.style.width = '100%';
      wrap.innerHTML = `<section class='widget-section' id="${wid}"></section>`;
      zone.appendChild(wrap);
      if (widgetType === 'bookmarks') {
        renderBookmarks(wid);
      } else if (widgetType === 'notes') {
        renderNotes(wid);
      } else if (widgetType === 'calendar') {
        renderCalendar(wid);
      } else if (widgetType === 'todo') {
        renderTodo(wid);
      } else if (widgetType === 'clock') {
        renderClock(wid);
      } else if (widgetType === 'calculator') {
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
  menu.className = 'widget-menu-popup';
  menu.style.position = 'absolute';
  // popup появляется в колонке, а не по центру
  menu.style.left = '10px';
  menu.style.top = '60px';
  menu.style.background = getComputedStyle(document.body).getPropertyValue('--bg');
  menu.style.color = getComputedStyle(document.body).getPropertyValue('--text');
  menu.style.border = '1px solid ' + getComputedStyle(document.body).getPropertyValue('--border');
  menu.style.borderRadius = '8px';
  menu.style.boxShadow = '0 2px 8px ' + getComputedStyle(document.body).getPropertyValue('--shadow');
  menu.style.padding = '1rem';
  menu.style.zIndex = 10;
  menu.innerHTML = `<button class='widget-menu-btn' data-type='bookmarks'><i class='fa-solid fa-bookmark'></i> Bookmarks</button><br><button class='widget-menu-btn' data-type='notes'><i class='fa-solid fa-note-sticky'></i> Notes</button><br><button class='widget-menu-btn' data-type='calendar'><i class='fa-solid fa-calendar'></i> Calendar</button><br><button class='widget-menu-btn' data-type='todo'><i class='fa-solid fa-list-check'></i> ToDo</button><br><button class='widget-menu-btn' data-type='clock'><i class='fa-solid fa-clock'></i> Clock</button><br><button class='widget-menu-btn' data-type='calculator'><i class='fa-solid fa-calculator'></i> Calculator</button>`;
  zone.appendChild(menu);
  // Закрытие по клику вне меню
  function closeMenu(e) {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', escHandler);
    }
  }
  function escHandler(e) {
    if (e.key === 'Escape') {
      menu.remove();
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', escHandler);
    }
  }
  setTimeout(() => {
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', escHandler);
  }, 0);
  menu.querySelectorAll('.widget-menu-btn').forEach(btn => btn.onclick = function() {
    zoneWidgets[idx].push(this.dataset.type);
    saveZoneWidgets();
    renderZones();
    menu.remove();
    document.removeEventListener('mousedown', closeMenu);
    document.removeEventListener('keydown', escHandler);
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
  if (editWidgetId === id) return;
  const el = document.getElementById(id);
  const widget = findWidgetById(id);
  if (!zoneWidgetsCalendarState[id]) {
    const today = new Date();
    zoneWidgetsCalendarState[id] = { year: today.getFullYear(), month: today.getMonth() };
  }
  let { year, month } = zoneWidgetsCalendarState[id];
  const today = new Date();
  const events = getCalendarEvents(id);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  let html = `<h2><i class='fa-solid fa-calendar'></i> ${getWidgetTitle(widget, 'Calendar')} <span style='float:right;'><button id='calendar-remove-widget-${id}' class='widget-header-btn widget-header-btn-remove'><i class='fa-solid fa-xmark'></i></button></span></h2>`;
  html += `<div class='calendar-header'><div class='calendar-header-inner'>
    <button class='calendar-nav' id='cal-prev-${id}'>&lt;</button>
    <span>${monthNames[month]} ${year}</span>
    <button class='calendar-nav' id='cal-next-${id}'>&gt;</button>
  </div></div>`;
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
  const h2 = el.querySelector('h2');
  if (h2) h2.ondblclick = () => makeWidgetTitleEditable(id, 'Calendar');
  document.getElementById(`calendar-remove-widget-${id}`).onclick = () => removeWidgetBySectionId(id);
}
function showCalendarEventForm(id, dateStr) {
  if (editWidgetId === id) return;
  const el = document.getElementById(`calendar-events-${id}`);
  const events = getCalendarEvents(id);
  let editKey = window._calEditKey || null;
  let html = `<div class='calendar-event-form'><b>${dateStr}</b><br>`;
  html += `<input id='cal-ev-time-${id}' type='time' style='width:90px;'> <input id='cal-ev-input-${id}' placeholder='Event...' style='width:55%'> <button id='cal-ev-add-${id}' style="color:#22c55e">&#10003;</button><br>`;
  if (events[dateStr] && events[dateStr].length) {
    const sorted = events[dateStr].map((ev, i) => ({...ev, _idx: i})).sort((a, b) => (a.time || '') > (b.time || '') ? 1 : -1);
    html += `<ul class='calendar-event-list'>`;
    sorted.forEach((ev, sidx) => {
      const i = ev._idx;
      const key = `${ev.time || ''}|${ev.text}`;
      if (editKey === key) {
        html += `<li><input id='cal-ev-edit-time-${id}-${i}' type='time' value='${ev.time||''}' style='width:90px;'> <input id='cal-ev-edit-input-${id}-${i}' value='${ev.text}' style='width:55%'> <button class='calendar-event-save' data-idx='${i}' data-key='${key}' style="color:#22c55e">✔</button> <button class='calendar-event-cancel' data-idx='${i}' style="color:#e74c3c">✕</button></li>`;
      } else {
        html += `<li>${ev.time ? `<span class='calendar-event-time'>${ev.time}</span> ` : ''}${ev.text}<button class='calendar-event-edit' data-idx='${i}' data-key='${key}' style="color:#22c55e">✏️</button><button class='calendar-event-del' data-idx='${i}' style="color:#e74c3c">✕</button></li>`;
      }
    });
    html += `</ul>`;
  }
  html += `<button id='cal-ev-close-${id}' style="color:#e74c3c">&#10005;</button></div>`;
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
  document.getElementById(`cal-ev-time-${id}`).onkeydown = function(e) {
    if (e.key === 'Enter') {
      document.getElementById(`cal-ev-input-${id}`).focus();
    }
  };
  document.getElementById(`cal-ev-time-${id}`).onblur = function() {
    document.getElementById(`cal-ev-input-${id}`).focus();
  };
}
function calendarLineColor(idx) {
  const colors = ['#e74c3c','#4f8cff','#22c55e','#f59e42','#a855f7','#f43f5e','#14b8a6'];
  return colors[idx % colors.length];
}

function removeWidgetBySectionId(sectionId) {
  for (let i = 0; i < zoneWidgets.length; i++) {
    for (let j = 0; j < zoneWidgets[i].length; j++) {
      const wid = `${getWidgetType(zoneWidgets[i][j])}-widget-${i}-${j}`;
      if (wid === sectionId) {
        zoneWidgets[i].splice(j, 1);
        saveZoneWidgets();
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
  if (editWidgetId === id) return;
  const el = document.getElementById(id);
  const list = getTodoList(id);
  const widget = findWidgetById(id);
  let html = `<h2><i class='fa-solid fa-list-check'></i> ${getWidgetTitle(widget, 'ToDo')} <button id='todo-add-btn-${id}' class='widget-header-btn'><i class='fa-solid fa-plus'></i></button></h2>`;
  html += `<ul class='todo-list'>`;
  list.forEach((item, i) => {
    if (item._edit) {
      html += `<li><input id='todo-edit-input-${id}-${i}' value='${item.text}' style='width:60%'> <button class='todo-save' data-idx='${i}' style="color:#22c55e">&#10003;</button> <button class='todo-cancel' data-idx='${i}' style="color:#e74c3c">✕</button></li>`;
    } else {
      html += `<li><label><input type='checkbox' class='todo-check' data-idx='${i}' ${item.done ? 'checked' : ''}> <span class='${item.done ? 'todo-done' : ''}'>${item.text}</span></label> <button class='todo-edit' data-idx='${i}' style="color:#22c55e">✏️</button> <button class='todo-del' data-idx='${i}' style="color:#e74c3c">✕</button></li>`;
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
  const h2 = el.querySelector('h2');
  if (h2) h2.ondblclick = () => makeWidgetTitleEditable(id, 'ToDo');
  document.getElementById(`notes-remove-widget-${id}`).onclick = () => removeWidgetBySectionId(id);
}

function renderClock(id = 'clock-widget') {
  if (editWidgetId === id) return;
  const el = document.getElementById(id);
  const widget = findWidgetById(id);
  function update() {
    const now = new Date();
    const time = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    const date = now.toLocaleDateString();
    let html = `<h2><i class='fa-solid fa-clock'></i> ${getWidgetTitle(widget, 'Clock')} <span style='float:right;'><button id='clock-remove-widget-${id}' class='widget-header-btn widget-header-btn-remove'><i class='fa-solid fa-xmark'></i></button></span></h2>`;
    html += `<div class='clock-time'>${time}</div><div class='clock-date'>${date}</div>`;
    el.innerHTML = html;
    const h2 = el.querySelector('h2');
    if (h2) h2.ondblclick = () => makeWidgetTitleEditable(id, 'Clock');
    document.getElementById(`clock-remove-widget-${id}`).onclick = () => removeWidgetBySectionId(id);
  }
  update();
  if (el._clockTimer) clearInterval(el._clockTimer);
  el._clockTimer = setInterval(() => {
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
    const date = new Date().toLocaleDateString();
    const timeDiv = el.querySelector('.clock-time');
    const dateDiv = el.querySelector('.clock-date');
    if (timeDiv) timeDiv.textContent = time;
    if (dateDiv) dateDiv.textContent = date;
  }, 1000);
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
  if (editWidgetId === id) return;
  const el = document.getElementById(id);
  const widget = findWidgetById(id);
  let html = `<h2><i class='fa-solid fa-calculator'></i> ${getWidgetTitle(widget, 'Calculator')}</h2>`;
  html += `<form id='calc-form-${id}' autocomplete='off' style='display:flex;gap:0.5rem;align-items:center;'>
    <input id='calc-input-${id}' type='text' style='flex:1;font-size:1.1rem;padding:4px 8px;' placeholder='2+2*2'>
    <button id='calc-eval-${id}' type='submit' style="color:#22c55e">&#10003;</button>
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
  const h2 = el.querySelector('h2');
  if (h2) h2.ondblclick = () => makeWidgetTitleEditable(id, 'Calculator');
  document.getElementById(`notes-remove-widget-${id}`).onclick = () => removeWidgetBySectionId(id);
}

// Drag and Drop functionality
function initDragAndDrop() {
  const widgets = document.querySelectorAll('.widget-section');
  const zones = document.querySelectorAll('.zone');

  widgets.forEach(widget => {
    widget.setAttribute('draggable', true);
    
    widget.addEventListener('dragstart', e => {
      widget.classList.add('dragging');
      e.dataTransfer.setData('text/plain', widget.id);
    });

    widget.addEventListener('dragend', () => {
      widget.classList.remove('dragging');
    });
  });

  zones.forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      const dragging = document.querySelector('.dragging');
      if (dragging) {
        const afterElement = getDragAfterElement(zone, e.clientY);
        if (afterElement) {
          zone.insertBefore(dragging, afterElement);
        } else {
          zone.appendChild(dragging);
        }
      }
    });

    zone.addEventListener('drop', e => {
      e.preventDefault();
      const widgetId = e.dataTransfer.getData('text/plain');
      const widget = document.getElementById(widgetId);
      if (widget) {
        updateWidgetPositions();
      }
    });
  });
}

function getDragAfterElement(zone, y) {
  const draggableElements = [...zone.querySelectorAll('.widget-section:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateWidgetPositions() {
  const zones = document.querySelectorAll('.zone');
  zoneWidgets = Array.from(zones).map(zone => 
    Array.from(zone.querySelectorAll('.widget-section'))
      .map(widget => getWidgetType(widget))
  );
  saveZoneWidgets();
  renderZones();
}

function renderAll() {
  loadZoneWidgets();
  renderTabsBar();
  renderZones();
  initDragAndDrop();
}

let editWidgetId = null;

function makeWidgetTitleEditable(sectionId, defaultTitle) {
  editWidgetId = sectionId;
  const section = document.getElementById(sectionId);
  const h2 = section.querySelector('h2');
  if (!h2) return;
  const oldTitle = h2.childNodes[1] && h2.childNodes[1].nodeType === 3 ? h2.childNodes[1].textContent.trim() : defaultTitle;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldTitle;
  input.style.fontSize = '1.1em';
  input.style.width = '70%';
  input.style.marginLeft = '8px';
  input.onkeydown = function(e) {
    if (e.key === 'Enter') {
      saveWidgetTitle(sectionId, input.value.trim() || defaultTitle);
      editWidgetId = null;
      location.reload();
    } else if (e.key === 'Escape') {
      editWidgetId = null;
      renderZones();
    }
  };
  input.onblur = function() {
    saveWidgetTitle(sectionId, input.value.trim() || defaultTitle);
    editWidgetId = null;
    location.reload();
  };
  h2.innerHTML = '';
  h2.appendChild(input);
  input.focus();
  input.select();
}

function saveWidgetTitle(sectionId, newTitle) {
  // sectionId = bookmarks-widget-0-0, notes-widget-1-0, ...
  const [type, , zoneIdx, widgetIdx] = sectionId.split('-');
  const idx = parseInt(zoneIdx);
  const widx = parseInt(widgetIdx);
  if (!zoneWidgets[idx][widx]) return;
  if (typeof zoneWidgets[idx][widx] === 'string') {
    zoneWidgets[idx][widx] = {type: zoneWidgets[idx][widx], title: newTitle};
  } else {
    zoneWidgets[idx][widx].title = newTitle;
  }
  saveZoneWidgets();
  renderZones();
}

function findWidgetById(id) {
  // id = type-widget-i-j
  const parts = id.split('-');
  const zone = parseInt(parts[2]);
  const idx = parseInt(parts[3]);
  return zoneWidgets[zone][idx];
}

// Автоматическая очистка "схлопнутых" виджетов
function autoCleanZoneWidgets() {
  let data = getData();
  let changed = false;
  data.pages.forEach(page => {
    if (page.zoneWidgets) {
      let cleaned = page.zoneWidgets.map(zone => zone.filter(w => typeof w === 'string' || (w && w.type)));
      if (JSON.stringify(cleaned) !== JSON.stringify(page.zoneWidgets)) {
        page.zoneWidgets = cleaned;
        changed = true;
      }
    }
  });
  if (changed) setData(data);
}

// Main menu button and dropdown
const mainMenuBtn = document.getElementById('main-menu-btn');
if (mainMenuBtn) {
  mainMenuBtn.onclick = (e) => {
    let menu = document.getElementById('main-menu-popup');
    if (menu) { menu.remove(); return; }
    menu = document.createElement('div');
    menu.id = 'main-menu-popup';
    menu.className = 'main-menu-popup';
    menu.style.position = 'absolute';
    const rect = mainMenuBtn.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.background = '#fff';
    menu.style.border = '1px solid #e0e0e0';
    menu.style.borderRadius = '8px';
    menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    menu.style.padding = '0.5rem 1rem';
    menu.style.zIndex = 1000;
    menu.innerHTML = `
      <button id='export-btn' style='display:block;width:100%;margin-bottom:6px;'>Export</button>
      <button id='import-btn' style='display:block;width:100%;margin-bottom:6px;'>Import</button>
      <button id='about-btn' style='display:block;width:100%;'>About</button>
    `;
    document.body.appendChild(menu);
    document.addEventListener('mousedown', function closeMenu(e) {
      if (!menu.contains(e.target) && e.target !== mainMenuBtn) {
        menu.remove();
        document.removeEventListener('mousedown', closeMenu);
      }
    });
    document.getElementById('export-btn').onclick = () => { exportAllData(); menu.remove(); };
    document.getElementById('import-btn').onclick = () => { importAllData(); menu.remove(); };
    document.getElementById('about-btn').onclick = () => { alert('WidgetDash\nStart page with widgets.\nAll data stored locally.'); menu.remove(); };
  };
}

function exportAllData() {
  const data = localStorage.getItem(STORAGE_KEY);
  const theme = localStorage.getItem('theme');
  const out = JSON.stringify({data: JSON.parse(data), theme: theme || 'light'});
  const blob = new Blob([out], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'widgetdash-backup.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
}

function importAllData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!imported.data || !imported.data.pages) throw new Error('Invalid backup');
        setData(imported.data);
        if (imported.theme) {
          localStorage.setItem('theme', imported.theme);
          setTheme(imported.theme === 'dark');
        }
        renderAll();
        alert('Import successful!');
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
} 