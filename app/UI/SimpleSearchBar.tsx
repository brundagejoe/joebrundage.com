import { MagnifyingGlassIcon } from "@radix-ui/react-icons"
import { useRef, useState } from "react"

const SimpleSearchBar = ({
  onSearch,
  persistSearch,
  defaultSearch,
  placeholder = "Search",
}: {
  placeholder?: string
  persistSearch?: boolean
  defaultSearch?: string
  onSearch?: (text: string) => void
}) => {
  const [searchText, setSearchText] = useState(defaultSearch ?? "")

  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className="relative">
      <MagnifyingGlassIcon
        onClick={() => {
          setSearchText("")
          onSearch?.(searchText)
        }}
        className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 cursor-pointer"
      />
      <input
        ref={ref}
        className="w-[300px] rounded-full border border-gray-300 py-2 pl-4 pr-12"
        placeholder={placeholder}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            !persistSearch && setSearchText("")
            ref.current?.blur()
            onSearch?.(searchText)
          }
        }}
      />
    </div>
  )
}
export default SimpleSearchBar
