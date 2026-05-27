import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthScreen from './AuthScreen.jsx'
import AdminPanel from './AdminPanel.jsx'
import { supabase } from './supabase.js'
import { loadUserData } from './db.js'

// Limpia datos sensibles del localStorage al cambiar de usuario o hacer logout
function clearUserData() {
  const keys = Object.keys(localStorage).filter(k => k.endsWith('_v10'));
  keys.forEach(k => localStorage.removeItem(k));
  sessionStorage.clear();
}

function Root() {
  const [status, setStatus] = useState('loading');
  const [session, setSession] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [cloudData, setCloudData] = useState(null);
  const currentUserIdRef = useRef(null);

  const initUser = async (sess) => {
    if (!sess) {
      clearUserData();
      currentUserIdRef.current = null;
      setStatus('auth');
      setSession(null);
      setCloudData(null);
      setUserPlan(null);
      return;
    }

    // Si cambió de usuario → limpiar datos del anterior
    if (currentUserIdRef.current && currentUserIdRef.current !== sess.user.id) {
      clearUserData();
    }
    currentUserIdRef.current = sess.user.id;

    setStatus('loading');
    setSession(sess);

    try {
      const { data: planData } = await supabase
        .from('user_plans')
        .select('plan')
        .eq('user_id', sess.user.id)
        .maybeSingle();

      const plan = planData?.plan || 'free';
      setUserPlan(plan);

      if (plan === 'admin') {
        clearUserData();
        setStatus('admin');
        return;
      }

      // Cargar datos desde Supabase
      const timeout = new Promise(resolve => setTimeout(() => resolve({}), 8000));
      const data = await Promise.race([loadUserData(sess.user.id), timeout]);
      setCloudData(data || {});
      setStatus('app');

    } catch(e) {
      console.error('Error:', e);
      setCloudData({});
      setStatus('app');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      initUser(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearUserData();
        currentUserIdRef.current = null;
        setStatus('auth');
        setSession(null);
        setCloudData(null);
        setUserPlan(null);
      } else if (event === 'SIGNED_IN') {
        initUser(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    clearUserData();
    await supabase.auth.signOut();
  };

  if (status === 'loading') {
    return (
      <div style={{ minHeight:"100vh", background:"#0a0d0a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="46" stroke="#A8FF60" strokeWidth="4" fill="rgba(168,255,61,0.06)" />
          <path d="M70 32 C70 24 60 21 50 21 C39 21 31 27 31 37 C31 46 41 49 50 52 C59 55 69 58 69 68 C69 78 60 81 50 81 C39 81 30 77 30 68"
            stroke="#A8FF60" strokeWidth="7" strokeLinecap="round" fill="none" />
        </svg>
        <div style={{ color:"#666", fontSize:13, letterSpacing:1 }}>Cargando...</div>
      </div>
    );
  }

  if (status === 'auth') return <AuthScreen onLogin={() => {}} />;
  if (status === 'admin') return <AdminPanel onLogout={handleLogout} />;

  return (
    <App
      key={session?.user.id}
      userId={session?.user.id}
      userEmail={session?.user.email}
      cloudData={cloudData}
    />
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Root /></React.StrictMode>
)
