import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/** Catches render-time errors so a bug never blanks the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('App error boundary caught:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-paper px-5">
          <div className="card max-w-md p-8 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-zama-soft-yellow">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111314" strokeWidth="2">
                <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="font-display text-xl font-bold tracking-tight text-ink">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              An unexpected error occurred. Reloading usually fixes it.
            </p>
            <button onClick={() => window.location.reload()} className="btn-primary mt-5">
              Reload the app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
