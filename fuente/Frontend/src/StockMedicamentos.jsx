import { useEffect, useState } from 'react'
import Atras from '../modules/atras'
import Contenedor from '../modules/contenedor'
import Navegar from '../modules/navegar'
import TituloPestana from '../modules/tituloPestana'
import BotonPestana from '../modules/botonPestana'
import Entrada from '../modules/Entrada'
import Selector from '../modules/seleccion'
import Aviso from '../modules/aviso.jsx'
import imagenPill from '../images/pill.svg'
import './StockMedicamentos.css'
import { get, patch } from './api.js'
import { VALIDATION_RANGES, isNumberInRange } from './formValidation.js'

function StockMedicamentos() {
    const [toast, setToast] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [medicamentos, setMedicamentos] = useState([])
    const [campos, setCampos] = useState({
        medicamentoId: '',
        nuevoStock: '',
    })
    const [errores, setErrores] = useState({
        medicamentoId: false,
        nuevoStock: false,
    })
    const [medicamentoSeleccionado, setMedicamentoSeleccionado] = useState(null)
    const [alertaBajoInventario, setAlertaBajoInventario] = useState(false)

    useEffect(() => {
        const cargarMedicamentos = async () => {
            try {
                const res = await get('/medicamentos', { limit: 200 })
                setMedicamentos(res.data)
            } catch {
                setToast({ tipo: 'error', titulo: 'Error', mensaje: 'No se pudo cargar la lista de medicamentos.' })
            }
        }
        cargarMedicamentos()
    }, [])

    const handleMedicamentoChange = (e) => {
        const id = e.target.value
        setCampos((prev) => ({ ...prev, medicamentoId: id, nuevoStock: '' }))
        setErrores((prev) => ({ ...prev, medicamentoId: !id }))
        setAlertaBajoInventario(false)
        const encontrado = medicamentos.find((m) => (m._id || m.id) === id)
        setMedicamentoSeleccionado(encontrado || null)
    }

    const handleChange = (campo) => (e) => {
        const valor = e.target.value
        setCampos((prev) => ({ ...prev, [campo]: valor }))
        if (campo in errores) {
            setErrores((prev) => ({ ...prev, [campo]: !valor }))
        }
    }

    const handleActualizar = async () => {
        const stockValido = isNumberInRange(campos.nuevoStock, {
            min: VALIDATION_RANGES.STOCK_MEDICAMENTO.min,
            max: VALIDATION_RANGES.STOCK_MEDICAMENTO.max,
            integer: true,
        })

        const nuevosErrores = {
            medicamentoId: !campos.medicamentoId,
            nuevoStock: campos.nuevoStock === '' || !stockValido,
        }
        setErrores(nuevosErrores)

        if (Object.values(nuevosErrores).some(Boolean)) {
            let mensaje = 'No se han ingresado los datos obligatorios.'
            if (!stockValido && campos.nuevoStock !== '') {
                mensaje = `El stock debe ser un número entero entre ${VALIDATION_RANGES.STOCK_MEDICAMENTO.min} y ${VALIDATION_RANGES.STOCK_MEDICAMENTO.max}.`
            }
            setToast({ tipo: 'error', titulo: 'Error al actualizar', mensaje })
            return
        }

        setCargando(true)
        setAlertaBajoInventario(false)
        try {
            const response = await patch(`/medicamentos/${campos.medicamentoId}/stock`, {
                stockActual: Number(campos.nuevoStock),
            })

            const esBajoInventario = response?.meta?.bajoInventario === true

            // Actualizar lista local con el dato nuevo
            setMedicamentos((prev) =>
                prev.map((m) =>
                    (m._id || m.id) === campos.medicamentoId
                        ? { ...m, stockActual: Number(campos.nuevoStock) }
                        : m
                )
            )
            setMedicamentoSeleccionado((prev) =>
                prev ? { ...prev, stockActual: Number(campos.nuevoStock) } : prev
            )

            if (esBajoInventario) {
                setAlertaBajoInventario(true)
            }

            setToast({
                tipo: esBajoInventario ? 'advertencia' : 'success',
                titulo: esBajoInventario ? 'Stock actualizado — Bajo inventario' : 'Stock actualizado exitosamente',
                mensaje: response.message,
            })
            setCampos((prev) => ({ ...prev, nuevoStock: '' }))
        } catch (error) {
            setToast({ tipo: 'error', titulo: 'Error al actualizar', mensaje: error.message })
        } finally {
            setCargando(false)
        }
    }

    const opcionesMedicamentos = medicamentos.map((m) => ({
        value: m._id || m.id,
        label: m.nombre,
    }))

    return (
        <div className="stock-medicamentos">
            <Navegar />
            <Atras />
            <Contenedor width="auto" height="auto">
                <TituloPestana
                    imagen={imagenPill}
                    textoGrande="Actualizar Stock de Medicamentos"
                    textoPequeno="Actualice la cantidad disponible de medicamentos en el inventario"
                    color="rgba(168, 85, 247, 0.2)"
                />

                <div className="formulario-grid">
                    <div className="formulario-full">
                        <Selector
                            label="Medicamento *"
                            opciones={opcionesMedicamentos}
                            value={campos.medicamentoId}
                            onChange={handleMedicamentoChange}
                            error={errores.medicamentoId}
                        />
                    </div>

                    {medicamentoSeleccionado && (
                        <div className="formulario-full info-medicamento">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Stock actual</span>
                                    <span className={`info-valor ${medicamentoSeleccionado.stockMinimo !== null && medicamentoSeleccionado.stockMinimo !== undefined && medicamentoSeleccionado.stockActual <= medicamentoSeleccionado.stockMinimo ? 'stock-bajo' : ''}`}>
                                        {medicamentoSeleccionado.stockActual} unidades
                                    </span>
                                </div>
                                {medicamentoSeleccionado.stockMinimo !== null && medicamentoSeleccionado.stockMinimo !== undefined && (
                                    <div className="info-item">
                                        <span className="info-label">Stock mínimo</span>
                                        <span className="info-valor">{medicamentoSeleccionado.stockMinimo} unidades</span>
                                    </div>
                                )}
                                <div className="info-item">
                                    <span className="info-label">Tipo</span>
                                    <span className="info-valor">{medicamentoSeleccionado.tipoMedicamento}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Presentación</span>
                                    <span className="info-valor">{medicamentoSeleccionado.presentacion}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <Entrada
                        label="Nuevo stock (unidades) *"
                        texto="Ej: 50"
                        type="text"
                        inputMode="numeric"
                        value={campos.nuevoStock}
                        onChange={handleChange('nuevoStock')}
                        error={errores.nuevoStock}
                        min={VALIDATION_RANGES.STOCK_MEDICAMENTO.min}
                        max={VALIDATION_RANGES.STOCK_MEDICAMENTO.max}
                    />
                </div>

                {alertaBajoInventario && medicamentoSeleccionado && (
                    <div className="alerta-inventario">
                        ⚠ Alerta de bajo inventario: el stock de <strong>{medicamentoSeleccionado.nombre}</strong> está
                        por debajo del mínimo establecido. Se recomienda reabastecer.
                    </div>
                )}

                <BotonPestana
                    opcion={cargando ? 'Actualizando...' : 'Actualizar stock'}
                    imagen={imagenPill}
                    color="white"
                    backgroundColor="rgba(168, 85, 247, 1)"
                    onClick={handleActualizar}
                    disabled={cargando}
                />

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

export default StockMedicamentos
