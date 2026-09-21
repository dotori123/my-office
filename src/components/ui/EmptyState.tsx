export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10">
      <p className="text-body-sm text-mid">{text}</p>
    </div>
  )
}
