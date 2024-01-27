import type { LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { getJsonContent } from "~/utils/content.server"

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const fileName = params.fileName as string

  const response = await getJsonContent(fileName)
  if (!response.success) {
    return json(
      {
        success: false,
        message: "Unable to find requested content",
      },
      {
        status: 404,
        statusText: "Unable to find requested content",
      },
    )
  }
  const content = JSON.parse(response.content)
  return json(
    {
      success: true,
      content,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}
