<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <footer class="text-center text-sm opacity-70" style="color: var(--p-text-muted-color, #64748b)">
    {{ t('footer.line') }}
  </footer>
</template>
