function renderBanner() {
  var n = state.records.length;
  var show = false, msg = '';
  if (n > 0 && !state.meta.lastExportAt) {
    show = true; msg = '已记 ' + n + ' 条，还没有备份过';
  } else if (n - state.meta.lastExportCount >= 30) {
    show = true; msg = '距上次备份又记了 ' + (n - state.meta.lastExportCount) + ' 条';
  } else if (state.meta.lastExportAt && monthOf(todayStr()) !== monthOf(todayStr(state.meta.lastExportAt))) {
    show = true; msg = '新的一个月了，导出一份备份吧';
  }
  $('#banner').hidden = !show || state.bannerDismissed;
  if (show) $('#bannerText').textContent = msg;
}

function renderEntry() {
  var today = todayStr();
  var todays = state.records.filter(function (r) { return r.date === today; });
  $('#todayTotal').textContent = String(sumMin(todays));
  $('#todayLbl').textContent = '分钟 · ' + (todays.length
    ? '今天 ' + todays.length + ' 条记录'
    : '今天还没记录');

  if ($('#dateInput').value !== state.form.date) $('#dateInput').value = state.form.date;

  var dv = $('#durVal');
  dv.textContent = state.input === '' ? '0' : state.input;
  dv.classList.toggle('empty', state.input === '');

  $('#chips').innerHTML = CHIPS.map(function (m) {
    return '<button data-chip="' + m + '">' + m + '</button>';
  }).join('');

  renderBanner();
}

function renderStats() {
  var m = state.month;
  var list = state.records.filter(function (r) { return monthOf(r.date) === m; });
  var total = sumMin(list);
  var days = daysElapsed(m);
  var avg = days > 0 ? Math.round(total / days) : 0;
  var daysWithData = {};
  list.forEach(function (r) { daysWithData[r.date] = 1; });
  var dcount = Object.keys(daysWithData).length;

  var p = m.split('-');
  $('#monthLabel').textContent = p[0] + '年' + Number(p[1]) + '月';
  $('#nextMonth').disabled = (m >= monthOf(todayStr()));

  $('#mTotal').textContent = fmtMin(total);
  $('#mAvg').textContent = days > 0 ? fmtMin(avg) : '—';
  $('#mSub').textContent = days > 0
    ? list.length + ' 条记录 · 学习 ' + dcount + ' 天 · 按已过 ' + days + ' 天计算日均'
    : '还没到 ' + m + ' 这段日子';

  var allTotal = sumMin(state.records);
  var allDays = {};
  state.records.forEach(function (r) { allDays[r.date] = 1; });
  $('#allTotal').textContent = fmtMin(allTotal);
  $('#allSub').textContent = allTotal
    ? '共有 ' + Object.keys(allDays).length + ' 天有记录 · 平均每天 ' +
        fmtMin(Math.round(allTotal / Object.keys(allDays).length))
    : '还没有任何记录';

  // 按天分组，倒序
  var byDay = {};
  list.forEach(function (r) {
    (byDay[r.date] || (byDay[r.date] = [])).push(r);
  });
  var dates = Object.keys(byDay).sort().reverse();

  if (!dates.length) {
    $('#dayList').innerHTML = '<div class="empty">这个月还没有记录</div>';
    return;
  }

  $('#dayList').innerHTML = dates.map(function (d) {
    var items = byDay[d].slice().sort(function (a, b) {
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
    var head = '<div class="dayhead"><b>' + dayLabel(d) + '</b>' +
      '<span>合计 ' + fmtMin(sumMin(items)) + '</span></div>';
    var rows = items.map(function (r) {
      var txt = r.note ? esc(r.note) : '学习';
      return '<div class="row"><div class="rleft">' + txt + '</div>' +
        '<div class="rright">' + r.minutes + ' 分</div>' +
        '<button class="rdel" data-id="' + esc(r.id) + '">删</button></div>';
    }).join('');
    return head + rows;
  }).join('');
}

function renderSettings() {
  var n = state.records.length;
  var s = '共 ' + n + ' 条记录 · 累计 ' + fmtMin(sumMin(state.records));
  s += state.meta.lastExportAt
    ? ' · 上次导出 ' + todayStr(state.meta.lastExportAt) + '（' + state.meta.lastExportCount + ' 条）'
    : ' · 还没有导出过备份';
  $('#dataState').textContent = s;
}

function renderAll() {
  renderEntry();
  renderStats();
  renderSettings();
}
/* == view.js END == */
