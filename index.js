// Custom Loading Screen for SillyTavern (v2)
// Restyles SillyTavern's own splash loader in place (logo, progress bar, text).
// Cosmetic only: never reads, sends or touches chats, characters or any other data.
// Adds no waiting time: the native loader closes exactly when SillyTavern is ready.

import { eventSource, event_types, saveSettingsDebounced, getRequestHeaders } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';

const MODULE = 'custom_loading_screen';
const MAX_INLINE_BYTES = 1.5 * 1024 * 1024;
const NATIVE_LOGO = '/img/logo.png';

const DEFAULTS = {
    enabled: true,
    language: 'auto', // auto | en | ru
    image: '',        // '' = SillyTavern's own logo
    size: 150,
    shape: 'original', // original | circle | rounded
    funny: true,
    showPercent: true,
    accent: '#8b7bff',
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
        preview: 'Preview',
        sec: 's',
        badFile: 'Please choose an image file.',
        badUrl: 'That link does not look like an image address.',
        previewNA: 'Preview is not available in this SillyTavern version. Reload the page to see the loading screen.',
        uploadFail: 'Upload failed and the file is too big to keep inline. Try a smaller image or paste a link.',
        stages: [
            [0, 'Starting up…'],
            [35, 'Loading extensions…'],
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
        preview: 'Предпросмотр',
        sec: 'с',
        badFile: 'Выберите файл с картинкой.',
        badUrl: 'Эта ссылка не похожа на адрес картинки.',
        previewNA: 'В этой версии SillyTavern предпросмотр недоступен. Перезагрузите страницу, чтобы увидеть экран загрузки.',
        uploadFail: 'Не удалось загрузить файл, а хранить его внутри настроек слишком тяжело. Возьмите картинку полегче или вставьте ссылку.',
        stages: [
            [0, 'Запускаемся…'],
            [35, 'Загружаем расширения…'],
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

function accentOf(s) {
    return isHex(s.accent) ? s.accent : DEFAULTS.accent;
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

function mixHex(a, b, t) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(v * t + pb[i] * (1 - t)).toString(16).padStart(2, '0')).join('');
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

function notify(kind, msg) {
    try { window.toastr?.[kind]?.(msg); } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/* Restyling the native splash loader                                  */
/* ------------------------------------------------------------------ */

// The native loader is a modal <dialog> (top layer), so it cannot be covered
// from outside. Instead we restyle its own elements. The dialog backdrop is
// painted through an injected rule because ::backdrop cannot be styled inline.
function injectBackdropStyle(accent) {
    let st = document.getElementById('cls-dyn-style');
    if (!st) {
        st = document.createElement('style');
        st.id = 'cls-dyn-style';
        document.head.appendChild(st);
    }
    const tint = mixHex(accent, '#0b0914', 0.26);
    st.textContent =
        `dialog.cls-host::backdrop{background:radial-gradient(120% 90% at 50% 0%,${tint} 0%,#0b0914 62%)!important;` +
        `backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}`;
}

/**
 * Restyle a splash loader element (#loader.splash-screen).
 * @returns {{finish: () => void}}
 */
function decorate(el, { preview = false } = {}) {
    const s = getSettings();
    const T = I18N[getLang()];
    const accent = accentOf(s);

    el.classList.add('cls-splash');
    el.style.setProperty('--cls-accent', accent);
    el.style.setProperty('--cls-accent-2', shiftHue(accent, 45));
    el.style.setProperty('--cls-size', clamp(Number(s.size) || DEFAULTS.size, 64, 320) + 'px');
    el.closest('dialog')?.classList.add('cls-host');
    injectBackdropStyle(accent);

    // picture
    const logo = el.querySelector('.splash-logo');
    const custom = safeUrl(s.image);
    el.dataset.custom = custom ? '1' : '0';
    el.dataset.shape = custom && (s.shape === 'circle' || s.shape === 'rounded') ? s.shape : 'original';
    if (logo && custom) {
        logo.addEventListener('error', () => {
            el.dataset.custom = '0';
            el.dataset.shape = 'original';
            logo.src = NATIVE_LOGO;
        }, { once: true });
        logo.src = custom;
    }

    // progress block, placed right before the status line
    const msg = el.querySelector('.splash-message');
    const block = document.createElement('div');
    block.className = 'cls-progress';
    block.innerHTML = '<div class="cls-bar"><div class="cls-fill"></div></div><div class="cls-pct">0%</div>';
    if (msg) msg.before(block); else el.appendChild(block);
    const fill = block.querySelector('.cls-fill');
    const pctEl = block.querySelector('.cls-pct');
    if (!s.showPercent) pctEl.hidden = true;

    const textEl = msg || block.appendChild(document.createElement('div'));
    textEl.removeAttribute('data-i18n'); // keep ST's translator from overwriting our text
    textEl.classList.add('cls-text');

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
    const timers = [];
    let stopped = false;

    // We are loaded in the middle of startup, so a normal run starts partway.
    const base = preview ? 0 : 35;
    let p = base;

    const render = () => {
        fill.style.width = p.toFixed(1) + '%';
        pctEl.textContent = Math.round(p) + '%';
        if (!phrases) {
            let idx = 0;
            T.stages.forEach(([threshold], i) => { if (p >= threshold) idx = i; });
            if (idx !== stageIdx) { stageIdx = idx; setText(T.stages[idx][1], stageIdx === 0); }
        }
    };

    const stop = () => {
        if (stopped) return;
        stopped = true;
        timers.forEach((t) => { clearInterval(t); clearTimeout(t); });
        for (const ev of [event_types?.APP_INITIALIZED, event_types?.APP_READY]) {
            if (ev) { try { eventSource.removeListener(ev, finish); } catch { /* ignore */ } }
        }
    };

    function finish() {
        if (stopped) return;
        p = 100;
        render();
        stop();
    }

    if (phrases) {
        setText(phrases[0], true);
        timers.push(setInterval(() => {
            pi = (pi + 1) % phrases.length;
            setText(phrases[pi]);
        }, 2600));
    }
    render();

    // Estimated progress: SillyTavern has no real percentage, so ease toward ~92%.
    const t0 = Date.now();
    const tau = preview ? 1400 : 2200;
    timers.push(setInterval(() => {
        if (!el.isConnected) { stop(); return; }
        const target = base + (92 - base) * (1 - Math.exp(-(Date.now() - t0) / tau));
        if (target > p) { p = target; render(); }
    }, 120));

    if (!preview) {
        // Finish exactly when SillyTavern does. We never delay the native loader.
        if (event_types?.APP_INITIALIZED) eventSource.on(event_types.APP_INITIALIZED, finish);
        if (event_types?.APP_READY) eventSource.on(event_types.APP_READY, finish);
    }

    return { finish };
}

function boot() {
    if (!getSettings().enabled) return;
    let tries = 0;
    const attempt = () => {
        const el = document.querySelector('#loader.splash-screen');
        if (el) { decorate(el); return; }
        if (++tries < 40) setTimeout(attempt, 50); // give up after ~2 s
    };
    attempt();
}

/* ------------------------------------------------------------------ */
/* Preview (uses SillyTavern's own loader, when available)             */
/* ------------------------------------------------------------------ */

let previewing = false;

async function previewSplash() {
    if (previewing) return;
    let loader;
    try {
        ({ loader } = await import('../../../action-loader.js'));
    } catch { /* older SillyTavern */ }
    if (!loader?.createOverlay || !loader?.show) {
        notify('info', I18N[getLang()].previewNA);
        return;
    }

    previewing = true;
    try {
        const overlay = loader.createOverlay();
        overlay.classList.add('splash-screen');
        const logo = document.createElement('img');
        logo.src = NATIVE_LOGO;
        logo.alt = '';
        logo.className = 'splash-logo';
        const msg = document.createElement('h2');
        msg.className = 'splash-message';
        overlay.prepend(logo);
        overlay.appendChild(msg);

        const handle = loader.show({
            slug: 'cls-preview',
            toastMode: loader.ToastMode.NONE,
            overlayContent: overlay,
        });
        const ctl = decorate(overlay, { preview: true });

        await new Promise((r) => setTimeout(r, 4200));
        ctl.finish();
        await new Promise((r) => setTimeout(r, 450));
        await handle.hide();
    } catch (err) {
        console.warn('[Custom Loading Screen] preview failed', err);
    } finally {
        previewing = false;
    }
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

        <div id="cls_preview" class="menu_button menu_button_icon">
            <i class="fa-solid fa-play"></i><span data-i18n="preview"></span>
        </div>
    </div>
</div>`;

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

    const refreshValues = () => {
        $('cls_size_val').textContent = getSettings().size + ' px';
    };

    const applyI18n = () => {
        const T = I18N[getLang()];
        root.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = T[n.dataset.i18n]; });
        root.querySelectorAll('[data-i18n-ph]').forEach((n) => { n.placeholder = T[n.dataset.i18nPh]; });
        refreshValues();
    };

    const refreshThumb = () => {
        const thumb = $('cls_thumb');
        thumb.onerror = () => { thumb.onerror = null; thumb.src = NATIVE_LOGO; };
        thumb.src = safeUrl(getSettings().image) || NATIVE_LOGO;
    };

    const setImage = (url) => {
        getSettings().image = url;
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
    $('cls_accent').addEventListener('input', (e) => { getSettings().accent = e.target.value; save(); });
    $('cls_preview').addEventListener('click', previewSplash);
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
    boot();
} catch (err) {
    console.error('[Custom Loading Screen]', err);
}

jQuery(() => {
    try { mountSettings(); } catch (err) { console.error('[Custom Loading Screen]', err); }
});
