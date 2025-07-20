import { Metadata } from "next"
import { RecentChallengesTable } from "./components/RecentChallengesTable"

export const metadata: Metadata = {
  title: "Challenges - Stele",
  description: "View and participate in investment challenges",
}

export default function ChallengesPage() {
  return (
    <div className="container mx-auto p-6 py-16">
      <div className="max-w-6xl mx-auto space-y-6">
        <RecentChallengesTable />
      </div>
    </div>
  )
} 