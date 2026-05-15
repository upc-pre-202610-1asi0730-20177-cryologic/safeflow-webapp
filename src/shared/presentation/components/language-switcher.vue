<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
/** ES a la izquierda, EN a la derecha (segmentado tipo pastilla). */
const localeOptions = ['es', 'en']

function labelFor(code) {
  return code === 'en' ? 'English' : 'Español'
}
</script>

<template>
  <div class="sf-lang-switch">
    <pv-select-button v-model="locale" :options="localeOptions">
      <template #option="{ option }">
        <span class="sf-lang-option" :aria-label="labelFor(option)">
          <span class="sf-lang-flag" aria-hidden="true">
            <svg
              v-if="option === 'en'"
              class="sf-lang-flag__svg"
              viewBox="0 0 57 30"
              preserveAspectRatio="xMidYMid slice"
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="57" height="30" fill="#fff" />
              <g fill="#b22234">
                <rect y="0" width="57" height="2.31" />
                <rect y="4.62" width="57" height="2.31" />
                <rect y="9.23" width="57" height="2.31" />
                <rect y="13.85" width="57" height="2.31" />
                <rect y="18.46" width="57" height="2.31" />
                <rect y="23.08" width="57" height="2.31" />
                <rect y="27.69" width="57" height="2.31" />
              </g>
              <rect width="24" height="16.15" fill="#3c3b6e" />
              <g fill="#fff">
                <circle cx="3.8" cy="2.7" r="0.85" />
                <circle cx="7.6" cy="2.7" r="0.85" />
                <circle cx="11.4" cy="2.7" r="0.85" />
                <circle cx="15.2" cy="2.7" r="0.85" />
                <circle cx="19" cy="2.7" r="0.85" />
                <circle cx="5.7" cy="5.35" r="0.85" />
                <circle cx="9.5" cy="5.35" r="0.85" />
                <circle cx="13.3" cy="5.35" r="0.85" />
                <circle cx="17.1" cy="5.35" r="0.85" />
                <circle cx="3.8" cy="8" r="0.85" />
                <circle cx="7.6" cy="8" r="0.85" />
                <circle cx="11.4" cy="8" r="0.85" />
                <circle cx="15.2" cy="8" r="0.85" />
                <circle cx="19" cy="8" r="0.85" />
                <circle cx="5.7" cy="10.65" r="0.85" />
                <circle cx="9.5" cy="10.65" r="0.85" />
                <circle cx="13.3" cy="10.65" r="0.85" />
                <circle cx="17.1" cy="10.65" r="0.85" />
                <circle cx="3.8" cy="13.3" r="0.85" />
                <circle cx="7.6" cy="13.3" r="0.85" />
                <circle cx="11.4" cy="13.3" r="0.85" />
                <circle cx="15.2" cy="13.3" r="0.85" />
              </g>
            </svg>
            <svg
              v-else
              class="sf-lang-flag__svg"
              viewBox="0 0 30 20"
              preserveAspectRatio="xMidYMid slice"
              focusable="false"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="30" height="20" fill="#aa151b" />
              <rect y="5" width="30" height="10" fill="#f1bf00" />
            </svg>
          </span>
          <span class="sf-lang-code">{{ option.toUpperCase() }}</span>
        </span>
      </template>
    </pv-select-button>
  </div>
</template>

<style scoped>
.sf-lang-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.sf-lang-code {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
}

.sf-lang-flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.1);
}

.sf-lang-flag__svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Contenedor pastilla */
.sf-lang-switch :deep(.p-selectbutton) {
  display: inline-flex;
  align-items: stretch;
  padding: 3px;
  gap: 2px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  box-shadow: none;
}

.sf-lang-switch :deep(.p-selectbutton .p-togglebutton) {
  flex: 1 1 0;
  min-width: 0;
  margin: 0 !important;
  border: none !important;
  border-radius: 999px !important;
  background: transparent !important;
  color: #475569 !important;
  box-shadow: none !important;
  font-weight: 700;
  padding: 6px 10px !important;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.sf-lang-switch :deep(.p-selectbutton .p-togglebutton .p-togglebutton-content) {
  background: transparent !important;
  box-shadow: none !important;
  border-radius: inherit;
  padding: 0 !important;
  justify-content: center;
}

.sf-lang-switch :deep(.p-selectbutton .p-togglebutton-label) {
  padding: 0 !important;
  color: inherit !important;
}

.sf-lang-switch :deep(.p-selectbutton .p-togglebutton:not(:disabled):not(.p-togglebutton-checked):hover) {
  background: rgba(15, 23, 42, 0.05) !important;
  color: #334155 !important;
}

.sf-lang-switch :deep(.p-selectbutton .p-togglebutton.p-togglebutton-checked) {
  background: #2563eb !important;
  color: #fff !important;
  border-color: transparent !important;
}

.sf-lang-switch :deep(.p-selectbutton .p-togglebutton.p-togglebutton-checked:hover) {
  background: #1d4ed8 !important;
  color: #fff !important;
}

.sf-lang-switch :deep(.p-selectbutton .p-togglebutton.p-togglebutton-checked .sf-lang-flag) {
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.12);
}
</style>
