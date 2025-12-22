import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import ScanView from '../views/ScanView.vue'
import DashboardView from '../views/DashboardView.vue'



const router = createRouter({
  history : createWebHistory(import.meta.env.BASE_URL),
  routes : [
    {
      path : '/',
      name : 'login',
      component : LoginView,
    },
    {
      path : '/profile',
      name : 'profile',
      component : ProfileView,
    },
    {
      path : '/scan',
      name : 'scan',
      component : ScanView,
    },
    {
      path : '/dashboard',
      name : 'dashboard',
      component : DashboardView,
    },
  ],
})

export default router