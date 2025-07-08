/**
 * Enhanced Theme Script with embedded CSS values
 * This completely prevents FOUC by setting CSS variables immediately
 */

// Mini theme registry for script
const themes: Record<string, { light: Record<string, string>; dark: Record<string, string> }> = {
  orange: {
    light: {
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.197 0.006 285.751)',
      card: 'oklch(1 0 0)',
      primary: 'oklch(0.646 0.222 41.116)',
      muted: 'oklch(0.974 0.001 286.375)',
      accent: 'oklch(0.974 0.001 286.375)',
      border: 'oklch(0.91 0.004 286.378)',
    },
    dark: {
      background: 'oklch(0.141 0.005 285.823)',
      foreground: 'oklch(0.985 0 0)',
      card: 'oklch(0.21 0.006 285.885)',
      primary: 'oklch(0.646 0.222 41.116)',
      muted: 'oklch(0.274 0.006 286.033)',
      accent: 'oklch(0.274 0.006 286.033)',
      border: 'oklch(0.2 0 0 / 0.1)',
    },
  },
  // Add other themes as needed
};

export function ThemeScriptWithCSS() {
  const scriptContent = `
    (function() {
      const themes = ${JSON.stringify(themes)};
      
      try {
        const storageKey = 'theme';
        const theme = localStorage.getItem(storageKey) || 'orange';
        const root = document.documentElement;
        
        // Parse theme name and dark mode
        let themeName = 'orange';
        let isDark = false;
        
        if (theme === 'dark') {
          isDark = true;
          themeName = 'orange';
        } else if (theme === 'light') {
          isDark = false;
          themeName = 'orange';
        } else if (theme.endsWith('-dark')) {
          themeName = theme.replace('-dark', '');
          isDark = true;
        } else {
          themeName = theme;
          isDark = false;
        }
        
        // Apply classes
        root.setAttribute('data-theme', theme);
        if (isDark) {
          root.classList.add('dark');
        }
        
        // Apply CSS variables immediately
        const themeData = themes[themeName];
        if (themeData) {
          const values = isDark ? themeData.dark : themeData.light;
          Object.entries(values).forEach(([key, value]) => {
            root.style.setProperty('--' + key, value);
          });
        }
        
        // Block transitions temporarily
        const style = document.createElement('style');
        style.textContent = '*, *::before, *::after { transition: none !important; }';
        document.head.appendChild(style);
        
        // Re-enable transitions after paint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            style.remove();
          });
        });
        
      } catch (e) {
        // Silent fail
      }
    })();
  `.trim();

  return <script dangerouslySetInnerHTML={{ __html: scriptContent }} />;
}
