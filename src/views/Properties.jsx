// src/views/Properties.jsx
import { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useI18n } from '../i18n/LanguageContext';
import { calcMensual, fmtMon } from '../lib/helpers';
import PropertyCard from '../components/PropertyCard';
import AssignCrewModal from '../components/AssignCrewModal';

export default function Properties({ profile, navigate, initialCity }) {
    const { t, tf } = useI18n();
    const { props, crews } = useData();

    const [filtros, setFiltros] = useState({ q: '', ciudad: initialCity || '', servicio: '', cuadrilla: '', estado: '' });
    const [orden, setOrden] = useState('ciudad');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [activeProp, setActiveProp] = useState(null);

    const esAdmin = profile?.rol === 'Admin';

    const arrFiltrado = useMemo(() => {
        let arr = props.filter(p => {
            if (filtros.q && (p.nombre + ' ' + p.id).toLowerCase().indexOf(filtros.q.toLowerCase()) < 0) return false;
            if (filtros.ciudad && p.ciudad !== filtros.ciudad) return false;
            if (filtros.servicio && String(p.servicio).indexOf(filtros.servicio) < 0) return false;
            if (filtros.cuadrilla && p.cuadrilla !== filtros.cuadrilla) return false;
            if (filtros.estado && p.estado !== filtros.estado) return false;
            return true;
        });

        if (orden === 'nombre') arr.sort((a, b) => a.nombre < b.nombre ? -1 : 1);
        else if (orden === 'costo') arr.sort((a, b) => calcMensual(b) - calcMensual(a));
        else arr.sort((a, b) => a.ciudad === b.ciudad ? (a.id < b.id ? -1 : 1) : (a.ciudad < b.ciudad ? -1 : 1));

        return arr;
    }, [props, filtros, orden]);

    const ciudades = [...new Set(props.map(p => p.ciudad))].sort();

    return (
        <div className="anim space-y-4 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <h1 className="text-2xl lg:text-3xl font-extrabold">{t('nav.propiedades')}</h1>
                    <p className="text-slate-500 text-sm mt-1">{tf('prop.registradasN', { n: props.length })}</p>
                </div>
                {esAdmin && (
                    <button
                        onClick={() => navigate('propiedad_form', null)}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl shadow transition active:scale-95 text-sm"
                    >
                        {t('prop.nueva')}
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3 min-w-0">
                <input
                    value={filtros.q}
                    onChange={e => setFiltros({ ...filtros, q: e.target.value })}
                    placeholder={t('prop.buscarPh')}
                    className="w-full min-w-0 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 transition"
                />
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 min-w-0">
                    <select value={filtros.ciudad} onChange={e => setFiltros({ ...filtros, ciudad: e.target.value })} className="w-full min-w-0 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="">{t('comun.filtroTodasCiudades')}</option>
                        {ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select value={filtros.servicio} onChange={e => setFiltros({ ...filtros, servicio: e.target.value })} className="w-full min-w-0 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="">{t('comun.filtroTodoServicio')}</option>
                        <option value="Porter">Porter</option>
                        <option value="Sweep">Sweep</option>
                    </select>

                    <select value={filtros.cuadrilla} onChange={e => setFiltros({ ...filtros, cuadrilla: e.target.value })} className="w-full min-w-0 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="">{t('comun.filtroTodaCuadrilla')}</option>
                        {crews.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                    </select>

                    <select value={filtros.estado} onChange={e => setFiltros({ ...filtros, estado: e.target.value })} className="w-full min-w-0 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="">{t('comun.filtroTodoEstado')}</option>
                        <option value="Activa">{t('estadoProp.Activa')}</option>
                        <option value="Suspendida">{t('estadoProp.Suspendida')}</option>
                    </select>

                    <select value={orden} onChange={e => setOrden(e.target.value)} className="w-full min-w-0 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-sky-500 col-span-2 lg:col-span-1">
                        <option value="ciudad">{t('prop.ordenCiudad')}</option>
                        <option value="nombre">{t('prop.ordenNombre')}</option>
                        <option value="costo">{t('prop.ordenCosto')}</option>
                    </select>
                </div>
            </div>

            <div className="min-w-0">
                {arrFiltrado.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
                        <p className="text-4xl mb-2">🔎</p>
                        <p className="font-semibold">{t('comun.sinResultados')}</p>
                        <p className="text-sm mt-1">{t('prop.ajustaFiltros')}</p>
                    </div>
                ) : (
                    <>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-3">
                            {tf('prop.nResultados', { n: arrFiltrado.length, s: arrFiltrado.length > 1 ? 's' : '' })}
                        </p>
                        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
                            {arrFiltrado.map(p => (
                                <PropertyCard
                                    key={p.id}
                                    p={p}
                                    crew={crews.find(c => c.nombre === p.cuadrilla)}
                                    esAdmin={esAdmin}
                                    navigate={navigate}
                                    onAssign={(id) => { setActiveProp(id); setShowAssignModal(true); }}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <AssignCrewModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                propId={activeProp}
                profile={profile}
            />
        </div>
    );
}