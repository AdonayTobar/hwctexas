// src/views/CrewForm.jsx
import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { useToast } from '../context/ToastContext';

const PALETA = {
    'Azul': 'Azul', 'Negro': 'Negro', 'Morado': 'Morado', 'Amarillo': 'Amarillo', 'Gris': 'Gris', 'Teal': 'Teal', 'Indigo': 'Indigo', 'Rosa': 'Rosa', 'Verde': 'Verde'
};

export default function CrewForm({ profile, crewId, navigate }) {
    const { t } = useI18n();
    const { crews, guardarCuadrilla } = useData();
    const { showToast } = useToast();

    const c = useMemo(() => crews.find(x => x.id === crewId), [crews, crewId]);

    const [form, setForm] = useState({
        nombre: c?.nombre || '',
        ciudad: c?.ciudad || 'Austin',
        responsable: c?.responsable || '',
        telefono: c?.telefono || '',
        color: c?.color || 'Azul',
        notas: c?.notas || ''
    });

    const ciudades = ['Austin', 'Houston', 'Dallas', 'College Station', 'San Antonio', 'Beaumont'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!form.nombre) return showToast(t('err.nombreObligatorio'));
        try {
            await guardarCuadrilla(form, crewId);
            showToast(crewId ? t('toast.crewActualizada') : t('toast.crewCreada'));
            navigate('cuadrillas');
        } catch (err) {
            console.error(err);
            showToast(crewId ? t('err.actualizar') : t('err.crear'));
        }
    };

    return (
        <div className="anim max-w-2xl space-y-4 min-w-0">
            <h2 className="font-extrabold text-lg">{c ? t('crew.formEditar') : t('crew.formNueva')}</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="lbl">{t('crew.fNombre')}</label>
                        <input name="nombre" value={form.nombre} onChange={handleChange} placeholder={t('crew.fNombrePh')} className="inp" />
                    </div>
                    <div>
                        <label className="lbl">{t('comun.ciudad')}</label>
                        <select name="ciudad" value={form.ciudad} onChange={handleChange} className="inp bg-white">
                            {ciudades.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="lbl">{t('crew.fResponsable')}</label>
                        <input name="responsable" value={form.responsable} onChange={handleChange} className="inp" />
                    </div>
                    <div>
                        <label className="lbl">{t('crew.fTelefono')}</label>
                        <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="(713) 555-0000" className="inp" />
                    </div>
                    <div>
                        <label className="lbl">{t('crew.fColor')}</label>
                        <select name="color" value={form.color} onChange={handleChange} className="inp bg-white">
                            {Object.keys(PALETA).map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="lbl">{t('comun.notas')}</label>
                    <textarea name="notas" rows="2" value={form.notas} onChange={handleChange} className="inp resize-none"></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => navigate('cuadrillas')} className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold text-sm hover:bg-slate-50 transition">{t('comun.cancelar')}</button>
                    <button onClick={handleSave} className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl shadow transition active:scale-95">{t('comun.guardar')}</button>
                </div>
            </div>
        </div>
    );
}