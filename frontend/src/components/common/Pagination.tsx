import { useState, useEffect } from 'react';
import './Pagination.css';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  showPageInput?: boolean;
  showItemsPerPage?: boolean;
  onItemsPerPageChange?: (limit: number) => void;
  maxItemsPerPage?: number;
}

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  isLoading = false,
  showPageInput = true,
  showItemsPerPage = false,
  onItemsPerPageChange,
  maxItemsPerPage = 100,
}: PaginationProps) => {
  const [pageInput, setPageInput] = useState<string>(String(currentPage));
  const [pageInputError, setPageInputError] = useState<string>('');

  // Update page input when currentPage changes externally
  useEffect(() => {
    setPageInput(String(currentPage));
    setPageInputError('');
  }, [currentPage]);

  // Validation: Ensure currentPage is valid
  const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const validTotalPages = Math.max(0, totalPages);

  // Calculate display range
  const startItem = validTotalPages > 0 ? (validCurrentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(validCurrentPage * itemsPerPage, totalItems);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setPageInput(value);
    setPageInputError('');

    // Allow empty input while typing
    if (value === '') {
      return;
    }

    // Validate input
    const pageNum = Number(value);
    if (isNaN(pageNum) || !Number.isInteger(pageNum)) {
      setPageInputError('Please enter a valid page number');
      return;
    }

    if (pageNum < 1) {
      setPageInputError('Page number must be at least 1');
      return;
    }

    if (validTotalPages > 0 && pageNum > validTotalPages) {
      setPageInputError(`Page number cannot exceed ${validTotalPages}`);
      return;
    }
  };

  const handlePageInputBlur = () => {
    if (pageInput.trim() === '') {
      setPageInput(String(validCurrentPage));
      setPageInputError('');
      return;
    }

    const pageNum = Number(pageInput);
    
    // Validate and correct
    if (isNaN(pageNum) || !Number.isInteger(pageNum) || pageNum < 1) {
      setPageInput(String(validCurrentPage));
      setPageInputError('');
      return;
    }

    if (validTotalPages > 0 && pageNum > validTotalPages) {
      setPageInput(String(validTotalPages));
      setPageInputError('');
      onPageChange(validTotalPages);
      return;
    }

    // If valid and different, navigate
    if (pageNum !== validCurrentPage) {
      onPageChange(pageNum);
    } else {
      setPageInput(String(validCurrentPage));
    }
    setPageInputError('');
  };

  const handlePageInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleFirstPage = () => {
    if (validCurrentPage > 1 && !isLoading) {
      onPageChange(1);
    }
  };

  const handlePreviousPage = () => {
    if (validCurrentPage > 1 && !isLoading) {
      onPageChange(validCurrentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (validCurrentPage < validTotalPages && !isLoading) {
      onPageChange(validCurrentPage + 1);
    }
  };

  const handleLastPage = () => {
    if (validCurrentPage < validTotalPages && !isLoading) {
      onPageChange(validTotalPages);
    }
  };

  // Don't render if no pages or invalid state
  if (validTotalPages <= 1 && totalItems === 0) {
    return null;
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // Maximum visible page numbers

    if (validTotalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= validTotalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of middle range
      let start = Math.max(2, validCurrentPage - 1);
      let end = Math.min(validTotalPages - 1, validCurrentPage + 1);

      // Adjust if near start
      if (validCurrentPage <= 3) {
        start = 2;
        end = Math.min(4, validTotalPages - 1);
      }

      // Adjust if near end
      if (validCurrentPage >= validTotalPages - 2) {
        start = Math.max(2, validTotalPages - 3);
        end = validTotalPages - 1;
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < validTotalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      if (validTotalPages > 1) {
        pages.push(validTotalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="pagination-container">
      {/* Items per page selector (optional) */}
      {showItemsPerPage && onItemsPerPageChange && (
        <div className="pagination-items-per-page">
          <label htmlFor="items-per-page">Items per page:</label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => {
              const newLimit = Number(e.target.value);
              if (newLimit >= 1 && newLimit <= maxItemsPerPage && Number.isInteger(newLimit)) {
                onItemsPerPageChange(newLimit);
                // Reset to page 1 when changing items per page
                onPageChange(1);
              }
            }}
            disabled={isLoading}
            className="pagination-select"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            {maxItemsPerPage >= 100 && <option value="100">100</option>}
          </select>
        </div>
      )}

      {/* Results info */}
      <div className="pagination-info">
        {totalItems > 0 ? (
          <span>
            Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> staff members
          </span>
        ) : (
          <span>No staff members found</span>
        )}
      </div>

      {/* Pagination controls */}
      {validTotalPages > 1 && (
        <div className="pagination-controls">
          {/* First page button */}
          <button
            type="button"
            className="pagination-btn pagination-btn-icon"
            onClick={handleFirstPage}
            disabled={validCurrentPage === 1 || isLoading}
            title="First page"
            aria-label="Go to first page"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 2L3 14M8 2L8 14M13 2L13 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 2L8 7L3 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Previous page button */}
          <button
            type="button"
            className="pagination-btn"
            onClick={handlePreviousPage}
            disabled={validCurrentPage === 1 || isLoading}
            title="Previous page"
            aria-label="Go to previous page"
          >
            Previous
          </button>

          {/* Page numbers */}
          <div className="pagination-pages">
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === validCurrentPage;

              return (
                <button
                  key={pageNum}
                  type="button"
                  className={`pagination-btn pagination-btn-page ${isActive ? 'active' : ''}`}
                  onClick={() => !isActive && !isLoading && onPageChange(pageNum)}
                  disabled={isActive || isLoading}
                  title={`Go to page ${pageNum}`}
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Page input (optional) */}
          {showPageInput && validTotalPages > 5 && (
            <div className="pagination-page-input-wrapper">
              <label htmlFor="page-input" className="pagination-page-input-label">
                Go to:
              </label>
              <input
                id="page-input"
                type="text"
                className={`pagination-page-input ${pageInputError ? 'error' : ''}`}
                value={pageInput}
                onChange={handlePageInputChange}
                onBlur={handlePageInputBlur}
                onKeyPress={handlePageInputKeyPress}
                disabled={isLoading}
                aria-label="Page number"
                aria-invalid={!!pageInputError}
                aria-describedby={pageInputError ? 'page-input-error' : undefined}
              />
              {pageInputError && (
                <span id="page-input-error" className="pagination-page-input-error" role="alert">
                  {pageInputError}
                </span>
              )}
            </div>
          )}

          {/* Next page button */}
          <button
            type="button"
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={validCurrentPage >= validTotalPages || isLoading}
            title="Next page"
            aria-label="Go to next page"
          >
            Next
          </button>

          {/* Last page button */}
          <button
            type="button"
            className="pagination-btn pagination-btn-icon"
            onClick={handleLastPage}
            disabled={validCurrentPage >= validTotalPages || isLoading}
            title="Last page"
            aria-label="Go to last page"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 2L3 14M8 2L8 14M13 2L13 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M13 2L8 7L13 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Page indicator */}
      {validTotalPages > 0 && (
        <div className="pagination-page-indicator">
          Page <strong>{validCurrentPage}</strong> of <strong>{validTotalPages}</strong>
        </div>
      )}
    </div>
  );
};

export default Pagination;
