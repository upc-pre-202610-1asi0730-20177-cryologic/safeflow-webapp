<script setup>
import { RouterLink, useRoute } from 'vue-router'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import { appHomePath, boundedContexts } from '../../config/navigation.js'
import { BRAND_MARK_SIDEBAR_SRC } from '@/shared/config/branding.js'
import { useI18n } from 'vue-i18n'

defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-sidebar'])

const { t } = useI18n()
const route = useRoute()

function isContextActive(basePath) {
  const p = route.path.startsWith('/') ? route.path : `/${route.path}`
  if (p === basePath) return true
  return basePath !== '/' && p.startsWith(`${basePath}/`)
}
</script>

<template>
  <aside class="sf-sidebar" :class="{ 'sf-sidebar--collapsed': collapsed }">
    <RouterLink
      class="sf-sidebar__brand sf-sidebar__brand-link"
      :to="appHomePath"
      :title="collapsed ? t('shell.appName') : undefined"
    >
      <span class="sf-sidebar__icon">
        <img
          class="sf-sidebar__icon-img"
          :src="BRAND_MARK_SIDEBAR_SRC"
          :alt="collapsed ? t('shell.appName') : ''"
          decoding="async"
        />
      </span>
      <div v-if="!collapsed" class="sf-sidebar__titles">
        <p class="sf-sidebar__name">{{ t('shell.appName') }}</p>
      </div>
    </RouterLink>

    <nav class="sf-sidebar__nav">
      <p v-if="!collapsed" class="sf-sidebar__section">{{ t('shell.modules') }}</p>

      <RouterLink
        v-for="ctx in boundedContexts"
        :key="ctx.id"
        :to="ctx.basePath"
        class="sf-nav-link"
        :class="{ 'sf-nav-link--active': isContextActive(ctx.basePath) }"
        :title="collapsed ? t(ctx.labelKey) : undefined"
      >
        <span class="sf-nav-link__icon" aria-hidden="true">
          <component :is="ctx.icon" />
        </span>
        <span v-if="!collapsed" class="sf-nav-link__label">{{ t(ctx.labelKey) }}</span>
      </RouterLink>
    </nav>

    <div class="sf-sidebar__footer">
      <button type="button" class="sf-toggle" :title="collapsed ? t('shell.expandMenu') : ''" @click="emit('toggle-sidebar')">
        <PanelLeftClose v-if="!collapsed" class="sf-toggle__icon" />
        <PanelLeftOpen v-else class="sf-toggle__icon" />
        <span v-if="!collapsed">{{ t('shell.collapse') }}</span>
      </button>
    </div>

    <div v-if="!collapsed" class="sf-sidebar__status">
      <p class="sf-status__title">{{ t('shell.systemStatus') }}</p>
      <div class="sf-status__row">
        <span class="sf-status__dot" />
        {{ t('shell.operational') }}
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sf-sidebar {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 256px;
  flex-shrink: 0;
  border-right: none;
  background: linear-gradient(165deg, #eef4fc 0%, #dfeaf6 45%, #d3e2f2 100%);
  transition: width 0.2s ease;
  box-sizing: border-box;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.sf-sidebar--collapsed {
  width: 72px;
}

.sf-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 64px;
  padding: 0 16px;
}

.sf-sidebar__brand-link {
  text-decoration: none;
  color: inherit;
  border-radius: 6px;
}

.sf-sidebar__brand-link:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.45);
  outline-offset: 2px;
}

.sf-sidebar__brand-link:hover .sf-sidebar__name {
  color: #1d4ed8;
}

.sf-sidebar__icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  height: 32px;
  max-width: 144px;
  background: transparent;
  border-radius: 0;
  overflow: visible;
}

.sf-sidebar__icon-img {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  display: block;
}

.sf-sidebar__titles {
  min-width: 0;
}

.sf-sidebar__name {
  margin: 0;
  font-size: clamp(16px, 1.1vw, 18px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--sf-ui-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sf-sidebar__subtitle {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sf-sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 16px 8px;
}

.sf-sidebar__section {
  margin: 0 0 8px;
  padding: 0 8px;
  font-size: clamp(11px, 0.7vw, 12px);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

.sf-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 12px;
  margin-bottom: 12px;
  border-radius: 6px;
  font-size: clamp(14px, 0.9vw, 16px);
  font-weight: 500;
  color: #1e3a5f;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.sf-sidebar--collapsed .sf-nav-link {
  justify-content: center;
  padding-left: 0;
  padding-right: 0;
}

.sf-nav-link:hover {
  background: rgba(37, 99, 235, 0.14);
  color: var(--sf-ui-text);
}

.sf-nav-link--active {
  background: #bfdbfe;
  color: #1e3a8a;
  box-shadow: inset 0 0 0 1px rgba(29, 78, 216, 0.22);
}

.sf-nav-link--active:hover {
  background: #93c5fd;
  color: #1e3a8a;
}

.sf-nav-link__icon :deep(svg) {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sf-nav-link__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sf-sidebar__footer {
  border-top: 1px solid rgba(30, 58, 138, 0.12);
  padding: 8px;
}

.sf-toggle {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-family: inherit;
  font-size: clamp(14px, 0.9vw, 16px);
  font-weight: 500;
  color: #475569;
  cursor: pointer;
}

.sf-toggle:hover {
  background: rgba(37, 99, 235, 0.14);
  color: var(--sf-ui-text);
}

.sf-toggle__icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.sf-sidebar__status {
  border-top: 1px solid rgba(30, 58, 138, 0.12);
  padding: 16px;
}

.sf-status__title {
  margin: 0 0 8px;
  font-size: clamp(13px, 0.82vw, 15px);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #334155;
}

.sf-status__row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: clamp(14px, 0.9vw, 16px);
  font-weight: 500;
  color: #475569;
}

.sf-status__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #10b981;
  animation: sf-pulse 1.5s ease-in-out infinite;
}

@keyframes sf-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
