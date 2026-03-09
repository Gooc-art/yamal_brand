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
        <div>
          <p class="eyebrow">Веб-версия каталога</p>
          <h1 id="site-title"><?= htmlspecialchars($config['title'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></h1>
          <p class="hero-copy">
            Сайт на PHP и SQLite для REG.RU-хостинга: разделы, поиск, избранное и прямое скачивание.
          </p>
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
          <div id="top-searches" class="chip-row"></div>
        </form>
      </header>

      <section id="setup-banner" class="surface" style="display:none; margin-top:18px; padding:18px 20px;"></section>
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
