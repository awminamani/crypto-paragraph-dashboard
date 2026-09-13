// Crypto Paragraph Dashboard - JavaScript

const API = {
    baseUrl: '',
    
    init() {
        const saved = localStorage.getItem('apiBaseUrl');
        if (saved) {
            this.baseUrl = saved;
            document.getElementById('apiUrl').value = saved;
        }
    },
    
    setUrl(url) {
        this.baseUrl = url.replace(/\/$/, '');
        localStorage.setItem('apiBaseUrl', this.baseUrl);
    },
    
    async request(method, path, body = null) {
        const url = `${this.baseUrl}${path}`;
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const resp = await fetch(url, options);
        if (!resp.ok) {
            const error = await resp.json().catch(() => ({ error: resp.statusText }));
            throw new Error(error.error || `HTTP ${resp.status}`);
        }
        return resp.json();
    },
    
    get(path) { return this.request('GET', path); },
    post(path, body) { return this.request('POST', path, body); },
    put(path, body) { return this.request('PUT', path, body); },
    delete(path) { return this.request('DELETE', path); },
};

document.addEventListener('DOMContentLoaded', () => {
    API.init();
    if (API.baseUrl) {
        refreshData();
    }
});

function saveApiUrl() {
    const url = document.getElementById('apiUrl').value.trim();
    if (!url) {
        showToast('آدرس API را وارد کنید', true);
        return;
    }
    API.setUrl(url);
    showToast('آدرس ذخیره شد');
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
        
        const status = await API.get('/api/bot/start');
        await checkBotStatus();
        await checkTelegraphStatus();
        await refreshPreview();
        
        showToast('داده‌ها به‌روزرسانی شد');
    } catch (e) {
        console.error('refreshData error:', e);
        showToast('خطا در اتصال: ' + e.message, true);
        document.getElementById('statusText').textContent = 'خطا در اتصال';
        document.getElementById('statusDot').className = 'status-dot off';
    }
}

async function checkBotStatus() {
    try {
        const status = await API.post('/api/bot/start', {});
        // Simplified - just check if we can reach the API
        document.getElementById('statusText').textContent = 'فعال';
        document.getElementById('statusDot').className = 'status-dot';
    } catch (e) {
        document.getElementById('statusText').textContent = 'خطا';
        document.getElementById('statusDot').className = 'status-dot off';
    }
}

async function checkTelegraphStatus() {
    try {
        const status = await API.get('/api/telegraph/status');
        const createDiv = document.getElementById('telegraphCreate');
        const infoDiv = document.getElementById('telegraphInfo');
        
        if (status.configured && status.url) {
            createDiv.style.display = 'none';
            infoDiv.style.display = 'block';
            document.getElementById('telegraphUrl').value = status.url;
        } else {
            createDiv.style.display = 'flex';
            infoDiv.style.display = 'none';
        }
    } catch (e) {
        // Telegraph endpoint might not exist yet
        document.getElementById('telegraphCreate').style.display = 'flex';
        document.getElementById('telegraphInfo').style.display = 'none';
    }
}

function renderMonitors(monitors) {
    const list = document.getElementById('monitorsList');
    
    if (!monitors || monitors.length === 0) {
        list.innerHTML = '<div class="empty-state">هیچ مانیتوری تنظیم نشده</div>';
        return;
    }
    
    list.innerHTML = monitors.map(m => {
        const price = m.cached_price;
        const extra = typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra;
        const decimals = extra.decimals || 0;
        const unit = extra.unit || '';
        
        let priceStr = '—';
        if (price && price.price) {
            priceStr = Number(price.price).toLocaleString('fa-IR', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
            if (unit) priceStr += ` ${unit}`;
        }
        
        return `
        <div class="monitor-item ${m.enabled ? '' : 'disabled'}" id="monitor-${m.id}">
            <div class="monitor-info">
                <span class="monitor-label">${m.label}</span>
                <span class="monitor-meta">${m.source} / ${m.code}</span>
            </div>
            <div class="monitor-price">${priceStr}</div>
            <div class="monitor-actions">
                <button class="btn btn-sm btn-toggle ${m.enabled ? '' : 'off'}" 
                        onclick="toggleMonitor(${m.id}, ${!m.enabled})">
                    ${m.enabled ? 'فعال' : 'غیرفعال'}
                </button>
                <button class="btn btn-sm btn-delete" onclick="deleteMonitor(${m.id})">حذف</button>
            </div>
        </div>
        `;
    }).join('');
}

async function toggleMonitor(id, enabled) {
    try {
        await API.post(`/api/toggle/${id}`, { enabled });
        showToast(enabled ? 'فعال شد' : 'غیرفعال شد');
        refreshData();
    } catch (e) {
        showToast('خطا: ' + e.message, true);
    }
}

async function deleteMonitor(id) {
    if (!confirm('آیا مطمئن هستید؟')) return;
    try {
        await API.delete(`/api/monitors/${id}`);
        showToast('حذف شد');
        refreshData();
    } catch (e) {
        showToast('خطا: ' + e.message, true);
    }
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
    
    try {
        await API.post('/api/monitors', data);
        showToast('مانیتور اضافه شد');
        e.target.reset();
        refreshData();
    } catch (e) {
        showToast('خطا: ' + e.message, true);
    }
}

async function updateTemplate(e) {
    e.preventDefault();
    
    const data = {
        template: document.getElementById('templateInput').value,
        update_interval_minutes: document.getElementById('intervalInput').value
    };
    
    try {
        await API.post('/api/settings', data);
        showToast('تنظیمات ذخیره شد');
    } catch (e) {
        showToast('خطا: ' + e.message, true);
    }
}

async function refreshPreview() {
    try {
        const monitors = await API.get('/api/monitors');
        let text = '📊 قیمت‌های لحظه‌ای\n\n';
        
        for (const m of monitors) {
            if (!m.enabled || !m.cached_price) continue;
            const extra = typeof m.extra === 'string' ? JSON.parse(m.extra || '{}') : m.extra;
            const decimals = extra.decimals || 0;
            const unit = extra.unit || '';
            const price = Number(m.cached_price.price).toLocaleString('fa-IR', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
            text += `▫️ ${m.label}: ${price} ${unit}\n`;
        }
        
        text += '\n🔄 هر ۲ ساعت به‌روزرسانی می‌شود';
        document.getElementById('previewBox').textContent = text;
    } catch (e) {
        document.getElementById('previewBox').textContent = 'خطا در دریافت پیش‌نمایش';
    }
}

async function forceUpdate() {
    try {
        await API.post('/api/prices/refresh');
        await updateTelegraphNow();
        showToast('قیمت‌ها به‌روزرسانی شد');
        refreshData();
    } catch (e) {
        showToast('خطا: ' + e.message, true);
    }
}

async function startBot() {
    try {
        await API.post('/api/bot/start');
        showToast('بات شروع به کار کرد');
    } catch (e) {
        showToast('خطا: ' + e.message, true);
    }
}

async function stopBot() {
    try {
        await API.post('/api/bot/stop');
        showToast('بات متوقف شد');
    } catch (e) {
        showToast('خطا: ' + e.message, true);
    }
}

// Telegraph functions
async function createTelegraphAccount() {
    const shortName = document.getElementById('telegraphName').value || 'cryptoprice';
    try {
        const result = await API.post('/api/telegraph/create_account', { short_name: shortName });
        if (result.success) {
            showToast('اکانت ساخته شد');
            checkTelegraphStatus();
        }
    } catch (e) {
        showToast('خطا: ' + e.message, true);
    }
}

async function updateTelegraphNow() {
    try {
        await API.post('/api/telegraph/update', {});
        showToast('صفحه Telegraph آپدیت شد');
        checkTelegraphStatus();
    } catch (e) {
        showToast('خطا: ' + e.message, true);
    }
}

function copyTelegraph() {
    const url = document.getElementById('telegraphUrl').value;
    navigator.clipboard.writeText(url);
    showToast('لینک کپی شد');
}

function showToast(msg, isError = false) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
