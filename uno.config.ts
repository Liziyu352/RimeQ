import { defineConfig, presetWind3, presetIcons, presetAttributify, presetTypography, transformerDirectives, transformerVariantGroup } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3(),
    presetAttributify(),
    presetTypography(),
    presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
  preflights: [
    {
      getCSS: () => `
        :root {
          --c-bg-main: 248, 250, 252;   /* slate-50 */
          --c-bg-sub: 241, 245, 249;    /* slate-100 */
          --c-bg-dim: 226, 232, 240;    /* slate-200 */
          --c-text-main: 15, 23, 42;    /* slate-900 */
          --c-text-sub: 71, 85, 105;    /* slate-600 */
          --c-text-dim: 148, 163, 184;  /* slate-400 */
        }
        .dark {
          --c-bg-main: 15, 23, 42;      /* slate-900 */
          --c-bg-sub: 30, 41, 59;       /* slate-800 */
          --c-bg-dim: 51, 65, 85;       /* slate-700 */
          --c-text-main: 248, 250, 252; /* slate-50 */
          --c-text-sub: 148, 163, 184;  /* slate-400 */
          --c-text-dim: 100, 116, 139;  /* slate-500 */
        }
      `
    }
  ],
  theme: {
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    colors: {
      // 主题色
      primary: {
        DEFAULT: 'rgba(var(--primary-color), <alpha-value>)',
        hover: 'rgba(var(--primary-hover), <alpha-value>)',
        active: 'rgba(var(--primary-active), <alpha-value>)',
        content: 'var(--primary-content)',
      },
      // 背景色
      background: {
        main: 'rgba(var(--c-bg-main), <alpha-value>)',
        sub: 'rgba(var(--c-bg-sub), <alpha-value>)',
        dim: 'rgba(var(--c-bg-dim), <alpha-value>)',
      },
      // 前景色
      foreground: {
        main: 'rgba(var(--c-text-main), <alpha-value>)',
        sub: 'rgba(var(--c-text-sub), <alpha-value>)',
        dim: 'rgba(var(--c-text-dim), <alpha-value>)',
      },
    },
  },
  shortcuts: [
    // 布局
    ['ui-flex-center', 'flex items-center justify-center'],
    ['ui-flex-between', 'flex items-center justify-between'],
    ['ui-flex-x', 'flex items-center'],
    ['ui-flex-y', 'flex flex-col items-center justify-center'],
    // 尺寸
    ['ui-flex-truncate', 'flex-1 min-w-0'],
    ['ui-flex-col-full', 'flex flex-col size-full'],
    // 定位
    ['ui-abs-full', 'absolute inset-0'],
    ['ui-abs-center', 'absolute inset-0 m-auto'],
    // 动画
    ['ui-trans', 'transition-all ease-[cubic-bezier(0.4,0,0.2,1)] duration-200'],
    ['ui-ia', 'cursor-pointer select-none ui-trans'],
    ['ui-hover', 'hover:bg-background-sub/50 ui-trans'],
    // 滚动条
    ['ui-scrollbar', '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'],
  ]
})
