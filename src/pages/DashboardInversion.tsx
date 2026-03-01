import React, { useEffect, useState } from 'react';
import { getRentabilidad, getNombresInversiones } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  ArrowLeft, 
  Filter, 
  Calendar, 
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const DashboardInversion: React.FC = () => {
  const navigate = useNavigate();

  // ESTADOS (He quitado 'productos' de aquí)
  const [stats, setStats] = useState<any>(null);
  const [nombresFiltro, setNombresFiltro] = useState<string[]>([]);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', producto: '' });
  const [error, setError] = useState(false);

  // UTILIDAD: FORMATEAR MONEDA
  const fMone = (n: any) => {
    const num = Number(n) || 0;
    return num.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
  };

  // CARGAR DATOS
  const cargarTodo = async () => {
    try {
      setError(false);
      const dataStats = await getRentabilidad(filtros);
      if (dataStats) setStats(dataStats);

      const nombres = await getNombresInversiones();
      setNombresFiltro(nombres);

    } catch (e) {
      console.error("Error al cargar Dashboard:", e);
      setError(true);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, [filtros]);

  if (error) return <div className="cargando">⚠️ Error al conectar con el servidor.</div>;
  if (!stats) return <div className="cargando">Generando reporte de rentabilidad...</div>;

  return (
    <div className="pantalla-principal">
      {/* CABECERA */}
      <div className="barra-titulo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <BarChart3 size={40} />
          <span>DASHBOARD ANALÍTICO</span>
        </div>
        <button className="btn-dashboard" style={{ background: '#64748b' }} onClick={() => navigate('/inversion')}>
          <ArrowLeft /> VOLVER AL REGISTRO
        </button>
      </div>

      {/* PANEL DE FILTROS */}
      <div className="tarjeta-blanca" style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label className="subtitulo"><Filter size={14} /> Filtrar por Producto</label>
          <select 
            className="campo-gigante" 
            style={{ fontSize: '16px', padding: '10px', marginBottom: '0' }} 
            value={filtros.producto} 
            onChange={e => setFiltros({ ...filtros, producto: e.target.value })}
          >
            <option value="">Todos los productos comprados</option>
            {nombresFiltro.map((nom, i) => (
              <option key={i} value={nom}>{nom}</option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: '150px' }}>
          <label className="subtitulo"><Calendar size={14} /> Desde</label>
          <input 
            type="date" className="campo-gigante" 
            style={{ fontSize: '16px', padding: '10px', marginBottom: '0' }} 
            value={filtros.desde} 
            onChange={e => setFiltros({ ...filtros, desde: e.target.value })} 
          />
        </div>

        <div style={{ minWidth: '150px' }}>
          <label className="subtitulo"><Calendar size={14} /> Hasta</label>
          <input 
            type="date" className="campo-gigante" 
            style={{ fontSize: '16px', padding: '10px', marginBottom: '0' }} 
            value={filtros.hasta} 
            onChange={e => setFiltros({ ...filtros, hasta: e.target.value })} 
          />
        </div>

        <button 
          className="btn-dashboard" 
          onClick={() => setFiltros({ desde: '', hasta: '', producto: '' })} 
          style={{ background: '#94a3b8', height: '50px' }}
        >
          LIMPIAR
        </button>
      </div>

      {/* INDICADORES PRINCIPALES */}
      <div className="fila-indicadores">
        <div className="tarjeta-blanca indicador">
          <span className="subtitulo">Inversión Total</span>
          <span className="numero-gigante color-naranja">{fMone(stats.inversionTotalEnVentas)}</span>
        </div>

        <div className="tarjeta-blanca indicador">
          <span className="subtitulo">Ingresos Brutos</span>
          <span className="numero-gigante color-azul">{fMone(stats.ingresosTotales)}</span>
        </div>

        <div className={`tarjeta-blanca indicador ${stats.gananciaNeta > 0 ? 'borde-verde' : (stats.gananciaNeta < 0 ? 'borde-rojo' : '')}`}>
          <span className="subtitulo">Ganancia Neta</span>
          <span className={`numero-gigante ${stats.gananciaNeta > 0 ? 'color-verde' : (stats.gananciaNeta < 0 ? 'color-rojo' : 'color-azul')}`}>
            {fMone(stats.gananciaNeta)}
          </span>
        </div>
      </div>

      {/* GRÁFICO (Aquí termina el componente, NO HAY TABLA DEBAJO) */}
      <div className="tarjeta-blanca" style={{ marginTop: '30px', height: '400px', padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <TrendingUp size={20} color="#64748b" />
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px' }}>Evolución: Inversión vs Ventas</h3>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats.grafico}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(val) => `S/.${val}`} />
            <Tooltip formatter={(value: any) => [fMone(value), ""]} />
            <Legend />
            <Line type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={4} name="Ventas" dot={{ r: 6 }} />
            <Line type="monotone" dataKey="inversion" stroke="#f59e0b" strokeWidth={4} name="Inversión" dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardInversion;