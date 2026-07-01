<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/iam/presentation/components/auth-layout.vue'
import { AuthApi } from '@/iam/infrastructure/auth-api.js'
import { setAuthSession } from '@/shared/config/session-auth.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const remember = ref(false)
const busy = ref(false)
const errorMessage = ref('')

function goAfterAuth() {
  const raw = route.query.next
  const next = Array.isArray(raw) ? raw[0] : raw
  if (typeof next === 'string' && next.startsWith('/')) {
    router.replace(next)
    return
  }
  router.replace({ name: 'analytics-root' })
}

async function onSubmit() {
  if (busy.value) return
  const username = email.value.trim()
  if (!username || !password.value) {
    errorMessage.value = t('auth.login.errorRequired')
    return
  }

  busy.value = true
  errorMessage.value = ''
  try {
    const api = new AuthApi()
    const data = await api.signIn(username, password.value)
    setAuthSession(
      { token: data.token, id: data.id, username: data.username },
      { persist: remember.value },
    )
    goAfterAuth()
  } catch {
    errorMessage.value = t('auth.login.errorInvalid')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="sf-auth-card__title">{{ t('auth.login.heroTitle') }}</h1>

    <p v-if="errorMessage" class="sf-auth-error" role="alert">{{ errorMessage }}</p>

    <form class="sf-auth-form" @submit.prevent="onSubmit">
      <div class="sf-auth-field">
        <label class="sf-auth-field__label" for="login-email">{{ t('auth.login.email') }}</label>
        <pv-input-text
          id="login-email"
          v-model="email"
          class="sf-auth-field__input"
          autocomplete="email"
        />
      </div>

      <div class="sf-auth-field">
        <label class="sf-auth-field__label" for="login-password">{{ t('auth.login.password') }}</label>
        <pv-input-text
          id="login-password"
          v-model="password"
          class="sf-auth-field__input"
          type="password"
          autocomplete="current-password"
        />
      </div>

      <div class="sf-auth-form__row">
        <label class="sf-auth-form__remember">
          <pv-checkbox v-model="remember" binary />
          <span>{{ t('auth.login.remember') }}</span>
        </label>
        <button type="button" class="sf-auth-form__link" @click.prevent>
          {{ t('auth.login.forgot') }}
        </button>
      </div>

      <pv-button
        type="button"
        class="sf-auth-form__submit"
        :label="busy ? t('auth.login.signingIn') : t('auth.login.signIn')"
        :loading="busy"
        :disabled="busy"
        @click="onSubmit"
      />

      <div class="sf-auth-form__divider-wrap">
        <span class="sf-auth-form__divider-line" aria-hidden="true" />
        <span class="sf-auth-form__divider-text">{{ t('auth.login.divider') }}</span>
        <span class="sf-auth-form__divider-line" aria-hidden="true" />
      </div>
      <router-link class="sf-auth-form__ghost" :to="{ name: 'register' }">
        {{ t('auth.login.createAccount') }}
      </router-link>
    </form>
  </AuthLayout>
</template>

<style scoped>
.sf-auth-error {
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 14px;
  text-align: center;
}

.sf-auth-card__title {
  margin: 0 0 28px;
  text-align: center;
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.sf-auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.sf-auth-field__label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.sf-auth-field__input {
  width: 100%;
}

.sf-auth-field__input :deep(.p-inputtext) {
  padding: 10px 12px;
  font-size: 15px;
}

.sf-auth-form__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.sf-auth-form__remember {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  user-select: none;
}

.sf-auth-form__link {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
  text-decoration: none;
}

.sf-auth-form__link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sf-auth-form__submit {
  width: 100%;
  margin-top: 6px;
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
