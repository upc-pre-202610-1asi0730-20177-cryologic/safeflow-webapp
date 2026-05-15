
export class InventoryItem {


  constructor({
    rowId = null,
    idProducto = null,
    idInventario = null,
    qty = 0,
    status = 'available',
    tempTone = 'chilled',
    name = null,
    category = null,
    tempLabel = null,
    location = null,
    temperaturaMin = null,
    temperaturaMax = null,
    lote = null,
    fechaVencimiento = null,
    fechaIngreso = null,
  } = {}) {
    this.rowId = rowId
    this.idProducto = idProducto
    this.idInventario = idInventario ?? rowId
    this.qty = qty
    this.status = status
    this.tempTone = tempTone
    this.name = normalizeLocalized(name)
    this.category = normalizeLocalized(category)
    this.tempLabel = normalizeLocalized(tempLabel)
    this.location = normalizeLocalized(location)
    this.temperaturaMin = temperaturaMin
    this.temperaturaMax = temperaturaMax
    this.lote = lote
    this.fechaVencimiento = fechaVencimiento
    this.fechaIngreso = fechaIngreso
  }
}


function normalizeLocalized(value) {
  if (value == null || typeof value !== 'object') return null
  return Object.keys(value).length ? /** @type {LocalizedText} */ (value) : null
}
