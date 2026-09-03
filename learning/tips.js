/* Shared engine for all *-tips.html pages. Requires window.TIPS_PAGE = {key, flash} and window.TIPS_DATA. */
(function () {
'use strict';
var PAGE = window.TIPS_PAGE || { key: 'tips', flash: 'rgba(228,87,46,.10)' };
var THEME_KEY = 'tipsTheme';
var BM_KEY = 'tipsBookmarks:' + PAGE.key;
var TOD_KEY = 'tipsTod:' + PAGE.key;

var sections = document.querySelectorAll('section[id]');
var navLinks = document.querySelectorAll('#sidebar .nav-link');

function setActiveNav() {
    var current = '';
    var scrollPos = window.scrollY + 120;
    sections.forEach(function (section) {
        if (scrollPos >= section.offsetTop) current = section.getAttribute('id');
    });
    navLinks.forEach(function (link) {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) link.classList.add('active');
    });
}
window.addEventListener('scroll', setActiveNav);

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function highlightCode(code) {
    var tokens = [];
    var h = escapeHtml(code).replace(/(\/\/.*|#.*|;.*|--.*)/g, function (match) {
        var token = '%%TOKEN' + tokens.length + '%%';
        tokens.push('<span class="hl-cm">' + match + '</span>');
        return token;
    });
    h = h.replace(/(&#039;[^]*?&#039;|&quot;[^]*?&quot;|`[^`]*?`)/g, function (match) {
        var token = '%%TOKEN' + tokens.length + '%%';
        tokens.push('<span class="hl-str">' + match + '</span>');
        return token;
    });
    h = h.replace(/\b(function|return|if|else|elif|elsif|endif|endforeach|foreach|for|while|do|class|public|private|protected|static|const|let|var|use|new|throw|catch|try|finally|switch|case|break|continue|default|true|false|null|nil|void|int|string|bool|array|float|mixed|self|parent|readonly|abstract|final|match|enum|interface|trait|namespace|declare|extends|implements|instanceof|clone|die|echo|isset|empty|unset|include|require|list|and|or|xor|fn|def|lambda|yield|async|await|import|from|as|with|assert|del|global|nonlocal|pass|raise|except|not|in|is|of|typeof|delete|new|this|export|import|SELECT|FROM|WHERE|GROUP|ORDER|BY|LIMIT|JOIN|LEFT|RIGHT|INNER|OUTER|ON|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|ADD|INDEX|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|DEFAULT|NOT|NULL|AUTO_INCREMENT|BEGIN|COMMIT|ROLLBACK|TRANSACTION|GRANT|REVOKE|UNION|DISTINCT|HAVING|EXISTS|BETWEEN|LIKE|IN|CASE|WHEN|THEN|ELSE|END|AS|ASC|DESC)\b/g, '<span class="hl-kw">$1</span>');
    h = h.replace(/\b(__construct|print|len|range|enumerate|zip|map|filter|sorted|reversed|open|input|super|isinstance|hasattr|getattr|setattr|console|log|query|fetch|push|pull|commit|add|status|diff|clone|checkout|merge|rebase|grep|awk|sed|find|ls|cd|mkdir|echo|exports|require|module|document|window|Math|JSON|Object|Array|String|Number|Promise|SELECT|INSERT|UPDATE|DELETE)\b/g, '<span class="hl-fn">$1</span>');
    h = h.replace(/(^|[^0-9A-Za-z_#])(\d[\d_]*(?:\.\d+)?)/g, '$1<span class="num">$2</span>');
    tokens.forEach(function (value, index) {
        h = h.replace('%%TOKEN' + index + '%%', value);
    });
    return h;
}

var bookmarkedTips = {};
try { bookmarkedTips = JSON.parse(localStorage.getItem(BM_KEY) || '{}'); } catch (e) { bookmarkedTips = {}; }
var showBookmarkedOnly = false;

function saveBookmarks() {
    try { localStorage.setItem(BM_KEY, JSON.stringify(bookmarkedTips)); } catch (e) {}
    updateBookmarkCount();
}

function updateBookmarkCount() {
    var validIds = Array.prototype.map.call(document.querySelectorAll('.bookmark-star'), function (el) { return el.dataset.tipId; });
    var count = validIds.length ? validIds.filter(function (id) { return bookmarkedTips[id]; }).length : Object.keys(bookmarkedTips).length;
    document.getElementById('bookmarkCount').textContent = count;
}

function renderTips() {
    Object.entries(TIPS_DATA).forEach(function (entry) {
        var sectionId = entry[0], tips = entry[1];
        var container = document.getElementById('list-' + sectionId);
        if (!container) return;
        var html = '';
        tips.forEach(function (tip, index) {
            var title = tip[0], desc = tip[1], code = tip[2];
            var codeId = 'code_' + sectionId + '_' + index;
            var tipId = sectionId + '_' + index;
            html += '<div class="tip-item">' +
                '<div class="tip-title" role="button" tabindex="0" data-target="' + codeId + '">' +
                '<span class="tip-title-text">' + escapeHtml(title) + '</span>' +
                '<button type="button" class="bookmark-star' + (bookmarkedTips[tipId] ? ' on' : '') + '" data-tip-id="' + tipId + '" title="Bookmark this tip" aria-label="Bookmark ' + escapeHtml(title) + '">' +
                '<i class="bi bi-star-fill"></i></button>' +
                '<span class="arrow">&#9654;</span></div>' +
                '<div class="tip-body" id="' + codeId + '">' +
                '<p class="mb-1">' + escapeHtml(desc) + '</p>' +
                '<pre><code>' + highlightCode(code) + '</code>' +
                '<button type="button" class="copy-btn">Copy</button></pre>' +
                '</div></div>';
        });
        container.innerHTML = html;
    });
    updateBookmarkCount();
    updateProgress();
}

function toggleTip(el) {
    var body = document.getElementById(el.dataset.target);
    if (!body) return;
    body.classList.toggle('open');
    el.classList.toggle('open');
    updateProgress();
}

function copyCode(btn) {
    var code = btn.parentElement.querySelector('code');
    var text = code.textContent;
    var markCopied = function () {
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
    };
    var fallbackCopy = function () {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        ta.remove();
        markCopied();
    };
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(markCopied).catch(fallbackCopy);
    } else {
        fallbackCopy();
    }
}

function filterTips() {
    var query = document.getElementById('tipSearch').value.toLowerCase().trim();
    var visible = 0;
    document.querySelectorAll('.tip-item').forEach(function (item) {
        var text = item.textContent.toLowerCase();
        var matchesQuery = !query || text.indexOf(query) !== -1;
        var star = item.querySelector('.bookmark-star');
        var isBookmarked = star && star.classList.contains('on');
        var match = matchesQuery && (!showBookmarkedOnly || isBookmarked);
        item.style.display = match ? '' : 'none';
        if (match) visible++;
    });
    document.getElementById('searchStatus').textContent = query ?
        visible + ' tip' + (visible !== 1 ? 's' : '') + ' found' + (showBookmarkedOnly ? ' (bookmarked)' : '') :
        showBookmarkedOnly ? visible + ' bookmarked tip' + (visible !== 1 ? 's' : '') + ' found' : 'Showing all tips';
}

function toggleBookmark(tipId) {
    if (bookmarkedTips[tipId]) { delete bookmarkedTips[tipId]; } else { bookmarkedTips[tipId] = true; }
    saveBookmarks();
    updateBookmarkStars();
    if (showBookmarkedOnly) filterTips();
}

function updateBookmarkStars() {
    document.querySelectorAll('.bookmark-star').forEach(function (el) {
        var on = !!bookmarkedTips[el.dataset.tipId];
        el.classList.toggle('on', on);
        el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
}

function updateProgress() {
    var all = document.querySelectorAll('.tip-item').length;
    var opened = document.querySelectorAll('.tip-item .tip-body.open').length;
    var pct = all ? Math.round(opened / all * 100) : 0;
    document.getElementById('progressBar').style.width = pct + '%';
    document.getElementById('progressLabel').textContent = opened + ' / ' + all + ' tips viewed (' + pct + '%)';
}

document.getElementById('tipSearch').addEventListener('input', filterTips);

document.addEventListener('click', function (e) {
    var copyBtn = e.target.closest('.copy-btn');
    if (copyBtn) { copyCode(copyBtn); return; }
    var star = e.target.closest('.bookmark-star');
    if (star) { e.stopPropagation(); toggleBookmark(star.dataset.tipId); return; }
    var title = e.target.closest('.tip-title');
    if (title) toggleTip(title);
});

document.addEventListener('keydown', function (e) {
    var title = e.target.closest ? e.target.closest('.tip-title') : null;
    if (title && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleTip(title); return; }
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        var input = document.getElementById('tipSearch');
        if (document.activeElement !== input && !(e.target.closest && e.target.closest('input,textarea'))) { e.preventDefault(); input.focus(); }
    }
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !(e.target.closest && e.target.closest('input,textarea'))) {
        document.getElementById('randomTipBtn').click();
    }
});

var backToTop = document.createElement('button');
backToTop.className = 'back-to-top';
backToTop.innerHTML = '<i class="bi bi-chevron-up"></i>';
backToTop.title = 'Back to top';
backToTop.setAttribute('aria-label', 'Back to top');
document.body.appendChild(backToTop);
window.addEventListener('scroll', function () {
    backToTop.classList.toggle('show', window.scrollY > 400);
});
backToTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });

var root = document.documentElement;
var themeBtn = document.getElementById('themeToggle');
var storedTheme = 'light';
try { storedTheme = localStorage.getItem(THEME_KEY) || 'light'; } catch (e) {}
root.setAttribute('data-bs-theme', storedTheme);
themeBtn.innerHTML = storedTheme === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-bs-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    themeBtn.innerHTML = next === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
});

var backdrop = document.getElementById('sidebarBackdrop');
var sidebar = document.getElementById('sidebar');
document.getElementById('sidebarToggle').addEventListener('click', function () {
    sidebar.classList.toggle('show');
    backdrop.classList.toggle('show');
});
backdrop.addEventListener('click', function () {
    sidebar.classList.remove('show');
    backdrop.classList.remove('show');
});
document.querySelectorAll('#sidebar .nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
        if (window.innerWidth <= 991.98) { sidebar.classList.remove('show'); backdrop.classList.remove('show'); }
    });
});

document.getElementById('bookmarkFilter').addEventListener('click', function () {
    showBookmarkedOnly = !showBookmarkedOnly;
    document.getElementById('bookmarkFilter').classList.toggle('active');
    document.getElementById('bookmarkLabel').textContent = showBookmarkedOnly ? 'Showing Bookmarked' : 'Bookmarked';
    filterTips();
});

document.getElementById('expandAllBtn').addEventListener('click', function () {
    document.querySelectorAll('.tip-body').forEach(function (b) { b.classList.add('open'); });
    document.querySelectorAll('.tip-title').forEach(function (t) { t.classList.add('open'); });
    updateProgress();
});
document.getElementById('collapseAllBtn').addEventListener('click', function () {
    document.querySelectorAll('.tip-body').forEach(function (b) { b.classList.remove('open'); });
    document.querySelectorAll('.tip-title').forEach(function (t) { t.classList.remove('open'); });
    updateProgress();
});

document.getElementById('randomTipBtn').addEventListener('click', function () {
    var allTips = document.querySelectorAll('.tip-item');
    if (!allTips.length) return;
    var target = allTips[Math.floor(Math.random() * allTips.length)];
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var title = target.querySelector('.tip-title');
    var body = target.querySelector('.tip-body');
    if (title && body) { title.classList.add('open'); body.classList.add('open'); }
    target.style.transition = 'background .3s';
    target.style.background = PAGE.flash;
    setTimeout(function () { target.style.background = ''; }, 1500);
    updateProgress();
});

(function tipOfDay() {
    var today = new Date().toDateString();
    var last = null;
    try { last = localStorage.getItem(TOD_KEY); } catch (e) {}
    if (last === today) return;
    try { localStorage.setItem(TOD_KEY, today); } catch (e) {}
    var sections = Object.keys(window.TIPS_DATA || {});
    if (!sections.length) return;
    var tips = window.TIPS_DATA[sections[Math.floor(Math.random() * sections.length)]];
    if (tips && tips.length) {
        var tip = tips[Math.floor(Math.random() * tips.length)];
        document.getElementById('todContent').textContent = tip[0] + ' — ' + tip[1];
        document.getElementById('tipOfDay').classList.add('show');
    }
})();
document.getElementById('closeTod').addEventListener('click', function () {
    document.getElementById('tipOfDay').classList.remove('show');
});

renderTips();
updateBookmarkStars();
setActiveNav();
})();
