import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import History from './components/History';

export default function App() {
  const [tenant, setTenant] = useState(null);
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load tenant and history on startup
  useEffect(() => {
    const savedTenant = localStorage.getItem('zerostaff_active_tenant');
    if (savedTenant) {
      setTenant(JSON.parse(savedTenant));
    }

    const savedHistory = localStorage.getItem('zerostaff_invoice_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    } else {
      // Pre-fill history with dummy data for immediate demo value
      const mockHistory = [
        {
          timestamp: Date.now() - 36 * 3600 * 1000,
          invoiceId: '6628',
          supplierName: 'DISTRIBUIDORA MUSTANG SRL',
          supplierCuit: '30-71126159-9',
          invoiceType: '1',
          invoiceTypeName: 'Factura A',
          posNumber: '00099-23125412',
          total: 90000.00,
          neto: 74380.17,
          iva: 15619.83,
          exento: 0.00,
          percIva: 0.00,
          percIibb: 0.00,
          percOtros: 0.00,
          payType: 'efectivo',
          isDemoMode: true
        },
        {
          timestamp: Date.now() - 72 * 3600 * 1000,
          invoiceId: '6630',
          supplierName: 'TELECOM ARGENTINA S.A.',
          supplierCuit: '30-63945373-8',
          invoiceType: '2',
          invoiceTypeName: 'Factura B',
          posNumber: '00004-92837493',
          total: 15000.00,
          neto: 12396.69,
          iva: 2603.31,
          exento: 0.00,
          percIva: 0.00,
          percIibb: 0.00,
          percOtros: 0.00,
          payType: 'transferencia',
          isDemoMode: true
        }
      ];
      setHistory(mockHistory);
      localStorage.setItem('zerostaff_invoice_history', JSON.stringify(mockHistory));
    }
  }, []);

  const handleLogin = (tenantData) => {
    setTenant(tenantData);
  };

  const handleLogout = () => {
    localStorage.removeItem('zerostaff_active_tenant');
    setTenant(null);
  };

  const handleAddInvoice = (newInvoice) => {
    const updatedHistory = [newInvoice, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('zerostaff_invoice_history', JSON.stringify(updatedHistory));

    // Increment AI scan quota
    if (tenant) {
      const updatedTenant = {
        ...tenant,
        quotaUsed: Math.min(tenant.quotaMax, tenant.quotaUsed + 1)
      };
      setTenant(updatedTenant);
      localStorage.setItem('zerostaff_active_tenant', JSON.stringify(updatedTenant));
    }
  };

  // AFIP Text files exporter (COMPRAS_CBTE & COMPRAS_ALICUOTAS)
  const handleExportAfip = (filteredHistory) => {
    try {
      let cbteLines = [];
      let alicLines = [];

      // Helper formatting functions
      const padNum = (num, length) => String(num || 0).replace(/\D/g, '').padStart(length, '0');
      const padText = (text, length) => String(text || '').substring(0, length).padEnd(length, ' ');
      
      const formatAfipAmount = (amount) => {
        const isNegative = amount < 0;
        const absVal = Math.abs(amount);
        const fixedVal = absVal.toFixed(2);
        const cleanVal = fixedVal.replace('.', '');
        if (isNegative) {
          return '-' + cleanVal.padStart(14, '0');
        }
        return cleanVal.padStart(15, '0');
      };

      const formatAfipRate = (rate) => {
        const fixedVal = parseFloat(rate || 1).toFixed(6);
        const cleanVal = fixedVal.replace('.', '');
        return cleanVal.padStart(10, '0');
      };

      filteredHistory.forEach(item => {
        // 1. Map invoice type to AFIP code
        let afipCbteCode = "001"; // Default Factura A
        if (item.invoiceType === "1") afipCbteCode = "001";
        else if (item.invoiceType === "2") afipCbteCode = "006";
        else if (item.invoiceType === "3") afipCbteCode = "011";
        else return; // Skip Facturas X in AFIP exports

        // 2. Parse pos and number
        let posVal = "1";
        let numVal = "1";
        if (item.posNumber && item.posNumber.includes('-')) {
          const parts = item.posNumber.split('-');
          posVal = parts[0];
          numVal = parts[1];
        } else {
          posVal = item.pos || "1";
          numVal = item.number || "1";
        }

        // 3. Date Emission formatting (AAAAMMDD)
        let dateStr = "";
        if (item.dateEmission) {
          dateStr = item.dateEmission.replace(/\D/g, '');
        }
        if (dateStr.length !== 8) {
          const d = new Date(item.timestamp || Date.now());
          dateStr = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        }

        // 4. Financial amounts
        const total = Number(item.total) || 0;
        const exento = Number(item.exento) || 0;
        const percIva = Number(item.percIva) || 0;
        const percNac = Number(item.percNac || 0);
        const percIibb = Number(item.percIibb) || 0;
        const percMun = Number(item.percMun || 0);
        const impInternos = Number(item.impInternos || item.percOtros || 0);

        const neto = item.neto !== undefined ? Number(item.neto) : (total / 1.21);
        const iva = item.iva !== undefined ? Number(item.iva) : (total - neto);

        const cuitClean = String(item.supplierCuit || '').replace(/\D/g, '');

        // 5. Generate COMPRAS_CBTE line (Exactly 325 characters)
        const cbteLine = 
          dateStr +                                         // 1. Fecha cbte (8)
          afipCbteCode +                                    // 2. Tipo cbte (3)
          padNum(posVal, 5) +                               // 3. Pto Venta (5)
          padNum(numVal, 20) +                              // 4. Nro Cbte (20)
          padText('', 16) +                                 // 5. Despacho importacion (16)
          "80" +                                            // 6. Cod doc vendedor (2)
          padNum(cuitClean, 20) +                           // 7. CUIT vendedor (20)
          padText(item.supplierName, 30) +                  // 8. Nombre vendedor (30)
          formatAfipAmount(total) +                         // 9. Total (15)
          formatAfipAmount(0) +                             // 10. Conceptos no gravados (15)
          formatAfipAmount(exento) +                        // 11. Exento (15)
          formatAfipAmount(percIva) +                       // 12. Perc IVA (15)
          formatAfipAmount(percNac) +                       // 13. Perc Nac (15)
          formatAfipAmount(percIibb) +                      // 14. Perc IIBB (15)
          formatAfipAmount(percMun) +                       // 15. Perc Mun (15)
          formatAfipAmount(impInternos) +                   // 16. Imp Internos (15)
          "PES" +                                           // 17. Cod moneda (3)
          formatAfipRate(1.0) +                             // 18. Cotizacion (10)
          "1" +                                             // 19. Cant alícuotas (1)
          " " +                                             // 20. Cod operacion (1)
          formatAfipAmount(iva) +                           // 21. Credito fiscal computable (15)
          formatAfipAmount(0) +                             // 22. Otros tributos (15)
          padNum(0, 11) +                                   // 23. CUIT emisor/corredor (11)
          padText('', 30) +                                 // 24. Denominacion emisor (30)
          formatAfipAmount(0);                              // 25. IVA Comision (15)

        cbteLines.push(cbteLine);

        // 6. Generate COMPRAS_ALICUOTAS lines (Exactly 84 characters per line)
        let afipVatCode = "0005"; // Default 21%
        const alicLine = 
          afipCbteCode +                                  // 1. Tipo cbte (3)
          padNum(posVal, 5) +                             // 2. Pto Venta (5)
          padNum(numVal, 20) +                            // 3. Nro Cbte (20)
          "80" +                                          // 4. Cod doc (2)
          padNum(cuitClean, 20) +                         // 5. CUIT (20)
          formatAfipAmount(neto) +                        // 6. Neto gravado (15)
          afipVatCode +                                   // 7. Alicuota (4)
          formatAfipAmount(iva);                          // 8. Impuesto liquidado (15)

        alicLines.push(alicLine);
      });

      if (cbteLines.length === 0) {
        alert("No se encontraron comprobantes oficiales (A, B, o C) para exportar.");
        return;
      }

      // Download files
      const cbteText = cbteLines.join('\r\n');
      const alicText = alicLines.join('\r\n');

      const downloadFile = (filename, content) => {
        const blob = new Blob([content], { type: 'text/plain;charset=ansi' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      downloadFile('COMPRAS_CBTE.txt', cbteText);
      downloadFile('COMPRAS_ALICUOTAS.txt', alicText);
    } catch (e) {
      console.error(e);
      alert("Error al generar las exportaciones: " + e.message);
    }
  };

  if (!tenant) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      
      {/* Header */}
      <Header 
        tenant={tenant} 
        onLogout={handleLogout} 
        onOpenHistory={() => setIsHistoryOpen(true)} 
      />

      {/* Main Workspace Dashboard */}
      <Dashboard 
        tenant={tenant} 
        onAddInvoice={handleAddInvoice} 
      />

      {/* Standalone History and AFIP Exporter Modal */}
      <History 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history}
        onExportAfip={handleExportAfip}
      />

    </div>
  );
}
