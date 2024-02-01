import './assets/main.css';
import 'ol/ol.css';
import { marked } from 'marked';
import { mangle } from 'marked-mangle';
import { createApp } from 'vue';
import App from './App.vue';
import { gfmHeadingId } from 'marked-gfm-heading-id';

marked.use(mangle());
marked.use(gfmHeadingId());

createApp(App).mount('#app');
