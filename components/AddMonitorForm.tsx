"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

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

interface AddMonitorFormProps {
  onAdd: (data: any) => Promise<void>;
  onClose: () => void;
}

export function AddMonitorForm({ onAdd, onClose }: AddMonitorFormProps) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [source, setSource] = useState<"bitpin" | "frankfurter">("bitpin");
  const [code, setCode] = useState("");
  const [cat, setCat] = useState("crypto");
  const [unit, setUnit] = useState("");
  const [dec, setDec] = useState(0);
  const [showCh, setShowCh] = useState(true);

  const fill = (p: any) => {
    setName(p.name); setLabel(p.label); setSource(p.source);
    setCode(p.code); setCat(p.cat); setUnit(p.unit); setDec(p.dec); setShowCh(p.show);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !label || !code) return;
    await onAdd({
      name, label, source, code: code.toUpperCase(),
      extra: { category: cat, unit, decimals: dec, show_change: showCh },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm text-white">مانیتور جدید</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">نام انگلیسی</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="btc_irt" dir="ltr" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">برچسب فارسی</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="بیت‌کوین" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">منبع</label>
            <Select value={source} onValueChange={(v: any) => setSource(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bitpin">بیت‌پین</SelectItem>
                <SelectItem value="frankfurter">فرانکفرتر</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">کد</label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="BTC_IRT" dir="ltr" className="uppercase" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">دسته</label>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="crypto">💰 ارز دیجیتال</SelectItem>
                <SelectItem value="gold">🥇 طلا</SelectItem>
                <SelectItem value="currency">💵 ارزها</SelectItem>
                <SelectItem value="other">📊 سایر</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">واحد</label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="تومان" />
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">اعشار</label>
            <Input type="number" value={dec} onChange={(e) => setDec(parseInt(e.target.value))} min={0} max={10} className="w-20" />
          </div>
          <div className="flex items-center gap-2 pb-1">
            <Switch id="showCh" checked={showCh} onCheckedChange={setShowCh} />
            <label htmlFor="showCh" className="text-xs text-slate-400">نمایش تغییر</label>
          </div>
        </div>

        <div>
          <span className="text-xs text-slate-500">پیشنهاد:</span>
          <div className="flex gap-1.5 flex-wrap mt-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.code + p.name}
                type="button"
                onClick={() => fill(p)}
                className="bg-slate-700/60 hover:bg-slate-700 hover:border-red-400/30 px-2.5 py-1 rounded-lg text-xs transition border border-slate-600/50 text-slate-300"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" variant="success" className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> افزودن
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>انصراف</Button>
        </div>
      </form>
    </motion.div>
  );
}
