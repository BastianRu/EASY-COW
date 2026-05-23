import { useEffect, useState } from 'react'
import Contenedor from "../modules/contenedor.jsx"
import Navegar from "../modules/navegar.jsx"
import Boton from '../modules/boton.jsx'
import imagenG1 from '../images/clipboard.svg'
import imagenG2 from '../images/pulseLine.svg'
import imagenP1 from '../images/plus.svg'
import imagenP2 from '../images/reload.svg'
import imagenP3 from '../images/warning.svg'
import imagenP4 from '../images/pill.svg'
import imagenP5 from '../images/apple.svg'
import imagenProductivo from '../images/productivo.svg'
import imagenClipboardBlack from '../images/clipboard_Black.svg'
import imagenPulseBlack from '../images/pulseLine_black.svg'
import './Menu.css'
import { useNavigate } from 'react-router-dom'
import TituloPestana from "../modules/tituloPestana.jsx"
import { get } from './api.js'
function Menu (){
    const Navigate = useNavigate()
    const [estadisticas, setEstadisticas] = useState({
        totalAnimales: 0,
        enTratamiento: 0,
        actualizadosMes: 0,
        tasaSalud: 0,
    });

    useEffect(() => {
        const cargarEstadisticas = async () => {
            try {
                const response = await get('/dashboard/estadisticas');
                if (response?.data) {
                    setEstadisticas(response.data);
                }
            } catch (error) {
                // Si falla, se conservan los valores por defecto para no bloquear la vista.
            }
        };

        cargarEstadisticas();
    }, []);

    return(
        <div className="menu-body">
            <Navegar activo="home"/>
            <h1 className="titulo">Panel de control</h1>
            <p className="subtext">Gestione su finca ganadera de manera eficiente</p>
            <div className="menu-container" id="opciones">
                <Contenedor width="auto" height="auto">
                        <TituloPestana
                            imagen={imagenG1}
                            textoGrande="Gestión de inventario animal"
                            textoPequeno="Registre y actualice informacion de su ganado"
                            color="rgba(0, 255, 255, 0.247)"
                        />
                    <Boton onClick={()=>Navigate('/RegistroAnimal')}>
                        <div className="imagenPeque">
                            <img src={imagenP1} alt="plus"/>
                        </div>
                        Regristrar Nuevo Animal
                    </Boton>
                    <Boton onClick={()=>Navigate('/ActualizacionMensual')}>
                        <div className="imagenPeque">
                            <img src={imagenP2} alt="reload"/>
                        </div>
                        Actualización Mensual
                    </Boton>
                </Contenedor>
                <Contenedor width="auto" height="auto">
                        <TituloPestana
                            imagen={imagenG2}
                            textoGrande="Control Sanitario"
                            textoPequeno="Monitoree la salud y tratamientos del ganado"
                            color="rgba(11, 180, 87, 0.28)"
                        />
                    <Boton onClick={()=>Navigate('/RegistrarEnfermo')}>
                        <div className="imagenPeque">
                            <img src={imagenP3} alt="warning"/>
                        </div>
                        Registrar Ganado Enfermo
                    </Boton>
                    <Boton onClick={()=>Navigate('/SeguimientoTratamientos')}>
                        <div className="imagenPeque">
                            <img src={imagenP4} alt="pill"/>
                        </div>
                        Seguimiento de Tratamientos
                    </Boton>
                    <Boton onClick={()=>Navigate('/DietasSuplementos')}>
                        <div className="imagenPeque">
                            <img src={imagenP5} alt="apple"/>
                        </div>
                        Dietas y Suplementos
                    </Boton>
                </Contenedor>
                <Contenedor width="auto" height="auto">
                        <TituloPestana
                            imagen={imagenProductivo}
                            textoGrande="Control Productivo"
                            textoPequeno="Registre y analice la producción de leche del ganado"
                            color="rgba(239, 68, 68, 0.18)"
                        />
                    <Boton onClick={()=>Navigate('/RegistroProduccion')}>
                        <div className="imagenPeque">
                            <img src={imagenP1} alt="plus"/>
                        </div>
                        Registro Diario de Litros de Leche por Vaca
                    </Boton>
                    <Boton onClick={()=>Navigate('/AnalisisProductivo')}>
                        <div className="imagenPeque">
                            <img src={imagenProductivo} alt="productivo"/>
                        </div>
                        Identificación de Animales Más Productivos
                    </Boton>
                    <Boton onClick={()=>Navigate('/AnalisisRentabilidad')}>
                        <div className="imagenPeque">
                            <img src={imagenP2} alt="reload"/>
                        </div>
                        Análisis de Rentabilidad
                    </Boton>
                </Contenedor>
                <Contenedor width="auto" height="auto">
                        <TituloPestana
                            imagen={imagenPulseBlack}
                            textoGrande="Gestión Administrativa"
                            textoPequeno="Registre compras, ventas y genere reportes de la finca"
                            color="rgba(245, 158, 11, 0.2)"
                        />
                    <Boton onClick={()=>Navigate('/CompraGanado')}>
                        <div className="imagenPeque">
                            <img src={imagenP1} alt="plus"/>
                        </div>
                        Compra de Ganado
                    </Boton>
                    <Boton onClick={()=>Navigate('/VentaGanado')}>
                        <div className="imagenPeque">
                            <img src={imagenPulseBlack} alt="venta"/>
                        </div>
                        Venta de Ganado
                    </Boton>
                    <Boton onClick={()=>Navigate('/Reportes')}>
                        <div className="imagenPeque">
                            <img src={imagenClipboardBlack} alt="reportes"/>
                        </div>
                        Reportes y Consultas
                    </Boton>
                </Contenedor>
            </div>
            <div className="menu-container" id="estadisticas">
                <Contenedor width="auto" height="auto">
                    <p className="text">{estadisticas.totalAnimales}</p>
                    <p className="subtext">Total Animales</p>
                </Contenedor>
                <Contenedor width="auto" height="auto">
                    <p className="text">{estadisticas.enTratamiento}</p>
                    <p className="subtext">En Tratamiento</p>
                </Contenedor>
                <Contenedor width="auto" height="auto">
                    <p className="text">{estadisticas.actualizadosMes}</p>
                    <p className="subtext">Actualizados (mes)</p>
                </Contenedor>
                <Contenedor width="auto" height="auto">
                    <p className="text">{estadisticas.tasaSalud}%</p>
                    <p className="subtext">Tasa de Salud</p>
                </Contenedor>
            </div>
        </div>
    )
}
export default Menu