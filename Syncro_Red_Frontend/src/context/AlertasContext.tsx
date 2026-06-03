import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';
import type { EventoMapa } from '../types';

interface AlertasContextType {
  eventos: EventoMapa[];
  nuevasAlertas: EventoMapa[];
  limpiarNuevasAlertas: () => void;
}

const AlertasContext = createContext<AlertasContextType | undefined>(undefined);

export function AlertasProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [eventos, setEventos] = useState<EventoMapa[]>([]);
  const [nuevasAlertas, setNuevasAlertas] = useState<EventoMapa[]>([]);
  const eventosVistos = useRef<Set<string>>(new Set());

  // Polling mechanism
  useEffect(() => {
    // Solo hacer polling si el usuario ha iniciado sesión
    if (!isAuthenticated) {
      setEventos([]);
      return;
    }

    let intervalId: ReturnType<typeof setInterval>;

    const fetchEventos = async () => {
      // Sin token válido no consultamos (evita 401 en bucle si la sesión expiró)
      if (!localStorage.getItem('access_token')) return;
      try {
        const hoy = new Date().toISOString().split('T')[0];
        const ayer = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];

        const res = await client.get(`/operaciones/eventos-mapa/?fecha_desde=${ayer}&fecha_hasta=${hoy}`);
        const data: EventoMapa[] = res.data.eventos || [];
        
        setEventos(data);
        
        const alertasRecientes = data.filter(e => e.estado === 'ACTIVA' || e.estado === 'REGISTRADA' || e.estado === 'PENDIENTE');
        const alertasNuevasParaNotificar: EventoMapa[] = [];
        
        alertasRecientes.forEach(alerta => {
          if (alerta.id && !eventosVistos.current.has(alerta.id)) {
            eventosVistos.current.add(alerta.id);
            alertasNuevasParaNotificar.push(alerta);
          }
        });

        if (alertasNuevasParaNotificar.length > 0) {
          setNuevasAlertas(prev => [...prev, ...alertasNuevasParaNotificar]);
        }
      } catch (err) {
        console.error('Error fetching real-time map events:', err);
      }
    };

    // Llamada inicial
    fetchEventos();

    // Polling cada 10 segundos
    intervalId = setInterval(fetchEventos, 10000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  const limpiarNuevasAlertas = () => {
    setNuevasAlertas([]);
  };

  return (
    <AlertasContext.Provider value={{ eventos, nuevasAlertas, limpiarNuevasAlertas }}>
      {children}
    </AlertasContext.Provider>
  );
}

export function useAlertas() {
  const context = useContext(AlertasContext);
  if (context === undefined) {
    throw new Error('useAlertas debe ser usado dentro de un AlertasProvider');
  }
  return context;
}
