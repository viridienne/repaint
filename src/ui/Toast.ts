type ToastLevel = 'info' | 'warning' | 'error'

let container: HTMLElement | null = null

function getContainer(): HTMLElement {
  if (!container) {
    container = document.getElementById('toast-container')!
  }
  return container
}

export function showToast(message: string, level: ToastLevel = 'info', durationMs = 3000): void {
  const el = document.createElement('div')
  el.className = `toast toast-${level}`
  el.textContent = message

  getContainer().appendChild(el)

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('toast-visible'))
  })

  setTimeout(() => {
    el.classList.remove('toast-visible')
    el.addEventListener('transitionend', () => el.remove())
  }, durationMs)
}
