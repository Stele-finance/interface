import { Proposal } from "../components/types"

// Pagination helper functions
export const getPaginatedData = (data: Proposal[], page: number, itemsPerPage: number) => {
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  return data.slice(startIndex, endIndex)
}

export const getTotalPages = (dataLength: number, itemsPerPage: number) => {
  return Math.ceil(dataLength / itemsPerPage)
}

export const generatePageNumbers = (currentPage: number, totalPages: number, maxVisiblePages: number = 5) => {
  const pages = []
  
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    const startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
  }
  
  return pages
}

// Helper to calculate pagination info text
export const getPaginationInfo = (
  currentPage: number, 
  itemsPerPage: number, 
  totalCount: number
) => {
  const startItem = ((currentPage - 1) * itemsPerPage) + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalCount)
  
  return {
    startItem,
    endItem,
    totalCount,
    hasMultiplePages: totalCount > itemsPerPage
  }
} 