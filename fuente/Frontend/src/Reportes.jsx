import { useState, useEffect } from 'react'
import Atras from '../modules/atras'
import Contenedor from '../modules/contenedor'
import Navegar from '../modules/navegar'
import TituloPestana from '../modules/tituloPestana'
import BotonPestana from '../modules/botonPestana'
import Entrada from '../modules/Entrada'
import Selector from '../modules/seleccion'
import Aviso from '../modules/aviso.jsx'
import imagenAdmin from '../images/clipboard_Black.svg'
import './Reportes.css'
import { get } from './api.js'

// ─── Configuración de columnas por tipo de reporte ───────────────────────────
const COLUMNAS = {
    compras: [
        { header: 'Fecha', render: (r) => formatFecha(r.fechaCompra) },
        { header: 'Animal', render: (r) => r.animalId ? `${r.animalId.identificacion} – ${r.animalId.nombre || 'S/N'}` : '—' },
        { header: 'Proveedor', render: (r) => r.proveedor },
        { header: 'Precio (COP)', render: (r) => formatCOP(r.precioCompra) },
        { header: 'Forma de pago', render: (r) => formatEnum(r.formaPago) },
    ],
    ventas: [
        { header: 'Fecha', render: (r) => formatFecha(r.fechaVenta) },
        { header: 'Animal', render: (r) => r.animalId ? `${r.animalId.identificacion} – ${r.animalId.nombre || 'S/N'}` : '—' },
        { header: 'Comprador', render: (r) => r.comprador },
        { header: 'Precio (COP)', render: (r) => formatCOP(r.precioVenta) },
        { header: 'Forma de pago', render: (r) => formatEnum(r.formaPago) },
    ],
    inventario: [
        { header: 'ID', render: (r) => r.identificacion },
        { header: 'Nombre', render: (r) => r.nombre || '—' },
        { header: 'Raza', render: (r) => formatEnum(r.raza) },
        { header: 'Sexo', render: (r) => formatEnum(r.sexo) },
        { header: 'Peso (kg)', render: (r) => r.peso },
        { header: 'Estado', render: (r) => formatEnum(r.estado) },
    ],
    enfermedades: [
        { header: 'Fecha', render: (r) => formatFecha(r.fechaDeteccion) },
        { header: 'Animal', render: (r) => r.animalId ? `${r.animalId.identificacion} – ${r.animalId.nombre || 'S/N'}` : '—' },
        { header: 'Enfermedad', render: (r) => formatEnum(r.enfermedad) },
        { header: 'Estado general', render: (r) => formatEnum(r.estadoGeneral) },
        { header: 'Estado actual', render: (r) => formatEnum(r.estadoActual) },
    ],
    tratamientos: [
        { header: 'Fecha inicio', render: (r) => formatFecha(r.fechaInicio) },
        { header: 'Animal', render: (r) => r.animalId ? `${r.animalId.identificacion} – ${r.animalId.nombre || 'S/N'}` : '—' },
        { header: 'Medicamento', render: (r) => r.medicamento },
        { header: 'Dosis', render: (r) => r.dosis },
        { header: 'Estado', render: (r) => formatEnum(r.estadoTratamiento) },
    ],
    actualizaciones: [
        { header: 'Fecha', render: (r) => formatFecha(r.fechaRegistro) },
        { header: 'Animal', render: (r) => r.animalId ? `${r.animalId.identificacion} – ${r.animalId.nombre || 'S/N'}` : '—' },
        { header: 'Peso (kg)', render: (r) => r.peso },
        { header: 'Cond. corporal', render: (r) => r.condicionCorporal ?? '—' },
        { header: 'Estado reproductivo', render: (r) => formatEnum(r.estadoReproductivo) },
    ],
}

// Filtros adicionales disponibles según el tipo de reporte
const FILTROS_EXTRA = {
    inventario: ['raza', 'sexo', 'estado'],
    enfermedades: ['estado'],
    tratamientos: ['estado'],
    compras: [],
    ventas: [],
    actualizaciones: [],
}

const TIPOS_REPORTE = [
    { value: 'compras',        label: 'Compras de ganado' },
    { value: 'ventas',         label: 'Ventas de ganado' },
    { value: 'inventario',     label: 'Inventario animal' },
    { value: 'enfermedades',   label: 'Enfermedades' },
    { value: 'tratamientos',   label: 'Tratamientos' },
    { value: 'actualizaciones',label: 'Actualizaciones mensuales' },
]

const OPCIONES_RAZA = [
    { value: 'holstein', label: 'Holstein' }, { value: 'brahman', label: 'Brahman' },
    { value: 'angus', label: 'Angus' }, { value: 'hereford', label: 'Hereford' },
    { value: 'criollo', label: 'Criollo' }, { value: 'mestizo', label: 'Mestizo' },
]
const OPCIONES_SEXO = [
    { value: 'macho', label: 'Macho' }, { value: 'hembra', label: 'Hembra' },
]
const OPCIONES_ESTADO_ANIMAL = [
    { value: 'activo', label: 'Activo' }, { value: 'vendido', label: 'Vendido' },
]
const OPCIONES_ESTADO_ENFERMEDAD = [
    { value: 'activo', label: 'Activo' }, { value: 'recuperado', label: 'Recuperado' }, { value: 'fallecido', label: 'Fallecido' },
]
const OPCIONES_ESTADO_TRATAMIENTO = [
    { value: 'en_curso', label: 'En curso' }, { value: 'completado', label: 'Completado' },
    { value: 'suspendido', label: 'Suspendido' }, { value: 'actualizar', label: 'Actualizar existente' },
]

// ─── Helpers de formato ───────────────────────────────────────────────────────
const formatFecha = (val) => {
    if (!val) return '—'
    return new Date(val).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
const formatCOP = (val) => {
    if (val == null) return '—'
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}
const formatEnum = (val) => {
    if (!val) return '—'
    return val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Componente ──────────────────────────────────────────────────────────────
function Reportes() {
    const [toast, setToast] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [animales, setAnimales] = useState([])
    const [filtros, setFiltros] = useState({
        tipo: '',
        fechaInicio: '',
        fechaFin: '',
        animalId: '',
        raza: '',
        sexo: '',
        estado: '',
    })
    const [errores, setErrores] = useState({ tipo: false, fechas: false })
    const [resultado, setResultado] = useState(null)  // { titulo, total, data, message }

    useEffect(() => {
        const cargarAnimales = async () => {
            try {
                const res = await get('/animales', { limit: 200 })
                setAnimales(res.data)
            } catch {
                // Silencioso: el selector de animal simplemente estará vacío
            }
        }
        cargarAnimales()
    }, [])

    const handleChange = (campo) => (e) => {
        const valor = e.target.value
        setFiltros((prev) => ({ ...prev, [campo]: valor }))
        if (campo === 'tipo') {
            // Limpiar resultado y filtros extras al cambiar tipo
            setResultado(null)
            setFiltros((prev) => ({ ...prev, tipo: valor, raza: '', sexo: '', estado: '', animalId: '' }))
        }
        if (campo in errores) {
            setErrores((prev) => ({ ...prev, [campo]: false }))
        }
    }

    const handleGenerar = async () => {
        const rangoInvertido =
            filtros.fechaInicio && filtros.fechaFin && filtros.fechaInicio > filtros.fechaFin

        const nuevosErrores = {
            tipo: !filtros.tipo,
            fechas: rangoInvertido,
        }
        setErrores(nuevosErrores)

        if (nuevosErrores.tipo) {
            setToast({ tipo: 'error', titulo: 'Seleccione un tipo de reporte', mensaje: 'Debe indicar qué tipo de reporte desea generar.' })
            return
        }
        if (rangoInvertido) {
            setToast({ tipo: 'error', titulo: 'Rango de fechas inválido', mensaje: 'La fecha de inicio no puede ser mayor a la fecha de fin.' })
            return
        }

        setCargando(true)
        setResultado(null)
        try {
            const params = { tipo: filtros.tipo }
            if (filtros.fechaInicio) params.fechaInicio = filtros.fechaInicio
            if (filtros.fechaFin) params.fechaFin = filtros.fechaFin
            if (filtros.animalId) params.animalId = filtros.animalId
            if (filtros.raza) params.raza = filtros.raza
            if (filtros.sexo) params.sexo = filtros.sexo
            if (filtros.estado) params.estado = filtros.estado

            const res = await get('/reportes', params)
            setResultado(res)
        } catch (error) {
            setToast({ tipo: 'error', titulo: 'Error al generar el reporte', mensaje: error.message })
        } finally {
            setCargando(false)
        }
    }

    const opcionesAnimales = animales.map((a) => ({
        value: a._id || a.id,
        label: `${a.identificacion} – ${a.nombre || 'Sin nombre'}`,
    }))

    const filtrosExtra = filtros.tipo ? FILTROS_EXTRA[filtros.tipo] || [] : []
    const columnas = filtros.tipo ? COLUMNAS[filtros.tipo] || [] : []
    const mostrarAnimal = filtros.tipo && !['inventario'].includes(filtros.tipo)

    return (
        <div className="reportes">
            <Navegar />
            <Atras />
            <Contenedor width="auto" height="auto">
                <TituloPestana
                    imagen={imagenAdmin}
                    textoGrande="Reportes y Consultas"
                    textoPequeno="Genere reportes filtrados para analizar la información de la finca"
                    color="rgba(99, 102, 241, 0.25)"
                />

                {/* ── Filtros ── */}
                <div className="formulario-grid">
                    <div className="formulario-full">
                        <Selector
                            label="Tipo de reporte *"
                            opciones={TIPOS_REPORTE}
                            value={filtros.tipo}
                            onChange={handleChange('tipo')}
                            error={errores.tipo}
                        />
                    </div>

                    <Entrada
                        label="Fecha inicio"
                        type="date"
                        value={filtros.fechaInicio}
                        onChange={handleChange('fechaInicio')}
                        error={errores.fechas}
                    />
                    <Entrada
                        label="Fecha fin"
                        type="date"
                        value={filtros.fechaFin}
                        onChange={handleChange('fechaFin')}
                        error={errores.fechas}
                    />

                    {mostrarAnimal && (
                        <div className="formulario-full">
                            <Selector
                                label="Filtrar por animal (opcional)"
                                opciones={opcionesAnimales}
                                value={filtros.animalId}
                                onChange={handleChange('animalId')}
                            />
                        </div>
                    )}

                    {filtrosExtra.includes('raza') && (
                        <Selector label="Raza" opciones={OPCIONES_RAZA} value={filtros.raza} onChange={handleChange('raza')} />
                    )}
                    {filtrosExtra.includes('sexo') && (
                        <Selector label="Sexo" opciones={OPCIONES_SEXO} value={filtros.sexo} onChange={handleChange('sexo')} />
                    )}
                    {filtrosExtra.includes('estado') && filtros.tipo === 'inventario' && (
                        <Selector label="Estado" opciones={OPCIONES_ESTADO_ANIMAL} value={filtros.estado} onChange={handleChange('estado')} />
                    )}
                    {filtrosExtra.includes('estado') && filtros.tipo === 'enfermedades' && (
                        <Selector label="Estado actual" opciones={OPCIONES_ESTADO_ENFERMEDAD} value={filtros.estado} onChange={handleChange('estado')} />
                    )}
                    {filtrosExtra.includes('estado') && filtros.tipo === 'tratamientos' && (
                        <Selector label="Estado tratamiento" opciones={OPCIONES_ESTADO_TRATAMIENTO} value={filtros.estado} onChange={handleChange('estado')} />
                    )}
                </div>

                <BotonPestana
                    opcion={cargando ? 'Generando...' : 'Generar reporte'}
                    imagen={imagenAdmin}
                    color="white"
                    backgroundColor="rgba(99, 102, 241, 0.95)"
                    onClick={handleGenerar}
                    disabled={cargando}
                />

                {/* ── Resultados ── */}
                {resultado && (
                    <div className="reporte-resultados">
                        <div className="reporte-header">
                            <h3 className="reporte-titulo">{resultado.titulo}</h3>
                            <span className="reporte-total">{resultado.total} registro{resultado.total !== 1 ? 's' : ''}</span>
                        </div>

                        {resultado.total === 0 ? (
                            <div className="reporte-vacio">
                                <p>No hay información disponible para los filtros aplicados.</p>
                            </div>
                        ) : (
                            <div className="reporte-tabla-wrapper">
                                <table className="reporte-tabla">
                                    <thead>
                                        <tr>
                                            {columnas.map((col, i) => (
                                                <th key={i}>{col.header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resultado.data.map((fila, i) => (
                                            <tr key={i}>
                                                {columnas.map((col, j) => (
                                                    <td key={j}>{col.render(fila)}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {toast && (
                    <div className="toast-wrapper">
                        <Aviso
                            tipo={toast.tipo}
                            titulo={toast.titulo}
                            mensaje={toast.mensaje}
                            onClose={() => setToast(null)}
                        />
                    </div>
                )}
            </Contenedor>
        </div>
    )
}

export default Reportes
