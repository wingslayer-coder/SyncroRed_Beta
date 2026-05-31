
import { Link } from 'react-router-dom';
import './Dashboard.css';
import { ArrowLeft } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart
} from 'recharts';

export default function Dashboard() {
  
  interface CardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    badgeText?: string;
    badgeType?: 'success' | 'danger' | 'neutral';
    hasTopBorder?: boolean;
  }

  const renderCard = ({
    title,
    value,
    subtitle,
    badgeText,
    badgeType = 'success',
    hasTopBorder = false
  }: CardProps) => {
    return (
      <div className={`st-kpi-card ${hasTopBorder ? 'with-top-border' : ''}`}>
        <div className="st-kpi-title">{title}</div>
        <div className="st-kpi-value">{value}</div>
        {subtitle && <div className="st-kpi-subtitle">{subtitle}</div>}
        {badgeText && (
          <div className="st-kpi-badge-container">
            <span className={`st-kpi-badge ${badgeType}`}>
              {badgeText}
            </span>
          </div>
        )}
      </div>
    );
  };

  const GaugeChart = ({ value, title, target }: { value: number, title: string, target: number }) => {
    const data = [
      { name: 'Value', value: value },
      { name: 'Empty', value: 100 - value }
    ];
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
        <div className="relative w-full" style={{ height: '180px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="75%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                <Cell key="cell-0" fill="#001f4d" />
                <Cell key="cell-1" fill="#e2e8f0" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
            <span className="text-3xl font-extrabold text-[#001f4d]">{value}%</span>
            <span className="text-xs font-bold text-emerald-600 mt-1">▲ {(value - target).toFixed(1)} pp</span>
          </div>
        </div>
      </div>
    );
  };

  // Simulated Data
  const trendData = [
    { name: 'Dic', otp: 91.2, atraso: 5.1 },
    { name: 'Ene', otp: 93.0, atraso: 4.4 },
    { name: 'Feb', otp: 92.4, atraso: 4.6 },
    { name: 'Mar', otp: 95.1, atraso: 3.6 },
    { name: 'Abr', otp: 94.2, atraso: 3.4 },
    { name: 'May', otp: 96.0, atraso: 2.9 },
  ];

  const paretoData = [
    { name: 'Clima', eventos: 6 },
    { name: 'Señalización', eventos: 11 },
    { name: 'Terceros', eventos: 18 },
    { name: 'Infra/Vía', eventos: 31 },
    { name: 'Mat. Rodante', eventos: 42 },
  ];

  const linesData = [
    { name: 'Corto Laja', comp: 94.8 },
    { name: 'L1 Talcahuano-Hualqui', comp: 97.5 },
    { name: 'L2 Concepción-Coronel', comp: 99.2 },
  ];

  return (
    <div className="dashboard-container">
      <div className="flex justify-start mb-6">
        <Link to="/menu" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-azul bg-azul/5 hover:text-rojo hover:bg-rojo/5 transition-all">
          <ArrowLeft className="w-4 h-4" />
          Volver al Menú Principal
        </Link>
      </div>

      <div className="dashboard-header mb-8">
        <h2>Consola de Mando Gerencial</h2>
        <p>Estado de la operación y control de gestión — Red EFE Sur · 31-05-2026</p>
        <div className="mt-3 inline-block bg-white/80 text-gray-700 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border border-gray-200">
          🔍 Vista de demostración · datos simulados para validación de arquitectura
        </div>
      </div>

      {/* 1. KPIs */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 border-l-4 border-[#001f4d] pl-3">
          <span className="text-sm font-bold uppercase tracking-wider text-azul">Indicadores clave del período</span>
        </div>
        <div className="kpi-grid-4">
          {renderCard({ title: 'Puntualidad (OTP)', value: '94.2%', badgeText: '↑ 1.2 pp vs meta', badgeType: 'success' })}
          {renderCard({ title: 'Regularidad de malla', value: '98.7%', badgeText: '↑ 0.5 pp', badgeType: 'success' })}
          {renderCard({ title: 'Servicios operados', value: '1,284', badgeText: '↑ 46 vs mes ant.', badgeType: 'success' })}
          {renderCard({ title: 'Pasajeros transportados', value: '612 K', badgeText: '↑ 3.1%', badgeType: 'success' })}
        </div>
        <div className="kpi-grid-4 mb-0">
          {renderCard({ title: 'Atraso promedio / servicio', value: '3.4 min', badgeText: '↓ 0.6 min', badgeType: 'success' })}
          {renderCard({ title: 'Disponibilidad de flota', value: '91.5%', badgeText: '↑ 2.0 pp', badgeType: 'success' })}
          {renderCard({ title: 'Eventos críticos (mes)', value: '12', badgeText: '↓ 3 eventos', badgeType: 'success' })}
          {renderCard({ title: 'T. respuesta emergencia', value: '6.2 min', badgeText: '↓ 1.1 min', badgeType: 'success' })}
        </div>
      </div>

      {/* 2. Salud operacional */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 border-l-4 border-[#001f4d] pl-3">
          <span className="text-sm font-bold uppercase tracking-wider text-azul">Salud operacional</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          
          {/* Quadrant 1: Metas de Control (Gauges side-by-side) */}
          <div className="p-2 flex flex-col justify-center border-r border-b border-gray-100">
            <div className="flex flex-row justify-around items-center h-full gap-4">
              <div className="w-1/2">
                <GaugeChart value={94.2} title="Puntualidad (OTP)" target={93.0} />
              </div>
              <div className="w-1/2">
                <GaugeChart value={91.5} title="Disponibilidad flota" target={90.0} />
              </div>
            </div>
          </div>

          {/* Quadrant 2: Evolución de Puntualidad */}
          <div className="p-2 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Evolución de puntualidad y atraso medio</h3>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 10}} />
                  <YAxis yAxisId="left" domain={[85, 100]} tick={{fontSize: 10}} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 8]} tick={{fontSize: 10}} />
                  <Tooltip />
                  <Legend wrapperStyle={{fontSize: '9px', marginTop: '5px'}} />
                  <Bar yAxisId="right" dataKey="atraso" name="Atraso medio (min)" fill="#ee6c00" opacity={0.6} />
                  <Line yAxisId="left" type="monotone" dataKey="otp" name="OTP (%)" stroke="#001f4d" strokeWidth={3} dot={{r: 3}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quadrant 3: Causas raíz de atrasos (Pareto) */}
          <div className="p-2 border-r border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Causas raíz de atrasos (Pareto)</h3>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paretoData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="eventos" fill="#001f4d" radius={[0, 4, 4, 0]} barSize={15} label={{ position: 'right', fill: '#64748b', fontSize: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quadrant 4: Cumplimiento por Línea */}
          <div className="p-2 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Cumplimiento operacional por línea</h3>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={linesData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[90, 100]} hide />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="comp" radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fill: '#64748b', fontSize: 10, formatter: (val: any) => val + '%' }}>
                    {
                      linesData.map((entry, index) => {
                        const color = entry.comp >= 98 ? '#16a34a' : entry.comp >= 96 ? '#ee6c00' : '#cc0000';
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
      
      {/* 4. Mini KPIs Material Rodante */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 border-l-4 border-[#001f4d] pl-3">
          <span className="text-sm font-bold uppercase tracking-wider text-azul">Material rodante y confiabilidad</span>
        </div>
        <div className="kpi-grid-4">
          {renderCard({ title: 'MTBF', value: '8.420 km', subtitle: 'Distancia media entre fallas' })}
          {renderCard({ title: 'Fallas / 10.000 km', value: '1.2', subtitle: 'Tasa de fallas en servicio' })}
          {renderCard({ title: 'Cumplim. mantención', value: '96.4%', subtitle: 'Plan preventivo ejecutado' })}
          {renderCard({ title: 'Equipos disponibles', value: '14 / 16', subtitle: 'Flota operativa hoy' })}
        </div>
      </div>

      {/* 5. Personas, jornada y cumplimiento */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 border-l-4 border-[#001f4d] pl-3">
          <span className="text-sm font-bold uppercase tracking-wider text-azul">Personas, jornada y cumplimiento normativo</span>
        </div>
        <div className="kpi-grid-4">
          {renderCard({ title: 'Horas extras acumuladas', value: '1,450 h', badgeText: '↑ 18% presupuesto', badgeType: 'danger', hasTopBorder: true })}
          {renderCard({ title: 'Horas nocturnas', value: '820 h', badgeText: '↑ Dentro de rango', badgeType: 'success', hasTopBorder: true })}
          {renderCard({ title: 'Faltas al descanso mínimo', value: '0', badgeText: '↑ Meta cumplida', badgeType: 'success', hasTopBorder: true })}
          {renderCard({ title: 'Cumplim. descanso legal', value: '100%', badgeText: '↑ Sin infracciones', badgeType: 'success', hasTopBorder: true })}
        </div>
      </div>

      {/* 6. Eventos Críticos Recientes */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 border-l-4 border-[#001f4d] pl-3">
          <span className="text-sm font-bold uppercase tracking-wider text-azul">Registro reciente de eventos críticos</span>
        </div>
        <div className="chart-card !p-0 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Servicio</th>
                <th className="px-6 py-4 font-semibold">Incidente / Novedad</th>
                <th className="px-6 py-4 font-semibold">Categoría</th>
                <th className="px-6 py-4 font-semibold">Impacto</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap">20-05-2026</td>
                <td className="px-6 py-3 whitespace-nowrap">20001</td>
                <td className="px-6 py-3 font-medium">Falla de puerta SFE-108 en Laguna Quiñenco</td>
                <td className="px-6 py-3 whitespace-nowrap text-gray-500">Material Rodante</td>
                <td className="px-6 py-3 whitespace-nowrap text-red-600 font-semibold">-15 min</td>
                <td className="px-6 py-3 whitespace-nowrap">Resuelto</td>
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap">19-05-2026</td>
                <td className="px-6 py-3 whitespace-nowrap">20841</td>
                <td className="px-6 py-3 font-medium">Corte de fibra óptica en Km 24.5</td>
                <td className="px-6 py-3 whitespace-nowrap text-gray-500">Señalización</td>
                <td className="px-6 py-3 whitespace-nowrap text-red-600 font-semibold">-45 min</td>
                <td className="px-6 py-3 whitespace-nowrap">Resuelto</td>
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap">18-05-2026</td>
                <td className="px-6 py-3 whitespace-nowrap">20143</td>
                <td className="px-6 py-3 font-medium">Obstrucción de vía por terceros en Coronel</td>
                <td className="px-6 py-3 whitespace-nowrap text-gray-500">Terceros</td>
                <td className="px-6 py-3 whitespace-nowrap text-red-600 font-semibold">-10 min</td>
                <td className="px-6 py-3 whitespace-nowrap text-amber-600 font-semibold">En seguimiento</td>
              </tr>
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-3 whitespace-nowrap">16-05-2026</td>
                <td className="px-6 py-3 whitespace-nowrap">20512</td>
                <td className="px-6 py-3 font-medium">Frenado de urgencia por animales en vía</td>
                <td className="px-6 py-3 whitespace-nowrap text-gray-500">Operacional</td>
                <td className="px-6 py-3 whitespace-nowrap text-red-600 font-semibold">-7 min</td>
                <td className="px-6 py-3 whitespace-nowrap">Resuelto</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Impacto de la Digitalización */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-4 border-l-4 border-[#001f4d] pl-3">
          <span className="text-sm font-bold uppercase tracking-wider text-azul">Impacto de la digitalización con SyncroRed</span>
        </div>
        <div className="kpi-grid-3">
          {renderCard({ title: 'Tiempo administrativo ahorrado', value: '≈ 350 h/mes', badgeText: '↑ reportes automatizados', badgeType: 'success', hasTopBorder: true })}
          {renderCard({ title: 'Ahorro económico estimado', value: '≈ $3,5 MM/mes', badgeText: '↑ valor de horas liberadas', badgeType: 'success', hasTopBorder: true })}
          {renderCard({ title: 'Trazabilidad de eventos', value: '100%', badgeText: '↑ vs registro manual disperso', badgeType: 'success', hasTopBorder: true })}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6 max-w-2xl mx-auto">
          Consola Gerencial SincroRed v2.1 — Datos de simulación para validación de arquitectura. Los KPIs se conectarán a consultas en vivo de la base de datos en producción.
        </p>
      </div>

    </div>
  );
}

