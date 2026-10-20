// Custom Loading Screen for SillyTavern
// Cosmetic only: this extension never reads, sends or touches chats, characters or any other data.

import { eventSource, event_types, saveSettingsDebounced, getRequestHeaders } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';

const MODULE = 'custom_loading_screen';
const MAX_INLINE_BYTES = 1.5 * 1024 * 1024;

const DEFAULTS = {
    enabled: true,
    language: 'auto', // auto | en | ru
    image: '',        // '' = built-in icon, otherwise URL / path / data URL
    size: 140,
    shape: 'original', // original | circle | rounded
    funny: true,
    showPercent: true,
    accent: '#8b7bff',
    minTime: 1.5,
};

/* ------------------------------------------------------------------ */
/* Texts                                                               */
/* ------------------------------------------------------------------ */

const I18N = {
    en: {
        title: 'Custom Loading Screen',
        enabled: 'Enable custom loading screen',
        language: 'Language',
        langAuto: 'Auto',
        picture: 'Loading picture',
        upload: 'Upload',
        reset: 'Default',
        urlPh: 'or paste an image / GIF link',
        hintPic: 'PNG, JPG, WebP, SVG or GIF. Animated GIFs keep their animation.',
        size: 'Picture size',
        shape: 'Picture shape',
        shapeOriginal: 'As is',
        shapeCircle: 'Circle',
        shapeRounded: 'Rounded',
        funny: 'Funny loading phrases',
        funnyHint: 'Just jokes for fun. Nothing is read, sent or shared.',
        percent: 'Show percentage',
        accent: 'Accent color',
        minTime: 'Minimum display time',
        preview: 'Preview',
        sec: 's',
        badFile: 'Please choose an image file.',
        badUrl: 'That link does not look like an image address.',
        uploadFail: 'Upload failed and the file is too big to keep inline. Try a smaller image or paste a link.',
        stages: [
            [0, 'Waking things up…'],
            [25, 'Loading extensions…'],
            [55, 'Fetching characters…'],
            [80, 'Setting the stage…'],
            [95, 'Almost there…'],
        ],
        phrases: [
            'Sending your chats to your mom…',
            'Teaching the bots to pretend they never saw your last message…',
            'Asking the AI to calm down with the drama…',
            'Counting how many times you said “one more message and I sleep”…',
            'Convincing the bot that you are not a robot…',
            'Bribing the context window for a little more space…',
            'Feeding the hamsters that power the server…',
            'Dusting off your 47 unfinished chats…',
            'Rolling for initiative…',
            'Untangling the lorebook spaghetti…',
            'Politely waking up the GPUs…',
            'Making the characters look busy…',
            'Warming up the tokens…',
            'Pretending to be productive…',
            'Hiding your search history from the lorebooks…',
        ],
    },
    ru: {
        title: 'Свой экран загрузки',
        enabled: 'Включить свой экран загрузки',
        language: 'Язык',
        langAuto: 'Авто',
        picture: 'Картинка загрузки',
        upload: 'Загрузить',
        reset: 'По умолчанию',
        urlPh: 'или вставьте ссылку на картинку / GIF',
        hintPic: 'PNG, JPG, WebP, SVG или GIF. Анимация GIF сохраняется.',
        size: 'Размер картинки',
        shape: 'Форма картинки',
        shapeOriginal: 'Как есть',
        shapeCircle: 'Круг',
        shapeRounded: 'Скругление',
        funny: 'Смешные фразы при загрузке',
        funnyHint: 'Просто шутки. Ничего не читается, не отправляется и не передаётся.',
        percent: 'Показывать проценты',
        accent: 'Акцентный цвет',
        minTime: 'Минимальное время показа',
        preview: 'Предпросмотр',
        sec: 'с',
        badFile: 'Выберите файл с картинкой.',
        badUrl: 'Эта ссылка не похожа на адрес картинки.',
        uploadFail: 'Не удалось загрузить файл, а хранить его внутри настроек слишком тяжело. Возьмите картинку полегче или вставьте ссылку.',
        stages: [
            [0, 'Просыпаемся…'],
            [25, 'Загружаем расширения…'],
            [55, 'Подтягиваем персонажей…'],
            [80, 'Готовим сцену…'],
            [95, 'Почти готово…'],
        ],
        phrases: [
            'Отправляем ваши чаты маме…',
            'Учим ботов делать вид, что они не видели ваше последнее сообщение…',
            'Просим ИИ быть менее драматичным…',
            'Считаем, сколько раз вы сказали «ещё одно сообщение и спать»…',
            'Убеждаем бота, что вы не робот…',
            'Подкупаем контекстное окно, чтобы дало ещё места…',
            'Кормим хомяков, которые питают сервер…',
            'Сдуваем пыль с ваших 47 недописанных чатов…',
            'Бросаем кубик на инициативу…',
            'Распутываем спагетти из лорбуков…',
            'Вежливо будим видеокарты…',
            'Заставляем персонажей выглядеть занятыми…',
            'Прогреваем токены…',
            'Делаем вид, что работаем…',
            'Прячем вашу историю поиска от лорбуков…',
        ],
    },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const isHex = (c) => /^#[0-9a-f]{6}$/i.test(String(c));

function getSettings() {
    if (!extension_settings[MODULE]) extension_settings[MODULE] = {};
    const s = extension_settings[MODULE];
    for (const [k, v] of Object.entries(DEFAULTS)) {
        if (s[k] === undefined) s[k] = v;
    }
    return s;
}

function getLang() {
    const s = getSettings();
    if (s.language === 'en' || s.language === 'ru') return s.language;
    const guess = String(localStorage.getItem('language') || navigator.language || 'en').toLowerCase();
    return guess.startsWith('ru') ? 'ru' : 'en';
}

function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:\/\/|data:image\/|blob:)/i.test(u) || u.startsWith('/') || u.startsWith('user/')) return u;
    return '';
}

function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Second gradient color: the accent with its hue rotated a bit.
function shiftHue(hex, deg) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    let h = 0;
    let s = 0;
    if (d) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
    }
    const H = Math.round((h + deg + 360) % 360);
    const S = Math.round(clamp(s * 100, 45, 100));
    const L = Math.round(clamp(l * 100 + 6, 52, 72));
    return `hsl(${H}, ${S}%, ${L}%)`;
}

function accentOf(s) {
    return isHex(s.accent) ? s.accent : DEFAULTS.accent;
}

// Built-in icon: a chat bubble on a gradient tile (used when no custom picture is set).
function defaultLogo(accent) {
    const c2 = shiftHue(accent, 45);
    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">` +
        `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
        `<stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${c2}"/>` +
        `</linearGradient></defs>` +
        `<rect x="8" y="8" width="104" height="104" rx="30" fill="url(#g)"/>` +
        `<path d="M36 40a10 10 0 0 1 10-10h28a10 10 0 0 1 10 10v22a10 10 0 0 1-10 10H60L46 86V72a10 10 0 0 1-10-10z" fill="#fff" fill-opacity=".96"/>` +
        `<circle cx="49" cy="51" r="3.6" fill="url(#g)"/><circle cx="60" cy="51" r="3.6" fill="url(#g)"/><circle cx="71" cy="51" r="3.6" fill="url(#g)"/>` +
        `</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* ------------------------------------------------------------------ */
/* Loading overlay                                                     */
/* ------------------------------------------------------------------ */

const OVERLAY_MARKUP = `
<div class="cls-bg"><i></i><i></i></div>
<div class="cls-stage">
    <div class="cls-logo-wrap"><img class="cls-logo" alt=""></div>
    <div class="cls-title">SillyTavern</div>
    <div class="cls-bar"><div class="cls-fill"></div></div>
    <div class="cls-pct">0%</div>
    <div class="cls-text"></div>
</div>`;

let active = null;

function buildOverlay(s) {
    const accent = accentOf(s);
    const custom = safeUrl(s.image);
    const el = document.createElement('div');
    el.id = 'cls-overlay';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.dataset.custom = custom ? '1' : '0';
    el.dataset.shape = custom && (s.shape === 'circle' || s.shape === 'rounded') ? s.shape : 'original';
    el.style.setProperty('--cls-accent', accent);
    el.style.setProperty('--cls-accent-2', shiftHue(accent, 45));
    el.style.setProperty('--cls-size', clamp(Number(s.size) || DEFAULTS.size, 64, 320) + 'px');
    el.innerHTML = OVERLAY_MARKUP;
    if (!s.showPercent) el.classList.add('cls-nopct');

    const img = el.querySelector('.cls-logo');
    img.onerror = () => {
        if (img.dataset.fallback === '1') return;
        img.dataset.fallback = '1';
        el.dataset.custom = '0';
        el.dataset.shape = 'original';
        img.src = defaultLogo(accent);
    };
    img.src = custom || defaultLogo(accent);
    return el;
}

function closeOverlay(run) {
    if (run.closed) return;
    run.closed = true;
    cancelAnimationFrame(run.raf);
    run.timers.forEach((t) => { clearInterval(t); clearTimeout(t); });
    try { run.cleanupWatch?.(); } catch { /* ignore */ }
    if (active === run) active = null;
    setTimeout(() => {
        run.el.classList.add('cls-hide');
        setTimeout(() => run.el.remove(), 800);
    }, 250);
}

function stopOverlay() {
    if (!active) return;
    const run = active;
    closeOverlay(run);
    run.el.remove();
}

function watchReady(run) {
    const ready = () => { if (!run.closed) run.finish(); };
    if (event_types && event_types.APP_READY) eventSource.on(event_types.APP_READY, ready);
    const poll = setInterval(() => {
        const pre = document.getElementById('preloader');
        if (!pre || getComputedStyle(pre).display === 'none') ready();
    }, 250);
    const hard = setTimeout(ready, 40000); // never get stuck
    run.timers.push(poll, hard);
    run.cleanupWatch = () => eventSource.removeListener(event_types.APP_READY, ready);
}

function startOverlay({ preview = false } = {}) {
    stopOverlay();
    const s = getSettings();
    const T = I18N[getLang()];
    const el = buildOverlay(s);
    document.body.appendChild(el);

    const fill = el.querySelector('.cls-fill');
    const pctEl = el.querySelector('.cls-pct');
    const textEl = el.querySelector('.cls-text');

    const t0 = performance.now();
    const minMs = preview ? 4500 : clamp(Number(s.minTime) || 0, 0, 6) * 1000;
    const run = { el, raf: 0, timers: [], finishing: false, closed: false, progress: 0 };
    active = run;

    const setText = (txt, instant) => {
        if (textEl.textContent === txt) return;
        if (instant) { textEl.textContent = txt; return; }
        textEl.classList.add('cls-swap');
        setTimeout(() => {
            textEl.textContent = txt;
            textEl.classList.remove('cls-swap');
        }, 220);
    };

    const phrases = s.funny ? shuffle(T.phrases) : null;
    let pi = 0;
    let stageIdx = -1;
    if (phrases) {
        setText(phrases[0], true);
        run.timers.push(setInterval(() => {
            pi = (pi + 1) % phrases.length;
            setText(phrases[pi]);
        }, 2600));
    } else {
        setText(T.stages[0][1], true);
    }

    run.finish = () => {
        if (run.finishing || run.closed) return;
        const now = performance.now();
        run.finishing = true;
        run.fFrom = run.progress;
        run.fStart = now;
        run.fEnd = Math.max(now + 450, t0 + minMs);
    };

    const ease = (k) => 1 - Math.pow(1 - k, 3);
    const tick = (now) => {
        if (run.closed) return;
        let p;
        if (!run.finishing) {
            // Estimated progress: ST does not expose a real percentage, so we ease toward ~92%.
            p = 92 * (1 - Math.exp(-(now - t0) / 2600));
        } else {
            const k = clamp((now - run.fStart) / (run.fEnd - run.fStart), 0, 1);
            p = run.fFrom + (100 - run.fFrom) * ease(k);
        }
        p = Math.max(p, run.progress);
        run.progress = p;
        fill.style.width = p.toFixed(1) + '%';
        pctEl.textContent = Math.round(p) + '%';

        if (!phrases) {
            let idx = 0;
            T.stages.forEach(([threshold], i) => { if (p >= threshold) idx = i; });
            if (idx !== stageIdx) {
                stageIdx = idx;
                setText(T.stages[idx][1]);
            }
        }

        if (run.finishing && p >= 100) { closeOverlay(run); return; }
        run.raf = requestAnimationFrame(tick);
    };
    run.raf = requestAnimationFrame(tick);

    if (preview) {
        run.timers.push(setTimeout(run.finish, 3500));
        el.addEventListener('click', stopOverlay);
    } else {
        watchReady(run);
    }
    return run;
}

/* ------------------------------------------------------------------ */
/* Settings panel                                                      */
/* ------------------------------------------------------------------ */

const SETTINGS_HTML = `
<div class="inline-drawer">
    <div class="inline-drawer-toggle inline-drawer-header">
        <b data-i18n="title"></b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
    </div>
    <div class="inline-drawer-content cls-settings">
        <label class="checkbox_label" for="cls_enabled">
            <input id="cls_enabled" type="checkbox">
            <span data-i18n="enabled"></span>
        </label>

        <div class="cls-row">
            <label for="cls_language" data-i18n="language"></label>
            <select id="cls_language" class="text_pole">
                <option value="auto" data-i18n="langAuto"></option>
                <option value="en">English</option>
                <option value="ru">Русский</option>
            </select>
        </div>

        <div class="cls-field">
            <label data-i18n="picture"></label>
            <div class="cls-pic">
                <img id="cls_thumb" class="cls-thumb" alt="">
                <div id="cls_upload" class="menu_button menu_button_icon"><i class="fa-solid fa-upload"></i><span data-i18n="upload"></span></div>
                <div id="cls_reset" class="menu_button menu_button_icon"><i class="fa-solid fa-rotate-left"></i><span data-i18n="reset"></span></div>
                <input id="cls_file" type="file" accept="image/*" hidden>
            </div>
            <input id="cls_url" class="text_pole" type="text" autocomplete="off" data-i18n-ph="urlPh">
            <small class="cls-hint" data-i18n="hintPic"></small>
        </div>

        <div class="cls-field">
            <div class="cls-range-head"><label for="cls_size" data-i18n="size"></label><span id="cls_size_val"></span></div>
            <input id="cls_size" type="range" min="64" max="320" step="4">
        </div>

        <div class="cls-row">
            <label for="cls_shape" data-i18n="shape"></label>
            <select id="cls_shape" class="text_pole">
                <option value="original" data-i18n="shapeOriginal"></option>
                <option value="circle" data-i18n="shapeCircle"></option>
                <option value="rounded" data-i18n="shapeRounded"></option>
            </select>
        </div>

        <div class="cls-field">
            <label class="checkbox_label" for="cls_funny">
                <input id="cls_funny" type="checkbox">
                <span data-i18n="funny"></span>
            </label>
            <small class="cls-hint" data-i18n="funnyHint"></small>
        </div>

        <label class="checkbox_label" for="cls_percent">
            <input id="cls_percent" type="checkbox">
            <span data-i18n="percent"></span>
        </label>

        <div class="cls-row">
            <label for="cls_accent" data-i18n="accent"></label>
            <input id="cls_accent" type="color">
        </div>

        <div class="cls-field">
            <div class="cls-range-head"><label for="cls_min" data-i18n="minTime"></label><span id="cls_min_val"></span></div>
            <input id="cls_min" type="range" min="0" max="6" step="0.5">
        </div>

        <div id="cls_preview" class="menu_button menu_button_icon">
            <i class="fa-solid fa-play"></i><span data-i18n="preview"></span>
        </div>
    </div>
</div>`;

function notify(kind, msg) {
    try { window.toastr?.[kind]?.(msg); } catch { /* ignore */ }
}

function readAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
    });
}

function mountSettings() {
    const host = document.getElementById('extensions_settings2') || document.getElementById('extensions_settings');
    if (!host || document.getElementById('cls_settings_root')) return;

    const root = document.createElement('div');
    root.id = 'cls_settings_root';
    root.innerHTML = SETTINGS_HTML;
    host.appendChild(root);

    const $ = (id) => root.querySelector('#' + id);
    const save = () => saveSettingsDebounced();

    const applyI18n = () => {
        const T = I18N[getLang()];
        root.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = T[n.dataset.i18n]; });
        root.querySelectorAll('[data-i18n-ph]').forEach((n) => { n.placeholder = T[n.dataset.i18nPh]; });
        refreshValues();
    };

    const refreshValues = () => {
        const s = getSettings();
        const T = I18N[getLang()];
        $('cls_size_val').textContent = s.size + ' px';
        $('cls_min_val').textContent = Number(s.minTime).toFixed(1) + ' ' + T.sec;
    };

    const refreshThumb = () => {
        const s = getSettings();
        const thumb = $('cls_thumb');
        const fallback = defaultLogo(accentOf(s));
        thumb.onerror = () => { thumb.onerror = null; thumb.src = fallback; };
        thumb.src = safeUrl(s.image) || fallback;
    };

    const setImage = (url) => {
        const s = getSettings();
        s.image = url;
        $('cls_url').value = url.startsWith('data:') ? '' : url;
        refreshThumb();
        save();
    };

    // initial values
    const s0 = getSettings();
    $('cls_enabled').checked = !!s0.enabled;
    $('cls_language').value = s0.language;
    $('cls_size').value = s0.size;
    $('cls_shape').value = s0.shape;
    $('cls_funny').checked = !!s0.funny;
    $('cls_percent').checked = !!s0.showPercent;
    $('cls_accent').value = accentOf(s0);
    $('cls_min').value = s0.minTime;
    $('cls_url').value = String(s0.image || '').startsWith('data:') ? '' : (s0.image || '');
    applyI18n();
    refreshThumb();

    // events
    $('cls_enabled').addEventListener('change', (e) => { getSettings().enabled = e.target.checked; save(); });
    $('cls_language').addEventListener('change', (e) => { getSettings().language = e.target.value; applyI18n(); save(); });
    $('cls_size').addEventListener('input', (e) => { getSettings().size = Number(e.target.value); refreshValues(); save(); });
    $('cls_shape').addEventListener('change', (e) => { getSettings().shape = e.target.value; save(); });
    $('cls_funny').addEventListener('change', (e) => { getSettings().funny = e.target.checked; save(); });
    $('cls_percent').addEventListener('change', (e) => { getSettings().showPercent = e.target.checked; save(); });
    $('cls_accent').addEventListener('input', (e) => { getSettings().accent = e.target.value; refreshThumb(); save(); });
    $('cls_min').addEventListener('input', (e) => { getSettings().minTime = Number(e.target.value); refreshValues(); save(); });
    $('cls_preview').addEventListener('click', () => startOverlay({ preview: true }));
    $('cls_reset').addEventListener('click', () => setImage(''));
    $('cls_upload').addEventListener('click', () => $('cls_file').click());

    $('cls_url').addEventListener('change', (e) => {
        const v = e.target.value.trim();
        if (!v) { setImage(''); return; }
        if (!safeUrl(v)) { notify('warning', I18N[getLang()].badUrl); return; }
        setImage(v);
    });

    $('cls_file').addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        e.target.value = '';
        const T = I18N[getLang()];
        if (!file) return;
        if (!/^image\//.test(file.type)) { notify('error', T.badFile); return; }

        const dataUrl = await readAsDataURL(file);
        const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
        try {
            // Preferred: store the picture as a regular user file, so settings stay small.
            const res = await fetch('/api/files/upload', {
                method: 'POST',
                headers: getRequestHeaders(),
                body: JSON.stringify({ name: `loading_screen_${Date.now()}.${ext}`, data: dataUrl.split(',')[1] }),
            });
            if (!res.ok) throw new Error('upload ' + res.status);
            const json = await res.json();
            if (!json.path) throw new Error('no path');
            setImage('/' + String(json.path).replace(/^\/+/, ''));
        } catch (err) {
            console.warn('[Custom Loading Screen] upload failed, falling back to inline storage', err);
            if (file.size <= MAX_INLINE_BYTES) setImage(dataUrl);
            else notify('error', T.uploadFail);
        }
    });
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

try {
    if (getSettings().enabled && !window.__clsBooted) {
        window.__clsBooted = true;
        startOverlay();
    }
} catch (err) {
    console.error('[Custom Loading Screen]', err);
}

jQuery(() => {
    try { mountSettings(); } catch (err) { console.error('[Custom Loading Screen]', err); }
});
