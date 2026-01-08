import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { libraryService } from '../../services/api/libraryService';
import { studentsService } from '../../services/api/studentsService';
import ChildSelector from '../../components/parent/ChildSelector';
import './ParentLibrary.css';

const ParentLibrary = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: childrenData } = useQuery('my-children', () => studentsService.getMyChildren(), {
    refetchOnWindowFocus: false,
  });

  const children = childrenData?.data || [];

  React.useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const { data: books = [], isLoading } = useQuery(
    ['parent-library-books', searchTerm],
    () =>
      libraryService.getBooks({
        search: searchTerm || undefined,
        available_only: true,
      }),
    { refetchOnWindowFocus: false }
  );

  if (children.length === 0) {
    return <div className="empty-state">No children found</div>;
  }

  return (
    <div className="parent-library-page">
      <div className="library-header">
        <h1>Library Books</h1>
        <div className="library-search">
          <input
            type="text"
            placeholder="Search books..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      <div className="library-content">
        {isLoading ? (
          <div className="loading">Loading books...</div>
        ) : books.length === 0 ? (
          <div className="empty-state">No books available</div>
        ) : (
          <div className="books-grid">
            {books.map((book) => (
              <div key={book.id} className="book-card">
                <div className="book-icon">📖</div>
                <div className="book-info">
                  <h3>{book.book_title}</h3>
                  {book.author && <p className="author">By: {book.author}</p>}
                  {book.subject_name && (
                    <p className="subject">Subject: {book.subject_name}</p>
                  )}
                  {book.publisher && <p className="publisher">Publisher: {book.publisher}</p>}
                  {book.isbn_no && <p className="isbn">ISBN: {book.isbn_no}</p>}
                  <div className="book-availability">
                    <span className={`availability-badge ${book.available_qty > 0 ? 'available' : 'unavailable'}`}>
                      {book.available_qty > 0 ? `Available: ${book.available_qty}` : 'Not Available'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentLibrary;

