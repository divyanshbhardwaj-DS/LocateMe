export default function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="relative grid h-12 w-12 place-items-center">
        <span className="absolute inline-flex h-12 w-12 rounded-full bg-mint/20 animate-ping2" />
        <span className="absolute inset-0 rounded-full border-2 border-mint/20 border-t-mint" />
      </div>
      <p className="font-body text-sm text-fog">{label}</p>
    </div>
  )
}
