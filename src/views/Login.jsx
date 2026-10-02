// src/views/Login.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../i18n/LanguageContext';

export default function Login() {
    const { t, lang, changeLanguage } = useI18n();
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !pass) {
            setError(t('login.faltaCampos'));
            return;
        }

        setLoading(true);
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: pass,
        });
        setLoading(false);

        if (signInError) {
            let msg = signInError.message;
            if (msg === 'Invalid login credentials') msg = t('login.credInvalidas');
            else if (msg === 'Email not confirmed') msg = t('login.emailNoConfirmado');
            setError('❌ ' + msg);
        }
        // Si todo sale bien, el App.jsx detectará la sesión automáticamente y quitará este login
    };

    return (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900 flex items-center justify-center p-4">

            {/* Selector de idioma superior derecho */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1">🌐</span>
                <button onClick={() => changeLanguage('es')} className={`lang-btn ${lang === 'es' ? 'lang-on' : ''}`}>ES</button>
                <button onClick={() => changeLanguage('en')} className={`lang-btn ${lang === 'en' ? 'lang-on' : ''}`}>EN</button>
            </div>

            <div className="w-full max-w-md">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

                    {/* Branding */}
                    <div className="bg-gradient-to-br from-sky-500 to-cyan-600 p-8 text-center text-white">
                        <img src="/logo.png" alt="HWC Limpieza" className="w-16 h-16 mx-auto rounded-2xl shadow-lg mb-3 object-cover" />
                        <h2 className="text-2xl font-extrabold tracking-tight">HWC Limpieza</h2>
                        <p className="text-sky-100 text-sm mt-1">{t('login.subtitulo')}</p>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">{t('login.correo')}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">✉️</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="tu@correo.com"
                                    className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">{t('login.contrasena')}</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔒</span>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={pass}
                                    onChange={(e) => setPass(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 transition"
                                >
                                    {showPass ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="text-rose-500 text-xs bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sky-600/20 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                t('login.entrar')
                            )}
                        </button>
                    </form>
                </div>
                <p className="text-center text-slate-400 text-xs mt-6">© 2026 HWC Limpieza · Texas</p>
            </div>
        </div>
    );
}