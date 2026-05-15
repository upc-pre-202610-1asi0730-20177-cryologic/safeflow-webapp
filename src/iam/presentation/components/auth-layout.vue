<script setup>
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/shared/presentation/components/language-switcher.vue'
import { BRAND_MARK_SIDEBAR_SRC } from '@/shared/config/branding.js'

const { t } = useI18n()
</script>

<template>
  <div class="sf-auth-page">
    <pv-toast position="top-right" />
    <header class="sf-auth-page__toolbar">
      <LanguageSwitcher />
    </header>
    <main class="sf-auth-page__center">
      <div class="sf-auth-card">
        <div class="sf-auth-card__brand">
          <div class="sf-auth-card__logo-ring">
            <img
              class="sf-auth-card__logo-img"
              :src="BRAND_MARK_SIDEBAR_SRC"
              alt=""
              width="48"
              height="48"
            />
          </div>
          <span class="sf-auth-card__wordmark">{{ t('shell.appName') }}</span>
        </div>
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.sf-auth-page {
  min-height: 100vh;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  color-scheme: light;
  background: #eceff4;
  color: #0f172a;
}

.sf-auth-page__toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px 0;
}

.sf-auth-page__center {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 16px 48px;
}

.sf-auth-card {
  width: 100%;
  max-width: 420px;
  padding: 40px 36px 36px;
  background: #fff;
  border-radius: 16px;
  box-shadow:
    0 4px 24px rgba(15, 23, 42, 0.07),
    0 1px 3px rgba(15, 23, 42, 0.06);
}

.sf-auth-card__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 28px;
}

.sf-auth-card__logo-ring {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.sf-auth-card__logo-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.sf-auth-card__wordmark {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1e3a8a;
}
</style>

<style>
/* PrimeVue + Material heredan modo oscuro del SO; fuerza IAM en superficie clara. */
.sf-auth-page .sf-auth-card input.p-inputtext,
.sf-auth-page .sf-auth-card .p-inputtext {
  width: 100%;
  box-sizing: border-box;
  border-radius: 8px !important;
  border: 1px solid #cbd5e1 !important;
  background: #ffffff !important;
  color: #0f172a !important;
  -webkit-text-fill-color: #0f172a !important;
}

.sf-auth-page .sf-auth-card input.p-inputtext::placeholder,
.sf-auth-page .sf-auth-card .p-inputtext::placeholder {
  color: #94a3b8 !important;
  opacity: 1;
}

.sf-auth-page .sf-auth-card input.p-inputtext:enabled:hover,
.sf-auth-page .sf-auth-card .p-inputtext:enabled:hover {
  border-color: #94a3b8 !important;
}

.sf-auth-page .sf-auth-card input.p-inputtext:enabled:focus,
.sf-auth-page .sf-auth-card .p-inputtext:enabled:focus {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.25) !important;
  outline: none !important;
}

.sf-auth-page .sf-auth-card input.p-inputtext:-webkit-autofill,
.sf-auth-page .sf-auth-card input.p-inputtext:-webkit-autofill:hover,
.sf-auth-page .sf-auth-card input.p-inputtext:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
  box-shadow: 0 0 0 1000px #ffffff inset !important;
  -webkit-text-fill-color: #0f172a !important;
}

.sf-auth-page .sf-auth-card .p-checkbox .p-checkbox-box {
  background: #ffffff !important;
  border-color: #cbd5e1 !important;
}

.sf-auth-page .sf-auth-card .p-checkbox.p-checkbox-checked .p-checkbox-box {
  background: #2563eb !important;
  border-color: #2563eb !important;
}

.sf-auth-page .sf-auth-card .p-checkbox.p-checkbox-checked .p-checkbox-icon {
  color: #ffffff !important;
}

.sf-auth-page .sf-auth-card .sf-auth-form__submit.p-button {
  width: 100%;
  justify-content: center;
  border-radius: 8px !important;
  padding-top: 11px !important;
  padding-bottom: 11px !important;
  font-weight: 600 !important;
  background: #ffffff !important;
  color: #2563eb !important;
  border: 1px solid #2563eb !important;
}

.sf-auth-page .sf-auth-card .sf-auth-form__submit.p-button:not(:disabled):hover {
  background: #eff6ff !important;
  border-color: #1d4ed8 !important;
  color: #1d4ed8 !important;
}

.sf-auth-page .sf-auth-card .sf-auth-form__submit.p-button:not(:disabled):focus-visible {
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.35) !important;
}

.sf-auth-page .sf-auth-card .sf-auth-form__submit.p-button.p-disabled,
.sf-auth-page .sf-auth-card .sf-auth-form__submit.p-button:disabled {
  opacity: 0.65 !important;
  cursor: not-allowed;
}
</style>
