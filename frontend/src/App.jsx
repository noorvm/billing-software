import LoginPage from './assets/LoginPage'
import Admin from './assets/UserInterface/Admin/Admin'
import Staff from './assets/UserInterface/Staff/Staff'
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom"

function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path='/admin' element={<Admin />} />
        <Route path="/mobile-admin" element={<Admin isMobile={false} />} />
        <Route path='/staff' element={<Staff />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
