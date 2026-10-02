// src/lib/helpers.js
export const fechaISO = (d) => {
    var m = d.getMonth() + 1, dd = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd;
};

export const calcMensual = (p) => {
    var m = Number(p.costoMonto) || 0, v = Number(p.visitasMes) || 0;
    if (p.costoTipo === 'Por mes') return Math.round(m);
    if (p.costoTipo === 'Por semana') return Math.round(m * 4.33);
    if (p.costoTipo === 'Por vez') return Math.round(m * v);
    return 0;
};

export const fmtMon = (n) => '$' + Number(n).toLocaleString('en-US');

export const progresoJornada = (j) => {
    var h = 0, p = 0, x = 0;
    j.items.forEach(i => {
        if (i.estado === 'Hecho') h++;
        else if (i.estado === 'Pospuesto') p++;
        else x++;
    });
    return { hechas: h, posp: p, pend: x, total: j.items.length };
};

export const tieneServicioEseDia = (p, isoFecha) => {
    if (p.estado !== 'Activa') return false;
    var d = new Date(isoFecha + 'T00:00:00');
    var diaSemana = (d.getDay() + 6) % 7;
    var diaMes = d.getDate(); // El número del día del mes (1-31)
    var semanaDelMes = Math.ceil(diaMes / 7);
    var letraDia = 'LMXJVSD'[diaSemana];
    var tipo = p.frecuenciaTipo || 'Semanal';

    if (tipo === 'Semanal') {
        return String(p.dias || '').indexOf(letraDia) >= 0;
    }
    if (tipo === 'Mensual') { // 1er y 3er martes
        if (!p.diasMensual || p.diasMensual.length === 0) return false;
        if (p.diasMensual.indexOf(semanaDelMes + '-' + letraDia) >= 0) return true;
        if (p.diasMensual.indexOf('U-' + letraDia) >= 0) {
            var proximaSemana = new Date(d);
            proximaSemana.setDate(d.getDate() + 7);
            return proximaSemana.getMonth() !== d.getMonth();
        }
    }
    if (tipo === 'Mensual Fecha') { // Días 1 y 15
        if (!p.diasMensualFechas || p.diasMensualFechas.length === 0) return false;
        return p.diasMensualFechas.includes(diaMes);
    }
    return false;
};

export const propTieneServicio = (p, iso, jornadas) => {
    if (tieneServicioEseDia(p, iso)) return true;
    return jornadas.some(j => j.fecha === iso && j.items.some(it => it.propId === p.id));
};

export const datosDelDia = (iso, cuaFiltro, props, jornadas, servicios) => {
    var programadas = props.filter(p => {
        if (cuaFiltro && p.cuadrilla !== cuaFiltro) return false;
        return p.estado === 'Activa' && propTieneServicio(p, iso, jornadas);
    });

    var svHoy = servicios.filter(s => s.fecha === iso && (!cuaFiltro || s.cuadrilla === cuaFiltro));
    var idsHechas = {};
    svHoy.forEach(s => { idsHechas[s.propId] = 1; });

    var pospIds = {};
    jornadas.forEach(j => {
        if (j.fecha === iso && (!cuaFiltro || j.cuadrilla === cuaFiltro)) {
            j.items.forEach(it => {
                if (it.estado === 'Pospuesto') pospIds[it.propId] = 1;
            });
        }
    });

    var hechas = programadas.filter(p => idsHechas[p.id]);
    var pospuestas = programadas.filter(p => pospIds[p.id]);
    // Pendientes = los que no están hechos ni pospuestos
    var pendientes = programadas.filter(p => !idsHechas[p.id] && !pospIds[p.id]);

    var pct = programadas.length ? Math.round(hechas.length / programadas.length * 100) : 0;
    return { programadas, svHoy, hechas, pendientes, pospuestas, pct };
};


export const inicioDeSemanaISO = (iso) => {
    var d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return fechaISO(d);
};

export const puedeVerJornada = (j, profile) => {
    if (profile?.rol === 'Admin') return true;
    return (profile?.rol === 'Supervisor' || profile?.rol === 'Trabajador') && j.cuadrilla === profile?.cuadrilla;
};

// El motor que genera las jornadas automáticas en memoria
export const sincronizarRutasAutomaticas = (periodo, props, jornadasDB, t) => {
    const hoy = fechaISO(new Date());
    const fechasARevisar = [];

    if (periodo === 'hoy' || periodo === 'todas') {
        fechasARevisar.push(hoy);
    } else if (periodo === 'semana') {
        const d = new Date(hoy + 'T00:00:00');
        const lunes = new Date(d);
        lunes.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        for (let i = 0; i < 7; i++) {
            const f = new Date(lunes);
            f.setDate(lunes.getDate() + i);
            fechasARevisar.push(fechaISO(f));
        }
    }

    const combined = jornadasDB.map(j => ({ ...j, items: [...j.items] }));
    let max = 0;
    combined.forEach(x => { const m = /^J-(\d+)$/.exec(x.id); if (m) max = Math.max(max, +m[1]); });

    fechasARevisar.forEach(iso => {
        props.forEach(p => {
            if (p.estado === 'Activa' && p.cuadrilla && tieneServicioEseDia(p, iso)) {
                let j = combined.find(x => x.cuadrilla === p.cuadrilla && x.fecha === iso);
                if (!j) {
                    max++;
                    j = {
                        id: 'J-' + String(max).padStart(4, '0'),
                        cuadrilla: p.cuadrilla, fecha: iso, fechaFin: '',
                        nombre: p.cuadrilla, // <--- AHORA SE LLAMA COMO LA CUADRILLA
                        notas: t('jorn.notasAuto') || 'Generada por el sistema',
                        creadaPor: 'Sistema', creadaPorRol: 'Admin Oro',
                        items: [], ts: Date.now()
                    };
                    combined.push(j);
                }
                if (!j.items.some(it => it.propId === p.id)) {
                    j.items.push({ propId: p.id, estado: 'Pendiente', servId: null, pospFecha: '', pospMotivo: '', pospPor: '' });
                }
            }
        });
    });

    return combined;
};

export const puedeOperarJornada = (j, profile) => {
    if (profile?.rol === 'Admin') return true;
    return (profile?.rol === 'Supervisor' || profile?.rol === 'Trabajador') && j.cuadrilla === profile?.cuadrilla;
};

export const puedeEditarJornada = (j, profile) => {
    if (profile?.rol === 'Admin') return true;
    const esAutomatica = /^J-\d+$/.test(j.id);
    return puedeOperarJornada(j, profile) && !esAutomatica && j.creadaPor === profile?.nombre;
};

// Convierte los códigos de frecuencia a texto legible en inglés
export const formatFrequency = (p) => {
    const type = p.frecuenciaTipo || 'Semanal';
    if (type === 'Semanal') {
        return p.dias || '';
    }
    if (type === 'Mensual') {
        if (!p.diasMensual || p.diasMensual.length === 0) return '';
        const weekMap = { '1': '1st', '2': '2nd', '3': '3rd', '4': '4th', 'U': 'Last' };
        const dayMap = { 'L': 'Mon', 'M': 'Tue', 'X': 'Wed', 'J': 'Thu', 'V': 'Fri', 'S': 'Sat', 'D': 'Sun' };
        return p.diasMensual.map(code => {
            const parts = code.split('-');
            const week = weekMap[parts[0]] || parts[0];
            const day = dayMap[parts[1]] || parts[1];
            return `${week} ${day}`;
        }).join(', ');
    }
    if (type === 'Mensual Fecha') {
        if (!p.diasMensualFechas || p.diasMensualFechas.length === 0) return '';
        return p.diasMensualFechas.join(', ');
    }
    return '';
};