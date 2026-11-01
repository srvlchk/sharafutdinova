// Загрузка лога в базу без Node-RED (то же, что делает поток).
// Запуск из папки проекта:  node load_log.js            (берёт data\log.txt)
//                           node load_log.js data\log_fault.txt
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const T = 2;                                            // период опроса, с
const RANGES = { s1: [0, 100], s2: [0, 100], s3: [0, 10] };
const root = __dirname;
const logFile = path.resolve(root, process.argv[2] || path.join('data', 'log.txt'));
const dbDir = path.join(root, 'db');
const loadFile = path.join(dbDir, 'load.sql');

if (!fs.existsSync(logFile)) { console.error('Нет файла лога: ' + logFile); process.exit(1); }
fs.mkdirSync(dbDir, { recursive: true });

const text = fs.readFileSync(logFile, 'utf8').replace(/^﻿/, '');
const sql = [];
let rows = 0, events = 0;
text.split(/\r?\n/).forEach(raw => {
  const line = raw.trim();
  if (!line) return;
  const parts = line.split(' ');
  const kind = parts[0];
  const f = {};
  parts.slice(1).forEach(p => { const kv = p.split('='); f[kv[0]] = kv[1]; });
  const n = parseInt(f.n);
  if (isNaN(n)) return;
  const t = n * T;
  if (kind === 'DATA') {
    ['s1', 's2', 's3'].forEach(s => {
      const v = parseFloat(f[s]);
      if (!isNaN(v)) { sql.push(`INSERT INTO readings(n,t_s,sensor,value) VALUES(${n},${t},'${s}',${v});`); rows++; }
      if (isNaN(v) || v < RANGES[s][0] || v > RANGES[s][1]) {
        sql.push(`INSERT INTO events(n,t_s,type,message) VALUES(${n},${t},'FAULT','датчик ${s} вне диапазона');`); events++;
      }
    });
  } else if (kind === 'EVENT') {
    sql.push(`INSERT INTO events(n,t_s,type,message) VALUES(${n},${t},'${f.type}','');`); events++;
  }
});
const head = 'BEGIN;\nDELETE FROM readings;\nDELETE FROM events;\n' +
  "DELETE FROM sqlite_sequence WHERE name IN ('readings','events');\n";
fs.writeFileSync(loadFile, head + sql.join('\n') + '\nCOMMIT;\n', 'utf8');
console.log(`Лог: ${logFile}`);
console.log(`Создан db/load.sql: показаний ${rows}, событий ${events}`);

try {
  execFileSync('sqlite3', ['db/variant.db', '.read db/schema.sql', '.read db/load.sql'], { cwd: root, stdio: 'inherit' });
  console.log('Данные загружены в db/variant.db');
} catch (e) {
  console.log('sqlite3 не запустился. Загрузите вручную командой:');
  console.log('sqlite3 db\\variant.db ".read db\\schema.sql" ".read db\\load.sql"');
}
