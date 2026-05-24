import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter, Routes, Route} from "react-router-dom"
import Login from './Login.jsx'
import Menu from './Menu.jsx'
import RegistroAnimal from './RegistrarAnimal.jsx'
import ActualizarAnimal from './ActualizarAnimal.jsx'
import RegistrarEnfermo from './RegistrarEnfermo.jsx'
import SeguimientoTratamientos from './SeguimientoTratamientos.jsx'
import DietasSuplementos from './DietasSuplementos.jsx'
import RegistroProduccion from './RegistroProduccion.jsx'
import AnalisisProductivo from './AnalisisProductivo.jsx'
import AnalisisRentabilidad from './AnalisisRentabilidad.jsx'
import CompraGanado from './CompraGanado.jsx'
import VentaGanado from './VentaGanado.jsx'
import Reportes from './Reportes.jsx'
import RegistroMedicamentos from './RegistroMedicamentos.jsx'
import HistorialSanitario from './HistorialSanitario.jsx'
/* Styles */
import './styles/text.css'
import './styles/subtext.css'
import './styles/body.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login/>}/>
        <Route path='/Menu' element={<Menu/>}/>
        <Route path='/RegistroAnimal' element={<RegistroAnimal/>}/>
        <Route path='/ActualizacionMensual' element={<ActualizarAnimal/>}/>
        <Route path='/ActualizarAnimal' element={<ActualizarAnimal/>}/>
        <Route path='/RegistrarEnfermo' element={<RegistrarEnfermo/>}/>
        <Route path='/SeguimientoTratamientos' element={<SeguimientoTratamientos/>}/>
        <Route path='/DietasSuplementos' element={<DietasSuplementos/>}/>
        <Route path='/RegistroProduccion' element={<RegistroProduccion/>}/>
        <Route path='/AnalisisProductivo' element={<AnalisisProductivo/>}/>
        <Route path='/AnalisisRentabilidad' element={<AnalisisRentabilidad/>}/>
        <Route path='/CompraGanado' element={<CompraGanado/>}/>
        <Route path='/VentaGanado' element={<VentaGanado/>}/>
        <Route path='/Reportes' element={<Reportes/>}/>
        <Route path='/RegistroMedicamentos' element={<RegistroMedicamentos/>}/>
        <Route path='/HistorialSanitario' element={<HistorialSanitario/>}/>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)