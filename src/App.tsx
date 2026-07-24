import { useState, useCallback, useRef } from "react";

const XOR_OPTIONS = ["X", "O", "R"];

const XOR_COLORS = {
  X: { bg: "#1a4a1a", text: "#a0f0a0", active: "#22c55e" },
  O: { bg: "#4a1a1a", text: "#f0a0a0", active: "#ef4444" },
  R: { bg: "#4a2a00", text: "#f5c87a", active: "#f97316" },
};

const emptyRow = () => ({
  id: Date.now() + Math.random(),
  type: "entry",
  centreClr: "",
  inside50CAFC: 0,
  inside50Oppo: 0,
  uncontestedPos: 0,
  defTurnovers: 0,
  offTurnovers: 0,
  offTurnType: "",
  offTurnD: 0,
  offTurnC: 0,
  offTurnF: 0,
  fieldClrCAFC: "",
  fieldClrOppo: 0,
  cafcG: 0,
  cafcB: 0,
  oppoG: 0,
  oppoB: 0,
});

// ── History hook ──────────────────────────────────────────────────────────────
function useHistory(initial) {
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initial);
  const push = useCallback(
    (next) => {
      setPast((p) => [...p.slice(-49), present]);
      setPresent(next);
    },
    [present]
  );
  const undo = useCallback(() => {
    if (!past.length) return;
    setPresent(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  }, [past]);
  return { state: present, push, undo, canUndo: past.length > 0 };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function sumEntries(rows) {
  return rows
    .filter((r) => r.type === "entry")
    .reduce(
      (acc, r) => {
        acc.inside50CAFC += r.inside50CAFC;
        acc.inside50Oppo += r.inside50Oppo;
        acc.uncontestedPos += r.uncontestedPos;
        acc.defTurnovers += r.defTurnovers;
        acc.offTurnovers += r.offTurnovers;
        acc.offTurnD += r.offTurnD || 0;
        acc.offTurnC += r.offTurnC || 0;
        acc.offTurnF += r.offTurnF || 0;
        acc.fieldClrOppo += r.fieldClrOppo;
        acc.fieldClrOppoZero += r.fieldClrOppo === 0 ? 1 : 0;
        acc.centreClrX += r.centreClr === "X" ? 1 : 0;
        acc.centreClrO += r.centreClr === "O" ? 1 : 0;
        acc.fieldClrCAFCX += r.fieldClrCAFC === "X" ? 1 : 0;
        acc.fieldClrCAFCO += r.fieldClrCAFC === "O" ? 1 : 0;
        return acc;
      },
      {
        inside50CAFC: 0,
        inside50Oppo: 0,
        uncontestedPos: 0,
        defTurnovers: 0,
        offTurnovers: 0,
        offTurnD: 0,
        offTurnC: 0,
        offTurnF: 0,
        fieldClrOppo: 0,
        fieldClrOppoZero: 0,
        centreClrX: 0,
        centreClrO: 0,
        fieldClrCAFCX: 0,
        fieldClrCAFCO: 0,
      }
    );
}

function sumSinceLastQtr(rows) {
  const idx = rows.map((r) => r.type).lastIndexOf("qtr-subtotal");
  return sumEntries(rows.slice(idx + 1));
}

// Build a final qtr row for any trailing entries that haven't been closed
function buildQtrRow(label, rows, afterIdx) {
  const slice = rows.slice(afterIdx + 1);
  const hasEntries = slice.some((r) => r.type === "entry");
  if (!hasEntries) return null;
  return {
    id: Date.now() + Math.random(),
    type: "qtr-subtotal",
    label,
    ...sumEntries(slice),
    centreClr: "",
    fieldClrCAFC: "",
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Counter({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button onClick={() => onChange(Math.max(0, value - 1))} style={cbs}>
        −
      </button>
      <span
        style={{
          minWidth: 30,
          textAlign: "center",
          fontFamily: "monospace",
          fontSize: 15,
          fontWeight: 700,
          color: value > 0 ? "#e8f0ff" : "#4a5a6a",
        }}
      >
        {value}
      </span>
      <button onClick={() => onChange(value + 1)} style={cbs}>
        +
      </button>
    </div>
  );
}
const cbs = {
  width: 26,
  height: 26,
  border: "1px solid #2a3f56",
  borderRadius: 5,
  background: "#0d1f30",
  color: "#7ab3d9",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  padding: 0,
};

function XORBadge({ value }) {
  if (!value) return <span style={{ color: "#3a4a5a" }}>–</span>;
  const s = XOR_COLORS[value];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        background: s.bg,
        color: s.text,
        fontFamily: "monospace",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {value}
    </span>
  );
}

function NumBadge({ value, color, bright }) {
  if (value === 0 && !bright)
    return <span style={{ color: "#2a3a4a" }}>0</span>;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        background: color,
        color: bright ? "#aed4f5" : "#c8e0f5",
        fontFamily: "monospace",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {value}
    </span>
  );
}

function FieldGroup({ label, accent, children, runningTotal }) {
  return (
    <div
      style={{
        background: "#0a1a27",
        borderRadius: 8,
        padding: "12px 16px",
        border: "1px solid #1a2e40",
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#4a6a8a",
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        {runningTotal !== undefined && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "#2a4a5a",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              TOTAL
            </span>
            {runningTotal}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

const teamTag = (bg, color) => ({
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: 1.5,
  background: bg,
  color,
  padding: "2px 7px",
  borderRadius: 4,
});

function Toast({ msg, visible }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? 0 : 10}px)`,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s, transform 0.2s",
        background: "#1a3a5c",
        color: "#b8d8f5",
        padding: "8px 18px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        border: "1px solid #2a5a8a",
        pointerEvents: "none",
        zIndex: 999,
        whiteSpace: "nowrap",
      }}
    >
      {msg}
    </div>
  );
}

// Small running-total chip
function RT({ value, color }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "1px 7px",
        borderRadius: 4,
        background: color,
        color: "#aed4f5",
        fontFamily: "monospace",
        fontSize: 12,
        fontWeight: 800,
        minWidth: 22,
        textAlign: "center",
      }}
    >
      {value}
    </span>
  );
}
function GameSummary({ qtrs, grandTotal, onDismiss }) {
  const statCols = [
    { key: "centreClrX", label: "Centre Clr (X)", color: "#1a3a5c" },
    { key: "centreClrO", label: "Centre Clr (O)", color: "#5c1a1a" },
    { key: "inside50CAFC", label: "Inside 50s CAFC", color: "#0d2a45" },
    { key: "inside50Oppo", label: "Inside 50s Oppo", color: "#2a0d0d" },
    { key: "uncontestedPos", label: "Uncontested Poss.", color: "#0d2a1e" },
    { key: "defTurnovers", label: "Defensive Turnovers", color: "#1a2a0d" },
    { key: "offTurnovers", label: "Offensive Turnovers", color: "#2a1a0d" },
    { key: "fieldClrOppo", label: "Field Clr Oppo", color: "#2a0d0d" },
  ];

  return (
    <div style={gs.overlay}>
      <div style={gs.panel}>
        {/* Header */}
        <div style={gs.header}>
          <div style={gs.trophy}>🏆</div>
          <div>
            <div style={gs.title}>Game Summary</div>
            <div style={gs.subtitle}>Final Statistics</div>
          </div>
          <button onClick={onDismiss} style={gs.closeBtn}>
            ✕
          </button>
        </div>

        {/* Quarter breakdown */}
        <div style={gs.section}>
          <div style={gs.sectionLabel}>Quarter Breakdown</div>
          <table style={gs.table}>
            <thead>
              <tr>
                <th style={gs.th}>Qtr</th>
                {statCols.map((c) => (
                  <th key={c.key} style={gs.th}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {qtrs.map((q) => (
                <tr key={q.label} style={gs.tr}>
                  <td style={gs.tdLabel}>
                    <span style={gs.qtrPill}>{q.label}</span>
                  </td>
                  {statCols.map((c) => (
                    <td key={c.key} style={gs.td}>
                      <NumBadge value={q[c.key]} color={c.color} bright />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grand total */}
        <div style={gs.totalSection}>
          <div style={gs.sectionLabel}>Match Total</div>
          <div style={gs.totalGrid}>
            {statCols.map((c) => (
              <div key={c.key} style={gs.totalCard}>
                <div style={gs.totalCardLabel}>{c.label}</div>
                <div style={{ ...gs.totalCardValue, background: c.color }}>
                  {grandTotal[c.key]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onDismiss} style={gs.dismissBtn}>
          Close Summary
        </button>
      </div>
    </div>
  );
}

const gs = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  panel: {
    background: "#071422",
    border: "1px solid #1a3a5a",
    borderRadius: 14,
    width: "100%",
    maxWidth: 560,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "18px 20px",
    borderBottom: "1px solid #0d2035",
  },
  trophy: { fontSize: 28 },
  title: {
    fontSize: 20,
    fontWeight: 800,
    color: "#e8f4ff",
    letterSpacing: 0.5,
  },
  subtitle: { fontSize: 12, color: "#3a6a9a", marginTop: 2 },
  closeBtn: {
    marginLeft: "auto",
    background: "transparent",
    border: "none",
    color: "#3a5a7a",
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 8px",
  },
  section: { padding: "16px 20px" },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#3a6a9a",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "6px 10px",
    textAlign: "left",
    fontSize: 10,
    fontWeight: 700,
    color: "#2a5a7a",
    letterSpacing: 1,
    textTransform: "uppercase",
    borderBottom: "1px solid #0d2035",
  },
  tr: { borderBottom: "1px solid #0a1e30" },
  td: { padding: "8px 10px" },
  tdLabel: { padding: "8px 10px" },
  qtrPill: {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 5,
    background: "#1a3a7a",
    color: "#aac8f5",
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
  },
  totalSection: {
    padding: "0 20px 16px",
    borderTop: "1px solid #0d2035",
    paddingTop: 16,
  },
  totalGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  totalCard: {
    background: "#0a1a27",
    borderRadius: 8,
    padding: "12px 14px",
    border: "1px solid #1a2e40",
  },
  totalCardLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#4a6a8a",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  totalCardValue: {
    display: "inline-block",
    padding: "4px 14px",
    borderRadius: 6,
    fontFamily: "monospace",
    fontSize: 22,
    fontWeight: 800,
    color: "#aed4f5",
  },
  dismissBtn: {
    display: "block",
    width: "calc(100% - 40px)",
    margin: "0 20px 20px",
    padding: "10px",
    background: "#1a3a6a",
    border: "1px solid #2a5a8a",
    borderRadius: 8,
    color: "#7ab3d9",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
};

// ── Main App ──────────────────────────────────────────────────────────────────
const firstDraft = emptyRow();

export default function App() {
  const { state, push, undo, canUndo } = useHistory({
    rows: [],
    draft: firstDraft,
    qtrCount: 1,
    gameOver: false,
  });
  const { rows, draft, qtrCount, gameOver } = state;

  const [score, setScore] = useState({
    cafcG: 0,
    cafcB: 0,
    oppoG: 0,
    oppoB: 0,
  });
  const calcScore = (g, b) => (parseInt(g) || 0) * 6 + (parseInt(b) || 0);
  const [toast, setToast] = useState({ msg: "", visible: false });
  const [showSummary, setShowSummary] = useState(false);
  const [opposition, setOpposition] = useState("");
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, visible: true });
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      1800
    );
  };

  // Commit pending draft helper — returns updated rows array
  const withCommittedDraft = (currentRows, currentDraft) => {
    const isNew = !currentRows.some((r) => r.id === currentDraft.id);
    const hasData =
      currentDraft.centreClr ||
      currentDraft.inside50CAFC ||
      currentDraft.inside50Oppo ||
      currentDraft.uncontestedPos ||
      currentDraft.fieldClrCAFC ||
      currentDraft.fieldClrOppo;
    return isNew && hasData ? [...currentRows, currentDraft] : currentRows;
  };

  const handleFieldChange = (field, value) => {
    if (gameOver) return;
    let updated = { ...draft, [field]: value };
    // When O is selected for Field Clr CAFC, auto-increment the Oppo counter
    if (field === "fieldClrCAFC" && value === "O") {
      updated = { ...updated, fieldClrOppo: draft.fieldClrOppo + 1 };
    }
    const committed = rows.some((r) => r.id === draft.id);
    if (committed) {
      push({
        rows: rows.map((r) => (r.id === draft.id ? updated : r)),
        draft: updated,
        qtrCount,
        gameOver,
      });
    } else {
      const withScore = {
        ...updated,
        cafcG: parseInt(score.cafcG) || 0,
        cafcB: parseInt(score.cafcB) || 0,
        oppoG: parseInt(score.oppoG) || 0,
        oppoB: parseInt(score.oppoB) || 0,
      };
      push({
        rows: [...rows, withScore],
        draft: emptyRow(),
        qtrCount,
        gameOver,
      });
      showToast("Entry recorded");
    }
  };

  const selectRow = (row) => {
    if (row.type !== "entry" || gameOver) return;
    const isNew = !rows.some((r) => r.id === draft.id);
    const hasData =
      draft.centreClr ||
      draft.inside50CAFC ||
      draft.inside50Oppo ||
      draft.uncontestedPos ||
      draft.fieldClrCAFC ||
      draft.fieldClrOppo;
    const base = isNew && hasData ? [...rows, draft] : rows;
    push({ rows: base, draft: { ...row }, qtrCount, gameOver });
    if (isNew && hasData) showToast("Entry recorded");
  };

  const deleteRow = (id) => {
    const next = rows.filter((r) => r.id !== id);
    push({
      rows: next,
      draft: draft.id === id ? emptyRow() : draft,
      qtrCount,
      gameOver,
    });
    showToast("Entry deleted");
  };

  const handleEndQtr = () => {
    if (gameOver) return;
    const base = withCommittedDraft(rows, draft);
    const lastQtrIdx = base.map((r) => r.type).lastIndexOf("qtr-subtotal");
    const entriesSince = base
      .slice(lastQtrIdx + 1)
      .filter((r) => r.type === "entry");
    if (!entriesSince.length) {
      showToast("No entries to close");
      return;
    }
    const sub = {
      id: Date.now() + Math.random(),
      type: "qtr-subtotal",
      label: `Q${qtrCount}`,
      ...sumSinceLastQtr(base),
      centreClr: "",
      fieldClrCAFC: "",
    };
    push({
      rows: [...base, sub],
      draft: emptyRow(),
      qtrCount: qtrCount + 1,
      gameOver,
    });
    showToast(`Q${qtrCount} subtotal saved`);
  };

  const handleEndGame = () => {
    if (gameOver) {
      setShowSummary(true);
      return;
    }
    // Commit pending draft
    let base = withCommittedDraft(rows, draft);
    // Close any trailing entries as a final quarter subtotal
    const lastQtrIdx = base.map((r) => r.type).lastIndexOf("qtr-subtotal");
    const entriesSince = base
      .slice(lastQtrIdx + 1)
      .filter((r) => r.type === "entry");
    if (entriesSince.length) {
      const sub = {
        id: Date.now() + Math.random(),
        type: "qtr-subtotal",
        label: `Q${qtrCount}`,
        ...sumSinceLastQtr(base),
        centreClr: "",
        fieldClrCAFC: "",
      };
      base = [...base, sub];
    }
    push({
      rows: base,
      draft: emptyRow(),
      qtrCount: qtrCount + (entriesSince.length ? 1 : 0),
      gameOver: true,
    });
    setShowSummary(true);
    showToast("Game over — summary saved");
  };

  const handleSaveGame = () => {
    if (rows.filter((r) => r.type === "entry").length === 0) {
      showToast("No entries to save");
      return;
    }
    const oppLabel = opposition.trim() || "Unknown";
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const divider = "─".repeat(52);

    const lines = [
      "CAFC MATCH REPORT",
      divider,
      `Opposition : ${oppLabel}`,
      `Date       : ${dateStr}  ${timeStr}`,
      divider,
    ];

    let qtr = 1;
    let entryNum = 0;
    rows.forEach((r) => {
      if (r.type === "qtr-subtotal") {
        lines.push("");
        lines.push(`  ${r.label} SUBTOTAL`);
        lines.push(`  Centre Clr X    : ${r.centreClrX}`);
        lines.push(`  Centre Clr O    : ${r.centreClrO}`);
        lines.push(`  I50 CAFC        : ${r.inside50CAFC}`);
        lines.push(`  I50 Oppo        : ${r.inside50Oppo}`);
        lines.push(`  Uncontested     : ${r.uncontestedPos}`);
        lines.push(`  Def Turnovers   : ${r.defTurnovers}`);
        lines.push(`  Off Turnovers   : ${r.offTurnovers}`);
        lines.push(`  Field Clr CAFC X: ${r.fieldClrCAFCX ?? ""}`);
        lines.push(`  Field Clr Oppo  : ${r.fieldClrOppo}`);
        lines.push(`  ${divider.slice(0, 40)}`);
        qtr++;
        return;
      }
      entryNum++;
      lines.push(
        `#${entryNum} [Q${qtr}]  CC:${r.centreClr || "–"}  FC:${
          r.fieldClrCAFC || "–"
        }  FCO:${r.fieldClrOppo}  I50C:${r.inside50CAFC}  I50O:${
          r.inside50Oppo
        }  UP:${r.uncontestedPos}  DT:${r.defTurnovers}  OT:${r.offTurnovers}`
      );
    });

    lines.push("");
    lines.push(divider);
    lines.push("MATCH TOTALS");
    lines.push(`  Centre Clr X    : ${grandTotal.centreClrX}`);
    lines.push(`  Centre Clr O    : ${grandTotal.centreClrO}`);
    lines.push(`  I50 CAFC        : ${grandTotal.inside50CAFC}`);
    lines.push(`  I50 Oppo        : ${grandTotal.inside50Oppo}`);
    lines.push(`  Uncontested     : ${grandTotal.uncontestedPos}`);
    lines.push(`  Def Turnovers   : ${grandTotal.defTurnovers}`);
    lines.push(`  Off Turnovers   : ${grandTotal.offTurnovers}`);
    lines.push(`  Field Clr Oppo  : ${grandTotal.fieldClrOppo}`);
    lines.push(divider);

    const content = lines.join("\n");
    const filename = `CAFC_vs_${oppLabel.replace(/\s+/g, "_")}_${now
      .toISOString()
      .slice(0, 10)}.csv`;
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(content);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Game report saved");
  };

  const handleUndo = () => {
    undo();
    showToast("Undone");
  };

  const handleOffTurnover = (type) => {
    if (gameOver) return;
    const typeKey = `offTurn${type}`;
    const updated = {
      ...draft,
      offTurnovers: 1,
      offTurnType: type,
      offTurnD: type === "D" ? 1 : 0,
      offTurnC: type === "C" ? 1 : 0,
      offTurnF: type === "F" ? 1 : 0,
    };
    const withScore = {
      ...updated,
      cafcG: parseInt(score.cafcG) || 0,
      cafcB: parseInt(score.cafcB) || 0,
      oppoG: parseInt(score.oppoG) || 0,
      oppoB: parseInt(score.oppoB) || 0,
    };
    push({ rows: [...rows, withScore], draft: emptyRow(), qtrCount, gameOver });
    showToast("Entry recorded");
  };

  // These must be declared before handlers that reference them
  const qtrSubtotals = rows.filter((r) => r.type === "qtr-subtotal");
  const grandTotal = sumEntries(rows);
  const lastQtrIdx = rows.map((r) => r.type).lastIndexOf("qtr-subtotal");
  const rt = sumEntries(rows.slice(lastQtrIdx + 1));

  const handleExport = () => {
    if (rows.filter((r) => r.type === "entry").length === 0) {
      showToast("No entries to export");
      return;
    }
    const headers = [
      "#",
      "Quarter",
      "Centre Clr",
      "Centre Clr X Count",
      "Centre Clr O Count",
      "Field Clr CAFC",
      "Field Clr Oppo",
      "I50 CAFC",
      "I50 Oppo",
      "Uncontested Poss",
      "Def Turnovers",
      "Off Turnovers",
    ];
    let qtr = 1;
    let entryNum = 0;
    const dataRows = rows
      .map((r) => {
        if (r.type === "qtr-subtotal") {
          qtr++;
          return null;
        }
        entryNum++;
        return [
          entryNum,
          `Q${qtr}`,
          r.centreClr,
          r.centreClr === "X" ? 1 : 0,
          r.centreClr === "O" ? 1 : 0,
          r.fieldClrCAFC,
          r.fieldClrOppo,
          r.inside50CAFC,
          r.inside50Oppo,
          r.uncontestedPos,
          r.defTurnovers,
          r.offTurnovers,
        ].join(",");
      })
      .filter(Boolean);
    const subRows = rows
      .filter((r) => r.type === "qtr-subtotal")
      .map((r) =>
        [
          "",
          r.label + " Subtotal",
          "",
          r.centreClrX,
          r.centreClrO,
          "",
          r.fieldClrOppo,
          r.inside50CAFC,
          r.inside50Oppo,
          r.uncontestedPos,
          r.defTurnovers,
          r.offTurnovers,
        ].join(",")
      );
    const totalRow = [
      "",
      "TOTAL",
      "",
      grandTotal.centreClrX,
      grandTotal.centreClrO,
      "",
      grandTotal.fieldClrOppo,
      grandTotal.inside50CAFC,
      grandTotal.inside50Oppo,
      grandTotal.uncontestedPos,
      grandTotal.defTurnovers,
      grandTotal.offTurnovers,
    ].join(",");
    const oppLabel = opposition.trim() || "Unknown";
    const csv = [
      `Opposition: ${oppLabel}`,
      "",
      headers.join(","),
      ...dataRows,
      "",
      ...subRows,
      "",
      totalRow,
    ].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(csv);
    a.download = `cafc_stats_vs_${oppLabel.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Exported to text file");
  };

  const annotated = (() => {
    let q = 1;
    return rows.map((r) => {
      const out = { ...r, _q: q };
      if (r.type === "qtr-subtotal") q++;
      return out;
    });
  })();
  let entryCounter = 0;

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logoMark}>▶</div>
          <div>
            <div style={S.title}>CAFC Stats Entry</div>
            <div style={S.subtitle}>Match Statistical Records</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={S.rowCount}>
            {rows.filter((r) => r.type === "entry").length} entries
          </span>
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            style={{
              ...S.undoBtn,
              opacity: canUndo ? 1 : 0.35,
              cursor: canUndo ? "pointer" : "default",
            }}
          >
            ↩ Undo
          </button>
          {!gameOver && (
            <button onClick={handleEndQtr} style={S.endQtrBtn}>
              End Qtr
            </button>
          )}
          <button
            onClick={handleEndGame}
            style={gameOver ? S.viewSummaryBtn : S.endGameBtn}
          >
            {gameOver ? "View Summary" : "End Game"}
          </button>
          <button onClick={handleExport} style={S.exportBtn}>
            ⬇ Export
          </button>
        </div>
      </div>

      {/* Opposition input */}
      <div style={S.oppBar}>
        <label style={S.oppLabel} htmlFor="opposition">
          Opposition
        </label>
        <input
          id="opposition"
          type="text"
          value={opposition}
          onChange={(e) => setOpposition(e.target.value)}
          placeholder="Enter opposition team name…"
          style={S.oppInput}
        />
      </div>

      {/* Score Card */}
      <div style={S.scoreCard}>
        <table style={S.scoreTable}>
          <thead>
            <tr>
              <th style={S.scoreTh}>Team</th>
              <th style={S.scoreTh}>G</th>
              <th style={S.scoreTh}>B</th>
              <th style={S.scoreTh}>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.scoreTeamTd}>CAFC</td>
              <td style={S.scoreTotalTd}>{parseInt(score.cafcG) || 0}</td>
              <td style={S.scoreTotalTd}>{parseInt(score.cafcB) || 0}</td>
              <td style={S.scoreTotalTd}>
                {calcScore(score.cafcG, score.cafcB)}
              </td>
            </tr>
            <tr>
              <td style={S.scoreTeamTd}>Oppo</td>
              <td style={S.scoreTd}>
                <input
                  type="number"
                  min="0"
                  value={score.oppoG}
                  onChange={(e) =>
                    setScore((s) => ({ ...s, oppoG: e.target.value }))
                  }
                  style={{ ...S.scoreInput, width: "6ch" }}
                />
              </td>
              <td style={S.scoreTd}>
                <input
                  type="number"
                  min="0"
                  value={score.oppoB}
                  onChange={(e) =>
                    setScore((s) => ({ ...s, oppoB: e.target.value }))
                  }
                  style={{ ...S.scoreInput, width: "6ch" }}
                />
              </td>
              <td style={S.scoreTotalTd}>
                {calcScore(score.oppoG, score.oppoB)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Entry panel — disabled when game is over */}
      <div
        style={{
          ...S.entryPanel,
          opacity: gameOver ? 0.4 : 1,
          pointerEvents: gameOver ? "none" : "auto",
        }}
      >
        <div style={S.entryHeader}>
          <span style={S.entryLabel}>
            {gameOver
              ? "Game Over"
              : rows.some((r) => r.id === draft.id)
              ? `Editing Entry — Q${qtrCount}`
              : `New Entry — Q${qtrCount}`}
            {!gameOver && rows.some((r) => r.id === draft.id) && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 10,
                  color: "#2a9a6a",
                  background: "#0a2a1e",
                  padding: "1px 6px",
                  borderRadius: 4,
                }}
              >
                SAVED
              </span>
            )}
          </span>
          <div style={S.xorLegend}>
            {["X", "O", "R"].map((v) => (
              <span
                key={v}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: XOR_COLORS[v].active,
                  }}
                />
                <span style={{ color: "#6a8aaa", fontSize: 11 }}>{v}</span>
              </span>
            ))}
          </div>
        </div>
        {/* Goal Entry */}
        <div style={{ padding: "12px 16px 0" }}>
          {[
            { label: "CAFC", gKey: "cafcG", bKey: "cafcB" },
            { label: "Oppo", gKey: "oppoG", bKey: "oppoB" },
          ].map((row) => (
            <div key={row.label} style={S.goalRow}>
              <span style={S.goalLabel}>{row.label}</span>
              <button
                onClick={() =>
                  setScore((s) => ({
                    ...s,
                    [row.gKey]: (parseInt(s[row.gKey]) || 0) + 1,
                  }))
                }
                style={S.goalBtn}
              >
                G
              </button>
              <button
                onClick={() =>
                  setScore((s) => ({
                    ...s,
                    [row.bKey]: (parseInt(s[row.bKey]) || 0) + 1,
                  }))
                }
                style={S.behindBtn}
              >
                B
              </button>
            </div>
          ))}
        </div>

        <div style={S.fields}>
          <FieldGroup
            label="Centre Clearances"
            accent="#1a5a8a"
            runningTotal={
              <>
                <RT value={rt.centreClrX} color="#1a3a5c" />
                <span
                  style={{ fontSize: 9, color: "#2a4a5a", margin: "0 2px" }}
                >
                  X
                </span>
                <RT value={rt.centreClrO} color="#5c1a1a" />
                <span
                  style={{ fontSize: 9, color: "#2a4a5a", margin: "0 2px" }}
                >
                  O
                </span>
              </>
            }
          >
            <div style={S.xorRow}>
              {XOR_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleFieldChange("centreClr", opt)}
                  style={{
                    ...S.xorLarge,
                    background:
                      draft.centreClr === opt
                        ? XOR_COLORS[opt].active
                        : "#0a1825",
                    color: draft.centreClr === opt ? "#fff" : "#3a5a7a",
                    border:
                      draft.centreClr === opt
                        ? "2px solid transparent"
                        : "2px solid #1a2e40",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </FieldGroup>
          <FieldGroup
            label="Field Clearances"
            accent="#3a1a5a"
            runningTotal={
              <>
                <RT value={rt.fieldClrCAFCX} color="#1a4a1a" />
                <span
                  style={{ fontSize: 9, color: "#2a4a5a", margin: "0 2px" }}
                >
                  X
                </span>
                <RT value={rt.fieldClrCAFCO} color="#4a1a1a" />
                <span
                  style={{ fontSize: 9, color: "#2a4a5a", margin: "0 2px" }}
                >
                  O
                </span>
              </>
            }
          >
            <div style={S.counterPair}>
              <div style={S.counterItem}>
                <div style={S.xorRow}>
                  {XOR_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleFieldChange("fieldClrCAFC", opt)}
                      style={{
                        ...S.xorLarge,
                        background:
                          draft.fieldClrCAFC === opt
                            ? XOR_COLORS[opt].active
                            : "#0a1825",
                        color: draft.fieldClrCAFC === opt ? "#fff" : "#3a5a7a",
                        border:
                          draft.fieldClrCAFC === opt
                            ? "2px solid transparent"
                            : "2px solid #1a2e40",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </FieldGroup>
          <FieldGroup
            label="Inside 50s"
            accent="#0e4a6a"
            runningTotal={
              <>
                <RT value={rt.inside50CAFC} color="#0d2a45" />
                <span
                  style={{ fontSize: 9, color: "#2a4a5a", margin: "0 2px" }}
                >
                  C
                </span>
                <RT value={rt.inside50Oppo} color="#2a0d0d" />
                <span
                  style={{ fontSize: 9, color: "#2a4a5a", margin: "0 2px" }}
                >
                  O
                </span>
              </>
            }
          >
            <div style={S.counterPair}>
              <div style={S.counterItem}>
                <div style={teamTag("#1a3a5c", "#7ab3d9")}>CAFC</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      minWidth: 30,
                      textAlign: "center",
                      fontFamily: "monospace",
                      fontSize: 15,
                      fontWeight: 700,
                      color: draft.inside50CAFC > 0 ? "#e8f0ff" : "#4a5a6a",
                    }}
                  >
                    {draft.inside50CAFC}
                  </span>
                  <button
                    onClick={() =>
                      handleFieldChange("inside50CAFC", draft.inside50CAFC + 1)
                    }
                    style={cbs}
                  >
                    +
                  </button>
                </div>
              </div>
              <div style={S.counterDivider} />
              <div style={S.counterItem}>
                <div style={teamTag("#2a1a1a", "#d97a7a")}>OPP</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      minWidth: 30,
                      textAlign: "center",
                      fontFamily: "monospace",
                      fontSize: 15,
                      fontWeight: 700,
                      color: draft.inside50Oppo > 0 ? "#e8f0ff" : "#4a5a6a",
                    }}
                  >
                    {draft.inside50Oppo}
                  </span>
                  <button
                    onClick={() =>
                      handleFieldChange("inside50Oppo", draft.inside50Oppo + 1)
                    }
                    style={cbs}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </FieldGroup>
          <FieldGroup
            label="Uncontested Possessions"
            accent="#1a4a3a"
            runningTotal={<RT value={rt.uncontestedPos} color="#0d2a1e" />}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span
                style={{
                  minWidth: 30,
                  textAlign: "center",
                  fontFamily: "monospace",
                  fontSize: 15,
                  fontWeight: 700,
                  color: draft.uncontestedPos > 0 ? "#e8f0ff" : "#4a5a6a",
                }}
              >
                {draft.uncontestedPos}
              </span>
              <button
                onClick={() =>
                  handleFieldChange("uncontestedPos", draft.uncontestedPos + 1)
                }
                style={cbs}
              >
                +
              </button>
            </div>
          </FieldGroup>
          <FieldGroup
            label="Defensive Turnovers"
            accent="#2a4a1a"
            runningTotal={<RT value={rt.defTurnovers} color="#1a2a0d" />}
          >
            <Counter
              value={draft.defTurnovers}
              onChange={(v) => handleFieldChange("defTurnovers", v)}
            />
          </FieldGroup>
          <FieldGroup
            label="Offensive Turnovers"
            accent="#4a2a1a"
            runningTotal={<RT value={rt.offTurnovers} color="#2a1a0d" />}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {[
                ["D", "#1a2a4a", "#7ab3d9"],
                ["C", "#2a1a4a", "#b87af5"],
                ["F", "#4a2a1a", "#f5a07a"],
              ].map(([label, bg, color]) => (
                <button
                  key={label}
                  onClick={() => handleOffTurnover(label)}
                  style={{
                    width: 48,
                    height: 40,
                    borderRadius: 7,
                    background: bg,
                    border: `2px solid ${color}`,
                    color,
                    fontFamily: "monospace",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: 1,
                  }}
                >
                  {label}
                </button>
              ))}
              <span
                style={{
                  minWidth: 30,
                  textAlign: "center",
                  fontFamily: "monospace",
                  fontSize: 15,
                  fontWeight: 700,
                  color: draft.offTurnovers > 0 ? "#e8f0ff" : "#4a5a6a",
                }}
              >
                {draft.offTurnovers}
              </span>
            </div>
          </FieldGroup>
        </div>
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: 36 }}>#</th>
              <th style={S.th}>CC (X)</th>
              <th style={S.th}>CC (O)</th>
              <th style={S.th}>I50 CAFC</th>
              <th style={S.th}>I50 Oppo</th>
              <th style={S.th}>Uncontest. Poss.</th>
              <th style={S.th}>Def Turnovers</th>
              <th style={S.th}>Off Turnovers</th>
              <th style={S.th}>Fld Clr CAFC</th>
              <th style={S.th}>Fld Clr Oppo</th>
              <th style={S.th}>CAFC G</th>
              <th style={S.th}>CAFC B</th>
              <th style={S.th}>Oppo G</th>
              <th style={S.th}>Oppo B</th>
              <th style={{ ...S.th, width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={15}
                  style={{
                    ...S.td,
                    textAlign: "center",
                    color: "#2a4a6a",
                    padding: "24px",
                    fontSize: 13,
                  }}
                >
                  Select any field above to record your first entry
                </td>
              </tr>
            )}
            {annotated.map((row, idx) => {
              if (row.type === "qtr-subtotal") {
                return (
                  <tr key={row.id} style={{ background: "#071e30" }}>
                    <td colSpan={15} style={{ padding: 0 }}>
                      <div style={S.qtrBanner}>
                        <div style={S.qtrBannerLeft}>
                          <span style={S.qtrBadge}>{row.label}</span>
                          <span style={S.qtrBannerLabel}>Quarter Subtotal</span>
                        </div>
                        <div style={S.qtrBannerStats}>
                          <span style={S.qtrStat}>
                            <span style={S.qtrStatLabel}>CC (X)</span>
                            <NumBadge
                              value={row.centreClrX}
                              color="#1a3a5c"
                              bright
                            />
                          </span>
                          <span style={S.qtrStat}>
                            <span style={S.qtrStatLabel}>CC (O)</span>
                            <NumBadge
                              value={row.centreClrO}
                              color="#5c1a1a"
                              bright
                            />
                          </span>
                          <span style={S.qtrStat}>
                            <span style={S.qtrStatLabel}>I50 CAFC</span>
                            <NumBadge
                              value={row.inside50CAFC}
                              color="#0d2a45"
                              bright
                            />
                          </span>
                          <span style={S.qtrStat}>
                            <span style={S.qtrStatLabel}>I50 Opp</span>
                            <NumBadge
                              value={row.inside50Oppo}
                              color="#2a0d0d"
                              bright
                            />
                          </span>
                          <span style={S.qtrStat}>
                            <span style={S.qtrStatLabel}>UP</span>
                            <NumBadge
                              value={row.uncontestedPos}
                              color="#0d2a1e"
                              bright
                            />
                          </span>
                          <span style={S.qtrStat}>
                            <span style={S.qtrStatLabel}>Def TO</span>
                            <NumBadge
                              value={row.defTurnovers}
                              color="#1a2a0d"
                              bright
                            />
                          </span>
                          <span style={S.qtrStat}>
                            <span style={S.qtrStatLabel}>Off TO</span>
                            <NumBadge
                              value={row.offTurnovers}
                              color="#2a1a0d"
                              bright
                            />
                          </span>
                          <span style={S.qtrStat}>
                            <span style={S.qtrStatLabel}>FC Opp</span>
                            <NumBadge
                              value={row.fieldClrOppo}
                              color="#2a0d0d"
                              bright
                            />
                          </span>
                        </div>
                        {!gameOver && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRow(row.id);
                            }}
                            style={{ ...S.rowDelete, opacity: 0.5 }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }
              entryCounter++;
              const n = entryCounter;
              return (
                <tr
                  key={row.id}
                  onClick={() => selectRow(row)}
                  style={{
                    ...S.tr,
                    background:
                      draft.id === row.id
                        ? "#0d2035"
                        : idx % 2 === 0
                        ? "#071422"
                        : "#0a1a28",
                    outline: draft.id === row.id ? "1px solid #1a4a7a" : "none",
                    cursor: gameOver ? "default" : "pointer",
                  }}
                >
                  <td style={{ ...S.td, color: "#3a5a7a", fontSize: 12 }}>
                    {n}
                  </td>
                  <td style={S.td}>
                    {row.centreClr === "X" ? (
                      <XORBadge value="X" />
                    ) : (
                      <span style={{ color: "#2a3a4a" }}>–</span>
                    )}
                  </td>
                  <td style={S.td}>
                    {row.centreClr === "O" ? (
                      <XORBadge value="O" />
                    ) : (
                      <span style={{ color: "#2a3a4a" }}>–</span>
                    )}
                  </td>
                  <td style={S.td}>
                    <NumBadge value={row.inside50CAFC} color="#1a3a5c" />
                  </td>
                  <td style={S.td}>
                    <NumBadge value={row.inside50Oppo} color="#3a1a1a" />
                  </td>
                  <td style={S.td}>
                    <NumBadge value={row.uncontestedPos} color="#1a3a2a" />
                  </td>
                  <td style={S.td}>
                    <NumBadge value={row.defTurnovers} color="#1a2a0d" />
                  </td>
                  <td style={S.td}>
                    {row.offTurnType ? (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "1px 8px",
                          borderRadius: 4,
                          background:
                            row.offTurnType === "D"
                              ? "#1a2a4a"
                              : row.offTurnType === "C"
                              ? "#2a1a4a"
                              : "#4a2a1a",
                          color:
                            row.offTurnType === "D"
                              ? "#7ab3d9"
                              : row.offTurnType === "C"
                              ? "#b87af5"
                              : "#f5a07a",
                          fontFamily: "monospace",
                          fontSize: 13,
                          fontWeight: 800,
                        }}
                      >
                        {row.offTurnType}
                      </span>
                    ) : (
                      <span style={{ color: "#2a3a4a" }}>–</span>
                    )}
                  </td>
                  <td style={S.td}>
                    <NumBadge
                      value={row.fieldClrCAFC === "X" ? 1 : 0}
                      color="#1a4a1a"
                    />
                  </td>
                  <td style={S.td}>
                    <NumBadge
                      value={row.fieldClrCAFC === "O" ? 1 : 0}
                      color="#4a1a1a"
                    />
                  </td>
                  <td style={S.td}>
                    <NumBadge value={row.cafcG} color="#1a3a1a" />
                  </td>
                  <td style={S.td}>
                    <NumBadge value={row.cafcB} color="#1a1a3a" />
                  </td>
                  <td style={S.td}>
                    <NumBadge value={row.oppoG} color="#3a1a1a" />
                  </td>
                  <td style={S.td}>
                    <NumBadge value={row.oppoB} color="#2a1a2a" />
                  </td>
                  <td style={S.td}>
                    {!gameOver && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRow(row.id);
                        }}
                        style={S.rowDelete}
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.filter((r) => r.type === "entry").length > 0 && (
              <tr
                style={{
                  background: "#091828",
                  borderTop: "2px solid #0d3050",
                }}
              >
                <td
                  style={{
                    ...S.td,
                    color: "#2a5a8a",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  TOTAL
                </td>
                <td style={S.td}>
                  <NumBadge
                    value={grandTotal.centreClrX}
                    color="#1a3a5c"
                    bright
                  />
                </td>
                <td style={S.td}>
                  <NumBadge
                    value={grandTotal.centreClrO}
                    color="#5c1a1a"
                    bright
                  />
                </td>
                <td style={S.td}>
                  <NumBadge
                    value={grandTotal.inside50CAFC}
                    color="#0d2a45"
                    bright
                  />
                </td>
                <td style={S.td}>
                  <NumBadge
                    value={grandTotal.inside50Oppo}
                    color="#2a0d0d"
                    bright
                  />
                </td>
                <td style={S.td}>
                  <NumBadge
                    value={grandTotal.uncontestedPos}
                    color="#0d2a1e"
                    bright
                  />
                </td>
                <td style={S.td}>
                  <NumBadge
                    value={grandTotal.defTurnovers}
                    color="#1a2a0d"
                    bright
                  />
                </td>
                <td style={S.td}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: "#1a2a4a",
                        color: "#7ab3d9",
                        fontFamily: "monospace",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      D{grandTotal.offTurnD}
                    </span>
                    <span
                      style={{
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: "#2a1a4a",
                        color: "#b87af5",
                        fontFamily: "monospace",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      C{grandTotal.offTurnC}
                    </span>
                    <span
                      style={{
                        padding: "1px 5px",
                        borderRadius: 4,
                        background: "#4a2a1a",
                        color: "#f5a07a",
                        fontFamily: "monospace",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      F{grandTotal.offTurnF}
                    </span>
                  </div>
                </td>
                <td style={S.td}>
                  <NumBadge
                    value={grandTotal.fieldClrCAFCX}
                    color="#1a4a1a"
                    bright
                  />
                </td>
                <td style={S.td}>
                  <NumBadge
                    value={grandTotal.fieldClrCAFCO}
                    color="#4a1a1a"
                    bright
                  />
                </td>
                <td style={S.td} />
                <td style={S.td} />
                <td style={S.td} />
                <td style={S.td} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showSummary && (
        <GameSummary
          qtrs={qtrSubtotals}
          grandTotal={grandTotal}
          onDismiss={() => setShowSummary(false)}
        />
      )}

      {/* Save Game button */}
      <div
        style={{
          margin: "20px 16px 0",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button onClick={handleSaveGame} style={S.saveGameBtn}>
          💾 Save Game Report
        </button>
      </div>

      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root: {
    minHeight: "100vh",
    background: "#050f1a",
    color: "#c8dff0",
    fontFamily: "'Inter','Segoe UI',sans-serif",
    padding: "0 0 40px",
  },
  header: {
    background: "#071422",
    borderBottom: "1px solid #0d2035",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerInner: { display: "flex", alignItems: "center", gap: 12 },
  logoMark: {
    width: 36,
    height: 36,
    background: "#1a3a6a",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "#7ab3d9",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#e8f4ff",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: "#3a6a9a",
    marginTop: 1,
    letterSpacing: 0.5,
  },
  rowCount: { fontSize: 12, color: "#3a6a9a" },
  undoBtn: {
    padding: "6px 13px",
    borderRadius: 6,
    background: "#0d1e2e",
    border: "1px solid #2a4a6a",
    color: "#7ab3d9",
    fontSize: 13,
    fontWeight: 600,
  },
  endQtrBtn: {
    padding: "6px 14px",
    borderRadius: 6,
    background: "#1a1a3a",
    border: "1px solid #3a3a7a",
    color: "#aab8f5",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 0.5,
  },
  endGameBtn: {
    padding: "6px 14px",
    borderRadius: 6,
    background: "#2a0d0d",
    border: "1px solid #6a1a1a",
    color: "#f5aab8",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 0.5,
  },
  viewSummaryBtn: {
    padding: "6px 14px",
    borderRadius: 6,
    background: "#1a3a0d",
    border: "1px solid #3a6a1a",
    color: "#aaf5b8",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 0.5,
  },
  exportBtn: {
    padding: "6px 14px",
    borderRadius: 6,
    background: "#1a2a3a",
    border: "1px solid #2a4a5a",
    color: "#8acce0",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 0.5,
  },
  oppBar: {
    margin: "16px 16px 0",
    display: "flex",
    alignItems: "center",
    gap: 12,
    background: "#071422",
    border: "1px solid #0d2035",
    borderRadius: 10,
    padding: "10px 16px",
  },
  oppLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#4a7aaa",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  oppInput: {
    flex: 1,
    background: "#0a1a27",
    border: "1px solid #1a3a5a",
    borderRadius: 6,
    padding: "7px 12px",
    color: "#e8f4ff",
    fontSize: 14,
    fontFamily: "'Inter','Segoe UI',sans-serif",
    outline: "none",
  },
  saveGameBtn: {
    width: "100%",
    padding: "14px",
    borderRadius: 10,
    background: "#0d2a45",
    border: "2px solid #1a5a8a",
    color: "#7ab3d9",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  goalPanel: {
    margin: "16px 16px 0",
    background: "#071422",
    border: "1px solid #0d2035",
    borderRadius: 10,
    overflow: "hidden",
  },
  goalRow: {
    display: "flex",
    alignItems: "center",
    padding: "10px 16px",
    borderBottom: "1px solid #0a1e30",
    gap: 12,
  },
  goalLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: 700,
    color: "#7ab3d9",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  goalBtn: {
    padding: "8px 28px",
    borderRadius: 7,
    background: "#1a4a1a",
    border: "2px solid #22c55e",
    color: "#a0f0a0",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: 1,
  },
  behindBtn: {
    padding: "8px 28px",
    borderRadius: 7,
    background: "#1a1a3a",
    border: "2px solid #4a4aaa",
    color: "#aab8f5",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: 1,
  },
  scoreCard: {
    margin: "12px 16px 0",
    background: "#071422",
    border: "1px solid #0d2035",
    borderRadius: 10,
    overflow: "hidden",
  },
  scoreTable: { width: "100%", borderCollapse: "collapse" },
  scoreTh: {
    padding: "8px 20px",
    textAlign: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "#3a6a9a",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    background: "#050f1a",
    borderBottom: "1px solid #0d2035",
  },
  scoreTd: {
    padding: "6px 16px",
    textAlign: "center",
    borderBottom: "1px solid #0a1e30",
    background: "#0a1a27",
  },
  scoreTeamTd: {
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: "#7ab3d9",
    letterSpacing: 1,
    textTransform: "uppercase",
    borderBottom: "1px solid #0a1e30",
    background: "#0a1a27",
  },
  scoreTotalTd: {
    padding: "6px 20px",
    textAlign: "center",
    fontFamily: "monospace",
    fontSize: 16,
    fontWeight: 800,
    color: "#e8f4ff",
    borderBottom: "1px solid #0a1e30",
    background: "#0a1a27",
  },
  scoreInput: {
    width: "4ch",
    padding: "4px 6px",
    background: "#0a1a27",
    border: "1px solid #1a3a5a",
    borderRadius: 5,
    color: "#e8f4ff",
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: 700,
    textAlign: "center",
    outline: "none",
  },
  entryPanel: {
    margin: "16px",
    background: "#071422",
    border: "1px solid #0d2035",
    borderRadius: 10,
    overflow: "hidden",
    transition: "opacity 0.3s",
  },
  entryHeader: {
    padding: "10px 16px",
    borderBottom: "1px solid #0d2035",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#4a7aaa",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  xorLegend: { display: "flex", gap: 10, alignItems: "center" },
  fields: {
    padding: 16,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  xorRow: { display: "flex", gap: 8 },
  xorLarge: {
    width: 48,
    height: 40,
    borderRadius: 7,
    fontFamily: "monospace",
    fontSize: 15,
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: 1,
    transition: "all 0.1s",
  },
  counterPair: { display: "flex", alignItems: "center", gap: 12 },
  counterDivider: { width: 1, height: 36, background: "#1a2e40" },
  counterItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  tableWrap: {
    margin: "0 16px",
    border: "1px solid #0d2035",
    borderRadius: 8,
    overflow: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    padding: "10px 12px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 700,
    color: "#3a6a9a",
    letterSpacing: 1,
    textTransform: "uppercase",
    background: "#071422",
    borderBottom: "1px solid #0d2035",
    whiteSpace: "nowrap",
  },
  tr: { transition: "background 0.1s" },
  td: {
    padding: "9px 12px",
    borderBottom: "1px solid #0a1e30",
    whiteSpace: "nowrap",
  },
  rowDelete: {
    background: "transparent",
    border: "none",
    color: "#2a4a5a",
    cursor: "pointer",
    fontSize: 13,
    padding: "2px 4px",
    borderRadius: 4,
  },
  qtrBanner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 12px",
    background: "linear-gradient(90deg,#0d1e3a 0%,#071422 100%)",
    borderTop: "1px solid #1a3a6a",
    borderBottom: "1px solid #1a3a6a",
  },
  qtrBannerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 100,
  },
  qtrBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 5,
    background: "#1a3a7a",
    color: "#aac8f5",
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
  },
  qtrBannerLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#3a6a9a",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  qtrBannerStats: { display: "flex", gap: 12, flex: 1, flexWrap: "wrap" },
  qtrStat: { display: "flex", alignItems: "center", gap: 5 },
  qtrStatLabel: {
    fontSize: 10,
    color: "#3a5a7a",
    fontWeight: 600,
    letterSpacing: 0.5,
  },
};
