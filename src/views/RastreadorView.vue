<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="flex items-center justify-between mb-4">
      <router-link to="/" class="text-slate-500 text-sm">← Voltar</router-link>
      <h1 class="text-lg font-semibold text-slate-900">Frota no mapa</h1>
      <button @click="carregar" class="text-sm bg-slate-100 px-3 py-1.5 rounded-lg">↻ Atualizar</button>
    </div>

    <div ref="mapEl" class="w-full rounded-xl border border-slate-200 mb-4" style="height:400px"></div>

    <p v-if="carregando" class="text-slate-500 text-sm">Carregando...</p>
    <div v-else class="space-y-2">
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
const carregando = ref(true)
const mapEl = ref(null)
let map = null
let markers = []

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
  if (pontos.length) {
    map.fitBounds(pontos.map(c => [c.latitude, c.longitude]), { padding: [30, 30], maxZoom: 15 })
  }
}

async function carregar() {
  carregando.value = true
  try {
    carros.value = await api.get('rastreador/posicoes')
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
