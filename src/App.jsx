import { useState, useEffect } from "react";

// ── PALETA CELEX ──────────────────────────────────────────────
const C = {
  ink:        "#1a1a2e",
  inkLight:   "#3d3d5c",
  violet:     "#5b4d8a",
  violetMid:  "#7b6daa",
  violetPale: "#ede9f7",
  gold:       "#c9a84c",
  goldLight:  "#f0e2b6",
  teal:       "#2d7a7a",
  tealPale:   "#e0f2f2",
  coral:      "#c25b3f",
  coralPale:  "#faeae6",
  surface:    "#f7f6f2",
  white:      "#ffffff",
  border:     "#e0ddd5",
};

const TEACHERS = [
  "Rodríguez Fernández Alejandro",
  "Arcocha Sotomayor Claudia",
  "Ortiz Vargas Claudia",
  "Mota Blanco Edgar",
  "Atenco Martínez Javier",
  "Rosas de la Llave Karina",
  "Andrade Parra Martha Irene",
  "Ruiz González Miguel Ángel",
  "Alarcón Morales Samantha",
  "Vega Rosas Luis Johany",
  "Diaz Felipe Victor Octavio",
  "Álvarez Torres Yuliana",
  "Flores Monroy Bruno",
  "Martínez Arenalde Cesar",
  "Aburto Morales Montserrat",
  "Sánchez Garfias Mayanit",
  "Yañez Torres Maria Flor",
  "Pablo García",
  "Rivera González Rosalba",
  "Vazquez Díaz Janis",
  "Zurita Juarez Araceli",
  "De La Cruz Del Valle Oscar Ivan",
  "Guzmán Osorio José Antonio",
  "Jiménez Flores Vanessa",
  "Rugerio Ochoa Alejandro Carlos",
  "Medel Osorio Gabriel",
  "Merino Castañeda Jessica",
  "Ramirez Hernández Miriam Andrea",
  "Pineda Jacinto Jessica",
  "Herrera Quiroz Lariza",
];

const LEVELS = ["I", "II", "III", "IV", "V", "VI"];

const STEPS = [
  { key: "warmup",      label: "1 — Warm up",                        time: "10 mins." },
  { key: "context",     label: "2 — Presentation, vocabulary & context", time: "10–15 mins." },
  { key: "grammar",     label: "3 — Applied Grammar",                time: "10–15 mins." },
  { key: "simulation",  label: "4 — Simulation practice",            time: "20–30 mins." },
  { key: "decision",    label: "5 — Decision making",                time: "10–15 mins." },
  { key: "results",     label: "6 — Results",                        time: "10 mins." },
];

const EMPTY_PLAN = {
  id: "",
  teacher: "",
  level: "",
  topic: "",
  objective: "",
  classGroup: "",
  date: "",
  steps: { warmup:"", context:"", grammar:"", simulation:"", decision:"", results:"" },
  goals: { warmup:"", context:"", grammar:"", simulation:"", decision:"", results:"" },
};

// ── STORAGE KEY ───────────────────────────────────────────────
const STORAGE_KEY = "celex_lesson_plans_v1";

function loadPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePlans(plans) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(plans)); } catch {}
}

// ── GOOGLE SHEETS EXPORT ──────────────────────────────────────
// Instrucciones para configurar el webhook en Google Sheets:
// 1. Abre Google Sheets → Extensiones → Apps Script
// 2. Pega el código del doPost() que aparece al final de este archivo
// 3. Implementa como aplicación web → cualquier usuario puede acceder
// 4. Copia la URL del webhook y pégala en SHEETS_WEBHOOK_URL abajo
const SHEETS_WEBHOOK_URL = "TU_URL_DE_APPS_SCRIPT_AQUI";

async function sendToSheets(plan) {
  if (SHEETS_WEBHOOK_URL === "TU_URL_DE_APPS_SCRIPT_AQUI") return { ok: false, msg: "Webhook no configurado" };
  try {
    await fetch(SHEETS_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: plan.id,
        teacher: plan.teacher,
        level: plan.level,
        topic: plan.topic,
        objective: plan.objective,
        classGroup: plan.classGroup,
        date: plan.date,
        warmup_desc: plan.steps.warmup,
        warmup_goal: plan.goals.warmup,
        context_desc: plan.steps.context,
        context_goal: plan.goals.context,
        grammar_desc: plan.steps.grammar,
        grammar_goal: plan.goals.grammar,
        simulation_desc: plan.steps.simulation,
        simulation_goal: plan.goals.simulation,
        decision_desc: plan.steps.decision,
        decision_goal: plan.goals.decision,
        results_desc: plan.steps.results,
        results_goal: plan.goals.results,
        timestamp: new Date().toISOString(),
      }),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

// ── COMPONENTES UI ────────────────────────────────────────────
function Badge({ children, color = C.violet, bg = C.violetPale }) {
  return (
    <span style={{ background: bg, color, borderRadius: 40, padding: "3px 12px",
      fontSize: ".75rem", fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function LevelBadge({ level }) {
  const colors = {
    "I":   [C.teal,   C.tealPale],
    "II":  [C.violet, C.violetPale],
    "III": ["#6b4a00", C.goldLight],
    "IV":  [C.coral,  C.coralPale],
    "V":   ["#2d5c7a","#e0f0f8"],
    "VI":  ["#5a2d82","#f3e8ff"],
  };
  const [c, bg] = colors[level] || [C.violet, C.violetPale];
  return <Badge color={c} bg={bg}>Nivel {level}</Badge>;
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.white, borderRadius: 12,
      boxShadow: "0 2px 8px rgba(26,26,46,.08)", padding: "24px 28px",
      marginBottom: 20, ...style }}>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, required, type = "text" }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: ".82rem", fontWeight: 700,
        color: C.violet, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>
        {label}{required && <span style={{ color: C.coral }}> *</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`,
          borderRadius: 8, fontFamily: "inherit", fontSize: ".92rem", color: C.ink,
          background: C.white, boxSizing: "border-box", outline: "none" }} />
    </div>
  );
}

function Select({ label, value, onChange, options, placeholder, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: ".82rem", fontWeight: 700,
        color: C.violet, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".05em" }}>
        {label}{required && <span style={{ color: C.coral }}> *</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`,
          borderRadius: 8, fontFamily: "inherit", fontSize: ".92rem", color: value ? C.ink : "#999",
          background: C.white, boxSizing: "border-box", cursor: "pointer" }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, hint }) {
  return (
    <div style={{ marginBottom: 0 }}>
      {label && <label style={{ display: "block", fontSize: ".78rem", fontWeight: 700,
        color: C.inkLight, marginBottom: 4 }}>{label}</label>}
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={3}
        style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${C.border}`,
          borderRadius: 8, fontFamily: "inherit", fontSize: ".88rem", color: C.ink,
          background: C.surface, resize: "vertical", boxSizing: "border-box", outline: "none" }} />
      {hint && <p style={{ fontSize: ".75rem", color: C.inkLight, margin: "3px 0 0" }}>{hint}</p>}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", small = false, disabled = false }) {
  const styles = {
    primary:  { background: `linear-gradient(135deg,${C.violet},${C.violetMid})`, color: C.white, border: "none" },
    gold:     { background: `linear-gradient(135deg,${C.gold},#e0c068)`, color: C.ink, border: "none" },
    outline:  { background: "transparent", color: C.violet, border: `1.5px solid ${C.violet}` },
    danger:   { background: "transparent", color: C.coral, border: `1.5px solid ${C.coral}` },
    teal:     { background: `linear-gradient(135deg,${C.teal},#3d9090)`, color: C.white, border: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...styles[variant], padding: small ? "6px 16px" : "10px 24px",
        borderRadius: 40, fontSize: small ? ".8rem" : ".88rem", fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit",
        opacity: disabled ? .5 : 1, transition: "opacity .2s" }}>
      {children}
    </button>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 18px" }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: ".75rem", fontWeight: 700, letterSpacing: ".1em",
        textTransform: "uppercase", color: C.gold, background: C.white,
        padding: "3px 12px", border: `1px solid ${C.goldLight}`, borderRadius: 40 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

// ── VISTA: FORMULARIO ─────────────────────────────────────────
function FormView({ onSave, editPlan }) {
  const [plan, setPlan] = useState(editPlan || { ...EMPTY_PLAN, id: Date.now().toString() });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const set = (field, val) => setPlan(p => ({ ...p, [field]: val }));
  const setStep = (key, val) => setPlan(p => ({ ...p, steps: { ...p.steps, [key]: val } }));
  const setGoal = (key, val) => setPlan(p => ({ ...p, goals: { ...p.goals, [key]: val } }));

  const isValid = plan.teacher && plan.level && plan.topic && plan.objective;

  async function handleSave() {
    if (!isValid) { setToast({ type: "error", msg: "Completa los campos obligatorios marcados con *" }); return; }
    setSaving(true);
    const result = await sendToSheets(plan);
    onSave(plan);
    setToast({
      type: "success",
      msg: result.ok
        ? "✅ Planeación guardada en la app y enviada a Google Sheets."
        : "✅ Planeación guardada en la app. " + (SHEETS_WEBHOOK_URL === "TU_URL_DE_APPS_SCRIPT_AQUI"
            ? "Configura el webhook para sincronizar con Google Sheets."
            : "No se pudo conectar con Google Sheets — revisa el webhook."),
    });
    setSaving(false);
  }

  return (
    <div>
      {/* toast */}
      {toast && (
        <div onClick={() => setToast(null)} style={{
          padding: "12px 18px", borderRadius: 8, marginBottom: 18, cursor: "pointer",
          background: toast.type === "success" ? C.tealPale : C.coralPale,
          borderLeft: `4px solid ${toast.type === "success" ? C.teal : C.coral}`,
          color: toast.type === "success" ? C.teal : C.coral, fontWeight: 600, fontSize: ".9rem" }}>
          {toast.msg} <span style={{ float: "right", opacity: .5 }}>✕</span>
        </div>
      )}

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: C.violetPale,
            color: C.violet, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>📋</div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: C.ink }}>
            {editPlan ? "Editar planeación" : "Nueva planeación"}
          </h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
          <Select label="Docente" value={plan.teacher} onChange={v => set("teacher", v)}
            options={TEACHERS} placeholder="— Selecciona —" required />
          <Select label="Nivel" value={plan.level} onChange={v => set("level", v)}
            options={LEVELS.map(l => `Nivel ${l}`)} placeholder="— Selecciona —" required />
          <Input label="Clase / Grupo" value={plan.classGroup} onChange={v => set("classGroup", v)}
            placeholder="Ej. A · Lunes 8am" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Input label="Tema" value={plan.topic} onChange={v => set("topic", v)}
            placeholder="Ej. Passive Voice — Present" required />
          <Input label="Fecha" value={plan.date} onChange={v => set("date", v)}
            type="date" />
        </div>

        <Textarea label="Objetivo de la sesión *" value={plan.objective}
          onChange={v => set("objective", v)}
          placeholder="Ej. Dar importancia al receptor de una acción usando voz pasiva en presente..."
          hint="Describe qué habilidad comunicativa desarrollarán los estudiantes al finalizar la sesión." />
      </Card>

      <Divider label="Pasos de la sesión (90 min)" />

      {STEPS.map(step => (
        <div key={step.key} style={{ background: C.white, borderRadius: 12,
          boxShadow: "0 2px 8px rgba(26,26,46,.08)", marginBottom: 14, overflow: "hidden" }}>
          {/* header del paso */}
          <div style={{ background: `linear-gradient(135deg,${C.ink} 0%,${C.violet} 100%)`,
            padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: ".88rem", fontWeight: 700, color: C.white }}>{step.label}</span>
            <span style={{ background: "rgba(201,168,76,.25)", color: C.gold,
              border: `1px solid rgba(201,168,76,.4)`, borderRadius: 40,
              padding: "2px 10px", fontSize: ".72rem", fontWeight: 700 }}>{step.time}</span>
          </div>
          <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Textarea label="Descripción de la actividad"
              value={plan.steps[step.key]} onChange={v => setStep(step.key, v)}
              placeholder="¿Qué harán los estudiantes en este paso?" />
            <Textarea label="Objetivo, interacción y recursos"
              value={plan.goals[step.key]} onChange={v => setGoal(step.key, v)}
              placeholder="Ej. S-S · Vocabulario clave · Tarjetas de rol" />
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
        <Btn onClick={handleSave} disabled={saving} variant="primary">
          {saving ? "Guardando…" : "💾 Guardar planeación"}
        </Btn>
        <Btn onClick={() => onSave(null)} variant="outline">Cancelar</Btn>
      </div>
    </div>
  );
}

// ── VISTA: DETALLE DE PLANEACIÓN ──────────────────────────────
function DetailView({ plan, onBack, onEdit, onDelete }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <Btn onClick={onBack} variant="outline" small>← Volver</Btn>
        <Btn onClick={onEdit} variant="primary" small>✏️ Editar</Btn>
        <Btn onClick={onDelete} variant="danger" small>🗑 Eliminar</Btn>
      </div>

      {/* encabezado */}
      <div style={{ background: `linear-gradient(135deg,${C.ink} 0%,${C.violet} 100%)`,
        borderRadius: 16, padding: "28px 32px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .04,
          backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div style={{ height: 3, width: 48, background: `linear-gradient(90deg,${C.gold},${C.goldLight})`,
          borderRadius: 2, marginBottom: 16 }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <LevelBadge level={plan.level.replace("Nivel ","")} />
          {plan.classGroup && <Badge color={C.inkLight} bg="rgba(255,255,255,.12)">{plan.classGroup}</Badge>}
          {plan.date && <Badge color={C.gold} bg="rgba(201,168,76,.18)">{plan.date}</Badge>}
        </div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: C.white, margin: "0 0 6px" }}>{plan.topic}</h2>
        <p style={{ fontSize: ".9rem", color: "rgba(255,255,255,.7)", margin: "0 0 12px" }}>
          👩‍🏫 {plan.teacher}
        </p>
        <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 8, padding: "12px 16px" }}>
          <p style={{ fontSize: ".82rem", fontWeight: 700, color: C.gold, margin: "0 0 4px",
            textTransform: "uppercase", letterSpacing: ".06em" }}>Objetivo</p>
          <p style={{ fontSize: ".92rem", color: "rgba(255,255,255,.88)", margin: 0 }}>{plan.objective}</p>
        </div>
      </div>

      {/* pasos */}
      {STEPS.map(step => (
        <div key={step.key} style={{ background: C.white, borderRadius: 12,
          boxShadow: "0 2px 8px rgba(26,26,46,.08)", marginBottom: 14, overflow: "hidden" }}>
          <div style={{ background: `linear-gradient(135deg,${C.ink} 0%,${C.violet} 100%)`,
            padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: ".88rem", fontWeight: 700, color: C.white }}>{step.label}</span>
            <span style={{ background: "rgba(201,168,76,.25)", color: C.gold,
              border: `1px solid rgba(201,168,76,.4)`, borderRadius: 40,
              padding: "2px 10px", fontSize: ".72rem", fontWeight: 700 }}>{step.time}</span>
          </div>
          <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <p style={{ fontSize: ".75rem", fontWeight: 700, color: C.violet,
                textTransform: "uppercase", margin: "0 0 6px" }}>Descripción</p>
              <p style={{ fontSize: ".9rem", color: plan.steps[step.key] ? C.inkLight : "#bbb",
                margin: 0, fontStyle: plan.steps[step.key] ? "normal" : "italic" }}>
                {plan.steps[step.key] || "Sin descripción"}
              </p>
            </div>
            <div style={{ borderLeft: `2px solid ${C.goldLight}`, paddingLeft: 16 }}>
              <p style={{ fontSize: ".75rem", fontWeight: 700, color: "#6b4a00",
                textTransform: "uppercase", margin: "0 0 6px" }}>Objetivo / Interacción / Recursos</p>
              <p style={{ fontSize: ".9rem", color: plan.goals[step.key] ? C.inkLight : "#bbb",
                margin: 0, fontStyle: plan.goals[step.key] ? "normal" : "italic" }}>
                {plan.goals[step.key] || "Sin datos"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── VISTA: BIBLIOTECA ─────────────────────────────────────────
function LibraryView({ plans, onNew, onSelect }) {
  const [filterLevel, setFilterLevel] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");
  const [search, setSearch] = useState("");

  const filtered = plans.filter(p => {
    const lvl = !filterLevel || p.level === filterLevel;
    const tch = !filterTeacher || p.teacher === filterTeacher;
    const srch = !search || p.topic.toLowerCase().includes(search.toLowerCase())
      || p.teacher.toLowerCase().includes(search.toLowerCase())
      || p.objective.toLowerCase().includes(search.toLowerCase());
    return lvl && tch && srch;
  });

  return (
    <div>
      {/* filtros */}
      <Card style={{ padding: "18px 22px", marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: ".78rem", fontWeight: 700, color: C.violet,
              textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 4 }}>
              🔍 Buscar
            </label>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tema, docente u objetivo..."
              style={{ width: "100%", padding: "8px 11px", border: `1.5px solid ${C.border}`,
                borderRadius: 8, fontFamily: "inherit", fontSize: ".88rem", color: C.ink,
                boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: ".78rem", fontWeight: 700, color: C.violet,
              textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 4 }}>
              Nivel
            </label>
            <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
              style={{ width: "100%", padding: "8px 11px", border: `1.5px solid ${C.border}`,
                borderRadius: 8, fontFamily: "inherit", fontSize: ".88rem", color: C.ink }}>
              <option value="">Todos los niveles</option>
              {LEVELS.map(l => <option key={l} value={`Nivel ${l}`}>Nivel {l}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: ".78rem", fontWeight: 700, color: C.violet,
              textTransform: "uppercase", letterSpacing: ".05em", display: "block", marginBottom: 4 }}>
              Docente
            </label>
            <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
              style={{ width: "100%", padding: "8px 11px", border: `1.5px solid ${C.border}`,
                borderRadius: 8, fontFamily: "inherit", fontSize: ".88rem", color: C.ink }}>
              <option value="">Todos los docentes</option>
              {TEACHERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 20px", color: C.inkLight }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>📂</div>
          <p style={{ fontWeight: 700, fontSize: "1rem", color: C.ink, marginBottom: 6 }}>
            {plans.length === 0 ? "Aún no hay planeaciones guardadas" : "No hay resultados para este filtro"}
          </p>
          <p style={{ fontSize: ".88rem" }}>
            {plans.length === 0 ? "Sé el primero en agregar una planeación." : "Intenta con otros filtros."}
          </p>
          {plans.length === 0 && (
            <div style={{ marginTop: 16 }}>
              <Btn onClick={onNew} variant="primary">+ Nueva planeación</Btn>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {filtered.map(plan => (
            <div key={plan.id} onClick={() => onSelect(plan)}
              style={{ background: C.white, borderRadius: 12, overflow: "hidden", cursor: "pointer",
                boxShadow: "0 2px 8px rgba(26,26,46,.08)", border: `1.5px solid ${C.border}`,
                transition: "transform .15s, box-shadow .15s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(26,26,46,.14)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(26,26,46,.08)"; }}>
              {/* color bar */}
              <div style={{ height: 4, background: `linear-gradient(90deg,${C.violet},${C.gold})` }} />
              <div style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                  <LevelBadge level={plan.level.replace("Nivel ","")} />
                  {plan.date && <Badge color={C.inkLight} bg={C.surface}>{plan.date}</Badge>}
                </div>
                <h4 style={{ fontSize: ".97rem", fontWeight: 800, color: C.ink, margin: "0 0 6px" }}>
                  {plan.topic || <span style={{ color: "#bbb", fontStyle: "italic" }}>Sin tema</span>}
                </h4>
                <p style={{ fontSize: ".82rem", color: C.inkLight, margin: "0 0 12px" }}>
                  👩‍🏫 {plan.teacher}
                </p>
                <p style={{ fontSize: ".82rem", color: C.inkLight, margin: 0,
                  overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical" }}>
                  {plan.objective || <span style={{ fontStyle: "italic" }}>Sin objetivo registrado</span>}
                </p>
              </div>
              <div style={{ padding: "10px 20px", borderTop: `1px solid ${C.border}`,
                background: C.surface, fontSize: ".75rem", color: C.inkLight }}>
                Ver planeación completa →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── APP PRINCIPAL ─────────────────────────────────────────────
export default function App() {
  const [plans, setPlans] = useState([]);
  const [view, setView] = useState("library"); // library | form | detail
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  useEffect(() => { setPlans(loadPlans()); }, []);

  function handleSave(plan) {
    if (!plan) { setView("library"); setEditing(null); return; }
    setPlans(prev => {
      const exists = prev.find(p => p.id === plan.id);
      const next = exists ? prev.map(p => p.id === plan.id ? plan : p) : [...prev, plan];
      savePlans(next);
      return next;
    });
    setView("library");
    setEditing(null);
  }

  function handleDelete(plan) {
    if (!window.confirm(`¿Eliminar la planeación "${plan.topic}"? Esta acción no se puede deshacer.`)) return;
    setPlans(prev => { const next = prev.filter(p => p.id !== plan.id); savePlans(next); return next; });
    setView("library");
    setSelected(null);
  }

  return (
    <div style={{ fontFamily: "'Helvetica Neue',Arial,sans-serif", background: C.surface,
      minHeight: "100vh", color: C.ink }}>

      {/* ── HEADER ── */}
      <div style={{ background: `linear-gradient(135deg,${C.ink} 0%,${C.violet} 100%)`,
        padding: "28px 32px 24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .04,
          backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "24px 24px" }} />
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".12em",
            textTransform: "uppercase", color: C.gold, margin: "0 0 6px" }}>
            Universidad del Valle de Puebla · CELEX
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: C.white, margin: "0 0 4px" }}>
                📚 Banco de Planeaciones SIS
              </h1>
              <p style={{ fontSize: ".88rem", color: "rgba(255,255,255,.7)", margin: 0 }}>
                Comparte y consulta planeaciones del Modelo SIS con todo el equipo docente.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {view !== "library" && (
                <Btn onClick={() => { setView("library"); setEditing(null); setSelected(null); }}
                  variant="outline" small>
                  ← Biblioteca
                </Btn>
              )}
              {view === "library" && (
                <Btn onClick={() => { setEditing(null); setView("form"); }} variant="gold" small>
                  + Nueva planeación
                </Btn>
              )}
            </div>
          </div>

          {/* stats */}
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            {[
              { label: "Planeaciones", val: plans.length },
              { label: "Docentes activos", val: [...new Set(plans.map(p => p.teacher))].length },
              { label: "Niveles cubiertos", val: [...new Set(plans.map(p => p.level))].length },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,.1)",
                border: "1px solid rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 16px" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: C.white }}>{s.val}</div>
                <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,.6)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── NAV TABS ── */}
      {view === "library" && (
        <div style={{ background: C.white, borderBottom: `2px solid ${C.gold}`,
          display: "flex", padding: "0 32px", overflowX: "auto" }}>
          {["Todas", ...LEVELS.map(l => `Nivel ${l}`)].map(tab => {
            const count = tab === "Todas" ? plans.length : plans.filter(p => p.level === tab).length;
            return (
              <button key={tab} style={{ padding: "14px 16px", border: "none", background: "transparent",
                fontSize: ".82rem", fontWeight: 600, color: C.inkLight, cursor: "pointer",
                borderBottom: `3px solid transparent`, whiteSpace: "nowrap", fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.color = C.violet}
                onMouseLeave={e => e.currentTarget.style.color = C.inkLight}>
                {tab} <span style={{ background: C.violetPale, color: C.violet, borderRadius: 40,
                  padding: "1px 7px", fontSize: ".72rem", marginLeft: 4 }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── CONTENIDO ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
        {view === "library" && (
          <LibraryView plans={plans} onNew={() => { setEditing(null); setView("form"); }}
            onSelect={p => { setSelected(p); setView("detail"); }} />
        )}
        {view === "form" && (
          <FormView onSave={handleSave} editPlan={editing} />
        )}
        {view === "detail" && selected && (
          <DetailView plan={selected}
            onBack={() => { setView("library"); setSelected(null); }}
            onEdit={() => { setEditing(selected); setView("form"); }}
            onDelete={() => handleDelete(selected)} />
        )}
      </div>

      {/* ── FOOTER CONFIG SHEETS ── */}
      {SHEETS_WEBHOOK_URL === "TU_URL_DE_APPS_SCRIPT_AQUI" && (
        <div style={{ background: C.goldLight, borderTop: `3px solid ${C.gold}`,
          padding: "14px 32px", textAlign: "center" }}>
          <p style={{ fontSize: ".82rem", color: "#6b4a00", margin: 0, fontWeight: 600 }}>
            ⚙️ <strong>Configura Google Sheets:</strong> Reemplaza <code>TU_URL_DE_APPS_SCRIPT_AQUI</code> en el código con la URL de tu Apps Script webhook para sincronizar planeaciones con Drive.
            {" "}<a href="#instrucciones-sheets" style={{ color: C.violet }}>Ver instrucciones ↓</a>
          </p>
        </div>
      )}

      {/* ── INSTRUCCIONES GOOGLE SHEETS ── */}
      <div id="instrucciones-sheets" style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 48px" }}>
        <Divider label="Configurar Google Sheets" />
        <Card style={{ background: C.violetPale, border: `1.5px solid ${C.violetMid}` }}>
          <h4 style={{ fontWeight: 700, color: C.violet, margin: "0 0 12px" }}>
            📊 Conectar con Google Drive en 5 pasos
          </h4>
          <ol style={{ paddingLeft: 20, color: C.inkLight, fontSize: ".9rem", lineHeight: 2 }}>
            <li>Abre <strong>Google Sheets</strong> → crea una hoja nueva llamada <em>"Planeaciones SIS"</em></li>
            <li>Ve a <strong>Extensiones → Apps Script</strong></li>
            <li>Borra el código por defecto y pega el código <code>doPost()</code> que se muestra abajo</li>
            <li>Haz clic en <strong>Implementar → Nueva implementación → Aplicación web</strong> → Acceso: <em>Cualquier usuario</em> → Implementar → Copia la URL</li>
            <li>Reemplaza <code>TU_URL_DE_APPS_SCRIPT_AQUI</code> en el código de esta app por esa URL</li>
          </ol>
          <div style={{ background: C.ink, borderRadius: 8, padding: "16px 18px", marginTop: 12, overflowX: "auto" }}>
            <pre style={{ color: "#c9a84c", fontSize: ".78rem", margin: 0, lineHeight: 1.7 }}>{`function doPost(e) {
  var sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("Planeaciones SIS")
    || SpreadsheetApp.getActiveSpreadsheet()
       .insertSheet("Planeaciones SIS");

  var data = JSON.parse(e.postData.contents);

  // Encabezados si la hoja está vacía
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "ID","Docente","Nivel","Tema","Objetivo",
      "Grupo","Fecha",
      "Warm-up Desc","Warm-up Goal",
      "Context Desc","Context Goal",
      "Grammar Desc","Grammar Goal",
      "Simulation Desc","Simulation Goal",
      "Decision Desc","Decision Goal",
      "Results Desc","Results Goal",
      "Timestamp"
    ]);
  }

  sheet.appendRow([
    data.id, data.teacher, data.level,
    data.topic, data.objective, data.classGroup,
    data.date,
    data.warmup_desc, data.warmup_goal,
    data.context_desc, data.context_goal,
    data.grammar_desc, data.grammar_goal,
    data.simulation_desc, data.simulation_goal,
    data.decision_desc, data.decision_goal,
    data.results_desc, data.results_goal,
    data.timestamp
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({status:"ok"}))
    .setMimeType(ContentService.MimeType.JSON);
}`}</pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
