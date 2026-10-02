// src/components/PropertyCard.jsx
import { useI18n } from '../i18n/LanguageContext';
import { calcMensual, fmtMon } from '../lib/helpers';

const PALETA = {
    'Azul': { chip: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
    'Negro': { chip: 'bg-slate-900 text-white', dot: 'bg-slate-900' },
    'Morado': { chip: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
    'Amarillo': { chip: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' },
    'Gris': { chip: 'bg-slate-200 text-slate-700', dot: 'bg-slate-500' },
    'Teal': { chip: 'bg-teal-100 text-teal-800', dot: 'bg-teal-500' },
    'Indigo': { chip: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
    'Rosa': { chip: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
    'Verde': { chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' }
};

export default function PropertyCard({ p, crew, esAdmin, navigate, onAssign }) {
    const { t } = useI18n();
    const crewColor = PALETA[crew?.color] || { chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' };

    return (
        <div
            onClick={() => navigate('propiedad_detalle', p.id)}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col gap-2 hover:shadow-md transition cursor-pointer min-w-0 w-full"
        >
            <div className="flex items-start justify-between gap-2 min-w-0">
                <div className="min-w-0">
                    <p className="font-bold text-sm leading-tight truncate">{p.nombre}</p>
                    <p className="text-[11px] text-slate-400 truncate">{p.ciudad}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${p.estado === 'Activa' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    ● {t('estadoProp.' + p.estado)}
                </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${p.servicio === 'Porter' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'}`}>{p.servicio}</span>
                {p.cuadrilla ? (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold min-w-0 ${crewColor.chip}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${crewColor.dot}`}></span>
                        <span className="truncate">{p.cuadrilla}</span>
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 italic shrink-0">⚠️ Sin asignar</span>
                )}
                {esAdmin && onAssign && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAssign(p.id); }}
                        className="text-slate-300 hover:text-sky-600 transition text-sm font-bold p-1 rounded-lg hover:bg-slate-100 shrink-0"
                        title="Asignar/Cambiar cuadrilla"
                    >⚙️</button>
                )}
            </div>

            <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-slate-100 min-w-0">
                <div className="flex gap-1 shrink-0">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                        <span key={d} className={`inline-flex w-4 h-4 items-center justify-center rounded-full text-[8px] font-bold ${String(p.dias || '').indexOf(d) >= 0 ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-300'}`}>{d}</span>
                    ))}
                </div>
                {esAdmin ? (
                    <p className="text-xs font-bold text-slate-500 truncate">{fmtMon(calcMensual(p))}{t('prop.porMes')}</p>
                ) : (
                    <span className="text-xs text-slate-400 italic truncate">{t('prop.costoOculto')}</span>
                )}
            </div>
        </div>
    );
}