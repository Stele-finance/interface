"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type PageType = 'challenge' | 'fund'

interface PageTypeContextType {
  pageType: PageType
  setPageType: (type: PageType) => void
}

const PageTypeContext = createContext<PageTypeContextType | undefined>(undefined)

interface PageTypeProviderProps {
  children: ReactNode
}

export function PageTypeProvider({ children }: PageTypeProviderProps) {
  const [pageType, setPageType] = useState<PageType>('challenge')

  // Determine page type based on current URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname
      if (path.includes('/fund')) {
        setPageType('fund')
      } else if (path.includes('/challenge')) {
        setPageType('challenge')
      }
    }
  }, [])

  // Listen to route changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleLocationChange = () => {
        const path = window.location.pathname
        if (path.includes('/fund')) {
          setPageType('fund')
        } else if (path.includes('/challenge')) {
          setPageType('challenge')
        }
      }

      // Listen to popstate for browser back/forward
      window.addEventListener('popstate', handleLocationChange)
      
      return () => {
        window.removeEventListener('popstate', handleLocationChange)
      }
    }
  }, [])

  return (
    <PageTypeContext.Provider value={{ pageType, setPageType }}>
      {children}
    </PageTypeContext.Provider>
  )
}

export function usePageType() {
  const context = useContext(PageTypeContext)
  if (context === undefined) {
    throw new Error('usePageType must be used within a PageTypeProvider')
  }
  return context
}