-- 1. Десять последних показаний
SELECT * FROM readings ORDER BY id DESC LIMIT 10;

-- 2. Минимум, среднее и максимум по каждому датчику
SELECT sensor, MIN(value) AS min_v, ROUND(AVG(value), 2) AS avg_v, MAX(value) AS max_v 
FROM readings GROUP BY sensor;

-- 3. Все события по порядку
SELECT * FROM events ORDER BY id;