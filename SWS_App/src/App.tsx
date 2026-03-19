import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
  }, [theme])

  return (
    <BrowserRouter basename={import.meta.env.VITE_BUILD_TARGET === 'mobile' ? '/' : '/SimpleWeatherService'}>
      <Routes>
        <Route path="/" element={<HomePage theme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="*" element={<HomePage theme={theme} onToggleTheme={toggleTheme} />} />
      </Routes>
    </BrowserRouter>
  )
}
