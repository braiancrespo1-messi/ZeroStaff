import React, { useState } from 'react';
import { Database, Plus } from 'lucide-react';

export default function Accounts({ accounts, useAccounting, onSetUseAccounting, onAddAccount }) {
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Gastos Generales');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCode || !newName) return;

    onAddAccount({
      code: newCode.trim(),
      name: newName.trim(),
      category: newCategory
    });

    setNewCode('');
    setNewName('');
  };

  return (
    <div className="workspace-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
      
      {/* LEFT: Chart of Accounts List */}
      <div className="panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} style={{ color: 'hsl(var(--primary))' }} />
            <h2 className="panel-title" style={{ fontSize: '15px' }}>Plan de Cuentas de Gasto</h2>
          </div>

          {/* Sliding Toggle Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
              Módulo Contable:
            </span>
            <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '20px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={useAccounting}
                onChange={(e) => onSetUseAccounting(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: useAccounting ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.08)',
                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '12px', width: '12px',
                  left: useAccounting ? '21px' : '3px',
                  bottom: '3px',
                  backgroundColor: '#fff',
                  transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
        </div>

        <div className="panel-body">
          {useAccounting ? (
            <div className="table-container" style={{ overflowY: 'auto', maxHeight: '100%' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Código</th>
                    <th style={{ width: '45%' }}>Nombre de la Cuenta</th>
                    <th style={{ width: '35%' }}>Clasificación</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(acc => (
                    <tr key={acc.code}>
                      <td style={{ fontFamily: 'monospace', fontWeight: '700', color: 'hsl(var(--primary))' }}>
                        {acc.code}
                      </td>
                      <td style={{ fontWeight: '600' }}>{acc.name}</td>
                      <td>
                        <span className="badge badge-info">{acc.category}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', color: 'hsl(var(--text-muted))', gap: '8px' }}>
              <Database size={32} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'hsl(var(--text-main))' }}>
                Módulo Contable Desactivado
              </p>
              <p style={{ fontSize: '11px', maxWidth: '280px' }}>
                Activá el interruptor de arriba si querés imputar compras a cuentas de gastos específicas y registrar asientos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Create Account Form */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <Plus size={18} style={{ color: 'hsl(var(--primary))' }} />
            <span>Agregar Nueva Cuenta</span>
          </h2>
        </div>

        <div className="panel-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div className="form-group">
              <label>Código Numérico</label>
              <input 
                type="text" 
                placeholder="Ej. 6108" 
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                disabled={!useAccounting}
                required
              />
            </div>

            <div className="form-group">
              <label>Nombre de la Cuenta</label>
              <input 
                type="text" 
                placeholder="Ej. Gastos de Publicidad" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={!useAccounting}
                required
              />
            </div>

            <div className="form-group">
              <label>Categoría / Rubro</label>
              <select 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                disabled={!useAccounting}
              >
                <option value="Gastos Generales">Gastos Generales</option>
                <option value="Servicios y Suministros">Servicios y Suministros</option>
                <option value="Costos de Explotación">Costos de Explotación</option>
                <option value="Impuestos y Tasas">Impuestos y Tasas</option>
                <option value="Honorarios y Comisiones">Honorarios y Comisiones</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '8px' }}
              disabled={!useAccounting}
            >
              <Plus size={14} />
              <span>Registrar Cuenta Contable</span>
            </button>

          </form>

          <div className="glass" style={{ borderRadius: '8px', padding: '16px', fontSize: '11px', color: 'hsl(var(--text-muted))', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontWeight: '700', color: 'hsl(var(--text-main))' }}>💡 Tip del Diseñador SaaS:</span>
            <span>
              Si desactivás la contabilidad, el campo de imputación contable de gastos desaparecerá de manera inteligente de todo el formulario de carga principal de facturas.
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
