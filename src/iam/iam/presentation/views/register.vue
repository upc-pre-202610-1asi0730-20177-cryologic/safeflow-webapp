<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setSessionAuthed } from '@/shared/config/session-auth.js'
import { BRAND_MARK_SRC } from '@/shared/config/branding.js'

const { t } = useI18n()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)

function submit() {
  error.value = ''
  if (!name.value.trim()) {
    error.value = t('auth.register.errorName')
    return
  }
  if (!email.value.trim()) {
    error.value = t('auth.register.errorEmail')
    return
  }
  if (password.value.length < 6) {
    error.value = t('auth.register.errorPasswordLen')
    return
  }
  if (password.value !== confirm.value) {
    error.value = t('auth.register.errorPasswordMatch')
    return
  }
  loading.value = true
  window.setTimeout(() => {
    setSessionAuthed(true)
    loading.value = false
    router.replace('/analytics')
  }, 80)
}
</script>

<template>
  <div class="sf-sign">
    <div class="sf-sign__inner">
      <div class="sf-sign__card">
        <header class="sf-sign__hero">
          <span class="sf-sign__shield" aria-hidden="true">
            <img class="sf-sign__shield-img" :src="BRAND_MARK_SRC" alt="" decoding="async" />
          </span>
          <h1 class="sf-sign__hero-title">{{ t('auth.register.heroTitle') }}</h1>
        </header>

        <form class="sf-sign__form" @submit.prevent="submit">
          <div class="sf-sign__field">
            <label class="sf-sign__label" for="sf-reg-name">{{ t('auth.register.name') }}</label>
            <input
              id="sf-reg-name"
              v-model="name"
              type="text"
              autocomplete="name"
              class="sf-sign__input"
              :placeholder="t('auth.register.namePlaceholder')"
            />
          </div>
          <div class="sf-sign__field">
            <label class="sf-sign__label" for="sf-reg-email">{{ t('auth.register.email') }}</label>
            <input
              id="sf-reg-email"
              v-model="email"
              type="email"
              autocomplete="email"
              class="sf-sign__input"
              :placeholder="t('auth.login.emailPlaceholder')"
            />
          </div>
          <div class="sf-sign__field">
            <label class="sf-sign__label" for="sf-reg-password">{{ t('auth.register.password') }}</label>
            <input
              id="sf-reg-password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              class="sf-sign__input"
              :placeholder="t('auth.register.passwordPlaceholder')"
            />
          </div>
          <div class="sf-sign__field">
            <label class="sf-sign__label" for="sf-reg-confirm">{{ t('auth.register.confirm') }}</label>
            <input
              id="sf-reg-confirm"
              v-model="confirm"
              type="password"
              autocomplete="new-password"
              class="sf-sign__input"
              :placeholder="t('auth.register.confirmPlaceholder')"
            />
          </div>
          <p v-if="error" class="sf-sign__error">{{ error }}</p>
          <button type="submit" class="sf-sign__primary" :disabled="loading">
            {{ loading ? t('auth.register.creating') : t('auth.register.submit') }}
          </button>
        </form>

        <div class="sf-sign__divider">
          <span class="sf-sign__divider-line" />
          <span class="sf-sign__divider-text">{{ t('auth.register.divider') }}</span>
          <span class="sf-sign__divider-line" />
        </div>

        <RouterLink to="/login" class="sf-sign__secondary" role="button">
          {{ t('auth.register.signIn') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sf-sign {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  background: #fff;
  color-scheme: light;
  font-family: system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
}
.sf-sign__inner {
  width: 100%;
  max-width: 416px;
}
.sf-sign__hero {
  text-align: center;
  margin: 0 0 24px;
}
.sf-sign__shield {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
  overflow: visible;
  max-width: 100%;
}
.sf-sign__shield-img {
  display: block;
  height: 120px;
  width: auto;
  max-width: min(100%, 256px);
  object-fit: contain;
}
.sf-sign__hero-title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--sf-ui-text);
}
.sf-sign__hero-sub {
  margin: 0;
  font-size: 15px;
  color: #64748b;
  line-height: 1.45;
}
.sf-sign__card {
  padding: 28px 24px 24px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
}
.sf-sign__form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.sf-sign__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sf-sign__label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}
.sf-sign__input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  font-size: 15px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.sf-sign__input::placeholder {
  color: #9ca3af;
}
.sf-sign__input:hover {
  border-color: #9ca3af;
}
.sf-sign__input:focus {
  outline: none;
  border-color: #64748b;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
}
.sf-sign__error {
  margin: 0;
  font-size: 13px;
  color: #b91c1c;
}
.sf-sign__primary {
  width: 100%;
  margin-top: 4px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: #2563eb;
  cursor: pointer;
  transition: background 0.15s ease;
}
.sf-sign__primary:hover:not(:disabled) {
  background: #1d4ed8;
}
.sf-sign__primary:disabled {
  opacity: 0.85;
  cursor: wait;
}
.sf-sign__divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 20px;
}
.sf-sign__divider-line {
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}
.sf-sign__divider-text {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}
.sf-sign__secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  text-decoration: none;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}
.sf-sign__secondary:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
</style>
