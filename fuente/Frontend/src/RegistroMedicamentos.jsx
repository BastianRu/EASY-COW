import { useState } from 'react'
import Atras from '../modules/atras'
import Contenedor from '../modules/contenedor'
import Navegar from '../modules/navegar'
import TituloPestana from '../modules/tituloPestana'
import BotonPestana from '../modules/botonPestana'
import Entrada from '../modules/Entrada'
import Selector from '../modules/seleccion'
import Aviso from '../modules/aviso.jsx'
import imagenPill from '../images/pill.svg'
import './RegistroMedicamentos.css'
import { post } from './api.js'
import { VALIDATION_RANGES, isNumberInRange, isValidFreeText, hasWhitespaceIssues, isPastDate } from './formValidation.js'

const OPCIONES_TIPO = [
    { value: 'vacuna',           label: 'Vacuna' },
    { value: 'antibiotico',      label: 'Antibiótico' },
    { value: 'antiparasitario',  label: 'Antiparasitario' },
    { value: 'antiinflamatorio', label: 'Antiinflamatorio' },
    { value: 'vitamina',         label: 'Vitamina' },
    { value: 'hormonal',         label: 'Hormonal' },
    { value: 'otro',             label: 'Otro' },
]

const OPCIONES_PRESENTACION = [
    { value: 'inyectable', label: 'Inyectable' },
    { value: 'oral',       label: 'Oral' },
    { value: 'topico',     label: 'Tópico' },
    { value: 'polvo',      label: 'Polvo' },
]

function RegistroMedicamentos() {
    const [toast, setToast] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [campos, setCampos] = useState({
        nombre: '',
        tipoMedicamento: '',
        presentacion: '',
        descripcion: '',
        dosis: '',
        stockActual: '',
        stockMinimo: '',
        fechaVencimiento: '',
        observaciones: '',
    })
    const [errores, setErrores] = useState({
        nombre: false,
        tipoMedicamento: false,
        presentacion: false,
        stockActual: false,
        fechaVencimiento: false,
    })

    const handleChange = (campo) => (e) => {
        const valor = e.target.value
        setCampos((prev) => ({ ...prev, [campo]: valor }))
        if (campo in errores) {
            setErrores((prev) => ({ ...prev, [campo]: !valor }))
        }
    }

    const handleRegistrar = async () => {
        const stockValido = isNumberInRange(campos.stockActual, {
            min: VALIDATION_RANGES.STOCK_MEDICAMENTO.min,
            max: VALIDATION_RANGES.STOCK_MEDICAMENTO.max,
            integer: true,
        })
        const stockMinimoValido = campos.stockMinimo === '' || isNumberInRange(campos.stockMinimo, {
            min: VALIDATION_RANGES.STOCK_MEDICAMENTO.min,
            max: VALIDATION_RANGES.STOCK_MEDICAMENTO.max,
            integer: true,
        })
        const nombreValido = isValidFreeText(campos.nombre, { required: true })
        const descripcionValida = isValidFreeText(campos.descripcion)
        const dosisValida = isValidFreeText(campos.dosis)
        const observacionesValidas = isValidFreeText(campos.observaciones)
        const fechaVencimientoVencida = isPastDate(campos.fechaVencimiento)

        const nuevosErrores = {
            nombre:           !nombreValido,
            tipoMedicamento:  !campos.tipoMedicamento,
            presentacion:     !campos.presentacion,
            stockActual:      campos.stockActual === '' || !stockValido,
            fechaVencimiento: !campos.fechaVencimiento || fechaVencimientoVencida,
        }
        setErrores(nuevosErrores)

        if (Object.values(nuevosErrores).some(Boolean) || !stockMinimoValido || !descripcionValida || !dosisValida || !observacionesValidas) {
            let mensaje = 'No se han ingresado los datos obligatorios.'
            if (!nombreValido) {
                mensaje = hasWhitespaceIssues(campos.nombre)
                    ? 'El nombre no puede tener espacios al inicio, al final ni consecutivos.'
                    : 'El nombre del medicamento debe tener al menos 2 caracteres.'
            } else if (!campos.fechaVencimiento) {
                mensaje = 'La fecha de vencimiento es obligatoria.'
            } else if (fechaVencimientoVencida) {
                mensaje = 'La fecha de vencimiento no puede ser anterior a hoy.'
            } else if (!stockValido && campos.stockActual !== '') {
                mensaje = `El stock debe ser un número entero entre ${VALIDATION_RANGES.STOCK_MEDICAMENTO.min} y ${VALIDATION_RANGES.STOCK_MEDICAMENTO.max}.`
            } else if (!stockMinimoValido) {
                mensaje = `El stock mínimo debe ser un número entero entre ${VALIDATION_RANGES.STOCK_MEDICAMENTO.min} y ${VALIDATION_RANGES.STOCK_MEDICAMENTO.max}.`
            } else if (!descripcionValida) {
                mensaje = hasWhitespaceIssues(campos.descripcion)
                    ? 'La descripción no puede tener espacios al inicio, al final ni consecutivos.'
                    : 'La descripción debe tener al menos 2 caracteres.'
            } else if (!dosisValida) {
                mensaje = hasWhitespaceIssues(campos.dosis)
                    ? 'La dosis no puede tener espacios al inicio, al final ni consecutivos.'
                    : 'La dosis debe tener al menos 2 caracteres.'
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
            await post('/medicamentos', {
                ...campos,
                stockActual: Number(campos.stockActual),
                stockMinimo: campos.stockMinimo !== '' ? Number(campos.stockMinimo) : undefined,
            })
            setToast({
                tipo: 'success',
                titulo: 'Medicamento registrado exitosamente',
                mensaje: `El medicamento "${campos.nombre}" ha sido registrado en el inventario.`,
            })
            setCampos({
                nombre: '', tipoMedicamento: '', presentacion: '', descripcion: '',
                dosis: '', stockActual: '', stockMinimo: '', fechaVencimiento: '', observaciones: '',
            })
        } catch (error) {
            setToast({ tipo: 'error', titulo: 'Error al registrar', mensaje: error.message })
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className="registro-medicamentos">
            <Navegar />
            <Atras />
            <Contenedor width="auto" height="auto">
                <TituloPestana
                    imagen={imagenPill}
                    textoGrande="Registro de Medicamentos"
                    textoPequeno="Registre los medicamentos disponibles en el inventario de la finca"
                    color="rgba(168, 85, 247, 0.2)"
                />

                <div className="formulario-grid">
                    <Entrada
                        label="Nombre del medicamento *"
                        texto="Ej: Penicilina G Procaína"
                        value={campos.nombre}
                        onChange={handleChange('nombre')}
                        error={errores.nombre}
                    />
                    <Selector
                        label="Tipo de medicamento *"
                        opciones={OPCIONES_TIPO}
                        value={campos.tipoMedicamento}
                        onChange={handleChange('tipoMedicamento')}
                        error={errores.tipoMedicamento}
                    />

                    <Selector
                        label="Presentación *"
                        opciones={OPCIONES_PRESENTACION}
                        value={campos.presentacion}
                        onChange={handleChange('presentacion')}
                        error={errores.presentacion}
                    />
                    <Entrada
                        label="Dosis de referencia"
                        texto="Ej: 10 ml/100 kg"
                        value={campos.dosis}
                        onChange={handleChange('dosis')}
                    />

                    <Entrada
                        label="Stock actual (unidades) *"
                        texto="Ej: 50"
                        type="text"
                        inputMode="numeric"
                        value={campos.stockActual}
                        onChange={handleChange('stockActual')}
                        error={errores.stockActual}
                        min={VALIDATION_RANGES.STOCK_MEDICAMENTO.min}
                        max={VALIDATION_RANGES.STOCK_MEDICAMENTO.max}
                    />
                    <Entrada
                        label="Stock mínimo (unidades)"
                        texto="Ej: 10"
                        type="text"
                        inputMode="numeric"
                        value={campos.stockMinimo}
                        onChange={handleChange('stockMinimo')}
                        min={0}
                    />

                    <Entrada
                        label="Fecha de vencimiento *"
                        type="date"
                        value={campos.fechaVencimiento}
                        onChange={handleChange('fechaVencimiento')}
                        error={errores.fechaVencimiento}
                    />
                    <div className="formulario-full">
                        <Entrada
                            label="Descripción"
                            texto="Indicaciones, contraindicaciones, información adicional..."
                            value={campos.descripcion}
                            onChange={handleChange('descripcion')}
                        />
                    </div>

                    <div className="formulario-full">
                        <Entrada
                            label="Observaciones"
                            texto="Notas adicionales sobre el medicamento..."
                            value={campos.observaciones}
                            onChange={handleChange('observaciones')}
                        />
                    </div>
                </div>

                <BotonPestana
                    opcion={cargando ? 'Registrando...' : 'Registrar medicamento'}
                    imagen={imagenPill}
                    color="white"
                    backgroundColor="rgba(168, 85, 247, 0.95)"
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

export default RegistroMedicamentos
