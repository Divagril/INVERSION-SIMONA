import React, { useEffect, useState } from 'react';
import { getRentabilidad, getProductos, getNombresInversiones } from '../services/api';
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

  // ESTADOS
  const [stats, setStats] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [nombresFiltro, setNombresFiltro] = useState<string[]>([]);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', producto: '' });
  const [error, setError] = useState(false);

  // UTILIDAD: FORMATEAR MONEDA (S/. PEN)
  const fMone = (n: any) => {
    const num = Number(n) || 0;
    return num.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });
  };

  // CARGAR DATOS DESDE EL BACKEND
  const cargarTodo = async () => {
    try {
      setError(false);
      // 1. Estadísticas filtradas (Inversión, Ventas, Gráfico)
      const dataStats = await getRentabilidad(filtros);
      if (dataStats) setStats(dataStats);

      // 2. Nombres únicos de compras para el buscador/filtro
      const nombres = await getNombresInversiones();
      setNombresFiltro(nombres);

      // 3. Datos de productos para la tabla de márgenes
      const dataProds = await getProductos();
      setProductos(dataProds);
    } catch (e) {
      console.error("Error al cargar Dashboard:", e);
      setError(true);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, [filtros]);

  // PANTALLA DE CARGA O ERROR
  if (error) return <div className="cargando">⚠️ Error al conectar con el servidor. Revisa tu conexión.</div>;
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

      {/* INDICADORES (KPIs) */}
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

      {/* GRÁFICO DE TENDENCIA */}
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

      {/* TABLA DE GANANCIAS SIMPLIFICADA */}
      <h2 style={{ marginTop: '40px', color: '#1e293b', fontSize: '24px', fontWeight: '800' }}>
        Ganancias por Producto
      </h2>
      <div className="tarjeta-blanca" style={{ marginTop: '10px', padding: '0', overflow: 'hidden' }}>
        <div className="contenedor-tabla-scroll" style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr style={{ textAlign: 'center' }}>
                <th style={{ padding: '20px', textAlign: 'left', color: '#64748b', fontSize: '13px' }}>PRODUCTO</th>
                <th style={{ padding: '20px', color: '#64748b', fontSize: '13px' }}>P. VENTA</th>
                <th style={{ padding: '20px', color: '#64748b', fontSize: '13px' }}>GANANCIA (MARGEN)</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr><td colSpan={3} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Sin datos disponibles</td></tr>
              ) : (
                productos
                  .filter(p => p.nombre.toLowerCase().includes(filtros.producto.toLowerCase()))
                  .map((p, i) => {
                    const margen = p.precio - (p.precio_compra || 0);
                    return (
                      <tr key={i} className="fila-historial" style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <td style={{ padding: '20px', fontWeight: 'bold', textAlign: 'left', color: '#1e293b' }}>{p.nombre}</td>
                        <td style={{ padding: '20px', color: '#3b82f6', fontWeight: '700' }}>{fMone(p.precio)}</td>
                        <td style={{ padding: '20px' }}>
                          <span style={{
                            padding: '6px 12px', borderRadius: '8px',
                            background: margen > 0 ? '#dcfce7' : '#fee2e2',
                            color: margen > 0 ? '#166534' : '#991b1b',
                            fontWeight: 'bold'
                          }}>
                            {fMone(margen)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '12px', textAlign: 'center', background: '#f8fafc', color: '#94a3b8', fontSize: '12px' }} className="solo-movil">
          ← Desliza para ver más detalles →
        </div>
      </div>
    </div>
  );
};

export default DashboardInversion;