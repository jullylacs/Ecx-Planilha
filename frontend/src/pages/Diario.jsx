import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, ComposedChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Plus, Trash2, RotateCcw, Activity, LogOut, Sparkles, Loader2,
  Target, Wallet, Calendar, CalendarDays, CalendarRange, Percent,
  TrendingUp, TrendingDown, Gauge, ListChecks, LineChart as LineChartIcon,
  BarChart3, PieChart as PieChartIcon, CircleDollarSign, AlertTriangle,
} from "lucide-react";
import api from "../services/api";
import { C } from "../theme";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const tempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const isTempId = (id) => typeof id === "string" && id.startsWith("temp-");

const fmt = (v) => {
  const n = Number(v) || 0;
  const sign = n < 0 ? "-" : "";
  return sign + "R$ " + Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtPontos = (v) => {
  const n = Number(v) || 0;
  return (n >= 0 ? "+" : "") + n.toFixed(1);
};
const fmtDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}`;
};
const weekNum = (d) => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

// _key é a identidade da linha para o React (nunca muda) — evita remontar a linha (e perder o
// foco de um campo em edição) quando o id local temporário é trocado pelo id real do backend.
const blankRow = () => {
  const key = tempId();
  return { id: key, _key: key, data: "", pontos: "", financeiro: "" };
};

const isReadyRow = (r) => r && r.data && r.pontos !== "" && r.pontos !== null;

// Linha só entra nos cards/gráficos quando pontos E financeiro foram preenchidos manualmente.
const isCompleteRow = (r) => isReadyRow(r) && r.financeiro !== "" && r.financeiro !== null && r.financeiro !== undefined;

// Normaliza uma linha vinda do backend: financeiro (número ou null) vira string editável,
// e recebe uma _key estável caso ainda não tenha uma.
const normalizeRow = (row) => ({
  ...row,
  _key: row._key ?? String(row.id),
  financeiro: row.financeiro === null || row.financeiro === undefined ? "" : String(row.financeiro),
});

function Card({ label, value, color = C.branco, icon: Icon, accent }) {
  const tint = accent || color;
  return (
    <div
      className="flex flex-col gap-2.5 justify-center min-w-0 p-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: C.panel1, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {Icon && (
          <span className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 24, height: 24, background: `${tint}22`, color: tint }}>
            <Icon size={13} strokeWidth={2.3} />
          </span>
        )}
        <span style={{ color: C.roxoClaro, fontSize: 10.5 }} className="font-bold uppercase tracking-wider truncate">{label}</span>
      </div>
      <span style={{ color, fontFamily: "var(--font-display)" }} className="text-xl font-extrabold tabular-nums truncate">{value}</span>
    </div>
  );
}

function ConfirmDialog({ open, title, message, confirmLabel, tone = "danger", onConfirm, onCancel }) {
  if (!open) return null;
  const toneColor = tone === "danger" ? C.vermelho : C.roxoMed;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,15,0.72)", backdropFilter: "blur(2px)" }}
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="fade-in w-full max-w-sm rounded-2xl p-5"
        style={{ background: C.panel1, border: `1px solid ${C.border}`, boxShadow: "0 24px 60px -12px rgba(0,0,0,0.6)" }}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <span
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 34, height: 34, background: `${toneColor}22`, color: toneColor }}
          >
            <AlertTriangle size={17} strokeWidth={2.3} />
          </span>
          <h3 style={{ color: C.branco }} className="text-sm font-bold tracking-wide">{title}</h3>
        </div>
        <p style={{ color: C.cinza }} className="text-xs leading-relaxed mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-150 hover:-translate-y-0.5"
            style={{ background: C.panel2, color: C.branco, border: `1px solid ${C.border}` }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110"
            style={{ background: toneColor, color: "#fff", boxShadow: `0 6px 18px -8px ${toneColor}` }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChartPanel({ title, icon: Icon, children, height = 220, empty, emptyLabel }) {
  return (
    <div className="p-4 rounded-2xl" style={{ background: C.panel1, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon size={14} color={C.roxoMed} strokeWidth={2.3} />}
        <h3 style={{ color: C.branco }} className="text-xs font-bold tracking-wide">{title}</h3>
      </div>
      {empty ? (
        <div style={{ height, color: C.cinza }} className="flex flex-col items-center justify-center gap-2 text-sm">
          <BarChart3 size={30} strokeWidth={1.4} style={{ opacity: 0.28 }} />
          <span>{emptyLabel}</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>
      )}
    </div>
  );
}

const tooltipStyle = { background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 12, color: C.branco };
const tooltipItemStyle = { color: C.branco };
const tickStyle = { fill: C.cinza, fontSize: 11 };

export default function Diario() {
  const navigate = useNavigate();
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null); // "clear" | "example" | null
  const errorTimer = useRef(null);
  const lastGoodRef = useRef(new Map()); // id -> último estado confirmado pelo backend

  const showError = (message) => {
    setErrorMsg(message);
    clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setErrorMsg(""), 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/daily-results");
        const normalized = res.data.map(normalizeRow);
        setResults(normalized);
        normalized.forEach((r) => lastGoodRef.current.set(r.id, r));
      } catch {
        showError("Falha ao carregar seus dados");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const syncResult = async (row) => {
    if (!isReadyRow(row)) return;
    const payload = { data: row.data, pontos: Number(row.pontos), financeiro: row.financeiro === "" ? null : Number(row.financeiro) };
    try {
      const res = isTempId(row.id)
        ? await api.post("/daily-results", payload)
        : await api.put(`/daily-results/${row.id}`, payload);
      // Só adota o id retornado pelo backend — preserva os valores atuais da linha (podem já ter
      // sido editados de novo, ex: usuário passou para o campo financeiro enquanto isso salvava).
      setResults((prev) => prev.map((r) => {
        if (r.id !== row.id) return r;
        const merged = { ...r, id: res.data.id };
        lastGoodRef.current.set(res.data.id, merged);
        return merged;
      }));
    } catch (err) {
      showError(err?.response?.data?.message || "Falha ao salvar fechamento");
      // reverte para o último estado confirmado pelo backend (ou remove, se nunca chegou a salvar)
      const good = lastGoodRef.current.get(row.id);
      if (good) {
        setResults((prev) => prev.map((r) => (r.id === row.id ? good : r)));
      } else if (isTempId(row.id)) {
        setResults((prev) => prev.filter((r) => r.id !== row.id));
      }
    }
  };

  const handleFieldChange = (id, field, value, syncNow) => {
    const current = results.find((r) => r.id === id);
    const merged = { ...current, [field]: value };
    setResults((prev) => prev.map((r) => (r.id === id ? merged : r)));
    if (syncNow) syncResult(merged);
  };

  const handleFieldBlur = (id) => {
    const current = results.find((r) => r.id === id);
    if (current) syncResult(current);
  };

  const addRow = () => setResults((prev) => [...prev, blankRow()]);

  const removeRow = async (id) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
    lastGoodRef.current.delete(id);
    if (!isTempId(id)) {
      try {
        await api.delete(`/daily-results/${id}`);
      } catch {
        showError("Falha ao remover fechamento");
      }
    }
  };

  const resetExample = async () => {
    try {
      const res = await api.post("/daily-results/seed");
      const normalized = res.data.map(normalizeRow);
      setResults(normalized);
      lastGoodRef.current = new Map(normalized.map((r) => [r.id, r]));
    } catch {
      showError("Falha ao carregar exemplo");
    }
  };

  const clearAll = async () => {
    try {
      await api.delete("/daily-results");
      setResults([]);
      lastGoodRef.current = new Map();
    } catch {
      showError("Falha ao limpar fechamentos");
    }
  };

  const calcById = useMemo(() => {
    const map = new Map();
    const ready = results.filter((r) => isCompleteRow(r));
    ready.sort((a, b) => a.data.localeCompare(b.data));
    let running = 0;
    ready.forEach((r) => {
      const pontos = parseFloat(r.pontos);
      const financeiro = parseFloat(r.financeiro);
      running += financeiro;
      map.set(r.id, { pontos, financeiro, acumulado: running, dateObj: new Date(r.data + "T00:00:00") });
    });
    return map;
  }, [results]);

  const withAccum = useMemo(
    () => results.filter((r) => calcById.has(r.id)).map((r) => ({ ...r, ...calcById.get(r.id) })).sort((a, b) => a.dateObj - b.dateObj),
    [results, calcById]
  );

  // Tabela mostra os mais recentes no topo; linhas em branco (sem data ainda) ficam no topo também.
  const tableRows = useMemo(
    () => [...results].sort((a, b) => (!a.data ? -1 : !b.data ? 1 : b.data.localeCompare(a.data))),
    [results]
  );

  const total = withAccum.reduce((s, r) => s + r.financeiro, 0);
  const positiveDays = withAccum.filter((r) => r.financeiro > 0);
  const negativeDays = withAccum.filter((r) => r.financeiro < 0);
  const assertividade = withAccum.length ? positiveDays.length / withAccum.length : 0;
  const somaGanhos = positiveDays.reduce((s, r) => s + r.financeiro, 0);
  const somaPerdas = Math.abs(negativeDays.reduce((s, r) => s + r.financeiro, 0));
  const fatorLucro = somaPerdas > 0 ? somaGanhos / somaPerdas : somaGanhos > 0 ? somaGanhos : 0;

  const latest = withAccum.length ? withAccum[withAccum.length - 1].dateObj : null;
  const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
  const sameWeek = (a, b) => a && b && weekNum(a) === weekNum(b) && a.getFullYear() === b.getFullYear();
  const sameMonth = (a, b) => a && b && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const sameYear = (a, b) => a && b && a.getFullYear() === b.getFullYear();

  const dayT = latest ? withAccum.filter((r) => sameDay(r.dateObj, latest)) : [];
  const weekT = latest ? withAccum.filter((r) => sameWeek(r.dateObj, latest)) : [];
  const monthT = latest ? withAccum.filter((r) => sameMonth(r.dateObj, latest)) : [];
  const yearT = latest ? withAccum.filter((r) => sameYear(r.dateObj, latest)) : [];

  const pontosDia = dayT.reduce((s, r) => s + r.pontos, 0);
  const resultDia = dayT.reduce((s, r) => s + r.financeiro, 0);
  const resultSemana = weekT.reduce((s, r) => s + r.financeiro, 0);
  const resultMes = monthT.reduce((s, r) => s + r.financeiro, 0);
  const resultAno = yearT.reduce((s, r) => s + r.financeiro, 0);

  const weeklyData = useMemo(() => {
    const map = new Map();
    withAccum.forEach((r) => {
      const wk = weekNum(r.dateObj);
      const year = r.dateObj.getFullYear();
      const key = `${year}-${wk}`;
      if (!map.has(key)) map.set(key, { key, label: `S${wk}`, resultado: 0, order: year * 100 + wk });
      map.get(key).resultado += r.financeiro;
    });
    let run = 0;
    return Array.from(map.values()).sort((a, b) => a.order - b.order).map((w) => { run += w.resultado; return { ...w, acumulado: run }; });
  }, [withAccum]);

  const monthlyData = useMemo(() => {
    const map = new Map();
    withAccum.forEach((r) => {
      const m = r.dateObj.getMonth(), y = r.dateObj.getFullYear();
      const key = `${y}-${m}`;
      if (!map.has(key)) map.set(key, { key, label: `${MESES[m]}/${String(y).slice(2)}`, resultado: 0, order: y * 12 + m });
      map.get(key).resultado += r.financeiro;
    });
    let run = 0;
    return Array.from(map.values()).sort((a, b) => a.order - b.order).map((m) => { run += m.resultado; return { ...m, acumulado: run }; });
  }, [withAccum]);

  const positiveNegativeData = [{ name: "Dias positivos", value: positiveDays.length }, { name: "Dias negativos", value: negativeDays.length }];
  const ganhoPerdaData = [{ name: "Ganho", value: somaGanhos }, { name: "Perda", value: somaPerdas }];
  const hasData = withAccum.length > 0;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.cinza, gap: 12 }}>
        <Loader2 className="animate-spin" size={28} color={C.roxoMed} />
        <span className="text-sm">Carregando diário...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 md:px-6 py-3.5 backdrop-blur-md"
        style={{ background: "rgba(10,10,15,0.82)", borderBottom: `1px solid ${C.border}` }}
      >
        <span
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${C.roxo}, ${C.roxoMed})`, boxShadow: `0 6px 18px -6px ${C.roxoMed}` }}
        >
          <Activity size={18} color="#fff" strokeWidth={2.4} />
        </span>
        <div className="leading-tight min-w-0">
          <h1 style={{ color: C.branco, fontFamily: "var(--font-display)" }} className="text-sm md:text-lg font-extrabold tracking-tight truncate">
            Diário de fechamentos
          </h1>
          <span style={{ color: C.cinza }} className="text-[11px] hidden sm:inline">mini índice · WIN</span>
        </div>
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          {storedUser?.nome && (
            <span style={{ color: C.cinza, border: `1px solid ${C.border}` }} className="hidden sm:inline text-xs px-2.5 py-1 rounded-full">
              {storedUser.nome}
            </span>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#F43F5E1a] hover:border-[#F43F5E]"
            style={{ background: C.panel2, color: C.vermelho, border: `1px solid ${C.border}` }}
          >
            <LogOut size={13} /> Sair
          </button>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto p-3 md:p-6">
        {errorMsg && (
          <div className="fade-in px-4 py-2.5 text-xs mb-3 rounded-xl" style={{ background: "rgba(244,63,94,0.12)", border: `1px solid ${C.vermelho}`, color: C.vermelho }}>
            {errorMsg}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ color: C.roxoClaro, background: `${C.roxoMed}1a`, border: `1px solid ${C.roxoMed}40` }}
          >
            <Sparkles size={12} /> Mini índice (WIN) · R$0,20/pt (B3)
          </span>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setConfirmDialog("example")}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:border-[#8B5CF6] hover:text-[#C4B5FD]"
              style={{ background: C.panel2, color: C.branco, border: `1px solid ${C.border}` }}
            >
              <RotateCcw size={13} /> Exemplo
            </button>
            <button
              onClick={() => setConfirmDialog("clear")}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#F43F5E1a] hover:border-[#F43F5E]"
              style={{ background: C.panel2, color: C.vermelho, border: `1px solid ${C.border}` }}
            >
              <Trash2 size={13} /> Limpar
            </button>
          </div>
        </div>

        <div
          className="relative mt-4 rounded-2xl p-6 md:p-8 text-center overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${C.roxoEsc}, ${C.roxo} 55%, ${C.roxoMed})`,
            border: `1px solid ${C.roxoMed}`,
            boxShadow: `0 24px 60px -24px ${C.roxoMed}99`,
          }}
        >
          <TrendingUp size={160} strokeWidth={1} style={{ position: "absolute", right: -24, top: -30, opacity: 0.12, color: "#fff" }} />
          <div style={{ color: C.roxoClaro, fontSize: 11 }} className="relative font-bold tracking-[0.2em] uppercase mb-2">
            Resultado total acumulado
          </div>
          <div style={{ color: total >= 0 ? "#fff" : "#FCA5B1", fontFamily: "var(--font-display)" }} className="relative text-4xl md:text-5xl font-extrabold tracking-tight">
            {fmt(total)}
          </div>
          {hasData && (
            <div style={{ color: "rgba(255,255,255,0.62)" }} className="relative text-xs mt-2.5">
              {fmtDate(withAccum[0].data)} — {fmtDate(withAccum[withAccum.length - 1].data)} · {withAccum.length} dia{withAccum.length !== 1 ? "s" : ""} lançados
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-4">
          <Card label="Pontos do dia" value={fmtPontos(pontosDia)} color={pontosDia >= 0 ? C.verde : C.vermelho} icon={Target} accent={pontosDia >= 0 ? C.verde : C.vermelho} />
          <Card label="Resultado do dia" value={fmt(resultDia)} color={resultDia >= 0 ? C.verde : C.vermelho} icon={Wallet} accent={resultDia >= 0 ? C.verde : C.vermelho} />
          <Card label="Resultado da semana" value={fmt(resultSemana)} color={resultSemana >= 0 ? C.verde : C.vermelho} icon={Calendar} accent={resultSemana >= 0 ? C.verde : C.vermelho} />
          <Card label="Resultado do mês" value={fmt(resultMes)} color={resultMes >= 0 ? C.verde : C.vermelho} icon={CalendarDays} accent={resultMes >= 0 ? C.verde : C.vermelho} />
          <Card label="Resultado do ano" value={fmt(resultAno)} color={resultAno >= 0 ? C.verde : C.vermelho} icon={CalendarRange} accent={resultAno >= 0 ? C.verde : C.vermelho} />
          <Card label="Assertividade" value={`${(assertividade * 100).toFixed(1)}%`} icon={Percent} accent={C.roxoMed} />
          <Card label="Dias positivos" value={`${positiveDays.length}`} color={C.verde} icon={TrendingUp} accent={C.verde} />
          <Card label="Dias negativos" value={`${negativeDays.length}`} color={C.vermelho} icon={TrendingDown} accent={C.vermelho} />
          <Card label="Fator de lucro" value={`${fatorLucro.toFixed(2)}x`} icon={Gauge} accent={C.roxoMed} />
          <Card label="Dias lançados" value={`${withAccum.length}`} icon={ListChecks} accent={C.roxoClaro} />
        </div>

        <div className="mt-4">
          <ChartPanel title="Curva de capital — resultado acumulado" icon={LineChartIcon} empty={!hasData} emptyLabel="Adicione um fechamento para ver a curva">
            <AreaChart data={withAccum}>
              <defs>
                <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.roxoMed} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={C.roxoMed} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="data" tick={tickStyle} tickFormatter={fmtDate} />
              <YAxis tick={tickStyle} width={64} tickFormatter={(v) => `R$${v}`} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.branco }} formatter={(v) => fmt(v)} labelFormatter={fmtDate} />
              <Area type="monotone" dataKey="acumulado" stroke={C.roxoMed} strokeWidth={2.5} fill="url(#eq)" />
            </AreaChart>
          </ChartPanel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <ChartPanel title="Semanal — resultado e acumulado" icon={BarChart3} height={190}>
            <ComposedChart data={weeklyData}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={tickStyle} />
              <YAxis tick={tickStyle} width={56} tickFormatter={(v) => `R$${v}`} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.branco }} formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.cinza }} />
              <Bar dataKey="resultado" name="Resultado" fill={C.roxoMed} radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="acumulado" name="Acumulado" stroke={C.branco} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ChartPanel>
          <ChartPanel title="Mensal — resultado e acumulado" icon={BarChart3} height={190}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={tickStyle} />
              <YAxis tick={tickStyle} width={56} tickFormatter={(v) => `R$${v}`} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: C.branco }} formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.cinza }} />
              <Bar dataKey="resultado" name="Resultado" fill={C.roxoEsc} radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="acumulado" name="Acumulado" stroke={C.branco} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ChartPanel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <ChartPanel title="Dias positivos x negativos" icon={PieChartIcon} height={190}>
            <PieChart>
              <Pie data={positiveNegativeData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={3} label={({ percent }) => (percent ? `${(percent * 100).toFixed(0)}%` : "")} labelLine={false}>
                <Cell fill={C.verde} />
                <Cell fill={C.vermelho} />
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11, color: C.cinza }} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={{ color: C.branco }} />
            </PieChart>
          </ChartPanel>
          <ChartPanel title="Ganho x perda (R$, total)" icon={CircleDollarSign} height={190}>
            <PieChart>
              <Pie data={ganhoPerdaData} dataKey="value" nameKey="name" outerRadius={72} label={({ percent }) => (percent ? `${(percent * 100).toFixed(0)}%` : "")} labelLine={false}>
                <Cell fill={C.roxoMed} />
                <Cell fill={C.panel2} stroke={C.border} />
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11, color: C.cinza }} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={{ color: C.branco }} formatter={(v) => fmt(v)} />
            </PieChart>
          </ChartPanel>
        </div>

        <div className="rounded-2xl p-4 mt-3" style={{ background: C.panel1, border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 style={{ color: C.branco }} className="text-xs font-bold tracking-wide">Fechamentos diários</h3>
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 hover:brightness-110"
              style={{ background: `linear-gradient(135deg, ${C.roxo}, ${C.roxoMed})`, color: "#fff", boxShadow: `0 6px 18px -8px ${C.roxoMed}` }}
            >
              <Plus size={14} /> Novo fechamento
            </button>
          </div>
          <div className="overflow-x-auto overflow-y-auto rounded-xl" style={{ maxHeight: 480, border: `1px solid ${C.border}` }}>
            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr className="sticky top-0 z-[1]" style={{ background: C.roxoEsc }}>
                  {["Data", "Resultado do Dia (Pontos)", "Resultado do Dia (R$)", "Dia Positivo? (S/N)", ""].map((h) => (
                    <th key={h} style={{ color: C.branco }} className="p-2.5 font-semibold text-center whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r, i) => {
                  const c = calcById.get(r.id);
                  const posColor = c ? (c.financeiro >= 0 ? C.verde : C.vermelho) : C.cinza;
                  return (
                    <tr
                      key={r._key}
                      className={i % 2 === 0 ? "bg-[#1B1B24] hover:bg-[#8B5CF614]" : "bg-[#24242F] hover:bg-[#8B5CF614]"}
                      style={{ borderBottom: `1px solid ${C.border}`, transition: "background-color 0.12s ease" }}
                    >
                      <td className="p-1.5">
                        <input
                          type="date" value={r.data} onChange={(e) => handleFieldChange(r.id, "data", e.target.value, true)}
                          className="w-full text-xs p-1.5 rounded-md focus:border-[#8B5CF6] focus:ring-[2px] focus:ring-[#8B5CF633] outline-none"
                          style={{ background: "transparent", color: C.branco, colorScheme: "dark", border: "1px solid transparent" }}
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number" step="0.1" value={r.pontos}
                          onChange={(e) => handleFieldChange(r.id, "pontos", e.target.value, false)} onBlur={() => handleFieldBlur(r.id)}
                          className="w-24 text-xs p-1.5 rounded-md text-right tabular-nums focus:border-[#8B5CF6] focus:ring-[2px] focus:ring-[#8B5CF633] outline-none"
                          style={{ background: C.panel2, color: C.branco, border: `1px solid ${C.border}` }}
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number" step="0.01" value={r.financeiro}
                          onChange={(e) => handleFieldChange(r.id, "financeiro", e.target.value, false)} onBlur={() => handleFieldBlur(r.id)}
                          className="w-24 text-xs p-1.5 rounded-md text-right tabular-nums font-bold focus:border-[#8B5CF6] focus:ring-[2px] focus:ring-[#8B5CF633] outline-none"
                          style={{ background: C.panel2, color: posColor, border: `1px solid ${C.border}` }}
                        />
                      </td>
                      <td className="p-1.5 text-center">
                        {c ? (
                          <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: `${posColor}22`, color: posColor }}>
                            {c.financeiro >= 0 ? "S" : "N"}
                          </span>
                        ) : (
                          <span style={{ color: C.cinza }}>—</span>
                        )}
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          onClick={() => removeRow(r.id)}
                          aria-label="Remover fechamento"
                          className="inline-flex items-center justify-center rounded-lg p-1.5 transition-all duration-150 hover:bg-[#F43F5E22]"
                          style={{ color: C.vermelho }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8">
                      <div className="flex flex-col items-center gap-2" style={{ color: C.cinza }}>
                        <ListChecks size={26} strokeWidth={1.4} style={{ opacity: 0.35 }} />
                        <span>Nenhum fechamento. Clique em "Novo fechamento" para começar.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDialog === "clear"}
        title="Limpar todos os fechamentos?"
        message="Tem certeza? Todos os dados serão excluídos permanentemente."
        confirmLabel="Limpar tudo"
        tone="danger"
        onCancel={() => setConfirmDialog(null)}
        onConfirm={() => {
          setConfirmDialog(null);
          clearAll();
        }}
      />
      <ConfirmDialog
        open={confirmDialog === "example"}
        title="Carregar dados de exemplo?"
        message="Isso vai substituir todos os seus fechamentos atuais pelos dados de exemplo, de forma permanente."
        confirmLabel="Carregar exemplo"
        tone="warning"
        onCancel={() => setConfirmDialog(null)}
        onConfirm={() => {
          setConfirmDialog(null);
          resetExample();
        }}
      />
    </div>
  );
}
