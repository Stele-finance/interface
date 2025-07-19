'use client'

import { useEffect, useState } from 'react'

export function AppKitInitializer() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Initialize AppKit after component mounts with a small delay
    const timer = setTimeout(() => {
      import("@/lib/appkit-config").then(() => {
        setInitialized(true)
      }).catch((error) => {
        console.error('Failed to initialize AppKit:', error)
      })
    }, 100) // Small delay to ensure DOM is ready

    return () => clearTimeout(timer)
  }, [])

  return null
} 