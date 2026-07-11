import React, { useState } from 'react';
import { Database, Plus, Check } from 'lucide-react';

export default function Accounts({ accounts, onAddAccount }) {
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
        <div className="panel-header">
          <h2 className="panel-title">
            <Database size={18} style={{ color: 'hsl(var(--primary))' }} />
            <span>Manual / Plan de Cuentas Contables</span>
          </h2>
          <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
            {accounts.length} Cuentas Registradas
          </span>
        </div>

        <div className="panel-body">
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
                required
              />
            </div>

            <div className="form-group">
              <label>Categoría / Rubro</label>
              <select 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                <option value="Gastos Generales">Gastos Generales</option>
                <option value="Servicios y Suministros">Servicios y Suministros</option>
                <option value="Costos de Explotación">Costos de Explotación</option>
                <option value="Impuestos y Tasas">Impuestos y Tasas</option>
                <option value="Honorarios y Comisiones">Honorarios y Comisiones</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              <Plus size={14} />
              <span>Registrar Cuenta Contable</span>
            </button>

          </form>

          <div className="glass" style={{ borderRadius: '8px', padding: '16px', fontSize: '12px', color: 'hsl(var(--text-muted))', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontWeight: '700', color: 'hsl(var(--text-main))' }}>💡 Tip del Diseñador SaaS:</span>
            <span>
              Estas cuentas contables se asocian de manera fija a las fichas de proveedores. Cuando escaneas una factura, el sistema autocompleta la imputación reduciendo clics a cero.
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
