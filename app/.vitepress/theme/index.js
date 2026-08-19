import DefaultTheme from 'vitepress/theme';
import WmsEndpoint from '../../src/components/wms/WmsEndpoint.vue';
import WfsEndpoint from '../../src/components/wfs/WfsEndpoint.vue';
import OgcApiEndpoint from '../../src/components/ogc-api/OgcApiEndpoint.vue';
import WmtsEndpoint from '../../src/components/wmts/WmtsEndpoint.vue';
import TmsEndpoint from '../../src/components/tms/TmsEndpoint.vue';
import WpsEndpoint from '../../src/components/wps/WpsEndpoint.vue';
import './custom.css';
import 'ol/ol.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('WmsEndpoint', WmsEndpoint);
    app.component('WfsEndpoint', WfsEndpoint);
    app.component('OgcApiEndpoint', OgcApiEndpoint);
    app.component('WmtsEndpoint', WmtsEndpoint);
    app.component('TmsEndpoint', TmsEndpoint);
    app.component('WpsEndpoint', WpsEndpoint);
  },
};
