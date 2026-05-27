export function getTooltipProps(theme: 'dark' | 'light') {
  const isDark = theme === 'dark'
  return {
    contentStyle: {
      backgroundColor: isDark ? '#1C2128' : '#FFFFFF',
      border: `1px solid ${isDark ? '#30363D' : '#D0D7DE'}`,
      borderRadius: '6px',
      fontSize: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    },
    labelStyle: {
      color: isDark ? '#E6EDF3' : '#1F2328',
      fontWeight: 600,
      marginBottom: 4,
    },
    itemStyle: {
      color: isDark ? '#C9D1D9' : '#636C76',
    },
    cursor: { fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
  }
}
