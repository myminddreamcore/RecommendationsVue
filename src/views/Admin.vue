<template>
  <div class="app">
    <aside class="sidebar" :class="{ 'sidebar-mobile-open': mobileMenuOpen }">
      <div class="sidebar-header">
        <div class="logo">Цифровой профиль</div>
        <button v-if="mobileMenuOpen" @click="mobileMenuOpen = false" class="sidebar-close">×</button>
      </div>
      <nav class="sidebar-nav">
      
        <button @click="goTo('/admin')" class="nav-item active">
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
        <h3>Администрирование</h3>
        <div class="mobile-placeholder"></div>
      </div>

      <div class="breadcrumbs">
        <span class="breadcrumb-item">Главная</span>
        <span class="breadcrumb-separator">→</span>
        <span class="breadcrumb-item active">Администрирование</span>
      </div>

      <h1>Администрирование</h1>

      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="{ active: activeTab === tab.value }"
          class="tab-btn"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'users'" class="tab-content">
        <div class="filter-form">
          <h3>Поиск пользователей</h3>

          <div class="form-row">
            <label class="form-label">Навыки</label>
            <div class="skills-input">
              <input
                v-model="skillInput"
                placeholder="Введите название навыка"
                class="form-input"
                @input="searchSkills"
              />
              <div v-if="skillSuggestions.length" class="suggestions">
                <div
                  v-for="s in skillSuggestions"
                  :key="s"
                  @click="addSkillFilter(s)"
                  class="suggestion"
                >
                  {{ s }}
                </div>
              </div>
            </div>
            <div v-if="selectedSkills.length" class="selected-skills">
              <span v-for="s in selectedSkills" :key="s" class="skill-chip">
                {{ s }}
                <button @click="removeSkillFilter(s)" class="chip-close">×</button>
              </span>
            </div>
          </div>

          <div class="form-row-grid">
            <div class="form-field">
              <label class="form-label">Уровень от</label>
              <input v-model="filters.UrovenOt" type="number" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">Уровень до</label>
              <input v-model="filters.UrovenODo" type="number" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">Опыт от</label>
              <input v-model="filters.OpytOt" type="number" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">Опыт до</label>
              <input v-model="filters.OpytDo" type="number" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">Рейтинг от</label>
              <input v-model="filters.RatingOt" type="number" class="form-input" />
            </div>
            <div class="form-field">
              <label class="form-label">Рейтинг до</label>
              <input v-model="filters.ratingDo" type="number" class="form-input" />
            </div>
          </div>

          <div class="form-actions">
            <button @click="searchUsers" class="btn btn-primary" :disabled="loadingUsers">
              {{ loadingUsers ? 'Поиск...' : 'Найти' }}
            </button>
            <button @click="clearUsers" class="btn btn-cancel">Очистить</button>
            <button @click="exportCSV" class="btn btn-cancel">Экспорт CSV</button>
            <select v-model="pageSize" @change="refreshDisplay" class="page-size-select">
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>

        <div v-if="loadingUsers" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Загрузка...</p>
        </div>

        <div v-else-if="findResults.length === 0" class="empty-state">
          <p>Выполните поиск для отображения пользователей</p>
        </div>

        <div v-else class="table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Номер</th>
                <th>Имя</th>
                <th>Навыки</th>
                <th>Рейтинг</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in paginatedResults" :key="u.id">
                <td class="cell-id">{{ u.id }}</td>
                <td>{{ u.name }}</td>
                <td class="cell-skills">{{ u.skills || '—' }}</td>
                <td class="cell-rating">{{ u.rating ?? 0 }}</td>
                <td>
                  <div class="row-actions">
                    <button @click="openCard(u)" class="btn-row">Подробно</button>
                    <button @click="openAddToPodborka(u)" class="btn-row">В подборку</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination">
            <button @click="prevPage" :disabled="currentPage <= 1" class="btn-row">Пред</button>
            <span class="page-info">{{ currentPage }} / {{ pageCount }}</span>
            <button @click="nextPage" :disabled="currentPage >= pageCount" class="btn-row">След</button>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'skills'" class="tab-content">
       

        <div class="toolbar">
          <input v-model="skillSearch" placeholder="Поиск навыка" class="field-input" />
          <button @click="loadSkills" class="btn btn-primary">Обновить</button>
        </div>

        <div v-if="loadingSkills" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Загрузка навыков...</p>
        </div>

        <div v-else-if="filteredSkills.length === 0" class="empty-state">
          <p>Навыки не найдены</p>
        </div>

        <div v-else class="skills-grid">
          <div v-for="s in filteredSkills" :key="s" class="skill-item">
            {{ s }}
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'podborki'" class="tab-content">
        <div class="toolbar">
          <button @click="loadPodborki" class="btn btn-primary">Обновить</button>
        </div>

        <div v-if="loadingPodborki" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Загрузка подборок...</p>
        </div>

        <div v-else-if="podborki.length === 0" class="empty-state">
          <p>Подборок нет</p>
        </div>

        <div v-else class="table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Название</th>
                <th>Кандидатов</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in podborki" :key="p.id">
                <td class="cell-id">{{ p.id }}</td>
                <td>{{ p.name }}</td>
                <td>{{ p.users?.length || 0 }}</td>
                <td>{{ formatDate(p.date) }}</td>
                <td>
                  <div class="row-actions">
                    <button @click="renamePodborka(p)" class="btn-row">Переименовать</button>
                    <button @click="deletePodborka(p)" class="btn-row btn-row-danger">Удалить</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="activeTab === 'stats'" class="tab-content">
        <div class="toolbar">
          <button @click="loadStats" class="btn btn-primary">Обновить</button>
        </div>

        <div v-if="loadingStats" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Загрузка статистики...</p>
        </div>

        <div v-else class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ stats.ColProfils ?? 0 }}</span>
            <span class="stat-label">Профилей всего</span>
            <span class="stat-extra">+{{ stats.ProfilsPlus ?? 0 }} за неделю</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats.Vacancy ?? 0 }}</span>
            <span class="stat-label">Вакансий</span>
            <span class="stat-extra">+{{ stats.VacancyProzent ?? 0 }} за неделю</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats.Rating ?? 0 }}</span>
            <span class="stat-label">Средний рейтинг</span>
          </div>
        </div>

        <div v-if="topSkills.length" class="top-skills-block">
          <h3>Топ-5 технологий</h3>
          <div v-for="(s, idx) in topSkills" :key="idx" class="top-skill-row">
            <span class="top-skill-name">{{ s.name }}</span>
            <div class="top-skill-bar">
              <div
                class="top-skill-fill"
                :style="{ width: ((s.r?.levelRating || 0)) + '%' }"
              ></div>
            </div>
            <span class="top-skill-value">{{ s.r?.levelRating || 0 }}</span>
          </div>
        </div>
      </div>

      <div v-if="showAddToPodborkaModal" class="modal" @click.self="showAddToPodborkaModal = false">
        <div class="modal-content">
          <h3>Добавить в подборку</h3>
          <div class="modal-row">
            <span class="modal-label">Пользователь</span>
            <span class="modal-value">{{ selectedUser?.name }}</span>
          </div>
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
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const API = 'http://localhost:5000'

const mobileMenuOpen = ref(false)
const activeTab = ref('users')

const tabs = [
  { value: 'users', label: 'Пользователи' },
  { value: 'skills', label: 'Справочник навыков' },
  { value: 'podborki', label: 'Подборки' },
  { value: 'stats', label: 'Статистика' }
]

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
  if (!dateString) return '—'
  const d = new Date(dateString)
  if (isNaN(d.getTime())) return dateString
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

const users = ref([])
const findResults = ref([])
const skills = ref([])
const podborki = ref([])
const podborkaNames = ref([])
const topSkills = ref([])
const stats = ref({})

const loadingUsers = ref(false)
const loadingSkills = ref(false)
const loadingPodborki = ref(false)
const loadingStats = ref(false)

const skillInput = ref('')
const skillSuggestions = ref([])
const selectedSkills = ref([])
const skillSearch = ref('')

const filters = ref({
  UrovenOt: null,
  UrovenODo: null,
  OpytOt: null,
  OpytDo: null,
  RatingOt: null,
  ratingDo: null
})

const currentPage = ref(1)
const pageSize = ref(25)

const showAddToPodborkaModal = ref(false)
const selectedUser = ref(null)
const selectedPodborka = ref(null)

const filteredSkills = computed(() => {
  if (!skillSearch.value) return skills.value
  return skills.value.filter(s => s.toLowerCase().includes(skillSearch.value.toLowerCase()))
})

const pageCount = computed(() => {
  return Math.max(1, Math.ceil(findResults.value.length / pageSize.value))
})

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return findResults.value.slice(start, start + pageSize.value)
})

const searchSkills = () => {
  if (skillInput.value.length < 2) {
    skillSuggestions.value = []
    return
  }
  skillSuggestions.value = skills.value
    .filter(s => s.toLowerCase().includes(skillInput.value.toLowerCase()))
    .slice(0, 5)
}

const addSkillFilter = (s) => {
  if (!selectedSkills.value.includes(s)) selectedSkills.value.push(s)
  skillInput.value = ''
  skillSuggestions.value = []
}

const removeSkillFilter = (s) => {
  selectedSkills.value = selectedSkills.value.filter(x => x !== s)
}

const searchUsers = async () => {
  loadingUsers.value = true
  try {
    const payload = {
      skills: selectedSkills.value,
      UrovenOt: filters.value.UrovenOt ? Number(filters.value.UrovenOt) : null,
      UrovenODo: filters.value.UrovenODo ? Number(filters.value.UrovenODo) : null,
      OpytOt: filters.value.OpytOt ? Number(filters.value.OpytOt) : null,
      OpytDo: filters.value.OpytDo ? Number(filters.value.OpytDo) : null,
      RatingOt: filters.value.RatingOt ? Number(filters.value.RatingOt) : null,
      ratingDo: filters.value.ratingDo ? Number(filters.value.ratingDo) : null
    }
    const { data } = await api.post('/User/users/find', payload)
    findResults.value = Array.isArray(data) ? data : []
    currentPage.value = 1
  } catch (e) {
    if (e.response?.status === 404) findResults.value = []
    else console.error(e)
  } finally {
    loadingUsers.value = false
  }
}

const clearUsers = () => {
  findResults.value = []
  selectedSkills.value = []
  filters.value = {
    UrovenOt: null,
    UrovenODo: null,
    OpytOt: null,
    OpytDo: null,
    RatingOt: null,
    ratingDo: null
  }
}

const exportCSV = () => {
  if (!findResults.value.length) return
  const rows = [['номер', 'имя', 'навыки', 'рейтинг']]
  findResults.value.forEach(u => {
    rows.push([u.id, u.name, u.skills || '', u.rating ?? 0])
  })
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const prevPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < pageCount.value) currentPage.value++ }
const refreshDisplay = () => { currentPage.value = 1 }

const openCard = (u) => {
  router.push(`/card/${u.id}`)
}

const openAddToPodborka = async (u) => {
  selectedUser.value = u
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
  if (!selectedPodborka.value || !selectedUser.value) return
  try {
    await api.post(`/Compilation/AddNew/${selectedUser.value.id}/${selectedPodborka.value}`)
    showAddToPodborkaModal.value = false
  } catch {
    alert('Пользователь уже есть в этой подборке')
  }
}

const loadSkills = async () => {
  loadingSkills.value = true
  try {
    const { data } = await api.get('/Skill/skills')
    skills.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
  } finally {
    loadingSkills.value = false
  }
}

const loadPodborki = async () => {
  loadingPodborki.value = true
  try {
    const { data } = await api.get('/Compilation/GetPodborka')
    podborki.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error(e)
  } finally {
    loadingPodborki.value = false
  }
}

const renamePodborka = async (p) => {
  const newName = prompt('Новое название', p.name)
  if (!newName || !newName.trim()) return
  try {
    await api.put(`/Compilation/Rename/${p.id}/${encodeURIComponent(newName.trim())}`)
    await loadPodborki()
  } catch {
    alert('Ошибка переименования')
  }
}

const deletePodborka = async (p) => {
  if (!confirm(`Удалить подборку "${p.name}"?`)) return
  try {
    await api.put(`/Compilation/Delete/${p.id}`)
    await loadPodborki()
  } catch {
    alert('Ошибка удаления')
  }
}

const loadStats = async () => {
  loadingStats.value = true
  try {
    const [summaryRes, topRes] = await Promise.all([
      api.get('/dashbord/summary/1'),
      api.get('/skills/top')
    ])
    stats.value = summaryRes.data || {}
    topSkills.value = Array.isArray(topRes.data) ? topRes.data : []
  } catch (e) {
    console.error(e)
  } finally {
    loadingStats.value = false
  }
}

const goTo = (path) => {
  mobileMenuOpen.value = false
  router.push(path)
}

const logout = () => {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user_id')
  router.push('/')
}

onMounted(() => {
  loadSkills()
})
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
  border-radius: 0;
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

h1 {
  font-size: 24px;
  font-weight: normal;
  color: #4a3b2c;
  margin-bottom: 28px;
}

.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 32px;
  flex-wrap: wrap;
  border-bottom: 1px solid #d4c5b0;
}

.tab-btn {
  padding: 10px 24px;
  background: none;
  border: none;
  font-size: 14px;
  color: #8b7a6b;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  font-family: inherit;
}

.tab-btn:hover { color: #8b2c1d; }

.tab-btn.active {
  color: #8b2c1d;
  border-bottom-color: #8b2c1d;
}

.tab-content {
  background: white;
  border-radius: 0;
  padding: 24px;
  border: 1px solid #d4c5b0;
}

.filter-form {
  background: #faf8f5;
  padding: 20px;
  border-radius: 0;
  margin-bottom: 24px;
  border: 1px solid #d4c5b0;
}

.filter-form h3 {
  font-size: 16px;
  font-weight: normal;
  color: #4a3b2c;
  margin-bottom: 16px;
}

.form-row { margin-bottom: 16px; }

.form-label {
  display: block;
  font-size: 13px;
  color: #5c4d3e;
  margin-bottom: 8px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d4c5b0;
  border-radius: 0;
  font-size: 14px;
  font-family: inherit;
  background: white;
  color: #4a3b2c;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #8b2c1d;
}

.skills-input { position: relative; }

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d4c5b0;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion {
  padding: 10px 14px;
  cursor: pointer;
  font-size: 14px;
  color: #5c4d3e;
}

.suggestion:hover { background: #efe6db; }

.selected-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.skill-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #8b2c1d;
  color: white;
  border-radius: 0;
  font-size: 12px;
}

.chip-close {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.form-row-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.form-field { min-width: 0; }

.form-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.btn {
  padding: 10px 24px;
  border-radius: 0;
  font-size: 13px;
  cursor: pointer;
  border: none;
  font-family: inherit;
  transition: all 0.2s;
}

.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-primary {
  background: #8b2c1d;
  color: white;
}

.btn-primary:hover:not(:disabled) { background: #6e2216; }

.btn-cancel {
  background: white;
  color: #5c4d3e;
  border: 1px solid #d4c5b0;
}

.btn-cancel:hover { background: #efe6db; border-color: #8b2c1d; }

.page-size-select {
  padding: 10px 12px;
  border: 1px solid #d4c5b0;
  font-size: 14px;
  font-family: inherit;
  background: white;
  cursor: pointer;
  color: #5c4d3e;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.toolbar .field-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 12px;
  border: 1px solid #d4c5b0;
  font-size: 14px;
  font-family: inherit;
  color: #4a3b2c;
}

.table-wrapper { overflow-x: auto; }

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.admin-table th {
  text-align: left;
  padding: 12px;
  background: #faf8f5;
  color: #5c4d3e;
  font-weight: normal;
  border-bottom: 1px solid #d4c5b0;
}

.admin-table td {
  padding: 12px;
  color: #5c4d3e;
  border-bottom: 1px solid #e8dfd4;
}

.admin-table tr:last-child td { border-bottom: none; }
.cell-id { color: #8b7a6b; }
.cell-skills { max-width: 320px; word-break: break-word; }
.cell-rating { color: #8b2c1d; }

.row-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.btn-row {
  padding: 6px 14px;
  border-radius: 0;
  font-size: 12px;
  cursor: pointer;
  background: white;
  border: 1px solid #d4c5b0;
  color: #5c4d3e;
  font-family: inherit;
}

.btn-row:hover:not(:disabled) { background: #efe6db; border-color: #8b2c1d; }
.btn-row:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-row-danger { color: #8b2c1d; border-color: #d4c5b0; }
.btn-row-danger:hover { background: #efe6db; border-color: #8b2c1d; }

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.page-info { font-size: 13px; color: #8b7a6b; }

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.skill-item {
  padding: 12px 16px;
  background: #faf8f5;
  border: 1px solid #d4c5b0;
  border-radius: 0;
  font-size: 14px;
  color: #5c4d3e;
}

.info-block {
  background: #faf8f5;
  border: 1px solid #d4c5b0;
  border-radius: 0;
  padding: 16px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #8b7a6b;
}

.info-block code {
  background: #efe6db;
  padding: 2px 6px;
  font-size: 12px;
  color: #8b2c1d;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

.stat-card {
  background: #faf8f5;
  border: 1px solid #d4c5b0;
  border-radius: 0;
  padding: 24px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 36px;
  font-weight: normal;
  color: #8b2c1d;
  margin-bottom: 8px;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: #8b7a6b;
  margin-bottom: 6px;
}

.stat-extra {
  display: block;
  font-size: 12px;
  color: #8b2c1d;
}

.top-skills-block {
  background: #faf8f5;
  border: 1px solid #d4c5b0;
  border-radius: 0;
  padding: 20px;
}

.top-skills-block h3 {
  font-size: 16px;
  font-weight: normal;
  color: #4a3b2c;
  margin-bottom: 16px;
}

.top-skill-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.top-skill-name {
  width: 140px;
  font-size: 14px;
  color: #5c4d3e;
}

.top-skill-bar {
  flex: 1;
  height: 6px;
  background: #e8dfd4;
  overflow: hidden;
}

.top-skill-fill {
  height: 100%;
  background: #8b2c1d;
  transition: width 0.3s;
}

.top-skill-value {
  width: 40px;
  text-align: right;
  font-size: 13px;
  color: #8b2c1d;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
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
  background: #faf8f5;
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

.modal-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #efe6db;
}

.modal-label { font-size: 13px; color: #8b7a6b; }
.modal-value { font-size: 13px; color: #4a3b2c; }

.field { margin: 20px 0; }
.field-label {
  display: block;
  font-size: 13px;
  color: #5c4d3e;
  margin-bottom: 8px;
}

.btn-cancel {
  width: 100%;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }
  .sidebar.sidebar-mobile-open { transform: translateX(0); }
  .sidebar-close { display: block; }
  .sidebar-overlay { display: block; }
  .main { margin-left: 0; max-width: 100%; padding: 20px; }
  .mobile-header { display: flex; }
}
</style>