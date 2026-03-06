// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require('prism-react-renderer')
const lightTheme = themes.github
const darkTheme = themes.dracula
const { version } = require('./package.json')

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Hypertill DB',
  tagline: 'A reactive database framework',
  favicon: 'img/favicon.png',

  // Set the production url of your site here
  url: 'https://github.com/helapoint/hypertill-db',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'helapoint',
  projectName: 'hypertill-db',

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
        },
        items: [
          {
            type: 'doc',
            position: 'left',
            label: 'Docs',
            docId: 'docs/README',
          },
          {
            type: 'docsVersionDropdown',
            position: 'left',
          },
          // {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/helapoint/hypertill-db',
            label: 'Repository',
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
                label: 'Installation',
                to: '/docs/Installation',
              },
              // {
              //   label: 'Advanced Guides',
              //   to: '/docs/Advanced/Migrations',
              // },
              {
                label: 'Contributing',
                to: '/docs/CONTRIBUTING',
              },
            ],
          },
          {
            title: 'Support',
            items: [
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
          {
            title: 'More',
            items: [
              // {
              //   label: 'Blog',
              //   to: '/blog',
              // },
              {
                label: 'Repository',
                href: 'https://github.com/helapoint/hypertill-db',
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
