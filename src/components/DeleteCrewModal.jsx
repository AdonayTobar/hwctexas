// src/components/DeleteCrewModal.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { useToast } from '../context/ToastContext';

export default function DeleteCrewModal({ isOpen, onClose, crewId, profile, navigate }) {
    const { t } = useI18n();
    const { eliminarCuadrilla } = useData();
    const { showToast } = useToast();
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async () => {
        if (!pass) return showToast(t('err.passwordIncorrecta'));
        setLoading(true);
        try {
            const { error: authError } = await supabase.auth.signInWithPassword({ email: profile.email, password: pass });
            if (authError) {
                showToast(t('err.passwordIncorrecta'));
                setLoading(false);
                return;
            }
            await eliminarCuadrilla(crewId);
            showToast(t('toast.crewEliminada'));
            onClose();
            navigate('cuadrillas');
        } catch (err) {
            console.error(err);
            showToast(t('err.delCrew'));
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white rounded-3xl w-full max-w-md pop max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <h3 className="font-extrabold text-lg leading-tight text-rose-600">🗑️ Eliminar Cuadrilla</h3>
                    <button onClick={onClose} className="w-9 h-9 shrink-0 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xl transition">✕</button>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
                    Se eliminarán las jornadas asociadas. Las propiedades y servicios historicos se conservarán pero quedarán sin cuadrilla.
                </div>
                <div>
                    <label className="lbl">{t('del.modal.password')}</label>
                    <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder={t('del.modal.passwordPh')} className="inp mt-1" />
                </div>
                <div className="flex justify-end gap-3 pt-1">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm hover:bg-slate-50 transition">{t('comun.cancelar')}</button>
                    <button onClick={handleDelete} disabled={loading} className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl shadow transition active:scale-95 disabled:opacity-50">
                        {loading ? 'Eliminando...' : t('del.modal.btn')}
                    </button>
                </div>
            </div>
        </div>
    );
}