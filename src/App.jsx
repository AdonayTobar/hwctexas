// src/App.jsx
import { useEffect, useState, useRef } from 'react';
import { supabase } from './lib/supabase';
import { LanguageProvider, useI18n } from './i18n/LanguageContext';
import { DataProvider, useData } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import Login from './views/Login';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Properties from './views/Properties';
import PropertyDetail from './views/PropertyDetail';
import Routes from './views/Routes';
import RouteDetail from './views/RouteDetail';
import DayDetail from './views/DayDetail';
import PropertyForm from './views/PropertyForm';
import Calendar from './views/Calendar';
import Crews from './views/Crews';
import CrewDetail from './views/CrewDetail';
import CrewForm from './views/CrewForm';
import Reports from './views/Reports';
import Export from './views/Export';

function AppContent() {
  const { loadData } = useData();
  const { t } = useI18n();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentParam, setCurrentParam] = useState(null);

  // Candado para evitar que Supabase vuelva a descargar todo si refresca el token
  const profileLoaded = useRef(false);

  const fetchProfile = async (userId, email) => {
    if (profileLoaded.current) return; // Si ya cargó, no hace nada
    profileLoaded.current = true;

    setLoading(true);
    try {
      const { data } = await supabase.from('profiles').select('*, crews(name)').eq('id', userId).single();
      setProfile({
        nombre: data?.nombre || email.split('@')[0] || 'Usuario',
        email: email,
        rol: data?.rol || 'Trabajador',
        cuadrilla: data?.crews?.name || ''
      });
      await loadData();
    } catch (err) {
      console.error("Error trayendo el perfil:", err);
      setProfile({ nombre: 'Usuario', email: email, rol: 'Trabajador', cuadrilla: '' });
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setProfile(null);
        setLoading(false);
        profileLoaded.current = false; // Se reinicia el candado al cerrar sesión
      } else if (_event === 'SIGNED_IN') {
        fetchProfile(session.user.id, session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Escuchar el botón de "Atrás" del navegador para que no recargue la página
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.view) {
        setCurrentView(e.state.view);
        setCurrentParam(e.state.param || null);
      } else {
        setCurrentView('dashboard');
        setCurrentParam(null);
      }
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return <Login />;

  // Navegación que guarda el historial en el navegador
  const navigate = (view, param = null) => {
    setCurrentView(view);
    setCurrentParam(param);
    window.history.pushState({ view, param }, '');
    window.scrollTo(0, 0);
  };

  // El botón de volver ahora usa el historial nativo del navegador
  const goBack = () => {
    window.history.back();
  };

  return (
    <Layout profile={profile} currentView={currentView} navigate={navigate}>

      {/* Botón de Volver */}
      {currentView !== 'dashboard' && (
        <div className="mb-4 flex justify-start">
          <button
            onClick={goBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-sky-400 hover:text-sky-600 transition active:scale-95 font-bold text-sm group"
          >
            <span className="text-lg transition-transform group-hover:-translate-x-1">←</span> {t('comun.volver')}
          </button>
        </div>
      )}

      {/* Aquí van todas las vistas migradas */}
      {currentView === 'dashboard' && <Dashboard profile={profile} navigate={navigate} />}
      {currentView === 'propiedades' && <Properties profile={profile} navigate={navigate} initialCity={currentParam} />}
      {currentView === 'propiedad_detalle' && <PropertyDetail profile={profile} propertyId={currentParam} navigate={navigate} />}
      {currentView === 'rutas' && <Routes profile={profile} navigate={navigate} />}
      {currentView === 'ruta_detalle' && <RouteDetail profile={profile} journeyId={currentParam} navigate={navigate} />}
      {currentView === 'dia_detalle' && <DayDetail profile={profile} navigate={navigate} />}
      {currentView === 'propiedad_form' && <PropertyForm profile={profile} propertyId={currentParam} navigate={navigate} />}
      {currentView === 'calendario' && <Calendar profile={profile} navigate={navigate} />}
      {currentView === 'cuadrillas' && <Crews profile={profile} navigate={navigate} />}
      {currentView === 'cuadrilla_detalle' && <CrewDetail profile={profile} crewId={currentParam} navigate={navigate} />}
      {currentView === 'cuadrilla_form' && <CrewForm profile={profile} crewId={currentParam} navigate={navigate} />}
      {currentView === 'reportes' && <Reports profile={profile} navigate={navigate} />}
      {currentView === 'exportar' && <Export profile={profile} navigate={navigate} />}

      {currentView !== 'dashboard' && currentView !== 'propiedades' && currentView !== 'propiedad_detalle' && currentView !== 'rutas' && currentView !== 'ruta_detalle' && currentView !== 'dia_detalle' && currentView !== 'propiedad_form' && currentView !== 'calendario' && currentView !== 'cuadrillas' && currentView !== 'cuadrilla_detalle' && currentView !== 'cuadrilla_form' && currentView !== 'reportes' && currentView !== 'exportar' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
          <h1 className="text-2xl font-extrabold text-slate-800">Vista: {currentView}</h1>
          <p className="text-slate-500 mt-2">Aún no migrada a React. ¡Vamos paso a paso!</p>
        </div>
      )}

    </Layout>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <DataProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </DataProvider>
    </LanguageProvider>
  );
}