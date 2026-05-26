import { useState } from "react";
import { supabase } from "./supabase.js";

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleEmail = async () => {
    setError(""); setSuccess("");
    if (!email || !password) { setError("Rellena el correo y la contraseña."); return; }
    if (mode === "register" && password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setLoading(true);
    try {
      if (mode === "register") {
        const { error: e } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (e) throw e;
        setSuccess("¡Cuenta creada! Ya puedes entrar.");
        setMode("login");
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
        onLogin();
      }
    } catch (e) {
      if (e.message.includes("Invalid login")) setError("Correo o contraseña incorrectos.");
      else if (e.message.includes("already registered")) setError("Este correo ya está registrado.");
      else setError(e.message);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (e) setError(e.message);
  };

  const handleForgot = async () => {
    setError(""); setSuccess("");
    if (!email) { setError("Escribe tu correo primero."); return; }
    setLoading(true);
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (e) setError(e.message);
    else setSuccess("Te hemos enviado un correo para restablecer tu contraseña.");
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"radial-gradient(circle at 50% 30%, #0d1f0d 0%, #0a0d0a 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px" }}>

      {/* Logo */}
      <div style={{ marginBottom:32, textAlign:"center" }}>
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" style={{ marginBottom:12 }}>
          <circle cx="50" cy="50" r="46" stroke="#A8FF60" strokeWidth="4" fill="rgba(168,255,61,0.06)" />
          <path d="M70 32 C70 24 60 21 50 21 C39 21 31 27 31 37 C31 46 41 49 50 52 C59 55 69 58 69 68 C69 78 60 81 50 81 C39 81 30 77 30 68"
            stroke="#A8FF60" strokeWidth="7" strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ fontWeight:900, fontSize:28, color:"white", letterSpacing:4 }}>SMINK <span style={{ color:"#A8FF60" }}>FIT</span></div>
        <div style={{ color:"#666", fontSize:12, letterSpacing:3, marginTop:4 }}>ENTRENA · COME · PROGRESA</div>
      </div>

      {/* Tarjeta */}
      <div style={{ width:"100%", maxWidth:380, background:"#16161f", borderRadius:22, padding:"28px 24px", border:"1px solid #2a2a3a" }}>

        {/* Tabs login/register */}
        {mode !== "forgot" && (
          <div style={{ display:"flex", background:"#0f0f14", borderRadius:12, padding:4, marginBottom:24 }}>
            {["login","register"].map(m => (
              <button key={m} onClick={()=>{ setMode(m); setError(""); setSuccess(""); }} style={{ flex:1, padding:"10px", borderRadius:9, border:"none", background:mode===m?"#4caf50":"transparent", color:mode===m?"white":"#666", fontWeight:700, fontSize:14, cursor:"pointer", transition:"all 0.2s" }}>
                {m==="login"?"Entrar":"Crear cuenta"}
              </button>
            ))}
          </div>
        )}

        {mode === "forgot" && (
          <div style={{ marginBottom:20 }}>
            <button onClick={()=>{ setMode("login"); setError(""); setSuccess(""); }} style={{ background:"none", border:"none", color:"#4caf50", fontSize:14, cursor:"pointer", padding:0, marginBottom:12 }}>← Atrás</button>
            <div style={{ color:"white", fontWeight:800, fontSize:18 }}>Recuperar contraseña</div>
            <div style={{ color:"#666", fontSize:13, marginTop:4 }}>Te enviaremos un correo para restablecerla.</div>
          </div>
        )}

        {/* Nombre (solo registro) */}
        {mode === "register" && (
          <div style={{ marginBottom:14 }}>
            <div style={{ color:"#888", fontSize:12, fontWeight:700, marginBottom:6 }}>NOMBRE</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={{ width:"100%", padding:"13px 14px", borderRadius:12, border:"1px solid #2a2a3a", background:"#0f0f14", color:"white", fontSize:15, outline:"none", boxSizing:"border-box" }} />
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom:14 }}>
          <div style={{ color:"#888", fontSize:12, fontWeight:700, marginBottom:6 }}>CORREO</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com" style={{ width:"100%", padding:"13px 14px", borderRadius:12, border:"1px solid #2a2a3a", background:"#0f0f14", color:"white", fontSize:15, outline:"none", boxSizing:"border-box" }} />
        </div>

        {/* Contraseña */}
        {mode !== "forgot" && (
          <div style={{ marginBottom:20 }}>
            <div style={{ color:"#888", fontSize:12, fontWeight:700, marginBottom:6 }}>CONTRASEÑA</div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handleEmail()} style={{ width:"100%", padding:"13px 14px", borderRadius:12, border:"1px solid #2a2a3a", background:"#0f0f14", color:"white", fontSize:15, outline:"none", boxSizing:"border-box" }} />
            {mode === "login" && (
              <button onClick={()=>{ setMode("forgot"); setError(""); setSuccess(""); }} style={{ background:"none", border:"none", color:"#4caf50", fontSize:12, cursor:"pointer", padding:0, marginTop:8 }}>¿Olvidaste tu contraseña?</button>
            )}
          </div>
        )}

        {/* Error / Éxito */}
        {error && <div style={{ background:"rgba(200,50,50,0.15)", border:"1px solid rgba(200,50,50,0.4)", borderRadius:10, padding:"10px 14px", color:"#ff8080", fontSize:13, marginBottom:14 }}>{error}</div>}
        {success && <div style={{ background:"rgba(76,175,80,0.15)", border:"1px solid rgba(76,175,80,0.4)", borderRadius:10, padding:"10px 14px", color:"#8bc34a", fontSize:13, marginBottom:14 }}>{success}</div>}

        {/* Botón principal */}
        <button onClick={mode==="forgot"?handleForgot:handleEmail} disabled={loading} style={{ width:"100%", padding:"15px", borderRadius:14, border:"none", background:"linear-gradient(135deg,#4caf50,#2e7d32)", color:"white", fontWeight:800, fontSize:16, cursor:loading?"default":"pointer", opacity:loading?0.7:1, marginBottom:mode==="forgot"?0:16 }}>
          {loading?"..." : mode==="login"?"Entrar" : mode==="register"?"Crear cuenta" : "Enviar correo"}
        </button>

        {/* Separador + Google (no en forgot) */}
        {mode !== "forgot" && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div style={{ flex:1, height:1, background:"#2a2a3a" }} />
              <span style={{ color:"#555", fontSize:12 }}>o</span>
              <div style={{ flex:1, height:1, background:"#2a2a3a" }} />
            </div>
            <button onClick={handleGoogle} style={{ width:"100%", padding:"14px", borderRadius:14, border:"1px solid #2a2a3a", background:"#1a1a24", color:"white", fontWeight:700, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
              <svg width="20" height="20" viewBox="0 0 48 48">
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

      <div style={{ color:"#444", fontSize:11, marginTop:24, textAlign:"center" }}>SMINK FIT · Tus datos protegidos y seguros</div>
    </div>
  );
}
