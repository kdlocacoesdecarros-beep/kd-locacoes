<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <router-link to="/" class="text-slate-500 text-sm">← Voltar</router-link>
      <h1 class="text-lg font-semibold text-slate-900">Notas Fiscais</h1>
      <button @click="mostrarForm = !mostrarForm" class="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg">
        {{ mostrarForm ? 'Cancelar' : '+ Emitir' }}
      </button>
    </div>

    <form v-if="mostrarForm" @submit.prevent="emitir" class="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
      <select v-model="nova.tomadorTipoDoc" class="w-full border border-slate-300 rounded-lg px-3 py-2">
        <option value="cpf">Pessoa física (CPF)</option>
        <option value="cnpj">Pessoa jurídica (CNPJ)</option>
      </select>
      <input v-model="nova.tomadorDocumento" placeholder="CPF/CNPJ do tomador (só números)" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="nova.tomadorNome" placeholder="Nome do tomador" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="nova.tomadorEmail" placeholder="E-mail (opcional)" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model.number="nova.valor" type="number" step="0.01" placeholder="Valor do serviço (R$)" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <textarea v-model="nova.descricao" placeholder="Descrição do serviço" required class="w-full border border-slate-300 rounded-lg px-3 py-2"></textarea>
      <details class="text-sm text-slate-500">
        <summary class="cursor-pointer select-none">Endereço do tomador (opcional)</summary>
        <div class="mt-2 space-y-2">
          <input v-model="nova.tomadorLogradouro" placeholder="Logradouro" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
          <input v-model="nova.tomadorNumero" placeholder="Número" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
          <input v-model="nova.tomadorBairro" placeholder="Bairro" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
          <input v-model="nova.tomadorCep" placeholder="CEP" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
        </div>
      </details>
      <p v-if="erro" class="text-red-600 text-sm">{{ erro }}</p>
      <button type="submit" :disabled="emitindo" class="bg-slate-900 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm">
        {{ emitindo ? 'Emitindo...' : 'Emitir nota' }}
      </button>
    </form>

    <div class="flex gap-2 mb-4">
      <input v-model="periodo.dataInicio" type="date" class="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1" />
      <input v-model="periodo.dataFim" type="date" class="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1" />
      <button @click="carregar" class="text-sm bg-slate-100 px-3 py-2 rounded-lg">Filtrar</button>
    </div>

    <p v-if="carregando" class="text-slate-500 text-sm">Carregando...</p>
    <div v-else class="space-y-2">
      <div v-for="n in notas" :key="n.chave_acesso || n.numero" class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="flex items-center justify-between mb-1">
          <p class="font-medium text-slate-900">{{ n.tomador_nome || n.tomador || '—' }}</p>
          <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{{ n.status || 'emitida' }}</span>
        </div>
        <p class="text-sm text-slate-500">R$ {{ Number(n.valor_servico || n.valor || 0).toFixed(2) }} · {{ n.data_emissao || n.competencia || '' }}</p>
      </div>
      <p v-if="!notas.length" class="text-slate-400 text-sm text-center py-8">Nenhuma nota no período.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { api } from '@/api'

const notas = ref([])
const carregando = ref(true)
const mostrarForm = ref(false)
const emitindo = ref(false)
const erro = ref('')

function primeiroDiaMes() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}
function hoje() {
  const d = new Date()
  return d.toISOString().substring(0, 10)
}

const periodo = reactive({ dataInicio: primeiroDiaMes(), dataFim: hoje() })
const nova = reactive({
  tomadorTipoDoc: 'cpf', tomadorDocumento: '', tomadorNome: '', tomadorEmail: '',
  valor: null, descricao: '', tomadorLogradouro: '', tomadorNumero: '', tomadorBairro: '', tomadorCep: ''
})

async function carregar() {
  carregando.value = true
  try {
    const res = await api.get('nfse/listar', { dataInicio: periodo.dataInicio, dataFim: periodo.dataFim })
    notas.value = res.notas || res.resultado?.notas || []
  } catch (e) {
    erro.value = e.message
  } finally {
    carregando.value = false
  }
}

async function emitir() {
  erro.value = ''
  emitindo.value = true
  try {
    await api.post('nfse/emitir', { ...nova, valor: String(nova.valor) })
    Object.assign(nova, { tomadorTipoDoc: 'cpf', tomadorDocumento: '', tomadorNome: '', tomadorEmail: '', valor: null, descricao: '', tomadorLogradouro: '', tomadorNumero: '', tomadorBairro: '', tomadorCep: '' })
    mostrarForm.value = false
    await carregar()
  } catch (e) {
    erro.value = e.message
  } finally {
    emitindo.value = false
  }
}

onMounted(carregar)
</script>
