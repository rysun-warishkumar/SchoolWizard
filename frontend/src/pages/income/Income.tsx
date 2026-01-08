import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { incomeService, IncomeHead, Income as IncomeType } from '../../services/api/incomeService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Income.css';

type TabType = 'income-heads' | 'add-income' | 'search-income';

const Income = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['income-heads', 'add-income', 'search-income'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'income-heads';

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
    <div className="income-page">
      <div className="page-header">
        <h1>Income</h1>
      </div>

      <div className="income-tabs-wrapper">
        <div className="income-tabs-container">
          {showLeftArrow && (
            <button
              className="income-tabs-arrow income-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="income-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'income-heads' ? activeTabRef : null}
              className={activeTab === 'income-heads' ? 'active' : ''}
              onClick={() => handleTabChange('income-heads')}
            >
              Income Head
            </button>
            <button
              ref={activeTab === 'add-income' ? activeTabRef : null}
              className={activeTab === 'add-income' ? 'active' : ''}
              onClick={() => handleTabChange('add-income')}
            >
              Add Income
            </button>
            <button
              ref={activeTab === 'search-income' ? activeTabRef : null}
              className={activeTab === 'search-income' ? 'active' : ''}
              onClick={() => handleTabChange('search-income')}
            >
              Search Income
            </button>
          </div>
          {showRightArrow && (
            <button
              className="income-tabs-arrow income-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      <div className="income-content">
        {activeTab === 'income-heads' && <IncomeHeadsTab />}
        {activeTab === 'add-income' && <AddIncomeTab />}
        {activeTab === 'search-income' && <SearchIncomeTab />}
      </div>
    </div>
  );
};

// ========== Tab Components ==========

const IncomeHeadsTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: incomeHeads, isLoading } = useQuery('income-heads', incomeService.getIncomeHeads);

  const createMutation = useMutation(incomeService.createIncomeHead, {
    onSuccess: () => {
      queryClient.invalidateQueries('income-heads');
      showToast('Income head created successfully', 'success');
      setShowModal(false);
      setFormData({ name: '', description: '' });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create income head', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="income-tab-content">
      <div className="tab-header">
        <h2>Income Heads</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Income Head
        </button>
      </div>

      <div className="income-heads-layout">
        <div className="income-heads-form-section">
          <div className="empty-state">Select an income head from the list to view details</div>
        </div>
        <div className="income-heads-list-section">
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : incomeHeads && incomeHeads.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {incomeHeads.map((head) => (
                  <tr key={head.id}>
                    <td>{head.name}</td>
                    <td>{head.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No income heads found</div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData({ name: '', description: '' });
        }}
        title="Add Income Head"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Income Head <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const AddIncomeTab = () => {
  const [formData, setFormData] = useState({
    income_head_id: '',
    name: '',
    invoice_number: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: incomeHeads } = useQuery('income-heads', incomeService.getIncomeHeads);
  const { data: recentIncome } = useQuery('recent-income', () => incomeService.getRecentIncome(10));

  const createMutation = useMutation(incomeService.createIncome, {
    onSuccess: () => {
      queryClient.invalidateQueries('recent-income');
      queryClient.invalidateQueries('income');
      showToast('Income recorded successfully', 'success');
      setFormData({
        income_head_id: '',
        name: '',
        invoice_number: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
      });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to record income', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.income_head_id || !formData.name || !formData.date || !formData.amount) {
      showToast('Income head, name, date, and amount are required', 'error');
      return;
    }
    if (Number(formData.amount) < 0) {
      showToast('Amount must be positive', 'error');
      return;
    }

    createMutation.mutate({
      income_head_id: Number(formData.income_head_id),
      name: formData.name.trim(),
      invoice_number: formData.invoice_number || undefined,
      date: formData.date,
      amount: Number(formData.amount),
      description: formData.description || undefined,
    });
  };

  return (
    <div className="income-tab-content">
      <div className="tab-header">
        <h2>Add Income</h2>
      </div>

      <div className="add-income-layout">
        <div className="add-income-form-section">
          <form onSubmit={handleSubmit} className="income-form">
            <div className="form-group">
              <label>
                Income Head <span className="required">*</span>
              </label>
              <select
                value={formData.income_head_id}
                onChange={(e) => setFormData({ ...formData, income_head_id: e.target.value })}
                required
              >
                <option value="">Select Income Head</option>
                {incomeHeads?.map((head) => (
                  <option key={head.id} value={head.id}>
                    {head.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Income Name <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Invoice Number</label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>
                Date of Income <span className="required">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>
                Amount <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
        <div className="recent-income-section">
          <h3>Recently Added Income</h3>
          {recentIncome && recentIncome.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentIncome.map((income) => (
                  <tr key={income.id}>
                    <td>{new Date(income.date).toLocaleDateString()}</td>
                    <td>{income.name}</td>
                    <td>₹{income.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No recent income records</div>
          )}
        </div>
      </div>
    </div>
  );
};

const SearchIncomeTab = () => {
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [searchResults, setSearchResults] = useState<IncomeType[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { showToast } = useToast();

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const result = await incomeService.getIncome({
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        search: filters.search || undefined,
        page,
        limit: 20,
      });
      setSearchResults(result.data);
      setPagination(result.pagination);
      if (result.data.length === 0) {
        showToast('No income records found', 'info');
      }
    } catch (error: any) {
      showToast('Failed to search income', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="income-tab-content">
      <div className="tab-header">
        <h2>Search Income</h2>
      </div>

      <div className="search-income-filters">
        <div className="form-row">
          <div className="form-group">
            <label>Date From</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Date To</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Keyword</label>
            <input
              type="text"
              placeholder="Search by name, invoice number, or description..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        <button className="btn-primary" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="search-results">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Income Head</th>
                <th>Name</th>
                <th>Invoice Number</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((income) => (
                <tr key={income.id}>
                  <td>{new Date(income.date).toLocaleDateString()}</td>
                  <td>{income.income_head_name}</td>
                  <td>{income.name}</td>
                  <td>{income.invoice_number || '-'}</td>
                  <td>₹{income.amount}</td>
                  <td>{income.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Income;

