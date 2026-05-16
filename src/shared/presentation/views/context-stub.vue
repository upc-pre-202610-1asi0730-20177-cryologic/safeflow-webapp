<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="sf-stub">
    <p class="sf-stub__lead">{{ t('shell.stubLead') }}</p>
  </div>
</template>

<style scoped>
.sf-stub {
  max-width: 640px;
}
.sf-stub__lead {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: #475569;
}
</style>
