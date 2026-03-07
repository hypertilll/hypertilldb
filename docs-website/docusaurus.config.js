// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require('prism-react-renderer')
const lightTheme = themes.oneLight
const darkTheme = themes.oneDark
const { version } = require('./package.json')

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Hypertill DB',
  tagline: 'Reactive local-first database for React, React Native, Expo, and web apps',
  favicon: 'img/favicon.png',

  // Set the production url of your site here
  url: 'https://hypertilll.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/hypertillDB/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'hypertilll',
  projectName: 'hypertillDB',

  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          path: 'docs',
          lastVersion: 'current',
          versions: {
            current: {
              label: `${version}`,
              badge: true,
            },
          },
        },
        // blog: {
        //   showReadingTime: true,
        //   // Please change this to your repo.
        //   // Remove this to remove the "edit this page" links.
        //   editUrl:
        //     'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        // },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/hypertill-db-social-card.png',
      navbar: {
        title: 'Hypertill DB',
        logo: {
          alt: 'Hypertill DB Logo',
          src: 'img/logo.svg',
          srcDark: 'img/logo-dark.svg',
        },
        items: [
          {
            type: 'doc',
            position: 'left',
            label: 'Start Here',
            docId: 'docs/README',
          },
          {
            type: 'doc',
            position: 'left',
            label: 'Install',
            docId: 'docs/Installation',
          },
          {
            type: 'doc',
            position: 'left',
            label: 'React',
            docId: 'docs/Components',
          },
          {
            href: 'https://github.com/hypertilll/expo-hypertillDB-example',
            label: 'Expo Demo',
            position: 'right',
          },
          {
            href: 'https://www.npmjs.com/package/@hypertill/db',
            label: 'npm',
            position: 'right',
          },
          {
            href: 'https://github.com/hypertilll/hypertillDB',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Start Here',
                to: '/docs',
              },
              {
                label: 'Installation',
                to: '/docs/Installation',
              },
              {
                label: 'Setup',
                to: '/docs/Setup',
              },
              {
                label: 'React Components',
                to: '/docs/Components',
              },
            ],
          },
          {
            title: 'Package',
            items: [
              {
                label: '@hypertill/db on npm',
                href: 'https://www.npmjs.com/package/@hypertill/db',
              },
              {
                label: 'Expo Demo Repo',
                href: 'https://github.com/hypertilll/expo-hypertillDB-example',
              },
            ],
          },
          {
            title: 'Support',
            items: [
              {
                label: 'Repository',
                href: 'https://github.com/hypertilll/hypertillDB',
              },
              {
                label: 'Website',
                href: 'https://helapoint.com',
              },
              {
                label: 'Contact',
                href: 'mailto:contact@helapoint.com',
              },
            ],
          },
        ],
        copyright: `Hypertill DB by <a href="https://helapoint.com">HelaPoint</a>.`,
      },
      prism: {
        theme: lightTheme,
        darkTheme: darkTheme,
      },
    }),
}

module.exports = config
