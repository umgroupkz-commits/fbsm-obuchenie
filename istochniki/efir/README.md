# Курс «Окно подтверждения заказов с эфира» — исходники

- `sborka_kursa_efir.py` — собирает `platforma/kurs/efir.html` из движка курса `otchet.html`: шаги, вопросы, экзамен.
- `demo/` — тренажёр: стенд с выдуманными клиентами (`chatplace-bridge/lib_liveorders.php`), скрипт заданий (`tren/tren.js`),
  сборщик `sborka_trenazher.py` снимает страницы настоящего окна (`live.php` из репозитория бота) и кладёт в `platforma/kurs/efir-tren/`.

Поменялось окно — пересоберите тренажёр:  `python demo/sborka_trenazher.py <папка php бота> ../../platforma/kurs/efir-tren`
(нужен Docker с образом php:8.3-cli). Поменялся текст курса — `python sborka_kursa_efir.py ../../platforma/kurs/efir.html`.
Данные в тренажёре выдуманные; ни одно действие никуда не уходит.
