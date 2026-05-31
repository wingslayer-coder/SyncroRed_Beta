# EFE Sur Backend (Django + DRF)

Migración progresiva desde la app Streamlit existente en `Proyecto_EFE_Sur`.

## Levantar servidor

```powershell
cd C:\Users\Benja\Desktop\EFE_Sur_Backend
.venv\Scripts\python.exe manage.py runserver
```

## Setup inicial

```powershell
.venv\Scripts\python.exe manage.py migrate
.venv\Scripts\python.exe manage.py seed_data
```

## Endpoints principales

| URL | Descripción |
|---|---|
| `POST /api/auth/login/` | Login por RUT + password. Devuelve JWT + datos de usuario |
| `POST /api/auth/token/` | JWT standard |
| `POST /api/auth/token/refresh/` | Refresh JWT token |
| `GET /api/bitacora/reportes-finales/exportar_excel/` | Exportar reportes a Excel |
| `/admin/` | Panel de administración Django |

### APIs por app

| Prefijo | Recursos |
|---|---|
| `/api/usuarios/` | usuarios, registros-operativos, ausencias |
| `/api/operaciones/` | servicios-activos, servicios-historicos, registros-estaciones, maestro-turnos, grafico-mensual, itinerario-equipos |
| `/api/bitacora/` | reportes-finales, novedades |
| `/api/alertas/` | emergencias, incidencias, fallas-equipo |
| `/api/prevenciones/` | prevenciones, estaciones-vias |
| `/api/georreferencia/` | hitos |

### Endpoints custom

| Método | URL | Acción |
|---|---|---|
| POST | `/api/operaciones/servicios-activos/{id}/ubicacion/` | Actualizar GPS de un servicio |
| POST | `/api/alertas/emergencias/{id}/resolver/` | Marcar emergencia como controlada |
| POST | `/api/alertas/incidencias/{id}/resolver/` | Marcar incidencia como resuelta |
| POST | `/api/alertas/fallas-equipo/{id}/gestionar/` | Marcar falla como gestionada |

## Seed de datos

```powershell
.venv\Scripts\python.exe manage.py seed_data
```

Crea estaciones/vías y usuarios de prueba.

## Usuarios de prueba

| RUT | Cargo | Password |
|---|---|---|
| 11111111-1 | ADMIN | admin123 |
| 22222222-2 | IL | il123 |
| 33333333-3 | SL | sl123 |
| 44444444-4 | JEFE DE OPERACIONES | jo123 |
| 55555555-5 | JEFE DE SERVICIO | js123 |
| 66666666-6 | MAQUINISTA | maq123 |
| 77777777-7 | AYUDANTE | ayu123 |
| 88888888-8 | GERENTE | ger123 |

## Fases completadas

- **Fase 1**: Scaffold Django + 17 modelos + migraciones + admin + DRF ViewSets
- **Fase 2**: Filtros avanzados (django-filter) + login custom por RUT + endpoints de acción (resolver/gestionar) + seed de datos
- **Fase 3**: React scaffold (Vite) + AuthContext JWT + Axios interceptors + páginas base
- **Fase 4**: Formularios completos de bitácora (emergencia, incidencia, falla, marcación estación) con GPS auto-capturado + tabla tráfico en vivo
- **Fase 5**: Hook useGPS con watchPosition + Mapa Leaflet con posiciones de trenes/eventos + panel alertas con flash visual
- **Fase 6**: Exportar Excel desde backend + README completo + polish final
