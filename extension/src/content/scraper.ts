// This function is injected directly into the page via chrome.scripting.executeScript,
// so it can't rely on imports or closures over module scope — everything it needs
// has to live inside the function body.
export function scrapeProductPage() {
  const host = window.location.hostname

  const pickText = (selectors: string[]): string | null => {
    for (const sel of selectors) {
      const el = document.querySelector(sel)
      const text = el?.textContent?.trim()
      if (text) return text
    }
    return null
  }

  const pickImages = (selectors: string[]): string[] => {
    const found = new Set<string>()
    for (const sel of selectors) {
      document.querySelectorAll<HTMLImageElement>(sel).forEach((img) => {
        const src = img.currentSrc || img.src
        if (src && !src.startsWith('data:')) found.add(src)
      })
      if (found.size) break
    }
    return Array.from(found).slice(0, 6)
  }

  const siteOf = (h: string): string => {
    if (h.includes('amazon')) return 'amazon'
    if (h.includes('flipkart')) return 'flipkart'
    if (h.includes('myntra')) return 'myntra'
    if (h.includes('ajio')) return 'ajio'
    if (h.includes('nykaa')) return 'nykaa'
    if (h.includes('meesho')) return 'meesho'
    if (h.includes('ebay')) return 'ebay'
    return 'generic'
  }

  const site = siteOf(host)

  // Per-site selector maps. Falls back to generic OpenGraph / schema.org
  // markup when a site-specific selector misses, since most storefronts
  // still emit at least partial product schema.
  const selectorMap: Record<string, { title: string[]; brand: string[]; seller: string[]; price: string[]; images: string[]; rating: string[]; reviews: string[]; availability: string[] }> = {
    amazon: {
      title: ['#productTitle'],
      brand: ['#bylineInfo', '.po-brand .po-break-word'],
      seller: ['#sellerProfileTriggerId', '#merchant-info'],
      price: ['.a-price .a-offscreen', '#priceblock_ourprice'],
      images: ['#altImages img', '#imgTagWrapperId img'],
      rating: ['#acrPopover', 'span[data-hook="rating-out-of-text"]'],
      reviews: ['#acrCustomerReviewText'],
      availability: ['#availability span'],
    },
    flipkart: {
      title: ['span.B_NuCI', 'h1 span'],
      brand: ['a.G6XhBx'],
      seller: ['#sellerName span', 'div._1RLviY'],
      price: ['div._30jeq3'],
      images: ['div._2r_T1I img', 'img._396cs4'],
      rating: ['div._3LWZlK'],
      reviews: ['span._2_R_DZ'],
      availability: ['div._16FRp0'],
    },
    generic: {
      title: ['meta[property="og:title"]', 'h1'],
      brand: ['meta[property="product:brand"]'],
      seller: ['[itemprop="seller"]'],
      price: ['meta[property="product:price:amount"]', '[itemprop="price"]'],
      images: ['meta[property="og:image"]'],
      rating: ['[itemprop="ratingValue"]'],
      reviews: ['[itemprop="reviewCount"]'],
      availability: ['[itemprop="availability"]'],
    },
  }

  const map = selectorMap[site] ?? selectorMap.generic!
  const genericMap = selectorMap.generic!

  const readMeta = (selector: string): string | null => {
    const el = document.querySelector(selector)
    if (!el) return null
    if (el.tagName === 'META') return el.getAttribute('content')
    return el.textContent?.trim() ?? null
  }

  const title = pickText(map.title) ?? readMeta(genericMap.title[0]!)
  const brand = pickText(map.brand) ?? readMeta(genericMap.brand[0]!)
  const seller = pickText(map.seller)
  const priceRaw = pickText(map.price) ?? readMeta(genericMap.price[0]!)
  const images = pickImages(map.images).length ? pickImages(map.images) : pickImages(genericMap.images)
  const ratingRaw = pickText(map.rating)
  const reviewsRaw = pickText(map.reviews)
  const availability = pickText(map.availability)

  const priceMatch = priceRaw?.match(/[\d,]+(\.\d+)?/)
  const ratingMatch = ratingRaw?.match(/(\d+(\.\d+)?)/)
  const reviewMatch = reviewsRaw?.replace(/,/g, '').match(/(\d+)/)

  const specs: Record<string, string> = {}
  document.querySelectorAll('table tr, .specs-row, [class*="spec"] tr').forEach((row) => {
    const cells = row.querySelectorAll('td, th')
    if (cells.length === 2) {
      const key = cells[0]?.textContent?.trim()
      const value = cells[1]?.textContent?.trim()
      if (key && value && key.length < 60) specs[key] = value
    }
  })

  return {
    title,
    brand,
    seller,
    price: priceMatch ? priceMatch[0] : priceRaw,
    currency: priceRaw?.includes('$') ? 'USD' : priceRaw?.includes('₹') || priceRaw?.includes('Rs') ? 'INR' : null,
    url: window.location.href,
    images,
    description: readMeta('meta[name="description"]'),
    specs,
    rating: ratingMatch ? parseFloat(ratingMatch[1]!) : null,
    reviewCount: reviewMatch ? parseInt(reviewMatch[1]!, 10) : null,
    availability,
    site,
  }
}
