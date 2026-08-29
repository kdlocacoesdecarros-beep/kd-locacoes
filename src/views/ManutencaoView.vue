<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <router-link to="/" class="text-slate-500 text-sm">← Voltar</router-link>
      <h1 class="text-lg font-semibold text-slate-900">Manutenções</h1>
      <button @click="mostrarForm = !mostrarForm" class="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg">
        {{ mostrarForm ? 'Cancelar' : '+ Registrar' }}
      </button>
    </div>

    <form v-if="mostrarForm" @submit.prevent="registrar" class="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
      <select v-model="novo.placa" required class="w-full border border-slate-300 rounded-lg px-3 py-2">
        <option value="" disabled>Selecione a placa</option>
        <option v-for="v in veiculos" :key="v.id" :value="v.placa">{{ v.placa }} — {{ v.modelo || 'sem modelo' }}</option>
      </select>
      <select v-model="novo.tipo" class="w-full border border-slate-300 rounded-lg px-3 py-2">
        <option value="Óleo">Óleo</option>
        <option value="Pneu">Pneu</option>
        <option value="Freio">Freio</option>
        <option value="Revisão">Revisão</option>
        <option value="Outro">Outro</option>
      </select>
      <input v-model="novo.data" type="date" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model.number="novo.kmRegistro" type="number" placeholder="KM no registro" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model.number="novo.valor" type="number" placeholder="Valor (R$)" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <select v-model="novo.fornecedor" class="w-full border border-slate-300 rounded-lg px-3 py-2">
        <option value="">Fornecedor / Oficina (opcional)</option>
        <option v-for="o in oficinas" :key="o.id" :value="o.nome">{{ o.nome }}</option>
      </select>
      <button type="button" @click="mostrarNovaOficina = !mostrarNovaOficina" class="text-xs text-indigo-600 underline">
        {{ mostrarNovaOficina ? 'Cancelar' : '+ Cadastrar nova oficina' }}
      </button>
      <div v-if="mostrarNovaOficina" class="flex gap-2">
        <input v-model="novaOficina.nome" placeholder="Nome da oficina" class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <input v-model="novaOficina.whatsapp" placeholder="WhatsApp" class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <button type="button" @click="cadastrarOficina" class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 text-sm">Salvar</button>
      </div>
      <select v-model="novo.formaPagamento" class="w-full border border-slate-300 rounded-lg px-3 py-2">
        <option value="Pix">Pix</option>
        <option value="Dinheiro">Dinheiro</option>
        <option value="Cartao">Cartão</option>
        <option value="Prazo">Prazo</option>
      </select>
      <input v-if="novo.formaPagamento === 'Cartao'" v-model.number="novo.parcelas" type="number" placeholder="Nº de parcelas" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <p v-if="erro" class="text-red-600 text-sm">{{ erro }}</p>
      <button type="submit" class="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm">Salvar</button>
    </form>

    <p v-if="carregando" class="text-slate-500 text-sm">Carregando...</p>
    <div v-else class="space-y-2">
      <div v-for="m in status" :key="m.placa + m.tipo" class="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p class="font-medium text-slate-900">{{ m.placa }} — {{ m.tipo }}</p>
          <p class="text-sm text-slate-500">{{ m.kmRestante > 0 ? m.kmRestante + ' km restantes' : 'vencido' }} · {{ m.diasRestantes }}d</p>
        </div>
        <span :class="corBadge(m.status)" class="text-xs px-2 py-1 rounded-full font-medium">{{ m.status }}</span>
      </div>
      <p v-if="!status.length" class="text-slate-400 text-sm text-center py-8">Nenhuma manutenção registrada.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { api } from '@/api'

const status = ref([])
const veiculos = ref([])
const oficinas = ref([])
const carregando = ref(true)
const mostrarForm = ref(false)
const mostrarNovaOficina = ref(false)
const erro = ref('')
const novo = reactive({ placa: '', tipo: 'Óleo', data: '', kmRegistro: null, valor: null, fornecedor: '', formaPagamento: 'Pix', parcelas: 1 })
const novaOficina = reactive({ nome: '', whatsapp: '' })

function corBadge(s) {
  if (s === 'vermelho') return 'bg-red-100 text-red-700'
  if (s === 'amarelo') return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

async function carregar() {
  carregando.value = true
  try {
    const [resStatus, resVeic, resOf] = await Promise.all([
      api.get('manutencao/status'),
      api.get('veiculos/listar'),
      api.get('oficinas/listar')
    ])
    status.value = resStatus
    veiculos.value = (resVeic.rows || resVeic.veiculos || []).filter(v => v.ativo)
    oficinas.value = resOf.rows || resOf.oficinas || []
  } finally {
    carregando.value = false
  }
}

async function cadastrarOficina() {
  if (!novaOficina.nome || !novaOficina.whatsapp) { erro.value = 'Preencha nome e WhatsApp da oficina.'; return }
  try {
    await api.post('oficinas/cadastrar', { ...novaOficina })
    const nomeCadastrado = novaOficina.nome
    Object.assign(novaOficina, { nome: '', whatsapp: '' })
    mostrarNovaOficina.value = false
    await carregar()
    novo.fornecedor = nomeCadastrado
  } catch (e) {
    erro.value = e.message
  }
}

async function registrar() {
  erro.value = ''
  try {
    await api.post('manutencao/registrar', { ...novo })
    Object.assign(novo, { placa: '', tipo: 'Óleo', data: '', kmRegistro: null, valor: null, fornecedor: '', formaPagamento: 'Pix', parcelas: 1 })
    mostrarForm.value = false
    await carregar()
  } catch (e) {
    erro.value = e.message
  }
}

onMounted(carregar)
</script>
