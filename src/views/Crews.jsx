// src/views/Crews.jsx
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';

const PALETA = {
    'Azul': { grad: 'from-sky-500 to-sky-600' },
    'Negro': { grad: 'from-slate-800 to-slate-950' },
    'Morado': { grad: 'from-violet-500 to-purple-600' },
    'Amarillo': { grad: 'from-amber-400 to-amber-500' },
    'Gris': { grad: 'from-slate-500 to-slate-600' },
    'Teal': { grad: 'from-teal-500 to-teal-600' },
    'Indigo': { grad: 'from-indigo-500 to-indigo-600' },
    'Rosa': { grad: 'from-rose-500 to-rose-600' },
    'Verde': { grad: 'from-emerald-500 to-teal-600' }
};

export default function Crews({ profile, navigate }) {
    const { t, tf } = useI18n();
    const { crews, props, jornadas } = useData();
    const esAdmin = profile?.rol === 'Admin';

    return (
        <div className="anim space-y-4 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold">{t('nav.cuadrillas')}</h1>
                    <p className="text-slate-500 text-sm mt-1">{tf('crew.nTotal', { n: crews.length })}</p>
                </div>
                {esAdmin && (
                    <button
                        onClick={() => navigate('cuadrilla_form', null)}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl shadow transition active:scale-95 text-sm"
                    >
                        {t('crew.nueva')}
                    </button>
                )}
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
                {crews.map(c => {
                    const s = PALETA[c.color] || { grad: 'from-slate-400 to-slate-500' };
                    const nP = props.filter(p => p.cuadrilla === c.nombre).length;
                    const nJ = jornadas.filter(j => j.cuadrilla === c.nombre).length;

                    return (
                        <button
                            key={c.id}
                            onClick={() => navigate('cuadrilla_detalle', c.id)}
                            className="text-left bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition min-w-0"
                        >
                            <div className={`h-2 bg-gradient-to-r ${s.grad}`}></div>
                            <div className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} text-white flex items-center justify-center font-extrabold text-sm shrink-0`}>
                                        {c.nombre.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm truncate">{c.nombre}</p>
                                        <p className="text-[11px] text-slate-400 truncate">{c.responsable || '—'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-3 text-xs text-slate-500 flex-wrap">
                                    <span>{tf('crew.nProps', { n: nP })}</span>
                                    <span>{tf('crew.nJornadas', { n: nJ })}</span>
                                    <span>📍 {c.ciudad}</span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}