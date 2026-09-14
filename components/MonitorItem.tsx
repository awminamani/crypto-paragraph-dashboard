"use client";

import { motion } from "motion/react";
import { Trash2, Power, PowerOff, ExternalLink, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { Monitor } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  crypto: "💰 ارز دیجیتال",
  gold: "🥇 طلا",
  currency: "💵 ارزها",
  other: "📊 سایر",
};

function fmtNum(v: number, d: number) {
  if (!v || v === 0) return "—";
  return v.toLocaleString("fa-IR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

interface MonitorItemProps {
  monitor: Monitor;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
}

export function MonitorItem({ monitor, onToggle, onDelete }: MonitorItemProps) {
  const p = monitor.cached_price;
  const ex = monitor.extra || {};
  const d = ex.decimals ?? 0;
  const u = ex.unit || "";
  let ps = "—";
  if (p && p.price != null) {
    ps = fmtNum(p.price, d);
    if (u) ps += " " + u;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 transition-all hover:border-slate-700 ${
        !monitor.enabled ? "opacity-50" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{monitor.label}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {CATEGORY_LABELS[ex.category || "other"] || ex.category}
          </Badge>
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          {monitor.source} / {monitor.code}
        </div>
      </div>
      <div className="text-left font-mono text-sm px-3" dir="ltr">
        {ps}
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={monitor.enabled}
          onCheckedChange={(checked) => onToggle(monitor.id, checked)}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          onClick={() => onDelete(monitor.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
