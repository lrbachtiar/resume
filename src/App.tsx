import { Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import GolfPage from './pages/GolfPage'
import ResumePage from './pages/ResumePage'
import BuildPage from './pages/BuildPage'
import ProjectPage from './pages/ProjectPage'
import NotFoundPage from './pages/NotFoundPage'
import RouteEffects from './components/Shared/RouteEffects'
import ExperienceSwitcher from './components/Navigation/ExperienceSwitcher'

export default function App() {
  return (
    <>
      <RouteEffects />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/course" element={<GolfPage />} />
        <Route path="/cv" element={<ResumePage />} />
        <Route path="/build" element={<BuildPage />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <ExperienceSwitcher />
    </>
  )
}
