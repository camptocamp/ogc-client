import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default async () =>
  defineConfig({
    title: 'ogc-client website',
    description:
      'Documentation, examples and API reference for the ogc-client Javascript library',

    titleTemplate: ':title | ogc-client',

    themeConfig: {
      // https://vitepress.dev/reference/default-theme-config
      nav: [
        { text: 'Docs', link: '/' },
        { text: 'API Reference', link: '/api' },
        {
          text: 'Try it!',
          link: '/examples',
        },
      ],

      sidebar: {
        '/examples/': [
          {
            text: 'Examples',
            link: '/examples',
            items: [
              { text: 'WMS', link: '/examples/wms' },
              { text: 'WFS', link: '/examples/wfs' },
              { text: 'OGC API', link: '/examples/ogcapi' },
              { text: 'WMTS', link: '/examples/wmts' },
              { text: 'TMS', link: '/examples/tms' },
              { text: 'WPS', link: '/examples/wps' },
            ],
          },
        ],
      },

      socialLinks: [
        {
          icon: {
            svg: await fetch(
              'https://img.shields.io/npm/v/%40camptocamp%2Fogc-client?style=flat-square',
            )
              .then((resp) => resp.text())
              .catch(() => 'error'),
          },
          link: 'https://www.npmjs.com/package/@camptocamp/ogc-client',
        },
        {
          icon: {
            svg: await fetch(
              'https://img.shields.io/npm/v/%40camptocamp%2Fogc-client/dev?style=flat-square',
            )
              .then((resp) => resp.text())
              .catch(() => 'error'),
          },
          link: 'https://www.npmjs.com/package/@camptocamp/ogc-client?activeTab=versions',
          ariaLabel: '',
        },
        { icon: 'github', link: 'https://github.com/camptocamp/ogc-client' },
      ],

      search: {
        provider: 'local',
      },
    },

    vite: {
      resolve: {
        alias: {
          '@': `${import.meta.dirname}/../src`,
        },
      },
    },

    head: [
      ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
      [
        'link',
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
      ],
      [
        'link',
        {
          href: 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@500;600;700&family=Dongle:wght@300;400;700&display=swap',
          rel: 'stylesheet',
        },
      ],
    ],
  });
