<script setup>
import LanguageSwitcher from '@/shared/presentation/components/language-switcher.vue'
import { BRAND_MARK_SRC } from '@/shared/config/branding.js'
import heroImg from '@/assets/hero.png'
</script>

<template>
  <div class="sf-auth">
    <pv-toast position="top-right" />
    <section class="sf-auth__hero" aria-hidden="false">
      <div class="sf-auth__hero-inner">
        <img class="sf-auth__logo" :src="BRAND_MARK_SRC" alt="SafeFlow" width="180" height="48" />
        <div class="sf-auth__hero-text">
          <slot name="hero-lead" />
        </div>
        <div class="sf-auth__hero-art">
          <img class="sf-auth__hero-img" :src="heroImg" alt="" />
        </div>
      </div>
    </section>
    <section class="sf-auth__panel">
      <header class="sf-auth__toolbar">
        <LanguageSwitcher />
      </header>
      <div class="sf-auth__card">
        <slot />
      </div>
    </section>
  </div>
</template>

<style scoped>
.sf-auth {
  display: grid;
  min-height: 100vh;
  font-family: 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
  background: #f8fafc;
}

@media (min-width: 900px) {
  .sf-auth {
    grid-template-columns: minmax(320px, 1fr) minmax(400px, 1fr);
  }
}

.sf-auth__hero {
  position: relative;
  padding: clamp(24px, 4vw, 48px);
  background: linear-gradient(145deg, #1e3a8a 0%, #2563eb 42%, #0369a1 100%);
  color: #f8fafc;
  display: flex;
  align-items: stretch;
  overflow: hidden;
}

.sf-auth__hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 20% 90%, rgba(56, 189, 248, 0.35), transparent 55%);
  pointer-events: none;
}

.sf-auth__hero-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 3vw, 28px);
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  justify-content: center;
}

.sf-auth__logo {
  width: auto;
  max-width: 200px;
  height: auto;
  filter: drop-shadow(0 2px 12px rgba(15, 23, 42, 0.35));
}

.sf-auth__hero-text :deep(h1) {
  margin: 0 0 12px;
  font-size: clamp(26px, 3.2vw, 36px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: #fff;
}

.sf-auth__hero-text :deep(p) {
  margin: 0;
  font-size: clamp(15px, 1.4vw, 17px);
  line-height: 1.5;
  color: rgba(241, 245, 249, 0.92);
  max-width: 36ch;
}

.sf-auth__hero-art {
  margin-top: auto;
  padding-top: 24px;
  display: flex;
  justify-content: center;
}

.sf-auth__hero-img {
  width: min(100%, 400px);
  height: auto;
  object-fit: contain;
  opacity: 0.92;
  filter: drop-shadow(0 24px 40px rgba(15, 23, 42, 0.35));
}

.sf-auth__panel {
  display: flex;
  flex-direction: column;
  padding: clamp(20px, 3vw, 36px);
  background: #f8fafc;
}

.sf-auth__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: clamp(16px, 2vw, 24px);
}

.sf-auth__card {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 420px;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 899px) {
  .sf-auth {
    grid-template-columns: 1fr;
  }

  .sf-auth__hero {
    min-height: auto;
    padding: 32px 24px 24px;
  }

  .sf-auth__hero-art {
    display: none;
  }

  .sf-auth__panel {
    padding-top: 0;
  }
}
</style>
