import { useState, useEffect } from 'react'
import Atras from "../modules/atras"
import Contenedor from "../modules/contenedor"
import Navegar from "../modules/navegar"
import imagenG1 from "../images/plus.svg"
import './RegistrarAnimal.css'
import TituloPestana from "../modules/tituloPestana"
import BotonPestana from "../modules/botonPestana"
import Entrada from "../modules/Entrada"
import Selector from "../modules/seleccion"
import Aviso from '../modules/aviso.jsx'
import { get, post } from './api.js'
import { VALIDATION_RANGES, isFutureDate, isNumberInRange, isValidFreeText, hasWhitespaceIssues } from './formValidation.js'

function RegistrarAnimal(){
    const [toast, setToast] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [madres, setMadres] = useState([]);
    const [campos, setCampos] = useState({
        identificacion: '', nombre: '', raza: '',
        sexo: '', fechaNacimiento: '', peso: '',
        color: '', procedencia: '', observaciones: '',
        esCria: '', madreId: ''
    });
    const [errores, setErrores] = useState({
        identificacion: false, nombre: false, raza: false,
        sexo: false, fechaNacimiento: false, peso: false,
        madreId: false
    });

    useEffect(() => {
        const cargarMadres = async () => {
            try {
                const res = await get('/animales', { sexo: 'hembra', estado: 'activo', limit: 200 })
                setMadres(res.data)
            } catch {
                // no bloquea el formulario si falla
            }
        }
        cargarMadres()
    }, []);

    const handleChange = (campo) => (e) => {
        const valor = e.target.value;
        setCampos(prev => ({ ...prev, [campo]: valor }));
        if (campo in errores) {
            setErrores(prev => ({ ...prev, [campo]: !valor }));
        }
    };

    const handleRegistrar = async () => {
        const identificacionValida = /^\d{5}$/.test(campos.identificacion);
        const pesoValido = isNumberInRange(campos.peso, {
            min: VALIDATION_RANGES.PESO_KG.min,
            max: VALIDATION_RANGES.PESO_KG.max,
        });
        const fechaInvalida  = isFutureDate(campos.fechaNacimiento);
        const nombreValido   = isValidFreeText(campos.nombre, { required: true });
        const colorValido    = isValidFreeText(campos.color);
        const procedenciaValida = isValidFreeText(campos.procedencia);

        const esCriaSeleccionada = campos.esCria === 'si';
        const nuevosErrores = {
            identificacion: !identificacionValida,
            nombre:         !nombreValido,
            raza:           !campos.raza,
            sexo:           !campos.sexo,
            fechaNacimiento:!campos.fechaNacimiento || fechaInvalida,
            peso:           !campos.peso || !pesoValido,
            madreId:        esCriaSeleccionada && !campos.madreId,
        };
        setErrores(nuevosErrores);

        if (Object.values(nuevosErrores).some(Boolean) || !colorValido || !procedenciaValida) {
            let mensaje = 'No se han ingresado los datos obligatorios.';
            if (!identificacionValida) {
                mensaje = 'La identificación debe tener exactamente 5 números.';
            } else if (fechaInvalida) {
                mensaje = 'La fecha de nacimiento no puede ser futura.';
            } else if (!pesoValido) {
                mensaje = `El peso debe estar entre ${VALIDATION_RANGES.PESO_KG.min} y ${VALIDATION_RANGES.PESO_KG.max} kg.`;
            } else if (!nombreValido) {
                mensaje = hasWhitespaceIssues(campos.nombre)
                    ? 'El nombre no puede tener espacios al inicio, al final ni consecutivos.'
                    : 'El nombre debe tener al menos 2 caracteres.'
            } else if (!colorValido) {
                mensaje = hasWhitespaceIssues(campos.color)
                    ? 'El color no puede tener espacios al inicio, al final ni consecutivos.'
                    : 'El color debe tener al menos 2 caracteres.';
            } else if (!procedenciaValida) {
                mensaje = hasWhitespaceIssues(campos.procedencia)
                    ? 'La procedencia no puede tener espacios al inicio, al final ni consecutivos.'
                    : 'La procedencia debe tener al menos 2 caracteres.';
            } else if (esCriaSeleccionada && !campos.madreId) {
                mensaje = 'Debe seleccionar la madre de la cría.';
            }

            setToast({ tipo: 'error', titulo: 'Error al registrar el animal', mensaje });
            return;
        }

        setCargando(true);
        try {
            const body = {
                ...campos,
                peso: Number(campos.peso),
                esCria: campos.esCria === 'si',
                madreId: campos.esCria === 'si' ? campos.madreId : undefined,
            };
            await post('/animales', body);
            setToast({ tipo: 'success', titulo: 'Animal registrado exitosamente',
                       mensaje: `El animal ${campos.nombre || campos.identificacion} ha sido registrado en el sistema.` });
        } catch (error) {
            setToast({ tipo: 'error', titulo: 'Error al registrar el animal',
                       mensaje: error.message });
        } finally {
            setCargando(false);
        }
    };

    return(
        <div className="registraranimal">
            <Navegar activo="clipboard"/>
            <Atras/>
            <Contenedor width="auto" height="auto">
                <TituloPestana
                    imagen={imagenG1}
                    textoGrande="Registrar Nuevo Animal"
                    textoPequeno="Ingrese los datos del animal para agregarlo al inventario"
                    color="rgba(0, 255, 255, 0.4)"
                />

                <div className="formulario-grid">
                    <Entrada label="Identificación *" texto="Ej: 12345"
                        value={campos.identificacion} onChange={handleChange('identificacion')}
                        error={errores.identificacion} />
                    <Entrada label="Nombre *" texto="Ej: Luna"
                        value={campos.nombre} onChange={handleChange('nombre')}
                        error={errores.nombre} />

                    <Selector label="Raza *" opciones={[
                        { value: 'angus', label: 'Angus' },
                        { value: 'holstein', label: 'Holstein' },
                        { value: 'brahman', label: 'Brahman' },
                        { value: 'hereford', label: 'Hereford' },
                        { value: 'criollo', label: 'Criollo' },
                        { value: 'mestizo', label: 'Mestizo' }
                    ]}
                        value={campos.raza} onChange={handleChange('raza')} error={errores.raza} />
                    <Selector label="Sexo *" opciones={[
                        { value: 'macho', label: 'Macho' },
                        { value: 'hembra', label: 'Hembra' }
                    ]}
                        value={campos.sexo} onChange={handleChange('sexo')} error={errores.sexo} />

                    <Entrada label="Fecha de nacimiento *" texto="dd/mm/aaaa" type="date"
                        value={campos.fechaNacimiento} onChange={handleChange('fechaNacimiento')}
                        error={errores.fechaNacimiento} />
                    <Entrada label="Peso (kg) *" texto="Ej: 450" type="number"
                        value={campos.peso} onChange={handleChange('peso')} error={errores.peso}
                        min={VALIDATION_RANGES.PESO_KG.min} max={VALIDATION_RANGES.PESO_KG.max} step="0.1" />

                    <Entrada label="Color" texto="Ej: Negro con manchas blancas"
                        value={campos.color} onChange={handleChange('color')} />
                    <Entrada label="Procedencia" texto="Ej: Finca El Roble"
                        value={campos.procedencia} onChange={handleChange('procedencia')} />

                    <Selector label="¿Es cría?" opciones={[
                        { value: 'si', label: 'Sí' },
                        { value: 'no', label: 'No' }
                    ]}
                        value={campos.esCria} onChange={handleChange('esCria')} />

                    {campos.esCria === 'si' && (
                        <Selector
                            label="Madre *"
                            opciones={madres.map(m => ({
                                value: m._id,
                                label: m.nombre ? `${m.identificacion} — ${m.nombre}` : m.identificacion
                            }))}
                            value={campos.madreId}
                            onChange={handleChange('madreId')}
                            error={errores.madreId}
                        />
                    )}

                    <div className="formulario-full">
                        <Entrada label="Observaciones" texto="Información adicional sobre el animal"
                            value={campos.observaciones} onChange={handleChange('observaciones')} />
                    </div>
                </div>

                <BotonPestana
                    opcion={cargando ? 'Registrando...' : 'Registrar animal'}
                    imagen={imagenG1} color="white"
                    backgroundColor="rgb(15, 74, 235)"
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

export default RegistrarAnimal