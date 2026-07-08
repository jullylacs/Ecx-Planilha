import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, ComposedChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Plus, Trash2, RotateCcw, Activity, LogOut } from "lucide-react";
import api from "../services/api";
import { C } from "../theme";

const ASSET = { WIN: 0.2, WDO: 10.0 };
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const tempId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const isTempId = (id) => typeof id === "string" && id.startsWith("temp-");

const fmt = (v) => {
  const n = Number(v) || 0;
  const sign = n < 0 ? "-" : "";
  return sign + "R$ " + Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

const blankRow = () => ({ id: tempId(), data: "", ativo: "WIN", operacao: "Compra", contratos: 1, entrada: "", saida: "" });

const isReadyTrade = (t) => t && t.data && t.entrada !== "" && t.saida !== "" && t.contratos !== "" && t.entrada !== null && t.saida !== null;

function Card({ label, value, color = C.branco, bg = C.panel1 }) {
  return (
    <div style={{ background: bg, border: `1px solid ${C.border}`, borderRadius: 10 }} className="p-3 flex flex-col gap-1 justify-center min-w-0">
      <span style={{ color: C.roxoClaro, fontSize: 10 }} className="font-bold uppercase tracking-wide truncate">{label}</span>
      <span style={{ color }} className="text-lg font-bold">{value}</span>
    </div>
  );
}

function ChartPanel({ title, children, height = 220 }) {
  return (
    <div style={{ background: C.panel1, border: `1px solid ${C.border}`, borderRadius: 10 }} className="p-3">
      <h3 style={{ color: C.branco }} className="text-xs font-bold mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>
    </div>
  );
}

const tooltipStyle = { background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 };
const tickStyle = { fill: C.cinza, fontSize: 11 };

export default function Diario() {
  const navigate = useNavigate();
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  })();

  const [custo, setCusto] = useState(1.5);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const custoTimer = useRef(null);
  const errorTimer = useRef(null);

  const showError = (message) => {
    setErrorMsg(message);
    clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setErrorMsg(""), 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const [meRes, tradesRes] = await Promise.all([api.get("/users/me"), api.get("/trades")]);
        setCusto(Number(meRes.data.custo_operacao));
        setTrades(tradesRes.data);
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

  const handleCustoChange = (value) => {
    const parsed = parseFloat(value) || 0;
    setCusto(parsed);
    clearTimeout(custoTimer.current);
    custoTimer.current = setTimeout(async () => {
      try {
        await api.put("/users/me", { custo_operacao: parsed });
      } catch {
        showError("Falha ao salvar custo por operação");
      }
    }, 500);
  };

  const syncTrade = async (trade) => {
    if (!isReadyTrade(trade)) return;
    const payload = {
      data: trade.data,
      ativo: trade.ativo,
      operacao: trade.operacao,
      contratos: Number(trade.contratos),
      entrada: Number(trade.entrada),
      saida: Number(trade.saida),
    };
    try {
      if (isTempId(trade.id)) {
        const res = await api.post("/trades", payload);
        setTrades((prev) => prev.map((t) => (t.id === trade.id ? res.data : t)));
      } else {
        await api.put(`/trades/${trade.id}`, payload);
      }
    } catch (err) {
      showError(err?.response?.data?.message || "Falha ao salvar operação");
    }
  };

  const handleFieldChange = (id, field, value, syncNow) => {
    const current = trades.find((t) => t.id === id);
    const merged = { ...current, [field]: value };
    setTrades((prev) => prev.map((t) => (t.id === id ? merged : t)));
    if (syncNow) syncTrade(merged);
  };

  const handleFieldBlur = (id) => {
    const current = trades.find((t) => t.id === id);
    if (current) syncTrade(current);
  };

  const addTrade = () => setTrades((prev) => [...prev, blankRow()]);

  const removeTrade = async (id) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
    if (!isTempId(id)) {
      try {
        await api.delete(`/trades/${id}`);
      } catch {
        showError("Falha ao remover operação");
      }
    }
  };

  const resetExample = async () => {
    try {
      const res = await api.post("/trades/seed");
      setTrades(res.data);
    } catch {
      showError("Falha ao carregar exemplo");
    }
  };

  const clearAll = async () => {
    try {
      await api.delete("/trades");
      setTrades([]);
    } catch {
      showError("Falha ao limpar operações");
    }
  };

  const calcById = useMemo(() => {
    const map = new Map();
    const ready = trades.filter((t) => isReadyTrade(t));
    ready.sort((a, b) => a.data.localeCompare(b.data));
    let running = 0;
    ready.forEach((t) => {
      const entrada = parseFloat(t.entrada);
      const saida = parseFloat(t.saida);
      const contratos = parseFloat(t.contratos) || 0;
      const pontos = t.operacao === "Compra" ? saida - entrada : entrada - saida;
      const valorPonto = ASSET[t.ativo] ?? 0;
      const bruto = pontos * contratos * valorPonto;
      const custos = contratos * custo;
      const liquido = bruto - custos;
      running += liquido;
      map.set(t.id, { pontos, bruto, custos, liquido, acumulado: running, dateObj: new Date(t.data + "T00:00:00") });
    });
    return map;
  }, [trades, custo]);

  const withAccum = useMemo(
    () => trades.filter((t) => calcById.has(t.id)).map((t) => ({ ...t, ...calcById.get(t.id) })).sort((a, b) => a.dateObj - b.dateObj),
    [trades, calcById]
  );

  const total = withAccum.reduce((s, t) => s + t.liquido, 0);
  const wins = withAccum.filter((t) => t.liquido > 0);
  const losses = withAccum.filter((t) => t.liquido < 0);
  const taxaAcerto = withAccum.length ? wins.length / withAccum.length : 0;
  const somaGanhos = wins.reduce((s, t) => s + t.liquido, 0);
  const somaPerdas = Math.abs(losses.reduce((s, t) => s + t.liquido, 0));
  const fatorLucro = somaPerdas > 0 ? somaGanhos / somaPerdas : somaGanhos > 0 ? somaGanhos : 0;

  const latest = withAccum.length ? withAccum[withAccum.length - 1].dateObj : null;
  const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();
  const sameWeek = (a, b) => a && b && weekNum(a) === weekNum(b) && a.getFullYear() === b.getFullYear();
  const sameMonth = (a, b) => a && b && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  const dayT = latest ? withAccum.filter((t) => sameDay(t.dateObj, latest)) : [];
  const weekT = latest ? withAccum.filter((t) => sameWeek(t.dateObj, latest)) : [];
  const monthT = latest ? withAccum.filter((t) => sameMonth(t.dateObj, latest)) : [];

  const ganhoDia = dayT.filter((t) => t.liquido > 0).reduce((s, t) => s + t.liquido, 0);
  const perdaDia = dayT.filter((t) => t.liquido < 0).reduce((s, t) => s + t.liquido, 0);
  const resultDia = dayT.reduce((s, t) => s + t.liquido, 0);
  const resultSemana = weekT.reduce((s, t) => s + t.liquido, 0);
  const resultMes = monthT.reduce((s, t) => s + t.liquido, 0);

  const weeklyData = useMemo(() => {
    const map = new Map();
    withAccum.forEach((t) => {
      const wk = weekNum(t.dateObj);
      const key = `${t.dateObj.getFullYear()}-${wk}`;
      if (!map.has(key)) map.set(key, { key, label: `S${wk}`, resultado: 0 });
      map.get(key).resultado += t.liquido;
    });
    let run = 0;
    return Array.from(map.values()).map((w) => { run += w.resultado; return { ...w, acumulado: run }; });
  }, [withAccum]);

  const monthlyData = useMemo(() => {
    const map = new Map();
    withAccum.forEach((t) => {
      const m = t.dateObj.getMonth(), y = t.dateObj.getFullYear();
      const key = `${y}-${m}`;
      if (!map.has(key)) map.set(key, { key, label: `${MESES[m]}/${String(y).slice(2)}`, resultado: 0, order: y * 12 + m });
      map.get(key).resultado += t.liquido;
    });
    let run = 0;
    return Array.from(map.values()).sort((a, b) => a.order - b.order).map((m) => { run += m.resultado; return { ...m, acumulado: run }; });
  }, [withAccum]);

  const winLossData = [{ name: "Vencedoras", value: wins.length }, { name: "Perdedoras", value: losses.length }];
  const ganhoPerdaData = [{ name: "Ganho", value: somaGanhos }, { name: "Perda", value: somaPerdas }];
  const hasData = withAccum.length > 0;

  if (loading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.cinza }}>
        Carregando diário...
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif" }} className="p-3 md:p-5">
      <div style={{ background: "#000", borderBottom: `3px solid ${C.roxoMed}`, borderRadius: "10px 10px 0 0" }} className="px-4 py-3 flex items-center gap-2">
        <Activity size={22} color={C.roxoMed} />
        <h1 style={{ color: C.branco }} className="text-base md:text-xl font-bold tracking-tight">Diário de operações — mini índice</h1>
        <div className="ml-auto flex items-center gap-3">
          {storedUser?.nome && <span style={{ color: C.cinza }} className="text-xs">{storedUser.nome}</span>}
          <button onClick={logout} style={{ background: C.panel2, color: C.vermelho, border: `1px solid ${C.border}` }} className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold">
            <LogOut size={13} /> Sair
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: "rgba(244,63,94,0.12)", border: `1px solid ${C.vermelho}`, color: C.vermelho }} className="px-4 py-2 text-xs mt-2 rounded">
          {errorMsg}
        </div>
      )}

      <div style={{ background: C.panel1, borderBottom: `1px solid ${C.border}` }} className="px-4 py-2.5 flex flex-wrap items-center gap-3 mt-2">
        <label style={{ color: C.roxoClaro }} className="text-xs font-semibold">Custo por operação (R$/contrato):</label>
        <input
          type="number" step="0.1" value={custo} onChange={(e) => handleCustoChange(e.target.value)}
          style={{ background: C.panel2, color: C.branco, border: `1px dashed ${C.roxoMed}`, borderRadius: 6 }}
          className="px-2 py-1 w-20 text-sm font-bold text-center"
        />
        <span style={{ color: C.cinza }} className="text-xs italic">WIN = R$0,20/pt · WDO = R$10,00/pt (B3)</span>
        <div className="ml-auto flex gap-2">
          <button onClick={resetExample} style={{ background: C.panel2, color: C.branco, border: `1px solid ${C.border}` }} className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold">
            <RotateCcw size={13} /> Exemplo
          </button>
          <button onClick={clearAll} style={{ background: C.panel2, color: C.vermelho, border: `1px solid ${C.border}` }} className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold">
            <Trash2 size={13} /> Limpar
          </button>
        </div>
      </div>

      <div style={{ background: `linear-gradient(135deg, ${C.roxoEsc}, ${C.roxo})`, border: `1px solid ${C.roxoMed}` }} className="mt-3 rounded-lg p-5 text-center">
        <div style={{ color: C.roxoClaro, fontSize: 11 }} className="font-bold tracking-widest uppercase mb-1">Resultado total acumulado</div>
        <div style={{ color: total >= 0 ? C.branco : C.vermelho }} className="text-3xl md:text-4xl font-extrabold">{fmt(total)}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
        <Card label="Ganho do dia" value={fmt(ganhoDia)} color={C.verde} />
        <Card label="Perda do dia" value={fmt(perdaDia)} color={C.vermelho} />
        <Card label="Resultado do dia" value={fmt(resultDia)} color={resultDia >= 0 ? C.verde : C.vermelho} />
        <Card label="Resultado da semana" value={fmt(resultSemana)} color={resultSemana >= 0 ? C.verde : C.vermelho} />
        <Card label="Resultado do mês" value={fmt(resultMes)} color={resultMes >= 0 ? C.verde : C.vermelho} />
        <Card label="Taxa de acerto" value={`${(taxaAcerto * 100).toFixed(1)}%`} />
        <Card label="Fator de lucro" value={`${fatorLucro.toFixed(2)}x`} />
        <Card label="Total de operações" value={`${withAccum.length} ops`} />
      </div>

      <div className="mt-3">
        <ChartPanel title="Curva de capital — resultado acumulado">
          {hasData ? (
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
          ) : (
            <div style={{ color: C.cinza }} className="h-full flex items-center justify-center text-sm">Adicione uma operação para ver a curva</div>
          )}
        </ChartPanel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <ChartPanel title="Semanal — resultado e acumulado" height={190}>
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
        <ChartPanel title="Mensal — resultado e acumulado" height={190}>
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
        <ChartPanel title="Operações: vencedoras x perdedoras" height={190}>
          <PieChart>
            <Pie data={winLossData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={3} label={({ percent }) => (percent ? `${(percent * 100).toFixed(0)}%` : "")} labelLine={false}>
              <Cell fill={C.verde} />
              <Cell fill={C.vermelho} />
            </Pie>
            <Legend wrapperStyle={{ fontSize: 11, color: C.cinza }} />
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ChartPanel>
        <ChartPanel title="Ganho x perda (R$, total)" height={190}>
          <PieChart>
            <Pie data={ganhoPerdaData} dataKey="value" nameKey="name" outerRadius={72} label={({ percent }) => (percent ? `${(percent * 100).toFixed(0)}%` : "")} labelLine={false}>
              <Cell fill={C.roxoMed} />
              <Cell fill={C.panel2} stroke={C.border} />
            </Pie>
            <Legend wrapperStyle={{ fontSize: 11, color: C.cinza }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmt(v)} />
          </PieChart>
        </ChartPanel>
      </div>

      <div style={{ background: C.panel1, border: `1px solid ${C.border}`, borderRadius: 10 }} className="p-3 mt-3 overflow-x-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 style={{ color: C.branco }} className="text-xs font-bold">Operações</h3>
          <button onClick={addTrade} style={{ background: C.roxoMed, color: C.branco }} className="flex items-center gap-1 rounded px-3 py-1.5 text-xs font-bold">
            <Plus size={14} /> Nova operação
          </button>
        </div>
        <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.roxoEsc }}>
              {["Data", "Ativo", "Operação", "Contratos", "Entrada", "Saída", "Pontos", "Bruto", "Custos", "Líquido", ""].map((h) => (
                <th key={h} style={{ color: C.branco }} className="p-1.5 font-semibold text-center whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => {
              const c = calcById.get(t.id);
              return (
                <tr key={t.id} style={{ background: i % 2 === 0 ? C.panel1 : C.panel2, borderBottom: `1px solid ${C.border}` }}>
                  <td className="p-1">
                    <input type="date" value={t.data} onChange={(e) => handleFieldChange(t.id, "data", e.target.value, true)} style={{ background: "transparent", color: C.branco, colorScheme: "dark" }} className="w-full text-xs p-1 rounded" />
                  </td>
                  <td className="p-1">
                    <select value={t.ativo} onChange={(e) => handleFieldChange(t.id, "ativo", e.target.value, true)} style={{ background: C.panel2, color: C.branco }} className="w-full text-xs p-1 rounded">
                      <option value="WIN">WIN</option>
                      <option value="WDO">WDO</option>
                    </select>
                  </td>
                  <td className="p-1">
                    <select value={t.operacao} onChange={(e) => handleFieldChange(t.id, "operacao", e.target.value, true)} style={{ background: C.panel2, color: C.branco }} className="w-full text-xs p-1 rounded">
                      <option value="Compra">Compra</option>
                      <option value="Venda">Venda</option>
                    </select>
                  </td>
                  <td className="p-1"><input type="number" value={t.contratos} onChange={(e) => handleFieldChange(t.id, "contratos", e.target.value, false)} onBlur={() => handleFieldBlur(t.id)} style={{ background: "transparent", color: C.branco, border: `1px solid ${C.border}` }} className="w-14 text-xs p-1 rounded text-center" /></td>
                  <td className="p-1"><input type="number" step="0.1" value={t.entrada} onChange={(e) => handleFieldChange(t.id, "entrada", e.target.value, false)} onBlur={() => handleFieldBlur(t.id)} style={{ background: "transparent", color: C.branco, border: `1px solid ${C.border}` }} className="w-20 text-xs p-1 rounded text-right" /></td>
                  <td className="p-1"><input type="number" step="0.1" value={t.saida} onChange={(e) => handleFieldChange(t.id, "saida", e.target.value, false)} onBlur={() => handleFieldBlur(t.id)} style={{ background: "transparent", color: C.branco, border: `1px solid ${C.border}` }} className="w-20 text-xs p-1 rounded text-right" /></td>
                  <td className="p-1 text-right" style={{ color: c ? (c.pontos >= 0 ? C.verde : C.vermelho) : C.cinza }}>{c ? c.pontos.toFixed(1) : "—"}</td>
                  <td className="p-1 text-right" style={{ color: C.cinza }}>{c ? fmt(c.bruto) : "—"}</td>
                  <td className="p-1 text-right" style={{ color: C.cinza }}>{c ? fmt(c.custos) : "—"}</td>
                  <td className="p-1 text-right font-bold" style={{ color: c ? (c.liquido >= 0 ? C.verde : C.vermelho) : C.cinza }}>{c ? fmt(c.liquido) : "—"}</td>
                  <td className="p-1 text-center">
                    <button onClick={() => removeTrade(t.id)} style={{ color: C.vermelho }} aria-label="Remover operação"><Trash2 size={14} /></button>
                  </td>
                </tr>
              );
            })}
            {trades.length === 0 && (
              <tr><td colSpan={11} style={{ color: C.cinza }} className="text-center p-4">Nenhuma operação. Clique em "Nova operação" para começar.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
