import type { ActionFeedbackState } from '../../lib/interactionFeedback'

type ActionFeedbackProps = {
  className?: string
  feedback: ActionFeedbackState | null
  id?: string
}

export function ActionFeedback({ className = '', feedback, id }: ActionFeedbackProps) {
  const classes = ['action-feedback', feedback ? 'visible' : '', feedback ? `action-feedback-${feedback.tone}` : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <p
      className={classes}
      id={id}
      role={feedback?.tone === 'error' ? 'alert' : undefined}
      aria-live={feedback?.tone === 'error' ? 'assertive' : 'polite'}
    >
      {feedback?.message ?? ''}
    </p>
  )
}
