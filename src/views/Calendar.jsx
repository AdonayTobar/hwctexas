// src/views/Calendar.jsx
import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { fechaISO, propTieneServicio } from '../lib/helpers';
import PropertyCard from '../components/PropertyCard';
import AssignCrewModal from '../components/AssignCrewModal';

const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
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

export default function Calendar({ profile, navigate }) {
    const { t, td, locale } = useI18n();
    const { props, crews, jornadas } = useData();

    const [calMes, setCalMes] = useState(new Date().getMonth());
    const [calAno, setCalAno] = useState(new Date().getFullYear());
    const [diaSel, setDiaSel] = useState(null);
    const [vista, setVista] = useState('todas');
    const [search, setSearch] = useState('');

    // Estado para el modal de asignar
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [activeProp, setActiveProp] = useState(null);

    const cambiarMes = (dir) => {
        let m = calMes + dir;
        let a = calAno;
        if (m < 0) { m = 11; a--; }
        else if (m > 11) { m = 0; a++; }
        setCalMes(m);
        setCalAno(a);
        setDiaSel(null);
    };

    const primerDia = new Date(calAno, calMes, 1);
    const ultimoDia = new Date(calAno, calMes + 1, 0);
    const startDay = (primerDia.getDay() + 6) % 7;
    const daysInMonth = ultimoDia.getDate();
    const hoy = fechaISO(new Date());

    const propsDelDia = useMemo(() => {
        if (!diaSel) return [];
        let arr = props.filter(p => propTieneServicio(p, diaSel, jornadas));
        if (search) {
            const q = search.toLowerCase();
            arr = arr.filter(p => p.nombre.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.cuadrilla && p.cuadrilla.toLowerCase().includes(q)));
        }
        return arr;
    }, [diaSel, props, jornadas, search]);

    const grupos = useMemo(() => {
        const g = {};
        propsDelDia.forEach(p => {
            const key = p.cuadrilla || '__SIN_ASIGNAR__';
            if (!g[key]) g[key] = [];
            g[key].push(p);
        });
        return Object.keys(g).sort((a, b) => {
            if (a === '__SIN_ASIGNAR__') return 1;
            if (b === '__SIN_ASIGNAR__') return -1;
            return a.localeCompare(b);
        }).map(key => ({ key, props: g[key] }));
    }, [propsDelDia]);

    let maxPropsMes = 1;
    for (let day = 1; day <= daysInMonth; day++) {
        const iso = `${calAno}-${String(calMes + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const count = props.filter(p => propTieneServicio(p, iso, jornadas)).length;
        if (count > maxPropsMes) maxPropsMes = count;
    }

    const getHeatColor = (count) => {
        if (count === 0) return 'bg-white';
        const ratio = count / maxPropsMes;
        if (ratio <= 0.25) return 'bg-emerald-50';
        if (ratio <= 0.50) return 'bg-amber-50';
        if (ratio <= 0.75) return 'bg-orange-100';
        return 'bg-rose-100';
    };

    return (
        <div className="anim space-y-4 min-w-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold capitalize">{new Date(calAno, calMes, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</h1>
                    <p className="text-slate-500 text-sm mt-1">{t('cal.subtitulo')}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => cambiarMes(-1)} className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold flex items-center justify-center transition active:scale-95">←</button>
                    <button onClick={() => cambiarMes(1)} className="w-10 h-10 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold flex items-center justify-center transition active:scale-95">→</button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-4 min-w-0">
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center min-w-0">
                    {DIAS.map(d => <span key={d} className="text-[11px] sm:text-xs font-bold text-slate-400">{td('diaCorto', d)}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-0">
                    {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} className="h-20 sm:h-28 bg-slate-50 rounded-lg"></div>)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const iso = `${calAno}-${String(calMes + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const propsHoy = props.filter(p => propTieneServicio(p, iso, jornadas));
                        const isSel = diaSel === iso;
                        const isHoy = iso === hoy;
                        const heatClass = getHeatColor(propsHoy.length);

                        return (
                            <button
                                key={day}
                                onClick={() => setDiaSel(isSel ? null : iso)}
                                className={`h-20 sm:h-28 rounded-lg border p-1 flex flex-col items-center justify-between transition text-left min-w-0 
                  ${isSel ? 'border-sky-500 ring-2 ring-sky-200 ' + heatClass :
                                        isHoy ? 'border-sky-200 ' + heatClass :
                                            'border-slate-100 hover:border-sky-300 ' + heatClass}`}
                            >
                                <span className={`text-[11px] sm:text-sm font-bold ${isHoy ? 'text-sky-600 bg-sky-100 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full' : 'text-slate-700'}`}>{day}</span>

                                {propsHoy.length > 0 && (
                                    <span className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded-full text-white mb-1 ${propsHoy.length / maxPropsMes > 0.75 ? 'bg-rose-500' :
                                        propsHoy.length / maxPropsMes > 0.50 ? 'bg-orange-500' :
                                            propsHoy.length / maxPropsMes > 0.25 ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`}>
                                        {propsHoy.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {diaSel ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mt-4 min-w-0">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                        <h3 className="font-extrabold capitalize flex items-center gap-2 text-lg">📅 {new Date(diaSel + 'T00:00:00').toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long' })}</h3>
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
                            <button onClick={() => setVista('todas')} className={`px-4 py-1.5 rounded-lg font-bold text-sm transition ${vista === 'todas' ? 'bg-sky-600 text-white shadow' : 'bg-white text-slate-500 border border-slate-200'}`}>{t('cal.btnTodas')}</button>
                            <button onClick={() => setVista('cuadrillas')} className={`px-4 py-1.5 rounded-lg font-bold text-sm transition ${vista === 'cuadrillas' ? 'bg-sky-600 text-white shadow' : 'bg-white text-slate-500 border border-slate-200'}`}>{t('cal.btnPorCuadrilla')}</button>
                            <button onClick={() => setVista('sinasignar')} className={`px-4 py-1.5 rounded-lg font-bold text-sm transition ${vista === 'sinasignar' ? 'bg-sky-600 text-white shadow' : 'bg-white text-slate-500 border border-slate-200'}`}>{t('cal.btnSinAsignar')}</button>
                        </div>
                    </div>

                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t('cal.buscarPh')}
                        className="w-full min-w-0 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 transition mb-3"
                    />

                    <p className="text-xs font-bold text-slate-400 uppercase mb-4">
                        {propsDelDia.length} {t('dash.stat.props')}
                    </p>

                    <div className="min-w-0">
                        {propsDelDia.length === 0 ? (
                            <p className="text-sm text-slate-400 p-4 text-center">{t('cal.sinCoincidencias')}</p>
                        ) : vista === 'todas' ? (
                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
                                {propsDelDia.map(p => (
                                    <PropertyCard
                                        key={p.id}
                                        p={p}
                                        crew={crews.find(c => c.nombre === p.cuadrilla)}
                                        esAdmin={profile?.rol === 'Admin'}
                                        navigate={navigate}
                                        onAssign={(id) => { setActiveProp(id); setShowAssignModal(true); }}
                                    />
                                ))}
                            </div>
                        ) : vista === 'sinasignar' ? (
                            <div className="min-w-0">
                                {propsDelDia.filter(p => !p.cuadrilla).length === 0 ? (
                                    <p className="text-sm text-emerald-600 p-4 text-center bg-emerald-50 rounded-xl">{t('cal.todasAsignadas')}</p>
                                ) : (
                                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
                                        {propsDelDia.filter(p => !p.cuadrilla).map(p => (
                                            <PropertyCard
                                                key={p.id}
                                                p={p}
                                                crew={null}
                                                esAdmin={profile?.rol === 'Admin'}
                                                navigate={navigate}
                                                onAssign={(id) => { setActiveProp(id); setShowAssignModal(true); }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 min-w-0">
                                {grupos.map(grupo => {
                                    const sinAsignar = grupo.key === '__SIN_ASIGNAR__';
                                    return (
                                        <details key={grupo.key} open className={`mb-4 rounded-2xl overflow-hidden min-w-0 ${sinAsignar ? 'border-2 border-dashed border-rose-300 bg-rose-50' : 'border border-slate-200 bg-white shadow-sm'}`}>
                                            <summary className={`p-4 flex items-center gap-2 cursor-pointer transition border-b border-slate-100 list-none min-w-0 ${sinAsignar ? 'hover:bg-rose-100' : 'hover:bg-slate-50'}`}>
                                                {sinAsignar ? (
                                                    <span className="font-extrabold text-rose-700 flex items-center gap-2">⚠️ Sin cuadrilla asignada <span className="text-rose-400 font-medium text-xs">({grupo.props.length})</span></span>
                                                ) : (
                                                    <>
                                                        {(() => {
                                                            const c = crews.find(cr => cr.nombre === grupo.key);
                                                            const s = c ? PALETA[c.color] : { chip: 'bg-slate-100 text-slate-600', dot: 'bg-slate-300' };
                                                            return <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${s.chip}`}><span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>{grupo.key}</span>;
                                                        })()}
                                                        <span className="text-xs font-bold text-slate-400">({grupo.props.length})</span>
                                                    </>
                                                )}
                                                <span className="ml-auto text-slate-300 text-sm shrink-0">▼ clic para minimizar</span>
                                            </summary>
                                            <div className={`p-4 grid md:grid-cols-2 xl:grid-cols-3 gap-3 min-w-0 ${sinAsignar ? '' : 'bg-slate-50'}`}>
                                                {grupo.props.map(p => (
                                                    <PropertyCard
                                                        key={p.id}
                                                        p={p}
                                                        crew={crews.find(c => c.nombre === p.cuadrilla)}
                                                        esAdmin={profile?.rol === 'Admin'}
                                                        navigate={navigate}
                                                        onAssign={(id) => { setActiveProp(id); setShowAssignModal(true); }}
                                                    />
                                                ))}
                                            </div>
                                        </details>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <p className="text-center text-sm text-slate-400 mt-4">{t('cal.tocaDia')}</p>
            )}

            {/* Modal de Asignación Rápida en Calendario */}
            <AssignCrewModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                propId={activeProp}
                profile={profile}
            />
        </div>
    );
}