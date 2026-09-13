// Dashboard JavaScript
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
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
    },
    get(p) { return this.req('GET', p); },
    post(p, b) { return this.req('POST', p, b); },
    del(p) { return this.req('DELETE', p); }
};

document.addEventListener('DOMContentLoaded', () => {
    API.init();
    if (API.baseUrl) refreshData();
});

function saveApiUrl() {
    const u = document.getElementById('apiUrl').value.trim();
    if (!u) return showToast('آدرس را وارد کنید', true);
    API.setUrl(u);
    showToast('ذخیره شد');
    refreshData();
}

async function refreshData() {
    if (!API.baseUrl) {
        document.getElementById('monitorsList').innerHTML = '<div class="empty-state">آدرس API را وارد کنید</div>';
        return;
    }
    try {
        const monitors = await API.get('/api/monitors');
        renderMonitors(monitors);
        await checkTelegraph();
        await refreshPreview();
        document.getElementById('statusDot').className = 'status-dot on';
        document.getElementById('statusText').textContent = 'متصل';
        document.getElementById('monitorCount').textContent = monitors.filter(m => m.enabled).length + ' مانیتور';
    } catch (e) {
        document.getElementById('statusDot').className = 'status-dot off';
        document.getElementById('statusText').textContent = 'خطا';
        showToast('خطا: ' + e.message, true);
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

function renderMonitors(monitors) {
    const list = document.getElementById('monitorsList');
    if (!monitors || !monitors.length) {
        list.innerHTML = '<div class="empty-state">مانیتوری نیست</div>';
        return;
    }
    list.innerHTML = monitors.map(m => {
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
            '<div class="monitor-info"><span class="monitor-label">' + m.label + '</span>' +
            '<span class="monitor-meta">' + m.source + ' / ' + m.code + '</span></div>' +
            '<div class="monitor-price">' + ps + '</div>' +
            '<div class="monitor-actions">' +
            '<button class="btn btn-sm ' + (m.enabled ? 'btn-success' : 'btn-secondary') + '" onclick="toggle(' + m.id + ',' + !m.enabled + ')">' + (m.enabled ? 'فعال' : 'غیرفعال') + '</button>' +
            '<button class="btn btn-sm btn-danger" onclick="del(' + m.id + ')">حذف</button>' +
            '</div></div>';
    }).join('');
}

async function toggle(id, en) {
    await API.post('/api/toggle/' + id, { enabled: en });
    showToast(en ? 'فعال' : 'غیرفعال');
    refreshData();
}

async function del(id) {
    if (!confirm('مطمئنی؟')) return;
    await API.del('/api/monitors/' + id);
    showToast('حذف شد');
    refreshData();
}

async function addMonitor(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('newName').value,
        label: document.getElementById('newLabel').value,
        source: document.getElementById('newSource').value,
        code: document.getElementById('newCode').value.toUpperCase(),
        sort_order: parseInt(document.getElementById('newSortOrder').value) || 0,
        extra: {
            decimals: parseInt(document.getElementById('newDecimals').value) || 0,
            unit: document.getElementById('newUnit').value,
            show_change: document.getElementById('newShowChange').value === 'true'
        }
    };
    await API.post('/api/monitors', data);
    showToast('اضافه شد');
    e.target.reset();
    refreshData();
}

async function updateTemplate(e) {
    e.preventDefault();
    await API.post('/api/settings', {
        template: document.getElementById('templateInput').value,
        update_interval_minutes: document.getElementById('intervalInput').value
    });
    showToast('ذخیره شد');
}

async function refreshPreview() {
    try {
        const monitors = await API.get('/api/monitors');
        let t = '📊 قیمت‌های لحظه‌ای\n\n';
        for (const m of monitors) {
            if (!m.enabled || !m.cached_price) continue;
            const ex = m.extra || {};
            const d = ex.decimals || 0;
            const u = ex.unit || '';
            const p = Number(m.cached_price.price).toLocaleString('fa-IR', { minimumFractionDigits: d, maximumFractionDigits: d });
            t += '▫️ ' + m.label + ': ' + p + ' ' + u + '\n';
        }
        t += '\n🔄 هر ۲ ساعت به‌روزرسانی می‌شود';
        document.getElementById('previewBox').textContent = t;
    } catch (e) {
        document.getElementById('previewBox').textContent = 'خطا';
    }
}

async function forceUpdate() {
    try {
        await API.post('/api/prices/refresh', {});
        await API.post('/api/telegraph/update', {});
        showToast('به‌روزرسانی شد');
        refreshData();
    } catch (e) { showToast('خطا', true); }
}

async function createTelegraphAccount() {
    const name = document.getElementById('telegraphName').value || 'cryptoprice';
    try {
        const r = await API.post('/api/telegraph/create_account', { short_name: name });
        if (r.success) showToast('اکانت ساخته شد');
        checkTelegraph();
    } catch (e) { showToast('خطا: ' + e.message, true); }
}

async function updateTelegraphNow() {
    try {
        await API.post('/api/telegraph/update', {});
        showToast('صفحه آپدیت شد');
        checkTelegraph();
    } catch (e) { showToast('خطا', true); }
}

function copyLink() {
    const u = document.getElementById('telegraphUrl').textContent;
    navigator.clipboard.writeText(u);
    showToast('کپی شد');
}

function showToast(msg, err) {
    const t = document.createElement('div');
    t.className = 'toast' + (err ? ' error' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}
