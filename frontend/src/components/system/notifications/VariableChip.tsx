interface Props {
  variable: string
  onClick: (variable: string) => void
}

export function VariableChip({ variable, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={() => onClick(variable)}
      className="inline-flex items-center px-2 py-0.5 rounded bg-secondary text-xs font-mono hover:bg-secondary/80 transition-colors"
      title={`Insert {${variable}}`}
    >
      {'{' + variable + '}'}
    </button>
  )
}
