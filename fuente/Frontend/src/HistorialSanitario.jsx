import { useState, useEffect } from 'react'
import Atras from '../modules/atras'
import Contenedor from '../modules/contenedor'
import Navegar from '../modules/navegar'
import TituloPestana from '../modules/tituloPestana'
import BotonPestana from '../modules/botonPestana'
import Selector from '../modules/seleccion'
import Aviso from '../modules/aviso.jsx'
import imagenPulse from '../images/pulseLine_black.svg'
import './HistorialSanitario.css'
import { get } from './api.js'

const formatFecha = (fecha) => {
    if (!fecha) return '—'
    return new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

const formatEnum = (valor) => {
    if (!valor) return '—'
    return valor.charAt(0).toUpperCase() + valor.slice(1).replace(/_/g, ' ')
}

function SeccionHistorial({ titulo, items, renderItem, columnas }) {
    return (
        <div className="seccion-historial">
            <h3 className="seccion-titulo">{titulo} <span className="seccion-cantidad">({items.length})</span></h3>
            {items.length === 0 ? (
                <p className="sin-registros">No hay registros disponibles para este animal.</p>
            ) : (
                <div className="tabla-historial-wrapper">
                    <table className="tabla-historial">
                        <thead>
                            <tr>
                                {columnas.map((col) => (
                                    <th key={col.header}>{col.header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={item._id || idx}>
                                    {columnas.map((col) => (
                                        <td key={col.header}>{col.render(item)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

function HistorialSanitario() {
    const [toast, setToast] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [animales, setAnimales] = useState([])
    const [animalId, setAnimalId] = useState('')
    const [errorAnimal, setErrorAnimal] = useState(false)
    const [historial, setHistorial] = useState(null)

    useEffect(() => {
        const cargarAnimales = async () => {
            try {
                const res = await get('/animales', { limit: 500 })
                setAnimales(res.data)
            } catch {
                setToast({ tipo: 'error', titulo: 'Error', mensaje: 'No se pudo cargar la lista de animales.' })
            }
        }
        cargarAnimales()
    }, [])

    const opcionesAnimales = animales.map((a) => ({
        value: a._id,
        label: `${a.identificacion}${a.nombre ? ' – ' + a.nombre : ''}`,
    }))

    const handleConsultar = async () => {
        if (!animalId) {
            setErrorAnimal(true)
            setToast({ tipo: 'error', titulo: 'Campo requerido', mensaje: 'Debe seleccionar un animal para consultar su historial sanitario.' })
            return
        }
        setErrorAnimal(false)
        setCargando(true)
        setHistorial(null)
        try {
            const res = await get('/historial-sanitario', { animalId })
            setHistorial(res.data)
        } catch (error) {
            setToast({ tipo: 'error', titulo: 'Error al consultar', mensaje: error.message })
        } finally {
            setCargando(false)
        }
    }

    const animal = historial?.animal

    const columnasEnfermedades = [
        { header: 'Fecha detección', render: (r) => formatFecha(r.fechaDeteccion) },
        { header: 'Enfermedad', render: (r) => formatEnum(r.enfermedad) },
        { header: 'Síntomas', render: (r) => r.sintomas || '—' },
        { header: 'Estado general', render: (r) => formatEnum(r.estadoGeneral) },
        { header: 'Estado actual', render: (r) => formatEnum(r.estadoActual) },
    ]

    const columnasTratamientos = [
        { header: 'Fecha inicio', render: (r) => formatFecha(r.fechaInicio) },
        { header: 'Medicamento', render: (r) => r.medicamento },
        { header: 'Dosis', render: (r) => r.dosis },
        { header: 'Frecuencia', render: (r) => formatEnum(r.frecuencia) },
        { header: 'Duración (días)', render: (r) => r.duracion ?? '—' },
        { header: 'Estado', render: (r) => formatEnum(r.estadoTratamiento) },
    ]

    const columnasActualizaciones = [
        { header: 'Fecha', render: (r) => formatFecha(r.fechaRegistro) },
        { header: 'Peso (kg)', render: (r) => r.peso ?? '—' },
        { header: 'Altura (cm)', render: (r) => r.altura ?? '—' },
        { header: 'Cond. corporal', render: (r) => r.condicionCorporal ?? '—' },
        { header: 'Producción leche (L/día)', render: (r) => r.produccionLeche ?? '—' },
        { header: 'Estado reproductivo', render: (r) => formatEnum(r.estadoReproductivo) },
    ]

    return (
        <div className="historial-sanitario">
            <Navegar />
            <Atras />
            <Contenedor width="auto" height="auto">
                <TituloPestana
                    imagen={imagenPulse}
                    textoGrande="Historial Sanitario"
                    textoPequeno="Consulte el historial de salud, tratamientos y evolución de cada animal"
                    color="rgba(99, 102, 241, 0.2)"
                />

                <div className="buscador-historial">
                    <div className="buscador-selector">
                        <Selector
                            label="Seleccionar animal"
                            opciones={opcionesAnimales}
                            value={animalId}
                            onChange={(e) => {
                                setAnimalId(e.target.value)
                                setErrorAnimal(false)
                                setHistorial(null)
                            }}
                            error={errorAnimal}
                        />
                    </div>
                    <BotonPestana
                        opcion={cargando ? 'Consultando...' : 'Consultar historial'}
                        imagen={imagenPulse}
                        color="white"
                        backgroundColor="rgba(99, 102, 241, 0.95)"
                        onClick={handleConsultar}
                        disabled={cargando}
                    />
                </div>

                {historial && (
                    <div className="resultado-historial">
                        <div className="animal-info-card">
                            <h3 className="animal-info-titulo">Información del animal</h3>
                            <div className="animal-info-grid">
                                <div className="animal-info-campo">
                                    <span className="campo-label">Identificación</span>
                                    <span className="campo-valor">{animal.identificacion}</span>
                                </div>
                                <div className="animal-info-campo">
                                    <span className="campo-label">Nombre</span>
                                    <span className="campo-valor">{animal.nombre || '—'}</span>
                                </div>
                                <div className="animal-info-campo">
                                    <span className="campo-label">Raza</span>
                                    <span className="campo-valor">{formatEnum(animal.raza)}</span>
                                </div>
                                <div className="animal-info-campo">
                                    <span className="campo-label">Sexo</span>
                                    <span className="campo-valor">{formatEnum(animal.sexo)}</span>
                                </div>
                                <div className="animal-info-campo">
                                    <span className="campo-label">Peso actual (kg)</span>
                                    <span className="campo-valor">{animal.peso ?? '—'}</span>
                                </div>
                                <div className="animal-info-campo">
                                    <span className="campo-label">Estado</span>
                                    <span className={`campo-valor estado-badge estado-${animal.estado}`}>{formatEnum(animal.estado)}</span>
                                </div>
                                <div className="animal-info-campo">
                                    <span className="campo-label">Fecha nacimiento</span>
                                    <span className="campo-valor">{formatFecha(animal.fechaNacimiento)}</span>
                                </div>
                                <div className="animal-info-campo">
                                    <span className="campo-label">Estado reproductivo</span>
                                    <span className="campo-valor">{formatEnum(animal.estadoReproductivo)}</span>
                                </div>
                            </div>
                        </div>

                        <SeccionHistorial
                            titulo="Enfermedades registradas"
                            items={historial.enfermedades}
                            columnas={columnasEnfermedades}
                        />
                        <SeccionHistorial
                            titulo="Tratamientos"
                            items={historial.tratamientos}
                            columnas={columnasTratamientos}
                        />
                        <SeccionHistorial
                            titulo="Actualizaciones mensuales"
                            items={historial.actualizaciones}
                            columnas={columnasActualizaciones}
                        />
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

export default HistorialSanitario
