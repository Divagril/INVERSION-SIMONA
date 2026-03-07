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

  const fMone = (n: any) => "S/ " + (Number(n) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });

  useEffect(() => {
    getNombresInversiones().then(setNombresProductos).catch(console.error);
    getRentabilidad(filtros).then(setStats).catch(console.error);
  }, [filtros]);

  if (!stats) return <div className="cargando">Cargando...</div>;

  return (
    <div>
      {/* HEADER OSCURO */}
      <div className="barra-titulo-dark">
        <div className="titulo-texto">
          <BarChart3 size={40} />
          <span>ESTADO FINANCIERO REAL</span>
        </div>
        <button className="btn-volver" onClick={() => navigate('/inversion')}>
          <ArrowLeft size={20} /> VOLVER
        </button>
      </div>

      {/* FILTROS */}
      <div className="contenedor-filtros">
        <div className="fila-inputs">
          <input type="date" className="input-filtro" onChange={e => setBusqueda({...busqueda, desde: e.target.value})} />
          <input type="date" className="input-filtro" onChange={e => setBusqueda({...busqueda, hasta: e.target.value})} />
        </div>
        <select className="input-filtro" style={{width: '100%', marginBottom: '20px'}} onChange={e => setBusqueda({...busqueda, producto: e.target.value})}>
           <option value="">-- SELECCIONE PRODUCTO --</option>
           {nombresProductos.map((n, i) => <option key={i} value={n}>{n}</option>)}
        </select>
        <button className="btn-dashboard" onClick={() => setFiltros(busqueda)}>FILTRAR</button>
      </div>

      {/* INDICADORES (COMO EN TU IMAGEN) */}
      <div className="grid-indicadores">
        <div className="card-pos borde-naranja">
          <span className="label-card">INVERSIÓN</span>
          <span className="valor-card color-naranja">{fMone(stats.inversionTotal)}</span>
        </div>

        <div className="card-pos borde-verde">
          <span className="label-card"><Wallet size={16}/> CAJA</span>
          <span className="valor-card color-verde">{fMone(stats.dineroEnCaja)}</span>
        </div>

        <div className="card-pos borde-rojo">
          <span className="label-card"><HandCoins size={16}/> FIADOS</span>
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
        <h3 className="label-card" style={{marginBottom: '30px'}}>DISTRIBUCIÓN FINANCIERA</h3>
        <div style={{ height: '400px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={[
                  {name: 'Caja', value: stats.dineroEnCaja > 0 ? stats.dineroEnCaja : 0}, 
                  {name: 'Fiados', value: stats.plataPorCobrar}, 
                  {name: 'Inversión', value: stats.inversionTotal}
                ]} 
                /* CAMBIO AQUÍ: Radios más pequeños para móvil */
                innerRadius={window.innerWidth < 768 ? 60 : 100} 
                outerRadius={window.innerWidth < 768 ? 90 : 140} 
                paddingAngle={5} 
                dataKey="value"
              >
                <Cell fill="#10b981" /><Cell fill="#ef4444" /><Cell fill="#f59e0b" />
              </Pie>
              <Tooltip formatter={(v: any) => fMone(v)} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardInversion;