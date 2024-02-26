import './assets/main.css';
import 'ol/ol.css';
import { marked } from 'marked';
import { mangle } from 'marked-mangle';
import { createApp } from 'vue';
import App from './App.vue';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import Docs from '@/Docs.vue';
import Api from '@/Api.vue';
import Demo from '@/Demo.vue';
import * as VueRouter from 'vue-router';

marked.use(mangle());
marked.use(gfmHeadingId());

const routes = [
  { path: '/', component: Docs },
  { path: '/api', component: Api },
  { path: '/demo', component: Demo },
];
const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
});

createApp(App).use(router).mount('#app');
