import { Construction } from 'lucide-react'

type PlaceholderViewProps = {
  title: string
  body: string
}

export function PlaceholderView({ title, body }: PlaceholderViewProps) {
  return (
    <section className="placeholder" aria-labelledby="placeholder-heading">
      <Construction className="placeholder-icon" aria-hidden />
      <h2 id="placeholder-heading">{title}</h2>
      <p>{body}</p>
    </section>
  )
}
