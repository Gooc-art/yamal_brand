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
          <h1 id="site-title"><?= htmlspecialchars($config['title'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></h1>
          <p class="hero-copy">Логотипы, брендбуки, SVG, шрифты и материалы региона в одном каталоге.</p>
          <div class="hero-actions">
            <button type="button" class="accent-button" data-action="search-chip" data-query="брендбук">Брендбуки</button>
            <button type="button" class="ghost-button" data-action="search-chip" data-query="логотип">Логотипы</button>
            <button type="button" class="ghost-button catalog-mode-toggle" data-action="toggle-catalog-mode">Только каталог</button>
            <a class="link-button" href="<?= htmlspecialchars(asset_url('assets/brand-logo-main.svg'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" download>SVG логотип</a>
          </div>
        </div>

        <div class="hero-column hero-column-side">
          <div class="hero-dossier">
            <div class="brand-lockup">
              <img class="brand-logo" src="<?= htmlspecialchars(asset_url('assets/brand-logo-main.svg'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" alt="Логотип Бренд Ямал" />
              <div class="brand-lockup-copy">
                <span class="brand-lockup-tag">Мастер-бренд Ямал</span>
                <span class="brand-lockup-subtitle">Основной логотип и знак региона.</span>
              </div>
            </div>
            <div class="dossier-grid">
              <article class="dossier-item">
                <span>Материалы</span>
                <strong>Логотипы, брендбуки, SVG</strong>
              </article>
              <article class="dossier-item">
                <span>Действия</span>
                <strong>Поиск, разделы, скачивание</strong>
              </article>
            </div>
          </div>

          <form id="search-form" class="search-panel">
            <label class="search-label" for="search-input">Поиск</label>
            <div class="search-row">
              <input
                id="search-input"
                name="q"
                type="search"
                placeholder="Логотип, брендбук, Салехард, наклейка"
                autocomplete="off"
              />
              <button type="submit" class="accent-button">Найти</button>
            </div>
            <div class="search-suggestions">
              <p class="search-meta">Быстрые</p>
              <div id="top-searches" class="chip-row"></div>
            </div>
          </form>
        </div>
      </header>

      <section id="setup-banner" class="surface setup-banner"></section>

      <section class="surface brand-routes-block">
        <div class="block-head brand-routes-head">
          <div>
            <p class="eyebrow">Разделы</p>
            <h2>Маршруты</h2>
          </div>
          <div class="route-actions">
            <button type="button" class="ghost-button" data-action="search-chip" data-query="мастер бренд">Мастер-бренд</button>
            <button type="button" class="ghost-button" data-action="search-chip" data-query="логотип">Логотип</button>
          </div>
        </div>
        <div id="brand-routes" class="brand-route-grid"></div>
      </section>

      <section class="surface showcase-block">
        <div class="block-head showcase-head">
          <div>
            <p class="eyebrow">Файлы</p>
            <h2>Подборки</h2>
          </div>
          <button type="button" class="ghost-button" data-action="search-chip" data-query="брендбук ямал мастер pdf">PDF брендбук</button>
        </div>
        <div id="featured-shelves" class="feature-grid"></div>
      </section>

      <section id="stats-grid" class="stats-grid"></section>

      <section id="workspace-shell" class="workspace-shell">
        <div class="surface workspace-header">
          <div>
            <p class="eyebrow">Каталог</p>
            <h2>Разделы и файлы</h2>
            <p id="workspace-copy" class="workspace-copy">Разделы слева, результаты в центре.</p>
          </div>
          <div class="workspace-actions">
            <button type="button" class="ghost-button catalog-mode-toggle" data-action="toggle-catalog-mode">Только каталог</button>
            <button type="button" id="workspace-toggle" class="ghost-button" data-action="toggle-workspace">Скрыть рабочую область</button>
          </div>
        </div>

      <main id="workspace-grid" class="workspace-composition">
        <aside class="workspace-rail">
          <section class="surface rail-panel rail-panel-sections">
            <div class="block-head rail-head">
              <div>
                <h2>Разделы</h2>
              </div>
              <button type="button" class="ghost-button" data-action="go-root">Главная</button>
            </div>
            <div id="root-sections" class="section-list"></div>
          </section>

          <section class="surface rail-panel rail-panel-favorites">
            <div class="block-head rail-head compact">
              <div>
                <h2>Избранное</h2>
              </div>
              <button type="button" class="ghost-button" data-action="refresh-favorites">Обновить</button>
            </div>
            <div id="favorites-list" class="favorite-list"></div>
          </section>
        </aside>

        <section class="surface content-block workspace-stage">
          <div class="block-head stage-head">
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
      </main>
      <div id="inspector-backdrop" class="inspector-backdrop" data-action="close-inspector" hidden></div>
      <aside id="workspace-inspector" class="surface workspace-inspector" aria-hidden="true">
        <div class="block-head compact inspector-head">
          <div>
            <h2>Файл</h2>
          </div>
          <button type="button" class="ghost-button close-inspector-button" data-action="close-inspector">Закрыть</button>
        </div>
        <div id="detail-panel" class="detail-panel">
          <p class="detail-empty">Выберите материал.</p>
        </div>
      </aside>
      </section>
    </div>

    <script>
      window.YAMAL_SITE = {
        apiBase: 'api.php?action=',
        downloadBase: 'download.php?id=',
        brandLogoAsset: '<?= htmlspecialchars(asset_url('assets/brand-logo-main.svg'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>',
        brandMarkAsset: '<?= htmlspecialchars(asset_url('assets/brand-mark.svg'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>'
      };
    </script>
    <script src="<?= htmlspecialchars(asset_url('assets/app.js'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"></script>
  </body>
</html>
