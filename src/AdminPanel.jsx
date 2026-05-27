import { useState, useEffect } from "react";
import { supabase } from "./supabase.js";

// ═══════════════════════════════════════════════════════════
// SMINK FIT — Panel de Administración
// Solo accesible para cuentas con plan = 'admin'
// ═══════════════════════════════════════════════════════════

const PLANS = ["free", "premium", "lifetime", "admin"];

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", { day:"2-digit", month:"short", year:"numeric" });
}

function StatCard({ label, value, color="#4caf50" }) {
  return (
    <div style={{ background:"#1a1a24", borderRadius:14, padding:"16px 18px", border:`1px solid ${color}30` }}>
      <div style={{ color:"#666", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{label}</div>
      <div style={{ color:"white", fontWeight:900, fontSize:28 }}>{value}</div>
    </div>
  );
}

export default function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState("usuarios");
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingPlan, setEditingPlan] = useState(null);
  const [newPlan, setNewPlan] = useState("");
  const [promoMonths, setPromoMonths] = useState(1);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => { loadData(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar usuarios con sus planes
      const { data: plans } = await supabase.from("user_plans").select("*");
      const { data: profiles } = await supabase.from("profiles").select("*");

      // Combinar datos
      const combined = (plans || []).map(p => {
        const profile = (profiles || []).find(pr => pr.id === p.user_id);
        return {
          id: p.user_id,
          email: profile?.email || "—",
          name: profile?.name || "Sin nombre",
          plan: p.plan || "free",
          plan_expires_at: p.plan_expires_at,
          promo_code: p.promo_code,
          granted_by: p.granted_by,
          created_at: p.created_at,
          weight: profile?.weight,
          goal: profile?.goal,
        };
      });
      setUsers(combined);

      // Cargar feedback
      const { data: fb } = await supabase.from("feedback").select("*").order("created_at", { ascending: false });
      setFeedback(fb || []);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  const updatePlan = async (userId, plan, months) => {
    setSaving(true);
    try {
      const updates = { plan, updated_at: new Date().toISOString() };
      if (months && plan !== "lifetime" && plan !== "admin") {
        const exp = new Date();
        exp.setMonth(exp.getMonth() + parseInt(months));
        updates.plan_expires_at = exp.toISOString();
        updates.granted_by = "admin";
      } else if (plan === "free") {
        updates.plan_expires_at = null;
        updates.granted_by = null;
      }
      await supabase.from("user_plans").update(updates).eq("user_id", userId);
      showToast(`Plan actualizado a ${plan} ✓`);
      setEditingPlan(null);
      loadData();
    } catch(e) {
      showToast("Error al actualizar");
    }
    setSaving(false);
  };

  const markFeedback = async (id, status) => {
    await supabase.from("feedback").update({ status }).eq("id", id);
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    showToast("Estado actualizado ✓");
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users.length,
    premium: users.filter(u => u.plan === "premium" || u.plan === "lifetime").length,
    free: users.filter(u => u.plan === "free").length,
    feedback: feedback.filter(f => f.status === "pendiente").length,
  };

  const planColor = { free:"#666", premium:"#ffd700", lifetime:"#ff6b35", admin:"#4caf50" };
  const planBg = { free:"#2a2a3a", premium:"rgba(255,215,0,0.15)", lifetime:"rgba(255,107,53,0.15)", admin:"rgba(76,175,80,0.15)" };

  return (
    <div style={{ minHeight:"100vh", background:"#0f0f14", color:"white", fontFamily:"system-ui,sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:"#4caf50", color:"white", padding:"10px 20px", borderRadius:20, fontWeight:700, fontSize:13, zIndex:999, whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background:"rgba(15,15,20,0.95)", borderBottom:"1px solid #2a2a3a", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:100, backdropFilter:"blur(12px)" }}>
        <div>
          <div style={{ color:"#4caf50", fontSize:10, fontWeight:700, letterSpacing:3 }}>SMINK FIT</div>
          <div style={{ fontWeight:900, fontSize:18 }}>Panel de Administración</div>
        </div>
        <button onClick={onLogout} style={{ background:"none", border:"1px solid #2a2a3a", borderRadius:10, color:"#666", padding:"8px 14px", cursor:"pointer", fontSize:13 }}>
          Cerrar sesión
        </button>
      </div>

      <div style={{ padding:"20px 16px 60px" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
          <StatCard label="Usuarios totales" value={stats.total} color="#4caf50" />
          <StatCard label="Premium / Lifetime" value={stats.premium} color="#ffd700" />
          <StatCard label="Plan gratuito" value={stats.free} color="#666" />
          <StatCard label="Feedback pendiente" value={stats.feedback} color="#ff6b35" />
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", background:"#0f0f14", borderRadius:12, padding:4, marginBottom:20, border:"1px solid #2a2a3a" }}>
          {[["usuarios","Usuarios"], ["feedback","Feedback"]].map(([id, label]) => (
            <button key={id} onClick={()=>setTab(id)} style={{ flex:1, padding:"10px", borderRadius:9, border:"none", background:tab===id?"#4caf50":"transparent", color:tab===id?"white":"#666", fontWeight:700, fontSize:14, cursor:"pointer" }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:"center", color:"#666", padding:40 }}>Cargando...</div>
        ) : (

          // ── USUARIOS ──────────────────────────────────────
          tab === "usuarios" ? (
            <>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre o correo..." style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1px solid #2a2a3a", background:"#1a1a24", color:"white", fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:14 }} />

              <div style={{ color:"#666", fontSize:12, marginBottom:10 }}>{filteredUsers.length} usuarios</div>

              {filteredUsers.map(u => (
                <div key={u.id} style={{ background:"#1a1a24", borderRadius:16, marginBottom:10, border:"1px solid #2a2a3a", overflow:"hidden" }}>
                  <div style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:15, marginBottom:2 }}>{u.name}</div>
                        <div style={{ color:"#666", fontSize:12, marginBottom:6 }}>{u.email}</div>
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                          <span style={{ fontSize:10, background:planBg[u.plan], color:planColor[u.plan], borderRadius:20, padding:"3px 10px", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5 }}>{u.plan}</span>
                          {u.plan_expires_at && <span style={{ color:"#888", fontSize:11 }}>hasta {fmtDate(u.plan_expires_at)}</span>}
                          {u.weight && <span style={{ color:"#666", fontSize:11 }}>{u.weight}kg</span>}
                          <span style={{ color:"#555", fontSize:11 }}>Registro: {fmtDate(u.created_at)}</span>
                        </div>
                      </div>
                      <button onClick={()=>{ setEditingPlan(u.id===editingPlan?null:u.id); setNewPlan(u.plan); setPromoMonths(1); }}
                        style={{ background:"#2a2a3a", border:"none", borderRadius:10, color:"#aaa", padding:"7px 12px", fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
                        Gestionar
                      </button>
                    </div>
                  </div>

                  {/* Panel de gestión */}
                  {editingPlan === u.id && (
                    <div style={{ padding:"14px 16px", borderTop:"1px solid #2a2a3a", background:"#15151c" }}>
                      <div style={{ color:"#888", fontSize:11, fontWeight:700, marginBottom:10, textTransform:"uppercase", letterSpacing:1 }}>Cambiar plan</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                        {PLANS.map(p => (
                          <button key={p} onClick={()=>setNewPlan(p)}
                            style={{ padding:"10px", borderRadius:10, border:`2px solid ${newPlan===p?planColor[p]:"#2a2a3a"}`, background:newPlan===p?planBg[p]:"transparent", color:newPlan===p?planColor[p]:"#666", fontWeight:700, fontSize:13, cursor:"pointer", textTransform:"uppercase", letterSpacing:0.5 }}>
                            {p}
                          </button>
                        ))}
                      </div>

                      {(newPlan === "premium") && (
                        <div style={{ marginBottom:12 }}>
                          <div style={{ color:"#888", fontSize:11, fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>Meses de regalo</div>
                          <div style={{ display:"flex", gap:8 }}>
                            {[1,2,3,6,12].map(m => (
                              <button key={m} onClick={()=>setPromoMonths(m)}
                                style={{ flex:1, padding:"8px 0", borderRadius:8, border:`1px solid ${promoMonths===m?"#ffd700":"#2a2a3a"}`, background:promoMonths===m?"rgba(255,215,0,0.1)":"transparent", color:promoMonths===m?"#ffd700":"#555", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                                {m}m
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={()=>updatePlan(u.id, newPlan, promoMonths)} disabled={saving}
                          style={{ flex:1, padding:"12px", borderRadius:12, border:"none", background:"linear-gradient(135deg,#4caf50,#2e7d32)", color:"white", fontWeight:800, fontSize:14, cursor:"pointer", opacity:saving?0.7:1 }}>
                          {saving?"Guardando...":"Guardar"}
                        </button>
                        <button onClick={()=>setEditingPlan(null)}
                          style={{ padding:"12px 16px", borderRadius:12, border:"1px solid #2a2a3a", background:"transparent", color:"#666", fontWeight:700, fontSize:14, cursor:"pointer" }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>

          // ── FEEDBACK ──────────────────────────────────────
          ) : (
            <>
              {feedback.length === 0 ? (
                <div style={{ textAlign:"center", color:"#666", padding:40 }}>No hay feedback todavía</div>
              ) : feedback.map(f => (
                <div key={f.id} style={{ background:"#1a1a24", borderRadius:16, marginBottom:10, border:`1px solid ${f.status==="pendiente"?"#ff6b3540":"#2a2a3a"}`, overflow:"hidden" }}>
                  <div style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <span style={{ fontSize:10, background:f.type==="bug"?"rgba(200,50,50,0.2)":f.type==="sugerencia"?"rgba(76,175,80,0.15)":"rgba(255,107,53,0.15)", color:f.type==="bug"?"#ff8080":f.type==="sugerencia"?"#8bc34a":"#ff6b35", borderRadius:20, padding:"3px 10px", fontWeight:700, textTransform:"uppercase" }}>{f.type||"otro"}</span>
                        <span style={{ color:`${f.status==="pendiente"?"#ff6b35":f.status==="leido"?"#ffd700":"#4caf50"}`, fontSize:10, fontWeight:700, textTransform:"uppercase" }}>{f.status}</span>
                      </div>
                      <span style={{ color:"#555", fontSize:11 }}>{fmtDate(f.created_at)}</span>
                    </div>
                    {f.email && <div style={{ color:"#666", fontSize:12, marginBottom:6 }}>{f.email}</div>}
                    <div style={{ color:"#ccc", fontSize:14, lineHeight:1.5 }}>{f.message}</div>
                    <div style={{ display:"flex", gap:8, marginTop:12 }}>
                      {["pendiente","leido","resuelto"].map(s => (
                        <button key={s} onClick={()=>markFeedback(f.id, s)}
                          style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #2a2a3a", background:f.status===s?"#2a2a3a":"transparent", color:f.status===s?"white":"#555", fontSize:11, fontWeight:700, cursor:"pointer", textTransform:"uppercase", letterSpacing:0.5 }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )
        )}
      </div>
    </div>
  );
}
