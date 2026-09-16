/**
 * Copies text to the clipboard. The async API needs a secure context and permission,
 * so a hidden textarea keeps the button working on plain http and in older browsers.
 */
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    if (copyViaTextarea(text)) return
    throw new Error('Не удалось скопировать')
  }
}

function copyViaTextarea(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.top = '-1000px'
  area.style.opacity = '0'
  document.body.append(area)
  area.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    area.remove()
  }
}
