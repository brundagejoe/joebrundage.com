import { MagnifyingGlassIcon } from "@radix-ui/react-icons"
import { useState } from "react"

const SimpleSearchBar = ({
  onSearch,
  placeholder = "Search",
}: {
  placeholder?: string
  onSearch?: (text: string) => void
}) => {
  const [searchText, setSearchText] = useState("")
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
        className="w-[300px] rounded-full border border-gray-300 py-2 pl-4 pr-12"
        placeholder={placeholder}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            setSearchText("")
            onSearch?.(searchText)
          }
        }}
      />
    </div>
  )
}
export default SimpleSearchBar
