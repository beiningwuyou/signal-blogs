import colors from './src/client/data/theme.json' with { type: 'json' };

export default {
  content: ['./index.html', './src/client/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif',
        ],
        display: ['Newsreader', 'EB Garamond', 'Songti SC', 'SimSun', 'Georgia', 'serif'],
        serif: ['Newsreader', 'EB Garamond', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-md': ['28px', { lineHeight: '34px', letterSpacing: '-0.5px', fontWeight: '400' }],
        'display-md-mobile': [
          '24px',
          { lineHeight: '30px', letterSpacing: '-0.3px', fontWeight: '400' },
        ],
        'title-lg': ['20px', { lineHeight: '26px', fontWeight: '500' }],
        'title-md': ['16px', { lineHeight: '22px', fontWeight: '500' }],
        'body-md': ['14px', { lineHeight: '22px' }],
        'body-sm': ['13px', { lineHeight: '20px' }],
        caption: ['12px', { lineHeight: '17px', fontWeight: '500' }],
        code: ['13px', { lineHeight: '21px' }],
      },
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '96px',
        gutter: '16px',
        'margin-mobile': '16px',
        'margin-tablet': '24px',
        'margin-desktop': '32px',
      },
      borderRadius: { sm: '2px', DEFAULT: '4px', md: '6px', lg: '8px', xl: '12px', full: '9999px' },
      boxShadow: { none: 'none' },
    },
  },
  plugins: [],
};
