interface FormProgressProps {
  currentSection: number
  totalSections: number
}

export default function FormProgress({ currentSection, totalSections }: FormProgressProps) {
  const percentage = ((currentSection + 1) / totalSections) * 100

  return (
    <div className="mb-8 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">
          Fortschritt: {currentSection + 1} von {totalSections}
        </span>
        <span className="text-muted-foreground">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
