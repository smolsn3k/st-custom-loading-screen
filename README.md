# Custom Loading Screen for SillyTavern

Restyles SillyTavern's startup loader: your own picture (PNG, JPG, WebP, SVG or animated GIF), a progress bar, and optional funny loading phrases. Works on PC and mobile, in English and Russian.

*Русская версия ниже.*

## Features

- **Custom picture** instead of the SillyTavern logo: upload a file or paste a link. Animated GIFs keep their animation.
- **Picture size and shape**: as is, circle or rounded.
- **Progress bar** with an optional percentage.
- **Funny phrases** (on/off): jokes like "Sending your chats to your mom…". They are text only. The extension never reads, sends or changes your chats, characters or any other data.
- **English and Russian**: automatic, or chosen manually. This applies to both the loading screen and the settings panel.
- **Accent color** for the bar and glow.
- **Preview button** to see the result without reloading.
- **Lightweight**: no extra screen, no artificial delay. It restyles SillyTavern's own loader and disappears exactly when SillyTavern is ready.

## Install

1. In SillyTavern open **Extensions** and press **Install extension**.
2. Paste the repository link and confirm:

   ```
   https://github.com/smolsn3k/st-custom-loading-screen
   ```

3. Hard-refresh the page (or clear the site cache in your mobile browser).
4. Open **Extensions** and find **Custom Loading Screen**.

To update later, use the update button next to the extension in the Extensions list.

Manual install (optional): copy the files into `SillyTavern/data/<your-user>/extensions/custom-loading-screen/`, so that `manifest.json`, `index.js` and `style.css` are directly inside that folder.

## Settings

| Setting | What it does |
| --- | --- |
| Enable | Turns the custom loading screen on or off |
| Language | Auto, English or Русский |
| Loading picture | Upload, paste a link, or press Default to return to the SillyTavern logo |
| Picture size | 64–320 px |
| Picture shape | As is, circle, rounded |
| Funny loading phrases | Rotating jokes instead of plain status text |
| Show percentage | Shows or hides the number under the bar |
| Accent color | Color of the bar and the glow |
| Preview | Shows the loading screen for a few seconds |

## Notes

- Extensions load partway through startup, so the original loader appears for a brief moment before this one takes over. The bar starts at about 35% for that reason.
- The percentage is an estimate. SillyTavern does not report real loading progress, so the bar eases toward about 92% and jumps to 100% when the app is ready.
- Uploaded pictures are saved as normal user files. If the upload is not possible, files up to 1.5 MB are stored inside the settings instead.
- If the picture cannot be loaded, SillyTavern's own logo is shown.
- Made for current SillyTavern versions that use the splash loader ("Initializing…"). The preview button needs the same version.
- Animations are disabled if your device is set to reduced motion.

## Troubleshooting

- **Nothing changed:** make sure the extension is enabled, the folder name is correct, and you did a hard refresh.
- **Still nothing:** open the browser console and look for messages starting with `[Custom Loading Screen]`.
- **Picture does not show:** check the link opens in a browser, or upload the file instead.

---

# Свой экран загрузки для SillyTavern

Меняет стартовый экран загрузки SillyTavern: своя картинка (PNG, JPG, WebP, SVG или анимированный GIF), полоса прогресса и необязательные смешные фразы. Работает на ПК и телефоне, на английском и русском.

## Возможности

- **Своя картинка** вместо логотипа SillyTavern: загрузите файл или вставьте ссылку. Анимация GIF сохраняется.
- **Размер и форма картинки**: как есть, круг или скругление.
- **Полоса прогресса** с необязательными процентами.
- **Смешные фразы** (вкл/выкл): шутки вроде «Отправляем ваши чаты маме…». Это только текст. Расширение никогда не читает, не отправляет и не меняет ваши чаты, персонажей и другие данные.
- **Русский и английский**: автоматически или вручную. Относится и к экрану загрузки, и к панели настроек.
- **Акцентный цвет** для полосы и свечения.
- **Кнопка предпросмотра**, чтобы посмотреть результат без перезагрузки.
- **Лёгкое**: без лишнего экрана и искусственной задержки. Оно оформляет родной экран загрузки SillyTavern и исчезает ровно тогда, когда SillyTavern готов.

## Установка

1. В SillyTavern откройте **Расширения** и нажмите **Install extension**.
2. Вставьте ссылку на репозиторий и подтвердите:

   ```
   https://github.com/smolsn3k/st-custom-loading-screen
   ```

3. Обновите страницу с очисткой кэша (или очистите кэш сайта в браузере на телефоне).
4. Откройте **Расширения** и найдите **Свой экран загрузки**.

Для обновления позже используйте кнопку обновления рядом с расширением в списке.

Ручная установка (необязательно): скопируйте файлы в `SillyTavern/data/<ваш-пользователь>/extensions/custom-loading-screen/`, чтобы `manifest.json`, `index.js` и `style.css` лежали прямо в этой папке.

## Настройки

| Настройка | Что делает |
| --- | --- |
| Включить | Включает или выключает свой экран загрузки |
| Язык | Авто, English или Русский |
| Картинка загрузки | Загрузить, вставить ссылку или нажать «По умолчанию», чтобы вернуть логотип SillyTavern |
| Размер картинки | 64–320 px |
| Форма картинки | Как есть, круг, скругление |
| Смешные фразы | Меняющиеся шутки вместо обычного статуса |
| Показывать проценты | Показывает или скрывает число под полосой |
| Акцентный цвет | Цвет полосы и свечения |
| Предпросмотр | Показывает экран загрузки на несколько секунд |

## Примечания

- Расширения загружаются в середине запуска, поэтому на короткое мгновение виден оригинальный экран, а потом его заменяет этот. Поэтому полоса стартует примерно с 35%.
- Процент приблизительный. SillyTavern не сообщает реальный прогресс, поэтому полоса плавно доходит примерно до 92% и прыгает на 100%, когда приложение готово.
- Загруженные картинки сохраняются как обычные пользовательские файлы. Если загрузка невозможна, файлы до 1,5 МБ хранятся внутри настроек.
- Если картинку не удалось загрузить, показывается родной логотип SillyTavern.
- Рассчитано на актуальные версии SillyTavern с экраном «Initializing…». Предпросмотр работает в тех же версиях.
- Анимации отключаются, если на устройстве включено уменьшение движения.

## Если что-то не работает

- **Ничего не изменилось:** проверьте, что расширение включено, имя папки верное, и обновите страницу с очисткой кэша.
- **Всё равно ничего:** откройте консоль браузера и поищите сообщения, начинающиеся с `[Custom Loading Screen]`.
- **Картинка не показывается:** проверьте, что ссылка открывается в браузере, или загрузите файл.
