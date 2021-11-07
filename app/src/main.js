import Vue from 'vue';
import App from './App.vue';

hljs.initHighlightingOnLoad();

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
