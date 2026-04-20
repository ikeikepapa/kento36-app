"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useEntries } from "@/lib/useEntries";
const GRADES = [
  { name: "アンバー", emoji: "🟠", color: "#D97706" },
  { name: "オパール", emoji: "🤍", color: "#94A3B8" },
  { name: "ターコイズ", emoji: "🩵", color: "#0891B2" },
  { name: "ペリドット", emoji: "🟢", color: "#65A30D" },
  { name: "アメジスト", emoji: "🟣", color: "#9333EA" },
  { name: "トパーズ", emoji: "🟡", color: "#CA8A04" },
  { name: "アクアマリン", emoji: "💧", color: "#0EA5E9" },
  { name: "ガーネット", emoji: "🔴", color: "#DC2626" },
  { name: "タンザナイト", emoji: "🔵", color: "#4F46E5" },
  { name: "エメラルド", emoji: "💚", color: "#059669" },
  { name: "サファイア", emoji: "💙", color: "#2563EB" },
  { name: "ルビー", emoji: "❤️", color: "#E11D48" },
  { name: "プラチナ", emoji: "🪙", color: "#64748B" },
  { name: "ダイヤモンド", emoji: "💎", color: "#06B6D4" },
  { name: "ブラックオパール", emoji: "🖤", color: "#1E293B" },
  { name: "アレキサンドライト", emoji: "💜", color: "#7C3AED" },
  { name: "パライバ", emoji: "🩵", color: "#14B8A6" },
  { name: "スターサファイア", emoji: "🌟", color: "#1D4ED8" },
  { name: "インペリアルトパーズ", emoji: "👑", color: "#EA580C" },
  { name: "レジェンド", emoji: "⭐", color: "#FF6F00" },
];
const LPG = 2;
const DOW = ["日", "月", "火", "水", "木", "金", "土"];

function fmtD(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function gradeLevel(tl) {
  const gi = Math.min(Math.floor(tl / LPG), GRADES.length - 1);
  return { g: GRADES[gi], l: (tl % LPG) + 1 };
}

function getDayStars(e) {
  if (!e) return 0;
  let s = 0;
  if (e.swings >= 100) s += 3; else if (e.swings >= 50) s += 2; else if (e.swings > 0) s += 1;
  if (e.pitches >= 60) s += 3; else if (e.pitches >= 30) s += 2; else if (e.pitches > 0) s += 1;
  if (e.bcAtBats > 0) s += 2;
  if (e.gameAtBats > 0) s += 3;
  return Math.min(s, 10);
}

function getStreak(data, year, month, day, field, threshold) {
  let streak = 0, d = day, m = month, y = year;
  while (true) {
    if (data[fmtD(y, m, d)]?.[field] >= threshold) {
      streak++; d--;
      if (d < 1) { m--; if (m < 1) { m = 12; y--; } d = new Date(y, m, 0).getDate(); }
    } else break;
    if (streak > 365) break;
  }
  return streak;
}

function calcTotal(data, month, field) {
  let t = 0;
  const dim = new Date(month.year, month.month, 0).getDate();
  for (let d = 1; d <= dim; d++) {
    const k = fmtD(month.year, month.month, d);
    if (data[k]) t += data[k][field] || 0;
  }
  return t;
}

function countOver(data, month, field, th) {
  let c = 0;
  const dim = new Date(month.year, month.month, 0).getDate();
  for (let d = 1; d <= dim; d++) {
    if (data[fmtD(month.year, month.month, d)]?.[field] >= th) c++;
  }
  return c;
}

function calcAvg(data, month, f) {
  let h = 0, a = 0;
  const dim = new Date(month.year, month.month, 0).getDate();
  for (let d = 1; d <= dim; d++) {
    const e = data[fmtD(month.year, month.month, d)];
    if (e && e[f + "AtBats"] > 0) { h += e[f + "Hits"] || 0; a += e[f + "AtBats"] || 0; }
  }
  return a > 0 ? h / a : null;
}

function getCurrentStreak(data, month, field, threshold) {
  const today = new Date();
  let d, m, y;
  if (month.year === today.getFullYear() && month.month === today.getMonth() + 1) {
    d = today.getDate(); m = month.month; y = month.year;
  } else {
    d = new Date(month.year, month.month, 0).getDate(); m = month.month; y = month.year;
  }
  return getStreak(data, y, m, d, field, threshold);
}

// ─── Level calculation from ALL data ───
function calcLevels(data) {
  let swDays = 0, piDays = 0, bcSessions = 0, gameSessions = 0;
  for (const key of Object.keys(data)) {
    const e = data[key];
    if (e.swings >= 50) swDays++;
    if (e.pitches >= 30) piDays++;
    if (e.bcAtBats > 0) bcSessions++;
    if (e.gameAtBats > 0) gameSessions++;
  }
  return {
    swing: Math.floor(swDays / 5),
    pitch: Math.floor(piDays / 5),
    bc: Math.floor(bcSessions / 3),
    game: Math.floor(gameSessions / 2),
  };
}

// ─── Confetti ───
function Confetti({ active }) {
  if (!active) return null;

  const pieces = useMemo(() => {
    const colors = ["#DC2626", "#3B82F6", "#FBBF24", "#10B981", "#F97316", "#8B5CF6", "#EC4899"];
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 1.5 + Math.random() * 1.5,
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 40,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));
  }, []);

  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 100
    }}>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) translateX(0px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) translateX(var(--drift)) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.x}%`,
          top: -20,
          width: p.shape === "rect" ? p.size : p.size,
          height: p.shape === "rect" ? p.size * 0.6 : p.size,
          borderRadius: p.shape === "circle" ? "50%" : 2,
          background: p.color,
          animation: `confettiFall ${p.dur}s ease-in ${p.delay}s forwards`,
          "--drift": `${p.drift}px`,
        }} />
      ))}
    </div>
  );
}

// ─── Level Up Celebration Card ───
function LevelUpCard({ show, category, prevLevel, newLevel, onClose }) {
  if (!show) return null;

  const prev = gradeLevel(prevLevel);
  const next = gradeLevel(newLevel);
  const isGradeUp = prev.g.name !== next.g.name;

  const icons = { swing: "💥", pitch: "⚾", bc: "🎯", game: "🏟️" };
  const labels = { swing: "素振り", pitch: "投球", bc: "バッセン", game: "試合" };

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 99,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <style>{`
        @keyframes cardBounce {
          0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(2deg); opacity: 1; }
          70% { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes starBurst {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div onClick={e => e.stopPropagation()} style={{
        background: "linear-gradient(135deg, #1E3A8A, #1D4ED8, #DC2626)",
        borderRadius: 24, padding: 4, width: 300,
        animation: "cardBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        <div style={{
          background: "white", borderRadius: 20, padding: "28px 20px", textAlign: "center"
        }}>
          {/* Icon */}
          <div style={{
            fontSize: 56,
            animation: "starBurst 0.5s ease-out 0.3s both",
          }}>
            {icons[category]}
          </div>

          {/* Title */}
          <div style={{
            fontSize: 22, fontWeight: 900, color: "#1E3A5F", marginTop: 8,
            background: isGradeUp
              ? "linear-gradient(90deg, #DC2626, #F59E0B, #3B82F6, #DC2626)"
              : "linear-gradient(90deg, #1D4ED8, #3B82F6, #1D4ED8)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "shimmer 2s linear infinite",
          }}>
            {isGradeUp ? "🎉 昇格！🎉" : "⬆️ レベルアップ！"}
          </div>

          {/* Category */}
          <div style={{ fontSize: 14, fontWeight: 700, color: "#6B7280", marginTop: 4 }}>
            {labels[category]}
          </div>

          {/* Level transition */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 12, marginTop: 16
          }}>
            <div style={{
              background: "#F3F4F6", borderRadius: 12, padding: "8px 14px",
              opacity: 0.6
            }}>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>Before</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: prev.g.color }}>
                {prev.g.emoji} {prev.g.name} Lv.{prev.l}
              </div>
            </div>

            <div style={{ fontSize: 24, color: "#F59E0B" }}>→</div>

            <div style={{
              background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)",
              borderRadius: 12, padding: "8px 14px",
              border: "2px solid #FBBF24",
              animation: "starBurst 0.5s ease-out 0.5s both",
            }}>
              <div style={{ fontSize: 11, color: "#92400E" }}>New!</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: next.g.color }}>
                {next.g.emoji} {next.g.name} Lv.{next.l}
              </div>
            </div>
          </div>

          {/* Next goal */}
          <div style={{
            marginTop: 16, fontSize: 11, color: "#9CA3AF",
            background: "#F9FAFB", borderRadius: 8, padding: "6px 10px"
          }}>
            次のレベルまであと少し！がんばれ！💪
          </div>

          {/* Close button */}
          <button onClick={onClose} style={{
            marginTop: 16, background: "linear-gradient(135deg, #1D4ED8, #3B82F6)",
            border: "none", borderRadius: 12, padding: "10px 32px",
            color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(29,78,216,0.3)"
          }}>
            OK！💪
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Small Components ───

function Ring({ value, max, size = 28, stroke = 3, color }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(value / max, 1);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={c * (1 - p)} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s" }} />
    </svg>
  );
}

function LevelCard({ tl, label, icon, total, unit, streakDays, color, nextIn }) {
  const { g, l } = gradeLevel(tl);
  return (
    <div style={{
      background: "white", borderRadius: 16, padding: "10px 8px", flex: 1,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)", minWidth: 0, textAlign: "center"
    }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#1E3A5F", marginTop: 2 }}>{label}</div>
      <div style={{
        background: `${color}15`, border: `1.5px solid ${color}40`,
        borderRadius: 8, padding: "2px 5px", marginTop: 3,
        fontSize: 9, fontWeight: 800, color, display: "inline-block"
      }}>
        {g.emoji} {g.name} Lv.{l}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color, marginTop: 4, lineHeight: 1 }}>
        {total.toLocaleString()}
      </div>
      <div style={{ fontSize: 8, color: "#9CA3AF" }}>{unit}</div>
      {streakDays > 0 && (
        <div style={{ fontSize: 9, fontWeight: 700, color: "#F59E0B", marginTop: 3 }}>
          🔥 {streakDays}日連続
        </div>
      )}
      {nextIn > 0 && (
        <div style={{ fontSize: 8, color: "#9CA3AF", marginTop: 2 }}>
          次Lvまで{nextIn}日
        </div>
      )}
    </div>
  );
}

function Btn({ onClick, color, children, small }) {
  return (
    <button onClick={onClick} style={{
      background: "white", border: `1.5px solid ${color}33`, borderRadius: 8,
      width: small ? 28 : 34, height: small ? 28 : 30, fontSize: small ? 14 : 13,
      fontWeight: 700, color, cursor: "pointer", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 0
    }}>
      {children}
    </button>
  );
}

function Cnt({ label, unit, value, onChange, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, flex: 1, minWidth: 0 }}>{label}</div>
      <Btn onClick={() => onChange(Math.max(0, value - 10))} color={color}>-10</Btn>
      <Btn onClick={() => onChange(Math.max(0, value - 1))} color={color}>-</Btn>
      <div style={{ fontSize: 18, fontWeight: 800, color, minWidth: 36, textAlign: "center" }}>{value}</div>
      <Btn onClick={() => onChange(value + 1)} color={color}>+</Btn>
      <Btn onClick={() => onChange(value + 10)} color={color}>+10</Btn>
      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{unit}</span>
    </div>
  );
}

function MiniCnt({ label, value, onChange, color }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Btn onClick={() => onChange(Math.max(0, value - 1))} color={color} small>-</Btn>
        <div style={{ fontSize: 16, fontWeight: 800, color, minWidth: 28, textAlign: "center" }}>{value}</div>
        <Btn onClick={() => onChange(value + 1)} color={color} small>+</Btn>
      </div>
    </div>
  );
}

function Pill({ active, partial, bg, children }) {
  let gradient = "#F3F4F6";
  if (active) gradient = `linear-gradient(135deg, ${bg[0]}, ${bg[1]})`;
  else if (partial) gradient = `${bg[0]}22`;
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 9, display: "flex",
      alignItems: "center", justifyContent: "center", background: gradient, fontSize: 14
    }}>
      {children}
    </div>
  );
}

function Stars({ count }) {
  if (count === 0) return null;
  return (
    <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
      {Array.from({ length: Math.min(count, 5) }, (_, i) => (
        <span key={i} style={{ fontSize: 11 }}>⭐</span>
      ))}
    </div>
  );
}

function StreakBadge({ streak }) {
  if (streak < 2) return null;
  const color = streak >= 14 ? "#EF4444" : streak >= 7 ? "#F59E0B" : "#3B82F6";
  const bg = streak >= 14 ? "#FEF2F2" : streak >= 7 ? "#FFFBEB" : "#EFF6FF";
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, color, background: bg,
      borderRadius: 6, padding: "1px 5px", display: "inline-flex", alignItems: "center", gap: 2
    }}>
      🔥{streak}日
    </span>
  );
}

// ─── Day Card ───

function DayCard({ dateKey, dayNum, dow, entry, isSelected, onSelect }) {
  const e = entry || {};
  const hasData = e.swings > 0 || e.pitches > 0 || e.bcAtBats > 0 || e.gameAtBats > 0;
  const dowColor = dow === 0 ? "#EF4444" : dow === 6 ? "#3B82F6" : "#6B7280";
  const stars = getDayStars(e);
  const isWeekend = dow === 0 || dow === 6;

  let bg = "white";
  let border = "#F3F4F6";
  if (isSelected) { bg = "linear-gradient(135deg, #1D4ED8, #3B82F6)"; border = "#1D4ED8"; }
  else if (stars >= 8) { bg = "linear-gradient(135deg, #FFFBEB, #FEF3C7)"; border = "#FBBF24"; }
  else if (stars >= 4) { bg = "#EFF6FF"; border = "#93C5FD"; }
  else if (hasData) { border = "#DBEAFE"; }

  return (
    <div onClick={onSelect} style={{
      minWidth: 56, width: 56, borderRadius: 14, padding: "8px 4px",
      background: bg, border: `2px solid ${border}`,
      textAlign: "center", cursor: "pointer", flexShrink: 0,
      boxShadow: isSelected ? "0 4px 12px rgba(29,78,216,0.3)" : "0 1px 3px rgba(0,0,0,0.05)",
      transition: "all 0.2s"
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: isSelected ? "rgba(255,255,255,0.7)" : dowColor }}>
        {DOW[dow]}
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color: isSelected ? "white" : dowColor, lineHeight: 1.1 }}>
        {dayNum}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 4 }}>
        <div style={{
          width: 8, height: 8, borderRadius: 4,
          background: e.swings >= 50 ? "#3B82F6" : e.swings > 0 ? "#93C5FD" : (isSelected ? "rgba(255,255,255,0.3)" : "#E5E7EB")
        }} />
        <div style={{
          width: 8, height: 8, borderRadius: 4,
          background: e.pitches >= 30 ? "#DC2626" : e.pitches > 0 ? "#FCA5A5" : (isSelected ? "rgba(255,255,255,0.3)" : "#E5E7EB")
        }} />
        {isWeekend && (
          <div style={{
            width: 8, height: 8, borderRadius: 4,
            background: e.gameAtBats > 0 ? "#F59E0B" : (isSelected ? "rgba(255,255,255,0.3)" : "#E5E7EB")
          }} />
        )}
      </div>
      {stars > 0 && !isSelected && (
        <div style={{ fontSize: 8, marginTop: 3 }}>{"⭐".repeat(Math.min(stars, 3))}</div>
      )}
      {stars > 0 && isSelected && (
        <div style={{ fontSize: 8, marginTop: 3, color: "#FCD34D" }}>{"★".repeat(Math.min(stars, 3))}</div>
      )}
    </div>
  );
}

// ─── Input Panel ───

function InputPanel({ dateKey, dayNum, dow, entry, onUpdate, month, data }) {
  const e = entry || {};
  const isWeekend = dow === 0 || dow === 6;
  const stars = getDayStars(e);
  const swStrk = getStreak(data, month.year, month.month, dayNum, "swings", 50);
  const piStrk = getStreak(data, month.year, month.month, dayNum, "pitches", 30);
  const best = Math.max(swStrk, piStrk);

  return (
    <div style={{
      background: "#E5E7EB", borderRadius: "20px 20px 0 0", padding: "14px 14px 20px",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", flex: 1, overflowY: "auto",
      WebkitOverflowScrolling: "touch"
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            background: "linear-gradient(135deg, #1D4ED8, #3B82F6)", borderRadius: 10,
            width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 18, fontWeight: 900
          }}>
            {dayNum}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1E3A5F" }}>
              {month.month}月{dayNum}日（{DOW[dow]}）
            </div>
            {best >= 2 && (
              <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B" }}>
                🔥 {best}日連続チャレンジ中！
              </div>
            )}
          </div>
        </div>
        {stars > 0 && (
          <div style={{ display: "flex", gap: 1 }}>
            {Array.from({ length: Math.min(stars, 5) }, (_, i) => (
              <span key={i} style={{ fontSize: 14 }}>⭐</span>
            ))}
          </div>
        )}
      </div>
      <Cnt label="💥 素振り" unit="回" value={e.swings || 0} color="#3B82F6"
        onChange={v => onUpdate(dateKey, { ...e, swings: v })} />
      <div style={{ marginTop: 10 }}>
        <Cnt label="⚾ ピッチング" unit="球" value={e.pitches || 0} color="#DC2626"
          onChange={v => onUpdate(dateKey, { ...e, pitches: v })} />
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981", marginBottom: 4 }}>🎯 バッティングセンター</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 2 }}>球数（1ゲーム=20球）</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Btn onClick={() => onUpdate(dateKey, { ...e, bcAtBats: Math.max(0, (e.bcAtBats||0) - 20) })} color="#10B981" small>-20</Btn>
              <Btn onClick={() => onUpdate(dateKey, { ...e, bcAtBats: Math.max(0, (e.bcAtBats||0) - 1) })} color="#10B981" small>-</Btn>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#10B981", minWidth: 28, textAlign: "center" }}>{e.bcAtBats || 0}</div>
              <Btn onClick={() => onUpdate(dateKey, { ...e, bcAtBats: (e.bcAtBats||0) + 1 })} color="#10B981" small>+</Btn>
              <Btn onClick={() => onUpdate(dateKey, { ...e, bcAtBats: (e.bcAtBats||0) + 20 })} color="#10B981" small>+20</Btn>
            </div>
          </div>
          <MiniCnt label="ミート" value={e.bcHits || 0} onChange={v => onUpdate(dateKey, { ...e, bcHits: v })} color="#10B981" />
        </div>
      </div>
      {isWeekend && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 4 }}>🏟️ 試合</div>
          <div style={{ display: "flex", gap: 8 }}>
            <MiniCnt label="打席" value={e.gameAtBats || 0} onChange={v => onUpdate(dateKey, { ...e, gameAtBats: v })} color="#F59E0B" />
            <MiniCnt label="ヒット" value={e.gameHits || 0} onChange={v => onUpdate(dateKey, { ...e, gameHits: v })} color="#F59E0B" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Graph View ───

function GraphView({ data, month }) {
  const graphScrollRef = useRef(null);

  // Build 3 months of data (2 previous + current)
  const chartData = useMemo(() => {
    const result = [];
    for (let offset = -2; offset <= 0; offset++) {
      let m = month.month + offset;
      let y = month.year;
      if (m < 1) { m += 12; y--; }
      if (m > 12) { m -= 12; y++; }
      const dim = new Date(y, m, 0).getDate();
      for (let d = 1; d <= dim; d++) {
        const e = data[fmtD(y, m, d)] || {};
        result.push({
          label: `${m}/${d}`,
          month: m,
          day: d,
          swings: e.swings || 0,
          pitches: e.pitches || 0,
          bcHits: e.bcHits || 0,
          bcAtBats: e.bcAtBats || 0,
          gameHits: e.gameHits || 0,
          gameAtBats: e.gameAtBats || 0,
          stars: getDayStars(e),
        bcRate: e.bcAtBats > 0 ? Math.round((e.bcHits || 0) / e.bcAtBats * 100) : 0,
        });
      }
    }
    return result;
  }, [data, month]);

  // Daily items (swing/pitch): wide bars, ~7 days visible at a time
  const dailyDayW = 50;
  const dailyChartW = chartData.length * dailyDayW + 60;

  // Monthly items (BC/game): thin bars, ~30 days visible at a time
  const monthlyDayW = 13;
  const monthlyChartW = chartData.length * monthlyDayW + 60;

  // Auto-scroll to right (today) on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const scrollables = document.querySelectorAll("[data-graph-scroll]");
      scrollables.forEach(el => {
        el.scrollLeft = el.scrollWidth;
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [month]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div style={{
        background: "white", borderRadius: 10, padding: "8px 12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)", fontSize: 11, zIndex: 50
      }}>
        <div style={{ fontWeight: 800, color: "#1E3A5F", marginBottom: 4 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontWeight: 700 }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  function ScrollChart({ children, height, wide }) {
    const w = wide ? dailyChartW : monthlyChartW;
    const bw = wide ? Math.max(dailyDayW - 16, 8) : Math.max(monthlyDayW - 4, 4);
    return (
      <div data-graph-scroll style={{
        overflowX: "auto", overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", msOverflowStyle: "none",
        marginBottom: 4,
      }}>
        <div style={{ width: w, height }}>
          <BarChart width={w} height={height} data={chartData} barGap={1} barSize={bw}>
            {children}
          </BarChart>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch",
      background: "white", borderRadius: "20px 20px 0 0",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.08)", padding: "14px 0 20px"
    }}>
      {/* Scroll hint */}
      <div style={{ padding: "0 12px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "#9CA3AF" }}>← スクロールで過去を見る</div>
        <div style={{ fontSize: 10, color: "#9CA3AF" }}>直近3ヶ月分</div>
      </div>

      {/* Swing & Pitch - 週間ビュー */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1E3A5F", marginBottom: 8, paddingLeft: 12 }}>
          💥 素振り ＆ ⚾ 投球（日別）
        </div>
        <ScrollChart height={200} wide>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={0} />
          <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={30} />
          <Tooltip content={CustomTooltip} />
          <ReferenceLine y={50} stroke="#3B82F6" strokeDasharray="4 4" strokeWidth={1.5} />
          <ReferenceLine y={30} stroke="#DC2626" strokeDasharray="4 4" strokeWidth={1.5} />
          <Bar dataKey="swings" name="素振り" fill="#3B82F6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="pitches" name="投球" fill="#DC2626" radius={[3, 3, 0, 0]} />
        </ScrollChart>
      </div>

      {/* Stars - 週間ビュー */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1E3A5F", marginBottom: 8, paddingLeft: 12 }}>
          ⭐ 獲得スター（日別）
        </div>
        <ScrollChart height={140} wide>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={0} />
          <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={30} domain={[0, 10]} />
          <Tooltip content={CustomTooltip} />
          <Bar dataKey="stars" name="スター" fill="#F59E0B" radius={[3, 3, 0, 0]} />
        </ScrollChart>
      </div>

      {/* BC - 月間ビュー */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1E3A5F", marginBottom: 8, paddingLeft: 12 }}>
          🎯 バッセン ミート率（日別）
        </div>
        <ScrollChart height={140} wide={false}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="label" tick={{ fontSize: 7, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={30}
            domain={[0, 100]} unit="%" />
          <Tooltip content={CustomTooltip} />
          <Bar dataKey="bcRate" name="ミート率%" fill="#10B981" radius={[3, 3, 0, 0]} />
        </ScrollChart>
      </div>

      {/* Game - 月間ビュー */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1E3A5F", marginBottom: 8, paddingLeft: 12 }}>
          🏟️ 試合 打席・ヒット（日別）
        </div>
        <ScrollChart height={140} wide={false}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="label" tick={{ fontSize: 7, fill: "#9CA3AF" }} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={{ fontSize: 9, fill: "#9CA3AF" }} tickLine={false} axisLine={false} width={30} />
          <Tooltip content={CustomTooltip} />
          <Bar dataKey="gameAtBats" name="打席" fill="#F59E0B" radius={[3, 3, 0, 0]} />
          <Bar dataKey="gameHits" name="ヒット" fill="#EF4444" radius={[3, 3, 0, 0]} />
        </ScrollChart>
      </div>
    </div>
  );
}

// ─── Roadmap View ───

function RoadmapView({ levels, data }) {
  const categories = [
    { key: "swing", label: "素振り", icon: "💥", color: "#3B82F6", field: "swings", threshold: 50 },
    { key: "pitch", label: "投球", icon: "⚾", color: "#DC2626", field: "pitches", threshold: 30 },
    { key: "bc", label: "バッセン", icon: "🎯", color: "#10B981", field: "bcAtBats", threshold: 1 },
    { key: "game", label: "試合", icon: "🏟️", color: "#F59E0B", field: "gameAtBats", threshold: 1 },
  ];
  const [activeCat, setActiveCat] = useState("swing");
  const cat = categories.find(c => c.key === activeCat);
  const currentTotal = levels[activeCat] || 0;
  const scrollRef = useRef(null);

  const currentGi = Math.min(Math.floor(currentTotal / LPG), GRADES.length - 1);
  const currentLv = (currentTotal % LPG) + 1;

  const achievedDays = useMemo(() => {
    return Object.values(data).filter(e => (e[cat.field] || 0) >= cat.threshold).length;
  }, [data, cat]);

  const divisor = cat.key === "bc" ? 3 : cat.key === "game" ? 2 : 5;
  const nextIn = divisor - (achievedDays % divisor);

  // Auto scroll to current position
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-grade="${currentGi}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeCat, currentTotal]);

  // Mountain height for each grade (0 = bottom, 1 = peak)
  const totalG = GRADES.length;
  const stageW = 120;
  const mountainH = 500;
  const baseY = mountainH - 20;
  const peakY = 60;

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
      background: "linear-gradient(180deg, #87CEEB 0%, #B0E0FF 40%, #E8F5E9 80%, #A5D6A7 100%)",
    }}>
      <style>{`
        @keyframes flagWave {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes playerBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>

      {/* Category selector */}
      <div style={{ padding: "10px 10px 6px", flexShrink: 0, background: "rgba(255,255,255,0.3)", backdropFilter: "blur(8px)" }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: "#1E3A5F", marginBottom: 6, textAlign: "center" }}>
          🗺️ クエストロードマップ
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {categories.map(c => (
            <button key={c.key} onClick={() => setActiveCat(c.key)} style={{
              flex: 1, padding: "5px 2px", border: "none", borderRadius: 8, cursor: "pointer",
              fontSize: 10, fontWeight: 800,
              background: activeCat === c.key ? "white" : "rgba(255,255,255,0.5)",
              color: activeCat === c.key ? c.color : "#6B7280",
              boxShadow: activeCat === c.key ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s"
            }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Current status */}
        <div style={{
          marginTop: 6, background: "white", borderRadius: 10, padding: "6px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 20 }}>{GRADES[currentGi].emoji}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: GRADES[currentGi].color }}>
                {GRADES[currentGi].name} Lv.{currentLv}
              </div>
              <div style={{ fontSize: 9, color: "#9CA3AF" }}>次のレベルまで あと{nextIn}日</div>
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#6B7280" }}>
            {currentGi + 1}/{totalG}
          </div>
        </div>
      </div>

      {/* Horizontal scrolling mountain */}
      <div ref={scrollRef} style={{
        flex: 1, overflowX: "auto", overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", msOverflowStyle: "none",
        position: "relative",
      }}>
        <div style={{
          width: totalG * stageW + 80, height: "100%",
          position: "relative", minHeight: mountainH,
        }}>

          {/* Mountain silhouette background */}
          <svg width={totalG * stageW + 80} height={mountainH} style={{
            position: "absolute", bottom: 0, left: 0,
          }}>
            <defs>
              <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A0826D" />
                <stop offset="15%" stopColor="#8B7355" />
                <stop offset="40%" stopColor="#5B8C3E" />
                <stop offset="70%" stopColor="#3A7D2C" />
                <stop offset="100%" stopColor="#2E7D32" />
              </linearGradient>
              <linearGradient id="snowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E0E0E0" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Mountain fill - smooth curve through grade points */}
            <path d={(() => {
              const pts = GRADES.map((_, gi) => ({
                x: gi * stageW + stageW / 2 + 40,
                y: baseY - (gi / (totalG - 1)) * (baseY - peakY),
              }));
              // Start from bottom-left
              let d = `M 0 ${mountainH} L 0 ${pts[0].y + 10}`;
              // Smooth curve through all points
              for (let i = 0; i < pts.length; i++) {
                if (i === 0) {
                  d += ` L ${pts[0].x} ${pts[0].y}`;
                } else {
                  const prev = pts[i - 1];
                  const cur = pts[i];
                  const cpx = (prev.x + cur.x) / 2;
                  d += ` C ${cpx} ${prev.y} ${cpx} ${cur.y} ${cur.x} ${cur.y}`;
                }
              }
              // Close to bottom-right
              d += ` L ${totalG * stageW + 80} ${pts[pts.length - 1].y + 10} L ${totalG * stageW + 80} ${mountainH} Z`;
              return d;
            })()} fill="url(#mountainGrad)" />

            {/* Snow cap on the last few peaks */}
            <ellipse cx={GRADES.length * stageW - stageW / 2 + 40} cy={peakY + 10} rx={50} ry={20} fill="url(#snowGrad)" opacity="0.7" />

            {/* Trail path */}
            {GRADES.map((_, gi) => {
              if (gi === 0) return null;
              const x1 = (gi - 1) * stageW + stageW / 2 + 40;
              const y1 = baseY - ((gi - 1) / (totalG - 1)) * (baseY - peakY);
              const x2 = gi * stageW + stageW / 2 + 40;
              const y2 = baseY - (gi / (totalG - 1)) * (baseY - peakY);
              const isCleared = gi - 1 < currentGi;
              return (
                <line key={gi} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isCleared ? "#FFD700" : "#FFFFFF55"}
                  strokeWidth={isCleared ? 3 : 2}
                  strokeDasharray={isCleared ? "none" : "6 4"}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Grade markers */}
          {GRADES.map((grade, gi) => {
            const x = gi * stageW + stageW / 2 + 40;
            const y = baseY - (gi / (totalG - 1)) * (baseY - peakY);
            const isCompleted = gi < currentGi;
            const isCurrent = gi === currentGi;
            const isFuture = gi > currentGi;
            const isNext = gi === currentGi + 1;
            const isLast = gi === totalG - 1;

            return (
              <div key={gi} data-grade={gi} style={{
                position: "absolute",
                left: x - 40,
                top: y - 56,
                width: 80,
                textAlign: "center",
                transition: "all 0.3s",
              }}>
                {/* Flag pole */}
                <div style={{
                  position: "relative",
                  display: "flex", flexDirection: "column", alignItems: "center",
                }}>
                  {/* Flag */}
                  <div style={{
                    animation: isCurrent ? "flagWave 2s ease-in-out infinite" : "none",
                    transformOrigin: "bottom center",
                  }}>
                    {/* Flag banner */}
                    <div style={{
                      background: isCompleted
                        ? "linear-gradient(135deg, #22C55E, #16A34A)"
                        : isCurrent
                          ? `linear-gradient(135deg, ${cat.color}, ${cat.color}CC)`
                          : isNext
                            ? "linear-gradient(135deg, #FDE68A, #FCD34D)"
                            : "#D1D5DB",
                      borderRadius: 8,
                      padding: "4px 6px",
                      minWidth: 56,
                      boxShadow: isCurrent
                        ? `0 4px 12px ${cat.color}40`
                        : isCompleted
                          ? "0 2px 8px rgba(34,197,94,0.3)"
                          : "0 1px 3px rgba(0,0,0,0.1)",
                      position: "relative",
                    }}>
                      {/* Gem icon */}
                      <div style={{
                        fontSize: isCurrent ? 22 : 18,
                        filter: isFuture && !isNext ? "grayscale(0.5)" : "none",
                      }}>
                        {grade.emoji}
                      </div>

                      {/* Lock overlay for future */}
                      {isFuture && (
                        <div style={{
                          position: "absolute", top: -4, right: -4,
                          fontSize: 10, background: "white", borderRadius: 6,
                          width: 16, height: 16, display: "flex",
                          alignItems: "center", justifyContent: "center",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
                        }}>
                          🔒
                        </div>
                      )}

                      {/* Checkmark for completed */}
                      {isCompleted && (
                        <div style={{
                          position: "absolute", top: -4, right: -4,
                          fontSize: 10, background: "#22C55E", borderRadius: 6,
                          width: 16, height: 16, display: "flex",
                          alignItems: "center", justifyContent: "center",
                          color: "white", fontWeight: 900
                        }}>
                          ✓
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pole */}
                  <div style={{
                    width: 3, height: 16,
                    background: isCompleted ? "#A16207" : "#9CA3AF",
                    borderRadius: 2,
                  }} />

                  {/* Base marker */}
                  {isCurrent ? (
                    <div style={{
                      fontSize: 22,
                      animation: "playerBounce 1.5s ease-in-out infinite",
                    }}>
                      👦
                    </div>
                  ) : (
                    <div style={{
                      width: 12, height: 12, borderRadius: "50%",
                      background: isCompleted ? "#FFD700" : "#D1D5DB",
                    }} />
                  )}
                </div>

                {/* Label */}
                <div style={{
                  marginTop: 4, fontSize: 9, fontWeight: 800,
                  color: isCompleted ? "#1E3A5F" : isCurrent ? cat.color : (isFuture ? "#9CA3AF" : "#6B7280"),
                  lineHeight: 1.1,
                }}>
                  {grade.name}
                </div>

                {/* Sub label */}
                {isCurrent && (
                  <div style={{
                    fontSize: 7, fontWeight: 700, color: "white",
                    background: cat.color, borderRadius: 4, padding: "1px 4px",
                    display: "inline-block", marginTop: 2,
                  }}>
                    いまココ！
                  </div>
                )}

                {/* Peak marker for last */}
                {isLast && (
                  <div style={{
                    fontSize: 8, fontWeight: 800, color: "#FF6F00", marginTop: 2,
                    animation: "sparkle 2s ease-in-out infinite",
                  }}>
                    🏔️ 山頂
                  </div>
                )}
              </div>
            );
          })}

          {/* Clouds decoration */}
          {[
            { left: 60, top: 10, size: 40, opacity: 0.6 },
            { left: 300, top: 20, size: 50, opacity: 0.4 },
            { left: 600, top: 5, size: 45, opacity: 0.5 },
            { left: 900, top: 15, size: 55, opacity: 0.3 },
            { left: 1200, top: 8, size: 40, opacity: 0.5 },
            { left: 1600, top: 12, size: 50, opacity: 0.4 },
            { left: 2000, top: 6, size: 45, opacity: 0.6 },
          ].map((cloud, i) => (
            <div key={i} style={{
              position: "absolute", left: cloud.left, top: cloud.top,
              fontSize: cloud.size, opacity: cloud.opacity,
              pointerEvents: "none",
            }}>
              ☁️
            </div>
          ))}

          {/* Trees decoration on mountain */}
          {GRADES.map((_, gi) => {
            if (gi % 3 !== 1) return null;
            const x = gi * stageW + 20;
            const y = baseY - (gi / (totalG - 1)) * (baseY - peakY) + 10;
            return (
              <div key={`tree-${gi}`} style={{
                position: "absolute", left: x, top: y,
                fontSize: 16, opacity: 0.6, pointerEvents: "none",
              }}>
                🌲
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom legend */}
      <div style={{
        flexShrink: 0, padding: "8px 12px", background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6B7280" }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: "#22C55E" }} /> クリア済
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6B7280" }}>
          <div style={{ width: 10, height: 10, borderRadius: 5, background: cat.color }} /> 現在地
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6B7280" }}>
          <span style={{ fontSize: 10 }}>🔒</span> ロック中
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6B7280" }}>
          ← スクロール →
        </div>
      </div>
    </div>
  );
}

// ─── Main ───

export default function Home() {
  const { data, loading, saveEntry } = useEntries();

  const [month, setMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() + 1 };
  });
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [tab, setTab] = useState("dashboard");
  const scrollRef = useRef(null);

  const [celebration, setCelebration] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevLevelsRef = useRef(null);

  useEffect(() => {
    if (!loading && !prevLevelsRef.current) {
      prevLevelsRef.current = calcLevels(data);
    }
  }, [loading, data]);

  useEffect(() => {
    if (loading) return;
    if (scrollRef.current && tab === "dashboard") {
      const timer = setTimeout(() => {
        const target = scrollRef.current?.children[selectedDay - 1];
        if (target) {
          target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedDay, month, tab, loading]);

  const upd = useCallback((k, e) => {
    const oldLvls = prevLevelsRef.current || calcLevels(data);
    const tempData = { ...data, [k]: e };
    const newLvls = calcLevels(tempData);

    const cats = ["swing", "pitch", "bc", "game"];
    for (const cat of cats) {
      if (newLvls[cat] > oldLvls[cat]) {
        setCelebration({ category: cat, prevLevel: oldLvls[cat], newLevel: newLvls[cat] });
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        break;
      }
    }
    prevLevelsRef.current = newLvls;

    saveEntry(k, e);
  }, [data, saveEntry]);

  const chgM = (dir) => {
    setMonth(p => {
      let m = p.month + dir, y = p.year;
      if (m > 12) { m = 1; y++; }
      if (m < 1) { m = 12; y--; }
      return { year: y, month: m };
    });
    setSelectedDay(1);
  };

  const levels = useMemo(() => calcLevels(data), [data]);

  const dim = new Date(month.year, month.month, 0).getDate();
  const tSw = calcTotal(data, month, "swings");
  const tPi = calcTotal(data, month, "pitches");
  const dSw = countOver(data, month, "swings", 50);
  const dPi = countOver(data, month, "pitches", 30);
  const bcA = calcAvg(data, month, "bc");
  const gmA = calcAvg(data, month, "game");
  const swStreak = getCurrentStreak(data, month, "swings", 50);
  const piStreak = getCurrentStreak(data, month, "pitches", 30);

  // Calc days until next level
  const allSwDays = Object.values(data).filter(e => e.swings >= 50).length;
  const allPiDays = Object.values(data).filter(e => e.pitches >= 30).length;
  const swNextIn = 5 - (allSwDays % 5);
  const piNextIn = 5 - (allPiDays % 5);

  const monthStars = useMemo(() => {
    let s = 0;
    for (let d = 1; d <= dim; d++) {
      s += getDayStars(data[fmtD(month.year, month.month, d)]);
    }
    return s;
  }, [data, month, dim]);

  const fmtAvg = (v) => {
    if (v === null) return "---";
    return "." + Math.round(v * 1000).toString().padStart(3, "0");
  };

  const selKey = fmtD(month.year, month.month, selectedDay);
  const selDow = new Date(month.year, month.month - 1, selectedDay).getDay();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "'M PLUS Rounded 1c', sans-serif", color: "#9CA3AF" }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'M PLUS Rounded 1c', -apple-system, sans-serif",
      height: "100vh", maxWidth: 430, margin: "0 auto",
      display: "flex", flexDirection: "column", overflow: "hidden", background: "#B91C1C",
      position: "relative"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;800;900&display=swap" rel="stylesheet" />

      {/* Confetti overlay */}
      <Confetti active={showConfetti} />

      {/* Level-up card */}
      <LevelUpCard
        show={celebration !== null}
        category={celebration?.category}
        prevLevel={celebration?.prevLevel || 0}
        newLevel={celebration?.newLevel || 0}
        onClose={() => setCelebration(null)}
      />

      {/* ═══ HEADER ═══ */}
      <div style={{
        background: "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 40%, #DC2626 100%)",
        padding: "8px 12px", color: "white", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>⚾</span>
          <div>
            <div style={{ fontSize: 7, letterSpacing: 2, opacity: 0.5 }}>KENTO36 🔥LEVEL UP APP🔥</div>
            <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>👦KENTO36🔥レベルUPアプリ🔥</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => chgM(-1)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 28, height: 28, fontSize: 12, color: "white", cursor: "pointer", fontWeight: 700 }}>◀</button>
          <div style={{ fontSize: 14, fontWeight: 900 }}>{month.month}月</div>
          <button onClick={() => chgM(1)} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, width: 28, height: 28, fontSize: 12, color: "white", cursor: "pointer", fontWeight: 700 }}>▶</button>
        </div>
      </div>

      {/* ═══ TAB BAR ═══ */}
      <div style={{
        display: "flex", flexShrink: 0, background: "#991B1B", padding: "4px 8px"
      }}>
        {[
          { id: "dashboard", label: "📊 ダッシュボード" },
          { id: "graph", label: "📈 グラフ" },
          { id: "roadmap", label: "🗺️ ロードマップ" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "6px 0", border: "none", borderRadius: 8, cursor: "pointer",
            fontSize: 10, fontWeight: 800,
            background: tab === t.id ? "white" : "transparent",
            color: tab === t.id ? "#B91C1C" : "rgba(255,255,255,0.7)",
            transition: "all 0.2s"
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ CONTENT ═══ */}
      {tab === "dashboard" && (
        <>
          <div style={{ flexShrink: 0, padding: "8px 8px 0", background: "#B91C1C" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <LevelCard tl={levels.swing} label="素振り" icon="💥" total={tSw} unit="回" streakDays={swStreak} color="#3B82F6" nextIn={swNextIn} />
              <LevelCard tl={levels.pitch} label="投球" icon="⚾" total={tPi} unit="球" streakDays={piStreak} color="#DC2626" nextIn={piNextIn} />
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <div style={{ background: "white", borderRadius: 14, padding: "8px 6px", flex: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", textAlign: "center" }}>
                <div style={{ fontSize: 18 }}>🎯</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#1E3A5F" }}>バッセン</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#10B981", lineHeight: 1 }}>{fmtAvg(bcA)}</div>
                <div style={{ fontSize: 8, color: "#9CA3AF" }}>打率</div>
              </div>
              <div style={{ background: "white", borderRadius: 14, padding: "8px 6px", flex: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", textAlign: "center" }}>
                <div style={{ fontSize: 18 }}>🏟️</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#1E3A5F" }}>試合</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#F59E0B", lineHeight: 1 }}>{fmtAvg(gmA)}</div>
                <div style={{ fontSize: 8, color: "#9CA3AF" }}>打率</div>
              </div>
              <div style={{ background: "linear-gradient(135deg, #FFFBEB, #FEF3C7)", borderRadius: 14, padding: "8px 6px", flex: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", textAlign: "center" }}>
                <div style={{ fontSize: 18 }}>⭐</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#92400E" }}>{month.month}月の星</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#D97706", lineHeight: 1 }}>{monthStars}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
                <div style={{ background: "white", borderRadius: 10, padding: "4px 6px", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ position: "relative" }}>
                    <Ring value={dSw} max={dim} color="#3B82F6" />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 900, color: "#3B82F6" }}>
                      {Math.round(dSw / dim * 100)}%
                    </div>
                  </div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: "#1E3A5F" }}>{dSw}/{dim}</div>
                </div>
                <div style={{ background: "white", borderRadius: 10, padding: "4px 6px", display: "flex", alignItems: "center", gap: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div style={{ position: "relative" }}>
                    <Ring value={dPi} max={dim} color="#DC2626" />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 900, color: "#DC2626" }}>
                      {Math.round(dPi / dim * 100)}%
                    </div>
                  </div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: "#1E3A5F" }}>{dPi}/{dim}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flexShrink: 0, padding: "4px 0 6px", background: "#B91C1C" }}>
            <div style={{ padding: "0 8px 4px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#FFFFFF" }}>📅 練習カレンダー</div>
            </div>
            <div ref={scrollRef} style={{
              display: "flex", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch",
              padding: "0 8px 4px", scrollbarWidth: "none", msOverflowStyle: "none"
            }}>
              {Array.from({ length: dim }, (_, i) => {
                const d = i + 1;
                const key = fmtD(month.year, month.month, d);
                const dow = new Date(month.year, month.month - 1, d).getDay();
                return (
                  <DayCard
                    key={key} dateKey={key} dayNum={d} dow={dow}
                    entry={data[key]} isSelected={selectedDay === d}
                    onSelect={() => setSelectedDay(d)}
                  />
                );
              })}
            </div>
          </div>

          <InputPanel
            dateKey={selKey} dayNum={selectedDay} dow={selDow}
            entry={data[selKey]} onUpdate={upd}
            month={month} data={data}
          />
        </>
      )}

      {tab === "graph" && (
        <GraphView data={data} month={month} />
      )}

      {tab === "roadmap" && (
        <RoadmapView levels={levels} data={data} />
      )}
    </div>
  );
}
