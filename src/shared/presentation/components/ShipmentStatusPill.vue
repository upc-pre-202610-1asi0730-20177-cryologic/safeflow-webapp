<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Valor de dominio: `pending`, `transit`, `delivered`, etc. */
  status: {
    type: String,
    required: true,
  },
  /** Texto ya traducido para mostrar */
  label: {
    type: String,
    required: true,
  },
})

function statusKind(s) {
  if (s === 'transit') return 'transit'
  if (s === 'delivered') return 'delivered'
  return 'pending'
}

const kindClass = computed(() => `sf-ship-status--${statusKind(props.status)}`)
</script>

<template>
  <span class="sf-ship-status" :class="kindClass">{{ label }}</span>
</template>

<style scoped>
/**
 * Pastilla única para estados de envío (reemplaza mezclas de pv-tag con severidades distintas).
 * Misma caja tipográfica y pastilla en todos los tonos.
 */
.sf-ship-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
  min-height: 26px;
  padding: 4px 11px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0;
  border: 1px solid transparent;
  white-space: nowrap;
}

.sf-ship-status--pending {
  color: #b45309;
  background: #fffbeb;
  border-color: #fde68a;
}

.sf-ship-status--transit {
  color: #1e40af;
  background: #eff6ff;
  border-color: #dbeafe;
}

.sf-ship-status--delivered {
  color: #15803d;
  background: #f0fdf4;
  border-color: #bbf7d0;
}
</style>
