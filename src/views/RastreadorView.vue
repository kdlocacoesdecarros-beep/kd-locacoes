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

    <h2 class="text-sm font-semibold text-slate-700 mb-2">KM rodado nas últimas semanas</h2>
    <div class="space-y-2">
      <div v-for="c in relatorioSemanal" :key="c.placa" class="bg-white border border-slate-200 rounded-xl p-3">
        <div class="flex items-center justify-between mb-1">
          <p class="font-medium text-slate-900">{{ c.placa }}</p>
          <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{{ c.totalKm }} km total</span>
        </div>
        <div class="flex gap-3 text-xs text-slate-500">
          <span v-for="s in c.semanas" :key="s.label">{{ s.label }}: {{ s.km }}km</span>
        </div>
      </div>
      <p v-if="!relatorioSemanal.length" class="text-slate-400 text-sm text-center py-4">Sem dados de KM ainda.</p>
    </div>
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
const relatorioSemanal = ref([])
const carregando = ref(true)
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

async function carregar() {
  carregando.value = true
  try {
    const hoje = new Date()
    const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
    const fimHoje = hoje.toISOString().substring(0, 10)
    const [posicoes, resVeic, semanal] = await Promise.all([
      api.get('rastreador/posicoes'),
      api.get('veiculos/listar'),
      api.get('rastreador/relatorio-semanal', { dataInicio: inicioMes, dataFim: fimHoje }).catch(() => ({ porCarro: [] }))
    ])
    carros.value = posicoes
    veiculos.value = (resVeic.rows || resVeic.veiculos || []).filter(v => v.ativo)
    relatorioSemanal.value = semanal.porCarro || []
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
