import React, { useEffect, useState } from 'react';
import { getRentabilidad, getNombresInversiones } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Wallet, HandCoins, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const DashboardInversion: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [nombresProductos, setNombresProductos] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState({ desde: '', hasta: '', producto: '' });
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', producto: '' });

  const fMone = (n: any) => "S/ " + (Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });

  useEffect(() => {
    getNombresInversiones().then(setNombresProductos).catch(console.error);
  }, []);

  useEffect(() => {
    getRentabilidad(filtros).then(setStats).catch(console.error);
  }, [filtros]);

  if (!stats) return <div className="cargando">Cargando datos...</div>;

  return (
    <div className="pantalla-principal">
      
      {/* HEADER */}
      <div className="barra-titulo-dark">
        <div className="titulo-texto">
          <BarChart3 size={35} />
          <span>ESTADO FINANCIERO REAL</span>
        </div>
        <button className="btn-volver" onClick={() => navigate('/inversion')}>
          <ArrowLeft size={20} /> VOLVER
        </button>
      </div>

      {/* SECCIÓN DE FILTROS EN UNA SOLA FILA */}
      <div className="contenedor-filtros">
        <div className="fila-filtros-pc">
          
          <div className="grupo-input">
            <label className="label-card" style={{ justifyContent: 'flex-start' }}>Desde</label>
            <input 
              type="date" 
              className="input-filtro" 
              onChange={e => setBusqueda({...busqueda, desde: e.target.value})} 
            />
          </div>

          <div className="grupo-input">
            <label className="label-card" style={{ justifyContent: 'flex-start' }}>Hasta</label>
            <input 
              type="date" 
              className="input-filtro" 
              onChange={e => setBusqueda({...busqueda, hasta: e.target.value})} 
            />
          </div>

          {/* SELECT DE PRODUCTO CORREGIDO */}
          <div className="grupo-input" style={{ flex: 1.5 }}>
            <label className="label-card" style={{ justifyContent: 'flex-start' }}>Producto Específico</label>
            <select 
              className="input-filtro" 
              value={busqueda.producto} 
              onChange={e => setBusqueda({...busqueda, producto: e.target.value})}
            >
               <option value="">-- TODOS LOS PRODUCTOS --</option>
               {nombresProductos.map((nombre, index) => (
                 <option key={index} value={nombre}>{nombre}</option>
               ))}
            </select>
          </div>

          <button className="btn-dashboard-filtro" onClick={() => setFiltros(busqueda)}>
            <Filter size={18} /> FILTRAR
          </button>

        </div>
      </div>

      {/* INDICADORES */}
      <div className="grid-indicadores">
        <div className="card-pos borde-naranja">
          <span className="label-card">INVERSIÓN</span>
          <span className="valor-card color-naranja">{fMone(stats.inversionTotal)}</span>
        </div>

        <div className="card-pos borde-verde">
          <span className="label-card">CAJA</span>
          <span className="valor-card color-verde">{fMone(stats.dineroEnCaja)}</span>
        </div>

        <div className="card-pos borde-rojo">
          <span className="label-card">FIADOS</span>
          <span className="valor-card color-rojo">{fMone(stats.plataPorCobrar)}</span>
        </div>

        <div className="card-pos borde-azul">
          <span className="label-card">GANANCIA</span>
          <span className={`valor-card ${stats.gananciaReal >= 0 ? 'color-verde' : 'color-rojo'}`}>
            {fMone(stats.gananciaReal)}
          </span>
        </div>
      </div>

      {/* GRÁFICO */}
      <div className="card-grafico">
        <h3 className="label-card" style={{ marginBottom: '30px', fontSize: '20px' }}>DISTRIBUCIÓN FINANCIERA</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={[
                  {name: 'Caja', value: stats.dineroEnCaja > 0 ? stats.dineroEnCaja : 0}, 
                  {name: 'Fiados', value: stats.plataPorCobrar}, 
                  {name: 'Inversión', value: stats.inversionTotal}
                ]} 
                innerRadius={window.innerWidth < 768 ? 60 : 100} 
                outerRadius={window.innerWidth < 768 ? 90 : 140} 
                paddingAngle={5} 
                dataKey="value"
              >
                <Cell fill="#10b981" /><Cell fill="#ef4444" /><Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardInversion;