<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <router-link to="/" class="text-slate-500 text-sm">← Voltar</router-link>
      <h1 class="text-lg font-semibold text-slate-900">Requisições</h1>
      <button @click="mostrarForm = !mostrarForm" class="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg">
        {{ mostrarForm ? 'Cancelar' : '+ Nova' }}
      </button>
    </div>

    <form v-if="mostrarForm" @submit.prevent="criar" class="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
      <input v-model="novo.placa" placeholder="Placa" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="novo.tipo" placeholder="Tipo de serviço" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <textarea v-model="novo.descricao" placeholder="Descrição" required class="w-full border border-slate-300 rounded-lg px-3 py-2"></textarea>
      <input v-model.number="novo.valorEstimado" type="number" placeholder="Valor estimado (R$)" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <p v-if="erro" class="text-red-600 text-sm">{{ erro }}</p>
      <button type="submit" class="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm">Abrir requisição</button>
    </form>

    <p v-if="carregando" class="text-slate-500 text-sm">Carregando...</p>
    <div v-else class="space-y-2">
      <div v-for="r in requisicoes" :key="r.id" class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="flex items-center justify-between mb-1">
          <p class="font-medium text-slate-900">{{ r.id }} · {{ r.placa }}</p>
          <span class="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{{ r.dias_aberta }}d aberta</span>
        </div>
        <p class="text-sm text-slate-500 mb-3">{{ r.tipo }} — {{ r.descricao }}</p>
        <button @click="fecharForm = fecharForm === r.id ? null : r.id" class="text-sm text-slate-900 underline">
          Fechar requisição
        </button>
        <form v-if="fecharForm === r.id" @submit.prevent="fechar(r.id)" class="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <input v-model.number="fecho.km" type="number" placeholder="KM atual" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
          <input v-model.number="fecho.valorFinal" type="number" placeholder="Valor final (R$)" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
          <input v-model="fecho.oficina" placeholder="Oficina" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
          <button type="submit" class="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm">Confirmar fechamento</button>
        </form>
      </div>
      <p v-if="!requisicoes.length" class="text-slate-400 text-sm text-center py-8">Nenhuma requisição aberta.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { api } from '@/api'

const requisicoes = ref([])
const carregando = ref(true)
const mostrarForm = ref(false)
const fecharForm = ref(null)
const erro = ref('')
const novo = reactive({ placa: '', tipo: '', descricao: '', valorEstimado: null })
const fecho = reactive({ km: null, valorFinal: null, oficina: '' })

async function carregar() {
  carregando.value = true
  try {
    const res = await api.get('requisicoes/abertas')
    requisicoes.value = res.rows || res.requisicoes || []
  } finally {
    carregando.value = false
  }
}

async function criar() {
  erro.value = ''
  try {
    await api.post('requisicoes/criar', { ...novo })
    Object.assign(novo, { placa: '', tipo: '', descricao: '', valorEstimado: null })
    mostrarForm.value = false
    await carregar()
  } catch (e) {
    erro.value = e.message
  }
}

async function fechar(id) {
  try {
    await api.post('requisicoes/fechar', { id, ...fecho })
    fecharForm.value = null
    Object.assign(fecho, { km: null, valorFinal: null, oficina: '' })
    await carregar()
  } catch (e) {
    erro.value = e.message
  }
}

onMounted(carregar)
</script>
