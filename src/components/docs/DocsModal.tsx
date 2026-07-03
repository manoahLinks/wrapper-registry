import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BrandMark } from '../BrandMark'
import { DocsPanel } from './DocsPanel'

/**
 * A full-screen Docs "page" rendered as an overlay (the app has no router).
 * Opened from the header Docs tab; Esc or "Back to app" closes it.
 */
export function DocsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[90] animate-fade-up overflow-y-auto bg-paper"
      style={{
        backgroundImage: 'radial-gradient(rgba(11,11,12,.045) 1px, transparent 1.4px)',
        backgroundSize: '22px 22px',
        backgroundPosition: '-1px -1px',
      }}
    >
      <div className="sticky top-0 z-10 border-b border-line bg-paper/[0.86] backdrop-blur-md">
        <div className="mx-auto flex h-[66px] max-w-[1240px] items-center justify-between px-7">
          <BrandMark />
          <button onClick={onClose} className="btn-outline px-4 py-2 text-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M11 6 5 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to app
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-[1240px] px-7 pb-16">
        <DocsPanel />
      </div>
    </div>,
    document.body,
  )
}
