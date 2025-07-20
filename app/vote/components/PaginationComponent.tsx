"use client"

import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { PaginationComponentProps } from "./types"
import { generatePageNumbers } from "../utils/pagination"

// Pagination component
export function PaginationComponent({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: PaginationComponentProps) {
  if (totalPages <= 1) return null

  const pageNumbers = generatePageNumbers(currentPage, totalPages)

  return (
    <div className="flex justify-center mt-6">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-800"}
            />
          </PaginationItem>
          
          {pageNumbers.map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
                className="cursor-pointer hover:bg-gray-800"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-800"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
} 