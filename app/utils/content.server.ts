import path from "path";
import { promises as fs } from "fs";

export const getContent = async (
  fileName: string
): Promise<{ success: boolean; content: string }> => {
  if (process.env.DEPLOYMENT === "production") {
    const response = await fetch(
      `https://api.github.com/repos/brundagejoe/joebrundage.com/contents/content/${fileName}`
    );
    const unwrappedResponse = await response.json();
    if (unwrappedResponse.content) {
      return {
        success: true,
        content: atob(unwrappedResponse.content),
      };
    }
    return {
      success: false,
      content: "bad",
    };
  }

  const jsonDirectory = path.join(process.cwd(), "/content");
  const fileContents = await fs.readFile(
    jsonDirectory + `/${fileName}`,
    "utf8"
  );
  return {
    success: true,
    content: fileContents,
  };
};
