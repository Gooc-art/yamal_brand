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
              <span class="brand-lockup-subtitle">Официальный логотип и знак встроены прямо из каталога бренд-материалов.</span>
            </div>
          </div>
          <p class="eyebrow">Открытый бренд-каталог</p>
          <h1 id="site-title"><?= htmlspecialchars($config['title'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></h1>
          <p class="hero-copy">
            Быстрый доступ к логотипам, брендбукам, паттернам, SVG и готовым материалам Ямала.
            Поиск понимает близкие совпадения, а карточки сразу ведут к скачиванию.
          </p>
          <div class="hero-actions">
            <button type="button" class="accent-button" data-action="search-chip" data-query="брендбук">Брендбуки</button>
            <button type="button" class="ghost-button brand-action" data-action="search-chip" data-query="логотип">Логотипы</button>
            <a class="link-button" href="assets/brand-logo-main.svg" download>SVG логотип</a>
          </div>
          <div class="hero-badges">
            <span class="hero-badge">Публичный доступ</span>
            <span class="hero-badge">Умный поиск</span>
            <span class="hero-badge">Прямые скачивания</span>
            <span class="hero-badge">PHP + SQLite</span>
          </div>
          <div id="hero-brief" class="hero-brief">
            <article class="brief-card">
              <p class="brief-label">Статус</p>
              <strong>Подключаю каталог…</strong>
              <span>Проверяю разделы и доступные файлы.</span>
            </article>
            <article class="brief-card">
              <p class="brief-label">Маршруты</p>
              <strong>Собираю меню</strong>
              <span>Скоро появятся главные разделы и быстрые переходы.</span>
            </article>
            <article class="brief-card">
              <p class="brief-label">Поиск</p>
              <strong>Готовлю подсказки</strong>
              <span>Популярные запросы и быстрый старт отрисуются после загрузки.</span>
            </article>
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
          <div class="hero-note">
            <div class="hero-note-mark" aria-hidden="true">
              <img src="assets/brand-mark.svg" alt="" />
            </div>
            <p class="eyebrow">Как пользоваться</p>
            <div class="hero-steps">
              <p><strong>1.</strong> Выбери раздел или запусти поиск по названию файла.</p>
              <p><strong>2.</strong> Открой карточку, чтобы увидеть формат, путь и размер.</p>
              <p><strong>3.</strong> Скачай нужный макет напрямую, без лишних переходов.</p>
            </div>
          </div>
        </div>
      </header>

      <section id="setup-banner" class="surface setup-banner"></section>
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
