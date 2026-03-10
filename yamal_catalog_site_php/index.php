<?php
declare(strict_types=1);

require __DIR__ . '/src/site_lib.php';
$config = site_config();
?><!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?= htmlspecialchars($config['title'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></title>
    <link rel="stylesheet" href="<?= htmlspecialchars(asset_url('assets/styles.css'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" />
  </head>
  <body>
    <div class="page-shell">
      <header class="hero surface">
        <div class="hero-column hero-column-main">
          <div class="hero-ribbon">
            <img class="brand-mark" src="<?= htmlspecialchars(asset_url('assets/brand-mark.svg'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" alt="" aria-hidden="true" />
            <span>Официальная библиотека фирменного стиля</span>
          </div>
          <p class="eyebrow">Рабочий каталог бренда Ямала</p>
          <h1 id="site-title"><?= htmlspecialchars($config['title'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></h1>
          <p class="hero-copy">
            Единая точка доступа к логотипам, брендбукам, городским версиям, паттернам, шрифтам и цифровым материалам.
            Интерфейс собран как рабочее продолжение брендбука: сначала понятная система, затем быстрый путь к файлу.
          </p>
          <div class="hero-actions">
            <button type="button" class="accent-button" data-action="search-chip" data-query="брендбук">Открыть брендбуки</button>
            <button type="button" class="ghost-button" data-action="search-chip" data-query="логотип">Перейти к логотипам</button>
            <a class="link-button" href="<?= htmlspecialchars(asset_url('assets/brand-logo-main.svg'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" download>Скачать SVG логотип</a>
          </div>
          <div class="hero-briefing">
            <article class="briefing-card">
              <span class="briefing-kicker">Система</span>
              <strong>Мастер-бренд, юбилейная линия и города не смешиваются между собой.</strong>
              <p>Каталог ведет по иерархии бренда, а не по техническим названиям папок.</p>
            </article>
            <article class="briefing-card">
              <span class="briefing-kicker">Доступ</span>
              <strong>Файл находится через маршруты, поиск, популярные запросы и избранное.</strong>
              <p>Поддерживаются бытовые формулировки, опечатки и запросы без точного знания названия.</p>
            </article>
            <article class="briefing-card">
              <span class="briefing-kicker">Практика</span>
              <strong>Сайт заточен под работу: открыть раздел, проверить формат и сразу скачать.</strong>
              <p>Без лишних переходов, лишнего декора и ручного поиска по структуре хранения.</p>
            </article>
          </div>
        </div>

        <div class="hero-column hero-column-side">
          <div class="hero-dossier">
            <div class="brand-lockup">
              <img class="brand-logo" src="<?= htmlspecialchars(asset_url('assets/brand-logo-main.svg'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" alt="Логотип Бренд Ямал" />
              <div class="brand-lockup-copy">
                <span class="brand-lockup-tag">Мастер-бренд Ямал</span>
                <span class="brand-lockup-subtitle">Основной логотип и постоянный элемент фирменного стиля Ямала.</span>
              </div>
            </div>
            <div class="dossier-grid">
              <article class="dossier-item">
                <span>Опора</span>
                <strong>Логотип, фирменный знак, брендбук</strong>
              </article>
              <article class="dossier-item">
                <span>Контур</span>
                <strong>Города, паттерны, типографика, SVG</strong>
              </article>
              <article class="dossier-item">
                <span>Формат</span>
                <strong>Файл, путь, размер и скачивание в одном месте</strong>
              </article>
            </div>
            <div class="brand-note">
              <strong>Принцип из брендбука</strong>
              <span>Постоянные элементы фирменного стиля используются без произвольных изменений и задают единый визуальный порядок для всех носителей.</span>
            </div>
          </div>

          <form id="search-form" class="search-panel">
            <label class="search-label" for="search-input">Поиск по каталогу</label>
            <div class="search-row">
              <input
                id="search-input"
                name="q"
                type="search"
                placeholder="Например: логотип, брендбук, наклейка, салехард"
                autocomplete="off"
              />
              <button type="submit" class="accent-button">Найти</button>
            </div>
            <div class="search-suggestions">
              <p class="search-meta">Быстрые запросы</p>
              <div id="top-searches" class="chip-row"></div>
            </div>
          </form>
        </div>
      </header>

      <section id="setup-banner" class="surface setup-banner"></section>

      <section class="surface brand-principles">
        <div class="section-heading">
          <p class="eyebrow">Как устроен каталог</p>
          <h2>Редакционный интерфейс для ежедневной работы с бренд-системой</h2>
        </div>
        <div class="principle-grid">
          <article class="principle-card">
            <span class="principle-number">01</span>
            <div>
              <h2>Четкий вход</h2>
              <p>Главная страница показывает не случайные блоки, а основные сценарии работы: брендбук, логотип, городские версии, паттерны и материалы для цифры.</p>
            </div>
          </article>
          <article class="principle-card">
            <span class="principle-number">02</span>
            <div>
              <h2>Понятная иерархия</h2>
              <p>Маршруты построены по системе бренда: мастер-бренд, юбилей, города, знак, цвет, типографика и графика отделены и не спорят друг с другом.</p>
            </div>
          </article>
          <article class="principle-card">
            <span class="principle-number">03</span>
            <div>
              <h2>Рабочий ритм</h2>
              <p>Пользователь видит сначала смысл раздела, затем карточку файла, формат и размер, после чего скачивает материал без лишнего шага.</p>
            </div>
          </article>
        </div>
      </section>

      <section class="surface brand-routes-block">
        <div class="block-head brand-routes-head">
          <div>
            <p class="eyebrow">Маршруты к материалам</p>
            <h2>Основные линии бренд-системы</h2>
          </div>
          <div class="route-actions">
            <button type="button" class="ghost-button" data-action="search-chip" data-query="мастер бренд">Мастер-бренд</button>
            <button type="button" class="ghost-button" data-action="search-chip" data-query="логотип">Логотип</button>
          </div>
        </div>
        <div id="brand-routes" class="brand-route-grid"></div>
      </section>

      <section id="stats-grid" class="stats-grid"></section>

      <main class="layout-grid">
        <aside class="surface sidebar-block">
          <div class="block-head">
            <h2>Разделы</h2>
            <button type="button" class="ghost-button" data-action="go-root">Главная</button>
          </div>
          <div id="root-sections" class="section-list"></div>
        </aside>

        <section class="surface content-block">
          <div class="block-head">
            <div>
              <p class="eyebrow" id="content-mode">Каталог</p>
              <h2 id="content-title">Загрузка...</h2>
            </div>
            <div class="toolbar">
              <button type="button" class="ghost-button" data-action="back">Назад</button>
              <button type="button" class="ghost-button" data-action="go-root">Меню</button>
            </div>
          </div>
          <div id="breadcrumbs" class="breadcrumbs"></div>
          <p id="content-hint" class="content-hint"></p>
          <div id="content-items" class="card-grid"></div>
          <div id="pagination" class="pagination"></div>
        </section>

        <aside class="surface sidepane-block">
          <div class="block-head">
            <h2>Избранное</h2>
            <button type="button" class="ghost-button" data-action="refresh-favorites">Обновить</button>
          </div>
          <div id="favorites-list" class="favorite-list"></div>
          <hr class="divider" />
          <div class="block-head compact">
            <h2>Карточка файла</h2>
          </div>
          <div id="detail-panel" class="detail-panel">
            <p class="detail-empty">Выберите файл, чтобы увидеть путь, размер и скачать его.</p>
          </div>
        </aside>
      </main>
    </div>

    <script>
      window.YAMAL_SITE = {
        apiBase: 'api.php?action=',
        downloadBase: 'download.php?id='
      };
    </script>
    <script src="<?= htmlspecialchars(asset_url('assets/app.js'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"></script>
  </body>
</html>
