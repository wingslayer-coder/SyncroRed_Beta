"""Georreferenciación de prevenciones: convierte el PK (km + poste) del boletín
a coordenadas (lat, lon) interpolando sobre el trazado real (trazado_data.py)."""

import re
from .trazado_data import TRAZADO


def parse_km(s):
    """'46 P. 10' -> 46.10 ; '27.85' -> 27.85 ; '129.1' -> 129.1 ; '0' -> 0.0."""
    s = (s or '').strip()
    if not s:
        return None
    m = re.match(r'(\d+)\s*P\.?\s*(\d+)', s, re.I)  # km + poste
    if m:
        return float(m.group(1)) + float(m.group(2)) / 100.0
    m2 = re.match(r'(\d+(?:[.,]\d+)?)', s)  # km decimal
    if m2:
        return float(m2.group(1).replace(',', '.'))
    return None


def interpolar(linea, km):
    """Devuelve (lat, lon) en el km dado del trazado de la línea, o None."""
    pts = TRAZADO.get(linea)
    if not pts or km is None:
        return None
    if km <= pts[0][0]:
        return pts[0][1], pts[0][2]
    if km >= pts[-1][0]:
        return pts[-1][1], pts[-1][2]
    for i in range(1, len(pts)):
        if pts[i][0] >= km:
            k0, la0, lo0 = pts[i - 1]
            k1, la1, lo1 = pts[i]
            f = 0 if k1 == k0 else (km - k0) / (k1 - k0)
            return round(la0 + f * (la1 - la0), 6), round(lo0 + f * (lo1 - lo0), 6)
    return None


def georef_prevencion(p):
    """Asigna p['latitud'], p['longitud'] usando km_inicio (o km_fin) y la línea."""
    km = parse_km(p.get('km_inicio'))
    if km is None:
        km = parse_km(p.get('km_fin'))
    coord = interpolar(p.get('linea'), km)
    if coord:
        p['latitud'], p['longitud'] = coord
    return p
