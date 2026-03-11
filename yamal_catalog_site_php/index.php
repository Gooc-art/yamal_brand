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
        <div class="hero-column hero-column-media">
          <section class="hero-examples surface">
            <div class="block-head compact hero-examples-head">
              <div>
                <p class="eyebrow">Примеры внедрения бренда</p>
                <h2>Примеры внедрения бренда</h2>
                <p class="hero-examples-note">Живые кейсы из каталога с быстрым просмотром и переключением.</p>
              </div>
              <div id="hero-example-tabs" class="hero-example-tabs"></div>
            </div>
            <div id="hero-example-stage" class="hero-example-stage"></div>
          </section>
        </div>

        <div class="hero-column hero-column-main">
          <div class="hero-ribbon">
            <img class="brand-mark" src="<?= htmlspecialchars(asset_url('assets/brand-mark.svg'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" alt="" aria-hidden="true" />
            <span>Официальная библиотека фирменного стиля</span>
          </div>
          <h1 id="site-title" class="visually-hidden"><?= htmlspecialchars($config['title'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></h1>
          <p class="hero-copy">Логотипы, брендбуки, SVG, шрифты и материалы региона в одном каталоге.</p>
          <div class="hero-actions">
            <button type="button" class="accent-button" data-action="search-chip" data-query="брендбук">Брендбуки</button>
            <button type="button" class="ghost-button" data-action="search-chip" data-query="логотип">Логотипы</button>
            <button type="button" class="ghost-button catalog-mode-toggle" data-action="toggle-catalog-mode">Скрыть витрину</button>
            <a class="link-button" href="<?= htmlspecialchars(asset_url('assets/brand-logo-main.svg'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" download>SVG логотип</a>
          </div>

          <form id="search-form" class="search-panel hero-search-panel">
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
            <p class="eyebrow">Навигация</p>
            <h2>Главное меню</h2>
            <p id="brand-routes-caption" class="brand-routes-caption">Откройте список разделов и быстро перейдите в нужную ветку каталога без отдельного нижнего меню.</p>
          </div>
          <div class="brand-routes-actions">
            <button
              type="button"
              id="brand-routes-toggle"
              class="accent-button brand-routes-toggle"
              data-action="toggle-brand-routes"
              aria-expanded="false"
              aria-controls="brand-routes-panel"
            >
              <span class="brand-routes-toggle-copy">
                <strong id="brand-routes-toggle-label">Открыть разделы</strong>
                <span id="brand-routes-toggle-meta">Все разделы каталога</span>
              </span>
              <span class="brand-routes-toggle-icon" aria-hidden="true">↓</span>
            </button>
          </div>
        </div>
        <div id="brand-routes-panel" class="brand-routes-panel" hidden>
          <div class="brand-routes-panel-head">
            <div class="brand-routes-panel-copy">
              <strong>Разделы каталога</strong>
              <span>Плотная сетка для быстрого входа без отдельного root-каталога внизу.</span>
            </div>
            <span id="brand-routes-current" class="brand-routes-current">Все разделы</span>
          </div>
          <div id="brand-routes" class="brand-route-grid"></div>
        </div>
      </section>

      <section id="workspace-shell" class="workspace-shell collapsed" hidden>
        <div class="surface workspace-header">
          <div>
            <p class="eyebrow">Рабочая область</p>
            <h2>Материалы раздела</h2>
            <p id="workspace-copy" class="workspace-copy">Рабочая область скрыта. Она откроется автоматически после выбора раздела или поиска.</p>
          </div>
          <div class="workspace-actions">
            <button type="button" class="ghost-button catalog-mode-toggle" data-action="toggle-catalog-mode">Скрыть витрину</button>
            <button type="button" id="workspace-toggle" class="ghost-button" data-action="toggle-workspace">Показать рабочую область</button>
          </div>
        </div>

      <main id="workspace-grid" class="workspace-composition" hidden>
        <section class="surface content-block workspace-stage">
          <div class="block-head stage-head">
            <div>
              <p class="eyebrow" id="content-mode">Раздел</p>
              <h2 id="content-title">Загрузка...</h2>
            </div>
            <div class="toolbar">
              <button type="button" class="ghost-button" data-action="back">Назад</button>
              <button type="button" class="ghost-button" data-action="go-root">Меню</button>
              <button type="button" class="ghost-button" data-action="copy-current-link">Скопировать ссылку</button>
            </div>
          </div>
          <div id="section-switcher" class="section-switcher" hidden></div>
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

      <button
        type="button"
        id="consultant-toggle"
        class="consultant-toggle"
        data-action="toggle-consultant"
        aria-expanded="false"
        aria-controls="consultant-panel"
      >
        <span class="consultant-toggle-mark" aria-hidden="true">?</span>
        <span class="consultant-toggle-copy">
          <strong>Помощник</strong>
          <span>Подскажу раздел и файл</span>
        </span>
      </button>

      <div id="consultant-backdrop" class="consultant-backdrop" data-action="close-consultant" hidden></div>

      <aside id="consultant-panel" class="surface consultant-panel" hidden aria-hidden="true">
        <div class="block-head compact consultant-head">
          <div>
            <p class="eyebrow">Навигатор</p>
            <h2 id="consultant-title">Помощник по каталогу</h2>
          </div>
          <div class="consultant-head-actions">
            <button type="button" class="ghost-button consultant-clear-button" data-action="clear-consultant">Очистить</button>
            <button type="button" class="ghost-button close-consultant-button" data-action="close-consultant">Закрыть</button>
          </div>
        </div>
        <div class="consultant-body">
          <p id="consultant-copy" class="consultant-copy">Опишите задачу или выберите готовый сценарий. Помощник помнит предыдущий шаг, отвечает на вопросы применения, подсказывает по брендбуку и предлагает только реальные разделы и файлы из каталога.</p>
          <div id="consultant-intents" class="consultant-intents"></div>
          <form id="consultant-form" class="consultant-form">
            <label class="search-label" for="consultant-input">Запрос</label>
            <div class="consultant-row">
              <input
                id="consultant-input"
                name="consultant_q"
                type="search"
                placeholder="Например: нужен логотип в SVG"
                autocomplete="off"
              />
              <button type="submit" class="accent-button">Подобрать</button>
            </div>
          </form>
          <div id="consultant-result" class="consultant-result">
            <div class="panel-empty">
              <strong>С чего начать</strong>
              <span>Выберите сценарий выше или напишите короткий запрос, а потом уточняйте следующими сообщениями про фон, подрядчика или согласование.</span>
            </div>
          </div>
        </div>
      </aside>
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
