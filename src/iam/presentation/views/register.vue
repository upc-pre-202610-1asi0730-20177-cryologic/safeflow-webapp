<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/iam/presentation/components/auth-layout.vue'
import { setSessionAuthed } from '@/shared/config/session-auth.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const busy = ref(false)

function goAfterAuth() {
  const raw = route.query.next
  const next = Array.isArray(raw) ? raw[0] : raw
  if (typeof next === 'string' && next.startsWith('/')) {
    router.replace(next)
    return
  }
  router.replace({ name: 'analytics-root' })
}

function onSubmit() {
  if (busy.value) return
  /** Demo: registro sin API; mismo comportamiento que login (solo botón). */
  busy.value = true
  window.setTimeout(() => {
    setSessionAuthed(true, { persist: false })
    busy.value = false
    goAfterAuth()
  }, 220)
}
</script>

<template>
  <AuthLayout>
    <h1 class="sf-auth-card__title">{{ t('auth.register.heroTitle') }}</h1>

    <form class="sf-auth-form" @submit.prevent="onSubmit">
      <div class="sf-auth-field">
        <label class="sf-auth-field__label" for="reg-name">{{ t('auth.register.name') }}</label>
        <pv-input-text
          id="reg-name"
          v-model="name"
          class="sf-auth-field__input"
          autocomplete="name"
        />
      </div>

      <div class="sf-auth-field">
        <label class="sf-auth-field__label" for="reg-email">{{ t('auth.register.email') }}</label>
        <pv-input-text
          id="reg-email"
          v-model="email"
          class="sf-auth-field__input"
          autocomplete="email"
        />
      </div>

      <div class="sf-auth-field">
        <label class="sf-auth-field__label" for="reg-password">{{ t('auth.register.password') }}</label>
        <pv-input-text
          id="reg-password"
          v-model="password"
          class="sf-auth-field__input"
          type="password"
          autocomplete="new-password"
        />
      </div>

      <div class="sf-auth-field">
        <label class="sf-auth-field__label" for="reg-confirm">{{ t('auth.register.confirm') }}</label>
        <pv-input-text
          id="reg-confirm"
          v-model="confirm"
          class="sf-auth-field__input"
          type="password"
          autocomplete="new-password"
        />
      </div>

      <pv-button
        type="button"
        class="sf-auth-form__submit"
        :label="busy ? t('auth.register.creating') : t('auth.register.submit')"
        :loading="busy"
        :disabled="busy"
        @click="onSubmit"
      />

      <div class="sf-auth-form__divider-wrap">
        <span class="sf-auth-form__divider-line" aria-hidden="true" />
        <span class="sf-auth-form__divider-text">{{ t('auth.register.divider') }}</span>
        <span class="sf-auth-form__divider-line" aria-hidden="true" />
      </div>
      <router-link class="sf-auth-form__ghost" :to="{ name: 'login' }">
        {{ t('auth.register.signIn') }}
      </router-link>
    </form>
  </AuthLayout>
</template>

<style scoped>
.sf-auth-card__title {
  margin: 0 0 26px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.35;
  color: #1e3a8a;
}

.sf-auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sf-auth-field__label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1e3a8a;
}

.sf-auth-field__input {
  width: 100%;
}

.sf-auth-field__input :deep(.p-inputtext) {
  padding: 10px 12px;
  font-size: 15px;
}

.sf-auth-form__submit {
  width: 100%;
  margin-top: 8px;
}

.sf-auth-form__divider-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 8px;
}

.sf-auth-form__divider-line {
  flex: 1;
  height: 1px;
  background: #e2e8f0;
}

.sf-auth-form__divider-text {
  font-size: 14px;
  color: #64748b;
  white-space: nowrap;
}

.sf-auth-form__ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #1e3a8a;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.sf-auth-form__ghost:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}
</style>
