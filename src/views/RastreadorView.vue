<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <router-link to="/" class="text-slate-500 text-sm">← Voltar</router-link>
      <h1 class="text-lg font-semibold text-slate-900">Frota no mapa</h1>
      <button @click="carregar" class="text-sm bg-slate-100 px-3 py-1.5 rounded-lg">↻ Atualizar</button>
    </div>

    <div class="bg-white border border-slate-200 rounded-xl p-3 mb-4 flex gap-2">
      <select v-model="placaSelecionada" class="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm">
        <option value="">Ver rota de hoje...</option>
        <option v-for="v in veiculos" :key="v.id" :value="v.placa">{{ v.placa }} — {{ v.modelo || 'sem modelo' }}</option>
      </select>
      <button @click="verRota" :disabled="!placaSelecionada || carregandoRota" class="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg">
        {{ carregandoRota ? 'Carregando...' : 'Ver rota' }}
      </button>
      <button v-if="rotaAtiva" @click="limparRota" class="text-sm bg-slate-100 px-3 py-2 rounded-lg">✕</button>
    </div>
    <p v-if="msgRota" class="text-sm text-slate-500 -mt-2 mb-3">{{ msgRota }}</p>

    <div ref="mapEl" class="w-full rounded-xl border border-slate-200 mb-4" style="height:400px"></div>

    <p v-if="carregando" class="text-slate-500 text-sm">Carregando...</p>
    <div v-else class="space-y-2 mb-6">
      <div v-for="c in carros" :key="c.placa" class="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between">
        <div>
          <p class="font-medium text-slate-900">{{ c.placa }}</p>
          <p class="text-sm text-slate-500">
            {{ c.emMovimento ? `${c.velocidade} km/h` : 'Parado' }} ·
            {{ c.ignicaoLigada ? 'Ignição ligada' : 'Ignição desligada' }} ·
            atualizado há {{ c.minutosDesdeAtualizacao }}min
          </p>
        </div>
        <span :class="c.emMovimento ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'" class="text-xs px-2 py-1 rounded-full">
          {{ c.emMovimento ? 'Em movimento' : 'Parado' }}
        </span>
      </div>
      <p v-if="!carros.length" class="text-slate-400 text-sm text-center py-8">Nenhum veículo com posição disponível.</p>
    </div>

    <div class="flex items-center justify-between mb-2">
      <h2 class="text-sm font-semibold text-slate-700">Relatório de KM do mês</h2>
      <div class="flex gap-2">
        <select v-model.number="mesRelatorio" @change="carregarRelatorioMensal" class="border border-slate-300 rounded-lg px-2 py-1 text-sm">
          <option v-for="(nome, i) in nomesMeses" :key="i" :value="i+1">{{ nome }}</option>
        </select>
        <select v-model.number="anoRelatorio" @change="carregarRelatorioMensal" class="border border-slate-300 rounded-lg px-2 py-1 text-sm">
          <option v-for="a in anosDisponiveis" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>
    </div>

    <p v-if="relatorioMensal" class="text-sm text-slate-500 mb-3">Total da frota no mês: <b class="text-slate-900">{{ relatorioMensal.totalMes }} km</b></p>

    <h3 class="text-xs font-semibold text-slate-500 mb-2">Por motorista</h3>
    <div class="space-y-1.5 mb-4">
      <div v-for="m in relatorioMensal?.porMotorista" :key="m.motorista" class="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm">
        <span class="text-slate-700">{{ m.motorista }}</span>
        <span class="font-medium text-slate-900">{{ m.km }} km</span>
      </div>
    </div>

    <h3 class="text-xs font-semibold text-slate-500 mb-2">Por carro</h3>
    <div class="space-y-1.5 mb-4">
      <div v-for="c in relatorioMensal?.porCarro" :key="c.placa" class="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-sm">
        <span class="text-slate-700">{{ c.placa }} · {{ c.motorista }}</span>
        <span class="font-medium text-slate-900">{{ c.km }} km</span>
      </div>
    </div>

    <details class="mb-6">
      <summary class="text-xs font-semibold text-slate-500 cursor-pointer">Por dia (clique pra expandir)</summary>
      <div class="mt-2 grid grid-cols-4 sm:grid-cols-7 gap-1.5">
        <div v-for="d in relatorioMensal?.porDia" :key="d.dia" class="bg-white border border-slate-200 rounded-lg p-1.5 text-center">
          <p class="text-[10px] text-slate-400">{{ d.dia.substring(8,10) }}</p>
          <p class="text-xs font-medium" :class="d.km > 0 ? 'text-slate-900' : 'text-slate-300'">{{ d.km }}</p>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { api } from '@/api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

const carros = ref([])
const veiculos = ref([])
const relatorioMensal = ref(null)
const carregando = ref(true)
const hoje = new Date()
const mesRelatorio = ref(hoje.getMonth() + 1)
const anoRelatorio = ref(hoje.getFullYear())
const nomesMeses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const anosDisponiveis = [hoje.getFullYear() - 1, hoje.getFullYear()]
const carregandoRota = ref(false)
const placaSelecionada = ref('')
const rotaAtiva = ref(false)
const msgRota = ref('')
const mapEl = ref(null)
let map = null
let markers = []
let rotaLayer = null
let rotaMarkers = []

function iniciarMapa() {
  map = L.map(mapEl.value).setView([-23.42, -51.93], 12)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 19
  }).addTo(map)
}

function atualizarMarcadores() {
  markers.forEach(m => map.removeLayer(m))
  markers = []
  const pontos = carros.value.filter(c => c.latitude && c.longitude)
  pontos.forEach(c => {
    const marker = L.marker([c.latitude, c.longitude]).addTo(map)
    marker.bindPopup(`<b>${c.placa}</b><br>${c.emMovimento ? c.velocidade + ' km/h' : 'Parado'}<br>${c.ignicaoLigada ? 'Ignição ligada' : 'Ignição desligada'}<br>há ${c.minutosDesdeAtualizacao}min`)
    markers.push(marker)
  })
  if (pontos.length && !rotaAtiva.value) {
    map.fitBounds(pontos.map(c => [c.latitude, c.longitude]), { padding: [30, 30], maxZoom: 15 })
  }
}

function limparRota() {
  if (rotaLayer) { map.removeLayer(rotaLayer); rotaLayer = null }
  rotaMarkers.forEach(m => map.removeLayer(m))
  rotaMarkers = []
  rotaAtiva.value = false
  msgRota.value = ''
  atualizarMarcadores()
}

async function verRota() {
  if (!placaSelecionada.value) return
  limparRota()
  carregandoRota.value = true
  try {
    const res = await api.get('rastreador/rota-hoje', { placa: placaSelecionada.value })
    const pontos = (res.pontos || []).filter(p => p.lat && p.lng)
    if (!pontos.length) {
      msgRota.value = 'Sem pontos de rota registrados hoje pra essa placa.'
      return
    }
    rotaAtiva.value = true
    const latlngs = pontos.map(p => [p.lat, p.lng])
    rotaLayer = L.polyline(latlngs, { color: '#4f46e5', weight: 4 }).addTo(map)
    const inicio = L.marker(latlngs[0], { title: 'Início' }).addTo(map).bindPopup('Início — ' + (pontos[0].hora || ''))
    const fim = L.marker(latlngs[latlngs.length - 1], { title: 'Última posição' }).addTo(map).bindPopup('Última posição — ' + (pontos[pontos.length - 1].hora || ''))
    rotaMarkers = [inicio, fim]
    map.fitBounds(latlngs, { padding: [30, 30] })
    msgRota.value = `${pontos.length} pontos registrados hoje.`
  } catch (e) {
    msgRota.value = e.message
  } finally {
    carregandoRota.value = false
  }
}

async function carregarRelatorioMensal() {
  try {
    relatorioMensal.value = await api.get('rastreador/relatorio-mensal', { mes: mesRelatorio.value, ano: anoRelatorio.value })
  } catch (e) {
    relatorioMensal.value = null
  }
}

async function carregar() {
  carregando.value = true
  try {
    const [posicoes, resVeic] = await Promise.all([
      api.get('rastreador/posicoes'),
      api.get('veiculos/listar'),
      carregarRelatorioMensal()
    ])
    carros.value = posicoes
    veiculos.value = (resVeic.rows || resVeic.veiculos || []).filter(v => v.ativo)
    atualizarMarcadores()
  } finally {
    carregando.value = false
  }
}

onMounted(() => {
  iniciarMapa()
  carregar()
})

onBeforeUnmount(() => {
  if (map) map.remove()
})
</script>
