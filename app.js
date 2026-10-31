function onKey(k) {
  var v = state.input;
  if (k === 'del') {
    v = v.slice(0, -1);
  } else {
    if (v.length >= 4) return;
    if (v === '0') v = k;
    else v += k;
  }
  state.input = v;
  var dv = $('#durVal');
  dv.textContent = v === '' ? '0' : v;
  dv.classList.toggle('empty', v === '');
}

function setChip(m) {
  state.input = String(m);
  var dv = $('#durVal');
  dv.textContent = state.input;
  dv.classList.remove('empty');
}

function commit() {
  var m = parseInt(state.input, 10);
  if (!m || m <= 0) { toast('先输入分钟数'); return; }
  if (m > 1440) { toast('单条最多 1440 分钟'); return; }

  var rec = {
    id: uid(),
    minutes: m,
    date: state.form.date,
    note: ($('#note').value || '').trim().slice(0, 60),
    createdAt: Date.now()
  };
  state.records.push(rec);
  putRecord(rec);

  state.input = '';
  $('#note').value = '';
  renderAll();

  toast('已记 ' + fmtMin(m), '撤销', function () {
    removeRecord(rec.id);
  });
}

function removeRecord(id) {
  state.records = state.records.filter(function (r) { return r.id !== id; });
  delRecord(id).then(renderAll).catch(renderAll);
}

function shiftMonth(delta) {
  var p = state.month.split('-').map(Number);
  var d = new Date(p[0], p[1] - 1 + delta, 1);
  var nm = d.getFullYear() + '-' + pad2(d.getMonth() + 1);
  if (nm > monthOf(todayStr())) return;
  state.month = nm;
  renderStats();
}

function go(tab) {
  ['entry', 'stats', 'settings'].forEach(function (k) {
    $('#p-' + k).classList.toggle('on', k === tab);
  });
  var btns = document.querySelectorAll('.tabbar button');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('on', btns[i].dataset.tab === tab);
  }
  if (tab === 'stats') renderStats();
  if (tab === 'settings') renderSettings();
  window.scrollTo(0, 0);
}

function onClick(e) {
  var t = e.target.closest ? e.target.closest('button') : null;
  if (!t) return;
  var d = t.dataset;

  if (d.key !== undefined) { onKey(d.key); return; }
  if (d.chip !== undefined) { setChip(Number(d.chip)); return; }
  if (d.tab) { go(d.tab); return; }
  if (t.id === 'saveBtn') { commit(); return; }
  if (t.id === 'prevMonth') { shiftMonth(-1); return; }
  if (t.id === 'nextMonth') { shiftMonth(1); return; }
  if (t.id === 'exportBtn') { exportJSON(); return; }
  if (t.id === 'bannerBtn') { exportJSON(); return; }
  if (t.id === 'bannerClose') { state.bannerDismissed = true; renderBanner(); return; }
  if (t.id === 'importBtn') { $('#importFile').click(); return; }
  if (t.id === 'clearBtn') { askClear(); return; }

  if (t.classList.contains('rdel') && d.id) {
    showModal({
      title: '删除这条记录？',
      actions: [
        { label: '删除', primary: true, onClick: function () { removeRecord(d.id); } },
        { label: '取消' }
      ]
    });
    return;
  }
}

function bind() {
  document.addEventListener('click', onClick);

  $('#dateInput').addEventListener('change', function () {
    state.form.date = this.value || todayStr();
  });

  $('#note').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') this.blur();
  });

  $('#importFile').addEventListener('change', async function () {
    var f = this.files && this.files[0];
    this.value = '';
    if (!f) return;
    var text;
    try { text = await f.text(); } catch (e) { toast('读不出这个文件'); return; }
    var data;
    try { data = JSON.parse(text); } catch (e) { toast('文件不是有效的 JSON'); return; }
    var raw = (data && Array.isArray(data.records)) ? data.records : null;
    if (!raw) { toast('文件里没有找到记录'); return; }
    var recs = raw.map(sanitizeRecord).filter(Boolean);
    showModal({
      title: '导入备份',
      text: '文件里有 ' + recs.length + ' 条记录，当前已有 ' + state.records.length + ' 条。',
      actions: [
        { label: '覆盖现有数据', primary: true, onClick: function () { doImport(recs, 'replace'); } },
        { label: '合并（跳过重复）', onClick: function () { doImport(recs, 'merge'); } },
        { label: '取消' }
      ]
    });
  });

  $('#modal').addEventListener('click', function (e) {
    if (e.target.id === 'modal') hideModal();
  });
}

async function boot() {
  try {
    idb = await idbOpen();
    useIDB = true;
  } catch (e) {
    idb = null;
    useIDB = false;
  }
  if (useIDB) {
    try { state.records = await idbGetAll(); }
    catch (e) { useIDB = false; state.records = LS.read(REC_KEY, []); }
  } else {
    state.records = LS.read(REC_KEY, []);
  }
  loadMeta();
  bind();
  renderAll();
}

boot();
/* == app.js END == */
