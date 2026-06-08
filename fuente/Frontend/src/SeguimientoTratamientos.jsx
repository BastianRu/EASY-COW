import { useState, useEffect } from 'react'
import Atras from "../modules/atras"
import Contenedor from "../modules/contenedor"
import Navegar from "../modules/navegar"
import TituloPestana from "../modules/tituloPestana"
import imagenP4 from '../images/pill.svg'
import BotonPestana from "../modules/botonPestana"
import Entrada from "../modules/Entrada"
import Selector from "../modules/seleccion"
import Aviso from '../modules/aviso.jsx'
import './SeguimientoTratamientos.css'
import { post, get } from './api.js'
import { VALIDATION_RANGES, isFutureDate, isNumberInRange, isValidFreeText, hasWhitespaceIssues } from './formValidation.js'

function SeguimientoTratamientos(){
    const [toast, setToast] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [animales, setAnimales] = useState([]);
    const [campos, setCampos] = useState({
        animalId: '', fechaInicio: '', medicamento: '',
        dosis: '', frecuencia: '', duracion: '',
        viaAdministracion: '', veterinario: '', estadoTratamiento: '', observaciones: ''
    });
    const [errores, setErrores] = useState({
        animalId: false, fechaInicio: false, medicamento: false,
        dosis: false, frecuencia: false, duracion: false,
        viaAdministracion: false, estadoTratamiento: false
    });

    useEffect(() => {
        const cargarAnimales = async () => {
            try {
                const res = await get('/animales', { estado: 'activo', limit: 200 });
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

    const handleGuardar = async () => {
        const fechaInvalida    = isFutureDate(campos.fechaInicio);
        const duracionValida   = isNumberInRange(campos.duracion, {
            min: VALIDATION_RANGES.DURACION_TRATAMIENTO_DIAS.min,
            max: VALIDATION_RANGES.DURACION_TRATAMIENTO_DIAS.max,
            integer: true,
        });
        const medicamentoValido = isValidFreeText(campos.medicamento, { required: true });
        const dosisValida       = isValidFreeText(campos.dosis,        { required: true });
        const veterinarioValido = isValidFreeText(campos.veterinario);
        const observacionesValidas = isValidFreeText(campos.observaciones);

        const nuevosErrores = {
            animalId:         !campos.animalId,
            fechaInicio:      !campos.fechaInicio || fechaInvalida,
            medicamento:      !medicamentoValido,
            dosis:            !dosisValida,
            frecuencia:       !campos.frecuencia,
            duracion:         !campos.duracion || !duracionValida,
            viaAdministracion:!campos.viaAdministracion,
            estadoTratamiento:!campos.estadoTratamiento,
        };
        setErrores(nuevosErrores);

        if (Object.values(nuevosErrores).some(Boolean) || !veterinarioValido || !observacionesValidas) {
            let mensaje = 'No se han ingresado los datos obligatorios.';
            if (fechaInvalida) {
                mensaje = 'La fecha de inicio no puede ser futura.';
            } else if (!medicamentoValido) {
                mensaje = hasWhitespaceIssues(campos.medicamento)
                    ? 'El medicamento no puede tener espacios al inicio, al final ni consecutivos.'
                    : 'El medicamento debe tener al menos 2 caracteres.';
            } else if (!dosisValida) {
                mensaje = hasWhitespaceIssues(campos.dosis)
                    ? 'La dosis no puede tener espacios al inicio, al final ni consecutivos.'
                    : 'La dosis debe tener al menos 2 caracteres.';
            } else if (!veterinarioValido) {
                mensaje = hasWhitespaceIssues(campos.veterinario)
                    ? 'El veterinario no puede tener espacios al inicio, al final ni consecutivos.'
                    : 'El nombre del veterinario debe tener al menos 2 caracteres.';
            } else if (!duracionValida) {
                mensaje = `La duración debe ser un entero entre ${VALIDATION_RANGES.DURACION_TRATAMIENTO_DIAS.min} y ${VALIDATION_RANGES.DURACION_TRATAMIENTO_DIAS.max} días.`;
            } else if (!observacionesValidas) {
                mensaje = hasWhitespaceIssues(campos.observaciones)
                    ? 'Las observaciones no pueden tener espacios al inicio, al final ni consecutivos.'
                    : 'Las observaciones deben tener al menos 2 caracteres.';
            }

            setToast({ tipo: 'error', titulo: 'Error al guardar', mensaje });
            return;
        }

        setCargando(true);
        try {
            await post('/tratamientos', {
                ...campos,
                duracion: Number(campos.duracion),
            });
            setToast({ tipo: 'success', titulo: 'Tratamiento guardado exitosamente',
                       mensaje: 'El tratamiento ha sido registrado en el sistema.' });
        } catch (error) {
            setToast({ tipo: 'error', titulo: 'Error al guardar',
                       mensaje: error.message });
        } finally {
            setCargando(false);
        }
    };

    const opcionesAnimales = animales.map(animal => ({
        value: animal._id || animal.id,
        label: `${animal.identificacion} - ${animal.nombre || 'Sin nombre'}`
    }));

    const opcionesFrecuencia = [
        { value: 'cada_6h', label: 'Cada 6 horas' },
        { value: 'cada_8h', label: 'Cada 8 horas' },
        { value: 'cada_12h', label: 'Cada 12 horas' },
        { value: 'cada_24h', label: 'Cada 24 horas' },
        { value: 'cada_48h', label: 'Cada 48 horas' }
    ];

    const opcionesViaAdmin = [
        { value: 'intramuscular', label: 'Intramuscular' },
        { value: 'intravenosa', label: 'Intravenosa' },
        { value: 'subcutanea', label: 'Subcutánea' },
        { value: 'oral', label: 'Oral' },
        { value: 'topica', label: 'Tópica' }
    ];

    const opcionesEstado = [
        { value: 'en_curso', label: 'En Curso' },
        { value: 'completado', label: 'Completado' },
        { value: 'suspendido', label: 'Suspendido' },
        { value: 'actualizar', label: 'Actualizar Existente' }
    ];

    return(
        <div className="seguimientotratamientos">
            <Navegar/>
            <Atras/>
            <Contenedor width="auto" height="auto">
                <TituloPestana
                    imagen={imagenP4}
                    textoGrande="Seguimiento de Tratamientos"
                    textoPequeno="Registre y actualice los tratamientos aplicados a los animales"
                    color="rgba(43, 255, 0, 0.25)"
                />

                <div className="formulario-grid">
                    <div className="formulario-full">
                        <Selector label="Animal en Tratamiento *"
                            opciones={opcionesAnimales}
                            value={campos.animalId} onChange={handleChange('animalId')}
                            error={errores.animalId} />
                    </div>

                    <Entrada label="Fecha de Inicio *" type="date"
                        value={campos.fechaInicio} onChange={handleChange('fechaInicio')}
                        error={errores.fechaInicio} />
                    <Entrada label="Medicamento *" texto="Ej: Penicilina G"
                        value={campos.medicamento} onChange={handleChange('medicamento')}
                        error={errores.medicamento} />

                    <Entrada label="Dosis *" texto="Ej: 10 ml"
                        value={campos.dosis} onChange={handleChange('dosis')} error={errores.dosis} />
                    <Selector label="Frecuencia *"
                        opciones={opcionesFrecuencia}
                        value={campos.frecuencia} onChange={handleChange('frecuencia')}
                        error={errores.frecuencia} />

                    <Entrada label="Duración (días) *" texto="Ej: 7" type="text" inputMode="numeric"
                        value={campos.duracion} onChange={handleChange('duracion')}
                        error={errores.duracion}
                        min={VALIDATION_RANGES.DURACION_TRATAMIENTO_DIAS.min} max={VALIDATION_RANGES.DURACION_TRATAMIENTO_DIAS.max} step="1" />
                    <Selector label="Vía de Administración *"
                        opciones={opcionesViaAdmin}
                        value={campos.viaAdministracion} onChange={handleChange('viaAdministracion')}
                        error={errores.viaAdministracion} />

                    <Entrada label="Veterinario Responsable" texto="Nombre del veterinario"
                        value={campos.veterinario} onChange={handleChange('veterinario')} />
                    <Selector label="Estado del Tratamiento *"
                        opciones={opcionesEstado}
                        value={campos.estadoTratamiento} onChange={handleChange('estadoTratamiento')}
                        error={errores.estadoTratamiento} />

                    <div className="formulario-full">
                        <Entrada label="Observaciones y Evolución"
                            texto="Efectividad del tratamiento, efectos secundarios, mejoras observadas..."
                            value={campos.observaciones} onChange={handleChange('observaciones')} />
                    </div>
                </div>

                <BotonPestana
                    opcion={cargando ? 'Guardando...' : 'Guardar Tratamiento'}
                    imagen={imagenP4} color="white"
                    backgroundColor="rgb(37, 156, 47)"
                    onClick={handleGuardar}
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

export default SeguimientoTratamientos