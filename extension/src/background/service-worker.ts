import { scrapeProductPage } from '../content/scraper'
import type { ScrapedProduct } from '../types'

type Message =
  | { type: 'SCRAPE_ACTIVE_TAB' }
  | { type: 'GET_HISTORY' }
  | { type: 'SAVE_VERIFICATION'; payload: unknown }

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message.type === 'SCRAPE_ACTIVE_TAB') {
    scrapeActiveTab().then(sendResponse)
    return true // keep the message channel open for the async response
  }

  if (message.type === 'GET_HISTORY') {
    chrome.storage.local.get('history').then((data) => sendResponse(data.history ?? []))
    return true
  }

  if (message.type === 'SAVE_VERIFICATION') {
    saveToHistory(message.payload).then(() => sendResponse({ ok: true }))
    return true
  }

  return false
})

async function scrapeActiveTab(): Promise<
  { status: 'ok'; product: ScrapedProduct } | { status: 'error'; message: string }
> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (!tab?.id) {
    return { status: 'error', message: 'No active tab found.' }
  }

  if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
    return { status: 'error', message: 'Open a product page to run Authra.' }
  }

  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: scrapeProductPage,
    })

    const product = injection?.result as ScrapedProduct | undefined
    if (!product || !product.title) {
      return { status: 'error', message: 'Could not read this page automatically.' }
    }

    return { status: 'ok', product }
  } catch {
    return { status: 'error', message: 'Authra can\u2019t access this page.' }
  }
}

async function saveToHistory(entry: unknown): Promise<void> {
  const data = await chrome.storage.local.get('history')
  const history: unknown[] = data.history ?? []
  history.unshift(entry)
  await chrome.storage.local.set({ history: history.slice(0, 25) })
}
