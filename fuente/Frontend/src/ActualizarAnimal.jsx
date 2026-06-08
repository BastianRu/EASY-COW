import { useState, useEffect } from 'react'
import Atras from "../modules/atras"
import Contenedor from "../modules/contenedor"
import Navegar from "../modules/navegar"
import TituloPestana from "../modules/tituloPestana"
import imagenP2 from '../images/reload.svg'
import BotonPestana from "../modules/botonPestana"
import Entrada from "../modules/Entrada"
import Selector from "../modules/seleccion"
import Aviso from '../modules/aviso.jsx'
import './ActualizarAnimal.css'
import { post, get } from './api.js'
import { VALIDATION_RANGES, isNumberInRange, isValidFreeText, hasWhitespaceIssues } from './formValidation.js'

function ActualizarAnimal(){
    const [toast, setToast] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [animales, setAnimales] = useState([]);
    const [campos, setCampos] = useState({
        animalId: '',
        peso: '',
        altura: '',
        condicionCorporal: '',
        produccionLeche: '',
        estadoReproductivo: '',
        observaciones: ''
    });
    const [errores, setErrores] = useState({
        animalId: false,
        peso: false,
        altura: false,
        condicionCorporal: false,
        produccionLeche: false,
    });

    // Cargar lista de animales al montar
    useEffect(() => {
        const cargarAnimales = async () => {
            try {
                const res = await get('/animales');
                setAnimales(res.data);
            } catch {
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

    const handleAnimalChange = (e) => {
        const animalId = e.target.value;
        setCampos(prev => ({ ...prev, animalId }));
        setErrores(prev => ({ ...prev, animalId: !animalId }));
    };

    const handleGuardar = async () => {
        const pesoValido = isNumberInRange(campos.peso, {
            min: VALIDATION_RANGES.PESO_KG.min,
            max: VALIDATION_RANGES.PESO_KG.max,
        });
        const alturaValida = isNumberInRange(campos.altura, {
            min: VALIDATION_RANGES.ALTURA_CM.min,
            max: VALIDATION_RANGES.ALTURA_CM.max,
            allowEmpty: true,
        });
        const condicionValida = isNumberInRange(campos.condicionCorporal, {
            min: VALIDATION_RANGES.CONDICION_CORPORAL.min,
            max: VALIDATION_RANGES.CONDICION_CORPORAL.max,
            allowEmpty: true,
        });
        const produccionValida = isNumberInRange(campos.produccionLeche, {
            min: VALIDATION_RANGES.PRODUCCION_LECHE_L_DIA.min,
            max: VALIDATION_RANGES.PRODUCCION_LECHE_L_DIA.max,
            allowEmpty: true,
        });

        const observacionesValidas = isValidFreeText(campos.observaciones);

        const nuevosErrores = {
            animalId: !campos.animalId,
            peso: !campos.peso || !pesoValido,
            altura: !alturaValida,
            condicionCorporal: !condicionValida,
            produccionLeche: !produccionValida,
        };
        setErrores(nuevosErrores);

        if (Object.values(nuevosErrores).some(Boolean) || !observacionesValidas) {
            let mensaje = 'No se han ingresado los datos obligatorios.';
            if (!pesoValido) {
                mensaje = `El peso debe estar entre ${VALIDATION_RANGES.PESO_KG.min} y ${VALIDATION_RANGES.PESO_KG.max} kg.`;
            } else if (!alturaValida) {
                mensaje = `La altura debe estar entre ${VALIDATION_RANGES.ALTURA_CM.min} y ${VALIDATION_RANGES.ALTURA_CM.max} cm.`;
            } else if (!condicionValida) {
                mensaje = `La condición corporal debe estar entre ${VALIDATION_RANGES.CONDICION_CORPORAL.min} y ${VALIDATION_RANGES.CONDICION_CORPORAL.max}.`;
            } else if (!produccionValida) {
                mensaje = `La producción de leche debe estar entre ${VALIDATION_RANGES.PRODUCCION_LECHE_L_DIA.min} y ${VALIDATION_RANGES.PRODUCCION_LECHE_L_DIA.max} L/día.`;
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
            const payload = {
                peso: Number(campos.peso),
                ...(campos.altura !== '' && { altura: Number(campos.altura) }),
                ...(campos.condicionCorporal !== '' && { condicionCorporal: Number(campos.condicionCorporal) }),
                ...(campos.produccionLeche !== '' && { produccionLeche: Number(campos.produccionLeche) }),
                ...(campos.estadoReproductivo && { estadoReproductivo: campos.estadoReproductivo }),
                ...(campos.observaciones && { observaciones: campos.observaciones })
            };

            await post(`/animales/${campos.animalId}/actualizacion`, payload);
            setToast({ tipo: 'success', titulo: 'Actualización registrada exitosamente',
                       mensaje: 'La actualización mensual ha sido guardada en el sistema.' });

            setCampos({
                animalId: '',
                peso: '',
                altura: '',
                condicionCorporal: '',
                produccionLeche: '',
                estadoReproductivo: '',
                observaciones: ''
            });
        } catch (error) {
            setToast({ tipo: 'error', titulo: 'Error al guardar',
                       mensaje: error.message });
        } finally {
            setCargando(false);
        }
    };

    // Preparar opciones para el selector de animales
    const opcionesAnimales = animales.map(animal => ({
        value: animal._id || animal.id,
        label: `${animal.identificacion} - ${animal.nombre || 'Sin nombre'}`
    }));

    return(
        <div className="actualizaranimal">
            <Navegar/>
            <Atras/>
            <Contenedor width="auto" height="auto">
                <TituloPestana
                    imagen={imagenP2}
                    textoGrande="Actualización Mensual"
                    textoPequeno="Seleccione un animal y registre sus datos productivos y físicos"
                    color="rgba(0, 153, 255, 0.25)"
                />

                <div className="formulario-grid">
                    <div className="formulario-full">
                        <Selector 
                            label="Animal *"
                            opciones={opcionesAnimales}
                            value={campos.animalId} 
                            onChange={handleAnimalChange}
                            error={errores.animalId}
                        />
                    </div>

                    {campos.animalId && (<>
                        <Entrada label="Peso actual (kg) *" texto="Ej: 480" type="text" inputMode="decimal"
                            value={campos.peso} onChange={handleChange('peso')} error={errores.peso}
                            min={VALIDATION_RANGES.PESO_KG.min} max={VALIDATION_RANGES.PESO_KG.max} step="0.1" />
                        <Entrada label="Altura (cm)" texto="Ej: 145.5" type="text" inputMode="decimal"
                            value={campos.altura} onChange={handleChange('altura')} error={errores.altura}
                            min={VALIDATION_RANGES.ALTURA_CM.min} max={VALIDATION_RANGES.ALTURA_CM.max} step="0.1" />

                        <Entrada label="Condición corporal (1 a 5)" texto="Ej: 3" type="text" inputMode="decimal"
                            value={campos.condicionCorporal}
                            onChange={handleChange('condicionCorporal')}
                            error={errores.condicionCorporal}
                            min={VALIDATION_RANGES.CONDICION_CORPORAL.min} max={VALIDATION_RANGES.CONDICION_CORPORAL.max} step="0.1" />
                        <Entrada label="Producción de leche (L/día)" texto="Ej: 18.5" type="text" inputMode="decimal"
                            value={campos.produccionLeche} onChange={handleChange('produccionLeche')} error={errores.produccionLeche}
                            min={VALIDATION_RANGES.PRODUCCION_LECHE_L_DIA.min} max={VALIDATION_RANGES.PRODUCCION_LECHE_L_DIA.max} step="0.1" />
                        <div className="formulario-full">
                            <Selector label="Estado reproductivo" 
                            opciones={[
                                { value: 'vacia', label: 'Vacía' },
                                { value: 'gestante', label: 'Gestante' },
                                { value: 'lactante', label: 'Lactante' },
                                { value: 'servicio', label: 'Servicio' }
                            ]}
                            value={campos.estadoReproductivo} onChange={handleChange('estadoReproductivo')} />
                        </div>
                        

                        <div className="formulario-full">
                            <Entrada label="Observaciones"
                                texto="Estado general, cambios observados, notas de seguimiento..."
                                value={campos.observaciones} onChange={handleChange('observaciones')} />
                        </div>

                        <div className="formulario-full">
                            <BotonPestana
                                opcion={cargando ? 'Guardando...' : 'Guardar Actualización'}
                                imagen={imagenP2} color="white"
                                backgroundColor="rgba(0, 153, 255, 0.95)"
                                onClick={handleGuardar}
                                disabled={cargando}
                            />
                        </div>
                    </>)}
                </div>

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

export default ActualizarAnimal