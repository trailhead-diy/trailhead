/**
 * Script to initialize theme before React hydrates
 * This prevents flash of unstyled content
 */
export function ThemeScript() {
  // Just apply the classes and let CSS handle the defaults
  const scriptContent = `
    (function() {
      try {
        const storageKey = 'theme';
        const theme = localStorage.getItem(storageKey);
        
        if (theme) {
          // Apply theme immediately
          document.documentElement.setAttribute('data-theme', theme);
          
          // Apply dark class if needed
          if (theme === 'dark' || theme.endsWith('-dark')) {
            document.documentElement.classList.add('dark');
          }
        }
      } catch (e) {}
    })();
  `.trim()

  return <script dangerouslySetInnerHTML={{ __html: scriptContent }} />
}
