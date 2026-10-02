// src/components/Layout.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../i18n/LanguageContext';
import { useData } from '../context/DataContext';
import logo from '../logo.png';

export default function Layout({ profile, currentView, navigate, children }) {
    const { t, td, lang, changeLanguage } = useI18n();
    const { getPendientesRep } = useData();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const pendientesRep = profile ? getPendientesRep(profile.nombre) : 0;

    const navLinks = [
        { id: 'dashboard', icon: '📊', label: t('nav.dashboard') },
        { id: 'rutas', icon: '🗺️', label: t('nav.jornadas') },
        { id: 'calendario', icon: '📅', label: t('nav.calendario') },
        { id: 'propiedades', icon: '🏢', label: t('nav.propiedades') },
        { id: 'cuadrillas', icon: '👥', label: t('nav.cuadrillas') },
        { id: 'reportes', icon: '📋', label: t('nav.reportes'), adminOnly: true, badge: pendientesRep },
        { id: 'exportar', icon: '⬇️', label: t('nav.exportar'), adminOnly: true },
    ].filter(link => !link.adminOnly || profile?.rol === 'Admin');

    const handleNav = (view) => {
        navigate(view);
        setMobileMenuOpen(false);
    };

    const initials = profile?.nombre ? profile.nombre.replace(/[^a-zA-Z ]/g, '').split(' ')[0].slice(0, 2).toUpperCase() : 'AG';
    const rolEstilo = profile?.rol === 'Admin' ? 'bg-amber-400 text-amber-950' : profile?.rol === 'Supervisor' ? 'bg-violet-400 text-violet-950' : 'bg-sky-400 text-sky-950';

    return (
        <div className="bg-slate-100 min-h-screen font-sans text-slate-800 overflow-x-hidden">

            {/* SIDEBAR ESCRITORIO */}
            <aside className={`hidden lg:flex fixed inset-y-0 left-0 bg-slate-900 text-white z-30 flex-col transition-all duration-200 ${sidebarCollapsed ? 'w-[76px]' : 'w-64'}`}>
                <div className="flex items-center gap-3 px-4 py-5">
                    <img src={logo} alt="HWC Logo" className="w-10 h-10 shrink-0 rounded-xl shadow-lg object-cover" />
                    {!sidebarCollapsed && (
                        <div className="min-w-0">
                            <p className="font-extrabold leading-tight">HWC</p>
                            <p className="text-[11px] text-slate-400">Limpieza · Texas</p>
                        </div>
                    )}
                </div>

                <nav className="px-3 space-y-1 mt-1 flex-1 overflow-y-auto">
                    {navLinks.map(link => (
                        <button
                            key={link.id}
                            onClick={() => handleNav(link.id)}
                            title={link.label}
                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition ${currentView === link.id ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                        >
                            <span className="text-lg shrink-0 w-6 text-center">{link.icon}</span>
                            {!sidebarCollapsed && <span className="truncate">{link.label}</span>}
                            {!sidebarCollapsed && link.badge > 0 && (
                                <span className="ml-auto bg-amber-500 text-white text-[10px] font-extrabold rounded-full px-2 py-0.5">{link.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto p-3 border-t border-white/10 space-y-2">
                    <div className="flex items-center gap-3 px-1.5">
                        <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-sky-400 to-cyan-600 flex items-center justify-center font-bold text-sm">{initials}</div>
                        {!sidebarCollapsed && (
                            <div className="min-w-0">
                                <p className="text-sm font-semibold leading-tight truncate">{profile?.nombre || '—'}</p>
                                <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded mt-0.5 ${rolEstilo}`}>{td('rol', profile?.rol)}</span>
                            </div>
                        )}
                    </div>

                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
                            <button onClick={() => changeLanguage('es')} className={`flex-1 py-1 text-xs font-bold rounded-md transition ${lang === 'es' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:bg-white/5'}`}>ES</button>
                            <button onClick={() => changeLanguage('en')} className={`flex-1 py-1 text-xs font-bold rounded-md transition ${lang === 'en' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:bg-white/5'}`}>EN</button>
                        </div>
                    )}

                    {!sidebarCollapsed && (
                        <button onClick={() => supabase.auth.signOut()} className="w-full text-[11px] text-rose-400 hover:text-rose-300 transition text-left px-3 font-bold">
                            {t('user.cerrarSesion')}
                        </button>
                    )}

                    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex w-full items-center justify-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl py-2 text-xs font-semibold text-slate-300 transition">
                        <span className="text-base">{sidebarCollapsed ? '⟩⟩' : '⟨⟨'}</span>
                        {!sidebarCollapsed && <span>{t('comun.colapsar')}</span>}
                    </button>
                </div>
            </aside>

            {/* TOPBAR MÓVIL */}
            <header className="lg:hidden sticky top-0 z-40 bg-gradient-to-r from-sky-700 to-cyan-600 text-white shadow-lg">
                <div className="flex items-center gap-3 px-4 py-3">
                    <button onClick={() => setMobileMenuOpen(true)} className="relative w-10 h-10 shrink-0 rounded-xl bg-white/20 flex items-center justify-center text-lg active:scale-95 transition">
                        ☰
                        {pendientesRep > 0 && (
                            <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 text-[10px] font-extrabold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{pendientesRep}</span>
                        )}
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="font-extrabold leading-tight">HWC</p>
                        <p className="text-[11px] text-sky-100 truncate">{t('nav.' + currentView)}</p>
                    </div>
                    <div className="w-9 h-9 shrink-0 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">{initials}</div>
                </div>
            </header>

            {/* MENÚ MÓVIL FULLSCREEN */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-[90] bg-slate-900 text-white flex flex-col">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <img src={logo} alt="HWC Logo" className="w-10 h-10 rounded-xl shadow-lg object-cover" />
                            <div>
                                <p className="font-extrabold leading-tight">HWC</p>
                                <p className="text-[11px] text-slate-400">Limpieza · Texas</p>
                            </div>
                        </div>
                        <button onClick={() => setMobileMenuOpen(false)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xl transition active:scale-95">✕</button>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
                        {navLinks.map(link => (
                            <button
                                key={link.id}
                                onClick={() => handleNav(link.id)}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold text-[15px] transition ${currentView === link.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                            >
                                <span className="text-xl w-7 text-center shrink-0">{link.icon}</span> {link.label}
                                {link.badge > 0 && (
                                    <span className="ml-auto bg-amber-500 text-white text-[10px] font-extrabold rounded-full px-2 py-0.5">{link.badge}</span>
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="border-t border-white/10 p-4 space-y-3">
                        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
                            <button onClick={() => changeLanguage('es')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${lang === 'es' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:bg-white/5'}`}>ES 🇪🇸</button>
                            <button onClick={() => changeLanguage('en')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${lang === 'en' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:bg-white/5'}`}>EN 🇺🇸</button>
                        </div>
                        <button onClick={() => supabase.auth.signOut()} className="w-full text-sm font-bold text-rose-400 hover:text-rose-300 bg-white/5 hover:bg-white/10 rounded-xl py-3 transition active:scale-95 text-center">
                            {t('user.cerrarSesion')}
                        </button>
                    </div>
                </div>
            )}

            {/* CONTENIDO PRINCIPAL */}
            <div className={`transition-all duration-200 ${sidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-64'}`}>
                <main className="max-w-7xl mx-auto px-4 lg:px-8 py-5 lg:py-8 pb-10 lg:pb-8 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}