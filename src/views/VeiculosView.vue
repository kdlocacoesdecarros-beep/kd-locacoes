<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <router-link to="/" class="text-slate-500 text-sm">← Voltar</router-link>
      <h1 class="text-lg font-semibold text-slate-900">Frota</h1>
      <button @click="mostrarForm = !mostrarForm" class="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg">
        {{ mostrarForm ? 'Cancelar' : '+ Veículo' }}
      </button>
    </div>

    <form v-if="mostrarForm" @submit.prevent="cadastrar" class="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
      <input v-model="novo.placa" placeholder="Placa" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <input v-model="novo.modelo" placeholder="Modelo" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <SeletorMotorista v-model="novo.motoristaId" :motoristas="motoristas" @novo="onNovoMotorista" />
      <p v-if="erro" class="text-red-600 text-sm">{{ erro }}</p>
      <button type="submit" class="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm">Salvar</button>
    </form>

    <p v-if="carregando" class="text-slate-500 text-sm">Carregando...</p>
    <div v-else class="space-y-2">
      <div v-for="v in veiculos" :key="v.id" class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-slate-900">{{ v.placa }}</p>
            <p class="text-sm text-slate-500">{{ v.modelo || '—' }} · {{ v.motorista || '—' }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span :class="v.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'" class="text-xs px-2 py-1 rounded-full">
              {{ v.ativo ? 'Ativo' : 'Inativo' }}
            </span>
            <button @click="abrirEdicao(v)" class="text-xs text-indigo-600 underline">Editar</button>
            <button @click="excluir(v)" class="text-xs text-red-600 underline">Excluir</button>
          </div>
        </div>

        <form v-if="editando === v.id" @submit.prevent="salvarEdicao(v.id)" class="mt-3 border-t border-slate-100 pt-3 space-y-2">
          <input v-model="edicao.placa" placeholder="Placa" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input v-model="edicao.modelo" placeholder="Modelo" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <SeletorMotorista v-model="edicao.motoristaId" :motoristas="motoristas" @novo="onNovoMotorista" />
          <div class="flex gap-2">
            <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm">Salvar</button>
            <button type="button" @click="editando = null" class="bg-slate-100 rounded-lg px-4 py-2 text-sm">Cancelar</button>
          </div>
          <p v-if="erroEdicao" class="text-red-600 text-sm">{{ erroEdicao }}</p>
        </form>
      </div>
      <p v-if="!veiculos.length" class="text-slate-400 text-sm text-center py-8">Nenhum veículo cadastrado.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, defineComponent, h } from 'vue'
import { api } from '@/api'

const veiculos = ref([])
const motoristas = ref([])
const carregando = ref(true)
const mostrarForm = ref(false)
const erro = ref('')
const novo = reactive({ placa: '', modelo: '', motoristaId: '' })

const editando = ref(null)
const erroEdicao = ref('')
const edicao = reactive({ placa: '', modelo: '', motoristaId: '' })

async function carregar() {
  carregando.value = true
  try {
    const [res, resMot] = await Promise.all([
      api.get('veiculos/listar'),
      api.get('motoristas/listar')
    ])
    veiculos.value = res.rows || res.veiculos || []
    motoristas.value = resMot.rows || resMot.motoristas || []
  } finally {
    carregando.value = false
  }
}

async function onNovoMotorista(nome) {
  await api.post('motoristas/cadastrar', { nome })
  await carregar()
}

async function cadastrar() {
  erro.value = ''
  try {
    await api.post('veiculos/cadastrar', { ...novo })
    novo.placa = ''; novo.modelo = ''; novo.motoristaId = ''
    mostrarForm.value = false
    await carregar()
  } catch (e) {
    erro.value = e.message
  }
}

function abrirEdicao(v) {
  editando.value = editando.value === v.id ? null : v.id
  erroEdicao.value = ''
  edicao.placa = v.placa
  edicao.modelo = v.modelo || ''
  edicao.motoristaId = v.motorista_id || ''
}

async function salvarEdicao(id) {
  erroEdicao.value = ''
  try {
    await api.post('veiculos/editar', { id, ...edicao })
    editando.value = null
    await carregar()
  } catch (e) {
    erroEdicao.value = e.message
  }
}

async function excluir(v) {
  if (!confirm(`Excluir o veículo ${v.placa} permanentemente? O histórico de manutenção/vistoria feito com essa placa continua no sistema, só não fica mais ligado a um veículo ativo.`)) return
  try {
    await api.post('veiculos/inativar', { id: v.id })
    await carregar()
  } catch (e) {
    erro.value = e.message
  }
}

onMounted(carregar)

// ---- Subcomponente: select de motorista + atalho pra cadastrar um novo ----
const SeletorMotorista = defineComponent({
  props: { modelValue: [String, Number], motoristas: Array },
  emits: ['update:modelValue', 'novo'],
  setup(props, { emit }) {
    const mostrarNovo = ref(false)
    const nomeNovo = ref('')

    function salvar() {
      if (!nomeNovo.value.trim()) return
      emit('novo', nomeNovo.value.trim())
      nomeNovo.value = ''
      mostrarNovo.value = false
    }

    return () => h('div', {}, [
      h('select', {
        class: 'w-full border border-slate-300 rounded-lg px-3 py-2',
        value: props.modelValue,
        onChange: (e) => emit('update:modelValue', e.target.value)
      }, [
        h('option', { value: '' }, 'Motorista (opcional)'),
        ...props.motoristas.map(m => h('option', { value: m.id }, m.nome))
      ]),
      h('button', {
        type: 'button',
        class: 'text-xs text-indigo-600 underline mt-1',
        onClick: () => { mostrarNovo.value = !mostrarNovo.value }
      }, mostrarNovo.value ? 'Cancelar' : '+ Cadastrar novo motorista'),
      mostrarNovo.value ? h('div', { class: 'flex gap-2 mt-1' }, [
        h('input', {
          class: 'flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm',
          placeholder: 'Nome do motorista',
          value: nomeNovo.value,
          onInput: (e) => { nomeNovo.value = e.target.value }
        }),
        h('button', { type: 'button', class: 'bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2 text-sm', onClick: salvar }, 'Salvar')
      ]) : null
    ])
  }
})
</script>
