import { useI18n } from 'vue-i18n'

/**
 * Resuelve campos `{ en, es }` del envío según el locale activo.
 */
export function useShipmentLocaleText() {
    const { locale } = useI18n()

    /** @param {{ en?: string, es?: string }|null|undefined} field */
    function loc(field) {
        if (field && typeof field === 'object' && (field.en != null || field.es != null)) {
            const key = locale.value === 'es' ? 'es' : 'en'
            return field[key] ?? field.en ?? field.es ?? ''
        }
        return ''
    }

    return { loc }
}
