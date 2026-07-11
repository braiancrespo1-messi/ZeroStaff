import React from 'react';
import { Sparkles, LogOut, History, Database, ShieldAlert } from 'lucide-react';

export default function Header({ tenant, onLogout, onOpenHistory }) {
  const progressPercent = Math.min(100, (tenant.quotaUsed / tenant.quotaMax) * 100);

  return (
    <header className="glass" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 24px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      height: '72px',
      flexShrink: 0
    }}>
      
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'hsl(var(--primary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(168, 85, 247, 0.3)'
        }}>
          <Sparkles size={18} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ZeroStaff<span style={{ color: 'hsl(var(--primary))' }}>.ai</span>
          </h1>
          <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', display: 'block', marginTop: '-2px' }}>
            digital accounts payable
          </span>
        </div>
      </div>

      {/* Center Tenant Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Connection mode pill */}
        {tenant.isDemoMode ? (
          <span className="badge badge-warning" style={{ gap: '6px', fontSize: '11px' }}>
            <Sparkles size={12} />
            <span>Modo Demostración</span>
          </span>
        ) : (
          <span className="badge badge-success" style={{ gap: '6px', fontSize: '11px' }}>
            <Database size={12} />
            <span>Conectado a YiQi</span>
          </span>
        )}

        {/* Tenant Profile info */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'hsl(var(--text-main))' }}>
            {tenant.companyName}
          </span>
          <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
            CUIT: {tenant.cuit}
          </span>
        </div>

        {/* Quota Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '130px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '600' }}>
            <span style={{ color: 'hsl(var(--text-muted))' }}>Consumo de IA</span>
            <span style={{ color: 'hsl(var(--text-main))' }}>{tenant.quotaUsed}/{tenant.quotaMax}</span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: progressPercent > 90 ? 'hsl(var(--danger))' : 'hsl(var(--primary))',
              borderRadius: '10px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        
        {/* Open History Button */}
        <button onClick={onOpenHistory} className="btn btn-secondary" style={{ gap: '6px', height: '36px' }} title="Ver Historial de Ingestas y Exportar Libro de IVA">
          <History size={16} style={{ color: 'hsl(var(--primary))' }} />
          <span>Historial e IVA Digital</span>
        </button>

        {/* Log Out Button */}
        <button onClick={onLogout} className="btn btn-secondary btn-icon-only" style={{ height: '36px' }} title="Cerrar Sesión">
          <LogOut size={16} style={{ color: 'hsl(var(--danger))' }} />
        </button>

      </div>

    </header>
  );
}
