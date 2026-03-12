import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.VITE_BUILD_TARGET === 'mobile' ? '/' : '/SimpleWeatherService'}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}
