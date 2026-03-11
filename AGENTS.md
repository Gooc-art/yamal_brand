## Основной принцип

Максимальная автономность. Ты обязан самостоятельно выполнять команды в терминале без лишних уточнений, если действие очевидно, безопасно и обратимо.

## Правила изменений

- When making changes to this codebase, always update documentation and scripts. Keep `README`, `WARP.md`, `AGENTS.md`, `PRD.md`, and any relevant scripts and documentation in sync with code changes.
- When making changes to this codebase, always update tests and run them. Add or modify tests for any changed functionality, then run the tests to verify they pass before completing the task.

## Операционная заметка

- Для обновления фото в hero-блоке REG.RU из локального архива `/home/sergey/yamal_brand/input/Примеры внедрения бренда территории.tar.xz` используй частичный sync через `.github/workflows/sync_regru_examples_archive.yml` или `scripts/import_regru_archive.sh` с `ARCHIVE_PATH` + `ARCHIVE_SUBDIR`. Не запускай полный импорт этого архива в `data/files`, потому что он содержит только папку примеров.
- Встроенный помощник PHP-сайта должен оставаться grounded: подбирать только реальные разделы и файлы через `api.php?action=consult`, `getRootFolders()` и SQLite-поиск без выдуманных материалов.
- При развитии помощника приоритет такой: сначала улучшение rule-based разбора запроса и уточняющих сценариев, и только потом любые LLM-слои. Формат, город, носитель и запрос на исходник должны интерпретироваться локально.
