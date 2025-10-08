import type { UserConfig } from '~/types'

export const userConfig: Partial<UserConfig> = {
  site: {
    // 在这里添加您的导航链接
    navLinks: [
      {
        name: 'Posts',
        href: '/',
      },
      {
        name: 'Archive',
        href: '/archive',
      },
      {
        name: 'Categories',
        href: '/categories',
      },
      // START: 添加下面这个新的“标签”链接
      {
        name: 'Tags', // 这个'Tags'会由 i18n.ts 文件自动翻译
        href: '/tags', // 链接到您创建的页面
      },
      // END: 添加新的“标签”链接
      {
        name: 'About',
        href: '/about',
      },
    ]
  },
  // Override the default config here
  // site: { title: "講評世界" },
  // seo: { twitter: "@moeyua13" },

}
