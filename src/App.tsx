import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import Investment from './pages/Investment';
import DashboardInversion from './pages/DashboardInversion'; // Importar
import './App.css';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/inversion" element={<Investment />} />
          <Route path="/dashboard" element={<DashboardInversion />} />
          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/inversion" />} />
          {/* Captura de rutas no encontradas */}
          <Route path="*" element={<div style={{padding: 20}}><h1>404 - Página no encontrada</h1></div>} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;