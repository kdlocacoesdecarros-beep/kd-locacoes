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
      <select v-model="novo.placa" required class="w-full border border-slate-300 rounded-lg px-3 py-2">
        <option value="" disabled>Selecione a placa</option>
        <option v-for="v in veiculos" :key="v.id" :value="v.placa">{{ v.placa }} — {{ v.modelo || 'sem modelo' }}</option>
      </select>
      <select v-model="novo.tipo" required class="w-full border border-slate-300 rounded-lg px-3 py-2">
        <option value="" disabled>Tipo de serviço</option>
        <option v-for="t in tiposServico" :key="t" :value="t">{{ t }}</option>
      </select>
      <textarea v-model="novo.descricao" placeholder="Descrição" required class="w-full border border-slate-300 rounded-lg px-3 py-2"></textarea>
      <input v-model.number="novo.valorEstimado" type="number" placeholder="Valor estimado (R$)" class="w-full border border-slate-300 rounded-lg px-3 py-2" />
      <select v-model="novo.oficina" class="w-full border border-slate-300 rounded-lg px-3 py-2">
        <option value="">Oficina (opcional)</option>
        <option v-for="o in oficinas" :key="o.id" :value="o.nome">{{ o.nome }}</option>
      </select>
      <p v-if="erro" class="text-red-600 text-sm">{{ erro }}</p>
      <button type="submit" class="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm">Abrir requisição</button>
    </form>

    <div v-if="recemCriada" class="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
      <p class="text-sm font-medium text-green-800 mb-3">✅ Requisição {{ recemCriada.id }} aberta! Envia a autorização:</p>
      <MensagensAutorizacao :req="recemCriada" :oficinas="oficinas" @fechar="recemCriada = null" />
    </div>

    <p v-if="carregando" class="text-slate-500 text-sm">Carregando...</p>
    <div v-else class="space-y-2">
      <div v-for="r in requisicoes" :key="r.id" class="bg-white border border-slate-200 rounded-xl p-4">
        <div class="flex items-center justify-between mb-1">
          <p class="font-medium text-slate-900">{{ r.id }} · {{ r.placa }}</p>
          <span class="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">{{ r.dias_aberta }}d aberta</span>
        </div>
        <p class="text-sm text-slate-500 mb-3">{{ r.tipo }} — {{ r.descricao }}</p>
        <div class="flex gap-4">
          <button @click="msgAberta = msgAberta === r.id ? null : r.id" class="text-sm text-indigo-600 underline">
            📲 Enviar autorização
          </button>
          <button @click="fecharForm = fecharForm === r.id ? null : r.id" class="text-sm text-slate-900 underline">
            Fechar requisição
          </button>
        </div>

        <div v-if="msgAberta === r.id" class="mt-3 border-t border-slate-100 pt-3">
          <MensagensAutorizacao :req="r" :oficinas="oficinas" />
        </div>

        <form v-if="fecharForm === r.id" @submit.prevent="fechar(r.id)" class="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <input v-model.number="fecho.km" type="number" placeholder="KM atual" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
          <input v-model.number="fecho.valorFinal" type="number" placeholder="Valor final (R$)" required class="w-full border border-slate-300 rounded-lg px-3 py-2" />
          <select v-model="fecho.oficina" class="w-full border border-slate-300 rounded-lg px-3 py-2">
            <option value="">Oficina</option>
            <option v-for="o in oficinas" :key="o.id" :value="o.nome">{{ o.nome }}</option>
          </select>
          <button type="submit" class="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm">Confirmar fechamento</button>
        </form>
      </div>
      <p v-if="!requisicoes.length" class="text-slate-400 text-sm text-center py-8">Nenhuma requisição aberta.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, defineComponent, computed, h } from 'vue'
import { api } from '@/api'

const requisicoes = ref([])
const veiculos = ref([])
const oficinas = ref([])
const carregando = ref(true)
const mostrarForm = ref(false)
const fecharForm = ref(null)
const msgAberta = ref(null)
const recemCriada = ref(null)
const erro = ref('')
const tiposServico = ['Preventiva', 'Corretiva', 'Revisão', 'Pneus', 'Elétrica', 'Outros']
const novo = reactive({ placa: '', tipo: '', descricao: '', valorEstimado: null, oficina: '' })
const fecho = reactive({ km: null, valorFinal: null, oficina: '' })

async function carregar() {
  carregando.value = true
  try {
    const [res, resVeic, resOf] = await Promise.all([
      api.get('requisicoes/abertas'),
      api.get('veiculos/listar'),
      api.get('oficinas/listar')
    ])
    requisicoes.value = res.rows || res.requisicoes || []
    veiculos.value = (resVeic.rows || resVeic.veiculos || []).filter(v => v.ativo)
    oficinas.value = resOf.rows || resOf.oficinas || []
  } finally {
    carregando.value = false
  }
}

async function criar() {
  erro.value = ''
  try {
    const res = await api.post('requisicoes/criar', { ...novo })
    recemCriada.value = { id: res.id, ...novo, valor_estimado: novo.valorEstimado }
    Object.assign(novo, { placa: '', tipo: '', descricao: '', valorEstimado: null, oficina: '' })
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

// ---- Subcomponente: monta e copia as mensagens de autorização (oficina + motorista) ----
const MensagensAutorizacao = defineComponent({
  props: { req: Object, oficinas: Array },
  setup(props) {
    const foneMotorista = ref('')
    const copiadoOficina = ref(false)
    const copiadoMotorista = ref(false)

    const oficinaInfo = computed(() => props.oficinas.find(o => o.nome === props.req.oficina))
    const valorTxt = computed(() => {
      const v = props.req.valor_estimado ?? props.req.valorEstimado
      return v ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'Não informado'
    })

    const msgOficina = computed(() =>
      `Olá! Sou assistente virtual da *KD Locações*.\n\n` +
      `✅ *AUTORIZAÇÃO DE SERVIÇO*\n` +
      `📋 Número: *${props.req.id}*\n` +
      `🚗 Placa: *${props.req.placa}*\n` +
      `🔧 Serviço: *${props.req.tipo}*\n` +
      `📝 Descrição: ${props.req.descricao}\n` +
      `💰 Valor estimado: ${valorTxt.value}\n` +
      `⚠️ Coloque o número ${props.req.id} no recibo/nota fiscal.`
    )

    const msgMotorista = computed(() =>
      `Olá!\n\nA *KD Locações* autorizou o seguinte serviço para o seu veículo:\n` +
      `🚗 Placa: *${props.req.placa}*\n` +
      `🔧 Serviço: *${props.req.tipo}*\n` +
      `📝 Descrição: ${props.req.descricao}\n` +
      `🏪 Oficina: *${props.req.oficina || '—'}*\n` +
      `📋 Nº Autorização: *${props.req.id}*`
    )

    function copiar(texto, flag) {
      navigator.clipboard.writeText(texto).then(() => {
        flag.value = true
        setTimeout(() => { flag.value = false }, 2000)
      })
    }

    function waLink(numero, texto) {
      const fone = String(numero || '').replace(/[^0-9]/g, '')
      return `https://wa.me/55${fone}?text=${encodeURIComponent(texto)}`
    }

    return () => h('div', { class: 'space-y-4' }, [
      // Bloco oficina
      h('div', {}, [
        h('p', { class: 'text-xs font-semibold text-slate-500 mb-1' }, 'Mensagem para a oficina'),
        h('pre', { class: 'whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 mb-2' }, msgOficina.value),
        h('div', { class: 'flex gap-2' }, [
          h('button', {
            class: 'text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg',
            onClick: () => copiar(msgOficina.value, copiadoOficina)
          }, copiadoOficina.value ? 'Copiado!' : '📋 Copiar'),
          oficinaInfo.value?.whatsapp
            ? h('a', {
                class: 'text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg',
                href: waLink(oficinaInfo.value.whatsapp, msgOficina.value),
                target: '_blank', rel: 'noopener'
              }, '💬 Abrir WhatsApp')
            : null
        ])
      ]),
      // Bloco motorista
      h('div', {}, [
        h('p', { class: 'text-xs font-semibold text-slate-500 mb-1' }, 'Mensagem para o motorista'),
        h('pre', { class: 'whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-700 mb-2' }, msgMotorista.value),
        h('input', {
          class: 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-2',
          placeholder: 'WhatsApp do motorista (opcional, só pra abrir direto)',
          value: foneMotorista.value,
          onInput: (e) => { foneMotorista.value = e.target.value }
        }),
        h('div', { class: 'flex gap-2' }, [
          h('button', {
            class: 'text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg',
            onClick: () => copiar(msgMotorista.value, copiadoMotorista)
          }, copiadoMotorista.value ? 'Copiado!' : '📋 Copiar'),
          foneMotorista.value
            ? h('a', {
                class: 'text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg',
                href: waLink(foneMotorista.value, msgMotorista.value),
                target: '_blank', rel: 'noopener'
              }, '💬 Abrir WhatsApp')
            : null
        ])
      ])
    ])
  }
})
</script>
