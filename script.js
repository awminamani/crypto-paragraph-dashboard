// Dashboard JS - Cloudflare Worker Client
const API = {
    baseUrl: '',
    init() {
        const s = localStorage.getItem('apiBaseUrl');
        if (s) { this.baseUrl = s; document.getElementById('apiUrl').value = s; }
    },
    setUrl(u) { this.baseUrl = u.replace(/\/$/, ''); localStorage.setItem('apiBaseUrl', this.baseUrl); },
    async req(method, path, body) {
        const r = await fetch(this.baseUrl + path, {
            method, headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!r.ok) {
            const e = await r.json().catch(() => ({}));
            throw new Error(e.error || ('HTTP ' + r.status));
        }
        return r.json();
    },
    get(p) { return this.req('GET', p); },
    post(p, b) { return this.req('POST', p, b); },
    put(p, b) { return this.req('PUT', p, b); },
    del(p) { return this.req('DELETE', p); }
};

let allMonitors = [];
let currentTab = 'active';

document.addEventListener('DOMContentLoaded', () => {
    API.init();
    if (API.baseUrl) refreshData();
});

function saveApiUrl() {
    const u = document.getElementById('apiUrl').value.trim();
    if (!u) return showToast('آدرس ورکر را وارد کنید', true);
    API.setUrl(u);
    showToast('✅ ذخیره شد');
    refreshData();
}

async function refreshData() {
    if (!API.baseUrl) return;
    try {
        allMonitors = await API.get('/api/monitors');
        renderMonitors();
        updateCounts();
        await checkTelegraph();
        await refreshPreview();
        document.getElementById('statusDot').className = 'status-dot on';
        document.getElementById('statusText').textContent = 'متصل';
    } catch (e) {
        document.getElementById('statusDot').className = 'status-dot off';
        document.getElementById('statusText').textContent = 'خطا';
        showToast('❌ ' + e.message, true);
    }
}

function updateCounts() {
    const active = allMonitors.filter(m => m.enabled).length;
    const disabled = allMonitors.filter(m => !m.enabled).length;
    document.getElementById('activeCount').textContent = active;
    document.getElementById('disabledCount').textContent = disabled;
    document.getElementById('badgeActive').textContent = active;
    document.getElementById('badgeDisabled').textContent = disabled;
}

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('tab-active').classList.toggle('active', tab === 'active');
    document.getElementById('tab-disabled').classList.toggle('active', tab === 'disabled');
    renderMonitors();
}

function getFiltered() {
    const q = (document.getElementById('searchBox').value || '').toLowerCase();
    return allMonitors.filter(m => {
        const matchTab = currentTab === 'active' ? m.enabled : !m.enabled;
        const matchSearch = !q || m.label.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q);
        return matchTab && matchSearch;
    });
}

function renderMonitors() {
    const list = document.getElementById('monitorList');
    const filtered = getFiltered();
    if (!filtered.length) {
        list.innerHTML = '<div class="empty-state">' + (currentTab === 'active' ? 'مانیتور فعالی نیست' : 'مانیتور غیرفعالی نیست') + '</div>';
        return;
    }
    list.innerHTML = filtered.map(m => {
        const p = m.cached_price;
        const ex = m.extra || {};
        const d = ex.decimals || 0;
        const u = ex.unit || '';
        let ps = '—';
        if (p && p.price) {
            ps = Number(p.price).toLocaleString('fa-IR', { minimumFractionDigits: d, maximumFractionDigits: d });
            if (u) ps += ' ' + u;
        }
        return '<div class="monitor-item ' + (m.enabled ? '' : 'disabled') + '">' +
            '<div class="monitor-info">' +
            '<span class="monitor-label">' + escHtml(m.label) + '</span>' +
            '<span class="monitor-meta">' + escHtml(m.source) + ' / ' + escHtml(m.code) + (ex.category ? ' / ' + escHtml(ex.category) : '') + '</span>' +
            '</div>' +
            '<div class="monitor-price">' + ps + '</div>' +
            '<div class="monitor-actions">' +
            '<button class="btn btn-sm ' + (m.enabled ? 'btn-success' : 'btn-secondary') + '" onclick="toggleMon(\'' + m.id + '\',' + !m.enabled + ')">' + (m.enabled ? 'فعال' : 'غیرفعال') + '</button>' +
            '<button class="btn btn-sm btn-danger" onclick="delMon(\'' + m.id + '\')">حذف</button>' +
            '</div></div>';
    }).join('');
}

function escHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

async function toggleMon(id, en) {
    try {
        await API.post('/api/toggle/' + id, { enabled: en });
        showToast(en ? '✅ فعال شد' : '⚪ غیرفعال شد');
        refreshData();
    } catch (e) { showToast('❌ ' + e.message, true); }
}

async function delMon(id) {
    if (!confirm('حذف شود؟')) return;
    try {
        await API.del('/api/monitors/' + id);
        showToast('🗑 حذف شد');
        refreshData();
    } catch (e) { showToast('❌ ' + e.message, true); }
}

function showAddForm() { document.getElementById('addForm').style.display = 'block'; }
function hideAddForm() { document.getElementById('addForm').style.display = 'none'; }

function fillForm(p) {
    document.getElementById('fName').value = p.name;
    document.getElementById('fLabel').value = p.label;
    document.getElementById('fSource').value = p.source;
    document.getElementById('fCode').value = p.code;
    document.getElementById('fCat').value = p.cat || 'other';
    document.getElementById('fUnit').value = p.unit || '';
    document.getElementById('fDec').value = p.dec || 0;
    document.getElementById('fShowCh').value = p.show ? 'true' : 'false';
}

async function addMonitor(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('fName').value,
        label: document.getElementById('fLabel').value,
        source: document.getElementById('fSource').value,
        code: document.getElementById('fCode').value.toUpperCase(),
        extra: {
            category: document.getElementById('fCat').value,
            unit: document.getElementById('fUnit').value,
            decimals: parseInt(document.getElementById('fDec').value) || 0,
            show_change: document.getElementById('fShowCh').value === 'true'
        }
    };
    try {
        await API.post('/api/monitors', data);
        showToast('✅ اضافه شد');
        hideAddForm();
        refreshData();
    } catch (e) { showToast('❌ ' + e.message, true); }
}

async function saveTemplate(e) {
    e.preventDefault();
    try {
        await API.post('/api/settings', {
            template: document.getElementById('templateInput').value,
            update_interval_minutes: document.getElementById('intervalInput').value
        });
        showToast('✅ ذخیره شد');
    } catch (e) { showToast('❌ ' + e.message, true); }
}

async function refreshPreview() {
    try {
        const monitors = allMonitors.filter(m => m.enabled);
        let t = '📊 قیمت‌های لحظه‌ای\n\n';
        const groups = {};
        for (const m of monitors) {
            const cat = (m.extra && m.extra.category) || 'other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(m);
        }
        const catNames = { crypto: '💰 ارز دیجیتال', gold: '🥇 طلا', currency: '💵 ارزها', other: '📊 سایر' };
        for (const [cat, mons] of Object.entries(groups)) {
            t += (catNames[cat] || cat) + '\n';
            for (const m of mons) {
                const p = m.cached_price;
                const ex = m.extra || {};
                const d = ex.decimals || 0;
                const u = ex.unit || '';
                let ps = '—';
                if (p && p.price) {
                    ps = Number(p.price).toLocaleString('fa-IR', { minimumFractionDigits: d, maximumFractionDigits: d });
                    if (u) ps += ' ' + u;
                }
                const ch = p && p.change != null ? ((p.change > 0 ? '🟢 +' : p.change < 0 ? '🔴 ' : '⚪ ') + p.change.toFixed(2) + '%') : '';
                t += '▫️ ' + m.label + ': ' + ps + (ch ? ' (' + ch + ')' : '') + '\n';
            }
            t += '\n';
        }
        t += '🔄 هر ۲ ساعت به‌روزرسانی می‌شود';
        document.getElementById('previewBox').textContent = t;
    } catch (e) {
        document.getElementById('previewBox').textContent = 'خطا';
    }
}

async function checkTelegraph() {
    try {
        const s = await API.get('/api/telegraph/status');
        if (s.configured && s.url) {
            document.getElementById('telegraphCreate').style.display = 'none';
            document.getElementById('telegraphInfo').style.display = 'block';
            document.getElementById('telegraphUrl').textContent = s.url;
            document.getElementById('openLink').href = s.url;
        } else {
            document.getElementById('telegraphCreate').style.display = 'block';
            document.getElementById('telegraphInfo').style.display = 'none';
        }
    } catch (e) {}
}

async function createTGAccount() {
    const name = document.getElementById('telegraphName').value || 'cryptoprice';
    try {
        const r = await API.post('/api/telegraph/create_account', { short_name: name });
        if (r.success) {
            showToast('✅ اکانت ساخته شد');
            checkTelegraph();
        }
    } catch (e) { showToast('❌ ' + e.message, true); }
}

async function updateTGNow() {
    try {
        await API.post('/api/telegraph/update', {});
        showToast('✅ صفحه آپدیت شد');
        checkTelegraph();
    } catch (e) { showToast('❌ ' + e.message, true); }
}

async function forceUpdate() {
    try {
        await API.post('/api/prices/refresh', {});
        await API.post('/api/telegraph/update', {});
        showToast('✅ به‌روزرسانی شد');
        refreshData();
    } catch (e) { showToast('❌ ' + e.message, true); }
}

function copyLink() {
    const u = document.getElementById('telegraphUrl').textContent;
    navigator.clipboard.writeText(u);
    showToast('📋 کپی شد');
}

function showToast(msg, err) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const t = document.createElement('div');
    t.className = 'toast' + (err ? ' error' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}
