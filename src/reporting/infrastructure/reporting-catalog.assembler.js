import { createReportingCatalogItem } from '../domain/model/reporting-catalog-item.entity.js'

export function toReportingCatalogItemEntity(dto) {
  const base = `bounded.reporting.catalog.${dto.id}`
  return createReportingCatalogItem({
    id: dto.id,
    titleKey: `${base}.title`,
    descriptionKey: `${base}.description`,
    format: dto.format,
  })
}
