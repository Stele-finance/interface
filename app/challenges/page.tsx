"use client"

import { Metadata } from "next"
import { ChallengesClientComponents } from "./components/ChallengesClientComponents"

export default function ChallengesPage() {
  return (
    <div className="container mx-auto p-6 py-16">
      <div className="max-w-6xl mx-auto space-y-6">
        <ChallengesClientComponents />
      </div>
    </div>
  )
}