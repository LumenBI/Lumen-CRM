export default function Container({ className = "", children }) {
  return <div className={"container mx-auto px-5 max-w-6xl " + className}>{children}</div>
}
