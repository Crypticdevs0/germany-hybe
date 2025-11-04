interface SecurityBadgeProps {
  icon: string
  title: string
  description: string
}

export default function SecurityBadge({ icon, title, description }: SecurityBadgeProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center shadow-sm">
      <div className="mb-2 text-2xl">{icon}</div>
      <p className="font-semibold text-foreground text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
