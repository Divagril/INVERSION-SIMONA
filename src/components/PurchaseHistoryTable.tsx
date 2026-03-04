import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, Calendar, Box, AlertCircle } from 'lucide-react';
import { getInversiones, eliminarInversion } from '../services/api';

interface Props { 
  refreshKey: number; 
  onEdit: (inv: any) => void; 
}

const PurchaseHistoryTable: React.FC<Props> = ({ refreshKey, onEdit }) => {
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Función para cargar los datos desde el servidor
  const cargarHistorial = async () => {
    try {
      setCargando(true);
      const data = await getInversiones();
      setHistorial(data || []);
    } catch (e) {
      console.error("Error al cargar el historial:", e);
    } finally {
      setCargando(false);
    }
  };

  // Se ejecuta cada vez que 'refreshKey' cambia (cuando guardamos o editamos)
  useEffect(() => {
    cargarHistorial();
  }, [refreshKey]);

  // Función para eliminar un registro
  const handleBorrar = async (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar este registro de compra del historial?")) {
      try {
        await eliminarInversion(id);
        cargarHistorial(); // Refresca la lista automáticamente
      } catch (e) {
        alert("Error al eliminar el registro");
      }
    }
  };

  return (
    <div className="tarjeta-blanca" style={{ marginTop: '30px', padding: '0', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
      
      {/* CABECERA DE LA TABLA */}
      <div style={{ 
        padding: '20px', 
        background: '#f8fafc', 
        borderBottom: '2px solid #e2e8f0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={22} color="#1e293b" />
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: '800' }}>HISTORIAL DE INGRESOS</h3>
        </div>
        {historial.length > 0 && (
          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold', background: '#e2e8f0', padding: '4px 10px', borderRadius: '8px' }}>
            {historial.length} Registros
          </span>
        )}
      </div>

      {/* CONTENEDOR CON SCROLL HORIZONTAL PARA MÓVILES */}
      <div className="contenedor-tabla-scroll" style={{ width: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '15px', color: '#64748b', fontSize: '13px' }}>FECHA</th>
              <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '13px' }}>PRODUCTO</th>
              <th style={{ padding: '15px', color: '#64748b', fontSize: '13px' }}>FORMATO / UNID.</th>
              <th style={{ padding: '15px', color: '#64748b', fontSize: '13px' }}>TOTAL COSTO</th>
              <th style={{ padding: '15px', color: '#64748b', fontSize: '13px' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Cargando historial...</td></tr>
            ) : historial.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '50px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#94a3b8' }}>
                    <AlertCircle size={40} />
                    <span>No hay compras registradas en el historial.</span>
                  </div>
                </td>
              </tr>
            ) : (
              historial.map((inv) => (
                <tr key={inv._id} className="fila-historial" style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                  
                  {/* FECHA */}
                  <td style={{ padding: '15px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
                    {new Date(inv.fecha).toLocaleDateString()}
                  </td>

                  {/* PRODUCTO */}
                  <td style={{ padding: '15px', textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '16px', textTransform: 'capitalize' }}>
                      {inv.nombre}
                    </div>
                  </td>
                  
                  {/* FORMATO Y CÁLCULO DE UNIDADES */}
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontWeight: '800', color: '#334155', fontSize: '15px' }}>
                      {inv.cantidad_formato} {inv.formato_compra} 
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Box size={12} /> {inv.total_unidades_compradas || (inv.cantidad_formato * (inv.unidades_por_formato || 1))} Unidades
                    </div>
                  </td>

                  {/* COSTO TOTAL */}
                  <td style={{ padding: '15px', color: '#166534', fontWeight: '900', fontSize: '17px', textAlign: 'center' }}>
                    S/. {Number(inv.costo_total).toFixed(2)}
                  </td>

                  {/* BOTONES DE ACCIÓN */}
                  <td style={{ padding: '15px' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button 
                        className="btn-icon btn-edit" 
                        title="Editar compra"
                        onClick={() => onEdit(inv)}
                        style={{ border: '2px solid #0369a1' }}
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        className="btn-icon btn-delete" 
                        title="Eliminar registro"
                        onClick={() => handleBorrar(inv._id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* AVISO DE DESLIZAMIENTO EN MÓVIL */}
      <div style={{ padding: '10px', textAlign: 'center', background: '#f8fafc', color: '#94a3b8', fontSize: '11px', display: 'block' }} className="solo-movil">
        ← Desliza hacia los lados para ver más detalles →
      </div>
    </div>
  );
};

export default PurchaseHistoryTable;