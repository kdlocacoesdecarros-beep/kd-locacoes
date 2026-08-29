<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-semibold text-slate-900 mb-6">Central da Frota</h1>
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
const menu = [
  { to: '/veiculos', icone: '🚗', label: 'Veículos' },
  { to: '/manutencao', icone: '🔧', label: 'Manutenções' },
  { to: '/requisicoes', icone: '📋', label: 'Requisições' },
  { to: '/contas', icone: '💰', label: 'Contas do mês' },
  { to: '/nfse', icone: '🧾', label: 'NFS-e' },
  { to: '/vistoria', icone: '📝', label: 'Vistoria' }
]
</script>
