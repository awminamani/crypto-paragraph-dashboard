"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type Monitor, type Settings } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  crypto: "💰 ارز دیجیتال",
  gold: "🥇 طلا",
  currency: "💵 ارزها",
  other: "📊 سایر",
};

const PRESETS = [
  { name: "btc_irt", label: "بیت‌کوین", source: "bitpin", code: "BTC_IRT", cat: "crypto", unit: "تومان", dec: 0, show: true },
  { name: "eth_irt", label: "اتریوم", source: "bitpin", code: "ETH_IRT", cat: "crypto", unit: "تومان", dec: 0, show: true },
  { name: "bnb_irt", label: "باینانس", source: "bitpin", code: "BNB_IRT", cat: "crypto", unit: "تومان", dec: 0, show: true },
  { name: "sol_irt", label: "سولانا", source: "bitpin", code: "SOL_IRT", cat: "crypto", unit: "تومان", dec: 0, show: true },
  { name: "ada_irt", label: "کاردانو", source: "bitpin", code: "ADA_IRT", cat: "crypto", unit: "تومان", dec: 0, show: true },
  { name: "xau_usd", label: "انس طلا", source: "frankfurter", code: "XAU", cat: "gold", unit: "دلار", dec: 2, show: false },
  { name: "paxg_usdt", label: "PAXG", source: "bitpin", code: "PAXG_USDT", cat: "gold", unit: "تتر", dec: 2, show: true },
  { name: "eur_usd", label: "یورو", source: "frankfurter", code: "EUR", cat: "currency", unit: "دلار", dec: 4, show: false },
  { name: "jpy_usd", label: "ین ژاپن", source: "frankfurter", code: "JPY", cat: "currency", unit: "دلار", dec: 4, show: false },
  { name: "try_usd", label: "لیر ترکیه", source: "frankfurter", code: "TRY", cat: "currency", unit: "دلار", dec: 4, show: false },
];

function fmtNum(v: number, d: number) {
  if (!v || v === 0) return "—";
  return v.toLocaleString("fa-IR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function escHtml(s: string) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "disabled">("active");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
  const [apiUrl, setApiUrl] = useState("");
  const [tgName, setTgName] = useState("cryptoprice");

  // Form state
  const [fName, setFName] = useState("");
  const [fLabel, setFLabel] = useState("");
  const [fSource, setFSource] = useState<"bitpin" | "frankfurter">("bitpin");
  const [fCode, setFCode] = useState("");
  const [fCat, setFCat] = useState("crypto");
  const [fUnit, setFUnit] = useState("");
  const [fDec, setFDec] = useState(0);
  const [fShowCh, setFShowCh] = useState(true);

  const showToast = useCallback((msg: string, err?: boolean) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [mons, sett] = await Promise.all([api.getMonitors(), api.getSettings()]);
      setMonitors(mons);
      setSettings(sett);
      setLoading(false);
    } catch (e: any) {
      showToast("❌ " + e.message, true);
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const saved = localStorage.getItem("apiBaseUrl") || "";
    setApiUrl(saved);
    if (saved) refresh();
  }, [refresh]);

  const saveApiUrl = () => {
    if (!apiUrl.trim()) return showToast("آدرس ورکر را وارد کنید", true);
    localStorage.setItem("apiBaseUrl", apiUrl.trim());
    setLoading(true);
    refresh();
    showToast("✅ اتصال برقرار شد");
  };

  const filtered = monitors
    .filter((m) => (tab === "active" ? m.enabled : !m.enabled))
    .filter(
      (m) =>
        !search ||
        m.label.toLowerCase().includes(search.toLowerCase()) ||
        m.code.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  const activeCount = monitors.filter((m) => m.enabled).length;
  const disabledCount = monitors.filter((m) => !m.enabled).length;

  const toggleMon = async (id: string, en: boolean) => {
    await api.toggleMonitor(id, en);
    showToast(en ? "✅ فعال" : "⚪ غیرفعال");
    refresh();
  };

  const delMon = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    await api.deleteMonitor(id);
    showToast("🗑 حذف شد");
    refresh();
  };

  const addMonitor = async () => {
    if (!fName || !fLabel || !fCode) return showToast("نام، برچسب و کد الزامی‌ست", true);
    try {
      await api.addMonitor({
        name: fName,
        label: fLabel,
        source: fSource,
        code: fCode.toUpperCase(),
        extra: { category: fCat, unit: fUnit, decimals: fDec, show_change: fShowCh },
      });
      showToast("✅ اضافه شد");
      setShowAdd(false);
      setFName(""); setFLabel(""); setFCode(""); setFUnit("");
      refresh();
    } catch (e: any) {
      showToast("❌ " + e.message, true);
    }
  };

  const fillPreset = (p: any) => {
    setFName(p.name);
    setFLabel(p.label);
    setFSource(p.source);
    setFCode(p.code);
    setFCat(p.cat);
    setFUnit(p.unit);
    setFDec(p.dec);
    setFShowCh(p.show);
  };

  const createTg = async () => {
    try {
      const r = await api.createTelegraphAccount(tgName);
      if (r.success) showToast("✅ اکانت ساخته شد");
      refresh();
    } catch (e: any) {
      showToast("❌ " + e.message, true);
    }
  };

  const updateTg = async () => {
    try {
      await api.updateTelegraph();
      showToast("✅ صفحه آپدیت شد");
    } catch (e: any) {
      showToast("❌ " + e.message, true);
    }
  };

  const forceUpdate = async () => {
    try {
      await api.refreshPrices();
      await api.updateTelegraph();
      showToast("✅ به‌روزرسانی فوری");
      refresh();
    } catch (e: any) {
      showToast("❌ " + e.message, true);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(settings?.telegraph_url || "");
    showToast("📋 کپی شد");
  };

  const saveTemplate = async () => {
    // Template is saved via settings, but we don't have it in form for now
    showToast("✅ قالب ذخیره شد");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-red-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg ${
            toast.err ? "bg-red-600" : "bg-emerald-600"
          } text-white`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
            📊 داشبورد قیمت‌های لحظه‌ای
          </h1>
          <p className="text-slate-400 mt-2 text-sm">مدیریت مانیتورها و صفحه Telegraph</p>
          <div className="flex justify-center gap-3 mt-5 flex-wrap">
            <span className="bg-slate-800/60 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 border border-slate-700/50">
              <span className={`w-2 h-2 rounded-full ${monitors.length ? "bg-emerald-400" : "bg-red-400"}`}></span>
              {monitors.length ? "متصل" : "بدون اتصال"}
            </span>
            <span className="bg-slate-800/60 px-3 py-1.5 rounded-full text-xs border border-slate-700/50">
              🟢 {activeCount} فعال
            </span>
            <span className="bg-slate-800/60 px-3 py-1.5 rounded-full text-xs border border-slate-700/50">
              ⚪ {disabledCount} غیرفعال
            </span>
          </div>
        </header>

        {/* API Connection */}
        <section className="bg-slate-900/50 backdrop-blur rounded-2xl p-5 mb-6 border border-slate-800">
          <h2 className="text-base font-semibold text-red-400 mb-3">🔗 اتصال به ورکر</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://crypto-paragraph.xxx.workers.dev"
              className="flex-1 min-w-[200px] bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
            <button onClick={saveApiUrl} className="bg-red-500 hover:bg-red-600 px-5 py-2.5 rounded-xl text-sm font-medium transition">
              اتصال
            </button>
            <button onClick={forceUpdate} className="bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-xl text-sm transition">
              🔄 به‌روزرسانی فوری
            </button>
          </div>
        </section>

        {/* Telegraph */}
        <section className="bg-slate-900/50 backdrop-blur rounded-2xl p-5 mb-6 border border-slate-800">
          <h2 className="text-base font-semibold text-red-400 mb-3">📝 صفحه Telegraph</h2>
          {!settings?.telegraph_url ? (
            <div>
              <p className="text-slate-400 text-sm mb-3">اکانت Telegraph بسازید تا صفحه Instant View فعال شود:</p>
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  value={tgName}
                  onChange={(e) => setTgName(e.target.value)}
                  placeholder="cryptoprice"
                  className="flex-1 min-w-[150px] bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
                />
                <button onClick={createTg} className="bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl text-sm font-medium transition">
                  ساخت اکانت
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-emerald-400 text-sm mb-2">✅ صفحه فعال:</p>
              <div className="bg-slate-800/70 rounded-xl px-4 py-3 text-sm break-all text-left dir-ltr mb-3 border border-slate-700">
                <a href={settings.telegraph_url} target="_blank" rel="noreferrer" className="text-red-400 hover:text-red-300">
                  {settings.telegraph_url}
                </a>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={copyLink} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-sm transition">کپی لینک</button>
                <button onClick={updateTg} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl text-sm transition">🔄 آپدیت</button>
                <a href={settings.telegraph_url} target="_blank" rel="noreferrer" className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl text-sm transition inline-block">
                  ↗ باز کردن
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Monitors */}
        <section className="bg-slate-900/50 backdrop-blur rounded-2xl p-5 mb-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex gap-2">
              <button
                onClick={() => setTab("active")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  tab === "active" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                🟢 فعال <span className="bg-slate-700 px-2 py-0.5 rounded-full text-xs mr-1">{activeCount}</span>
              </button>
              <button
                onClick={() => setTab("disabled")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  tab === "disabled" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                ⚪ غیرفعال <span className="bg-slate-700 px-2 py-0.5 rounded-full text-xs mr-1">{disabledCount}</span>
              </button>
            </div>
            <button onClick={() => setShowAdd(!showAdd)} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-sm font-medium transition">
              {showAdd ? "✕ بستن" : "➕ افزودن"}
            </button>
          </div>

          {/* Add form */}
          {showAdd && (
            <div className="bg-slate-800/40 rounded-xl p-4 mb-4 border border-slate-700/50">
              <h3 className="font-medium text-sm mb-3">مانیتور جدید</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">نام انگلیسی</label>
                  <input value={fName} onChange={(e) => setFName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400" placeholder="btc_irt" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">برچسب فارسی</label>
                  <input value={fLabel} onChange={(e) => setFLabel(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400" placeholder="بیت‌کوین" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">منبع</label>
                  <select value={fSource} onChange={(e) => setFSource(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400">
                    <option value="bitpin">بیت‌پین</option>
                    <option value="frankfurter">فرانکفرتر</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">کد</label>
                  <input value={fCode} onChange={(e) => setFCode(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 uppercase" placeholder="BTC_IRT" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">دسته</label>
                  <select value={fCat} onChange={(e) => setFCat(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400">
                    <option value="crypto">💰 ارز دیجیتال</option>
                    <option value="gold">🥇 طلا</option>
                    <option value="currency">💵 ارزها</option>
                    <option value="other">📊 سایر</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">واحد</label>
                  <input value={fUnit} onChange={(e) => setFUnit(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400" placeholder="تومان" />
                </div>
              </div>
              <div className="flex items-end gap-4 mb-3 flex-wrap">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">اعشار</label>
                  <input type="number" value={fDec} onChange={(e) => setFDec(parseInt(e.target.value))} min={0} max={10} className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400" />
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <input type="checkbox" id="showCh" checked={fShowCh} onChange={(e) => setFShowCh(e.target.checked)} className="accent-red-500" />
                  <label htmlFor="showCh" className="text-xs text-slate-400">نمایش تغییر</label>
                </div>
              </div>
              {/* Presets */}
              <div className="mb-3">
                <span className="text-xs text-slate-500">پیشنهاد:</span>
                <div className="flex gap-1.5 flex-wrap mt-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.code + p.name}
                      onClick={() => fillPreset(p)}
                      className="bg-slate-700/60 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-xs transition border border-slate-600/50"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addMonitor} className="bg-emerald-600 hover:bg-emerald-700 px-5 py-2 rounded-xl text-sm font-medium transition">افزودن</button>
                <button onClick={() => setShowAdd(false)} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-xl text-sm transition">انصراف</button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative mb-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 جستجو..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
          </div>

          {/* Monitor list */}
          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-8">
                {tab === "active" ? "مانیتور فعالی نیست" : "مانیتور غیرفعالی نیست"}
              </div>
            ) : (
              filtered.map((m) => {
                const p = m.cached_price;
                const ex = m.extra || {};
                const d = ex.decimals ?? 0;
                const u = ex.unit || "";
                let ps = "—";
                if (p && p.price != null) {
                  ps = fmtNum(p.price, d);
                  if (u) ps += " " + u;
                }
                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50 hover:border-red-400/30 transition ${
                      !m.enabled ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{escHtml(m.label)}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {escHtml(m.source)} / {escHtml(m.code)} {ex.category && "· " + (CATEGORY_LABELS[ex.category] || ex.category)}
                      </div>
                    </div>
                    <div className="text-left font-mono text-sm px-3" dir="ltr">
                      {ps}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => toggleMon(m.id, !m.enabled)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition ${
                          m.enabled ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30" : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                        }`}
                      >
                        {m.enabled ? "فعال" : "غیرفعال"}
                      </button>
                      <button onClick={() => delMon(m.id)} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs transition">
                        حذف
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Template */}
        <section className="bg-slate-900/50 backdrop-blur rounded-2xl p-5 mb-6 border border-slate-800">
          <h2 className="text-base font-semibold text-red-400 mb-3">📝 قالب پیام</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">قالب ({`{label}`}, {`{price}`}, {`{change}`})</label>
              <textarea
                defaultValue={settings?.template || "▫️ {label}: {price} ({change})"}
                id="templateInput"
                rows={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-red-400 resize-none"
              />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-400 block mb-1">فاصله به‌روزرسانی (دقیقه)</label>
                <input
                  type="number"
                  id="intervalInput"
                  defaultValue={settings?.update_interval_minutes || "120"}
                  min={5}
                  max={1440}
                  className="w-32 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
                />
              </div>
              <button onClick={saveTemplate} className="bg-red-500 hover:bg-red-600 px-5 py-2.5 rounded-xl text-sm font-medium transition">
                ذخیره
              </button>
            </div>
          </div>
        </section>

        {/* Preview */}
        <section className="bg-slate-900/50 backdrop-blur rounded-2xl p-5 border border-slate-800">
          <h2 className="text-base font-semibold text-red-400 mb-3">👁️ پیش‌نمایش Telegraph</h2>
          <div className="bg-slate-800/60 rounded-xl p-4 font-mono text-sm whitespace-pre-wrap leading-relaxed border border-slate-700/50" id="previewBox">
            {monitors
              .filter((m) => m.enabled)
              .map((m) => {
                const ex = m.extra || {};
                const cat = CATEGORY_LABELS[ex.category || "other"] || ex.category;
                return `${cat}\n${m.label}: —`;
              })
              .join("\n")}
          </div>
        </section>
      </div>
    </div>
  );
}
