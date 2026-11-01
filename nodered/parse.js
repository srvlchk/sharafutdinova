// msg.payload — весь текст лога одной строкой
const T = 2;                                   // период опроса, с
const RANGES = { s1: [0, 100], s2: [0, 100], s3: [0, 10] };
const text = String(msg.payload).replace(/^﻿/, '');
const sql = [];
text.split(/\r?\n/).forEach(raw => {
  const line = raw.trim();
  if (!line) return;
  // строка вида DATA n=3 s1=22.0: делим по пробелам, затем по знаку =
  const parts = line.split(' ');
  const kind = parts[0];                       // DATA или EVENT
  const f = {};
  parts.slice(1).forEach(p => {
    const kv = p.split('=');
    f[kv[0]] = kv[1];
  });
  const n = parseInt(f.n);
  if (isNaN(n)) return;
  const t = n * T;
  if (kind === 'DATA') {
    ['s1', 's2', 's3'].forEach(s => {
      const v = parseFloat(f[s]);
      if (!isNaN(v)) {
        sql.push(`INSERT INTO readings(n,t_s,sensor,value) VALUES(${n},${t},'${s}',${v});`);
      }
      if (isNaN(v) || v < RANGES[s][0] || v > RANGES[s][1]) {
        sql.push(`INSERT INTO events(n,t_s,type,message) VALUES(${n},${t},'FAULT','датчик ${s} вне диапазона');`);
      }
    });
  } else if (kind === 'EVENT') {
    sql.push(`INSERT INTO events(n,t_s,type,message) VALUES(${n},${t},'${f.type}','');`);
  }
});
// выход 1: по одной команде (для необязательного узла sqlite)
const toSqlite = sql.map(s => ({ topic: s.slice(0, -1) }));
// выход 2: один файл load.sql (сначала очищает таблицы, поэтому повторная загрузка не дублирует данные)
const head = 'BEGIN;\nDELETE FROM readings;\nDELETE FROM events;\n' +
  "DELETE FROM sqlite_sequence WHERE name IN ('readings','events');\n";
const toFile = { payload: head + sql.join('\n') + '\nCOMMIT;\n' };
return [toSqlite, toFile];
