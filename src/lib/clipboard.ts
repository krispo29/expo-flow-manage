export async function copyTextToClipboard(text: string) {
  if (!text) return

  if (typeof navigator === 'undefined' || typeof navigator.clipboard?.writeText !== 'function') {
    throw new Error('Clipboard API is not available')
  }

  await navigator.clipboard.writeText(text)
}
