// src/context/DataContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { fechaISO } from '../lib/helpers';

const DataContext = createContext();

export function DataProvider({ children }) {
    const [props, setProps] = useState([]);
    const [crews, setCrews] = useState([]);
    const [jornadas, setJornadas] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [jornadasVirtuales, setJornadasVirtuales] = useState([]);
    const [leidos, setLeidos] = useState(() => {
        try { return JSON.parse(localStorage.getItem('hwc_leidos') || '[]'); } catch (e) { return []; }
    });

    useEffect(() => {
        localStorage.setItem('hwc_leidos', JSON.stringify(leidos));
    }, [leidos]);

    const fetchAll = async (table, selectQuery) => {
        const PAGE_SIZE = 1000;
        let allData = [];
        let start = 0;
        while (true) {
            const { data, error } = await supabase.from(table).select(selectQuery).range(start, start + PAGE_SIZE - 1);
            if (error) { console.error(`Error en ${table}:`, error); return []; }
            allData = allData.concat(data);
            if (data.length < PAGE_SIZE) break;
            start += PAGE_SIZE;
        }
        return allData;
    };

    const loadData = async () => {
        setLoadingData(true);
        const crewsData = await fetchAll('crews', '*');
        const crewsMapped = (crewsData || []).map(c => ({ id: c.id, nombre: c.name, ciudad: c.city, color: c.color, responsable: c.responsable, telefono: c.telefono, notas: c.notas }));
        setCrews(crewsMapped);

        const propsData = await fetchAll('properties', '*');
        const propsMapped = (propsData || []).map(p => ({
            id: p.id, code: p.code, nombre: p.name, servicio: p.service, ciudad: p.city,
            crew_id: p.crew_id || null, cuadrilla: crewsMapped.find(c => c.id === p.crew_id)?.nombre || '',
            contratista: p.contractor, dias: p.days, frecuenciaTipo: p.frequency_type,
            diasMensual: p.days_monthly || [], diasMensualFechas: p.days_monthly_dates || [],
            ciclo: p.cycle, pattern: p.pattern, costoTipo: p.cost_type, costoMonto: p.cost_amount,
            visitasMes: p.visits_month, estado: p.status, fecha: p.fecha, gate: p.gate, dump: p.dump, notas: p.notas
        }));
        setProps(propsMapped);

        const jornadasData = await fetchAll('journeys', '*, journey_items(*)');
        const jornadasMapped = (jornadasData || []).map(j => ({
            id: j.id, cuadrilla: crewsMapped.find(c => c.id === j.crew_id)?.nombre || '',
            fecha: j.fecha, fechaFin: j.fecha_fin, nombre: j.name, notas: j.notas,
            creadaPor: j.created_by, creadaPorRol: j.created_by_role, ts: j.ts ? j.ts : Date.parse(j.created_at),
            items: (j.journey_items || []).map(it => ({ id: it.id, propId: it.property_id, estado: it.status, servId: it.service_id, pospFecha: it.posp_fecha, pospMotivo: it.posp_motivo, pospPor: it.posp_por }))
        }));
        setJornadas(jornadasMapped);

        const servsData = await fetchAll('services', '*').then(data => data.filter(s => !s.deleted_at));
        const servsMapped = (servsData || []).map(s => ({
            id: s.id, propId: s.property_id, fecha: s.fecha, estado: s.status,
            cuadrilla: crewsMapped.find(c => c.id === s.crew_id)?.nombre || '',
            notas: s.notas, por: s.por, ts: s.ts ? s.ts : Date.parse(s.created_at)
        }));
        setServicios(servsMapped);
        setLoadingData(false);
    };

    // Funciones de Reportes (Global)
    const esReporte = (s) => (s.notas && s.notas.trim() !== '') || s.estado !== 'Completado';
    const estaLeido = (s, userName) => leidos.includes(s.id) || s.por === userName;
    const getPendientesRep = (userName) => servicios.filter(s => esReporte(s) && !estaLeido(s, userName)).length;
    const marcarLeido = (id) => setLeidos(prev => [...new Set([...prev, id])]);
    const marcarTodosLeidos = (ids) => setLeidos(prev => [...new Set([...prev, ...ids])]);

    // Funciones de Propiedades
    const actualizarPropiedad = async (propId, newStatus) => {
        const { error } = await supabase.from('properties').update({ status: newStatus }).eq('id', propId);
        if (error) throw error;
        setProps(prev => prev.map(p => p.id === propId ? { ...p, estado: newStatus } : p));
    };
    const eliminarPropiedad = async (propId) => {
        await supabase.from('services').delete().eq('property_id', propId);
        await supabase.from('journey_items').delete().eq('property_id', propId);
        const { error } = await supabase.from('properties').delete().eq('id', propId);
        if (error) throw error;
        setProps(prev => prev.filter(p => p.id !== propId));
        setServicios(prev => prev.filter(s => s.propId !== propId));
        setJornadas(prev => prev.map(j => ({ ...j, items: j.items.filter(it => it.propId !== propId) })));
    };

    // Función para archivar (borrar lógicamente) un reporte
    const eliminarReporte = async (servId, userName) => {
        const { error } = await supabase.from('services').update({
            deleted_by: userName,
            deleted_at: new Date().toISOString()
        }).eq('id', servId);
        if (error) throw error;
        // Lo quitamos de la memoria de React para que desaparezca de la vista al instante
        setServicios(prev => prev.filter(s => s.id !== servId));
    };
    const guardarPropiedad = async (data, propId) => {
        const payload = {
            name: data.nombre, service: data.servicio, city: data.ciudad, contractor: data.contratista,
            crew_id: data.crew_id || null, days: data.dias, frequency_type: data.frecuenciaTipo,
            days_monthly: data.diasMensual || [], days_monthly_dates: data.diasMensualFechas || [],
            cycle: data.ciclo || '', pattern: data.pattern || '', cost_type: data.costoTipo,
            cost_amount: Number(data.costoMonto) || 0, visits_month: Number(data.visitasMes) || 0,
            status: data.estado, fecha: data.fecha || fechaISO(new Date()), gate: data.gate, dump: data.dump, notas: data.notas
        };
        if (propId) {
            const { error } = await supabase.from('properties').update(payload).eq('id', propId);
            if (error) throw error;
            setProps(prev => prev.map(p => p.id === propId ? { ...p, ...data } : p));
        } else {
            const { data: newProp, error } = await supabase.from('properties').insert(payload).select().single();
            if (error) throw error;
            const crewObj = crews.find(c => c.id === newProp.crew_id);
            const mapped = { ...newProp, nombre: newProp.name, servicio: newProp.service, ciudad: newProp.city, contratista: newProp.contractor, cuadrilla: crewObj?.nombre || '', dias: newProp.days, frecuenciaTipo: newProp.frequency_type, diasMensual: newProp.days_monthly || [], diasMensualFechas: newProp.days_monthly_dates || [], ciclo: newProp.cycle, pattern: newProp.pattern, costoTipo: newProp.cost_type, costoMonto: newProp.cost_amount, visitasMes: newProp.visits_month, estado: newProp.status, fecha: newProp.fecha, gate: newProp.gate, dump: newProp.dump, notas: newProp.notas };
            setProps(prev => [...prev, mapped]);
            return mapped.id;
        }
    };
    const asignarCuadrillaPropiedad = async (propId, crewId) => {
        const { error } = await supabase.from('properties').update({ crew_id: crewId || null }).eq('id', propId);
        if (error) throw error;
        const crewObj = crews.find(c => c.id === crewId);
        setProps(prev => prev.map(p => p.id === propId ? { ...p, crew_id: crewId || null, cuadrilla: crewObj?.nombre || '' } : p));
    };
    const asignarCuadrillaFecha = async (propId, crewId, fecha) => {
        const crewObj = crews.find(c => c.id === crewId);
        if (!crewObj) throw new Error("Cuadrilla no encontrada");
        let j = jornadas.find(x => x.cuadrilla === crewObj.nombre && x.fecha === fecha);
        let realJourId = j?.dbId || j?.id;
        if (!realJourId || /^J-\d+$/.test(realJourId)) {
            const { data: newJ, error } = await supabase.from('journeys').insert({ crew_id: crewId, fecha: fecha, fecha_fin: null, name: 'Ruta asignada (' + fecha + ')', notas: 'Generada desde asignación rápida', created_by: 'Sistema', created_by_role: 'Admin' }).select().single();
            if (error) throw error;
            realJourId = newJ.id;
            const newJornada = { ...newJ, cuadrilla: crewObj.nombre, fechaFin: null, nombre: newJ.name, notas: newJ.notas, creadaPor: 'Sistema', creadaPorRol: 'Admin', ts: Date.now(), items: [] };
            setJornadas(prev => [...prev, newJornada]);
            j = newJornada;
        }
        if (j && j.items.some(it => it.propId === propId)) return;
        const { data: newItem, error: err2 } = await supabase.from('journey_items').insert({ journey_id: realJourId, property_id: propId, status: 'Pendiente' }).select().single();
        if (err2) throw err2;
        setJornadas(prev => prev.map(jor => (jor.id === j.id || jor.dbId === realJourId) ? { ...jor, items: [...jor.items, { id: newItem.id, propId, estado: 'Pendiente', servId: null, pospFecha: '', pospMotivo: '', pospPor: '' }] } : jor));
    };

    // Funciones de Cuadrillas
    const guardarCuadrilla = async (data, crewId) => {
        const payload = { name: data.nombre, city: data.ciudad, color: data.color, responsable: data.responsable, telefono: data.telefono, notas: data.notas };
        if (crewId) {
            const { error } = await supabase.from('crews').update(payload).eq('id', crewId);
            if (error) throw error;
            const oldName = crews.find(c => c.id === crewId)?.nombre;
            setCrews(prev => prev.map(c => c.id === crewId ? { ...c, ...data, nombre: data.nombre } : c));
            if (oldName && oldName !== data.nombre) {
                setProps(prev => prev.map(p => p.cuadrilla === oldName ? { ...p, cuadrilla: data.nombre } : p));
                setJornadas(prev => prev.map(j => j.cuadrilla === oldName ? { ...j, cuadrilla: data.nombre } : j));
                setServicios(prev => prev.map(s => s.cuadrilla === oldName ? { ...s, cuadrilla: data.nombre } : s));
            }
        } else {
            const { data: newCrew, error } = await supabase.from('crews').insert(payload).select().single();
            if (error) throw error;
            setCrews(prev => [...prev, { id: newCrew.id, nombre: newCrew.name, ciudad: newCrew.city, color: newCrew.color, responsable: newCrew.responsable, telefono: newCrew.telefono, notas: newCrew.notas }]);
            return newCrew.id;
        }
    };
    const eliminarCuadrilla = async (crewId) => {
        const { data: jData } = await supabase.from('journeys').select('id').eq('crew_id', crewId);
        const jIds = jData?.map(j => j.id) || [];
        if (jIds.length) await supabase.from('journey_items').delete().in('journey_id', jIds);
        await supabase.from('journeys').delete().eq('crew_id', crewId);
        await supabase.from('properties').update({ crew_id: null }).eq('crew_id', crewId);
        await supabase.from('services').update({ crew_id: null }).eq('crew_id', crewId);
        const { error } = await supabase.from('crews').delete().eq('id', crewId);
        if (error) throw error;
        const crew = crews.find(c => c.id === crewId);
        const crewName = crew?.nombre;
        setCrews(prev => prev.filter(c => c.id !== crewId));
        setProps(prev => prev.map(p => p.cuadrilla === crewName ? { ...p, cuadrilla: '', crew_id: null } : p));
        setJornadas(prev => prev.filter(j => j.cuadrilla !== crewName));
        setServicios(prev => prev.map(s => s.cuadrilla === crewName ? { ...s, cuadrilla: '' } : s));
    };

    // Funciones de Jornadas/Servicios
    const asegurarJornadaEnNube = async (jourId) => {
        const j = [...jornadas, ...jornadasVirtuales].find(x => x.id === jourId);
        if (!j) return null;
        if (j.dbId) return j.dbId;
        if (!/^J-\d+$/.test(jourId)) return jourId;
        const crewObj = crews.find(c => c.nombre === j.cuadrilla);
        if (!crewObj) return null;
        const { data: newJ, error } = await supabase.from('journeys').insert({ crew_id: crewObj.id, fecha: j.fecha, fecha_fin: j.fechaFin || null, name: j.nombre, notas: j.notas, created_by: j.creadaPor, created_by_role: j.creadaPorRol }).select().single();
        if (error) return null;
        const itemsToInsert = j.items.map(it => ({ journey_id: newJ.id, property_id: it.propId, status: it.estado }));
        const { data: newItems } = await supabase.from('journey_items').insert(itemsToInsert).select();
        const updateFunc = (x) => x.id === jourId ? { ...x, dbId: newJ.id, items: x.items.map(it => { const dbIt = newItems?.find(ni => ni.property_id === it.propId); return dbIt ? { ...it, id: dbIt.id } : it; }) } : x;
        const virt = jornadasVirtuales.find(x => x.id === jourId);
        if (virt) { const real = updateFunc(virt); setJornadas(prev => [...prev, real]); setJornadasVirtuales(prev => prev.filter(x => x.id !== jourId)); }
        else if (jornadas.find(x => x.id === jourId)) setJornadas(prev => prev.map(updateFunc));
        return newJ.id;
    };
    const registrarServicio = async (servData, jourId) => {
        const { data: newServ, error } = await supabase.from('services').insert(servData).select().single();
        if (error) throw error;
        const serv = { id: newServ.id, propId: newServ.property_id, fecha: newServ.fecha, estado: newServ.status, cuadrilla: crews.find(c => c.id === newServ.crew_id)?.nombre || '', notas: newServ.notas, por: newServ.por, ts: Date.now() };
        setServicios(prev => [...prev, serv]);
        if (jourId) {
            const realJourId = await asegurarJornadaEnNube(jourId);
            if (realJourId) {
                await supabase.from('journey_items').update({ status: 'Hecho', service_id: newServ.id }).eq('journey_id', realJourId).eq('property_id', servData.property_id);
                const upd = (j) => (j.id === jourId || j.id === realJourId) ? { ...j, items: j.items.map(it => it.propId === servData.property_id ? { ...it, estado: 'Hecho', servId: newServ.id } : it) } : j;
                setJornadas(prev => prev.map(upd));
                setJornadasVirtuales(prev => prev.map(upd));
            }
        }
    };
    const posponerServicio = async (propId, jourId, fecha, motivo, userName) => {
        const realJourId = await asegurarJornadaEnNube(jourId);
        if (realJourId) {
            await supabase.from('journey_items').update({ status: 'Pospuesto', posp_fecha: fecha, posp_motivo: motivo, posp_por: userName }).eq('journey_id', realJourId).eq('property_id', propId);
            const upd = (j) => (j.id === jourId || j.id === realJourId) ? { ...j, items: j.items.map(it => it.propId === propId ? { ...it, estado: 'Pospuesto', pospFecha: fecha, pospMotivo: motivo, pospPor: userName } : it) } : j;
            setJornadas(prev => prev.map(upd));
            setJornadasVirtuales(prev => prev.map(upd));
        }
    };
    const crearReportePropiedad = async (propId, notas, crewId, userName) => {
        const newServData = { property_id: propId, fecha: fechaISO(new Date()), status: 'Reporte', crew_id: crewId || null, notas: notas.trim(), por: userName };
        const { data: newServ, error } = await supabase.from('services').insert(newServData).select().single();
        if (error) throw error;
        const serv = { id: newServ.id, propId: newServ.property_id, fecha: newServ.fecha, estado: newServ.status, cuadrilla: crews.find(c => c.id === newServ.crew_id)?.nombre || '', notas: newServ.notas, por: newServ.por, ts: Date.now() };
        setServicios(prev => [...prev, serv]);
    };

    return (
        <DataContext.Provider value={{
            props, crews, jornadas, servicios, loadingData, loadData,
            setProps, setCrews, setJornadas, setServicios,
            registrarServicio, posponerServicio, crearReportePropiedad,
            actualizarPropiedad, eliminarPropiedad, guardarPropiedad,
            asignarCuadrillaPropiedad, asignarCuadrillaFecha,
            guardarCuadrilla, eliminarCuadrilla,
            jornadasVirtuales, setJornadasVirtuales,
            leidos, esReporte, estaLeido, getPendientesRep, marcarLeido, marcarTodosLeidos, eliminarReporte
        }}>
            {children}
        </DataContext.Provider>
    );
}
export const useData = () => useContext(DataContext);