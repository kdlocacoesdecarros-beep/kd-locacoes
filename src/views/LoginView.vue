<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-8" style="background:#f3f4f6">
    <div class="login-logo">
      <img src="https://i.ibb.co/7NjkRj8r/Logo-kd.png" alt="KD Locações" />
    </div>
    <div class="login-nome">KD Locações</div>
    <div class="login-sub">Área administrativa</div>

    <form @submit.prevent="entrar" class="w-full max-w-sm">
      <div v-if="erro" class="alert-erro">⚠️ {{ erro }}</div>

      <div class="fi-wrap">
        <div class="fi-label">E-mail</div>
        <input v-model="email" type="email" required autocomplete="username" class="fi-input" placeholder="voce@kdlocacoes.com.br" />
      </div>

      <div class="fi-wrap">
        <div class="fi-label">Senha</div>
        <input v-model="senha" type="password" required autocomplete="current-password" class="fi-input" placeholder="••••••" />
      </div>

      <button type="submit" :disabled="carregando" class="btn-primary">
        <span v-if="!carregando">Entrar</span>
        <div v-else class="spin"></div>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const senha = ref('')
const erro = ref('')
const carregando = ref(false)
const auth = useAuthStore()
const router = useRouter()

async function entrar() {
  erro.value = ''
  carregando.value = true
  try {
    await auth.login(email.value, senha.value)
    router.push({ name: 'home' })
  } catch (e) {
    erro.value = e.message
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
@keyframes popIn { from { opacity:0; transform:scale(.92) } to { opacity:1; transform:scale(1) } }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
@keyframes spin { to { transform: rotate(360deg) } }

.login-logo {
  width: 88px; height: 88px; border-radius: 50%;
  background: #ffffff; border: 0.5px solid #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 18px; padding: 14px;
  animation: popIn .5s cubic-bezier(.32,.72,0,1);
}
.login-logo img { width: 100%; height: 100%; object-fit: contain; }

.login-nome {
  font-size: 21px; font-weight: 600; color: #1e293b;
  margin-bottom: 4px; text-align: center;
  animation: fadeUp .5s .1s backwards;
}
.login-sub {
  font-size: 13px; color: #64748b;
  margin-bottom: 36px; text-align: center;
  animation: fadeUp .5s .15s backwards;
}

.fi-wrap { margin-bottom: 16px; animation: fadeUp .5s .2s backwards; }
.fi-label { font-size: 12px; font-weight: 600; color: #64748b; margin-bottom: 6px; }
.fi-input {
  width: 100%; padding: 12px 14px; border-radius: 12px;
  border: 1px solid #e2e8f0; background: #ffffff; font-size: 15px;
  color: #1e293b; outline: none; transition: border-color .15s, box-shadow .15s;
}
.fi-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }

.btn-primary {
  width: 100%; margin-top: 4px; padding: 13px;
  background: #6366f1; color: #fff; font-weight: 600; font-size: 15px;
  border-radius: 12px; border: none; cursor: pointer;
  box-shadow: 0 6px 16px rgba(99,102,241,.25);
  transition: background .15s;
  display: flex; align-items: center; justify-content: center;
  animation: fadeUp .5s .25s backwards;
}
.btn-primary:hover:not(:disabled) { background: #4f46e5; }
.btn-primary:disabled { opacity: .7; cursor: default; }

.spin {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
  animation: spin .7s linear infinite;
}

.alert-erro {
  background: #fee2e2; color: #dc2626; font-size: 13px;
  padding: 10px 14px; border-radius: 10px; margin-bottom: 16px;
}
</style>
