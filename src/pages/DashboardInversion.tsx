import React, { useEffect, useState } from 'react';
import { getRentabilidad, getNombresInversiones } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowLeft, BarChart3, Wallet, HandCoins, History } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardInversion: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [nombresFiltro, setNombresFiltro] = useState<string[]>([]);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', producto: '' });

  const fMone = (n: any) => (Number(n) || 0).toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });

  useEffect(() => {
    getRentabilidad(filtros).then(setStats).catch(() => console.log("Error de red"));
    getNombresInversiones().then(setNombresFiltro);
  }, [filtros]);

  if (!stats) return <div className="cargando">Trayendo información de la base de datos...</div>;

  return (
    <div className="pantalla-principal">
      <div className="barra-titulo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <BarChart3 size={40} />
          <span>ESTADO FINANCIERO REAL</span>
        </div>
        <button className="btn-dashboard" onClick={() => navigate('/inversion')}><ArrowLeft /> VOLVER</button>
      </div>

      <div className="fila-indicadores" style={{marginTop: '30px'}}>
        <div className="tarjeta-blanca indicador" style={{ borderTop: '8px solid #f59e0b' }}>
          <span className="subtitulo">INVERSIÓN TOTAL</span>
          <span className="numero-grande color-naranja">{fMone(stats.inversionTotal)}</span>
        </div>
        
        <div className="tarjeta-blanca indicador" style={{ borderTop: '8px solid #10b981', background: '#f0fdf4' }}>
          <span className="subtitulo" style={{color: '#166534'}}><Wallet size={16}/> EFECTIVO EN CAJA</span>
          <span className="numero-gigante color-verde">{fMone(stats.dineroEnCaja)}</span>
          <p style={{fontSize: '11px', color: '#166534'}}>Lo que ya cobraste y tienes en mano</p>
        </div>

        <div className="tarjeta-blanca indicador" style={{ borderTop: '8px solid #ef4444', background: '#fef2f2' }}>
          <span className="subtitulo" style={{color: '#991b1b'}}><HandCoins size={16}/> POR COBRAR (FIADOS)</span>
          <span className="numero-gigante color-rojo">{fMone(stats.plataPorCobrar)}</span>
          <p style={{fontSize: '11px', color: '#991b1b'}}>Deuda que falta cobrar a clientes</p>
        </div>

        <div className="tarjeta-blanca indicador" style={{ borderTop: '8px solid #3b82f6' }}>
          <span className="subtitulo">GANANCIA REAL</span>
          <span className={`numero-grande ${stats.gananciaReal >= 0 ? 'color-verde' : 'color-rojo'}`}>{fMone(stats.gananciaReal)}</span>
        </div>
      </div>

      <div className="tarjeta-blanca" style={{ marginTop: '30px', height: '400px' }}>
        <h3 className="subtitulo">Evolución: Inversión vs Caja</h3>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={stats.grafico}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => `S/ ${v}`} />
            <Tooltip formatter={(v: any) => [fMone(v), ""]} />
            <Area type="monotone" dataKey="caja" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Efectivo" />
            <Area type="monotone" dataKey="inversion" stroke="#f59e0b" fill="transparent" name="Inversión" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '30px' }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px'}}><History /><h3 className="subtitulo" style={{margin: 0}}>HISTORIAL MENSUAL</h3></div>
          <div className="tarjeta-blanca" style={{padding: 0, overflow: 'hidden'}}>
              <table style={{width: '100%', borderCollapse: 'collapse'}}>
                  <thead style={{background: '#f8fafc'}}>
                      <tr>
                          <th style={{padding: '15px', textAlign: 'left'}}>MES</th>
                          <th style={{padding: '15px'}}>EFECTIVO EN CAJA</th>
                          <th style={{padding: '15px'}}>FALTA COBRAR</th>
                          <th style={{padding: '15px'}}>INVERSIÓN</th>
                      </tr>
                  </thead>
                  <tbody>
                      {stats.grafico.map((row: any, i: number) => (
                          <tr key={i} style={{borderBottom: '1px solid #f1f5f9', textAlign: 'center'}}>
                              <td style={{padding: '15px', textAlign: 'left', fontWeight: 'bold', textTransform: 'capitalize'}}>{row.name}</td>
                              <td style={{padding: '15px', color: '#166534', fontWeight: 'bold'}}>{fMone(row.ventas - stats.plataPorCobrar)}</td>
                              <td style={{padding: '15px', color: '#ef4444'}}>{fMone(stats.plataPorCobrar)}</td>
                              <td style={{padding: '15px'}}>{fMone(row.inversion)}</td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default DashboardInversion;