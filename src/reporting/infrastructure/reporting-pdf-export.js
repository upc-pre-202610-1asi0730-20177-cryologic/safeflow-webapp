/**
 * Informe integral en PDF: títulos centrados, tablas alineadas y numeración de página.
 */
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import db from '../../../server/db.json'

const TEAL = [77, 182, 172]
const SLATE = [15, 23, 42]
const MUTED = [100, 116, 139]

function safeArray(get) {
  const v = get()
  return Array.isArray(v) ? v : []
}

function cell(v) {
  if (v == null) return '—'
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  return String(v)
}

/**
 * @returns {{ filename: string, mime: string, blob: Blob }}
 */
export function buildPdfReportFromDb() {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 16
  const cx = pageW / 2

  const despachos = safeArray(() => db?.logistics?.despachos)
  const productos = safeArray(() => db?.inventory?.productos)
  const inventario = safeArray(() => db?.inventory?.inventario)
  const registros = safeArray(() => db?.environmentalMonitoring?.registrosTemperatura)
  const alertas = safeArray(() => db?.alerts?.alertas)
  const destinos = safeArray(() => db?.logistics?.destinos)
  const rutas = safeArray(() => db?.logistics?.rutas)
  const choferes = safeArray(() => db?.logistics?.choferes)
  const transportistas = safeArray(() => db?.logistics?.transportistas)

  const stamp = new Date().toLocaleString('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  let y = 18

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...SLATE)
  doc.text('SafeFlow — Informe integral', cx, y, { align: 'center' })
  y += 9

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10.5)
  doc.setTextColor(...MUTED)
  doc.text('Logistics · Inventory · Thermal monitoring · Alerts · Staff and carriers', cx, y, {
    align: 'center',
  })
  y += 7
  doc.text(`Generado: ${stamp}`, cx, y, { align: 'center' })
  y += 6

  doc.setDrawColor(...TEAL)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  y += 10

  const tableDefaults = {
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      valign: 'middle',
      halign: 'center',
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: TEAL,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: 'striped',
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
    showHead: 'everyPage',
  }

  function sectionTitle(text) {
    if (y > pageH - 28) {
      doc.addPage()
      y = margin + 4
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...SLATE)
    doc.text(text, cx, y, { align: 'center' })
    y += 8
    doc.setFont('helvetica', 'normal')
  }

  function drawTable(title, head, body) {
    sectionTitle(title)
    const rows = body.length ? body : [head.map(() => '—')]
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [head],
      body: rows,
    })
    y = doc.lastAutoTable.finalY + 12
  }

  drawTable(
    'Despachos',
    [
      'ID',
      'Inventario',
      'Ruta',
      'Modo',
      'Chofer',
      'Operario',
      'Transp.',
      'Estado',
      'Térm.',
      'Cant.',
      'Salida',
      'ETA',
    ],
    despachos.map((d) => [
      cell(d.idDespacho),
      cell(d.idInventario),
      cell(d.idRuta),
      cell(d.modoUbicacion),
      cell(d.idChofer),
      cell(d.idOperario),
      cell(d.idTransportista),
      cell(d.estado),
      cell(d.estadoTermico),
      cell(d.cantidad),
      cell(d.fechaSalida?.slice?.(0, 16)),
      cell(d.fechaEntregaEstimada?.slice?.(0, 16)),
    ]),
  )

  drawTable(
    'Productos',
    ['ID', 'Lote', 'Estado', 'T min', 'T max', 'Vencimiento'],
    productos.map((p) => [
      cell(p.idProducto),
      cell(p.lote),
      cell(p.estado),
      cell(p.temperaturaMin),
      cell(p.temperaturaMax),
      cell(p.fechaVencimiento),
    ]),
  )

  drawTable(
    'Inventario (líneas)',
    ['ID inventario', 'Producto', 'Cantidad', 'Ubicación / meta'],
    inventario.map((i) => [cell(i.idInventario), cell(i.idProducto), cell(i.cantidad), cell(i.ubicacion)]),
  )

  drawTable(
    'Registros térmicos',
    ['ID', 'Producto', 'Despacho', 'Temp. °C', 'Fecha / hora', 'Origen'],
    registros.map((r) => [
      cell(r.idRegistro),
      cell(r.idProducto),
      cell(r.idDespacho),
      cell(r.temperatura),
      cell(r.fechaHora),
      cell(r.origen),
    ]),
  )

  drawTable(
    'Alertas',
    ['ID', 'Estado', 'Tipo', 'Detalle'],
    alertas.map((a) => [
      cell(a.idAlerta ?? a.id),
      cell(a.estado),
      cell(a.tipo),
      cell(a.detalle ?? a.mensaje ?? a.descripcion),
    ]),
  )

  drawTable(
    'Destinos',
    ['ID', 'Código', 'Nombre (JSON)'],
    destinos.map((d) => [cell(d.idDestino), cell(d.codigo), cell(d.nombre)]),
  )

  drawTable(
    'Rutas',
    ['ID', 'Código', 'Dist. km', 'Tiempo est. h'],
    rutas.map((r) => [cell(r.idRuta), cell(r.codigo), cell(r.distanciaKm), cell(r.tiempoEstimadoHoras)]),
  )

  drawTable(
    'Personal (conductores y operarios)',
    ['ID', 'Código', 'Rol', 'Transp.', 'Licencia', 'Contacto', 'Nombre'],
    choferes.map((c) => [
      cell(c.idChofer),
      cell(c.codigo),
      cell(c.rol ?? 'conductor'),
      cell(c.idTransportista),
      cell(c.licencia),
      cell(c.contacto),
      cell(c.nombre),
    ]),
  )

  drawTable(
    'Transportistas',
    ['ID', 'Código', 'Nombre'],
    transportistas.map((t) => [cell(t.idTransportista), cell(t.codigo), cell(t.nombre)]),
  )

  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(`Página ${i} de ${totalPages}`, cx, pageH - 9, { align: 'center' })
  }

  const fileStamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const filename = `safeflow-informe-integral-${fileStamp}.pdf`
  const blob = doc.output('blob')

  return { filename, mime: 'application/pdf', blob }
}
