<?php
declare(strict_types=1);

require __DIR__ . '/src/site_lib.php';
$config = site_config();
const SITE_CONTENT_VISIBLE = false;

if (!SITE_CONTENT_VISIBLE) {
    header('X-Robots-Tag: noindex, nofollow', true);
    ?><!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?= htmlspecialchars($config['title'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></title>
  </head>
  <body></body>
</html>
<?php
    exit;
}
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
      <header class="portal-header surface">
        <a class="portal-logo" href="/" data-page-link="/">
          <img class="portal-logo-mark" src="<?= htmlspecialchars(asset_url('assets/brand-mark.svg'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" alt="" aria-hidden="true" />
          <span>Бренд Ямал</span>
        </a>
        <nav class="portal-nav" aria-label="Главное меню">
          <a href="/" data-page-link="/" data-nav="home">Главная</a>
          <a href="/catalog" data-page-link="/catalog" data-nav="catalog">Каталог</a>
          <a href="/branding-catalog" data-page-link="/branding-catalog" data-nav="branding">Брендирование</a>
        </nav>
        <button type="button" class="accent-button portal-login-button" data-action="open-login-modal">Войти</button>
        <button type="button" class="ghost-button portal-profile-button" data-action="open-profile" hidden></button>
      </header>

      <main id="home-page" class="route-page route-page-home">
      <section class="hero surface">
        <div class="hero-column hero-column-main">
          <div class="hero-ribbon">
            <img class="brand-mark" src="<?= htmlspecialchars(asset_url('assets/brand-mark.svg'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" alt="" aria-hidden="true" />
            <span>Бренд-портал</span>
          </div>
          <h1>Конструктор бренда Ямала</h1>
          <p class="hero-copy">Выберите макет, заполните данные, загрузите логотип или фото и скачайте результат.</p>
          <div class="hero-actions">
            <a class="accent-button" href="/branding-catalog" data-page-link="/branding-catalog">Брендирование</a>
            <a class="ghost-button" href="/catalog" data-page-link="/catalog">Каталог</a>
          </div>
        </div>
      </section>
      </main>

      <section id="login-modal" class="portal-modal-backdrop" hidden>
        <div class="portal-modal surface" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
          <div class="portal-modal-head">
            <div>
              <p class="eyebrow">Вход</p>
              <h2 id="login-modal-title">Авторизация</h2>
            </div>
            <button type="button" class="ghost-button" data-action="close-login-modal">Закрыть</button>
          </div>
          <section id="account-panel" class="account-panel" aria-live="polite"></section>
        </div>
      </section>

      <section id="catalog-page" class="route-page" hidden>
        <div class="surface page-title-block">
          <div>
            <p class="eyebrow">Библиотека</p>
            <h1>Библиотека брендовых материалов</h1>
            <p>Утверждённые логотипы, брендбуки, шрифты, графика и файлы для работы.</p>
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
        <section class="surface brand-routes-block">
          <div class="block-head brand-routes-head">
            <div>
              <h2>Главное меню</h2>
              <p id="brand-routes-caption" class="brand-routes-caption">Откройте список разделов и быстро перейдите в нужную ветку каталога.</p>
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
                <span>Плотная сетка для быстрого входа.</span>
              </div>
              <span id="brand-routes-current" class="brand-routes-current">Все разделы</span>
            </div>
            <div id="brand-routes" class="brand-route-grid"></div>
          </div>
        </section>
      </section>

      <section id="setup-banner" class="surface setup-banner"></section>

      <section id="branding-page" class="route-page" hidden>
      <section class="surface solution-lab-block" id="solution-lab">
        <div class="breadcrumbs portal-breadcrumbs">Главная / Каталог брендирования</div>
        <div class="block-head solution-lab-head">
          <div>
            <h1 id="solution-lab-title">Каталог брендирования</h1>
            <p id="solution-lab-copy" class="solution-lab-copy">Выберите носитель — создайте макет в фирменном стиле</p>
          </div>
          <button type="button" class="ghost-button" data-action="open-admin-question-modal">Задать вопрос администратору</button>
        </div>
        <div class="solution-lab-toolbar">
          <div id="solution-lab-filters" class="solution-lab-filters"></div>
          <span id="solution-lab-meta" class="solution-lab-meta">8 шаблонов</span>
        </div>
        <div id="solution-lab-grid" class="solution-lab-grid"></div>
      </section>
      </section>

      <section id="profile-page" class="route-page" hidden></section>

      <section id="admin-page" class="route-page" hidden></section>

      <section id="workspace-shell" class="workspace-shell collapsed" hidden>
        <div class="surface workspace-header">
          <div>
            <p class="eyebrow">Рабочая область</p>
            <h2>Каталог и решения</h2>
            <p id="workspace-copy" class="workspace-copy">Рабочая область скрыта. Она откроется автоматически после выбора раздела, поиска или запуска конструктора.</p>
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

      <section id="admin-question-modal" class="portal-modal-backdrop" hidden>
        <div class="portal-modal surface" role="dialog" aria-modal="true" aria-labelledby="admin-question-title">
          <div class="portal-modal-head">
            <div>
              <p class="eyebrow">Вопрос</p>
              <h2 id="admin-question-title">Задать вопрос администратору</h2>
            </div>
            <button type="button" class="ghost-button" data-action="close-admin-question-modal">Закрыть</button>
          </div>
          <form id="admin-question-form" class="portal-form">
            <label><span>Тема</span><input name="title" required></label>
            <label><span>Сообщение</span><textarea name="body" rows="5" required></textarea></label>
            <button type="submit" class="accent-button">Отправить</button>
          </form>
        </div>
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
          <span>Подскажу раздел, файл и следующий шаг</span>
        </span>
      </button>

      <div id="consultant-backdrop" class="consultant-backdrop" data-action="close-consultant" hidden></div>

      <aside id="consultant-panel" class="surface consultant-panel" hidden aria-hidden="true" role="dialog" aria-modal="false" aria-labelledby="consultant-title" aria-describedby="consultant-copy">
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
          <p id="consultant-copy" class="consultant-copy visually-hidden">Опишите задачу одним сообщением. Помощник помнит предыдущий шаг, отвечает на вопросы применения, подсказывает по брендбуку, даёт более глубокий ответ и предлагает только реальные разделы и файлы из каталога.</p>
          <div id="consultant-result" class="consultant-result" role="log" aria-live="polite" aria-relevant="additions text">
            <div class="consultant-chat consultant-chat-home">
              <div class="consultant-turn assistant">
                <div class="consultant-turn-card consultant-assistant-turn">
                  <div class="consultant-response consultant-response-home">
                    <div class="consultant-response-head">
                      <span class="consultant-kicker">Помощник</span>
                      <strong>Опишите задачу одним сообщением</strong>
                      <p>Я сам подберу раздел, нужные файлы, следующий шаг по брендбуку и дам более глубокий ответ. После ответа можно продолжать уточнениями прямо в этом же диалоге.</p>
                    </div>
                    <p class="consultant-home-note">Например: логотип SVG для Салехарда, брендбук PDF, можно ли менять цвет, что делать на тёмном фоне.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <form id="consultant-form" class="consultant-form">
            <label class="search-label" for="consultant-input">Запрос</label>
            <div class="consultant-row">
              <input
                id="consultant-input"
                name="consultant_q"
                type="search"
                placeholder="Например: логотип SVG для Салехарда, можно ли менять цвет"
                autocomplete="off"
              />
              <button type="submit" class="accent-button">Подобрать</button>
            </div>
          </form>
        </div>
      </aside>
    </div>

    <script>
      window.YAMAL_SITE = {
        apiBase: '/api.php?action=',
        downloadBase: '/download.php?id=',
        brandLogoAsset: '<?= htmlspecialchars(asset_url('assets/brand-logo-main.svg'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>',
        brandMarkAsset: '<?= htmlspecialchars(asset_url('assets/brand-mark.svg'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>'
      };
    </script>
    <script src="<?= htmlspecialchars(asset_url('assets/app.js'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"></script>
  </body>
</html>
