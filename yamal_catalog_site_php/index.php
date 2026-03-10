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
    <link rel="stylesheet" href="assets/styles.css" />
  </head>
  <body>
    <div class="page-shell">
      <header class="hero surface">
        <div class="hero-main">
          <div class="brand-lockup">
            <img class="brand-logo" src="assets/brand-logo-main.svg" alt="Логотип Бренд Ямал" />
            <div class="brand-lockup-copy">
              <span class="brand-lockup-tag">Мастер-бренд Ямал</span>
              <span class="brand-lockup-subtitle">Основной логотип и постоянный элемент фирменного стиля Ямала.</span>
            </div>
          </div>
          <p class="eyebrow">Руководство по использованию фирменного стиля</p>
          <h1 id="site-title"><?= htmlspecialchars($config['title'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></h1>
          <p class="hero-copy">
            Каталог бренд-материалов Ямала: логотип, фирменный знак, брендбуки, городские версии,
            паттерны, шрифты и цифровые материалы. Все собрано в понятную структуру и готово к скачиванию.
          </p>
          <div class="hero-actions">
            <button type="button" class="accent-button" data-action="search-chip" data-query="брендбук">Открыть брендбуки</button>
            <button type="button" class="ghost-button brand-action" data-action="search-chip" data-query="логотип">Перейти к логотипам</button>
            <a class="link-button" href="assets/brand-logo-main.svg" download>Скачать SVG логотип</a>
          </div>
          <div class="brand-note">
            <strong>Принцип из брендбука:</strong>
            <span>постоянные элементы фирменного стиля используются без произвольных изменений и служат опорой для всех носителей.</span>
          </div>
        </div>
        <div class="hero-side">
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
          <div class="hero-summary">
            <p class="eyebrow">Основа брендбука</p>
            <ul class="hero-summary-list">
              <li>Логотип, фирменный знак и правила использования.</li>
              <li>Мастер-бренд, юбилейная линия и брендбуки городов.</li>
              <li>Паттерны, шрифты, SVG и цифровые материалы.</li>
            </ul>
          </div>
        </div>
      </header>

      <section id="setup-banner" class="surface setup-banner"></section>
      <section class="surface brand-principles">
        <article class="principle-card">
          <span class="principle-number">01</span>
          <div>
            <h2>Единая система</h2>
            <p>Логотип, знак, цвет, шрифт и графические элементы работают как одна система, а не как отдельные файлы.</p>
          </div>
        </article>
        <article class="principle-card">
          <span class="principle-number">02</span>
          <div>
            <h2>Понятная иерархия</h2>
            <p>Мастер-бренд, юбилейная линия и региональные версии разделены, чтобы не смешивать разные уровни идентичности.</p>
          </div>
        </article>
        <article class="principle-card">
          <span class="principle-number">03</span>
          <div>
            <h2>Рабочий каталог</h2>
            <p>Сначала понятный путь к материалу, потом скачивание. Без лишних лозунгов, случайных визуальных жестов и шумных блоков.</p>
          </div>
        </article>
      </section>

      <section class="surface brand-routes-block">
        <div class="block-head brand-routes-head">
          <div>
            <p class="eyebrow">Стандарты бренда Ямала</p>
            <h2>Навигация по разделам брендбука</h2>
          </div>
          <button type="button" class="ghost-button" data-action="search-chip" data-query="мастер бренд">Мастер-бренд</button>
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
    <script src="assets/app.js"></script>
  </body>
</html>
