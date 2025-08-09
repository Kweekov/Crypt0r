# Crypt0r — шифратор паролем (PBKDF2 + HMAC)

Одностраничное приложение (SPA) на Vite/React для шифрования и расшифровки текста по парольной фразе. Внутри — выработка ключа через PBKDF2 и поток HMAC‑SHA256 (поблочный) с XOR, а также проверка целостности по HMAC‑тегу. В комплекте — «внутреннее API» и визуализатор прогресса, показывающий этапы работы почти в реальном времени.

## Возможности
- Раздельные страницы: шифрование и расшифровка
- «Хакерская» тёмная тема с неоновыми акцентами
- Визуализация пайплайна: PBKDF2 → поток HMAC → XOR → HMAC‑тег → сборка/парсинг
- Внутреннее API (без сервера): структурированные ответы { success, data?, error? }
- Параметры PBKDF2: соль (base64url), число итераций
- Генератор паролей

## Технологии
- React 19, React Router DOM 7, Vite 7, TypeScript 5
- Tailwind CSS (утилитарные классы + кастомные классы в `src/index.css`)
- GitHub Pages (деплой через GitHub Actions)

## Как запустить локально
```bash
npm i
npm run dev
```
Сборка и предпросмотр прод-версии:
```bash
npm run build
npm run preview
```

## Скрипты
- `npm run dev` — dev-сервер Vite
- `npm run build` — типизация + сборка в `dist`
- `npm run preview` — предпросмотр `dist`
- `npm run clean` — очистка артефактов

## Деплой на GitHub Pages
Проект уже содержит workflow `.github/workflows/deploy-pages.yml`.
1) Закоммитьте изменения в ветку `main`
2) Откройте вкладку Actions и дождитесь успеха «Deploy to GitHub Pages»
3) Сайт: `https://<USER>.github.io/<repo>/` (пример: `https://kweekov.github.io/Crypt0r/`)

Особенности:
- Сборка выполняется с `--base=/<repo>/`
- Для SPA‑роутов добавлен fallback `404.html`
- В `src/main.tsx` настроен `basename: import.meta.env.BASE_URL`

## Архитектура
- `src/utils/crypto.ts` — крипто‑ядро (Web Crypto API)
  - PBKDF2 для выработки ключа
  - Поток HMAC‑SHA256: `HMAC(key, salt || nonce || counter)`
  - XOR с байтами текста
  - HMAC‑тег целостности и сериализация
  - События прогресса через `onProgress`
- `src/services/cryptoApi.ts` — «внутреннее API» (без сервера)
  - `postEncrypt({ plaintext, passphrase, salt?, iterations?, onProgress? })`
  - `postDecrypt({ ciphertext, passphrase, onProgress? })`
  - Возвращает `{ success, data?, error? }`
- `src/pages/*` — страницы `EncryptPage`, `DecryptPage`
- `src/components/ServerVisualizer.tsx` — визуализация событий API
- `src/App.tsx` — layout + навигация, блок «Как это работает»
- `src/index.css` — базовые стили темы (панели, кнопки, поля)

## Как это работает (крипто)
1) PBKDF2: из парольной фразы и соли получается ключ фиксированной длины. Параметр `iterations` повышает стоимость перебора.
2) HMAC‑поток: генерируем блоки `HMAC(key, salt || nonce || counter)`; XOR‑им с байтами текста.
3) Тег целостности: считаем HMAC по заголовку и шифртексту и добавляем в конец. На входе — проверяем.

Формат шифртекста (base64url):
```
version | iterations | saltLen | salt | nonceLen | nonce | ciphertext | tag
```

## Безопасность
- Никогда не переиспользуйте одну и ту же пару (соль, парольная фраза) для разных сообщений
- Увеличивайте `iterations` на современных устройствах (100k–600k)
- Приложение — демонстрационное. Для продакшена используйте проверенные AEAD (например, AES‑GCM) и аудит

## Лицензия
ISC
