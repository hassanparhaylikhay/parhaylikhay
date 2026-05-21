import type { Metadata } from "next"
import TryClient from "./TryClient"

export const metadata: Metadata = {
  title: "Try Parhaylikhay · learn maths by doing it",
  description:
    "Most Pakistani students learn maths by reading and watching. Parhaylikhay teaches them by doing. Cambridge O-Level Maths, taught through manipulatives and guided Lesson Mode.",
  openGraph: {
    title: "Try Parhaylikhay · learn maths by doing it",
    description:
      "Cambridge O-Level Maths taught through manipulatives and guided Lesson Mode. 4,800+ marked questions. 15 years of papers. Built for Pakistani students.",
    type: "website",
  },
}

export default function TryPage() {
  return <TryClient />
}
