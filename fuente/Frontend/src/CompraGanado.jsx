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
import './CompraGanado.css'
import { post, get } from './api.js'
import { VALIDATION_RANGES, isFutureDate, isNumberInRange } from './formValidation.js'

const OPCIONES_FORMA_PAGO = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia bancaria' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'credito', label: 'Crédito' },
]

function CompraGanado() {
    const [toast, setToast] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [animales, setAnimales] = useState([])
    const [campos, setCampos] = useState({
        animalId: '',
        fechaCompra: '',
        proveedor: '',
        precioCompra: '',
        formaPago: '',
        observaciones: '',
    })
    const [errores, setErrores] = useState({
        animalId: false,
        fechaCompra: false,
        proveedor: false,
        precioCompra: false,
        formaPago: false,
    })

    useEffect(() => {
        const cargarAnimales = async () => {
            try {
                const res = await get('/animales')
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
        const fechaFutura = isFutureDate(campos.fechaCompra)
        const precioValido = isNumberInRange(campos.precioCompra, {
            min: VALIDATION_RANGES.PRECIO_COMPRA_VENTA.min,
            max: VALIDATION_RANGES.PRECIO_COMPRA_VENTA.max,
        })

        const nuevosErrores = {
            animalId:    !campos.animalId,
            fechaCompra: !campos.fechaCompra || fechaFutura,
            proveedor:   !campos.proveedor?.trim(),
            precioCompra:!campos.precioCompra || !precioValido,
            formaPago:   !campos.formaPago,
        }
        setErrores(nuevosErrores)

        if (Object.values(nuevosErrores).some(Boolean)) {
            let mensaje = 'No se han ingresado los datos obligatorios.'
            if (fechaFutura) {
                mensaje = 'La fecha de compra no puede ser futura.'
            } else if (!precioValido && campos.precioCompra) {
                mensaje = `El precio debe estar entre ${VALIDATION_RANGES.PRECIO_COMPRA_VENTA.min} y ${VALIDATION_RANGES.PRECIO_COMPRA_VENTA.max} COP.`
            }
            setToast({ tipo: 'error', titulo: 'Error al registrar', mensaje })
            return
        }

        setCargando(true)
        try {
            await post('/compras', {
                ...campos,
                precioCompra: Number(campos.precioCompra),
            })
            setToast({
                tipo: 'success',
                titulo: 'Compra registrada exitosamente',
                mensaje: 'La compra de ganado ha sido registrada en el sistema.',
            })
            setCampos({ animalId: '', fechaCompra: '', proveedor: '', precioCompra: '', formaPago: '', observaciones: '' })
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
        <div className="compraganado">
            <Navegar />
            <Atras />
            <Contenedor width="auto" height="auto">
                <TituloPestana
                    imagen={imagenAdmin}
                    textoGrande="Registro de Compra de Ganado"
                    textoPequeno="Registre los datos de adquisición del animal"
                    color="rgba(34, 197, 94, 0.25)"
                />

                <div className="formulario-grid">
                    <div className="formulario-full">
                        <Selector
                            label="Animal *"
                            opciones={opcionesAnimales}
                            value={campos.animalId}
                            onChange={handleChange('animalId')}
                            error={errores.animalId}
                        />
                    </div>

                    <Entrada
                        label="Fecha de compra *"
                        type="date"
                        value={campos.fechaCompra}
                        onChange={handleChange('fechaCompra')}
                        error={errores.fechaCompra}
                    />
                    <Entrada
                        label="Proveedor *"
                        texto="Ej: Finca El Paraíso"
                        value={campos.proveedor}
                        onChange={handleChange('proveedor')}
                        error={errores.proveedor}
                    />

                    <Entrada
                        label="Precio de compra (COP) *"
                        texto="Ej: 2500000"
                        type="number"
                        value={campos.precioCompra}
                        onChange={handleChange('precioCompra')}
                        error={errores.precioCompra}
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
                            texto="Información adicional sobre la compra..."
                            value={campos.observaciones}
                            onChange={handleChange('observaciones')}
                        />
                    </div>
                </div>

                <BotonPestana
                    opcion={cargando ? 'Registrando...' : 'Registrar compra'}
                    imagen={imagenAdmin}
                    color="white"
                    backgroundColor="rgba(34, 197, 94, 0.95)"
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

export default CompraGanado
