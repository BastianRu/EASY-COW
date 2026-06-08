import { useState, useEffect } from 'react'
import Navegar from "../modules/navegar"
import imagenP5 from '../images/apple.svg'
import Atras from "../modules/atras"
import Contenedor from "../modules/contenedor"
import TituloPestana from "../modules/tituloPestana"
import BotonPestana from "../modules/botonPestana"
import Entrada from "../modules/Entrada"
import Selector from "../modules/seleccion"
import Aviso from '../modules/aviso.jsx'
import './DietasSuplementos.css'
import { post, get } from './api.js'
import { VALIDATION_RANGES, isFutureDate, isNumberInRange, isValidFreeText, hasWhitespaceIssues, isLettersOnly } from './formValidation.js'

function DietasSuplementos(){
    const [toast, setToast] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [animales, setAnimales] = useState([]);
    const [campos, setCampos] = useState({
        animalId: '', fechaRegistro: '', tipoDieta: '',
        alimentoBase: '', cantidad: '', frecuenciaAlimentacion: '',
        objetivoDieta: '', suplementos: '', observaciones: ''
    });
    const [errores, setErrores] = useState({
        animalId: false, fechaRegistro: false, tipoDieta: false,
        alimentoBase: false, cantidad: false, frecuenciaAlimentacion: false, objetivoDieta: false
    });

    useEffect(() => {
        const cargarAnimales = async () => {
            try {
                const res = await get('/animales');
                setAnimales(res.data);
            } catch (error) {
                setToast({ tipo: 'error', titulo: 'Error', mensaje: 'No se pudo cargar la lista de animales' });
            }
        };
        cargarAnimales();
    }, []);

    const handleChange = (campo) => (e) => {
        const valor = e.target.value;
        setCampos(prev => ({ ...prev, [campo]: valor }));
        if (campo in errores) {
            setErrores(prev => ({ ...prev, [campo]: !valor }));
        }
    };

    const handleRegistrar = async () => {
        const cantidadValida = isNumberInRange(campos.cantidad, {
            min: VALIDATION_RANGES.CANTIDAD_ALIMENTO_KG_DIA.min,
            max: VALIDATION_RANGES.CANTIDAD_ALIMENTO_KG_DIA.max,
        });
        const fechaInvalida      = isFutureDate(campos.fechaRegistro);
        const alimentoBaseValido = isLettersOnly(campos.alimentoBase, { required: true });
        const suplementosValidos = isValidFreeText(campos.suplementos);
        const observacionesValidas = isValidFreeText(campos.observaciones);

        const nuevosErrores = {
            animalId:       !campos.animalId,
            fechaRegistro:  !campos.fechaRegistro || fechaInvalida,
            tipoDieta:      !campos.tipoDieta,
            alimentoBase:   !alimentoBaseValido,
            cantidad:       !campos.cantidad || !cantidadValida,
            frecuenciaAlimentacion: !campos.frecuenciaAlimentacion,
            objetivoDieta:  !campos.objetivoDieta,
        };
        setErrores(nuevosErrores);

        if (Object.values(nuevosErrores).some(Boolean) || !suplementosValidos || !observacionesValidas) {
            let mensaje = 'No se han ingresado los datos obligatorios.';
            if (fechaInvalida) {
                mensaje = 'La fecha de registro no puede ser futura.';
            } else if (!alimentoBaseValido) {
                mensaje = hasWhitespaceIssues(campos.alimentoBase)
                    ? 'El alimento base no puede tener espacios al inicio, al final ni consecutivos.'
                    : (campos.alimentoBase && /[0-9]/.test(campos.alimentoBase))
                        ? 'El alimento base solo puede contener letras, no números.'
                        : 'El alimento base debe tener al menos 2 letras.';
            } else if (!cantidadValida) {
                mensaje = `La cantidad debe estar entre ${VALIDATION_RANGES.CANTIDAD_ALIMENTO_KG_DIA.min} y ${VALIDATION_RANGES.CANTIDAD_ALIMENTO_KG_DIA.max} kg/día.`;
            } else if (!suplementosValidos) {
                mensaje = hasWhitespaceIssues(campos.suplementos)
                    ? 'Los suplementos no pueden tener espacios al inicio, al final ni consecutivos.'
                    : 'Los suplementos deben tener al menos 2 caracteres.';
            } else if (!observacionesValidas) {
                mensaje = hasWhitespaceIssues(campos.observaciones)
                    ? 'Las observaciones no pueden tener espacios al inicio, al final ni consecutivos.'
                    : 'Las observaciones deben tener al menos 2 caracteres.';
            }

            setToast({ tipo: 'error', titulo: 'Error al registrar', mensaje });
            return;
        }

        setCargando(true);
        try {
            await post('/dietas', {
                ...campos,
                cantidad: Number(campos.cantidad),
            });
            setToast({ tipo: 'success', titulo: 'Dieta registrada exitosamente',
                       mensaje: 'La dieta ha sido registrada en el sistema.' });
        } catch (error) {
            setToast({ tipo: 'error', titulo: 'Error al registrar',
                       mensaje: error.message });
        } finally {
            setCargando(false);
        }
    };

    const opcionesAnimales = animales.map(animal => ({
        value: animal._id || animal.id,
        label: `${animal.identificacion} - ${animal.nombre || 'Sin nombre'}`
    }));

    const opcionesTipoDieta = [
        { value: 'pastoreo', label: 'Pastoreo' },
        { value: 'semi_estabulado', label: 'Semi-estabulado' },
        { value: 'estabulado', label: 'Estabulado' },
        { value: 'especial', label: 'Dieta Especial' }
    ];

    const opcionesFrecuencia = [
        { value: '1_vez', label: '1 vez al día' },
        { value: '2_veces', label: '2 veces al día' },
        { value: '3_veces', label: '3 veces al día' },
        { value: 'continuo', label: 'Continuo' }
    ];

    const opcionesObjetivo = [
        { value: 'mantenimiento', label: 'Mantenimiento' },
        { value: 'engorde', label: 'Engorde' },
        { value: 'produccion_leche', label: 'Producción de leche' },
        { value: 'gestacion', label: 'Gestación' },
        { value: 'recuperacion', label: 'Recuperación' }
    ];

    return(
        <div className="dietassuplementos">
            <Navegar/>
            <Atras/>
            <Contenedor width="auto" height="auto">
                <TituloPestana
                    imagen={imagenP5}
                    textoGrande="Registro de Dietas y Suplementos"
                    textoPequeno="Registre la alimentacion y suplementos del ganado"
                    color="rgba(255, 115, 0, 0.25)"
                />

                <div className="formulario-grid">
                    <div className="formulario-full">
                        <Selector label="Animal *" opciones={opcionesAnimales}
                            value={campos.animalId} onChange={handleChange('animalId')}
                            error={errores.animalId} />
                    </div>

                    <Entrada label="Fecha de Registro *" type="date"
                        value={campos.fechaRegistro} onChange={handleChange('fechaRegistro')}
                        error={errores.fechaRegistro} />
                    <Selector label="Tipo de Dieta *"
                        opciones={opcionesTipoDieta}
                        value={campos.tipoDieta} onChange={handleChange('tipoDieta')}
                        error={errores.tipoDieta} />

                    <Entrada label="Alimento Base *" texto="Ej: Pasto estrella, concentrado"
                        value={campos.alimentoBase} onChange={handleChange('alimentoBase')}
                        error={errores.alimentoBase} />
                    <Entrada label="Cantidad (kg/día) *" texto="Ej: 25" type="text" inputMode="decimal"
                        value={campos.cantidad} onChange={handleChange('cantidad')}
                        error={errores.cantidad}
                        min={VALIDATION_RANGES.CANTIDAD_ALIMENTO_KG_DIA.min} max={VALIDATION_RANGES.CANTIDAD_ALIMENTO_KG_DIA.max} step="0.1" />

                    <Selector label="Frecuencia de Alimentación *"
                        opciones={opcionesFrecuencia}
                        value={campos.frecuenciaAlimentacion} onChange={handleChange('frecuenciaAlimentacion')}
                        error={errores.frecuenciaAlimentacion} />
                    <Selector label="Objetivo de la Dieta *"
                        opciones={opcionesObjetivo}
                        value={campos.objetivoDieta} onChange={handleChange('objetivoDieta')}
                        error={errores.objetivoDieta} />

                    <div className="formulario-full">
                        <Entrada label="Suplementos y Minerales"
                            texto="Liste los suplementos, vitamínicos, minerales, sales, etc..."
                            value={campos.suplementos} onChange={handleChange('suplementos')} />
                    </div>

                    <div className="formulario-full">
                        <Entrada label="Observaciones"
                            texto="Preferencias alimentarias, alergias, respuesta a la dieta..."
                            value={campos.observaciones} onChange={handleChange('observaciones')} />
                    </div>
                </div>

                <BotonPestana
                    opcion={cargando ? 'Registrando...' : 'Registrar Dieta'}
                    imagen={imagenP5} color="white"
                    backgroundColor="rgba(255, 115, 0, 0.95)"
                    onClick={handleRegistrar}
                    disabled={cargando}
                />

                {toast && (
                    <div className="toast-wrapper">
                        <Aviso tipo={toast.tipo} titulo={toast.titulo}
                               mensaje={toast.mensaje} onClose={() => setToast(null)} />
                    </div>
                )}
            </Contenedor>
        </div>
    )
}

export default DietasSuplementos