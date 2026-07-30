import type { ScrapedProduct } from '../types'
import { truncate } from '../utils/format'

export function ProductHeader({ product }: { product: ScrapedProduct }) {
  const image = product.images[0]

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-raised">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg text-faint">—</span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-ink">
          {product.title ? truncate(product.title, 46) : 'Untitled product'}
        </p>
        <p className="truncate text-xs text-muted">
          {[product.brand, product.seller].filter(Boolean).join(' · ') || 'Seller unknown'}
        </p>
      </div>
    </div>
  )
}
