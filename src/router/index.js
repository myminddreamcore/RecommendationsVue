import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Dashboard from '../views/Dashboard.vue';
import EditProfile from '../views/EditProfile.vue';
import Confirmations from '../views/Confirmations.vue';
import RatingRecommendations from '../views/RatingRecommendations.vue';
import ExportProfile from '../views/ExportProfile.vue';
import Card from '@/views/Card.vue';
import Admin from '@/views/Admin.vue';
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes:  [
  { path: '/', component: HomeView },
  { path: '/dashboard', component: Dashboard },
  { path: '/profile/edit', component: EditProfile },
  { path: '/confirmations', component: Confirmations },
  { path: '/rating', component: RatingRecommendations },
  { path: '/export', component: ExportProfile },
   { path: '/admin', name: 'admin', component: Admin },
  { path: '/card/:id', name: 'card', component: Card }
]
})

export default router
