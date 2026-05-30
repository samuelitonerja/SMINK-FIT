import { useState } from "react";
import { supabase } from "./supabase.js";

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [role, setRole] = useState(null); // trainer | athlete
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reset = () => { setError(""); setSuccess(""); };

  // ── Login ──────────────────────────────────────────────
  const handleLogin = async () => {
    reset();
    if (!email || !password) { setError("Rellena el correo y la contraseña."); return; }
    setLoading(true);
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) {
      if (e.message.includes("Invalid login")) setError("Correo o contraseña incorrectos.");
      else setError(e.message);
    }
    setLoading(false);
  };

  // ── Registro ───────────────────────────────────────────
  const handleRegister = async () => {
    reset();
    if (!name) { setError("Escribe tu nombre."); return; }
    if (!email.includes("@")) { setError("Correo no válido."); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (!role) { setError("Selecciona si eres entrenador o atleta."); return; }
    setLoading(true);
    const { data, error: e } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, role } }
    });
    if (e) { setError(e.message); setLoading(false); return; }
    // Actualizar role en profiles
    if (data?.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, email, name, role });
      await supabase.from("user_plans").upsert({ user_id: data.user.id, plan: role });
    }
    setSuccess("¡Cuenta creada! Ya puedes entrar.");
    setMode("login");
    setLoading(false);
  };

  // ── Recuperar contraseña ───────────────────────────────
  const handleForgot = async () => {
    reset();
    if (!email) { setError("Escribe tu correo primero."); return; }
    setLoading(true);
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (e) setError(e.message);
    else setSuccess("Correo de recuperación enviado. Revisa tu bandeja.");
    setLoading(false);
  };

  // ── Google ─────────────────────────────────────────────
  const handleGoogle = async () => {
    reset();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const inp = {
    width:"100%", padding:"13px 14px", borderRadius:10,
    border:"1px solid #1e1f2a", background:"#0d0e12",
    color:"#eeeef2", fontSize:15, outline:"none",
    boxSizing:"border-box", fontFamily:"inherit",
  };

  const btn = (active, color="#c8fb6e") => ({
    flex:1, padding:"12px 0", borderRadius:10,
    border:`1.5px solid ${active ? color : "#1e1f2a"}`,
    background: active ? `${color}12` : "transparent",
    color: active ? color : "#3a3a4a",
    fontWeight:700, fontSize:13, cursor:"pointer",
    transition:"all 0.2s", letterSpacing:0.3,
  });

  return (
    <div style={{
      minHeight:"100vh",
      background:"radial-gradient(ellipse at 50% 0%, #0f1020 0%, #08090c 60%)",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:"24px",
      fontFamily:"system-ui, -apple-system, sans-serif",
    }}>

      {/* Logo */}
      <div style={{ marginBottom:36, textAlign:"center" }}>
        <svg width="64" height="64" viewBox="0 0 100 100" fill="none" style={{ marginBottom:14 }}>
          <circle cx="50" cy="50" r="46" stroke="#c8fb6e" strokeWidth="2" fill="rgba(200,251,110,0.04)" />
          <path d="M70 32 C70 24 60 21 50 21 C39 21 31 27 31 37 C31 46 41 49 50 52 C59 55 69 58 69 68 C69 78 60 81 50 81 C39 81 30 77 30 68"
            stroke="#c8fb6e" strokeWidth="6" strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ fontWeight:900, fontSize:22, letterSpacing:4, color:"#eeeef2" }}>
          <span style={{ color:"#c8fb6e" }}>S</span>MINK FIT
        </div>
        <div style={{ color:"#303042", fontSize:10, letterSpacing:3, marginTop:4, textTransform:"uppercase" }}>
          Entrena · Come · Progresa
        </div>
      </div>

      {/* Tarjeta */}
      <div style={{
        width:"100%", maxWidth:380,
        background:"#0d0e12", borderRadius:18,
        padding:"26px 22px", border:"1px solid #1e1f2a",
      }}>

        {/* Tabs */}
        {mode !== "forgot" && (
          <div style={{ display:"flex", background:"#08090c", borderRadius:10, padding:3, marginBottom:22 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={()=>{ setMode(m); reset(); setRole(null); }}
                style={{ flex:1, padding:"10px", borderRadius:8, border:"none",
                  background:mode===m?"#1e1f2a":"transparent",
                  color:mode===m?"#eeeef2":"#3a3a4a",
                  fontWeight:700, fontSize:14, cursor:"pointer", transition:"all 0.2s" }}>
                {m==="login" ? "Entrar" : "Crear cuenta"}
              </button>
            ))}
          </div>
        )}

        {/* Forgot header */}
        {mode === "forgot" && (
          <div style={{ marginBottom:20 }}>
            <button onClick={()=>{ setMode("login"); reset(); }}
              style={{ background:"none", border:"none", color:"#c8fb6e", fontSize:13, cursor:"pointer", padding:0, marginBottom:14, fontWeight:600 }}>
              ← Atrás
            </button>
            <div style={{ color:"#eeeef2", fontWeight:800, fontSize:18 }}>Recuperar contraseña</div>
            <div style={{ color:"#6a6a80", fontSize:13, marginTop:4 }}>
              Te enviaremos un correo para restablecerla.
            </div>
          </div>
        )}

        {/* Selector de rol (solo en registro) */}
        {mode === "register" && (
          <div style={{ marginBottom:18 }}>
            <div style={{ color:"#3a3a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>
              Soy...
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setRole("trainer")} style={btn(role==="trainer")}>
                Entrenador
              </button>
              <button onClick={()=>setRole("athlete")} style={btn(role==="athlete","#5b9cf6")}>
                Atleta
              </button>
            </div>
            {role === "athlete" && (
              <div style={{ marginTop:10, padding:"10px 12px", background:"rgba(91,156,246,0.06)", border:"1px solid rgba(91,156,246,0.15)", borderRadius:8 }}>
                <div style={{ color:"#5b9cf6", fontSize:12, lineHeight:1.5 }}>
                  Tu entrenador te dará acceso. Si aún no tienes entrenador en SMINK FIT, pídele que te invite.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nombre */}
        {mode === "register" && (
          <div style={{ marginBottom:12 }}>
            <div style={{ color:"#3a3a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Nombre</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={inp} />
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom:12 }}>
          <div style={{ color:"#3a3a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Correo</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com" style={inp} />
        </div>

        {/* Password */}
        {mode !== "forgot" && (
          <div style={{ marginBottom:20 }}>
            <div style={{ color:"#3a3a4a", fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginBottom:6 }}>Contraseña</div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e=>e.key==="Enter"&&(mode==="login"?handleLogin():handleRegister())}
              style={inp} />
            {mode === "login" && (
              <button onClick={()=>{ setMode("forgot"); reset(); }}
                style={{ background:"none", border:"none", color:"#3a3a4a", fontSize:12, cursor:"pointer", padding:0, marginTop:8, fontWeight:600 }}>
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div style={{ background:"rgba(255,68,68,0.08)", border:"1px solid rgba(255,68,68,0.2)", borderRadius:8, padding:"10px 12px", color:"#ff8080", fontSize:13, marginBottom:14, lineHeight:1.5 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background:"rgba(200,251,110,0.08)", border:"1px solid rgba(200,251,110,0.2)", borderRadius:8, padding:"10px 12px", color:"#c8fb6e", fontSize:13, marginBottom:14, lineHeight:1.5 }}>
            {success}
          </div>
        )}

        {/* Botón principal */}
        <button
          onClick={mode==="login"?handleLogin:mode==="register"?handleRegister:handleForgot}
          disabled={loading}
          style={{
            width:"100%", padding:"14px", borderRadius:10, border:"none",
            background: loading ? "#1e1f2a" : "linear-gradient(135deg,#c8fb6e,#a8d94e)",
            color: loading ? "#3a3a4a" : "#08090c",
            fontWeight:800, fontSize:15, cursor:loading?"default":"pointer",
            marginBottom: mode==="forgot" ? 0 : 16, letterSpacing:0.3,
          }}>
          {loading ? "..." : mode==="login" ? "Entrar" : mode==="register" ? "Crear cuenta" : "Enviar correo"}
        </button>

        {/* Google */}
        {mode !== "forgot" && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <div style={{ flex:1, height:1, background:"#1e1f2a" }} />
              <span style={{ color:"#303042", fontSize:11 }}>o</span>
              <div style={{ flex:1, height:1, background:"#1e1f2a" }} />
            </div>
            <button onClick={handleGoogle}
              style={{ width:"100%", padding:"13px", borderRadius:10, border:"1px solid #1e1f2a", background:"#12131a", color:"#eeeef2", fontWeight:600, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continuar con Google
            </button>
          </>
        )}
      </div>

      <div style={{ color:"#1e1f2a", fontSize:11, marginTop:20, textAlign:"center", letterSpacing:0.5 }}>
        SMINK FIT · Tus datos protegidos y seguros
      </div>
    </div>
  );
}
