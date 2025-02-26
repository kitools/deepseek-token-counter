
import { createWebHashHistory, createRouter } from 'vue-router'

// import HomeView from './HomeView.vue'
// import AboutView from './AboutView.vue'

import NotFoundView from '@views/NotFoundView';
// import RootView from '@views/RootView';
// import HomeView from '@views/HomeView';
import AppView from '@views/AppView';
import AppToolView from '@views/appViews/AppToolView';
import AppNotesView from '@views/appViews/AppNotesView';

// const routes = [
//   { path: '/:pathMatch(.*)*', name: '404', component: NotFoundView },
//   { path: '/', name: 'root', component: RootView },
//   { path: '/home', name: 'home', component: HomeView },
//   { path: '/app', name: 'app-root', component: AppView, children: [
//     { path: '', name: 'app', component: AppRootView },
//     { path: 'index', name: 'app-index', component: AppRootView },
//     { path: 'notes', name: 'app-notes', component: AppNotesView },
//   ] },
// ];
const routes = [
  { path: '/:pathMatch(.*)*', name: '404', component: NotFoundView },
  { path: '/', redirect: '/tool' },
  { path: '/', name: 'app-root', component: AppView, children: [
    { path: 'tool', name: 'app-tool', component: AppToolView },
    { path: 'notes', name: 'app-notes', component: AppNotesView },
  ] },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
