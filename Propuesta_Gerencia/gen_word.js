const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, Header, Footer,
  TableOfContents, TabStopType, TabStopPosition
} = require("docx");

// ---------- Paleta ----------
const AZUL = "1E3A5F";
const AZUL2 = "2E75B6";
const FILL_HEAD = "1E3A5F";
const FILL_SUB = "D5E8F0";
const FILL_ALT = "F2F6FA";
const VERDE = "1E7B34";
const ROJO = "B02A2A";
const CONTENT_W = 9360;

// ---------- Helpers ----------
const T = (text, o = {}) => new TextRun({ text, ...o });

const P = (text, o = {}) =>
  new Paragraph({
    spacing: { after: o.after ?? 120, before: o.before ?? 0, line: 276 },
    alignment: o.align,
    children: Array.isArray(text) ? text : [T(text, o.run || {})],
    ...o.p,
  });

const H1 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [T(text)] });
const H2 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [T(text)] });
const H3 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_3, children: [T(text)] });

const bullet = (text, o = {}) =>
  new Paragraph({
    numbering: { reference: "bul", level: o.level || 0 },
    spacing: { after: 60, line: 268 },
    children: Array.isArray(text) ? text : [T(text, o.run || {})],
  });

const num = (text, o = {}) =>
  new Paragraph({
    numbering: { reference: o.ref || "num", level: 0 },
    spacing: { after: 60, line: 268 },
    children: Array.isArray(text) ? text : [T(text, o.run || {})],
  });

const border = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(content, { w, fill, bold, color, align, vAlign } = {}) {
  const runs = Array.isArray(content) ? content : [content];
  return new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    verticalAlign: vAlign || VerticalAlign.CENTER,
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    children: runs.map(
      (r) =>
        new Paragraph({
          alignment: align,
          spacing: { after: 0, line: 252 },
          children: [typeof r === "string" ? T(r, { bold, color }) : r],
        })
    ),
  });
}

function headerRow(cells, widths) {
  return new TableRow({
    tableHeader: true,
    children: cells.map((c, i) =>
      cell(c, { w: widths[i], fill: FILL_HEAD, bold: true, color: "FFFFFF", align: AlignmentType.CENTER })
    ),
  });
}

function table(widths, headers, rows, opts = {}) {
  const trs = [headerRow(headers, widths)];
  rows.forEach((r, idx) => {
    const fill = idx % 2 === 1 ? FILL_ALT : undefined;
    trs.push(
      new TableRow({
        children: r.map((c, i) => {
          if (c && typeof c === "object" && c.__cell) {
            return cell(c.text, { w: widths[i], fill: c.fill || fill, bold: c.bold, color: c.color, align: c.align });
          }
          return cell(c, { w: widths[i], fill, align: i === 0 ? undefined : opts.center ? AlignmentType.CENTER : undefined });
        }),
      })
    );
  });
  return new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: widths, rows: trs });
}

const cc = (text, o = {}) => ({ __cell: true, text, ...o }); // custom cell

const spacer = (h = 80) => new Paragraph({ spacing: { after: h }, children: [T("")] });

// Callout box (single-cell shaded table)
function callout(children, fill = FILL_SUB) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: AZUL2 },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: AZUL2 },
              left: { style: BorderStyle.SINGLE, size: 18, color: AZUL2 },
              right: { style: BorderStyle.SINGLE, size: 1, color: AZUL2 },
            },
            shading: { fill, type: ShadingType.CLEAR },
            width: { size: CONTENT_W, type: WidthType.DXA },
            margins: { top: 120, bottom: 120, left: 200, right: 160 },
            children,
          }),
        ],
      }),
    ],
  });
}

// ============================================================
//  CONTENIDO
// ============================================================
const children = [];
const add = (...els) => els.forEach((e) => children.push(e));

// ---------- PORTADA ----------
add(
  new Paragraph({ spacing: { before: 1600, after: 0 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [T("SYNCRO RED", { bold: true, size: 64, color: AZUL })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: AZUL2, space: 8 } },
    children: [T("Ecosistema de Gestión Operacional Ferroviaria", { size: 30, color: AZUL2 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [T("Propuesta Técnico-Económica y Roadmap Estratégico", { bold: true, size: 30 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [T("Control de presupuesto de horas extra · Optimización de tripulación · Trazabilidad operacional", { italics: true, size: 22, color: "555555" })],
  }),
  callout([
    P([T("Dirigida a: ", { bold: true }), T("Gerencia General · Gerencia de Operaciones · Finanzas")], { after: 60 }),
    P([T("Para conocimiento de: ", { bold: true }), T("Jefatura de Operaciones · Inspectores de Línea (IL) · Supervisores de Línea (SL)")], { after: 60 }),
    P([T("Presentada por: ", { bold: true }), T("Equipo operativo-desarrollador — personal de tracción (Maquinista y Ayudante)")], { after: 60 }),
    P([T("Fecha: ", { bold: true }), T("Junio 2026"), T("    ·    Validez: ", { bold: true }), T("60 días"), T("    ·    Referencia: ", { bold: true }), T("1 USD ≈ 950 CLP")], { after: 0 }),
  ]),
  new Paragraph({ children: [new PageBreak()] })
);

// ---------- TOC ----------
add(
  new Paragraph({ spacing: { after: 160 }, children: [T("Índice", { bold: true, size: 32, color: AZUL })] }),
  new TableOfContents("Tabla de Contenidos", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================
// 1. RESUMEN EJECUTIVO
// ============================================================
add(
  H1("1. Resumen Ejecutivo"),
  P([
    T("Syncro Red es un "),
    T("sistema de gestión operacional ferroviaria ya construido y funcional", { bold: true }),
    T(", desarrollado íntegramente por personal de tracción de la propia empresa. No es un prototipo improvisado: es una plataforma de nivel profesional, con backend, aplicación web de escritorio y aplicación móvil para cabina, que hoy modela la realidad operativa local que un software replicado de otra red no captura."),
  ]),
  H2("1.1 Alcance del proyecto"),
  P([
    T("El sistema cubre el ciclo operativo completo: "),
    T("tracción y estado de servicios en vivo, generación automática del gráfico mensual de turnos, pauta diaria, distribución de equipos, bitácora de servicio con trazabilidad de auditoría, control de asistencia con cálculo automático de horas extra, prevenciones de vía georreferenciadas y un módulo de recomendación de coberturas que optimiza costo y cumplimiento legal", { bold: true }),
    T("."),
  ]),
  H2("1.2 La propuesta en una frase"),
  callout([
    P([
      T("Esto no es una aplicación para ver horarios: es una herramienta de ", {}),
      T("Ingeniería de Procesos y Control de Presupuesto", { bold: true }),
      T(" que detiene una fuga proyectada de "),
      T("CLP 56M a 104M anuales", { bold: true, color: ROJO }),
      T(" en horas extra, construida por quienes sufren el error en la vía, y que se paga sola en semanas."),
    ], { after: 0 }),
  ]),
  H2("1.3 Lo que pedimos"),
  bullet([T("Quedar a cargo", { bold: true }), T(" de la administración, operación y desarrollo continuo del sistema (custodia técnica), conservando la propiedad intelectual bajo licencia de uso interno para la empresa.")]),
  bullet([T("Compensación monetaria", { bold: true }), T(" proporcional a la responsabilidad, al ahorro generado y a la criticidad de administrar un sistema núcleo — autofinanciada con el propio ahorro.")]),
  bullet([T("Régimen 50/50", { bold: true }), T(" durante el desarrollo y validación (50% turno de conducción / 50% desarrollo), que mantiene respaldo operativo total y reduce el riesgo de la empresa a cero.")]),
  bullet([T("Reconocimiento de la autoría", { bold: true }), T(" y, "), T("a futuro y por mérito", { bold: true }), T(", que se valore una transición a un ámbito de administración/desarrollo de la operación si los resultados acompañan.")]),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================
// 2. PROPUESTA DE VALOR
// ============================================================
add(
  H1("2. Propuesta de Valor y Ventaja Competitiva"),
  H2("2.1 Terreno propio vs. réplica importada"),
  P([
    T("El departamento de TI intenta replicar un software de otra red (Merval, Valparaíso) para evitar un desarrollo. El problema de fondo: TI no replicaría "),
    T("funcionalidad", { italics: true }),
    T(", replicaría "),
    T("suposiciones de otra operación", { italics: true }),
    T(". En operación ferroviaria, una suposición equivocada sobre reposo mínimo, sobre cómo cruza un turno la medianoche o sobre la cadencia de un tramo de alta densidad no es un error cosmético: es un cálculo de jornada mal hecho, un conflicto laboral o un riesgo operativo."),
  ]),
  table(
    [2400, 3480, 3480],
    ["Dimensión", "Syncro Red (nosotros)", "“Tren OS” (réplica de TI)"],
    [
      ["Origen del conocimiento", "Personal de tracción activo, desde cabina y andén", "Copia de un sistema de otra realidad operativa"],
      ["Modelo de turnos", "Reglas locales reales: apertura/presentación/cierre, menos reposo, descanso 10/11,5 h", "Lógica heredada de otra red, no validada aquí"],
      ["Geografía", "Trazado local georreferenciado por PK/km", "Trazado y estaciones de otra región"],
      ["Riesgo de adopción", "Bajo: habla el idioma del operador", "Alto: el operador rechaza lo ajeno"],
      ["Mejora continua", "En horas, por quienes viven la operación", "Depende de TI, que no presencia la vía"],
    ]
  ),
  spacer(),
  H2("2.2 No es un proyecto improvisado: es ingeniería profesional"),
  P("Lo construido es verificable y de nivel profesional:"),
  bullet([T("Arquitectura moderna de 3 capas: ", { bold: true }), T("backend Django + API REST, frontend web React 19 + TypeScript (~20 pantallas) y app móvil nativa (Expo/React Native) con capacidad offline-first para operar sin señal en ruta.")]),
  bullet([T("Tiempo real verdadero: ", { bold: true }), T("posición de trenes y estado de flota por WebSockets (Django Channels + Redis), no polling artesanal.")]),
  bullet([T("Motor determinista de gráfico mensual ", { bold: true }), T("que respeta cobertura 100%, reposo, máximo de días seguidos y bandas mixtas, con continuidad entre meses.")]),
  bullet([T("Motor de cálculo de horas extra ", { bold: true }), T("con desglose por concepto (apertura, cierre, exceso 7,5 h, descanso afectado, doble turno, nocturnas, manejo).")]),
  bullet([T("Trazabilidad de auditoría: ", { bold: true }), T("reportes de turno firmados con hash SHA-256 (evidencia inalterable).")]),
  bullet([T("Disciplina de ingeniería real: ", { bold: true }), T("integración continua (CI/CD), pruebas automatizadas, control de versiones y despliegue reproducible.")]),
  callout([
    P([T("Representa miles de horas-ingeniería ya invertidas —incluidas innumerables noches personales— que la empresa recibiría ya construidas y probadas, no como un proyecto a iniciar.", { bold: true })], { after: 0 }),
  ], FILL_ALT),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================
// 3. KILLER FEATURE
// ============================================================
add(
  H1("3. Killer Feature: Control del Presupuesto de Horas Extra"),
  P([T("Módulo de Tripulación Ideal — Ingeniería de Procesos aplicada al gasto laboral.", { italics: true, color: AZUL2, bold: true })]),
  H2("3.1 El problema real: una fuga de capital estructural"),
  P([
    T("Con el nuevo sistema de turnos, "),
    T("toda desviación de la pauta diaria respecto del gráfico mensual planificado se paga como hora extra", { bold: true }),
    T(". Ejemplo operativo:"),
  ]),
  callout([
    P([T("Gráfico mensual: 19:00–21:00. La pauta diaria lo modifica a 18:00–22:00 → las 2 horas de diferencia se pagan íntegras como extra.", { bold: true })], { after: 0 }),
  ], FILL_ALT),
  P([
    T("Hoy la asignación de coberturas (licencias, permisos, vacaciones) se hace a criterio humano, sin cruzar disponibilidad ni sobretiempo acumulado, asignando contingencia a personal "),
    T("que ya está cargado de horas extra", { bold: true }),
    T(". La empresa proyecta un aumento del 30% al 40% del gasto de horas extra por esta sola ineficiencia."),
  ]),
  H2("3.2 La solución: el algoritmo que ya cruza las variables legales"),
  P("Ante una contingencia, el módulo sugiere al candidato más óptimo y económico, descartando a quien legalmente no se puede llamar. Cada restricción que hoy falla en el sistema manual ya está implementada en el motor:"),
  table(
    [4560, 4800],
    ["Regla legal / operativa", "Cómo la resuelve el motor (ya codificado)"],
    [
      ["Pago tras 7:30 h de jornada", "Cálculo automático del exceso sobre 7,5 h por turno"],
      ["Máximo 5 h de conducción continua", "Control de horas de manejo sobre el límite de 5 h"],
      ["10 h de descanso mínimo entre turnos (11,5 h si cierre en residencia)", "Cálculo de “menos reposo” que excluye al candidato que lo violaría"],
      ["Recargo por horas nocturnas", "Conteo minuto a minuto de jornada antes de 07:00"],
      ["Disponibilidad real", "Descarta a quien está en licencia/permiso/vacación, día libre o descanso"],
      ["Optimización de costo", "Prioriza al recibidor disponible; ordena por menor sobretiempo y menor impacto nocturno"],
    ]
  ),
  spacer(),
  callout([
    P([T("El sistema no “muestra” horarios: calcula el costo de cada decisión de asignación antes de tomarla y recomienda la de menor impacto presupuestario que cumple la ley. Eso es ingeniería de procesos.", { bold: true })], { after: 0 }),
  ]),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================
// 4. DETALLE DE MÓDULOS
// ============================================================
add(
  H1("4. Detalle de Módulos Actuales y Solicitudes de Jefatura"),
  H2("4.1 Módulos ya operativos (construidos y demostrables)"),
  table(
    [3000, 1300, 5060],
    ["Módulo", "Estado", "Descripción operativa"],
    [
      [cc("★ Módulo de Tripulación Ideal", { bold: true }), cc("Operativo", { color: VERDE, bold: true, align: AlignmentType.CENTER }), "Sugiere la cobertura legal más económica ante ausencias. Corazón financiero del sistema."],
      ["Tracción / Servicios activos", cc("Operativo", { color: VERDE, align: AlignmentType.CENTER }), "Estado en vivo de cada tren-servicio, tripulación, equipo y posición GPS"],
      ["Gráfico mensual de turnos", cc("Operativo", { color: VERDE, align: AlignmentType.CENTER }), "Generador automático determinista por parejas, con reglas de reposo y feriados"],
      ["Pauta / gráfico diario", cc("Operativo", { color: VERDE, align: AlignmentType.CENTER }), "Asignación diaria, distribución y visualización por turno"],
      ["Distribución de equipos", cc("Operativo", { color: VERDE, align: AlignmentType.CENTER }), "Itinerario de equipos: inicio, servicios AM/PM, destino real vs. planificado"],
      ["Bitácora de servicio", cc("Operativo", { color: VERDE, align: AlignmentType.CENTER }), "Novedades (atrasos, fallas, emergencias) firmadas con hash SHA-256"],
      ["Asistencia y horas extra", cc("Operativo", { color: VERDE, align: AlignmentType.CENTER }), "Apertura/cierre de turno con cálculo automático de extras por concepto"],
      ["Prevenciones / cortadas", cc("Operativo", { color: VERDE, align: AlignmentType.CENTER }), "Restricciones de vía georreferenciadas (PK/km), visibles en cabina"],
      ["Mapa ferroviario", cc("Operativo", { color: VERDE, align: AlignmentType.CENTER }), "Posición de trenes y eventos sobre mapa (Leaflet + heatmap)"],
    ]
  ),
  spacer(),
  H2("4.2 Solicitudes de jefatura: la “raya para la suma”"),
  P("Atendiendo el requerimiento explícito de jefatura de facilitar su gestión con métricas:"),
  bullet([T("Reporte semanal consolidado: ", { bold: true }), T("agregación por trabajador y por línea de novedades, atrasos y horas, con tendencia.")]),
  bullet([T("Consolidado mensual (“raya para la suma”): ", { bold: true }), T("ya existe la base —consolidado de asistencia y exportación a Excel con totales por trabajador y desglose de cada concepto de hora extra— que evoluciona a un tablero de KPIs.")]),
  P([T("KPIs objetivo: ", { bold: true }), T("puntualidad (% a la hora vs. atraso), horas extra por concepto y por persona, cobertura de turnos y días sin cobertura, incidencias/fallas por equipo y por tramo.")]),
  callout([
    P([T("Convierte el cierre mensual de jefatura —hoy manual y propenso a error— en un clic con números auditables.", { bold: true })], { after: 0 }),
  ], FILL_ALT),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================
// 5. VISIÓN A FUTURO
// ============================================================
add(
  H1("5. Visión a Futuro: la “Súper-App” Ferroviaria"),
  P("No proponemos “una app más”, sino el Ecosistema Operacional Único de la empresa: una sola plataforma donde converge la operación hoy dispersa en Excel, radio, papel y sistemas aislados."),
  H2("5.1 Omnicanalidad nativa"),
  bullet([T("Escritorio (consola web): ", { bold: true }), T("despacho, jefatura, gerencia — visión de flota, KPIs, autorizaciones.")]),
  bullet([T("Móvil (cabina): ", { bold: true }), T("maquinista/ayudante — abrir/cerrar turno, marcar paso por estación, bitácora y GPS, funcionando sin conectividad y sincronizando al recuperar señal.")]),
  H2("5.2 Identidad única (Single Sign-On)"),
  P("Una sola cuenta corporativa por persona para toda la operación, sin múltiples claves ni cambiar de aplicación. La base ya existe: autenticación por RUT y control de acceso por 8 perfiles de cargo. La evolución natural es integrarla al directorio corporativo (SSO)."),
  H2("5.3 Integración transversal de gerencias y sistemas clave"),
  table(
    [2600, 4200, 2560],
    ["Sistema / Rol", "Integración propuesta", "Valor"],
    [
      ["Controlador de Tráfico (CTC)", "Consola de despacho consume estado y posición en vivo", "Unifica regulación hoy en radio"],
      ["Libro Reports", "Digitalización del libro de novedades con firma/hash", "Fin del papel; evidencia trazable"],
      ["OIS de sobrepaso general", "Registro estructurado de sobrepasos integrado a bitácora", "Auditabilidad de excepciones"],
      ["AOH", "Módulo de autorización integrado al flujo de turno", "Cierra el ciclo operativo-administrativo"],
    ]
  ),
  spacer(),
  callout([
    P([T("Cada gerencia que se integra aumenta el valor del activo sin multiplicar el costo. Es una plataforma, no un gasto recurrente por sistema.", { bold: true })], { after: 0 }),
  ]),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================
// 6. MATRIZ COMPARATIVA
// ============================================================
add(
  H1("6. Matriz Comparativa: 3 Opciones sobre la Mesa"),
  table(
    [2760, 2400, 2200, 2000],
    ["Criterio", "Syncro Red (nosotros)", "“Tren OS” (réplica TI)", "Desarrollo externo"],
    [
      ["Estado", cc("Ya construido y funcional", { bold: true, color: VERDE }), "A replicar/adaptar", "A iniciar de cero"],
      ["Conocimiento operativo", cc("Nativo (personal de vía)", { color: VERDE }), "Importado de otra red", "Nulo (levantamiento largo)"],
      ["Control de presupuesto de HE", cc("Motor activo", { bold: true, color: VERDE }), cc("No (solo turnos)", { color: ROJO }), "Solo si se paga aparte"],
      ["Normativa ferroviaria embebida", cc("Codificada y validada", { color: VERDE }), cc("Lógica de otra red", { color: ROJO }), "Requiere levantamiento"],
      ["Costo directo", cc("Custodia + compensación", { bold: true }), "“Gratis” aparente", cc("CLP 25M – 60M", { color: ROJO })],
      ["Tiempo a producción", cc("Semanas", { color: VERDE }), "Meses inciertos", "6 – 12 meses"],
      ["Adopción del operador", cc("Alta (hecho por pares)", { color: VERDE }), cc("Baja", { color: ROJO }), "Incierta"],
      ["Quién sufre el error de asignación", cc("Nosotros, en la vía", { bold: true }), "TI, fuera de la línea", "Proveedor ajeno"],
    ],
    { center: true }
  ),
  spacer(),
  callout([
    P([T("El “gratis” de TI es, en realidad, el escenario más caro: un clon que muestra turnos pero asigna mal mantiene intacta la fuga de CLP 56M–104M al año.", { bold: true })], { after: 0 }),
  ], FILL_ALT),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================
// 7. JUSTIFICACIÓN FINANCIERA
// ============================================================
add(
  H1("7. Justificación Financiera: el ROI del Control de Fuga"),
  H2("7.1 Valor real de la hora extra (calculado con los sueldos)"),
  P([T("Fórmula legal (Chile): ", {}), T("Valor HE = Sueldo mensual × factor", { bold: true }), T(", con factor que ya incluye el recargo del 50%. Jornada de 42 h/sem (Ley 40 horas, vigente 2026) → factor 0,0083333.")]),
  table(
    [3360, 2000, 2000, 2000],
    ["", "Sueldo mensual", "HE a 45h (conserv.)", "HE a 42h (2026)"],
    [
      ["Maquinista", cc("1.989.000", { align: AlignmentType.RIGHT }), cc("CLP 15.470", { align: AlignmentType.RIGHT }), cc("CLP 16.575", { align: AlignmentType.RIGHT })],
      ["Ayudante", cc("980.000", { align: AlignmentType.RIGHT }), cc("CLP 7.622", { align: AlignmentType.RIGHT }), cc("CLP 8.167", { align: AlignmentType.RIGHT })],
      [cc("Promedio de dotación", { bold: true }), cc("—", { align: AlignmentType.RIGHT }), cc("CLP 11.546", { align: AlignmentType.RIGHT, bold: true }), cc("CLP 12.371", { align: AlignmentType.RIGHT, bold: true })],
    ]
  ),
  spacer(60),
  P([T("Como cada servicio lleva 1 maquinista + 1 ayudante, el costo de la hora-extra de dotación es ≈ ", {}), T("CLP 12.000", { bold: true }), T(" (cifra de trabajo, redondeada a la baja). Con recargo nocturno o dominical el valor real sube, por lo que el modelo subestima la fuga.")]),
  H2("7.2 Dimensión de la fuga (a CLP 12.000/HE)"),
  table(
    [3760, 2800, 2800],
    ["Concepto", "Bajo (1.300 HE)", "Alto (1.800 HE)"],
    [
      ["Gasto base HE / mes", cc("CLP 15,6M", { align: AlignmentType.RIGHT }), cc("CLP 21,6M", { align: AlignmentType.RIGHT })],
      ["Gasto base HE / año", cc("CLP 187,2M", { align: AlignmentType.RIGHT }), cc("CLP 259,2M", { align: AlignmentType.RIGHT })],
      ["Incremento evitable / mes (30–40%)", cc("390 HE", { align: AlignmentType.RIGHT }), cc("720 HE", { align: AlignmentType.RIGHT })],
      [cc("Fuga evitable / mes", { bold: true }), cc("CLP 4,68M", { align: AlignmentType.RIGHT, bold: true, color: ROJO }), cc("CLP 8,64M", { align: AlignmentType.RIGHT, bold: true, color: ROJO })],
      [cc("Fuga evitable / año", { bold: true }), cc("CLP 56,2M", { align: AlignmentType.RIGHT, bold: true, color: ROJO }), cc("CLP 103,7M", { align: AlignmentType.RIGHT, bold: true, color: ROJO })],
    ]
  ),
  spacer(),
  H2("7.3 Retorno: ahorro vs. costo"),
  table(
    [3000, 3180, 1600, 1580],
    ["Escenario", "Fuga evitable/año", "Captura", "Ahorro anual"],
    [
      ["Conservador", cc("CLP 56,2M", { align: AlignmentType.RIGHT }), cc("50%", { align: AlignmentType.CENTER }), cc("CLP 28,1M", { align: AlignmentType.RIGHT, bold: true, color: VERDE })],
      ["Esperado", cc("CLP 80,0M", { align: AlignmentType.RIGHT }), cc("60%", { align: AlignmentType.CENTER }), cc("CLP 48,0M", { align: AlignmentType.RIGHT, bold: true, color: VERDE })],
      ["Optimista", cc("CLP 103,7M", { align: AlignmentType.RIGHT }), cc("70%", { align: AlignmentType.CENTER }), cc("CLP 72,6M", { align: AlignmentType.RIGHT, bold: true, color: VERDE })],
    ]
  ),
  spacer(),
  callout([
    P([
      T("La hora extra de dotación vale CLP 12.000. La fuga evitable que el nuevo sistema de turnos está por disparar vale entre CLP 56M y 104M al año. Capturando solo la mitad, el sistema deja un ahorro neto de CLP 28M–73M el primer año — y recurrente después. El "),
      T("payback es de semanas", { bold: true }),
      T("."),
    ], { after: 0 }),
  ]),
  P([T("Nota metodológica: ", { italics: true, bold: true }), T("cifras en rangos con el valor de HE calculado de los sueldos reales y la jornada legal vigente. El % de captura es conservador (el motor no elimina toda contingencia, sí la asignación ineficiente). Calibrable con la tasa de HE cargada de Nómina.", { italics: true })]),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================
// 8. GOBERNANZA Y CONDICIONES
// ============================================================
add(
  H1("8. Gobernanza y Condiciones (Ganar-Ganar)"),
  P([T("No vendemos el software: asumimos su liderazgo.", { bold: true, color: AZUL2 })]),
  P([
    T("No solicitamos un pago único por desprendernos del sistema. Proponemos algo de mayor valor para la empresa: "),
    T("mantenernos a cargo del ecosistema completo", { bold: true }),
    T(" —como autores, administradores y responsables de su evolución—, garantizando que la herramienta que controla el presupuesto de horas extra siga afinándose desde la operación real. La propiedad intelectual es nuestra (desarrollada en tiempo personal, fuera de turno); la empresa opera bajo licencia de uso interno."),
  ]),
  H2("8.1 Compensación monetaria por la responsabilidad asumida"),
  P("Formalizada vía anexo de contrato, con una lógica que se autofinancia con el ahorro:"),
  table(
    [3000, 4060, 2300],
    ["Componente", "Descripción", "Lógica para Finanzas"],
    [
      ["Asignación de responsabilidad (fija)", "Reconocimiento mensual por custodia y soporte del sistema", "Costo acotado y predecible"],
      ["Reconocimiento por resultados (variable)", "Vinculado a la reducción medible de horas extra evitables", "Se paga solo si hay ahorro real"],
      [cc("★ Factor de criticidad (estratégico)", { bold: true }), "Reconoce que administraríamos un sistema de misión crítica del que dependerá la operación y el control de presupuesto", "Retener a los autores es más barato que perderlos"],
    ]
  ),
  spacer(),
  H2("8.2 Por qué seríamos personal casi indispensable (valor a retener, no amenaza)"),
  P("La indispensabilidad no nace de retener información, sino de una combinación de competencias que en la empresa casi no coexiste en las mismas personas:"),
  table(
    [5560, 2400, 1400],
    ["Competencia", "Quién la tiene", "Nosotros"],
    [
      ["Conocimiento operativo de la vía (turnos, reposo, manejo)", "Personal de tracción", cc("Sí", { align: AlignmentType.CENTER, color: VERDE, bold: true })],
      ["Dominio de la normativa laboral-ferroviaria aplicada", "Parcial, disperso", cc("Sí", { align: AlignmentType.CENTER, color: VERDE, bold: true })],
      ["Capacidad de ingeniería de software", "TI", cc("Sí", { align: AlignmentType.CENTER, color: VERDE, bold: true })],
      [cc("Autoría y entendimiento del sistema núcleo", { bold: true }), "Nadie más", cc("Solo nosotros", { align: AlignmentType.CENTER, color: VERDE, bold: true })],
    ]
  ),
  spacer(60),
  P([T("TI sabe programar pero no vive la operación; el operador vive la vía pero no programa. Nosotros somos el ", {}), T("puente único", { bold: true }), T(" entre ambos mundos —y además escribimos el sistema—. Lo planteamos como un valor estratégico a retener, no como una dependencia: documentamos, capacitamos y damos continuidad.")]),
  H2("8.3 Régimen 50/50 (desarrollo con respaldo operativo)"),
  P("Durante el desarrollo y validación solicitamos un régimen 50% turno de conducción / 50% desarrollo, deliberadamente conservador y a favor de la empresa:"),
  table(
    [3120, 3120, 3120],
    ["Beneficio", "Para la operación", "Para Finanzas"],
    [
      ["Continuidad en la vía", "Seguimos cubriendo turnos: no se pierde dotación", "Sin costo de reemplazo total"],
      ["Respaldo ante riesgo", "Si la app no rinde, seguimos plenamente operativos", "Inversión reversible, riesgo acotado"],
      ["Validación en terreno real", "Probamos el sistema mientras conducimos", "Ahorro medido en operación, no en laboratorio"],
      ["Transición gradual", "La dedicación se ajusta según resultados", "Se escala solo si el ahorro se confirma"],
    ]
  ),
  spacer(),
  callout([
    P([T("La liberación adicional de horas se gana con números: si el ahorro se confirma, se amplía la dedicación; si no, retorno natural a turno completo, sin costo de transición. Riesgo cero para la empresa.", { bold: true })], { after: 0 }),
  ], FILL_ALT),
  H2("8.4 Proyección futura de rol (por mérito, no como condición)"),
  P([
    T("No es una exigencia de hoy ni un requisito para entregar el sistema. Planteamos que, "),
    T("si el proyecto rinde lo proyectado", { bold: true }),
    T(", la empresa valore a futuro una transición a un ámbito de administración / gestión operativa (junto a IL, SL y jefatura) o un rol dedicado al desarrollo y la funcionalidad de la operación. Una puerta abierta basada en resultados, no una condición."),
  ]),
  H2("8.5 Matriz de interacción con la operación"),
  table(
    [3000, 3180, 3180],
    ["Contraparte", "Rol", "Interacción"],
    [
      ["Gerencia de Operaciones / Finanzas", "Patrocinio y decisión", "Aprueba alcance y compensación"],
      ["Jefe de Operaciones", "Dueño funcional", "Valida reglas, KPIs y prioridades"],
      ["Inspectores de Línea (IL)", "Validadores / soporte N1", "Autorizan registros, reportan mejoras"],
      ["Supervisores de Línea (SL)", "Usuarios clave", "Retroalimentan flujo diario"],
      [cc("Equipo Syncro Red (nosotros)", { bold: true }), cc("Custodios y líderes técnicos", { bold: true }), "Construyen, mantienen, capacitan"],
      ["TI corporativo", "Infraestructura / integración", "Hosting, SSO, ciberseguridad"],
    ]
  ),
  spacer(),
  callout([
    P([T("No competimos con TI, los complementamos: ", { bold: true }), T("TI aporta infraestructura, seguridad e integración corporativa; nosotros aportamos la lógica operativa que solo se conoce desde la vía.")], { after: 0 }),
  ]),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================
// 9. CARTA GANTT
// ============================================================
add(
  H1("9. Carta Gantt Escalonada (Fases de Desarrollo)"),
  table(
    [1700, 2660, 5000],
    ["Fase", "Plazo", "Hitos"],
    [
      [cc("Fase 1 — MVP / Demo", { bold: true }), "Corto plazo (Mes 1)", "Demo funcional end-to-end (login por RUT, gráfico mensual, pauta diaria, tracción en vivo, bitácora, asistencia) + sprint de hardening de seguridad. Entregable: demo presentable a gerencia y jefatura."],
      [cc("Fase 2 — Estabilización", { bold: true }), "Mediano plazo (Mes 2–3)", "Reporte semanal y consolidado mensual “raya para la suma” con tablero de KPIs; endurecimiento de la sincronización offline; pruebas automatizadas sobre lógica crítica; piloto con IL/SL. Entregable: sistema estabilizado en piloto."],
      [cc("Fase 3 — Integración", { bold: true }), "Largo plazo (Mes 4–9+)", "SSO corporativo y despliegue universal; integración de CTC, Libro Reports, OIS de sobrepaso y AOH; ingesta de telemetría GPS de grado industrial (MQTT). Entregable: Ecosistema Operacional Único en producción."],
    ]
  ),
  spacer(120),
  P([T("Representación temporal", { bold: true, color: AZUL })]),
  table(
    [3700, 1886, 1887, 1887],
    ["Fase", "Mes 1", "Mes 2–3", "Mes 4–9+"],
    [
      ["Fase 1 — MVP / Demo", cc("", { fill: AZUL2 }), "", ""],
      ["Fase 2 — Estabilización", "", cc("", { fill: AZUL2 }), ""],
      ["Fase 3 — Integración", "", "", cc("", { fill: AZUL2 })],
    ]
  ),
  new Paragraph({ children: [new PageBreak()] })
);

// ============================================================
// 10. CIERRE
// ============================================================
add(
  H1("10. Cierre para la Gerencia"),
  callout([
    P([
      T("“No le pedimos que nos compre un software ni que nos cambie de cargo. Le pedimos quedar a cargo del sistema que detiene una fuga de CLP 56M–104M al año, con medio turno para desarrollarlo y probarlo —manteniendo respaldo operativo total— y una compensación que se paga sola con ese ahorro y que reconoce la criticidad de lo que vamos a administrar. Y si esto resulta como proyectamos, que a futuro se valore, por mérito, un rol en administración o desarrollo de la operación.”", { italics: true, size: 24 }),
    ], { after: 0 }),
  ]),
  spacer(160),
  P([
    T("El mercado ya puso precio piso a un sistema inferior de otra red. Nosotros entregamos más —un motor de control de presupuesto validado en terreno—, con ROI inmediato y riesgo operativo mínimo. Solo pedimos las condiciones para sostenerlo con la excelencia que la operación merece.", { bold: true }),
  ]),
  spacer(240),
  P([T("_______________________________", {})], { after: 40 }),
  P([T("Equipo Syncro Red — Personal de Tracción", { bold: true })], { after: 0 }),
  P([T("Maquinista · Ayudante", { color: "555555" })])
);

// ============================================================
//  DOCUMENTO
// ============================================================
const doc = new Document({
  creator: "Equipo Syncro Red",
  title: "Propuesta Técnico-Económica — Syncro Red",
  styles: {
    default: { document: { run: { font: "Arial", size: 21 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, color: AZUL, font: "Arial" },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0,
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: AZUL2, space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: AZUL2, font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, color: "333333", font: "Arial" },
        paragraph: { spacing: { before: 140, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bul", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 460, hanging: 280 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 920, hanging: 280 } } } },
      ] },
      { reference: "num", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 460, hanging: 280 } } } },
      ] },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1300, right: 1440, bottom: 1300, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 2 } },
              tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
              children: [
                T("SYNCRO RED", { bold: true, color: AZUL, size: 16 }),
                T("\tPropuesta Técnico-Económica · Confidencial", { color: "888888", size: 16 }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 2 } },
              children: [
                T("Página ", { size: 16, color: "888888" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" }),
                T(" de ", { size: 16, color: "888888" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: "888888" }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("Propuesta_Syncro_Red.docx", buffer);
  console.log("OK -> Propuesta_Syncro_Red.docx (" + buffer.length + " bytes)");
});
