import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AuthScreen from './AuthScreen.jsx'
import { supabase } from './supabase.js'

function Root() {
  const [session, setSession] = useState(undefined) // undefined = cargando

  useEffect(() => {
    // Obtener sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    // Escuchar cambios de sesión (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Cargando
  if (session === undefined) {
    return (
      <div style={{ minHeight:"100vh", background:"#0a0d0a", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:40, height:40, border:"3px solid #2a2a3a", borderTop:"3px solid #4caf50", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Sin sesión → pantalla de login
  if (!session) {
    return <AuthScreen onLogin={() => supabase.auth.getSession().then(({ data }) => setSession(data.session))} />
  }

  // Con sesión → app normal
  return <App userId={session.user.id} userEmail={session.user.email} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
