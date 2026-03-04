import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Wallet, HandCoins, History } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getRentabilidad, getNombresInversiones } from '../services/api';

const DashboardInversion: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', producto: '' });
  const [busqueda, setBusqueda] = useState({ desde: '', hasta: '', producto: '' });


  const fMone = (n: any) => (Number(n) || 0).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });

  const [nombresProductos, setNombresProductos] = useState<string[]>([]);

  useEffect(() => {
    getRentabilidad(filtros).then(setStats);
  }, [filtros]);
  useEffect(() => {
    getRentabilidad(filtros).then(setStats).catch(() => console.log("Error al cargar"));
  }, [filtros]);

  if (!stats) return <div className="cargando">Cargando datos...</div>;

  return (
    <div className="pantalla-principal">
      <div className="barra-titulo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <BarChart3 size={40} />
          <span>ESTADO FINANCIERO REAL</span>
        </div>
        <button className="btn-dashboard" onClick={() => navigate('/inversion')}><ArrowLeft /> VOLVER</button>
      </div>

      <div className="tarjeta-blanca" style={{ marginTop: '30px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" className="campo-gigante" style={{marginBottom: 0, padding: '10px', fontSize: '16px', flex: 1}} onChange={e => setBusqueda({...busqueda, desde: e.target.value})} />
          <input type="date" className="campo-gigante" style={{marginBottom: 0, padding: '10px', fontSize: '16px', flex: 1}} onChange={e => setBusqueda({...busqueda, hasta: e.target.value})} />
    
          <div style={{ flex: 1 }}>
              <input list="listaProductos" className="campo-gigante" style={{marginBottom: 0, padding: '10px', fontSize: '16px', width: '100%'}} placeholder="Producto" onChange={e => setBusqueda({...busqueda, producto: e.target.value})} />
              <datalist id="listaProductos">
                  {nombresProductos.map((nombre, index) => <option key={index} value={nombre} />)}
              </datalist>
          </div>

          {/* BOTÓN DE FILTRAR */}
          <button className="btn-dashboard" style={{padding: '10px 20px'}} onClick={() => setFiltros(busqueda)}>
              FILTRAR
          </button>
      </div>

      <div className="fila-indicadores" style={{marginTop: '30px'}}>
        <div className="tarjeta-blanca indicador" style={{ borderTop: '8px solid #f59e0b' }}>
          <span className="subtitulo">INVERSIÓN</span>
          <span className="numero-grande color-naranja">{fMone(stats.inversionTotal)}</span>
        </div>
        <div className="tarjeta-blanca indicador" style={{ borderTop: '8px solid #10b981', background: '#f0fdf4' }}>
          <span className="subtitulo" style={{color: '#166534'}}><Wallet size={16}/> CAJA</span>
          <span className="numero-gigante color-verde">{fMone(stats.dineroEnCaja)}</span>
        </div>
        <div className="tarjeta-blanca indicador" style={{ borderTop: '8px solid #ef4444', background: '#fef2f2' }}>
          <span className="subtitulo" style={{color: '#991b1b'}}><HandCoins size={16}/> FIADOS</span>
          <span className="numero-gigante color-rojo">{fMone(stats.plataPorCobrar)}</span>
        </div>
        <div className="tarjeta-blanca indicador" style={{ borderTop: '8px solid #3b82f6' }}>
          <span className="subtitulo">GANANCIA</span>
          <span className={`numero-grande ${stats.gananciaReal >= 0 ? 'color-verde' : 'color-rojo'}`}>{fMone(stats.gananciaReal)}</span>
        </div>
      </div>

      <div className="tarjeta-blanca" style={{ marginTop: '30px', height: '400px' }}>
        <h3 className="subtitulo">Distribución Financiera</h3>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie data={[{name: 'Caja', value: stats.dineroEnCaja > 0 ? stats.dineroEnCaja : 0}, {name: 'Fiados', value: stats.plataPorCobrar}, {name: 'Inversión', value: stats.inversionTotal}]} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
              <Cell fill="#10b981" /><Cell fill="#ef4444" /><Cell fill="#f59e0b" />
            </Pie>
            <Tooltip formatter={(v: any) => fMone(v)} /><Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* AQUÍ ESTÁ TU TABLA DE REGRESO */}
      <div style={{ marginTop: '30px' }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px'}}><History /><h3 className="subtitulo" style={{margin: 0}}>HISTORIAL MENSUAL</h3></div>
          <div className="tarjeta-blanca" style={{padding: 0, overflow: 'hidden'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead style={{background: '#f8fafc'}}>
                      <tr>
                          <th style={{padding: '15px', textAlign: 'left'}}>EFECTIVO EN CAJA</th>
                          <th style={{padding: '15px'}}>FALTA COBRAR</th>
                          <th style={{padding: '15px'}}>INVERSIÓN</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr style={{borderBottom: '1px solid #f1f5f9', textAlign: 'center'}}>
                          <td style={{padding: '15px', color: '#166534', fontWeight: 'bold'}}>{fMone(stats.dineroEnCaja)}</td>
                          <td style={{padding: '15px', color: '#ef4444'}}>{fMone(stats.plataPorCobrar)}</td>
                          <td style={{padding: '15px'}}>{fMone(stats.inversionTotal)}</td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default DashboardInversion;