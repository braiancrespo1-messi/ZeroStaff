import React, { useState, useMemo } from 'react';
import { X, Search, Download, ExternalLink, ChevronUp, ChevronDown, History as HistoryIcon } from 'lucide-react';

export default function History({ isOpen, onClose, history, onExportAfip, isFullPage = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showX, setShowX] = useState(false);
  const [sortCol, setSortCol] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');

  // Filter and Sort history list
  const filteredHistory = useMemo(() => {
    let result = [...history];

    // 1. Facturas X filter
    if (!showX) {
      result = result.filter(item => {
        const nameLower = String(item.invoiceTypeName || '').toLowerCase();
        const typeStr = String(item.invoiceType || '');
        return typeStr !== '17' && !nameLower.includes('factura x');
      });
    }

    // 2. Search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(item => 
        String(item.supplierName || '').toLowerCase().includes(term) ||
        String(item.supplierCuit || '').replace(/\D/g, '').includes(term) ||
        String(item.posNumber || '').toLowerCase().includes(term)
      );
    }

    // 3. Sorting
    result.sort((a, b) => {
      let valA, valB;

      if (sortCol === 'timestamp') {
        valA = new Date(a.timestamp || 0).getTime();
        valB = new Date(b.timestamp || 0).getTime();
      } else if (sortCol === 'tipo') {
        valA = String(a.invoiceTypeName || '');
        valB = String(b.invoiceTypeName || '');
      } else if (sortCol === 'comprobante') {
        valA = String(a.posNumber || '');
        valB = String(b.posNumber || '');
      } else if (sortCol === 'proveedor') {
        valA = String(a.supplierName || '').toLowerCase();
        valB = String(b.supplierName || '').toLowerCase();
      } else if (sortCol === 'cuit') {
        valA = String(a.supplierCuit || '').replace(/\D/g, '');
        valB = String(b.supplierCuit || '').replace(/\D/g, '');
      } else if (sortCol === 'neto') {
        valA = a.neto !== undefined ? Number(a.neto) : (Number(a.total || 0) / 1.21);
        valB = b.neto !== undefined ? Number(b.neto) : (Number(b.total || 0) / 1.21);
      } else if (sortCol === 'exento') {
        valA = Number(a.exento || 0);
        valB = Number(b.exento || 0);
      } else if (sortCol === 'iva') {
        valA = a.iva !== undefined ? Number(a.iva) : (Number(a.total || 0) - (Number(a.total || 0) / 1.21));
        valB = b.iva !== undefined ? Number(b.iva) : (Number(b.total || 0) - (Number(b.total || 0) / 1.21));
      } else if (sortCol === 'percIva') {
        valA = Number(a.percIva || 0);
        valB = Number(b.percIva || 0);
      } else if (sortCol === 'percIibb') {
        valA = Number(a.percIibb || 0);
        valB = Number(b.percIibb || 0);
      } else if (sortCol === 'percOtros') {
        valA = Number(a.percNac || 0) + Number(a.percMun || 0) + Number(a.impInternos || 0);
        valB = Number(b.percNac || 0) + Number(b.percMun || 0) + Number(b.impInternos || 0);
      } else if (sortCol === 'total') {
        valA = Number(a.total || 0);
        valB = Number(b.total || 0);
      } else if (sortCol === 'payType') {
        valA = String(a.payType || '');
        valB = String(b.payType || '');
      } else {
        valA = 0;
        valB = 0;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [history, searchTerm, showX, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const renderSortArrow = (col) => {
    if (sortCol !== col) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} style={{ marginLeft: '4px' }} /> : <ChevronDown size={12} style={{ marginLeft: '4px' }} />;
  };

  if (!isFullPage && !isOpen) return null;

  // The inner content structure
  const content = (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      width: '100%', 
      background: isFullPage ? 'transparent' : 'hsl(var(--card))',
      padding: isFullPage ? '0' : '0'
    }}>
      {/* Header */}
      <div className={isFullPage ? '' : 'modal-header'} style={isFullPage ? { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0 0 12px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      } : {}}>
        <h3 style={{ fontWeight: '700', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <HistoryIcon size={20} style={{ color: 'hsl(var(--primary))' }} />
          <span>Historial de Comprobantes (Libro de IVA Digital)</span>
        </h3>
        {!isFullPage && (
          <button onClick={onClose} className="btn btn-secondary btn-icon-only" style={{ background: 'none', border: 'none', padding: 0 }}>
            <X size={20} style={{ color: 'hsl(var(--text-muted))' }} />
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="glass" style={{
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '12px',
        margin: isFullPage ? '16px 0' : '12px 0',
        gap: '16px'
      }}>
        {/* Search bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={14} style={{ color: 'hsl(var(--text-muted))', position: 'absolute', left: '10px', top: '12px' }} />
          <input 
            type="text" 
            placeholder="Buscar por proveedor, CUIT o nro..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '32px', height: '36px' }}
          />
        </div>

        {/* Show X Checkbox */}
        <div 
          onClick={() => setShowX(!showX)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
        >
          <input 
            type="checkbox" 
            checked={showX}
            onChange={() => {}} // handled by parent onClick
            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'hsl(var(--primary))' }}
          />
          <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Mostrar Facturas X</span>
        </div>
      </div>

      {/* Table Area */}
      <div className="table-container" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <table>
          <thead>
            <tr style={{ cursor: 'pointer', userSelect: 'none' }}>
              <th onClick={() => handleSort('timestamp')} style={{ width: '10%' }}>Fecha {renderSortArrow('timestamp')}</th>
              <th onClick={() => handleSort('tipo')} style={{ width: '8%' }}>Tipo {renderSortArrow('tipo')}</th>
              <th onClick={() => handleSort('comprobante')} style={{ width: '10%' }}>Comprobante {renderSortArrow('comprobante')}</th>
              <th onClick={() => handleSort('proveedor')} style={{ width: '14%' }}>Proveedor {renderSortArrow('proveedor')}</th>
              <th onClick={() => handleSort('cuit')} style={{ width: '10%' }}>CUIT {renderSortArrow('cuit')}</th>
              <th onClick={() => handleSort('neto')} style={{ width: '8%', textAlign: 'right' }}>Neto {renderSortArrow('neto')}</th>
              <th onClick={() => handleSort('exento')} style={{ width: '7%', textAlign: 'right' }}>Exento {renderSortArrow('exento')}</th>
              <th onClick={() => handleSort('iva')} style={{ width: '8%', textAlign: 'right' }}>IVA {renderSortArrow('iva')}</th>
              <th onClick={() => handleSort('percIva')} style={{ width: '7%', textAlign: 'right' }}>P. IVA {renderSortArrow('percIva')}</th>
              <th onClick={() => handleSort('percIibb')} style={{ width: '7%', textAlign: 'right' }}>P. IIBB {renderSortArrow('percIibb')}</th>
              <th onClick={() => handleSort('percOtros')} style={{ width: '7%', textAlign: 'right' }}>Otros {renderSortArrow('percOtros')}</th>
              <th onClick={() => handleSort('total')} style={{ width: '8%', textAlign: 'right' }}>Total {renderSortArrow('total')}</th>
              <th onClick={() => handleSort('payType')} style={{ width: '10%' }}>Pago {renderSortArrow('payType')}</th>
              {!isFullPage && <th style={{ width: '6%', textAlign: 'center' }}>Acción</th>}
            </tr>
          </thead>
          <tbody>
            {filteredHistory.length === 0 ? (
              <tr>
                <td colSpan={isFullPage ? 13 : 14} style={{ textAlign: 'center', padding: '30px', color: 'hsl(var(--text-muted))', fontSize: '13px' }}>
                  No se encontraron comprobantes oficiales para los criterios seleccionados.
                </td>
              </tr>
            ) : (
              filteredHistory.map((item, idx) => {
                const dateObj = new Date(item.timestamp);
                const formattedDate = dateObj.toLocaleDateString('es-AR') + ' ' + dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

                const total = Number(item.total) || 0;
                const neto = item.neto !== undefined ? Number(item.neto) : (total / 1.21);
                const iva = item.iva !== undefined ? Number(item.iva) : (total - neto);
                const exento = Number(item.exento) || 0;
                const percIva = Number(item.percIva) || 0;
                const percIibb = Number(item.percIibb) || 0;
                const percOtros = Number(item.percNac || 0) + Number(item.percMun || 0) + Number(item.impInternos || 0);

                return (
                  <tr key={item.invoiceId || idx}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formattedDate}</td>
                    <td>{item.invoiceTypeName || 'Factura'}</td>
                    <td style={{ fontWeight: '600' }}>{item.posNumber || '—'}</td>
                    <td style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.supplierName}>
                      {item.supplierName}
                    </td>
                    <td>{item.supplierCuit || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>$ {neto.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>$ {exento.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>$ {iva.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>$ {percIva.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>$ {percIibb.toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>$ {percOtros.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: 'hsl(var(--success))' }}>$ {total.toFixed(2)}</td>
                    <td>
                      {item.payType === 'efectivo' && <span className="badge badge-success">💵 Efec.</span>}
                      {item.payType === 'transferencia' && <span className="badge badge-info">🏦 Transf.</span>}
                      {item.payType === 'electronico' && <span className="badge badge-warning">💳 Tarj.</span>}
                      {item.payType === 'cta_cte' && <span className="badge badge-secondary">Cta. Cte.</span>}
                      {!item.payType && <span style={{ color: 'hsl(var(--text-muted))' }}>—</span>}
                    </td>
                    {!isFullPage && (
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Demo</span>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Export */}
      <div style={{
        padding: '16px 0 0 0',
        display: 'flex',
        justifyContent: 'flex-end',
        borderTop: isFullPage ? 'none' : '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <button 
          onClick={() => onExportAfip(filteredHistory)}
          className="btn btn-primary" 
          disabled={filteredHistory.length === 0}
          style={{ gap: '6px' }}
        >
          <Download size={14} />
          <span>Exportar Libro IVA Digital (AFIP/ARCA)</span>
        </button>
      </div>
    </div>
  );

  if (isFullPage) {
    return (
      <div className="panel" style={{ flex: 1, margin: '20px', minHeight: 0, height: 'calc(100vh - 112px)' }}>
        {content}
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '1240px', width: '92vw', height: 'min(780px, 92vh)', display: 'flex', flexDirection: 'column', padding: '24px' }}>
        {content}
      </div>
    </div>
  );
}
