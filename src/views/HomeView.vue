<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-semibold text-slate-900">Central da Frota</h1>
      <router-link to="/minha-conta" class="text-sm text-slate-500 hover:text-slate-900">⚙️ Minha conta</router-link>
    </div>

    <div v-if="resumo" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      <div class="bg-white border border-slate-200 rounded-xl p-3 text-center">
        <p class="text-2xl font-semibold text-slate-900">{{ resumo.totalVeiculos }}</p>
        <p class="text-xs text-slate-500">Veículos ativos</p>
      </div>
      <router-link to="/requisicoes" class="bg-white border rounded-xl p-3 text-center" :class="resumo.requisicoesAlerta > 0 ? 'border-red-300 bg-red-50/50' : 'border-slate-200'">
        <p class="text-2xl font-semibold" :class="resumo.requisicoesAlerta > 0 ? 'text-red-600' : 'text-slate-900'">{{ resumo.requisicoesAbertas }}</p>
        <p class="text-xs" :class="resumo.requisicoesAlerta > 0 ? 'text-red-500' : 'text-slate-500'">
          Requisições abertas{{ resumo.requisicoesAlerta > 0 ? ` (${resumo.requisicoesAlerta} paradas 2+ dias)` : '' }}
        </p>
      </router-link>
      <router-link to="/contas" class="bg-white border border-slate-200 rounded-xl p-3 text-center">
        <p class="text-2xl font-semibold text-slate-900">R$ {{ Number(resumo.contasAbertoMes).toFixed(0) }}</p>
        <p class="text-xs text-slate-500">Em aberto no mês</p>
      </router-link>
      <router-link to="/vistoria" class="bg-white border rounded-xl p-3 text-center" :class="resumo.vistoriasPendentes > 0 ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'">
        <p class="text-2xl font-semibold" :class="resumo.vistoriasPendentes > 0 ? 'text-amber-600' : 'text-slate-900'">{{ resumo.vistoriasPendentes }}</p>
        <p class="text-xs" :class="resumo.vistoriasPendentes > 0 ? 'text-amber-600' : 'text-slate-500'">Vistorias pendentes</p>
      </router-link>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <router-link v-for="item in menu" :key="item.to" :to="item.to"
        class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition">
        <span class="text-3xl">{{ item.icone }}</span>
        <span class="font-medium text-slate-800 text-sm text-center">{{ item.label }}</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/api'

const resumo = ref(null)

const menu = [
  { to: '/veiculos', icone: '🚗', label: 'Veículos' },
  { to: '/motoristas', icone: '🧑‍✈️', label: 'Motoristas' },
  { to: '/manutencao', icone: '🔧', label: 'Manutenções' },
  { to: '/requisicoes', icone: '📋', label: 'Requisições' },
  { to: '/contas', icone: '💰', label: 'Contas do mês' },
  { to: '/nfse', icone: '🧾', label: 'NFS-e' },
  { to: '/vistoria', icone: '📝', label: 'Vistoria' },
  { to: '/rastreador', icone: '📍', label: 'Rastreador' },
  { to: '/usuarios', icone: '👥', label: 'Usuários' }
]

onMounted(async () => {
  try {
    resumo.value = await api.get('dashboard/resumo')
  } catch (e) {
    // silencioso — a home nao deve travar se o resumo falhar
  }
})
</script>
