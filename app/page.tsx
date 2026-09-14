"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Plus, RefreshCw, ExternalLink, Copy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MonitorItem } from "@/components/MonitorItem";
import { AddMonitorForm } from "@/components/AddMonitorForm";
import { api } from "@/lib/api";
import type { Monitor } from "@/lib/api";

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [tgName, setTgName] = useState("cryptoprice");
  const [tgUrl, setTgUrl] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [mons, tgStatus] = await Promise.all([
        api.getMonitors(),
        api.getTelegraphStatus().catch(() => null),
      ]);
      setMonitors(mons);
      setTgUrl(tgStatus?.url || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("apiBaseUrl") || "";
    setApiUrl(saved);
    if (saved) refresh();
    else setLoading(false);
  }, []);

  const saveApiUrl = () => {
    if (!apiUrl.trim()) return;
    localStorage.setItem("apiBaseUrl", apiUrl.trim());
    setLoading(true);
    refresh();
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

  const toggleMon = async (id: string, enabled: boolean) => {
    await api.toggleMonitor(id, enabled);
    refresh();
  };

  const delMon = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    await api.deleteMonitor(id);
    refresh();
  };

  const copyLink = () => {
    if (tgUrl) {
      navigator.clipboard.writeText(tgUrl);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Zap className="h-6 w-6 text-red-400" />
            داشبورد قیمت‌های لحظه‌ای
          </h1>
          <p className="text-slate-400 text-sm mb-4">مدیریت مانیتورها و صفحه Telegraph</p>
          <div className="flex gap-2 flex-wrap">
            <span className="bg-slate-800/60 px-3 py-1 rounded-full text-xs text-slate-300 border border-slate-700/50">
              🟢 {activeCount} فعال
            </span>
            <span className="bg-slate-800/60 px-3 py-1 rounded-full text-xs text-slate-300 border border-slate-700/50">
              ⚪ {disabledCount} غیرفعال
            </span>
            <span className="bg-slate-800/60 px-3 py-1 rounded-full text-xs text-slate-300 border border-slate-700/50">
              📡 {monitors.length} کل
            </span>
          </div>
        </motion.header>

        {/* API Connection */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">🔗 اتصال به ورکر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Input
                  type="url"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://crypto-paragraph.xxx.workers.dev"
                  className="flex-1 min-w-[200px]"
                  dir="ltr"
                />
                <Button onClick={saveApiUrl} variant="default">اتصال</Button>
                <Button onClick={refresh} variant="secondary"><RefreshCw className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Telegraph */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">📝 صفحه Telegraph</CardTitle>
            </CardHeader>
            <CardContent>
              {!tgUrl ? (
                <div>
                  <p className="text-slate-400 text-sm mb-3">اکانت Telegraph بسازید:</p>
                  <div className="flex gap-2">
                    <Input value={tgName} onChange={(e) => setTgName(e.target.value)} className="max-w-[200px]" dir="ltr" />
                    <Button onClick={async () => { await api.createTelegraphAccount(tgName); refresh(); }} variant="success">ساخت اکانت</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-emerald-400 text-sm mb-2">✅ صفحه فعال:</p>
                  <div className="bg-slate-800/70 rounded-lg px-3 py-2 text-sm break-all text-left border border-slate-700 mb-3" dir="ltr">
                    <a href={tgUrl} target="_blank" rel="noreferrer" className="text-red-400 hover:text-red-300">{tgUrl}</a>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={copyLink} variant="default" className="flex items-center gap-1.5"><Copy className="h-4 w-4" /> کپی</Button>
                    <Button onClick={async () => { await api.updateTelegraph(); }} variant="secondary"><RefreshCw className="h-4 w-4" /> آپدیت</Button>
                    <a href={tgUrl} target="_blank" rel="noreferrer"><Button variant="secondary"><ExternalLink className="h-4 w-4" /> باز کردن</Button></a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Monitors */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList>
                    <TabsTrigger value="active">🟢 فعال <span className="ml-1 bg-slate-700 px-1.5 py-0.5 rounded-full text-[10px]">{activeCount}</span></TabsTrigger>
                    <TabsTrigger value="disabled">⚪ غیرفعال <span className="ml-1 bg-slate-700 px-1.5 py-0.5 rounded-full text-[10px]">{disabledCount}</span></TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button onClick={() => setShowAdd(true)} size="sm" variant="default" className="flex items-center gap-1.5">
                  <Plus className="h-4 w-4" /> افزودن
                </Button>
              </div>
              <div className="mt-3">
                <Input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="🔍 جستجو..."
                  className="h-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {showAdd && (
                <AddMonitorForm
                  onAdd={async (data) => {
                    await api.addMonitor(data);
                    setShowAdd(false);
                    refresh();
                  }}
                  onClose={() => setShowAdd(false)}
                />
              )}

              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center text-slate-500 text-sm py-8">
                  {tab === "active" ? "مانیتور فعالی نیست" : "مانیتور غیرفعالی نیست"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((m) => (
                    <MonitorItem key={m.id} monitor={m} onToggle={toggleMon} onDelete={delMon} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
