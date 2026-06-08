import { useEffect, useState } from 'react'
import Atras from '../modules/atras'
import Contenedor from '../modules/contenedor'
import Navegar from '../modules/navegar'
import TituloPestana from '../modules/tituloPestana'
import BotonPestana from '../modules/botonPestana'
import Entrada from '../modules/Entrada'
import Selector from '../modules/seleccion'
import Aviso from '../modules/aviso.jsx'
import iconoProductivo from '../images/productivo.svg'
import './RegistroProduccion.css'
import { get, post } from './api.js'
import { VALIDATION_RANGES, isFutureDate, isNumberInRange, isValidFreeText, hasWhitespaceIssues } from './formValidation.js'

function RegistroProduccion() {
    const [toast, setToast] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [animales, setAnimales] = useState([])
    const [campos, setCampos] = useState({
        animalId: '',
        fechaRegistro: '',
        litrosLeche: '',
        observaciones: '',
    })
    const [errores, setErrores] = useState({
        animalId: false,
        fechaRegistro: false,
        litrosLeche: false,
    })

    useEffect(() => {
        const cargarAnimales = async () => {
            try {
                const res = await get('/animales', { estado: 'activo', limit: 200 })
                setAnimales(res.data)
            } catch {
                setToast({
                    tipo: 'error',
                    titulo: 'Error al cargar animales',
                    mensaje: 'No se pudo cargar la lista de vacas activas.',
                })
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
        const fechaInvalida = isFutureDate(campos.fechaRegistro)
        const litrosValidos = isNumberInRange(campos.litrosLeche, {
            min: VALIDATION_RANGES.PRODUCCION_LECHE_L_DIA.min,
            max: VALIDATION_RANGES.PRODUCCION_LECHE_L_DIA.max,
        })
        const observacionesValidas = isValidFreeText(campos.observaciones)

        const nuevosErrores = {
            animalId: !campos.animalId,
            fechaRegistro: !campos.fechaRegistro || fechaInvalida,
            litrosLeche: !campos.litrosLeche || !litrosValidos,
        }
        setErrores(nuevosErrores)

        if (Object.values(nuevosErrores).some(Boolean) || !observacionesValidas) {
            let mensaje = 'No se han ingresado los datos obligatorios.'
            if (fechaInvalida) {
                mensaje = 'La fecha de registro no puede ser futura.'
            } else if (!litrosValidos) {
                mensaje = `La producción diaria debe estar entre ${VALIDATION_RANGES.PRODUCCION_LECHE_L_DIA.min} y ${VALIDATION_RANGES.PRODUCCION_LECHE_L_DIA.max} litros.`
            } else if (!observacionesValidas) {
                mensaje = hasWhitespaceIssues(campos.observaciones)
                    ? 'Las observaciones no pueden tener espacios al inicio, al final ni consecutivos.'
                    : 'Las observaciones deben tener al menos 2 caracteres.'
            } else if (animales.length === 0) {
                mensaje = 'No hay vacas activas disponibles para registrar producción.'
            }

            setToast({
                tipo: 'error',
                titulo: 'Error al registrar producción',
                mensaje,
            })
            return
        }

        setCargando(true)
        try {
            await post('/produccion', {
                ...campos,
                litrosLeche: Number(campos.litrosLeche),
            })
            setToast({
                tipo: 'success',
                titulo: 'Producción registrada exitosamente',
                mensaje: 'La producción diaria de leche ha sido guardada en el sistema.',
            })
            setCampos({ animalId: '', fechaRegistro: '', litrosLeche: '', observaciones: '' })
            setErrores({ animalId: false, fechaRegistro: false, litrosLeche: false })
        } catch (error) {
            setToast({
                tipo: 'error',
                titulo: 'Error al registrar producción',
                mensaje: error.message,
            })
        } finally {
            setCargando(false)
        }
    }

    const opcionesAnimales = animales.map((animal) => ({
        value: animal._id || animal.id,
        label: `${animal.identificacion} - ${animal.nombre || 'Sin nombre'}`,
    }))

    return (
        <div className="registroproduccion">
            <Navegar activo="productivo" />
            <Atras />
            <Contenedor width="auto" height="auto">
                <TituloPestana
                    imagen={iconoProductivo}
                    textoGrande="Registro Diario de Producción"
                    textoPequeno="Registre la cantidad de litros de leche producida por cada vaca"
                    color="rgba(239, 68, 68, 0.18)"
                />

                <div className="formulario-grid">
                    <div className="formulario-full">
                        <Selector
                            label="Vaca *"
                            opciones={opcionesAnimales}
                            value={campos.animalId}
                            onChange={handleChange('animalId')}
                            error={errores.animalId}
                        />
                    </div>

                    <Entrada
                        label="Fecha de Registro *"
                        type="date"
                        value={campos.fechaRegistro}
                        onChange={handleChange('fechaRegistro')}
                        error={errores.fechaRegistro}
                    />
                    <Entrada
                        label="Litros de Leche *"
                        texto="Ej: 18.5"
                        type="text"
                        inputMode="decimal"
                        value={campos.litrosLeche}
                        onChange={handleChange('litrosLeche')}
                        error={errores.litrosLeche}
                        min={VALIDATION_RANGES.PRODUCCION_LECHE_L_DIA.min}
                        max={VALIDATION_RANGES.PRODUCCION_LECHE_L_DIA.max}
                        step="0.1"
                    />

                    <div className="formulario-full">
                        <Entrada
                            label="Observaciones"
                            texto="Comentarios adicionales sobre el registro de producción"
                            value={campos.observaciones}
                            onChange={handleChange('observaciones')}
                        />
                    </div>
                </div>

                <BotonPestana
                    opcion={cargando ? 'Registrando...' : 'Guardar Producción'}
                    imagen={iconoProductivo}
                    color="white"
                    backgroundColor="rgb(220, 38, 38)"
                    onClick={handleRegistrar}
                    disabled={cargando || animales.length === 0}
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

export default RegistroProduccion