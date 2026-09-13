"use client";

import { useState, useCallback } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_BASE = `${BASE_URL}/api/admin`;

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuditIssue {
    gameSessionId: string;
    gameId:        string | null;
    playerCount:   number;
    players:       string[];
    totalDeducted: number;
    firstDeducted: string;
    isActive:      boolean;
    endedAt:       string | null;
    stakeAmount:   number | null;
}
interface AuditResponse {
    hoursChecked: number;
    since:        string;
    issueCount:   number;
    issues:       AuditIssue[];
}
interface PlayerSummary {
    telegramId:     string;
    username:       string;
    currentBalance: number | null;
    totalDeducted:  number;
    totalRefunded:  number;
    totalWon:       number;
    net:            number;
}
interface LedgerEntry {
    _id:             string;
    telegramId:      string;
    username:        string;
    currentBalance:  number | null;
    transactionType: string;
    amount:          number;
    createdAt:       string;
    description:     string | null;
}
interface LedgerResponse {
    gameSessionId:  string;
    game:           any;
    financialCheck: { isBalanced: boolean; totalDeducted: number; totalPaidOut: number; totalRefunded: number; discrepancy: number; };
    playerSummary:  PlayerSummary[];
    summary:        { type: string; total: number }[];
    entries:        LedgerEntry[];
}
interface PlayerLookup {
    user:               { telegramId: number; username: string; balance: number; bonus_balance: number; registeredAt: string; };
    recentTransactions: LedgerEntry[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
    stake_deduction:       "text-red-400",
    stake_refund:          "text-emerald-400",
    player_winnings:       "text-yellow-400",
    house_profit:          "text-blue-400",
    bonus_stake_deduction: "text-orange-400",
    bonus_stake_refund:    "text-teal-400",
};
const TYPE_LABELS: Record<string, string> = {
    stake_deduction:       "Stake Deducted",
    stake_refund:          "Stake Refunded",
    player_winnings:       "Prize Paid",
    house_profit:          "House Profit",
    bonus_stake_deduction: "Bonus Deducted",
    bonus_stake_refund:    "Bonus Refunded",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt     = (n: number) => n?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00";
const shortId = (id: string) => id?.slice(0, 8) + "…";
function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m    = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function Spinner() {
    return <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin inline-block" />;
}

// ═════════════════════════════════════════════════════════════════════════════
// PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function FinancePage() {
    const [tab, setTab] = useState<"audit" | "ledger" | "award">("audit");

    // ── Audit ──────────────────────────────────────────────────────────────
    const [auditData,     setAuditData]     = useState<AuditResponse | null>(null);
    const [auditLoading,  setAuditLoading]  = useState(false);
    const [auditHours,    setAuditHours]    = useState(24);
    const [refundLoading, setRefundLoading] = useState<string | null>(null);
    const [expandedRow,   setExpandedRow]   = useState<string | null>(null);

    // ── Ledger ─────────────────────────────────────────────────────────────
    const [ledgerSession, setLedgerSession] = useState("");
    const [ledgerData,    setLedgerData]    = useState<LedgerResponse | null>(null);
    const [ledgerLoading, setLedgerLoading] = useState(false);
    const [ledgerView,    setLedgerView]    = useState<"players"|"transactions">("players");

    // ── Award ──────────────────────────────────────────────────────────────
    const [awardTelegramId,  setAwardTelegramId]  = useState("");
    const [awardAmount,      setAwardAmount]      = useState("");
    const [awardReason,      setAwardReason]      = useState("");
    const [awardSessionId,   setAwardSessionId]   = useState("");
    const [awardType,        setAwardType]        = useState<"balance"|"bonus">("balance");
    const [awardLoading,     setAwardLoading]     = useState(false);
    const [awardResult,      setAwardResult]      = useState<any>(null);
    const [playerLookup,     setPlayerLookup]     = useState<PlayerLookup | null>(null);
    const [lookupLoading,    setLookupLoading]    = useState(false);

    // ── Audit handlers ─────────────────────────────────────────────────────
    const fetchAudit = useCallback(async () => {
        setAuditLoading(true);
        setAuditData(null);
        try {
            const res  = await fetch(`${API_BASE}/financial/audit?hours=${auditHours}`);
            const data = await res.json();
            setAuditData(data);
        } catch {
            alert("Audit fetch failed — check server logs");
        } finally {
            setAuditLoading(false);
        }
    }, [auditHours]);

    const refundSession = async (gameSessionId: string, playerCount: number) => {
        if (!confirm(`Refund ${playerCount} player(s) for session ${shortId(gameSessionId)}?\n\nThis will restore stakes and cannot be undone.`)) return;
        setRefundLoading(gameSessionId);
        try {
            const res  = await fetch(`${API_BASE}/financial/refund-session`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ gameSessionId, reason: "Manual refund via admin financial audit" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert(`✅ ${data.message}`);
            fetchAudit();
        } catch (e: any) {
            alert(`❌ ${e.message}`);
        } finally {
            setRefundLoading(null);
        }
    };

    // ── Ledger handlers ────────────────────────────────────────────────────
    const fetchLedger = async () => {
        if (!ledgerSession.trim()) return;
        setLedgerLoading(true);
        setLedgerData(null);
        try {
            const res  = await fetch(`${API_BASE}/financial/ledger/${ledgerSession.trim()}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setLedgerData(data);
            setLedgerView("players");
        } catch (e: any) {
            alert(`❌ ${e.message}`);
        } finally {
            setLedgerLoading(false);
        }
    };

    // ── Award handlers ─────────────────────────────────────────────────────
    const lookupPlayer = async () => {
        if (!awardTelegramId.trim()) return;
        setLookupLoading(true);
        setPlayerLookup(null);
        try {
            const res  = await fetch(`${API_BASE}/financial/player/${awardTelegramId.trim()}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setPlayerLookup(data);
        } catch (e: any) {
            alert(`❌ ${e.message}`);
        } finally {
            setLookupLoading(false);
        }
    };

    const submitAward = async () => {
        if (!awardTelegramId.trim()) return alert("Enter a Telegram ID");
        if (!awardAmount || Number(awardAmount) <= 0) return alert("Enter a valid amount");
        if (!awardReason.trim()) return alert("Enter a reason for this award");

        if (!confirm(
            `Award ${awardAmount} Birr to player ${awardTelegramId}?\n\n` +
            `Reason: ${awardReason}\n` +
            `To: ${awardType === "bonus" ? "Bonus balance" : "Main balance"}\n\n` +
            `This cannot be undone.`
        )) return;

        setAwardLoading(true);
        setAwardResult(null);
        try {
            const res  = await fetch(`${API_BASE}/financial/award`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    telegramId:    awardTelegramId.trim(),
                    amount:        Number(awardAmount),
                    reason:        awardReason.trim(),
                    gameSessionId: awardSessionId.trim() || undefined,
                    awardType,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setAwardResult(data);
            // Refresh player lookup
            if (playerLookup) lookupPlayer();
        } catch (e: any) {
            alert(`❌ ${e.message}`);
        } finally {
            setAwardLoading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-mono">

            {/* Header */}
            <div className="border-b border-white/10 px-8 py-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl">💰</span>
                            <h1 className="text-2xl font-bold tracking-tight">Financial Control</h1>
                        </div>
                        <p className="text-xs text-white/40 tracking-widest uppercase">Audit · Ledger · Award</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                        Live
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10 px-8">
                <div className="max-w-6xl mx-auto flex">
                    {([
                        { key: "audit",  label: "🔍 Audit"  },
                        { key: "ledger", label: "📋 Ledger" },
                        { key: "award",  label: "🎁 Award"  },
                    ] as const).map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-6 py-4 text-sm uppercase tracking-widest transition-all border-b-2 ${
                                tab === t.key
                                    ? "border-yellow-400 text-yellow-400"
                                    : "border-transparent text-white/30 hover:text-white/60"
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-8 py-8">

                {/* ══════════════════════════════════════════════
                    AUDIT
                ══════════════════════════════════════════════ */}
                {tab === "audit" && (
                    <div>
                        {/* Controls */}
                        <div className="flex items-end gap-4 mb-8">
                            <div>
                                <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">Look back</label>
                                <select
                                    value={auditHours}
                                    onChange={e => setAuditHours(Number(e.target.value))}
                                    className="bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-yellow-400/50 cursor-pointer"
                                >
                                    <option value={12}>Last 12 hours</option>
                                    <option value={24}>Last 24 hours</option>
                                    <option value={48}>Last 48 hours</option>
                                    <option value={168}>Last 7 days</option>
                                    <option value={720}>Last 30 days</option>
                                </select>
                            </div>
                            <button
                                onClick={fetchAudit}
                                disabled={auditLoading}
                                className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold rounded-lg transition-all disabled:opacity-40 flex items-center gap-2"
                            >
                                {auditLoading ? <><Spinner /> Scanning...</> : "Run Audit"}
                            </button>
                        </div>

                        {auditData && (
                            <div>
                                <div className={`flex items-center gap-4 px-6 py-4 rounded-xl mb-6 border ${
                                    auditData.issueCount === 0
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                        : "bg-red-500/10 border-red-500/30 text-red-400"
                                }`}>
                                    <span className="text-2xl">{auditData.issueCount === 0 ? "✅" : "🚨"}</span>
                                    <div>
                                        <p className="font-bold text-sm">
                                            {auditData.issueCount === 0
                                                ? `No issues found in the last ${auditData.hoursChecked} hours`
                                                : `${auditData.issueCount} suspicious session${auditData.issueCount > 1 ? "s" : ""} found`
                                            }
                                        </p>
                                        <p className="text-xs opacity-60 mt-0.5">Since {new Date(auditData.since).toLocaleString()}</p>
                                    </div>
                                    {auditData.issueCount > 0 && (
                                        <div className="ml-auto text-right">
                                            <p className="text-xs opacity-60">Total at risk</p>
                                            <p className="font-bold">{fmt(auditData.issues.reduce((s, i) => s + (i.totalDeducted || 0), 0))} Birr</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {auditData.issues.map(issue => (
                                        <div key={issue.gameSessionId} className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                                            <div
                                                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-white/[0.02]"
                                                onClick={() => setExpandedRow(expandedRow === issue.gameSessionId ? null : issue.gameSessionId)}
                                            >
                                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${issue.isActive ? "bg-yellow-400 animate-pulse" : "bg-red-400"}`} />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm">Game {issue.gameId || "—"}</span>
                                                        <span className="text-white/30 text-xs">{shortId(issue.gameSessionId)}</span>
                                                    </div>
                                                    <p className="text-white/40 text-xs mt-0.5">{issue.playerCount} player{issue.playerCount !== 1 ? "s" : ""} · {timeAgo(issue.firstDeducted)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-red-400 font-bold">{fmt(issue.totalDeducted)} Birr</p>
                                                    <p className="text-white/30 text-xs">deducted</p>
                                                </div>
                                                <span className={`text-xs px-3 py-1 rounded-full font-medium ${issue.isActive ? "bg-yellow-400/15 text-yellow-400" : "bg-red-400/15 text-red-400"}`}>
                                                    {issue.isActive ? "Game Active" : "No Payout"}
                                                </span>
                                                {!issue.isActive && (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); refundSession(issue.gameSessionId, issue.playerCount); }}
                                                        disabled={refundLoading === issue.gameSessionId}
                                                        className="px-4 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-400 text-xs rounded-lg transition-all disabled:opacity-40 flex items-center gap-1"
                                                    >
                                                        {refundLoading === issue.gameSessionId ? <><Spinner />Refunding…</> : "Refund All"}
                                                    </button>
                                                )}
                                                <span className={`text-white/30 text-xs transition-transform ${expandedRow === issue.gameSessionId ? "rotate-180" : ""}`}>▼</span>
                                            </div>

                                            {expandedRow === issue.gameSessionId && (
                                                <div className="border-t border-white/10 px-6 py-4 bg-white/[0.02]">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                        <div>
                                                            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Session ID</p>
                                                            <p className="text-xs font-mono text-white/70 break-all">{issue.gameSessionId}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Stake</p>
                                                            <p className="text-sm">{issue.stakeAmount ? `${fmt(issue.stakeAmount)} Birr` : "—"}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Deducted At</p>
                                                            <p className="text-sm">{new Date(issue.firstDeducted).toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Ended</p>
                                                            <p className="text-sm">{issue.endedAt ? new Date(issue.endedAt).toLocaleString() : "Not ended"}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Affected Players</p>
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {issue.players.map(p => (
                                                            <button
                                                                key={p}
                                                                onClick={() => { setTab("award"); setAwardTelegramId(p); setAwardSessionId(issue.gameSessionId); }}
                                                                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded text-white/60 transition-colors"
                                                                title="Click to award this player"
                                                            >
                                                                {p} →
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => { setTab("ledger"); setLedgerSession(issue.gameSessionId); }}
                                                            className="text-xs text-yellow-400/70 hover:text-yellow-400 underline"
                                                        >
                                                            View full ledger →
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!auditData && !auditLoading && (
                            <div className="text-center py-20">
                                <p className="text-5xl mb-4">🔍</p>
                                <p className="text-white/30 text-sm">Run an audit to check for financial discrepancies</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    LEDGER
                ══════════════════════════════════════════════ */}
                {tab === "ledger" && (
                    <div>
                        <div className="flex gap-3 mb-8">
                            <div className="flex-1">
                                <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">Game Session ID</label>
                                <input
                                    type="text"
                                    value={ledgerSession}
                                    onChange={e => setLedgerSession(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && fetchLedger()}
                                    placeholder="Paste session UUID here…"
                                    className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-yellow-400/50 placeholder:text-white/20 font-mono"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={fetchLedger}
                                    disabled={ledgerLoading || !ledgerSession.trim()}
                                    className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-bold rounded-lg disabled:opacity-40 flex items-center gap-2"
                                >
                                    {ledgerLoading ? <><Spinner />Loading...</> : "Fetch Ledger"}
                                </button>
                            </div>
                        </div>

                        {ledgerData && (
                            <div>
                                {/* Game banner */}
                                {ledgerData.game && (
                                    <div className="bg-white/[0.03] border border-white/10 rounded-xl px-6 py-4 mb-5 grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div><p className="text-xs text-white/40 uppercase tracking-wider mb-1">Game</p><p className="font-bold">#{ledgerData.game.gameId}</p></div>
                                        <div><p className="text-xs text-white/40 uppercase tracking-wider mb-1">Stake</p><p>{fmt(ledgerData.game.stakeAmount)} Birr</p></div>
                                        <div><p className="text-xs text-white/40 uppercase tracking-wider mb-1">Players</p><p>{ledgerData.game.totalPlayers}</p></div>
                                        <div><p className="text-xs text-white/40 uppercase tracking-wider mb-1">Prize Pool</p><p className="text-yellow-400 font-bold">{fmt(ledgerData.game.prizeAmount)} Birr</p></div>
                                        <div>
                                            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Status</p>
                                            <span className={`text-xs px-2 py-1 rounded-full ${ledgerData.game.isActive ? "bg-yellow-400/15 text-yellow-400" : "bg-white/10 text-white/50"}`}>
                                                {ledgerData.game.isActive ? "Active" : "Ended"}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Integrity check */}
                                <div className={`flex items-center gap-3 px-5 py-3 rounded-xl mb-5 border text-sm ${
                                    ledgerData.financialCheck.isBalanced
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                        : "bg-red-500/10 border-red-500/30 text-red-400"
                                }`}>
                                    <span>{ledgerData.financialCheck.isBalanced ? "✅" : "⚠️"}</span>
                                    <span className="font-bold flex-1">
                                        {ledgerData.financialCheck.isBalanced
                                            ? "Financially balanced"
                                            : `Imbalance: ${fmt(Math.abs(ledgerData.financialCheck.discrepancy))} Birr unaccounted`
                                        }
                                    </span>
                                    <div className="flex gap-6 text-xs opacity-70">
                                        <span>In: {fmt(ledgerData.financialCheck.totalDeducted)}</span>
                                        <span>Out: {fmt(ledgerData.financialCheck.totalPaidOut)}</span>
                                        {ledgerData.financialCheck.totalRefunded > 0 && <span>Refunded: {fmt(ledgerData.financialCheck.totalRefunded)}</span>}
                                    </div>
                                </div>

                                {/* Sub-tabs */}
                                <div className="flex gap-1 mb-5 bg-white/5 rounded-lg p-1 w-fit">
                                    {(["players", "transactions"] as const).map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setLedgerView(v)}
                                            className={`px-4 py-1.5 text-xs rounded-md transition-all ${ledgerView === v ? "bg-yellow-400 text-black font-bold" : "text-white/40 hover:text-white/70"}`}
                                        >
                                            {v === "players" ? `👤 By Player (${ledgerData.playerSummary.length})` : `📄 Transactions (${ledgerData.entries.length})`}
                                        </button>
                                    ))}
                                </div>

                                {/* By Player */}
                                {ledgerView === "players" && (
                                    <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    {["Player", "Telegram ID", "Deducted", "Refunded", "Won", "Net", "Balance Now"].map(h => (
                                                        <th key={h} className="px-5 py-3 text-left text-xs text-white/30 uppercase tracking-widest font-normal">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ledgerData.playerSummary.map((p, i) => (
                                                    <tr key={p.telegramId} className={`border-b border-white/5 hover:bg-white/[0.02] ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-2">
                                                                {p.totalWon > 0 && <span className="text-yellow-400 text-xs">🏆</span>}
                                                                <span className="text-white text-sm font-medium">{p.username}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 text-xs text-white/40 font-mono">{p.telegramId}</td>
                                                        <td className="px-5 py-3 text-red-400 text-sm font-bold">{p.totalDeducted > 0 ? `−${fmt(p.totalDeducted)}` : "—"}</td>
                                                        <td className="px-5 py-3 text-teal-400 text-sm">{p.totalRefunded > 0 ? `+${fmt(p.totalRefunded)}` : "—"}</td>
                                                        <td className="px-5 py-3 text-yellow-400 text-sm font-bold">{p.totalWon > 0 ? `+${fmt(p.totalWon)}` : "—"}</td>
                                                        <td className={`px-5 py-3 text-sm font-bold ${p.net > 0 ? "text-emerald-400" : p.net < 0 ? "text-red-400" : "text-white/40"}`}>
                                                            {p.net > 0 ? `+${fmt(p.net)}` : p.net < 0 ? `−${fmt(Math.abs(p.net))}` : "0.00"}
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs text-white/50">{p.currentBalance !== null ? `${fmt(p.currentBalance)} Birr` : "—"}</span>
                                                                <button
                                                                    onClick={() => { setTab("award"); setAwardTelegramId(p.telegramId); }}
                                                                    className="text-xs text-yellow-400/50 hover:text-yellow-400 transition-colors"
                                                                    title="Award this player"
                                                                >
                                                                    + Award
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Transactions */}
                                {ledgerView === "transactions" && (
                                    <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    {["Player", "ID", "Type", "Amount", "Time", "Note"].map(h => (
                                                        <th key={h} className="px-5 py-3 text-left text-xs text-white/30 uppercase tracking-widest font-normal">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ledgerData.entries.map((entry, i) => (
                                                    <tr key={entry._id} className={`border-b border-white/5 hover:bg-white/[0.02] ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                                                        <td className="px-5 py-3 text-sm">{entry.username}</td>
                                                        <td className="px-5 py-3 text-xs text-white/40 font-mono">{entry.telegramId}</td>
                                                        <td className="px-5 py-3">
                                                            <span className={`text-xs font-medium ${TYPE_COLORS[entry.transactionType] || "text-white/60"}`}>
                                                                {TYPE_LABELS[entry.transactionType] || entry.transactionType}
                                                            </span>
                                                        </td>
                                                        <td className={`px-5 py-3 text-sm font-bold ${entry.transactionType.includes("deduction") ? "text-red-400" : "text-emerald-400"}`}>
                                                            {entry.transactionType.includes("deduction") ? "−" : "+"}
                                                            {fmt(Math.abs(entry.amount))}
                                                        </td>
                                                        <td className="px-5 py-3 text-xs text-white/30">{new Date(entry.createdAt).toLocaleTimeString()}</td>
                                                        <td className="px-5 py-3 text-xs text-white/20">{entry.description || "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {!ledgerData && !ledgerLoading && (
                            <div className="text-center py-20">
                                <p className="text-5xl mb-4">📋</p>
                                <p className="text-white/30 text-sm">Enter a Game Session ID to view its full ledger</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    AWARD
                ══════════════════════════════════════════════ */}
                {tab === "award" && (
                    <div className="max-w-2xl">
                        <p className="text-white/40 text-sm mb-8">
                            Use this to manually award a player — for missed prizes, compensation, or corrections.
                            Every award is recorded in the ledger with your reason.
                        </p>

                        {/* Player Lookup */}
                        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 mb-6">
                            <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-4">1. Find Player</h3>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={awardTelegramId}
                                    onChange={e => { setAwardTelegramId(e.target.value); setPlayerLookup(null); setAwardResult(null); }}
                                    onKeyDown={e => e.key === "Enter" && lookupPlayer()}
                                    placeholder="Telegram ID (e.g. 7496675210)"
                                    className="flex-1 bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-yellow-400/50 placeholder:text-white/20 font-mono"
                                />
                                <button
                                    onClick={lookupPlayer}
                                    disabled={lookupLoading || !awardTelegramId.trim()}
                                    className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg disabled:opacity-40 flex items-center gap-2"
                                >
                                    {lookupLoading ? <><Spinner />Looking...</> : "Lookup"}
                                </button>
                            </div>

                            {playerLookup && (
                                <div className="mt-4 p-4 bg-white/[0.03] border border-white/10 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-white">{playerLookup.user.username}</p>
                                            <p className="text-xs text-white/40 font-mono mt-0.5">{playerLookup.user.telegramId}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-white/40 mb-1">Balances</p>
                                            <p className="text-sm text-white">
                                                <span className="text-yellow-400 font-bold">{fmt(playerLookup.user.balance)}</span>
                                                <span className="text-white/30 text-xs"> main</span>
                                            </p>
                                            <p className="text-sm text-white">
                                                <span className="text-emerald-400 font-bold">{fmt(playerLookup.user.bonus_balance)}</span>
                                                <span className="text-white/30 text-xs"> bonus</span>
                                            </p>
                                        </div>
                                    </div>
                                    {playerLookup.recentTransactions.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Recent Transactions</p>
                                            <div className="space-y-1">
                                                {playerLookup.recentTransactions.slice(0, 5).map(t => (
                                                    <div key={t._id} className="flex items-center justify-between text-xs">
                                                        <span className={TYPE_COLORS[t.transactionType] || "text-white/40"}>
                                                            {TYPE_LABELS[t.transactionType] || t.transactionType}
                                                        </span>
                                                        <span className={t.transactionType.includes("deduction") ? "text-red-400" : "text-emerald-400"}>
                                                            {t.transactionType.includes("deduction") ? "−" : "+"}
                                                            {fmt(Math.abs(t.amount))} Birr
                                                        </span>
                                                        <span className="text-white/20">{timeAgo(t.createdAt)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Award Form */}
                        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 mb-6">
                            <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-4">2. Award Details</h3>

                            <div className="space-y-4">
                                {/* Amount */}
                                <div>
                                    <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">Amount (Birr)</label>
                                    <input
                                        type="number"
                                        value={awardAmount}
                                        onChange={e => setAwardAmount(e.target.value)}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-yellow-400/50 placeholder:text-white/20"
                                    />
                                </div>

                                {/* Award type */}
                                <div>
                                    <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">Award To</label>
                                    <div className="flex gap-2">
                                        {(["balance", "bonus"] as const).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setAwardType(t)}
                                                className={`px-4 py-2 text-sm rounded-lg transition-all capitalize ${
                                                    awardType === t
                                                        ? "bg-yellow-400 text-black font-bold"
                                                        : "bg-white/5 text-white/50 hover:text-white/80"
                                                }`}
                                            >
                                                {t === "balance" ? "💳 Main Balance" : "🎁 Bonus Balance"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Reason */}
                                <div>
                                    <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                                        Reason <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        value={awardReason}
                                        onChange={e => setAwardReason(e.target.value)}
                                        placeholder="e.g. Prize not received after game session abc123 due to server error"
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-yellow-400/50 placeholder:text-white/20 resize-none"
                                    />
                                </div>

                                {/* Optional session ID */}
                                <div>
                                    <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                                        Related Session ID <span className="text-white/20">(optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={awardSessionId}
                                        onChange={e => setAwardSessionId(e.target.value)}
                                        placeholder="Game session this award is related to"
                                        className="w-full bg-white/5 border border-white/10 text-white text-sm px-4 py-2.5 rounded-lg focus:outline-none focus:border-yellow-400/50 placeholder:text-white/20 font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            onClick={submitAward}
                            disabled={awardLoading || !awardTelegramId || !awardAmount || !awardReason}
                            className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {awardLoading ? <><Spinner />Processing...</> : `Award ${awardAmount ? `${awardAmount} Birr` : ""} to Player`}
                        </button>

                        {/* Success result */}
                        {awardResult && (
                            <div className="mt-6 p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                <p className="text-emerald-400 font-bold text-sm mb-3">✅ {awardResult.message}</p>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <p className="text-white/40 uppercase tracking-wider mb-1">Player</p>
                                        <p className="text-white">{awardResult.username} ({awardResult.telegramId})</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 uppercase tracking-wider mb-1">Amount Awarded</p>
                                        <p className="text-emerald-400 font-bold">{fmt(awardResult.amountAwarded)} Birr</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 uppercase tracking-wider mb-1">Awarded To</p>
                                        <p className="text-white capitalize">{awardResult.awardedTo?.replace("_", " ")}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 uppercase tracking-wider mb-1">New Balance</p>
                                        <p className="text-yellow-400 font-bold">{fmt(awardResult.newBalance)} Birr</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/10">
                                    <p className="text-xs text-white/30">Reason recorded: {awardResult.reason}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
