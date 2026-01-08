import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  libraryService,
  Book,
  LibraryMember,
  BookIssue,
} from '../../services/api/libraryService';
import { academicsService } from '../../services/api/academicsService';
import { studentsService } from '../../services/api/studentsService';
import { hrService } from '../../services/api/hrService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Library.css';

type TabType = 'book-list' | 'issue-return' | 'add-student' | 'add-staff';

const Library = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['book-list', 'issue-return', 'add-student', 'add-staff'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'book-list';

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Scroll to active tab
  const scrollToActiveTab = () => {
    if (activeTabRef.current && tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      
      const scrollLeft = container.scrollLeft;
      const tabLeft = tabRect.left - containerRect.left + scrollLeft;
      const tabWidth = tabRect.width;
      const containerWidth = containerRect.width;
      
      const targetScroll = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  // Check if arrows should be visible
  const checkArrows = () => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const hasOverflow = container.scrollWidth > container.clientWidth;
      
      if (hasOverflow) {
        setShowLeftArrow(container.scrollLeft > 5);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 5
        );
      } else {
        setShowLeftArrow(false);
        setShowRightArrow(false);
      }
    }
  };

  // Scroll tabs left/right
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current;
      const scrollAmount = 250;
      const currentScroll = container.scrollLeft;
      const newScrollLeft = direction === 'left' 
        ? Math.max(0, currentScroll - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, currentScroll + scrollAmount);
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
      
      setTimeout(() => {
        checkArrows();
      }, 300);
    }
  };

  // Initialize and check arrows
  useEffect(() => {
    checkArrows();
    scrollToActiveTab();
  }, []);

  // Check arrows on scroll and window resize
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container) {
      checkArrows();
      container.addEventListener('scroll', checkArrows);
      window.addEventListener('resize', checkArrows);
      
      const resizeObserver = new ResizeObserver(() => {
        checkArrows();
      });
      resizeObserver.observe(container);
      
      return () => {
        container.removeEventListener('scroll', checkArrows);
        window.removeEventListener('resize', checkArrows);
        resizeObserver.disconnect();
      };
    }
  }, []);

  // Scroll to active tab when it changes
  useEffect(() => {
    scrollToActiveTab();
  }, [activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="library-page">
      <div className="page-header">
        <h1>Library</h1>
      </div>

      <div className="library-tabs-wrapper">
        <div className="library-tabs-container">
          {showLeftArrow && (
            <button
              className="library-tabs-arrow library-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="library-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'book-list' ? activeTabRef : null}
              className={activeTab === 'book-list' ? 'active' : ''}
              onClick={() => handleTabChange('book-list')}
            >
              Book List
            </button>
            <button
              ref={activeTab === 'issue-return' ? activeTabRef : null}
              className={activeTab === 'issue-return' ? 'active' : ''}
              onClick={() => handleTabChange('issue-return')}
            >
              Issue Return
            </button>
            <button
              ref={activeTab === 'add-student' ? activeTabRef : null}
              className={activeTab === 'add-student' ? 'active' : ''}
              onClick={() => handleTabChange('add-student')}
            >
              Add Student
            </button>
            <button
              ref={activeTab === 'add-staff' ? activeTabRef : null}
              className={activeTab === 'add-staff' ? 'active' : ''}
              onClick={() => handleTabChange('add-staff')}
            >
              Add Staff Member
            </button>
          </div>
          {showRightArrow && (
            <button
              className="library-tabs-arrow library-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      <div className="library-content">
        {activeTab === 'book-list' && <BookListTab />}
        {activeTab === 'issue-return' && <IssueReturnTab />}
        {activeTab === 'add-student' && <AddStudentTab />}
        {activeTab === 'add-staff' && <AddStaffTab />}
      </div>
    </div>
  );
};

// ========== Book List Tab ==========

const BookListTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: books = [], isLoading, refetch } = useQuery(
    ['books', searchTerm, subjectFilter, availableOnly],
    () =>
      libraryService.getBooks({
        search: searchTerm || undefined,
        subject_id: subjectFilter ? Number(subjectFilter) : undefined,
        available_only: availableOnly,
      }),
    {
      refetchOnWindowFocus: true,
    }
  );

  const { data: subjects = [] } = useQuery('subjects', () =>
    academicsService.getSubjects().then((res) => res.data)
  );

  const [bookFormData, setBookFormData] = useState({
    book_title: '',
    book_no: '',
    isbn_no: '',
    publisher: '',
    author: '',
    subject_id: '',
    rack_no: '',
    qty: '',
    book_price: '',
    inward_date: '',
    description: '',
  });

  const createMutation = useMutation(libraryService.createBook, {
    onSuccess: () => {
      queryClient.invalidateQueries('books');
      refetch();
      showToast('Book created successfully', 'success');
      setShowCreateModal(false);
      resetBookForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create book', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<Book> }) => libraryService.updateBook(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('books');
        refetch();
        showToast('Book updated successfully', 'success');
        setShowEditModal(false);
        setSelectedBook(null);
        resetBookForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update book', 'error');
      },
    }
  );

  const deleteMutation = useMutation(libraryService.deleteBook, {
    onSuccess: () => {
      queryClient.invalidateQueries('books');
      refetch();
      showToast('Book deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete book', 'error');
    },
  });

  const resetBookForm = () => {
    setBookFormData({
      book_title: '',
      book_no: '',
      isbn_no: '',
      publisher: '',
      author: '',
      subject_id: '',
      rack_no: '',
      qty: '',
      book_price: '',
      inward_date: '',
      description: '',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookFormData.book_title || !bookFormData.qty) {
      showToast('Book title and quantity are required', 'error');
      return;
    }

    createMutation.mutate({
      book_title: bookFormData.book_title.trim(),
      book_no: bookFormData.book_no.trim() || undefined,
      isbn_no: bookFormData.isbn_no.trim() || undefined,
      publisher: bookFormData.publisher.trim() || undefined,
      author: bookFormData.author.trim() || undefined,
      subject_id: bookFormData.subject_id ? Number(bookFormData.subject_id) : undefined,
      rack_no: bookFormData.rack_no.trim() || undefined,
      qty: Number(bookFormData.qty),
      book_price: bookFormData.book_price ? Number(bookFormData.book_price) : undefined,
      inward_date: bookFormData.inward_date || undefined,
      description: bookFormData.description.trim() || undefined,
    });
  };

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setBookFormData({
      book_title: book.book_title,
      book_no: book.book_no || '',
      isbn_no: book.isbn_no || '',
      publisher: book.publisher || '',
      author: book.author || '',
      subject_id: book.subject_id?.toString() || '',
      rack_no: book.rack_no || '',
      qty: book.qty.toString(),
      book_price: book.book_price?.toString() || '',
      inward_date: book.inward_date || '',
      description: book.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !bookFormData.book_title || !bookFormData.qty) {
      showToast('Book title and quantity are required', 'error');
      return;
    }

    updateMutation.mutate({
      id: selectedBook.id,
      data: {
        book_title: bookFormData.book_title.trim(),
        book_no: bookFormData.book_no.trim() || undefined,
        isbn_no: bookFormData.isbn_no.trim() || undefined,
        publisher: bookFormData.publisher.trim() || undefined,
        author: bookFormData.author.trim() || undefined,
        subject_id: bookFormData.subject_id ? Number(bookFormData.subject_id) : undefined,
        rack_no: bookFormData.rack_no.trim() || undefined,
        qty: Number(bookFormData.qty),
        book_price: bookFormData.book_price ? Number(bookFormData.book_price) : undefined,
        inward_date: bookFormData.inward_date || undefined,
        description: bookFormData.description.trim() || undefined,
      },
    });
  };

  return (
    <div className="library-tab-content">
      <div className="book-list-header">
        <div className="filters-section">
          <input
            type="text"
            placeholder="Search books..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject: any) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
            />
            Available Only
          </label>
        </div>
        <button className="btn-primary" onClick={() => { resetBookForm(); setShowCreateModal(true); }}>
          + Add Book
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : books.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Book Title</th>
              <th>Book No</th>
              <th>ISBN</th>
              <th>Author</th>
              <th>Subject</th>
              <th>Rack No</th>
              <th>Quantity</th>
              <th>Available</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>{book.book_title}</td>
                <td>{book.book_no || '-'}</td>
                <td>{book.isbn_no || '-'}</td>
                <td>{book.author || '-'}</td>
                <td>{book.subject_name || '-'}</td>
                <td>{book.rack_no || '-'}</td>
                <td>{book.qty}</td>
                <td>
                  <span className={book.available_qty > 0 ? 'available' : 'unavailable'}>
                    {book.available_qty}
                  </span>
                </td>
                <td>{book.book_price ? `$${book.book_price}` : '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-sm btn-secondary"
                      onClick={() => handleEdit(book)}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this book?')) {
                          deleteMutation.mutate(book.id);
                        }
                      }}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No books found</div>
      )}

      {/* Create Book Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetBookForm();
        }}
        title="Add Book"
        size="large"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>
                Book Title <span className="required">*</span>
              </label>
              <input
                type="text"
                value={bookFormData.book_title}
                onChange={(e) => setBookFormData({ ...bookFormData, book_title: e.target.value })}
                required
                placeholder="Enter book title"
              />
            </div>
            <div className="form-group">
              <label>Book No</label>
              <input
                type="text"
                value={bookFormData.book_no}
                onChange={(e) => setBookFormData({ ...bookFormData, book_no: e.target.value })}
                placeholder="Enter book number"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ISBN No</label>
              <input
                type="text"
                value={bookFormData.isbn_no}
                onChange={(e) => setBookFormData({ ...bookFormData, isbn_no: e.target.value })}
                placeholder="Enter ISBN number"
              />
            </div>
            <div className="form-group">
              <label>Publisher</label>
              <input
                type="text"
                value={bookFormData.publisher}
                onChange={(e) => setBookFormData({ ...bookFormData, publisher: e.target.value })}
                placeholder="Enter publisher name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Author</label>
              <input
                type="text"
                value={bookFormData.author}
                onChange={(e) => setBookFormData({ ...bookFormData, author: e.target.value })}
                placeholder="Enter author name"
              />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <select
                value={bookFormData.subject_id}
                onChange={(e) => setBookFormData({ ...bookFormData, subject_id: e.target.value })}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Rack No</label>
              <input
                type="text"
                value={bookFormData.rack_no}
                onChange={(e) => setBookFormData({ ...bookFormData, rack_no: e.target.value })}
                placeholder="Enter rack number"
              />
            </div>
            <div className="form-group">
              <label>
                Quantity <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={bookFormData.qty}
                onChange={(e) => setBookFormData({ ...bookFormData, qty: e.target.value })}
                required
                placeholder="Enter quantity"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Book Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={bookFormData.book_price}
                onChange={(e) => setBookFormData({ ...bookFormData, book_price: e.target.value })}
                placeholder="Enter book price"
              />
            </div>
            <div className="form-group">
              <label>Inward Date</label>
              <input
                type="date"
                value={bookFormData.inward_date}
                onChange={(e) => setBookFormData({ ...bookFormData, inward_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={bookFormData.description}
              onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
              rows={4}
              placeholder="Enter book description"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetBookForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Creating...' : 'Create Book'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Book Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBook(null);
          resetBookForm();
        }}
        title="Edit Book"
        size="large"
      >
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>
                Book Title <span className="required">*</span>
              </label>
              <input
                type="text"
                value={bookFormData.book_title}
                onChange={(e) => setBookFormData({ ...bookFormData, book_title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Book No</label>
              <input
                type="text"
                value={bookFormData.book_no}
                onChange={(e) => setBookFormData({ ...bookFormData, book_no: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ISBN No</label>
              <input
                type="text"
                value={bookFormData.isbn_no}
                onChange={(e) => setBookFormData({ ...bookFormData, isbn_no: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Publisher</label>
              <input
                type="text"
                value={bookFormData.publisher}
                onChange={(e) => setBookFormData({ ...bookFormData, publisher: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Author</label>
              <input
                type="text"
                value={bookFormData.author}
                onChange={(e) => setBookFormData({ ...bookFormData, author: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <select
                value={bookFormData.subject_id}
                onChange={(e) => setBookFormData({ ...bookFormData, subject_id: e.target.value })}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Rack No</label>
              <input
                type="text"
                value={bookFormData.rack_no}
                onChange={(e) => setBookFormData({ ...bookFormData, rack_no: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>
                Quantity <span className="required">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={bookFormData.qty}
                onChange={(e) => setBookFormData({ ...bookFormData, qty: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Book Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={bookFormData.book_price}
                onChange={(e) => setBookFormData({ ...bookFormData, book_price: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Inward Date</label>
              <input
                type="date"
                value={bookFormData.inward_date}
                onChange={(e) => setBookFormData({ ...bookFormData, inward_date: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={bookFormData.description}
              onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedBook(null); resetBookForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? 'Updating...' : 'Update Book'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Issue Return Tab ==========

const IssueReturnTab = () => {
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<BookIssue | null>(null);
  const [statusFilter, setStatusFilter] = useState<'issued' | 'returned' | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: issues = [], isLoading, refetch } = useQuery(
    ['book-issues', statusFilter, searchTerm],
    () =>
      libraryService.getBookIssues({
        return_status: statusFilter || undefined,
        search: searchTerm || undefined,
      }),
    {
      refetchOnWindowFocus: true,
    }
  );

  const { data: books = [] } = useQuery('books', () => libraryService.getBooks({ available_only: true }));
  const { data: members = [] } = useQuery(
    ['library-members', 'all'],
    () => libraryService.getLibraryMembers(),
    {
      refetchOnWindowFocus: true,
    }
  );

  const [issueFormData, setIssueFormData] = useState({
    book_id: '',
    member_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
  });

  const [returnFormData, setReturnFormData] = useState({
    return_date: new Date().toISOString().split('T')[0],
    return_status: 'returned' as 'returned' | 'lost' | 'damaged',
    fine_amount: '',
    remarks: '',
  });

  const issueMutation = useMutation(libraryService.issueBook, {
    onSuccess: () => {
      queryClient.invalidateQueries('book-issues');
      queryClient.invalidateQueries('books');
      refetch();
      showToast('Book issued successfully', 'success');
      setShowIssueModal(false);
      resetIssueForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to issue book', 'error');
    },
  });

  const returnMutation = useMutation(
    (data: { id: number; data: any }) => libraryService.returnBook(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('book-issues');
        queryClient.invalidateQueries('books');
        queryClient.invalidateQueries(['library-members', 'all']);
        refetch();
        showToast('Book returned successfully', 'success');
        setShowReturnModal(false);
        setSelectedIssue(null);
        resetReturnForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to return book', 'error');
      },
    }
  );

  const resetIssueForm = () => {
    setIssueFormData({
      book_id: '',
      member_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
    });
  };

  const resetReturnForm = () => {
    setReturnFormData({
      return_date: new Date().toISOString().split('T')[0],
      return_status: 'returned',
      fine_amount: '',
      remarks: '',
    });
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueFormData.book_id || !issueFormData.member_id || !issueFormData.due_date) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    issueMutation.mutate({
      book_id: Number(issueFormData.book_id),
      member_id: Number(issueFormData.member_id),
      issue_date: issueFormData.issue_date,
      due_date: issueFormData.due_date,
    });
  };

  const handleReturn = (issue: BookIssue) => {
    setSelectedIssue(issue);
    setReturnFormData({
      return_date: new Date().toISOString().split('T')[0],
      return_status: 'returned',
      fine_amount: issue.fine_amount?.toString() || '',
      remarks: '',
    });
    setShowReturnModal(true);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    returnMutation.mutate({
      id: selectedIssue.id,
      data: {
        return_date: returnFormData.return_date,
        return_status: returnFormData.return_status,
        fine_amount: returnFormData.fine_amount ? Number(returnFormData.fine_amount) : undefined,
        remarks: returnFormData.remarks.trim() || undefined,
      },
    });
  };

  const issuedBooks = issues.filter((i) => i.return_status === 'issued');
  const returnedBooks = issues.filter((i) => i.return_status === 'returned');

  return (
    <div className="library-tab-content">
      <div className="issue-return-header">
        <div className="filters-section">
          <input
            type="text"
            placeholder="Search..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="issued">Issued</option>
            <option value="returned">Returned</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => { resetIssueForm(); setShowIssueModal(true); }}>
          Issue Book
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="issue-return-sections">
          <div className="issued-books-section">
            <h3>Currently Issued Books ({issuedBooks.length})</h3>
            {issuedBooks.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Member</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedBooks.map((issue) => (
                    <tr key={issue.id}>
                      <td>{issue.book_title}</td>
                      <td>{issue.member_name} ({issue.member_code_display})</td>
                      <td>{new Date(issue.issue_date).toLocaleDateString()}</td>
                      <td>
                        <span className={new Date(issue.due_date) < new Date() ? 'overdue' : ''}>
                          {new Date(issue.due_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-sm btn-primary"
                          onClick={() => handleReturn(issue)}
                        >
                          Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No books currently issued</div>
            )}
          </div>

          <div className="returned-books-section">
            <h3>Returned Books ({returnedBooks.length})</h3>
            {returnedBooks.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Member</th>
                    <th>Issue Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {returnedBooks.map((issue) => (
                    <tr key={issue.id}>
                      <td>{issue.book_title}</td>
                      <td>{issue.member_name} ({issue.member_code_display})</td>
                      <td>{new Date(issue.issue_date).toLocaleDateString()}</td>
                      <td>{issue.return_date ? new Date(issue.return_date).toLocaleDateString() : '-'}</td>
                      <td>
                        <span className={`status-badge ${issue.return_status}`}>
                          {issue.return_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No books returned yet</div>
            )}
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      <Modal
        isOpen={showIssueModal}
        onClose={() => {
          setShowIssueModal(false);
          resetIssueForm();
        }}
        title="Issue Book"
      >
        <form onSubmit={handleIssueSubmit}>
          <div className="form-group">
            <label>
              Book <span className="required">*</span>
            </label>
            <select
              value={issueFormData.book_id}
              onChange={(e) => setIssueFormData({ ...issueFormData, book_id: e.target.value })}
              required
            >
              <option value="">Select Book</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.book_title} (Available: {book.available_qty})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              Member <span className="required">*</span>
            </label>
            <select
              value={issueFormData.member_id}
              onChange={(e) => setIssueFormData({ ...issueFormData, member_id: e.target.value })}
              required
            >
              <option value="">Select Member</option>
              {members
                .filter((m) => m.status === 'active')
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.member_name} ({member.member_code_display}) - {member.member_type}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Issue Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={issueFormData.issue_date}
                onChange={(e) => setIssueFormData({ ...issueFormData, issue_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Due Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={issueFormData.due_date}
                onChange={(e) => setIssueFormData({ ...issueFormData, due_date: e.target.value })}
                required
                min={issueFormData.issue_date}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowIssueModal(false); resetIssueForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={issueMutation.isLoading}>
              {issueMutation.isLoading ? 'Issuing...' : 'Issue Book'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Return Book Modal */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false);
          setSelectedIssue(null);
          resetReturnForm();
        }}
        title="Return Book"
      >
        {selectedIssue && (
          <form onSubmit={handleReturnSubmit}>
            <div className="return-book-info">
              <p><strong>Book:</strong> {selectedIssue.book_title}</p>
              <p><strong>Member:</strong> {selectedIssue.member_name} ({selectedIssue.member_code_display})</p>
              <p><strong>Issue Date:</strong> {new Date(selectedIssue.issue_date).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> {new Date(selectedIssue.due_date).toLocaleDateString()}</p>
            </div>

            <div className="form-group">
              <label>
                Return Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={returnFormData.return_date}
                onChange={(e) => setReturnFormData({ ...returnFormData, return_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Return Status</label>
              <select
                value={returnFormData.return_status}
                onChange={(e) => setReturnFormData({ ...returnFormData, return_status: e.target.value as any })}
              >
                <option value="returned">Returned</option>
                <option value="lost">Lost</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>

            <div className="form-group">
              <label>Fine Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={returnFormData.fine_amount}
                onChange={(e) => setReturnFormData({ ...returnFormData, fine_amount: e.target.value })}
                placeholder="Enter fine amount if applicable"
              />
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <textarea
                value={returnFormData.remarks}
                onChange={(e) => setReturnFormData({ ...returnFormData, remarks: e.target.value })}
                rows={3}
                placeholder="Enter remarks"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowReturnModal(false); setSelectedIssue(null); resetReturnForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={returnMutation.isLoading}>
                {returnMutation.isLoading ? 'Returning...' : 'Return Book'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

// ========== Add Student Tab ==========

const AddStudentTab = () => {
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: studentsData } = useQuery(
    ['students', classFilter, sectionFilter, searchTerm],
    () =>
      studentsService.getStudents({
        class_id: classFilter ? Number(classFilter) : undefined,
        section_id: sectionFilter ? Number(sectionFilter) : undefined,
        search: searchTerm || undefined,
        page: 1,
        limit: 1000,
      }),
    {
      enabled: !!classFilter && !!sectionFilter,
    }
  );

  const { data: classes = [] } = useQuery('classes', () =>
    academicsService.getClasses().then((res) => res.data)
  );
  const { data: sections = [] } = useQuery('sections', () =>
    academicsService.getSections().then((res) => res.data)
  );

  const { data: libraryMembers = [], refetch: refetchStudentMembers } = useQuery(
    ['library-members', 'student'],
    () => libraryService.getLibraryMembers({ member_type: 'student' }),
    {
      refetchOnWindowFocus: true,
    }
  );

  const students = studentsData?.data || [];
  const memberStudentIds = (libraryMembers || []).map((m: LibraryMember) => m.student_id).filter(Boolean);

  const addMemberMutation = useMutation(libraryService.addStudentMember, {
    onSuccess: () => {
      queryClient.invalidateQueries(['library-members', 'student']);
      refetchStudentMembers();
      showToast('Student added as library member successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to add student as member', 'error');
    },
  });

  const removeMemberMutation = useMutation(libraryService.removeLibraryMember, {
    onSuccess: () => {
      queryClient.invalidateQueries(['library-members', 'student']);
      refetchStudentMembers();
      showToast('Student removed from library members successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to remove student member', 'error');
    },
  });

  const handleAddMember = (studentId: number) => {
    addMemberMutation.mutate(studentId);
  };

  const handleRemoveMember = (memberId: number) => {
    if (window.confirm('Are you sure you want to remove this student from library members?')) {
      removeMemberMutation.mutate(memberId);
    }
  };

  return (
    <div className="library-tab-content">
      <div className="filters-section">
        <div className="form-row">
          <div className="form-group">
            <label>Class</label>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSectionFilter('');
              }}
            >
              <option value="">Select Class</option>
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              disabled={!classFilter}
            >
              <option value="">Select Section</option>
              {sections.map((sec: any) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {classFilter && sectionFilter ? (
        students.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Name</th>
                <th>Roll No</th>
                <th>Class - Section</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student: any) => {
                const isMember = memberStudentIds.includes(student.id);
                const member = libraryMembers.find((m: LibraryMember) => m.student_id === student.id);
                return (
                  <tr key={student.id} className={isMember ? 'member-row' : ''}>
                    <td>{student.admission_no}</td>
                    <td>{student.first_name} {student.last_name || ''}</td>
                    <td>{student.roll_no || '-'}</td>
                    <td>{student.class_name} - {student.section_name}</td>
                    <td>
                      {isMember ? (
                        <span className="status-badge active">Member</span>
                      ) : (
                        <span className="status-badge inactive">Not Member</span>
                      )}
                    </td>
                    <td>
                      {isMember && member ? (
                        <button
                          className="btn-sm btn-danger"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Surrender
                        </button>
                      ) : (
                        <button
                          className="btn-sm btn-primary"
                          onClick={() => handleAddMember(student.id)}
                          disabled={addMemberMutation.isLoading}
                        >
                          Add
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No students found. Please select class and section.</div>
        )
      ) : (
        <div className="empty-state">Please select class and section to view students</div>
      )}
    </div>
  );
};

// ========== Add Staff Tab ==========

const AddStaffTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: staffData } = useQuery(
    ['staff', roleFilter, searchTerm],
    () =>
      hrService.getStaff({
        search: searchTerm || undefined,
        is_active: true,
        page: 1,
        limit: 1000,
      }).then((res) => res.data),
    {
      enabled: true,
    }
  );

  const { data: libraryMembers = [], refetch: refetchMembers } = useQuery(
    ['library-members', 'staff'],
    () => libraryService.getLibraryMembers({ member_type: 'staff' }),
    {
      refetchOnWindowFocus: true,
    }
  );

  const allStaff = staffData || [];
  // Filter by role if selected
  const staff = roleFilter
    ? allStaff.filter((s: any) => s.role_name?.toLowerCase() === roleFilter.toLowerCase())
    : allStaff;
  const memberStaffIds = (libraryMembers || []).map((m: LibraryMember) => m.staff_id).filter(Boolean);

  const addMemberMutation = useMutation(libraryService.addStaffMember, {
    onSuccess: () => {
      queryClient.invalidateQueries(['library-members', 'staff']);
      refetchMembers();
      showToast('Staff added as library member successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to add staff as member', 'error');
    },
  });

  const removeMemberMutation = useMutation(libraryService.removeLibraryMember, {
    onSuccess: () => {
      queryClient.invalidateQueries(['library-members', 'staff']);
      refetchMembers();
      showToast('Staff removed from library members successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to remove staff member', 'error');
    },
  });

  const handleAddMember = (staffId: number) => {
    addMemberMutation.mutate(staffId);
  };

  const handleRemoveMember = (memberId: number) => {
    if (window.confirm('Are you sure you want to remove this staff from library members?')) {
      removeMemberMutation.mutate(memberId);
    }
  };

  return (
    <div className="library-tab-content">
      <div className="filters-section">
        <div className="form-row">
          <div className="form-group">
            <label>Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
              <option value="librarian">Librarian</option>
              <option value="accountant">Accountant</option>
              <option value="receptionist">Receptionist</option>
            </select>
          </div>
          <div className="form-group">
            <label>Search</label>
            <input className="search-input"
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {staff.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Staff ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((staffMember: any) => {
              const isMember = memberStaffIds.includes(staffMember.id);
              const member = libraryMembers.find((m: LibraryMember) => m.staff_id === staffMember.id);
              return (
                <tr key={staffMember.id} className={isMember ? 'member-row' : ''}>
                  <td>{staffMember.staff_id}</td>
                  <td>{staffMember.first_name} {staffMember.last_name || ''}</td>
                  <td>{staffMember.role_name || '-'}</td>
                  <td>{staffMember.department_name || '-'}</td>
                  <td>
                    {isMember ? (
                      <span className="status-badge active">Member</span>
                    ) : (
                      <span className="status-badge inactive">Not Member</span>
                    )}
                  </td>
                  <td>
                    {isMember && member ? (
                      <button
                        className="btn-sm btn-danger"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Surrender
                      </button>
                    ) : (
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => handleAddMember(staffMember.id)}
                        disabled={addMemberMutation.isLoading}
                      >
                        Add
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No staff found</div>
      )}
    </div>
  );
};

export default Library;

