import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
}

export function Modal({ open, onClose, title, subtitle, children }: ModalProps) {
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
    <div className="fixed inset-0 z-[100] grid place-items-end p-0 sm:place-items-center sm:p-6">
      <div className="absolute inset-0 animate-scrim bg-[rgba(18,14,6,0.42)]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[460px] animate-pop rounded-t-[18px] border border-line bg-paper-card shadow-modal sm:rounded-[18px]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div>
            <h3 className="font-display text-base font-extrabold tracking-tight text-ink">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-ink-faint">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-paper-soft text-ink-muted hover:bg-paper-sunken hover:text-ink"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
