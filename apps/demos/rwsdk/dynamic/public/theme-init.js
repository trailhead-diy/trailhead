/**
 * Theme initialization script
 *
 * This script runs immediately before React to apply theme from cookies.
 * It prevents flash of wrong theme by applying styles before the page renders.
 *
 * This file is self-contained and has no external dependencies.
 */
;(function () {
  try {
    // Parse cookies
    var cookies = {}
    document.cookie.split('; ').forEach(function (cookie) {
      var parts = cookie.split('=')
      if (parts[0] && parts[1]) {
        cookies[parts[0]] = decodeURIComponent(parts[1])
      }
    })

    // Get theme from cookie
    var themeCookie = cookies.theme
    if (!themeCookie) return

    var theme = JSON.parse(themeCookie)
    if (!theme) return

    // Validate all required fields exist
    if (
      !theme.mode ||
      !theme.primary ||
      !theme.secondary ||
      !theme.destructive ||
      !theme.base ||
      !theme.layout
    ) {
      return
    }

    var root = document.documentElement

    // Apply mode
    var mode =
      theme.mode === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme.mode

    root.classList.remove('light', 'dark')
    root.classList.add(mode)

    // Apply color variables
    var colors = ['primary', 'secondary', 'destructive', 'base', 'layout']
    var shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

    colors.forEach(function (category) {
      if (theme[category]) {
        shades.forEach(function (shade) {
          root.style.setProperty(
            '--color-' + category + '-' + shade,
            'var(--color-' + theme[category] + '-' + shade + ')'
          )
        })
      }
    })

    // Color contrast mapping
    var contrastMap = {
      zinc: { shade: '600', fg: 'white' },
      slate: { shade: '600', fg: 'white' },
      gray: { shade: '600', fg: 'white' },
      neutral: { shade: '600', fg: 'white' },
      stone: { shade: '600', fg: 'white' },
      cyan: { shade: '300', fg: 'var(--color-cyan-950)' },
      amber: { shade: '400', fg: 'var(--color-amber-950)' },
      yellow: { shade: '300', fg: 'var(--color-yellow-950)' },
      lime: { shade: '300', fg: 'var(--color-lime-950)' },
      red: { shade: '600', fg: 'white' },
      orange: { shade: '500', fg: 'white' },
      green: { shade: '600', fg: 'white' },
      emerald: { shade: '600', fg: 'white' },
      teal: { shade: '600', fg: 'white' },
      sky: { shade: '500', fg: 'white' },
      blue: { shade: '600', fg: 'white' },
      indigo: { shade: '500', fg: 'white' },
      violet: { shade: '500', fg: 'white' },
      purple: { shade: '500', fg: 'white' },
      fuchsia: { shade: '500', fg: 'white' },
      pink: { shade: '500', fg: 'white' },
      rose: { shade: '500', fg: 'white' },
    }

    // Apply semantic colors with contrast
    if (theme.primary && contrastMap[theme.primary]) {
      var p = contrastMap[theme.primary]
      root.style.setProperty(
        '--color-primary',
        'var(--color-' + theme.primary + '-' + p.shade + ')'
      )
      root.style.setProperty('--color-primary-foreground', p.fg)
    }
    if (theme.secondary && contrastMap[theme.secondary]) {
      var s = contrastMap[theme.secondary]
      root.style.setProperty(
        '--color-secondary',
        'var(--color-' + theme.secondary + '-' + s.shade + ')'
      )
      root.style.setProperty('--color-secondary-foreground', s.fg)
    }
    if (theme.destructive && contrastMap[theme.destructive]) {
      var d = contrastMap[theme.destructive]
      root.style.setProperty(
        '--color-destructive',
        'var(--color-' + theme.destructive + '-' + d.shade + ')'
      )
      root.style.setProperty('--color-destructive-foreground', d.fg)
    }

    // Mark theme as loaded to enable transitions
    root.classList.add('theme-loaded')
  } catch (e) {
    // Silently fail - the app will apply theme after hydration
  }
})()
