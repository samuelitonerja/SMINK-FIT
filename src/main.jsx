import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthScreen from './AuthScreen.jsx'
import AdminPanel from './AdminPanel.jsx'
import { supabase } from './supabase.js'

// Limpia datos locales al cambiar de usuario
function clearLocalData() {
  const keep = ["installPromptSeen"];
  Object.keys(localStorage).forEach(k => {
    if (!keep.includes(k)) localStorage.removeItem(k);
  });
}

function Root() {
  const [status, setStatus] = useState("loading");
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const prevUserRef = useRef(null);

  const initUser = async (sess) => {
    if (!sess) {
      clearLocalData();
      prevUserRef.current = null;
      setSession(null);
      setUserRole(null);
      setStatus("auth");
      return;
    }

    // Cambio de usuario → limpiar datos anteriores
    if (prevUserRef.current && prevUserRef.current !== sess.user.id) {
      clearLocalData();
    }
    prevUserRef.current = sess.user.id;
    setStatus("loading");

    try {
      const { data } = await supabase
        .from("user_plans")
        .select("plan")
        .eq("user_id", sess.user.id)
        .maybeSingle();

      const plan = data?.plan || "athlete";
      setUserRole(plan);
      setSession(sess);
      setStatus("ready");
    } catch(e) {
      console.error(e);
      setSession(sess);
      setUserRole("athlete");
      setStatus("ready");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => initUser(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        clearLocalData();
        prevUserRef.current = null;
        setSession(null); setUserRole(null); setStatus("auth");
      } else if (event === "SIGNED_IN") {
        initUser(session);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    clearLocalData();
    await supabase.auth.signOut();
  };

  // Pantalla de carga
  if (status === "loading") {
    return (
      <div style={{ minHeight:"100vh", background:"#08090c", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
        <svg width="56" height="56" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="46" stroke="#c8fb6e" strokeWidth="2" fill="rgba(200,251,110,0.04)" />
          <path d="M70 32 C70 24 60 21 50 21 C39 21 31 27 31 37 C31 46 41 49 50 52 C59 55 69 58 69 68 C69 78 60 81 50 81 C39 81 30 77 30 68"
            stroke="#c8fb6e" strokeWidth="6" strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ color:"#303042", fontSize:12, letterSpacing:2, textTransform:"uppercase" }}>Cargando</div>
      </div>
    );
  }

  // Sin sesión → login
  if (status === "auth") return <AuthScreen />;

  // Admin → panel de administración
  if (userRole === "admin") return <AdminPanel onLogout={handleLogout} />;

  // Entrenador → panel de entrenador (próximamente)
  if (userRole === "trainer") return (
    <div style={{ minHeight:"100vh", background:"#08090c", display:"flex", alignItems:"center", justifyContent:"center", color:"#c8fb6e", fontFamily:"system-ui", fontSize:18, fontWeight:700 }}>
      Panel de entrenador — En construcción
    </div>
  );

  // Atleta → app normal
  return (
    <App
      key={session?.user.id}
      userId={session?.user.id}
      userEmail={session?.user.email}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Root /></React.StrictMode>
)
