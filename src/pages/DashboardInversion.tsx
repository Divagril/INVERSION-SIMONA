import React, { useEffect, useState } from 'react';
import { getRentabilidad, getNombresInversiones } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Wallet, HandCoins } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const DashboardInversion: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [nombresProductos, setNombresProductos] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState({ desde: '', hasta: '', producto: '' });
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', producto: '' });

  // Formato de moneda profesional
  const fMone = (n: any) => "S/ " + (Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });

  useEffect(() => {
    // Carga inicial de productos
    getNombresInversiones().then(setNombresProductos).catch(console.error);
  }, []);

  useEffect(() => {
    // Carga de datos según filtros
    getRentabilidad(filtros).then(setStats).catch(console.error);
  }, [filtros]);

  if (!stats) return <div className="cargando">Cargando datos financieros...</div>;

  return (
    /* CONTENEDOR DE RESPETO (Márgenes laterales) */
    <div className="pantalla-principal">
      
      {/* HEADER OSCURO PROFESIONAL */}
      <div className="barra-titulo-dark">
        <div className="titulo-texto">
          <BarChart3 size={35} />
          <span>ESTADO FINANCIERO REAL</span>
        </div>
        <button className="btn-volver" onClick={() => navigate('/inversion')}>
          <ArrowLeft size={20} /> VOLVER
        </button>
      </div>

      {/* SECCIÓN DE FILTROS (FECHAS Y PRODUCTO) */}
      <div className="contenedor-filtros">
        <div className="fila-inputs">
          <div style={{ flex: 1 }}>
            <label className="label-card" style={{ justifyContent: 'flex-start', marginBottom: '8px' }}>Desde</label>
            <input 
              type="date" 
              className="input-filtro" 
              onChange={e => setBusqueda({...busqueda, desde: e.target.value})} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="label-card" style={{ justifyContent: 'flex-start', marginBottom: '8px' }}>Hasta</label>
            <input 
              type="date" 
              className="input-filtro" 
              onChange={e => setBusqueda({...busqueda, hasta: e.target.value})} 
            />
          </div>
        </div>
        
        <label className="label-card" style={{ justifyContent: 'flex-start', marginBottom: '8px' }}>Producto Específico</label>
        <select 
          className="input-filtro" 
          style={{ width: '100%', marginBottom: '25px' }} 
          onChange={e => setBusqueda({...busqueda, producto: e.target.value})}
        >
          <option value="">-- TODOS LOS PRODUCTOS --</option>
          {nombresProductos.map((n, i) => <option key={i} value={n}>{n}</option>)}
        </select>
        
        <button className="btn-dashboard" style={{ width: '100%' }} onClick={() => setFiltros(busqueda)}>
          FILTRAR RESULTADOS
        </button>
      </div>

      {/* GRID DE INDICADORES (4 TARJETAS) */}
      <div className="grid-indicadores">
        {/* INVERSIÓN */}
        <div className="card-pos borde-naranja">
          <span className="label-card">INVERSIÓN TOTAL</span>
          <span className="valor-card color-naranja">{fMone(stats.inversionTotal)}</span>
        </div>

        {/* CAJA */}
        <div className="card-pos borde-verde">
          <span className="label-card"><Wallet size={18} style={{marginRight: '8px'}}/> DINERO EN CAJA</span>
          <span className="valor-card color-verde">{fMone(stats.dineroEnCaja)}</span>
        </div>

        {/* FIADOS */}
        <div className="card-pos borde-rojo">
          <span className="label-card"><HandCoins size={18} style={{marginRight: '8px'}}/> TOTAL FIADOS</span>
          <span className="valor-card color-rojo">{fMone(stats.plataPorCobrar)}</span>
        </div>

        {/* GANANCIA */}
        <div className="card-pos borde-azul">
          <span className="label-card">GANANCIA NETA</span>
          <span className={`valor-card ${stats.gananciaReal >= 0 ? 'color-verde' : 'color-rojo'}`}>
            {fMone(stats.gananciaReal)}
          </span>
        </div>
      </div>

      {/* SECCIÓN DEL GRÁFICO CIRCULAR */}
      <div className="card-grafico">
        <h3 className="label-card" style={{ marginBottom: '30px', fontSize: '22px' }}>DISTRIBUCIÓN FINANCIERA</h3>
        <div style={{ height: '400px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={[
                  { name: 'Caja', value: stats.dineroEnCaja > 0 ? stats.dineroEnCaja : 0 }, 
                  { name: 'Fiados', value: stats.plataPorCobrar }, 
                  { name: 'Inversión', value: stats.inversionTotal }
                ]} 
                /* Responsivo: Si la pantalla es pequeña, la dona es más chica */
                innerRadius={window.innerWidth < 768 ? 60 : 100} 
                outerRadius={window.innerWidth < 768 ? 90 : 140} 
                paddingAngle={8} 
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                formatter={(v: any) => fMone(v)} 
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardInversion;