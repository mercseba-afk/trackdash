export function RacingPageHero({ kicker, title, description, children }: {
  kicker: string
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <header className="racing-page-hero">
      <p className="racing-kicker">{kicker}</p>
      <h1>{title}</h1>
      <p className="racing-page-description">{description}</p>
      {children && <div className="racing-page-actions">{children}</div>}
    </header>
  )
}
