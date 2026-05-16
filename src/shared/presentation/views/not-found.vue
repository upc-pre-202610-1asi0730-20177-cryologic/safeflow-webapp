<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="sf-nf">
    <h2 class="sf-nf__title">{{ t('notFound.title') }}</h2>
    <p class="sf-nf__msg">{{ t('notFound.message') }}</p>
    <RouterLink to="/analytics" class="sf-nf__link">{{ t('notFound.backAnalytics') }}</RouterLink>
  </div>
</template>

<style scoped>
.sf-nf {
  max-width: 448px;
}
.sf-nf__title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--sf-ui-text);
}
.sf-nf__msg {
  margin: 0 0 16px;
  color: #64748b;
  font-size: 15px;
}
.sf-nf__link {
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
}
.sf-nf__link:hover {
  text-decoration: underline;
}
</style>
