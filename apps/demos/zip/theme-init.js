;(function () {
  try {
    // Check localStorage first (user preference)
    const stored = localStorage.getItem('color-mode')

    if (stored === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (stored === 'light') {
      document.documentElement.classList.remove('dark')
    } else if (!stored && matchMedia('(prefers-color-scheme:dark)').matches) {
      // Only use system if no user preference stored
      document.documentElement.classList.add('dark')
    }
  } catch (e) {}
})()
