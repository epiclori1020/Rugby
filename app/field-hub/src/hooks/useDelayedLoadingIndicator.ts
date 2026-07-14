import { useEffect, useState } from 'react'

export function useDelayedLoadingIndicator(active: boolean, delayMs = 300) {
  const [state, setState] = useState({ active, activation: 0, visibleActivation: null as number | null })
  let currentState = state

  if (state.active !== active) {
    currentState = { ...state, active, activation: state.activation + 1 }
    setState(currentState)
  }

  useEffect(() => {
    if (!active) return undefined

    const activation = currentState.activation
    const timeoutId = window.setTimeout(() => {
      setState((current) =>
        current.active && current.activation === activation
          ? { ...current, visibleActivation: activation }
          : current,
      )
    }, delayMs)
    return () => window.clearTimeout(timeoutId)
  }, [active, currentState.activation, delayMs])

  return active && currentState.visibleActivation === currentState.activation
}
