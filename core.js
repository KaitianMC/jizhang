function $(s) { return document.querySelector(s); }
function pad2(n) { return String(n).padStart(2, '0'); }
var CHIPS = [15, 30, 45, 60, 90];
var WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'r' + Date.now().toString(36) + Math.random().toString(16).slice(2, 8);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function todayStr(ts) {
  var d = ts ? new Date(ts) : new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function monthOf(ds) { return String(ds).slice(0, 7); }

// 分钟 -> 「1 小时 30 分」
function fmtMin(m) {
  m = Math.round(m || 0);
  if (m < 60) return m + ' 分钟';
  var h = Math.floor(m / 60), r = m % 60;
  return h + ' 小时' + (r ? ' ' + r + ' 分' : '');
}

// 日期 -> 「10月31日 周五」
function dayLabel(ds) {
  var p = ds.split('-').map(Number);
  var d = new Date(p[0], p[1] - 1, p[2]);
  return p[1] + '月' + p[2] + '日 ' + WEEK[d.getDay()];
}

var REC_KEY = 'study.records.v1';
var META_KEY = 'study.meta.v1';
var idb = null;
var useIDB = false;

var LS = {
  read: function (k, d) {
    try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }
    catch (e) { return d; }
  },
  write: function (k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { return false; }
  }
};

function idbOpen() {
  return new Promise(function (resolve, reject) {
    if (!window.indexedDB) { reject(new Error('no indexedDB')); return; }
    var req;
    try { req = indexedDB.open('study', 1); } catch (e) { reject(e); return; }
    req.onupgradeneeded = function () {
      var db = req.result;
      if (!db.objectStoreNames.contains('records')) {
        db.createObjectStore('records', { keyPath: 'id' });
      }
    };
    req.onsuccess = function () { resolve(req.result); };
    req.onerror = function () { reject(req.error || new Error('open failed')); };
    req.onblocked = function () { reject(new Error('blocked')); };
  });
}

function idbGetAll() {
  return new Promise(function (resolve, reject) {
    var t;
    try { t = idb.transaction('records', 'readonly'); } catch (e) { reject(e); return; }
    var rq = t.objectStore('records').getAll();
    rq.onsuccess = function () { resolve(rq.result || []); };
    rq.onerror = function () { reject(rq.error); };
  });
}

function idbPut(rec) {
  return new Promise(function (resolve, reject) {
    var t;
    try { t = idb.transaction('records', 'readwrite'); } catch (e) { reject(e); return; }
    t.objectStore('records').put(rec);
    t.oncomplete = function () { resolve(); };
    t.onerror = function () { reject(t.error); };
  });
}

function idbDelete(id) {
  return new Promise(function (resolve, reject) {
    var t;
    try { t = idb.transaction('records', 'readwrite'); } catch (e) { reject(e); return; }
    t.objectStore('records').delete(id);
    t.oncomplete = function () { resolve(); };
    t.onerror = function () { reject(t.error); };
  });
}

function idbReplaceAll(list) {
  return new Promise(function (resolve, reject) {
    var t;
    try { t = idb.transaction('records', 'readwrite'); } catch (e) { reject(e); return; }
    var s = t.objectStore('records');
    s.clear();
    list.forEach(function (r) { s.put(r); });
    t.oncomplete = function () { resolve(); };
    t.onerror = function () { reject(t.error); };
  });
}

async function putRecord(rec) {
  if (useIDB) { try { await idbPut(rec); return; } catch (e) { useIDB = false; } }
  LS.write(REC_KEY, state.records);
}

async function delRecord(id) {
  if (useIDB) { try { await idbDelete(id); return; } catch (e) { useIDB = false; } }
  LS.write(REC_KEY, state.records);
}

async function replaceAll() {
  if (useIDB) { try { await idbReplaceAll(state.records); return; } catch (e) { useIDB = false; } }
  LS.write(REC_KEY, state.records);
}

var state = {
  records: [],
  meta: { lastExportAt: 0, lastExportCount: 0 },
  form: { date: todayStr() },
  input: '',
  month: monthOf(todayStr()),
  bannerDismissed: false
};

function loadMeta() { state.meta = LS.read(META_KEY, { lastExportAt: 0, lastExportCount: 0 }); }
function saveMeta() { LS.write(META_KEY, state.meta); }

function sumMin(list) {
  return list.reduce(function (s, r) { return s + r.minutes; }, 0);
}

// 某月已过天数（用于日均）
function daysElapsed(month) {
  var p = month.split('-').map(Number);
  var dim = new Date(p[0], p[1], 0).getDate();
  var nowM = monthOf(todayStr());
  if (month === nowM) return new Date().getDate();
  if (month > nowM) return 0;
  return dim;
}
/* == core.js END == */
