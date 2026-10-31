var toastTimer = null;

function toast(msg, actionLabel, actionFn) {
  var el = $('#toast');
  el.innerHTML = '';
  var span = document.createElement('span');
  span.textContent = msg;
  el.appendChild(span);
  if (actionLabel) {
    var b = document.createElement('button');
    b.textContent = actionLabel;
    b.onclick = function () { hideToast(); if (actionFn) actionFn(); };
    el.appendChild(b);
  }
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, actionLabel ? 4000 : 2000);
}

function hideToast() { $('#toast').classList.remove('on'); }

function showModal(opt) {
  var sheet = $('#sheet');
  sheet.innerHTML = '';
  var h = document.createElement('h3');
  h.textContent = opt.title || '';
  sheet.appendChild(h);
  if (opt.text) {
    var p = document.createElement('p');
    p.textContent = opt.text;
    sheet.appendChild(p);
  }
  var box = document.createElement('div');
  box.className = 'btns';
  (opt.actions || []).forEach(function (a) {
    var b = document.createElement('button');
    b.textContent = a.label;
    if (a.primary) b.className = 'primary';
    b.onclick = function () {
      hideModal();
      if (a.onClick) a.onClick();
    };
    box.appendChild(b);
  });
  sheet.appendChild(box);
  $('#modal').classList.add('on');
}

function hideModal() { $('#modal').classList.remove('on'); }

function exportJSON() {
  var payload = {
    app: 'study',
    version: 1,
    exportedAt: new Date().toISOString(),
    records: state.records
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'study-' + todayStr() + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 2000);

  state.meta.lastExportAt = Date.now();
  state.meta.lastExportCount = state.records.length;
  saveMeta();
  state.bannerDismissed = false;
  renderAll();
  toast('已导出 ' + state.records.length + ' 条记录');
}

function sanitizeRecord(r) {
  if (!r || typeof r !== 'object') return null;
  var m = Math.round(Number(r.minutes));
  if (!m || m <= 0) return null;
  if (m > 1440) m = 1440;
  var date = /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : todayStr();
  return {
    id: (typeof r.id === 'string' && r.id) ? r.id : uid(),
    minutes: m,
    date: date,
    note: String(r.note || '').slice(0, 60),
    createdAt: Number(r.createdAt) || Date.now()
  };
}

async function doImport(recs, mode) {
  if (mode === 'replace') {
    state.records = recs;
  } else {
    var ids = {}, keys = {};
    state.records.forEach(function (r) {
      ids[r.id] = 1;
      keys[r.date + '|' + r.minutes + '|' + (r.note || '')] = 1;
    });
    recs.forEach(function (r) {
      if (ids[r.id]) return;
      var k = r.date + '|' + r.minutes + '|' + (r.note || '');
      if (keys[k]) return;
      state.records.push(r);
      ids[r.id] = 1;
      keys[k] = 1;
    });
  }
  await replaceAll();
  renderAll();
  toast('导入完成，现有 ' + state.records.length + ' 条');
}

function askClear() {
  showModal({
    title: '清空所有记录？',
    text: '当前共 ' + state.records.length + ' 条记录，清空后无法恢复。建议先导出备份。',
    actions: [
      { label: '先导出备份', onClick: exportJSON },
      { label: '确认清空', onClick: function () {
          state.records = [];
          replaceAll();
          saveMeta();
          renderAll();
          toast('已清空');
        } },
      { label: '取消' }
    ]
  });
}
/* == data.js END == */
