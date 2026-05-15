<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()

const gender = ref(null)
const role = ref(null)
const department = ref(null)

const genderOptions = computed(() => [
  { label: t('shell.profilePage.genderOption.m'), value: 'm' },
  { label: t('shell.profilePage.genderOption.f'), value: 'f' },
  { label: t('shell.profilePage.genderOption.o'), value: 'o' },
])

const roleOptions = computed(() => [
  { label: t('shell.profilePage.roles.admin'), value: 'admin' },
  { label: t('shell.profilePage.roles.operator'), value: 'operator' },
  { label: t('shell.profilePage.roles.viewer'), value: 'viewer' },
])

const departmentOptions = computed(() => [
  { label: t('shell.profilePage.departments.logistics'), value: 'logistics' },
  { label: t('shell.profilePage.departments.qa'), value: 'qa' },
  { label: t('shell.profilePage.departments.ops'), value: 'ops' },
])

const showProfileSummaryCard = false
</script>

<template>
  <div class="sf-profile">
    <section v-if="showProfileSummaryCard" class="sf-profile__card sf-profile__card--summary">
      <h2 class="sf-profile__card-title">{{ t('shell.profilePage.summaryTitle') }}</h2>
      <div class="sf-profile__summary-body">
        <div class="sf-profile__photo-wrap">
          <img
            class="sf-profile__photo"
            src="https://i.pravatar.cc/128?img=12"
            width="128"
            height="128"
            alt=""
          />
        </div>
        <div class="sf-profile__summary-text">
          <p class="sf-profile__name">{{ t('shell.profilePage.demoName') }}</p>
          <p class="sf-profile__meta">{{ t('shell.profilePage.demoId') }}</p>
          <p class="sf-profile__meta">{{ t('shell.profilePage.lastUpdated') }}</p>
        </div>
        <span class="sf-profile__badge">{{ t('shell.profilePage.statusActive') }}</span>
      </div>
    </section>

    <section class="sf-profile__wip" role="status" aria-live="polite">
      <h2 class="sf-profile__wip-title">{{ t('shell.profilePage.underConstructionTitle') }}</h2>
      <p class="sf-profile__wip-text">{{ t('shell.profilePage.underConstructionBody') }}</p>
    </section>

    <div class="sf-profile__grid">
      <section class="sf-profile__card">
        <h2 class="sf-profile__section-heading">{{ t('shell.profilePage.personalTitle') }}</h2>
        <div class="sf-profile__fields">
          <div class="sf-profile__row">
            <label class="sf-profile__label" for="pf-name">{{ t('shell.profilePage.fullName') }}</label>
            <pv-input-text id="pf-name" class="sf-profile__control" fluid />
          </div>
          <div class="sf-profile__row">
            <label class="sf-profile__label" for="pf-email">{{ t('shell.profilePage.email') }}</label>
            <pv-input-text id="pf-email" class="sf-profile__control" fluid type="email" autocomplete="email" />
          </div>
          <div class="sf-profile__row">
            <label class="sf-profile__label" for="pf-phone">{{ t('shell.profilePage.phone') }}</label>
            <pv-input-text id="pf-phone" class="sf-profile__control" fluid type="tel" autocomplete="tel" />
          </div>
          <div class="sf-profile__row">
            <label class="sf-profile__label" for="pf-dob">{{ t('shell.profilePage.birthDate') }}</label>
            <div class="sf-profile__date-wrap">
              <input id="pf-dob" class="sf-profile__date" type="date" />
              <span class="sf-profile__date-icon pi pi-calendar" aria-hidden="true" />
            </div>
          </div>
          <div class="sf-profile__row">
            <label class="sf-profile__label" for="pf-gender">{{ t('shell.profilePage.gender') }}</label>
            <pv-select
              id="pf-gender"
              v-model="gender"
              class="sf-profile__control sf-profile__select"
              fluid
              :options="genderOptions"
              option-label="label"
              option-value="value"
              :placeholder="t('shell.profilePage.genderPlaceholder')"
            />
          </div>
          <div class="sf-profile__row">
            <label class="sf-profile__label" for="pf-address">{{ t('shell.profilePage.address') }}</label>
            <pv-input-text
              id="pf-address"
              class="sf-profile__control"
              fluid
              :placeholder="t('shell.profilePage.addressPlaceholder')"
            />
          </div>
        </div>
      </section>

      <section class="sf-profile__card">
        <h2 class="sf-profile__section-heading">{{ t('shell.profilePage.accountTitle') }}</h2>
        <div class="sf-profile__fields">
          <div class="sf-profile__row">
            <label class="sf-profile__label" for="pf-role">{{ t('shell.profilePage.userRole') }}</label>
            <pv-select
              id="pf-role"
              v-model="role"
              class="sf-profile__control sf-profile__select"
              fluid
              :options="roleOptions"
              option-label="label"
              option-value="value"
              :placeholder="t('shell.profilePage.selectPlaceholder')"
            />
          </div>
          <div class="sf-profile__row">
            <label class="sf-profile__label" for="pf-dept">{{ t('shell.profilePage.department') }}</label>
            <pv-select
              id="pf-dept"
              v-model="department"
              class="sf-profile__control sf-profile__select"
              fluid
              :options="departmentOptions"
              option-label="label"
              option-value="value"
              :placeholder="t('shell.profilePage.selectPlaceholder')"
            />
          </div>
          <div class="sf-profile__row sf-profile__row--password">
            <label class="sf-profile__label" for="pf-pass">{{ t('shell.profilePage.password') }}</label>
            <div class="sf-profile__password-row">
              <pv-input-text
                id="pf-pass"
                class="sf-profile__control"
                fluid
                type="password"
                autocomplete="off"
                placeholder="••••••••"
              />
              <pv-button
                type="button"
                class="sf-profile__outline-btn"
                outlined
                :label="t('shell.profilePage.changePassword')"
              />
            </div>
          </div>
          <div class="sf-profile__row">
            <label class="sf-profile__label" for="pf-upload-photo">{{ t('shell.profilePage.profilePhoto') }}</label>
            <pv-button
              id="pf-upload-photo"
              type="button"
              class="sf-profile__outline-btn sf-profile__upload-btn"
              outlined
              fluid
              :label="t('shell.profilePage.uploadPhoto')"
            />
          </div>
        </div>
      </section>
    </div>

    <div class="sf-profile__footer-actions">
      <pv-button
        type="button"
        class="sf-profile__btn-cancel"
        outlined
        severity="secondary"
        :label="t('shell.profilePage.cancel')"
        @click="router.back()"
      />
      <pv-button type="button" class="sf-profile__btn-save" :label="t('shell.profilePage.save')" disabled />
    </div>
  </div>
</template>

<style scoped>
.sf-profile {
  --pf-page-bg: #f0f2f5;
  --pf-card-bg: #ffffff;
  --pf-input-bg: #f5f7fa;
  --pf-input-border: #dce1e6;
  --pf-primary: #2563eb;
  --pf-primary-hover: #1d4ed8;
  margin: -24px;
  padding: 24px;
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
  background: var(--pf-page-bg);
  max-width: none;
}

.sf-profile__card {
  background: var(--pf-card-bg);
  border-radius: 10px;
  padding: 24px 28px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  border: 1px solid #e8eaed;
}

.sf-profile__grid > .sf-profile__card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.sf-profile__card--summary {
  margin-bottom: 20px;
}

.sf-profile__wip {
  margin-bottom: 20px;
  padding: 22px 28px;
  border-radius: 10px;
  border: 1px solid #bfdbfe;
  background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.sf-profile__wip-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #1e3a8a;
  line-height: 1.35;
}

.sf-profile__wip-text {
  margin: 14px 0 0;
  max-width: 1152px;
  font-size: 15px;
  line-height: 1.65;
  color: #334155;
}

.sf-profile__card-title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 700;
  color: var(--sf-ui-text);
}

.sf-profile__summary-body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px 24px;
}

.sf-profile__photo-wrap {
  flex-shrink: 0;
}

.sf-profile__photo {
  display: block;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e8eaed;
}

.sf-profile__summary-text {
  flex: 1;
  min-width: 192px;
}

.sf-profile__name {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--sf-ui-text);
  line-height: 1.25;
}

.sf-profile__meta {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}

.sf-profile__meta + .sf-profile__meta {
  margin-top: 2px;
}

.sf-profile__badge {
  margin-left: auto;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  background: #dcfce7;
  color: #166534;
}

.sf-profile__grid {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
  margin-bottom: 28px;
}

@media (min-width: 960px) {
  .sf-profile__grid {
    grid-template-columns: 1fr 1fr;
    align-items: stretch;
  }
}

.sf-profile__section-heading {
  margin: 0 0 20px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sf-ui-text);
}

.sf-profile__fields {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 18px;
}

.sf-profile__row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}

.sf-profile__row--password .sf-profile__password-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.sf-profile__row--password .sf-profile__control {
  flex: 1 1 160px;
  min-width: 0;
}

.sf-profile__label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  line-height: 1.3;
}

.sf-profile__date-wrap {
  position: relative;
}

.sf-profile__date {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 36px 8px 12px;
  border: 1px solid var(--pf-input-border);
  border-radius: 6px;
  background: var(--pf-input-bg);
  font-size: 14px;
  color: var(--sf-ui-text);
  font-family: inherit;
}

.sf-profile__date:focus {
  outline: none;
  border-color: var(--pf-primary);
  box-shadow: 0 0 0 1px rgba(51, 122, 183, 0.25);
}

.sf-profile__date-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #94a3b8;
  pointer-events: none;
}

.sf-profile__footer-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}

.sf-profile :deep(.p-inputtext) {
  background: var(--pf-input-bg) !important;
  border: 1px solid var(--pf-input-border) !important;
  border-radius: 6px !important;
  font-size: 14px !important;
  padding: 8px 12px !important;
}

.sf-profile :deep(.p-inputtext:enabled:focus) {
  border-color: #64748b !important;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1) !important;
}

.sf-profile :deep(.p-select) {
  background: var(--pf-input-bg) !important;
  border: 1px solid var(--pf-input-border) !important;
  border-radius: 6px !important;
}

.sf-profile :deep(.p-select:not(.p-disabled):hover) {
  border-color: #c5cdd6 !important;
}

.sf-profile :deep(.p-select:not(.p-disabled).p-focus) {
  border-color: #64748b !important;
  box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1) !important;
}

.sf-profile__outline-btn {
  flex-shrink: 0;
  border-color: var(--pf-primary) !important;
  color: var(--pf-primary) !important;
}

.sf-profile__outline-btn:hover {
  background: rgba(37, 99, 235, 0.06) !important;
}

.sf-profile__upload-btn:deep(.p-button) {
  width: 100%;
  justify-content: center;
}

.sf-profile__btn-save:deep(.p-button) {
  background: var(--pf-primary) !important;
  border-color: var(--pf-primary) !important;
  color: #fff !important;
  min-width: 136px;
  padding-left: 20px !important;
  padding-right: 20px !important;
  border-radius: 6px !important;
  font-weight: 600 !important;
}

.sf-profile__btn-save:deep(.p-button:not(:disabled):hover) {
  background: var(--pf-primary-hover) !important;
  border-color: var(--pf-primary-hover) !important;
}

.sf-profile__btn-save:deep(.p-button:disabled) {
  opacity: 0.55;
}

.sf-profile__btn-cancel:deep(.p-button) {
  min-width: 136px;
  border-radius: 6px !important;
  font-weight: 600 !important;
}
</style>
