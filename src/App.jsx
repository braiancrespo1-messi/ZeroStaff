import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Suppliers from './components/Suppliers';
import Accounts from './components/Accounts';
import History from './components/History';

export default function App() {
  const [tenant, setTenant] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, suppliers, accounts, history
  
  const [history, setHistory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  // Accounting Module toggle state (persisted)
  const [useAccounting, setUseAccounting] = useState(true);

  // Load tenant session and initial databases on startup
  useEffect(() => {
    // 1. Session load
    const savedTenant = localStorage.getItem('zerostaff_active_tenant');
    if (savedTenant) {
      setTenant(JSON.parse(savedTenant));
    }

    // 2. Accounting Toggle setting load
    const savedAccounting = localStorage.getItem('zerostaff_use_accounting');
    if (savedAccounting !== null) {
      setUseAccounting(JSON.parse(savedAccounting));
    }

    // 3. Chart of Accounts load / default
    const savedAccounts = localStorage.getItem('zerostaff_accounts');
    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    } else {
      const defaultAccounts = [
        { code: '6101', name: 'Compra de Mercadería e Insumos', category: 'Costos de Explotación' },
        { code: '6102', name: 'Gastos de Oficina y Papelería', category: 'Gastos Generales' },
        { code: '6103', name: 'Servicios Públicos (Luz, Agua, Gas)', category: 'Servicios y Suministros' },
        { code: '6104', name: 'Internet y Telecomunicaciones', category: 'Servicios y Suministros' },
        { code: '6105', name: 'Honorarios Profesionales', category: 'Honorarios y Comisiones' },
        { code: '6106', name: 'Mantenimiento y Reparaciones', category: 'Gastos Generales' },
        { code: '6107', name: 'Gastos de Logística y Fletes', category: 'Costos de Explotación' }
      ];
      setAccounts(defaultAccounts);
      localStorage.setItem('zerostaff_accounts', JSON.stringify(defaultAccounts));
    }

    // 4. Supplier list load / default
    const savedSuppliers = localStorage.getItem('zerostaff_suppliers');
    if (savedSuppliers) {
      setSuppliers(JSON.parse(savedSuppliers));
    } else {
      const defaultSuppliers = [
        {
          cuit: '30711261599',
          name: 'DISTRIBUIDORA MUSTANG SRL',
          address: 'Av. Directorio 456, CABA',
          taxCondition: 'Responsable Inscripto',
          province: 'CABA',
          defaultAccount: '6101'
        },
        {
          cuit: '30639453738',
          name: 'TELECOM ARGENTINA S.A.',
          address: 'Alicia Moreau de Justo 50, CABA',
          taxCondition: 'Responsable Inscripto',
          province: 'CABA',
          defaultAccount: '6104'
        },
        {
          cuit: '33711261599',
          name: 'BRAI SRL',
          address: 'Av. Corrientes 1234, CABA',
          taxCondition: 'Responsable Inscripto',
          province: 'CABA',
          defaultAccount: '6102'
        }
      ];
      setSuppliers(defaultSuppliers);
      localStorage.setItem('zerostaff_suppliers', JSON.stringify(defaultSuppliers));
    }

    // 5. Invoice History load / default
    const savedHistory = localStorage.getItem('zerostaff_invoice_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    } else {
      const defaultHistory = [
        {
          timestamp: Date.now() - 36 * 3600 * 1000,
          invoiceId: 'inv_1',
          supplierName: 'DISTRIBUIDORA MUSTANG SRL',
          supplierCuit: '30711261599',
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
          payType: 'cta_cte',
          isDemoMode: true
        },
        {
          timestamp: Date.now() - 72 * 3600 * 1000,
          invoiceId: 'inv_2',
          supplierName: 'TELECOM ARGENTINA S.A.',
          supplierCuit: '30639453738',
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
      setHistory(defaultHistory);
      localStorage.setItem('zerostaff_invoice_history', JSON.stringify(defaultHistory));
    }
  }, []);

  const handleLogin = (tenantData) => {
    setTenant(tenantData);
  };

  const handleLogout = () => {
    localStorage.removeItem('zerostaff_active_tenant');
    setTenant(null);
    setCurrentView('dashboard');
  };

  const handleAddInvoice = (newInvoice) => {
    const updatedHistory = [newInvoice, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('zerostaff_invoice_history', JSON.stringify(updatedHistory));

    // Update AI scan usage quota stats
    if (tenant) {
      const updatedTenant = {
        ...tenant,
        quotaUsed: Math.min(tenant.quotaMax, tenant.quotaUsed + 1)
      };
      setTenant(updatedTenant);
      localStorage.setItem('zerostaff_active_tenant', JSON.stringify(updatedTenant));
    }
  };

  const handleAddSupplier = (newSup) => {
    const updatedSuppliers = [newSup, ...suppliers];
    setSuppliers(updatedSuppliers);
    localStorage.setItem('zerostaff_suppliers', JSON.stringify(updatedSuppliers));
  };

  const handleAddAccount = (newAcc) => {
    const updatedAccounts = [...accounts, newAcc];
    setAccounts(updatedAccounts);
    localStorage.setItem('zerostaff_accounts', JSON.stringify(updatedAccounts));
  };

  const handleSetUseAccounting = (val) => {
    setUseAccounting(val);
    localStorage.setItem('zerostaff_use_accounting', JSON.stringify(val));
  };

  // AFIP Text files exporter (COMPRAS_CBTE & COMPRAS_ALICUOTAS)
  const handleExportAfip = (filteredHistory) => {
    try {
      let cbteLines = [];
      let alicLines = [];

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

      // Trigger download
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
      
      {/* Header with Navigation tabs */}
      <Header 
        tenant={tenant} 
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout} 
      />

      {/* Main views rendering persistent with CSS style toggling */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        
        {/* 1. Ingest/Dashboard */}
        <div style={{ display: currentView === 'dashboard' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
          <Dashboard 
            tenant={tenant} 
            suppliers={suppliers}
            accounts={accounts}
            useAccounting={useAccounting}
            onAddInvoice={handleAddInvoice} 
            onAddSupplier={handleAddSupplier}
          />
        </div>

        {/* 2. Suppliers Directory */}
        <div style={{ display: currentView === 'suppliers' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
          <Suppliers 
            suppliers={suppliers} 
            accounts={accounts}
            useAccounting={useAccounting}
            onAddSupplier={handleAddSupplier}
          />
        </div>

        {/* 3. Accounts plan */}
        <div style={{ display: currentView === 'accounts' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
          <Accounts 
            accounts={accounts} 
            useAccounting={useAccounting}
            onSetUseAccounting={handleSetUseAccounting}
            onAddAccount={handleAddAccount}
          />
        </div>

        {/* 4. History/AFIP IVA */}
        <div style={{ display: currentView === 'history' ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
          <History 
            isFullPage={true} 
            history={history} 
            useAccounting={useAccounting}
            onExportAfip={handleExportAfip} 
          />
        </div>

      </main>

    </div>
  );
}
