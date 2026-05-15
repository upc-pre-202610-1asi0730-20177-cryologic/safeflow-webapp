<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import AuthLayout from '@/iam/presentation/components/auth-layout.vue'
import { setSessionAuthed } from '@/shared/config/session-auth.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const email = ref('')
const password = ref('')
const remember = ref(false)
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
  const e = email.value.trim()
  if (!e || !password.value) {
    toast.add({
      severity: 'warn',
      summary: t('auth.login.heroTitle'),
      detail: t('auth.login.errorRequired'),
      life: 4000,
    })
    return
  }
  busy.value = true
  /** Demo: sin backend; credenciales reales cuando conectes API. */
  window.setTimeout(() => {
    setSessionAuthed(true, { persist: remember.value })
    busy.value = false
    goAfterAuth()
  }, 380)
}
</script>

<template>
  <AuthLayout>
    <template #hero-lead>
      <h1>{{ t('auth.login.heroTitle') }}</h1>
      <p>{{ t('auth.login.heroSubtitle') }}</p>
    </template>

    <form class="sf-auth-form" @submit.prevent="onSubmit">
      <pv-float-label>
        <pv-input-text id="login-email" v-model="email" class="sf-auth-form__input" autocomplete="email" />
        <label for="login-email">{{ t('auth.login.email') }}</label>
      </pv-float-label>

      <pv-float-label>
        <pv-input-text
          id="login-password"
          v-model="password"
          class="sf-auth-form__input"
          type="password"
          autocomplete="current-password"
        />
        <label for="login-password">{{ t('auth.login.password') }}</label>
      </pv-float-label>

      <div class="sf-auth-form__row">
        <label class="sf-auth-form__remember">
          <pv-checkbox v-model="remember" binary />
          <span>{{ t('auth.login.remember') }}</span>
        </label>
        <button type="button" class="sf-auth-form__link sf-auth-form__link--muted" @click.prevent>
          {{ t('auth.login.forgot') }}
        </button>
      </div>

      <pv-button
        type="submit"
        class="sf-auth-form__submit"
        :label="busy ? t('auth.login.signingIn') : t('auth.login.signIn')"
        :loading="busy"
        :disabled="busy"
      />

      <p class="sf-auth-form__divider">
        {{ t('auth.login.divider') }}
      </p>
      <router-link class="sf-auth-form__ghost" :to="{ name: 'register' }">
        {{ t('auth.login.createAccount') }}
      </router-link>
    </form>
  </AuthLayout>
</template>

<style scoped>
.sf-auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.sf-auth-form__input {
  width: 100%;
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
  text-decoration: underline;
  text-underline-offset: 3px;
}

.sf-auth-form__link--muted {
  color: #64748b;
  text-decoration: none;
}

.sf-auth-form__link--muted:hover {
  color: #2563eb;
  text-decoration: underline;
}

.sf-auth-form__submit {
  width: 100%;
  margin-top: 4px;
}

.sf-auth-form__divider {
  margin: 8px 0 0;
  text-align: center;
  font-size: 14px;
  color: #64748b;
}

.sf-auth-form__ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1e293b;
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
