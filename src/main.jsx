import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthScreen from './AuthScreen.jsx'
import AdminPanel from './AdminPanel.jsx'
import { supabase } from './supabase.js'
import { migrateFromLocalStorage, loadUserData } from './db.js'

function Root() {
  const [session, setSession] = useState(undefined)
  const [cloudData, setCloudData] = useState(null)
  const [migrating, setMigrating] = useState(false)
  const [userPlan, setUserPlan] = useState(null)

  const initUser = async (sess) => {
    if (!sess) { setSession(null); setCloudData(null); setUserPlan(null); return; }
    setMigrating(true);
    try {
      // Comprobar si es admin PRIMERO (antes de cargar todo lo demás)
      const { data: planData } = await supabase
        .from('user_plans')
        .select('plan')
        .eq('user_id', sess.user.id)
        .maybeSingle();
      setUserPlan(planData?.plan || 'free');

      // Si es admin, no hace falta cargar todos los datos de la app
      if (planData?.plan !== 'admin') {
        const timeout = new Promise(resolve => setTimeout(() => resolve({}), 8000));
        await migrateFromLocalStorage(sess.user.id);
        const data = await Promise.race([loadUserData(sess.user.id), timeout]);
        setCloudData(data || {});
      }
    } catch(e) {
      console.error('Error iniciando usuario:', e);
      setCloudData({});
    }
    setSession(sess);
    setMigrating(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      initUser(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null); setCloudData(null); setUserPlan(null); setMigrating(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        initUser(session);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Cargando
  if (session === undefined || migrating) {
    return (
      <div style={{ minHeight:"100vh", background:"#0a0d0a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="46" stroke="#A8FF60" strokeWidth="4" fill="rgba(168,255,61,0.06)" />
          <path d="M70 32 C70 24 60 21 50 21 C39 21 31 27 31 37 C31 46 41 49 50 52 C59 55 69 58 69 68 C69 78 60 81 50 81 C39 81 30 77 30 68"
            stroke="#A8FF60" strokeWidth="7" strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ color:"#666", fontSize:13, letterSpacing:1 }}>
          {migrating ? "Sincronizando tus datos..." : "Cargando..."}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Sin sesión → login
  if (!session) return <AuthScreen onLogin={() => {}} />;

  // Admin → panel de administración
  if (userPlan === 'admin') return <AdminPanel onLogout={handleLogout} />;

  // Usuario normal → app
  return <App userId={session.user.id} userEmail={session.user.email} cloudData={cloudData} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Root /></React.StrictMode>
)
