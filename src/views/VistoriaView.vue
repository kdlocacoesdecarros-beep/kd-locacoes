<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <router-link to="/" class="text-slate-500 text-sm">← Voltar</router-link>
      <h1 class="text-lg font-semibold text-slate-900">Vistoria</h1>
      <button @click="mostrarForm = !mostrarForm" class="text-sm bg-slate-900 text-white px-3 py-1.5 rounded-lg">
        {{ mostrarForm ? 'Cancelar' : '+ Nova' }}
      </button>
    </div>

    <form v-if="mostrarForm" @submit.prevent="salvar" class="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
      <input v-model="nova.placa" placeholder="Placa" required @blur="validarPlaca" class="w-full border border-slate-300 rounded-lg px-3 py-2 uppercase" />
      <p v-if="infoPlaca" class="text-xs" :class="infoPlaca.ok ? 'text-green-600' : 'text-red-600'">{{ infoPlaca.msg }}</p>

      <input v-model.number="nova.km" type="number" placeholder="KM atual" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <p v-if="kmAnterior !== null" class="text-xs text-slate-500">KM anterior registrado: {{ kmAnterior }}</p>

      <textarea v-model="nova.observacoes" placeholder="Observações (opcional)" class="w-full border border-slate-300 rounded-lg px-3 py-2"></textarea>

      <div class="grid grid-cols-2 gap-3">
        <FotoCampo label="Frente" v-model="nova.fotoFrente" />
        <FotoCampo label="Traseira" v-model="nova.fotoTraseira" />
        <FotoCampo label="Lateral esquerda" v-model="nova.fotoLateralEsq" />
        <FotoCampo label="Lateral direita" v-model="nova.fotoLateralDir" />
        <FotoCampo label="Interior frente" v-model="nova.fotoInteriorFrente" />
        <FotoCampo label="Interior traseira" v-model="nova.fotoInteriorTraseira" />
        <FotoCampo label="Painel / KM" v-model="nova.fotoPainel" />
        <FotoCampo label="Assinatura" v-model="nova.assinatura" />
      </div>

      <p v-if="erro" class="text-red-600 text-sm">{{ erro }}</p>
      <button type="submit" :disabled="salvando" class="w-full bg-slate-900 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm">
        {{ salvando ? 'Salvando...' : 'Salvar vistoria' }}
      </button>
    </form>

    <p v-if="carregando" class="text-slate-500 text-sm">Carregando...</p>
    <template v-else>
      <h2 class="text-sm font-semibold text-slate-700 mb-2">Pendentes ({{ pendentes.length }})</h2>
      <div class="space-y-2 mb-6">
        <div v-for="v in pendentes" :key="v.placa" class="bg-white border border-amber-200 bg-amber-50/40 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p class="font-medium text-slate-900">{{ v.placa }}</p>
            <p class="text-sm text-slate-500">{{ v.modelo || '—' }} · {{ v.cliente || '—' }}</p>
          </div>
          <span class="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">pendente</span>
        </div>
        <p v-if="!pendentes.length" class="text-slate-400 text-sm text-center py-4">Tudo em dia.</p>
      </div>

      <h2 class="text-sm font-semibold text-slate-700 mb-2">Feitas neste mês ({{ feitas.length }})</h2>
      <div class="space-y-2">
        <div v-for="v in feitas" :key="v.placa" class="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p class="font-medium text-slate-900">{{ v.placa }}</p>
            <p class="text-sm text-slate-500">{{ v.modelo || '—' }} · KM {{ v.vistoria?.km_atual }}</p>
          </div>
          <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">feita</span>
        </div>
        <p v-if="!feitas.length" class="text-slate-400 text-sm text-center py-4">Nenhuma feita ainda.</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, defineComponent, h } from 'vue'
import { api } from '@/api'

const pendentes = ref([])
const feitas = ref([])
const carregando = ref(true)
const mostrarForm = ref(false)
const salvando = ref(false)
const erro = ref('')
const infoPlaca = ref(null)
const kmAnterior = ref(null)

const camposFoto = ['fotoFrente', 'fotoTraseira', 'fotoLateralEsq', 'fotoLateralDir', 'fotoInteriorFrente', 'fotoInteriorTraseira', 'fotoPainel', 'assinatura']
function vazio() {
  const o = { placa: '', km: null, observacoes: '' }
  camposFoto.forEach(c => { o[c] = '' })
  return o
}
const nova = reactive(vazio())

const FotoCampo = defineComponent({
  props: { label: String, modelValue: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    function onFile(e) {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => emit('update:modelValue', reader.result)
      reader.readAsDataURL(file)
    }
    return () => h('label', { class: 'flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-3 text-center cursor-pointer text-xs ' + (props.modelValue ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-300 text-slate-500') }, [
      h('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'hidden', onChange: onFile }),
      h('span', props.modelValue ? '✅ ' + props.label : '📷 ' + props.label)
    ])
  }
})

async function validarPlaca() {
  infoPlaca.value = null
  kmAnterior.value = null
  if (!nova.placa) return
  try {
    await api.get('vistoria/validar-placa', { placa: nova.placa })
    infoPlaca.value = { ok: true, msg: 'Placa ok, sem vistoria neste mês.' }
    const km = await api.get('vistoria/km-anterior', { placa: nova.placa })
    kmAnterior.value = km.kmAnterior
  } catch (e) {
    infoPlaca.value = { ok: false, msg: e.message }
  }
}

async function carregar() {
  carregando.value = true
  try {
    const res = await api.get('vistoria/painel')
    pendentes.value = res.pendentes || []
    feitas.value = res.feitas || []
  } finally {
    carregando.value = false
  }
}

async function salvar() {
  erro.value = ''
  const faltando = camposFoto.filter(c => !nova[c])
  if (faltando.length) { erro.value = 'Preencha todas as fotos e a assinatura.'; return }
  salvando.value = true
  try {
    await api.post('vistoria/salvar', { ...nova })
    Object.assign(nova, vazio())
    infoPlaca.value = null
    kmAnterior.value = null
    mostrarForm.value = false
    await carregar()
  } catch (e) {
    erro.value = e.message
  } finally {
    salvando.value = false
  }
}

onMounted(carregar)
</script>
