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
import './VentaGanado.css'
import { post, get } from './api.js'
import { VALIDATION_RANGES, isFutureDate, isNumberInRange, isValidFreeText, hasWhitespaceIssues } from './formValidation.js'

const OPCIONES_FORMA_PAGO = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia bancaria' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'credito', label: 'Crédito' },
]

function VentaGanado() {
    const [toast, setToast] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [animales, setAnimales] = useState([])
    const [campos, setCampos] = useState({
        animalId: '',
        fechaVenta: '',
        comprador: '',
        precioVenta: '',
        formaPago: '',
        observaciones: '',
    })
    const [errores, setErrores] = useState({
        animalId: false,
        fechaVenta: false,
        comprador: false,
        precioVenta: false,
        formaPago: false,
    })

    useEffect(() => {
        const cargarAnimales = async () => {
            try {
                const res = await get('/animales', { estado: 'activo' })
                setAnimales(res.data)
            } catch {
                setToast({ tipo: 'error', titulo: 'Error', mensaje: 'No se pudo cargar la lista de animales' })
            }
        }
        cargarAnimales()
    }, [])

    const handleChange = (campo) => (e) => {
        const valor = e.target.value
        setCampos((prev) => ({ ...prev, [campo]: valor }))
        if (campo in errores) {
            setErrores((prev) => ({ ...prev, [campo]: !valor }))
        }
    }

    const handleRegistrar = async () => {
        const fechaFutura = isFutureDate(campos.fechaVenta)
        const precioValido = isNumberInRange(campos.precioVenta, {
            min: VALIDATION_RANGES.PRECIO_COMPRA_VENTA.min,
            max: VALIDATION_RANGES.PRECIO_COMPRA_VENTA.max,
        })
        const compradorValido = isValidFreeText(campos.comprador, { required: true })
        const observacionesValidas = isValidFreeText(campos.observaciones)

        const nuevosErrores = {
            animalId:   !campos.animalId,
            fechaVenta: !campos.fechaVenta || fechaFutura,
            comprador:  !compradorValido,
            precioVenta:!campos.precioVenta || !precioValido,
            formaPago:  !campos.formaPago,
        }
        setErrores(nuevosErrores)

        if (Object.values(nuevosErrores).some(Boolean) || !observacionesValidas) {
            let mensaje = 'No se han ingresado los datos obligatorios.'
            if (fechaFutura) {
                mensaje = 'La fecha de venta no puede ser futura.'
            } else if (!compradorValido) {
                mensaje = hasWhitespaceIssues(campos.comprador)
                    ? 'El comprador no puede tener espacios al inicio, al final ni consecutivos.'
                    : 'El nombre del comprador debe tener al menos 2 caracteres.'
            } else if (!precioValido && campos.precioVenta) {
                mensaje = `El precio debe estar entre ${VALIDATION_RANGES.PRECIO_COMPRA_VENTA.min} y ${VALIDATION_RANGES.PRECIO_COMPRA_VENTA.max} COP.`
            } else if (!observacionesValidas) {
                mensaje = hasWhitespaceIssues(campos.observaciones)
                    ? 'Las observaciones no pueden tener espacios al inicio, al final ni consecutivos.'
                    : 'Las observaciones deben tener al menos 2 caracteres.'
            }
            setToast({ tipo: 'error', titulo: 'Error al registrar', mensaje })
            return
        }

        setCargando(true)
        try {
            await post('/ventas', {
                ...campos,
                precioVenta: Number(campos.precioVenta),
            })
            setToast({
                tipo: 'success',
                titulo: 'Venta registrada exitosamente',
                mensaje: 'La venta de ganado ha sido registrada y el animal fue marcado como vendido.',
            })
            setCampos({ animalId: '', fechaVenta: '', comprador: '', precioVenta: '', formaPago: '', observaciones: '' })
            // Recargar lista de animales activos tras la venta
            const res = await get('/animales', { estado: 'activo' })
            setAnimales(res.data)
        } catch (error) {
            setToast({ tipo: 'error', titulo: 'Error al registrar', mensaje: error.message })
        } finally {
            setCargando(false)
        }
    }

    const opcionesAnimales = animales.map((a) => ({
        value: a._id || a.id,
        label: `${a.identificacion} - ${a.nombre || 'Sin nombre'}`,
    }))

    return (
        <div className="venta-ganado">
            <Navegar />
            <Atras />
            <Contenedor width="auto" height="auto">
                <TituloPestana
                    imagen={imagenAdmin}
                    textoGrande="Registro de Venta de Ganado"
                    textoPequeno="Registre los datos de la venta del animal"
                    color="rgba(239, 68, 68, 0.25)"
                />

                <div className="formulario-grid">
                    <div className="formulario-full">
                        <Selector
                            label="Animal a vender *"
                            opciones={opcionesAnimales}
                            value={campos.animalId}
                            onChange={handleChange('animalId')}
                            error={errores.animalId}
                        />
                    </div>

                    <Entrada
                        label="Fecha de venta *"
                        type="date"
                        value={campos.fechaVenta}
                        onChange={handleChange('fechaVenta')}
                        error={errores.fechaVenta}
                    />
                    <Entrada
                        label="Comprador *"
                        texto="Ej: Finca Los Cedros"
                        value={campos.comprador}
                        onChange={handleChange('comprador')}
                        error={errores.comprador}
                    />

                    <Entrada
                        label="Precio de venta (COP) *"
                        texto="Ej: 3500000"
                        type="number"
                        value={campos.precioVenta}
                        onChange={handleChange('precioVenta')}
                        error={errores.precioVenta}
                        min={VALIDATION_RANGES.PRECIO_COMPRA_VENTA.min}
                        max={VALIDATION_RANGES.PRECIO_COMPRA_VENTA.max}
                    />
                    <Selector
                        label="Forma de pago *"
                        opciones={OPCIONES_FORMA_PAGO}
                        value={campos.formaPago}
                        onChange={handleChange('formaPago')}
                        error={errores.formaPago}
                    />

                    <div className="formulario-full">
                        <Entrada
                            label="Observaciones"
                            texto="Información adicional sobre la venta..."
                            value={campos.observaciones}
                            onChange={handleChange('observaciones')}
                        />
                    </div>
                </div>

                <BotonPestana
                    opcion={cargando ? 'Registrando...' : 'Registrar venta'}
                    imagen={imagenAdmin}
                    color="white"
                    backgroundColor="rgba(239, 68, 68, 0.95)"
                    onClick={handleRegistrar}
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

export default VentaGanado
