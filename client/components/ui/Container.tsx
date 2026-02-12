export default function Container({ className = "", children }: { className?: string, children: React.ReactNode }) {
  return <div className={"container mx-auto px-5 max-w-6xl " + className}>{children}</div>
}
