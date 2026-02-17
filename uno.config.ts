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
          --c-bg-main: 241, 245, 249; /* slate-100 */
          --c-bg-sub: 255, 255, 255;   /* white */
          --c-bg-dim: 248, 250, 252;   /* slate-50 */
          --c-text-main: 30, 41, 59;   /* slate-800 */
          --c-text-sub: 100, 116, 139; /* slate-500 */
          --c-text-dim: 148, 163, 184; /* slate-400 */
        }
        .dark {
          --c-bg-main: 15, 23, 42;     /* slate-900 */
          --c-bg-sub: 30, 41, 59;      /* slate-800 */
          --c-bg-dim: 51, 65, 85;      /* slate-700 */
          --c-text-main: 241, 245, 249; /* slate-100 */
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
        DEFAULT: 'var(--primary-color)',
        hover: 'var(--primary-hover)',
        active: 'var(--primary-active)',
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
    animation: {
      keyframes: {
        'fade-in': `{ from { opacity: 0; } to { opacity: 1; } }`,
        'fade-out': `{ from { opacity: 1; } to { opacity: 0; } }`,
        'scale-in': `{ from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }`,
        'scale-out': `{ from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; } }`,
        'slide-in-up': `{ from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`,
        'slide-in-down': `{ from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`,
        'slide-out-up': `{ from { transform: translateY(0); opacity: 1; } to { transform: translateY(-20px); opacity: 0; } }`,
        'slide-out-down': `{ from { transform: translateY(0); opacity: 1; } to { transform: translateY(20px); opacity: 0; } }`,
        'slide-in-left': `{ from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`,
        'slide-in-right': `{ from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`,
        'slide-out-left': `{ from { transform: translateX(0); opacity: 1; } to { transform: translateX(-20px); opacity: 0; } }`,
        'slide-out-right': `{ from { transform: translateX(0); opacity: 1; } to { transform: translateX(20px); opacity: 0; } }`,
      }
    }
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
    // 滚动条
    ['ui-scrollbar', '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'],
  ]
})
