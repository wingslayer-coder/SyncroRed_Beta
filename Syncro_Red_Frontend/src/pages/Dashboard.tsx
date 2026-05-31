import { useEffect, useState } from 'react';
import client from '../api/client';
import type { DashboardKPIs } from '../types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Users, FileText } from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/operaciones/dashboard/')
      .then((res) => setKpis(res.data))
      .catch(() => setKpis(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Cargando...</div>;

  const kpiCard = (title: string, value: string | number, delta?: string, inverse = false) => {
    const isPositive = delta && delta.startsWith('+');
    const isNegative = delta && delta.startsWith('-');
    const Icon = isPositive ? TrendingUp : isNegative ? (inverse ? TrendingUp : TrendingDown) : Minus;
    const colorClass = isPositive
      ? (inverse ? 'text-red-500' : 'text-verde')
      : isNegative
        ? (inverse ? 'text-verde' : 'text-rojo')
        : 'text-gray-400';

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-t-4 border-t-azul">
        <div className="text-sm font-semibold text-gris mb-2">{title}</div>
        <div className="text-3xl font-extrabold text-azul">{value}</div>
        {delta && (
          <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${colorClass}`}>
            <Icon className="w-4 h-4" />
            {delta}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-azul to-azul-2 text-white rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-extrabold mb-2">SyncroRed · Consola de Mando Gerencial</h1>
        <p className="opacity-90">
          Estado de la operación y control de gestión — Red EFE Sur · {new Date().toLocaleDateString('es-CL')}
        </p>
        <span className="inline-block mt-3 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
          Vista de demostración · datos simulados para validación de arquitectura
        </span>
      </div>

      {kpis && (
        <>
          <div>
            <h3 className="text-lg font-extrabold text-azul border-l-4 border-azul pl-3 mb-4">
              Indicadores clave del período
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCard('Puntualidad (OTP)', `${kpis.puntualidad_otp}%`, '+1.2 pp vs meta')}
              {kpiCard('Regularidad de malla', '98.7%', '+0.5 pp')}
              {kpiCard('Servicios operados', kpis.servicios_hoy.toLocaleString(), `+${kpis.servicios_mes} vs mes ant.`)}
              {kpiCard('Pasajeros transportados', '612 K', '+3.1%')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {kpiCard('Atraso promedio / servicio', `${kpis.atraso_promedio_min} min`, '-0.6 min', true)}
              {kpiCard('Disponibilidad de flota', '91.5%', '+2.0 pp')}
              {kpiCard('Eventos críticos (mes)', '12', '-3 eventos', true)}
              {kpiCard('T. respuesta emergencia', '6.2 min', '-1.1 min', true)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-azul font-bold mb-3">
                <AlertTriangle className="w-5 h-5" />
                Alertas Activas
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-red-50 rounded-md">
                  <span className="text-sm text-red-700">Emergencias activas</span>
                  <span className="font-bold text-red-600">{kpis.emergencias_activas}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-amber-50 rounded-md">
                  <span className="text-sm text-amber-700">Incidencias activas</span>
                  <span className="font-bold text-amber-600">{kpis.incidencias_activas}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
                  <span className="text-sm text-blue-700">Fallas pendientes</span>
                  <span className="font-bold text-blue-600">{kpis.fallas_pendientes}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-azul font-bold mb-3">
                <Users className="w-5 h-5" />
                Tripulación
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-700">Total activos</span>
                  <span className="font-bold text-azul">{kpis.tripulacion_total}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded-md">
                  <span className="text-sm text-red-700">Ausencias hoy</span>
                  <span className="font-bold text-red-600">{kpis.ausencias_hoy}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-azul font-bold mb-3">
                <FileText className="w-5 h-5" />
                Reportes
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  <span className="text-sm text-gray-700">Reportes hoy</span>
                  <span className="font-bold text-azul">{kpis.reportes_hoy}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!kpis && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg">
          No se pudieron cargar los KPIs desde el servidor. Verifica que el backend esté corriendo.
        </div>
      )}
    </div>
  );
}
