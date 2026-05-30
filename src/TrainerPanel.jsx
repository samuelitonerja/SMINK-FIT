import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

// ── Helpers ─────────────────────────────────────────────────
const S = { // Estilos base
  bg: "#08090c", bg1: "#0d0e12", bg2: "#12131a", bg3: "#18181c",
  border: "#1e1f2a", border2: "#252635",
  text: "#eeeef2", text2: "#6a6a80", text3: "#303042",
  accent: "#c8fb6e", blue: "#5b9cf6",
};

const card = { background:S.bg2, border:`1px solid ${S.border}`, borderRadius:14, padding:"16px" };
const inp = { width:"100%", padding:"12px 14px", borderRadius:10, border:`1px solid ${S.border}`, background:S.bg1, color:S.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit", marginBottom:10 };
const Label = ({t}) => <div style={{color:S.text3,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6}}>{t}</div>;
const Err = ({m}) => m ? <div style={{background:"rgba(255,68,68,0.08)",border:"1px solid rgba(255,68,68,0.2)",borderRadius:8,padding:"10px 12px",color:"#ff8080",fontSize:13,marginBottom:12,lineHeight:1.5}}>{m}</div> : null;
const Ok = ({m}) => m ? <div style={{background:"rgba(200,251,110,0.08)",border:"1px solid rgba(200,251,110,0.2)",borderRadius:8,padding:"10px 12px",color:S.accent,fontSize:13,marginBottom:12}}>{m}</div> : null;
const Btn = ({label,onClick,loading,color=S.accent,outline=false}) => (
  <button onClick={onClick} disabled={loading} style={{padding:"12px 18px",borderRadius:10,border:`1px solid ${outline?S.border2:"transparent"}`,background:outline?"transparent":color,color:outline?S.text2:S.bg,fontWeight:700,fontSize:14,cursor:"pointer",opacity:loading?0.6:1}}>
    {loading?"...":label}
  </button>
);

function fmtDate(iso) {
  if(!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"});
}

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "ST-";
  for(let i=0;i<5;i++) code += chars[Math.floor(Math.random()*chars.length)];
  return code;
}

// ── HEADER ──────────────────────────────────────────────────
function Header({ trainerName, tab, setTab, onLogout }) {
  const tabs = [
    { id:"athletes", label:"Atletas" },
    { id:"invites", label:"Invitaciones" },
  ];
  return (
    <div style={{ background:S.bg1, borderBottom:`1px solid ${S.border}`, position:"sticky", top:0, zIndex:100 }}>
      <div style={{ padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ color:S.text3, fontSize:9, fontWeight:700, letterSpacing:3, textTransform:"uppercase" }}>SMINK TRAIN</div>
          <div style={{ color:S.text, fontWeight:800, fontSize:16, letterSpacing:0.3 }}>Panel Entrenador</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ color:S.text2, fontSize:13 }}>{trainerName}</div>
          <button onClick={onLogout} style={{ background:"none", border:`1px solid ${S.border2}`, borderRadius:8, color:S.text3, padding:"6px 12px", fontSize:12, cursor:"pointer" }}>Salir</button>
        </div>
      </div>
      <div style={{ display:"flex", padding:"0 18px", gap:4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"10px 16px", background:"none", border:"none", borderBottom:`2px solid ${tab===t.id?S.accent:"transparent"}`, color:tab===t.id?S.accent:S.text3, fontWeight:700, fontSize:13, cursor:"pointer", transition:"all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── LISTA DE ATLETAS ─────────────────────────────────────────
function AthletesList({ trainerId, onSelect }) {
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAthletes(); }, []);

  const loadAthletes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("trainer_athletes")
      .select("athlete_id, profiles!trainer_athletes_athlete_id_fkey(id,name,email,weight,height,age,sex,goal,role)")
      .eq("trainer_id", trainerId);
    setAthletes((data||[]).map(r => r.profiles).filter(Boolean));
    setLoading(false);
  };

  if(loading) return <div style={{color:S.text3,textAlign:"center",padding:40,fontSize:13}}>Cargando atletas...</div>;

  if(!athletes.length) return (
    <div style={{textAlign:"center",padding:"48px 24px"}}>
      <div style={{color:S.text3,fontSize:13,lineHeight:1.8}}>No tienes atletas todavía.<br/>Crea una invitación para que se unan.</div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {athletes.map(a => (
        <button key={a.id} onClick={()=>onSelect(a)}
          style={{...card,border:`1px solid ${S.border}`,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,width:"100%"}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:S.bg3,border:`1px solid ${S.border2}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,color:S.text2,flexShrink:0}}>
            {(a.name||"?")[0].toUpperCase()}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:S.text,fontWeight:700,fontSize:15,marginBottom:2}}>{a.name||"Sin nombre"}</div>
            <div style={{color:S.text3,fontSize:12}}>{a.email}</div>
            {(a.weight||a.goal) && (
              <div style={{display:"flex",gap:10,marginTop:4}}>
                {a.weight && <span style={{color:S.text2,fontSize:11}}>{a.weight} kg</span>}
                {a.goal && <span style={{color:S.text2,fontSize:11}}>· {a.goal.replace("_"," ")}</span>}
              </div>
            )}
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={S.text3} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      ))}
    </div>
  );
}

// ── PERFIL DEL ATLETA ────────────────────────────────────────
function AthleteProfile({ athlete, trainerId, onBack }) {
  const [tab, setTab] = useState("info");
  const [preferences, setPreferences] = useState(null);

  useEffect(() => {
    supabase.from("nutrition_history").select("data").eq("user_id",athlete.id).eq("date_key","preferences").maybeSingle()
      .then(({data}) => { if(data) setPreferences(data.data); });
  }, [athlete.id]);

  const goalLabels = { perder_grasa:"Perder grasa", ganar_musculo:"Ganar músculo", rendimiento:"Rendimiento deportivo", salud:"Salud general", definicion:"Definición" };

  return (
    <div>
      {/* Header atleta */}
      <div style={{padding:"16px 18px",borderBottom:`1px solid ${S.border}`,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:S.accent,fontSize:14,fontWeight:700,cursor:"pointer",padding:0}}>← Atrás</button>
        <div style={{width:40,height:40,borderRadius:"50%",background:S.bg3,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,color:S.text2}}>
          {(athlete.name||"?")[0].toUpperCase()}
        </div>
        <div>
          <div style={{color:S.text,fontWeight:800,fontSize:16}}>{athlete.name}</div>
          <div style={{color:S.text3,fontSize:12}}>{athlete.email}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",padding:"0 18px",gap:4,borderBottom:`1px solid ${S.border}`,background:S.bg1}}>
        {[["info","Info"],["routine","Rutina"],["nutrition","Nutrición"]].map(([id,label]) => (
          <button key={id} onClick={()=>setTab(id)} style={{padding:"10px 14px",background:"none",border:"none",borderBottom:`2px solid ${tab===id?S.accent:"transparent"}`,color:tab===id?S.accent:S.text3,fontWeight:700,fontSize:13,cursor:"pointer"}}>
            {label}
          </button>
        ))}
      </div>

      <div style={{padding:"18px"}}>
        {/* INFO */}
        {tab==="info" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Datos físicos */}
            <div style={card}>
              <div style={{color:S.text3,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Datos físicos</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["Peso",athlete.weight?""+athlete.weight+" kg":"—"],["Altura",athlete.height?""+athlete.height+" cm":"—"],["Edad",athlete.age?""+athlete.age+" años":"—"],["Sexo",athlete.sex||"—"]].map(([k,v])=>(
                  <div key={k}>
                    <div style={{color:S.text3,fontSize:11,marginBottom:2}}>{k}</div>
                    <div style={{color:S.text,fontWeight:700,fontSize:15}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Objetivo */}
            <div style={card}>
              <div style={{color:S.text3,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:8}}>Objetivo</div>
              <div style={{color:S.accent,fontWeight:700,fontSize:15}}>{goalLabels[athlete.goal]||athlete.goal||"—"}</div>
            </div>
            {/* Preferencias */}
            {preferences && (
              <div style={card}>
                <div style={{color:S.text3,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Salud y alimentación</div>
                {[["Lesiones",preferences.injuries==="no"?"Ninguna":preferences.injuryDetails||preferences.injuries],["Dieta",preferences.diet],["No come",preferences.dislikes||"—"],["Alergias",preferences.allergies||"Ninguna"],["Sueño",preferences.sleepHours||"—"],["Días/semana",preferences.weeklyAvailability?""+preferences.weeklyAvailability+" días":"—"]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:8,marginBottom:8,borderBottom:`1px solid ${S.border}`}}>
                    <div style={{color:S.text2,fontSize:13}}>{k}</div>
                    <div style={{color:S.text,fontSize:13,fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v||"—"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RUTINA */}
        {tab==="routine" && <RoutineEditor athleteId={athlete.id} trainerId={trainerId} />}

        {/* NUTRICIÓN */}
        {tab==="nutrition" && <NutritionEditor athleteId={athlete.id} trainerId={trainerId} athleteData={athlete} preferences={preferences} />}
      </div>
    </div>
  );
}

// ── EDITOR DE RUTINA ─────────────────────────────────────────
const EXERCISE_DB = [
  // Pecho
  {id:"bench",name:"Press banca",group:"Pecho"},{id:"incline",name:"Press inclinado",group:"Pecho"},{id:"flyes",name:"Aperturas",group:"Pecho"},{id:"dips",name:"Fondos",group:"Pecho"},
  // Espalda
  {id:"pullup",name:"Dominadas",group:"Espalda"},{id:"row",name:"Remo con barra",group:"Espalda"},{id:"lat",name:"Jalón al pecho",group:"Espalda"},{id:"seated_row",name:"Remo en polea",group:"Espalda"},
  // Hombro
  {id:"ohp",name:"Press militar",group:"Hombro"},{id:"lateral",name:"Elevaciones laterales",group:"Hombro"},{id:"rear_delt",name:"Pájaro",group:"Hombro"},
  // Pierna
  {id:"squat",name:"Sentadilla",group:"Pierna"},{id:"rdl",name:"Peso muerto rumano",group:"Pierna"},{id:"leg_press",name:"Prensa",group:"Pierna"},{id:"lunge",name:"Zancadas",group:"Pierna"},{id:"leg_curl",name:"Curl femoral",group:"Pierna"},{id:"calf",name:"Gemelos",group:"Pierna"},
  // Bíceps
  {id:"curl_bar",name:"Curl con barra",group:"Bíceps"},{id:"curl_db",name:"Curl con mancuernas",group:"Bíceps"},{id:"hammer",name:"Curl martillo",group:"Bíceps"},
  // Tríceps
  {id:"pushdown",name:"Extensión en polea",group:"Tríceps"},{id:"skull",name:"Rompecráneos",group:"Tríceps"},{id:"dip_tri",name:"Fondos en banco",group:"Tríceps"},
  // Core
  {id:"plank",name:"Plancha",group:"Core"},{id:"crunch",name:"Crunch",group:"Core"},{id:"leg_raise",name:"Elevación de piernas",group:"Core"},
  // Cardio
  {id:"run",name:"Carrera",group:"Cardio"},{id:"bike",name:"Bicicleta",group:"Cardio"},{id:"row_cardio",name:"Remo ergómetro",group:"Cardio"},
];

const DAYS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

function RoutineEditor({ athleteId, trainerId }) {
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState("");
  const [addingTo, setAddingTo] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { loadRoutine(); }, [athleteId]);

  const loadRoutine = async () => {
    setLoading(true);
    const { data } = await supabase.from("assigned_routines").select("*").eq("athlete_id",athleteId).maybeSingle();
    if(data?.data) setRoutine(data.data);
    else setRoutine({ days: DAYS.map(d => ({ name:d, rest:d==="Domingo", exercises:[] })) });
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    await supabase.from("assigned_routines").upsert({ trainer_id:trainerId, athlete_id:athleteId, data:routine, updated_at:new Date().toISOString() },{ onConflict:"athlete_id" });
    setSaving(false); setOk("Rutina guardada"); setTimeout(()=>setOk(""),3000);
  };

  const toggleRest = (di) => {
    const r = {...routine}; r.days[di].rest = !r.days[di].rest; r.days[di].exercises = [];
    setRoutine(r);
  };

  const addExercise = (di, ex) => {
    const r = JSON.parse(JSON.stringify(routine));
    r.days[di].exercises.push({ id:ex.id, name:ex.name, group:ex.group, sets:3, reps:"8-12", rir:"2" });
    setRoutine(r); setAddingTo(null); setSearch("");
  };

  const removeExercise = (di, ei) => {
    const r = JSON.parse(JSON.stringify(routine));
    r.days[di].exercises.splice(ei,1); setRoutine(r);
  };

  const updateEx = (di, ei, field, value) => {
    const r = JSON.parse(JSON.stringify(routine));
    r.days[di].exercises[ei][field] = value; setRoutine(r);
  };

  const filtered = EXERCISE_DB.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.group.toLowerCase().includes(search.toLowerCase()));

  if(loading) return <div style={{color:S.text3,textAlign:"center",padding:30,fontSize:13}}>Cargando...</div>;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{color:S.text3,fontSize:11}}>Planifica la semana de tu atleta</div>
        <Btn label="Guardar" onClick={save} loading={saving} />
      </div>
      <Ok m={ok} />

      {routine.days.map((day,di) => (
        <div key={di} style={{...card,marginBottom:10}}>
          {/* Cabecera del día */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:day.rest?0:12}}>
            <div style={{color:day.rest?S.text3:S.text,fontWeight:700,fontSize:14}}>{day.name}</div>
            <button onClick={()=>toggleRest(di)} style={{background:day.rest?"transparent":`rgba(200,251,110,0.1)`,border:`1px solid ${day.rest?S.border2:S.accent}`,borderRadius:8,color:day.rest?S.text3:S.accent,fontSize:11,fontWeight:700,padding:"4px 10px",cursor:"pointer"}}>
              {day.rest?"Descanso":"Entreno"}
            </button>
          </div>

          {!day.rest && (
            <>
              {day.exercises.map((ex,ei) => (
                <div key={ei} style={{background:S.bg1,borderRadius:10,padding:"12px",marginBottom:8,border:`1px solid ${S.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div>
                      <div style={{color:S.text,fontWeight:600,fontSize:13}}>{ex.name}</div>
                      <div style={{color:S.text3,fontSize:11}}>{ex.group}</div>
                    </div>
                    <button onClick={()=>removeExercise(di,ei)} style={{background:"none",border:"none",color:S.text3,cursor:"pointer",fontSize:18,lineHeight:1}}>×</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    {[["sets","Series","3"],["reps","Reps","8-12"],["rir","RIR","2"]].map(([field,label,ph])=>(
                      <div key={field}>
                        <div style={{color:S.text3,fontSize:9,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{label}</div>
                        <input value={ex[field]} onChange={e=>updateEx(di,ei,field,e.target.value)} placeholder={ph}
                          style={{...inp,marginBottom:0,padding:"8px 10px",fontSize:13,textAlign:"center"}} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Añadir ejercicio */}
              {addingTo===di ? (
                <div style={{background:S.bg1,borderRadius:10,padding:"12px",border:`1px solid ${S.border}`}}>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar ejercicio..." autoFocus
                    style={{...inp,marginBottom:8}} />
                  <div style={{maxHeight:180,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
                    {filtered.slice(0,20).map(ex => (
                      <button key={ex.id} onClick={()=>addExercise(di,ex)}
                        style={{padding:"9px 12px",background:S.bg2,border:"none",borderRadius:8,color:S.text,fontSize:13,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
                        <span>{ex.name}</span>
                        <span style={{color:S.text3,fontSize:11}}>{ex.group}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={()=>{setAddingTo(null);setSearch("");}} style={{background:"none",border:"none",color:S.text3,fontSize:12,cursor:"pointer",marginTop:8}}>Cancelar</button>
                </div>
              ) : (
                <button onClick={()=>setAddingTo(di)} style={{width:"100%",padding:"10px",borderRadius:10,border:`1px dashed ${S.border2}`,background:"transparent",color:S.text3,fontSize:13,cursor:"pointer",marginTop:4}}>
                  + Añadir ejercicio
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ── EDITOR DE NUTRICIÓN ──────────────────────────────────────
function NutritionEditor({ athleteId, trainerId, athleteData, preferences }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState("");

  useEffect(() => { loadPlan(); }, [athleteId]);

  const loadPlan = async () => {
    setLoading(true);
    const { data } = await supabase.from("nutrition_plans").select("*").eq("athlete_id",athleteId).maybeSingle();
    if(data?.data) setPlan(data.data);
    else setPlan({ kcal:"", protein:"", carbs:"", fat:"", meals:[], notes:"" });
    setLoading(false);
  };

  const save = async () => {
    setSaving(true);
    await supabase.from("nutrition_plans").upsert({ trainer_id:trainerId, athlete_id:athleteId, data:plan, updated_at:new Date().toISOString() },{ onConflict:"athlete_id" });
    setSaving(false); setOk("Plan guardado"); setTimeout(()=>setOk(""),3000);
  };

  const set = (k,v) => setPlan(p=>({...p,[k]:v}));

  const addMeal = () => setPlan(p=>({...p, meals:[...(p.meals||[]), {name:"Comida",time:"",foods:"",kcal:""}]}));
  const removeMeal = (i) => setPlan(p=>({...p, meals:p.meals.filter((_,idx)=>idx!==i)}));
  const updateMeal = (i,k,v) => setPlan(p=>({ ...p, meals:p.meals.map((m,idx)=>idx===i?{...m,[k]:v}:m) }));

  if(loading) return <div style={{color:S.text3,textAlign:"center",padding:30,fontSize:13}}>Cargando...</div>;

  const dislikedFoods = preferences?.dislikes ? `Evitar: ${preferences.dislikes}` : null;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{color:S.text3,fontSize:11}}>Plan nutricional personalizado</div>
        <Btn label="Guardar" onClick={save} loading={saving} />
      </div>
      <Ok m={ok} />

      {dislikedFoods && (
        <div style={{background:"rgba(91,156,246,0.06)",border:`1px solid rgba(91,156,246,0.2)`,borderRadius:10,padding:"10px 12px",marginBottom:14}}>
          <div style={{color:S.blue,fontSize:12,lineHeight:1.5}}>{dislikedFoods}</div>
        </div>
      )}

      {/* Macros */}
      <div style={{...card,marginBottom:12}}>
        <div style={{color:S.text3,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Objetivos diarios</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[["kcal","Kcal objetivo","2200"],["protein","Proteína (g)","180"],["carbs","Carbohidratos (g)","250"],["fat","Grasas (g)","70"]].map(([k,l,ph])=>(
            <div key={k}>
              <Label t={l}/>
              <input type="number" value={plan[k]||""} onChange={e=>set(k,e.target.value)} placeholder={ph} style={{...inp,marginBottom:0}} />
            </div>
          ))}
        </div>
      </div>

      {/* Comidas */}
      <div style={{...card,marginBottom:12}}>
        <div style={{color:S.text3,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Comidas del día</div>
        {(plan.meals||[]).map((meal,i)=>(
          <div key={i} style={{background:S.bg1,borderRadius:10,padding:"12px",marginBottom:8,border:`1px solid ${S.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <input value={meal.name} onChange={e=>updateMeal(i,"name",e.target.value)} placeholder="Nombre (ej: Desayuno)" style={{...inp,marginBottom:0,flex:1,marginRight:8}} />
              <input value={meal.time} onChange={e=>updateMeal(i,"time",e.target.value)} placeholder="Hora" style={{...inp,marginBottom:0,width:70}} />
              <button onClick={()=>removeMeal(i)} style={{background:"none",border:"none",color:S.text3,cursor:"pointer",fontSize:20,marginLeft:8,lineHeight:1}}>×</button>
            </div>
            <textarea value={meal.foods} onChange={e=>updateMeal(i,"foods",e.target.value)} placeholder="Alimentos y cantidades (ej: Avena 80g, leche 200ml, plátano)" rows={2}
              style={{...inp,resize:"none",lineHeight:1.5,marginBottom:6}} />
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Label t="kcal aprox"/>
              <input type="number" value={meal.kcal} onChange={e=>updateMeal(i,"kcal",e.target.value)} placeholder="450" style={{...inp,marginBottom:0,width:80}} />
            </div>
          </div>
        ))}
        <button onClick={addMeal} style={{width:"100%",padding:"10px",borderRadius:10,border:`1px dashed ${S.border2}`,background:"transparent",color:S.text3,fontSize:13,cursor:"pointer"}}>
          + Añadir comida
        </button>
      </div>

      {/* Notas */}
      <div style={card}>
        <Label t="Notas para el atleta"/>
        <textarea value={plan.notes||""} onChange={e=>set("notes",e.target.value)} placeholder="Indicaciones, suplementación, hidratación, etc." rows={3}
          style={{...inp,resize:"none",lineHeight:1.5,marginBottom:0}} />
      </div>
    </div>
  );
}

// ── INVITACIONES ─────────────────────────────────────────────
function InvitesTab({ trainerId }) {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => { loadInvites(); }, []);

  const loadInvites = async () => {
    setLoading(true);
    const { data } = await supabase.from("athlete_invites").select("*").eq("trainer_id",trainerId).order("created_at",{ascending:false});
    setInvites(data||[]);
    setLoading(false);
  };

  const createInvite = async () => {
    setError("");
    if(!name.trim()){setError("Escribe el nombre del atleta.");return;}
    if(!email.includes("@")){setError("Correo no válido.");return;}
    setCreating(true);
    const code = genCode();
    const expires = new Date(); expires.setDate(expires.getDate()+7);
    const { error:e } = await supabase.from("athlete_invites").insert({
      trainer_id:trainerId, athlete_name:name.trim(), athlete_email:email.toLowerCase().trim(),
      code, expires_at:expires.toISOString()
    });
    if(e) setError(e.message);
    else { setOk(`Código creado: ${code}`); setName(""); setEmail(""); loadInvites(); setTimeout(()=>setOk(""),8000); }
    setCreating(false);
  };

  const revokeInvite = async (id) => {
    await supabase.from("athlete_invites").update({used:true}).eq("id",id);
    loadInvites();
  };

  const isExpired = (iso) => new Date(iso) < new Date();

  return (
    <div>
      {/* Crear invitación */}
      <div style={{...card,marginBottom:16}}>
        <div style={{color:S.text3,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:14}}>Nueva invitación</div>
        <Label t="Nombre del atleta"/>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nombre completo" style={inp} />
        <Label t="Correo del atleta"/>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="correo@ejemplo.com" style={inp} />
        <Err m={error}/><Ok m={ok}/>
        <Btn label="Generar código de invitación" onClick={createInvite} loading={creating} />
        <div style={{color:S.text3,fontSize:11,marginTop:10,lineHeight:1.6}}>El código será válido 7 días. Compártelo con tu atleta para que pueda registrarse.</div>
      </div>

      {/* Lista de invitaciones */}
      <div style={{color:S.text3,fontSize:10,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",marginBottom:12}}>Invitaciones enviadas</div>
      {loading ? <div style={{color:S.text3,textAlign:"center",padding:20,fontSize:13}}>Cargando...</div> :
        !invites.length ? <div style={{color:S.text3,textAlign:"center",padding:20,fontSize:13}}>No has enviado ninguna invitación todavía.</div> :
        invites.map(inv => {
          const expired = isExpired(inv.expires_at);
          const statusColor = inv.used?"#4caf50":expired?"#ff4444":S.accent;
          const statusLabel = inv.used?"Usado":expired?"Expirado":"Activo";
          return (
            <div key={inv.id} style={{...card,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{color:S.text,fontWeight:700,fontSize:14}}>{inv.athlete_name}</div>
                  <div style={{color:S.text3,fontSize:12,marginTop:2}}>{inv.athlete_email}</div>
                </div>
                <span style={{fontSize:10,fontWeight:700,color:statusColor,background:`${statusColor}15`,borderRadius:20,padding:"3px 10px",textTransform:"uppercase",letterSpacing:0.5}}>
                  {statusLabel}
                </span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontFamily:"monospace",fontSize:16,fontWeight:800,color:inv.used||expired?S.text3:S.accent,letterSpacing:2}}>{inv.code}</div>
                  <div style={{color:S.text3,fontSize:11,marginTop:2}}>Expira: {fmtDate(inv.expires_at)}</div>
                </div>
                {!inv.used && !expired && (
                  <button onClick={()=>revokeInvite(inv.id)} style={{background:"none",border:`1px solid ${S.border2}`,borderRadius:8,color:S.text3,fontSize:11,padding:"5px 10px",cursor:"pointer"}}>
                    Revocar
                  </button>
                )}
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────
export default function TrainerPanel({ session, onLogout }) {
  const [tab, setTab] = useState("athletes");
  const [selectedAthlete, setSelectedAthlete] = useState(null);
  const [trainerName, setTrainerName] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("name").eq("id",session.user.id).maybeSingle()
      .then(({data}) => { if(data?.name) setTrainerName(data.name); });
  }, [session.user.id]);

  return (
    <div style={{ minHeight:"100vh", background:S.bg, color:S.text, fontFamily:"system-ui,-apple-system,sans-serif" }}>
      {!selectedAthlete && (
        <Header trainerName={trainerName} tab={tab} setTab={setTab} onLogout={onLogout} />
      )}

      <div style={{ padding: selectedAthlete ? 0 : "18px", maxWidth:600, margin:"0 auto" }}>
        {selectedAthlete ? (
          <AthleteProfile athlete={selectedAthlete} trainerId={session.user.id} onBack={()=>setSelectedAthlete(null)} />
        ) : (
          <>
            {tab==="athletes" && <AthletesList trainerId={session.user.id} onSelect={setSelectedAthlete} />}
            {tab==="invites" && <InvitesTab trainerId={session.user.id} />}
          </>
        )}
      </div>
    </div>
  );
}
