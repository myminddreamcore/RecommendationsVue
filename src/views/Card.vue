<template>
  <div class="app">
    <aside class="sidebar" :class="{ 'sidebar-mobile-open': mobileMenuOpen }">
      <div class="sidebar-header">
        <div class="logo">Цифровой профиль</div>
        <button v-if="mobileMenuOpen" @click="mobileMenuOpen = false" class="sidebar-close">×</button>
      </div>
      <nav class="sidebar-nav">
      
        <button @click="goTo('/admin')" class="nav-item">
          <span class="nav-icon">А</span>
          <span>Администрирование</span>
        </button>
        <button @click="logout" class="nav-item logout">
          <span class="nav-icon">В</span>
          <span>Выход</span>
        </button>
      </nav>
    </aside>

    <div v-if="mobileMenuOpen" class="sidebar-overlay" @click="mobileMenuOpen = false"></div>

    <main class="main">
      <div class="mobile-header">
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="menu-btn">☰</button>
        <h3>Карточка кандидата</h3>
        <div class="mobile-placeholder"></div>
      </div>

      <div class="breadcrumbs">
        <span class="breadcrumb-item">Администрирование</span>
        <span class="breadcrumb-separator">→</span>
        <span class="breadcrumb-item active">Карточка №{{ userId }}</span>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Загрузка данных...</p>
      </div>

      <div v-else-if="!user" class="empty-state">
        <p>Пользователь не найден</p>
      </div>

      <div v-else class="card-layout">
        <div class="card-header-block">
          <div class="user-avatar">
            {{ user.surnameUser?.charAt(0) }}{{ user.nameUser?.charAt(0) }}
          </div>
          <div class="user-header-info">
            <h1>{{ user.surnameUser }} {{ user.nameUser }} {{ user.patronymicUser }}</h1>
            <p class="user-id">ID: {{ user.idUser }}</p>
          </div>
        </div>

        <div class="card-grid">
          <div class="left-column">
            <div class="info-card">
              <div class="info-card-header">
                <h2>Доверие сообщества</h2>
              </div>
              <div class="info-card-body">
                <div class="rating-line">
                  <span class="rating-value">{{ rating }}</span>
                  <span class="rating-max">/ 100</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: rating + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="info-card">
              <div class="info-card-header">
                <h2>Индекс компетенций</h2>
              </div>
              <div class="info-card-body">
                <div class="rating-line">
                  <span class="rating-value">{{ competence }}</span>
                  <span class="rating-max">/ 100</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: competence + '%' }"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="right-column">
            <div class="info-card">
              <div class="info-card-header">
                <h2>Подтверждённые навыки</h2>
                <span class="card-count">{{ skills.length }}</span>
              </div>
              <div class="info-card-body">
                <div v-if="skills.length === 0" class="mini-empty">Нет подтверждённых навыков</div>
                <div v-for="(s, idx) in skills" :key="idx" class="skill-row">
                  <div class="skill-row-header">
                    <span class="skill-name">{{ s.name }}</span>
                    <span class="skill-mark">{{ s.rating }}/10</span>
                  </div>
                  <div class="skill-bar">
                    <div class="skill-bar-fill" :style="{ width: (s.rating * 10) + '%' }"></div>
                  </div>
                  <div class="skill-meta">
                    <span v-if="s.apply">{{ s.apply }} подтверждений</span>
                    <span v-if="s.date">Последнее: {{ formatDate(s.date) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="info-card">
              <div class="info-card-header">
                <h2>Опыт работы</h2>
                <span class="card-count">{{ experience.length }}</span>
              </div>
              <div class="info-card-body">
                <div v-if="experience.length === 0" class="mini-empty">Опыт работы не указан</div>
                <div v-for="(e, idx) in experience" :key="idx" class="exp-row">
                  <div class="exp-dot" :class="{ current: !e.dateEnd }"></div>
                  <div class="exp-content">
                    <div class="exp-header">
                      <span class="exp-company">{{ e.nameCompany }}</span>
                      <span class="exp-period">
                        {{ formatDate(e.dateStart) }} — {{ e.dateEnd ? formatDate(e.dateEnd) : 'настоящее' }}
                      </span>
                    </div>
                    <div class="exp-post">{{ e.post }}</div>
                    <div class="exp-type">{{ e.type }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <button @click="goBack" class="btn btn-cancel">Назад</button>
          <button @click="openAddToPodborka" class="btn btn-cancel">В подборку</button>
        </div>
      </div>
    </main>

    <div v-if="showAddToPodborkaModal" class="modal" @click.self="showAddToPodborkaModal = false">
      <div class="modal-content">
        <h3>Добавить в подборку</h3>
        <div class="field">
          <label class="field-label">Подборка</label>
          <select v-model="selectedPodborka" class="form-select">
            <option :value="null">— Выберите —</option>
            <option v-for="p in podborkaNames" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <button @click="addToPodborka" class="btn btn-primary">Добавить</button>
        <button @click="showAddToPodborkaModal = false" class="btn btn-cancel">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const API = 'http://localhost:5000'

const mobileMenuOpen = ref(false)
const loading = ref(true)

const userId = ref(route.params.id)
const user = ref(null)
const rating = ref(0)
const competence = ref(0)
const skills = ref([])
const experience = ref([])

const showAddToPodborkaModal = ref(false)
const podborkaNames = ref([])
const selectedPodborka = ref(null)

const getToken = () => {
  const encrypted = localStorage.getItem('auth_token')
  if (!encrypted) return ''
  try { return atob(encrypted) } catch { return '' }
}

const api = axios.create({ baseURL: API })
api.interceptors.request.use(config => {
  const t = getToken()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return dateString
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

const loadUser = async () => {
  try {
    const { data } = await api.get(`/User/users/${userId.value}?mode=employer`)
    user.value = data
  } catch (e) {
    console.error('Ошибка загрузки пользователя', e)
  }
}

const loadRating = async () => {
  try {
    const { data } = await api.post(`/users/${userId.value}/rating`)
    rating.value = data?.levelRating ?? 0
  } catch (e) {
    console.error('Ошибка рейтинга', e)
  }
}

const loadCompetence = async () => {
  try {
    const { data } = await api.post(`/users/${userId.value}/ratingskills`)
    competence.value = typeof data === 'number' ? data : 0
  } catch (e) {
    console.error('Ошибка компетенций', e)
  }
}

const loadSkills = async () => {
  try {
    const { data } = await api.get(`/Skill/skillsuser/${userId.value}`)
    skills.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Ошибка навыков', e)
  }
}

const loadExperience = async () => {
  try {
    const { data } = await api.get(`/Skill/worksuser/${userId.value}`)
    experience.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Ошибка опыта', e)
  }
}

const loadAll = async () => {
  loading.value = true
  await Promise.all([
    loadUser(),
    loadRating(),
    loadCompetence(),
    loadSkills(),
    loadExperience()
  ])
  loading.value = false
}

const goBack = () => router.back()

const goTo = (path) => {
  mobileMenuOpen.value = false
  router.push(path)
}

const logout = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_id')
  router.push('/login')
}

const openAddToPodborka = async () => {
  selectedPodborka.value = null
  try {
    const { data } = await api.get('/Compilation/GetAll')
    podborkaNames.value = Array.isArray(data) ? data : []
  } catch {
    podborkaNames.value = []
  }
  showAddToPodborkaModal.value = true
}

const addToPodborka = async () => {
  if (!selectedPodborka.value) return
  try {
    await api.post(`/Compilation/AddNew/${userId.value}/${selectedPodborka.value}`)
    showAddToPodborkaModal.value = false
  } catch {
    alert('Пользователь уже есть в этой подборке')
  }
}

const invite = () => {
  alert('Функция в разработке')
}

onMounted(loadAll)
</script>
<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; }

.app {
  display: flex;
  min-height: 100vh;
  background: #faf8f5;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.sidebar {
  width: 280px;
  background: #faf8f5;
  border-right: 1px solid #d4c5b0;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 100;
  transition: transform 0.3s ease;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 24px;
  border-bottom: 1px solid #d4c5b0;
}

.logo {
  font-size: 18px;
  font-weight: normal;
  color: #8b2c1d;
  letter-spacing: 0.5px;
}

.sidebar-close {
  background: none;
  border: none;
  color: #8b7a6b;
  font-size: 28px;
  cursor: pointer;
  display: none;
}

.sidebar-nav {
  flex: 1;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: none;
  border: none;
  color: #5c4d3e;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s;
  width: 100%;
  text-align: left;
  font-family: inherit;
  border-left: 3px solid transparent;
}

.nav-item:hover { color: #8b2c1d; }

.nav-item.active {
  color: #8b2c1d;
  border-left-color: #8b2c1d;
  background: #efe6db;
}

.nav-icon {
  width: 28px;
  font-size: 14px;
  font-weight: normal;
}

.logout { margin-top: auto; color: #8b7a6b; }
.logout:hover { color: #8b2c1d; background: #efe6db; border-left-color: #8b2c1d; }

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(74, 59, 44, 0.5);
  z-index: 99;
  display: none;
}

.main {
  flex: 1;
  margin-left: 280px;
  padding: 32px 40px;
  max-width: calc(100% - 280px);
}

.mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.menu-btn {
  background: none;
  border: 1px solid #d4c5b0;
  font-size: 20px;
  cursor: pointer;
  color: #5c4d3e;
  padding: 6px 12px;
}

.mobile-placeholder { width: 40px; }

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 13px;
}

.breadcrumb-item { color: #8b7a6b; }
.breadcrumb-item.active { color: #4a3b2c; }
.breadcrumb-separator { color: #d4c5b0; }

.card-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-header-block {
  background: white;
  border: 1px solid #d4c5b0;
  padding: 28px 32px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.user-avatar {
  width: 90px;
  height: 90px;
  background: #8b2c1d;
  color: white;
  font-size: 32px;
  font-weight: normal;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-header-info h1 {
  font-size: 22px;
  font-weight: normal;
  color: #4a3b2c;
  margin-bottom: 8px;
}

.user-id {
  font-size: 13px;
  color: #8b7a6b;
}

.card-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card {
  background: white;
  border: 1px solid #d4c5b0;
  overflow: hidden;
}

.info-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #d4c5b0;
}

.info-card-header h2 {
  font-size: 16px;
  font-weight: normal;
  color: #4a3b2c;
}

.card-count {
  font-size: 12px;
  color: #8b7a6b;
  background: #efe6db;
  padding: 4px 10px;
}

.info-card-body {
  padding: 20px 24px;
}

.rating-line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 12px;
}

.rating-value {
  font-size: 36px;
  font-weight: normal;
  color: #8b2c1d;
}

.rating-max {
  font-size: 14px;
  color: #8b7a6b;
}

.progress-bar {
  height: 6px;
  background: #e8dfd4;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #8b2c1d;
  transition: width 0.3s;
}

.skill-row {
  padding: 14px 0;
  border-bottom: 1px solid #efe6db;
}

.skill-row:last-child { border-bottom: none; padding-bottom: 0; }
.skill-row:first-child { padding-top: 0; }

.skill-row-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.skill-name {
  font-size: 14px;
  color: #4a3b2c;
}

.skill-mark {
  font-size: 12px;
  color: #8b7a6b;
}

.skill-bar {
  height: 6px;
  background: #e8dfd4;
  overflow: hidden;
  margin-bottom: 6px;
}

.skill-bar-fill {
  height: 100%;
  background: #8b2c1d;
}

.skill-meta {
  display: flex;
  gap: 16px;
  font-size: 11px;
  color: #8b7a6b;
}

.exp-row {
  display: flex;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid #efe6db;
}

.exp-row:last-child { border-bottom: none; padding-bottom: 0; }
.exp-row:first-child { padding-top: 0; }

.exp-dot {
  width: 10px;
  height: 10px;
  background: #d4c5b0;
  margin-top: 6px;
  flex-shrink: 0;
}

.exp-dot.current {
  background: #8b2c1d;
}

.exp-content { flex: 1; }

.exp-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.exp-company {
  font-size: 14px;
  color: #4a3b2c;
}

.exp-period {
  font-size: 12px;
  color: #8b7a6b;
}

.exp-post {
  font-size: 13px;
  color: #5c4d3e;
  margin-bottom: 4px;
}

.exp-type {
  font-size: 11px;
  color: #8b7a6b;
}

.mini-empty {
  padding: 16px 0;
  font-size: 13px;
  color: #8b7a6b;
  text-align: center;
}

.card-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 28px;
  font-size: 13px;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-primary {
  background: #8b2c1d;
  color: white;
}

.btn-primary:hover { background: #6e2216; }

.btn-cancel {
  background: white;
  color: #5c4d3e;
  border: 1px solid #d4c5b0;
}

.btn-cancel:hover { background: #efe6db; border-color: #8b2c1d; }

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: white;
  border: 1px solid #d4c5b0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 2px solid #d4c5b0;
  border-top-color: #8b2c1d;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }

.loading-state p { color: #8b7a6b; font-size: 14px; }

.empty-state {
  text-align: center;
  padding: 48px 24px;
  background: white;
  border: 1px solid #d4c5b0;
  color: #8b7a6b;
  font-size: 13px;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(74, 59, 44, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border: 1px solid #d4c5b0;
  padding: 28px;
  max-width: 460px;
  width: 90%;
}

.modal-content h3 {
  font-size: 18px;
  font-weight: normal;
  color: #4a3b2c;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #d4c5b0;
}

.field { margin: 20px 0; }
.field-label {
  display: block;
  font-size: 13px;
  color: #5c4d3e;
  margin-bottom: 8px;
}

.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d4c5b0;
  font-size: 14px;
  font-family: inherit;
  background: white;
  color: #4a3b2c;
}

.form-select:focus {
  outline: none;
  border-color: #8b2c1d;
}

.btn-cancel {
  width: 100%;
  margin-top: 8px;
}


</style>