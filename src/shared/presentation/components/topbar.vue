<script setup>
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { clearAuthSession } from '@/shared/config/session-auth.js'
import { LogOut } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { contextByPath } from '../../config/navigation.js'
import LanguageSwitcher from './language-switcher.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

function logout() {
  clearAuthSession()
  router.push({ name: 'login' })
}

const ctx = computed(() => contextByPath(route.path))

/** Tipografía Inter + título grande en analítica, inventario, logística, monitoreo, alertas e informes. */
const dashTypography = computed(
  () =>
    route.path.startsWith('/analytics') ||
    route.path.startsWith('/inventory') ||
    route.path.startsWith('/logistics') ||
    route.path.startsWith('/environmental-monitoring') ||
    route.path.startsWith('/alerts') ||
    route.path.startsWith('/reporting'),
)

const pageTitle = computed(() => {
  if (route.meta?.hidePageTitle) {
    return null
  }
  if (route.meta?.titleKey) {
    return t(route.meta.titleKey)
  }
  if (ctx.value) {
    return t(ctx.value.labelKey)
  }
  return t('shell.appName')
})
</script>

<template>
  <header
    class="sf-topbar"
    :class="{ 'sf-topbar--no-title': !pageTitle, 'sf-topbar--dash-typography': dashTypography }"
  >
    <div v-if="pageTitle" class="sf-topbar__title-wrap">
      <h1 class="sf-topbar__title">{{ pageTitle }}</h1>
    </div>

    <div class="sf-topbar__actions">
      <div class="sf-topbar__lang">
        <LanguageSwitcher />
      </div>

      <div class="sf-topbar__user">
        <RouterLink
          to="/profile"
          class="sf-avatar sf-avatar--btn"
          :title="t('shell.profile')"
          :aria-label="t('shell.profile')"
        >
          SF
        </RouterLink>
        <button
          type="button"
          class="sf-icon-btn sf-icon-btn--plain"
          :title="t('shell.logout')"
          @click="logout"
        >
          <span class="sf-icon-btn__logout" aria-hidden="true">
            <LogOut />
          </span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.sf-topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 64px;
  flex-shrink: 0;
  padding: 0 16px;
  border-bottom: none;
  background: #f8fafc;
  backdrop-filter: none;
}

.sf-topbar--dash-typography {
  height: auto;
  min-height: 64px;
  padding-block: 12px;
}

.sf-topbar__title-wrap {
  min-width: 0;
  flex: 1;
  padding-right: 16px;
}

.sf-topbar__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--sf-ui-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sf-topbar--dash-typography .sf-topbar__title {
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  font-size: var(--sf-dash-title, clamp(28px, 3vw, 36px));
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.sf-topbar--no-title .sf-topbar__actions {
  margin-left: auto;
}

.sf-topbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sf-topbar__lang {
  display: none;
}

@media (min-width: 640px) {
  .sf-topbar__lang {
    display: block;
  }
}

.sf-icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}

.sf-icon-btn:hover {
  background: #f1f5f9;
  color: #475569;
}

.sf-topbar__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 12px;
  border-left: 1px solid #e2e8f0;
}

.sf-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: #dbeafe;
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
}

.sf-avatar--btn {
  margin: 0;
  padding: 0;
  border: none;
  cursor: pointer;
  font: inherit;
  text-decoration: none;
  color: inherit;
}

.sf-avatar--btn:hover {
  filter: brightness(0.97);
}

.sf-avatar--btn:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.sf-icon-btn--plain {
  border-radius: 6px;
}

.sf-icon-btn__logout :deep(svg) {
  width: 20px;
  height: 20px;
}
</style>
