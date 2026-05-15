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

const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const busy = ref(false)

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

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
  const n = name.value.trim()
  const e = email.value.trim()
  if (!n) {
    toast.add({ severity: 'warn', detail: t('auth.register.errorName'), life: 4000 })
    return
  }
  if (!isValidEmail(e)) {
    toast.add({ severity: 'warn', detail: t('auth.register.errorEmail'), life: 4000 })
    return
  }
  if (password.value.length < 6) {
    toast.add({ severity: 'warn', detail: t('auth.register.errorPasswordLen'), life: 4000 })
    return
  }
  if (password.value !== confirm.value) {
    toast.add({ severity: 'warn', detail: t('auth.register.errorPasswordMatch'), life: 4000 })
    return
  }
  busy.value = true
  window.setTimeout(() => {
    setSessionAuthed(true, { persist: false })
    busy.value = false
    goAfterAuth()
  }, 420)
}
</script>

<template>
  <AuthLayout>
    <template #hero-lead>
      <h1>{{ t('auth.register.heroTitle') }}</h1>
      <p>{{ t('auth.register.heroSubtitle') }}</p>
    </template>

    <form class="sf-auth-form" @submit.prevent="onSubmit">
      <pv-float-label>
        <pv-input-text id="reg-name" v-model="name" class="sf-auth-form__input" autocomplete="name" />
        <label for="reg-name">{{ t('auth.register.name') }}</label>
      </pv-float-label>

      <pv-float-label>
        <pv-input-text id="reg-email" v-model="email" class="sf-auth-form__input" autocomplete="email" />
        <label for="reg-email">{{ t('auth.register.email') }}</label>
      </pv-float-label>

      <pv-float-label>
        <pv-input-text
          id="reg-password"
          v-model="password"
          class="sf-auth-form__input"
          type="password"
          autocomplete="new-password"
        />
        <label for="reg-password">{{ t('auth.register.password') }}</label>
      </pv-float-label>

      <pv-float-label>
        <pv-input-text
          id="reg-confirm"
          v-model="confirm"
          class="sf-auth-form__input"
          type="password"
          autocomplete="new-password"
        />
        <label for="reg-confirm">{{ t('auth.register.confirm') }}</label>
      </pv-float-label>

      <pv-button
        type="submit"
        class="sf-auth-form__submit"
        :label="busy ? t('auth.register.creating') : t('auth.register.submit')"
        :loading="busy"
        :disabled="busy"
      />

      <p class="sf-auth-form__divider">
        {{ t('auth.register.divider') }}
      </p>
      <router-link class="sf-auth-form__ghost" :to="{ name: 'login' }">
        {{ t('auth.register.signIn') }}
      </router-link>
    </form>
  </AuthLayout>
</template>

<style scoped>
.sf-auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.sf-auth-form__input {
  width: 100%;
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
