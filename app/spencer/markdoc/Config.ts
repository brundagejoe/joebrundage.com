import type { Config } from "@markdoc/markdoc"

import {
  Book,
  ModernChapter,
  OriginalChapter,
  Section,
  Subsection,
} from "./Components"

export const config: Config = {
  tags: {
    Book: {
      render: "Book",
      attributes: {
        text: {
          type: String,
        },
      },
    },
    Section: {
      render: "Section",
      attributes: {
        heading: {
          type: String,
        },
        subheading: {
          type: String,
        },
      },
    },
    Subsection: {
      render: "Subsection",
      attributes: {
        heading: {
          type: String,
        },
      },
    },
    verse: {
      render: "sup",
    },
    break: {
      render: "br",
    },
    OriginalChapter: {
      render: "OriginalChapter",
      attributes: {
        text: {
          type: String,
        },
      },
    },
    ModernChapter: {
      render: "ModernChapter",
      attributes: {
        text: {
          type: String,
        },
      },
    },
  },
}

export const components = {
  components: {
    OriginalChapter: OriginalChapter,
    Book: Book,
    Section: Section,
    Subsection: Subsection,
    ModernChapter: ModernChapter,
  },
}
