import { Title, Text } from "~/UI/Typography"

export default function Blog() {
  return (
    <div className="mb-10 flex w-full flex-col items-center">
      <div className="flex max-w-md flex-col gap-y-4">
        <Title>I haven't written anything here yet</Title>
        <Text>But I'm keeping it here to motivate me...</Text>
      </div>
    </div>
  )
}
