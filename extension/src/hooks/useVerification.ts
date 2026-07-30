import { useCallback, useEffect, useState } from 'react'
import type { ScrapedProduct, VerificationResult } from '../types'
import { verifyProduct } from '../services/api'

type Status = 'idle' | 'scraping' | 'analyzing' | 'done' | 'error'

interface State {
  status: Status
  product: ScrapedProduct | null
  result: VerificationResult | null
  error: string | null
}

export function useVerification() {
  const [state, setState] = useState<State>({
    status: 'idle',
    product: null,
    result: null,
    error: null,
  })

  const run = useCallback(async () => {
    setState({ status: 'scraping', product: null, result: null, error: null })

    const scrapeResponse = await chrome.runtime.sendMessage({ type: 'SCRAPE_ACTIVE_TAB' })

    if (scrapeResponse.status === 'error') {
      setState({ status: 'error', product: null, result: null, error: scrapeResponse.message })
      return
    }

    const product = scrapeResponse.product as ScrapedProduct
    setState((prev) => ({ ...prev, status: 'analyzing', product }))

    const verifyResponse = await verifyProduct(product)

    if (verifyResponse.status === 'error') {
      setState({ status: 'error', product, result: null, error: verifyResponse.message })
      return
    }

    setState({ status: 'done', product, result: verifyResponse.result, error: null })

    chrome.runtime.sendMessage({
      type: 'SAVE_VERIFICATION',
      payload: { product, result: verifyResponse.result },
    })
  }, [])

  useEffect(() => {
    run()
  }, [run])

  return { ...state, retry: run }
}
