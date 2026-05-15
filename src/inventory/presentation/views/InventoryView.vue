<script setup>
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useInventoryStore } from '../../application/inventory.store.js'
import InventoryItemsTable from '../components/InventoryItemsTable.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const inventory = useInventoryStore()
const { items } = storeToRefs(inventory)

function goNewProduct() {
  router.push({ name: 'inventory-add-product' })
}

watch(
  () => route.name,
  (name) => {
    if (name === 'inventory-root') void inventory.loadItems()
  },
  { immediate: true },
)
</script>

<template>
  <div class="sf-inv-page">
    <div class="sf-inv-page__toolbar">
      <pv-button
        :label="t('bounded.inventory.addItem')"
        icon="pi pi-plus"
        icon-pos="left"
        :aria-label="t('bounded.inventory.addItem')"
        class="sf-inv-page__add"
        @click="goNewProduct"
      />
    </div>

    <InventoryItemsTable :rows="items" />
  </div>
</template>

<style scoped>
.sf-inv-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 100%;
}

.sf-inv-page__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.sf-inv-page__add {
  font-weight: 600;
  padding-inline: 16px !important;
  border-radius: 8px !important;
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: #fff !important;
}

.sf-inv-page__add:not(:disabled):hover {
  background: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
}
</style>
