import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { feesService } from '../../services/api/feesService';
import { studentsService } from '../../services/api/studentsService';
import ChildSelector from '../../components/parent/ChildSelector';
import './ParentFees.css';

const ParentFees = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [statusFilter, setStatusFilter] = useState('');
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

  const { data: childrenData } = useQuery('my-children', () => studentsService.getMyChildren(), {
    refetchOnWindowFocus: false,
  });

  const children = childrenData?.data || [];

  React.useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery(
    ['parent-fees-invoices', selectedChildId, statusFilter],
    () =>
      feesService.getStudentFeesInvoices({
        student_id: selectedChildId || undefined,
        status: statusFilter || undefined,
      }),
    { enabled: !!selectedChildId, refetchOnWindowFocus: false }
  );

  const { data: payments = [], isLoading: paymentsLoading } = useQuery(
    ['parent-fees-payments', selectedChildId],
    () =>
      feesService.getFeesPayments({
        student_id: selectedChildId,
      }),
    { enabled: !!selectedChildId, refetchOnWindowFocus: false }
  );

  const totalAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount?.toString() || '0'), 0);
  const paidAmount = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.paid_amount?.toString() || '0'), 0);
  const pendingAmount = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + parseFloat(inv.balance_amount?.toString() || '0'), 0);


  if (children.length === 0) {
    return <div className="empty-state">No children found</div>;
  }

  return (
    <div className="parent-fees-page">
      <div className="fees-header">
        <h1>Fees</h1>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      {selectedChildId && (
        <>
          <div className="fees-summary">
            <div className="summary-card">
              <h3>Total Amount</h3>
              <p className="amount">₹{totalAmount.toFixed(2)}</p>
            </div>
            <div className="summary-card paid">
              <h3>Paid</h3>
              <p className="amount">₹{paidAmount.toFixed(2)}</p>
            </div>
            <div className="summary-card pending">
              <h3>Pending</h3>
              <p className="amount">₹{pendingAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="fees-content">
            <div className="fees-tabs-wrapper">
              <div className="fees-tabs-container">
                {showLeftArrow && (
                  <button
                    className="fees-tabs-arrow fees-tabs-arrow-left"
                    onClick={() => scrollTabs('left')}
                    aria-label="Scroll tabs left"
                  >
                    ‹
                  </button>
                )}
                <div className="fees-tabs" ref={tabsContainerRef}>
                  <button
                    ref={activeTab === 'invoices' ? activeTabRef : null}
                    className={activeTab === 'invoices' ? 'active' : ''}
                    onClick={() => setActiveTab('invoices')}
                  >
                    Fees Invoices
                  </button>
                  <button
                    ref={activeTab === 'payments' ? activeTabRef : null}
                    className={activeTab === 'payments' ? 'active' : ''}
                    onClick={() => setActiveTab('payments')}
                  >
                    Payment History
                  </button>
                </div>
                {showRightArrow && (
                  <button
                    className="fees-tabs-arrow fees-tabs-arrow-right"
                    onClick={() => scrollTabs('right')}
                    aria-label="Scroll tabs right"
                  >
                    ›
                  </button>
                )}
              </div>
            </div>

            {activeTab === 'invoices' && (
              <>
                <div className="fees-filters">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div className="fees-table-container">
                  <table className="fees-table">
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Fee Type</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Due Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="empty-state">
                            No fees invoices found
                          </td>
                        </tr>
                      ) : (
                        invoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td>{invoice.invoice_no}</td>
                            <td>{invoice.fees_type_name || '-'}</td>
                            <td>₹{parseFloat(invoice.amount?.toString() || '0').toFixed(2)}</td>
                            <td>₹{parseFloat(invoice.paid_amount?.toString() || '0').toFixed(2)}</td>
                            <td>₹{parseFloat(invoice.balance_amount?.toString() || '0').toFixed(2)}</td>
                            <td>
                              {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                            </td>
                            <td>
                              <span className={`fee-status ${invoice.status}`}>{invoice.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'payments' && (
              <div className="fees-table-container">
                <table className="fees-table">
                  <thead>
                    <tr>
                      <th>Payment ID</th>
                      <th>Invoice No</th>
                      <th>Fee Type</th>
                      <th>Amount</th>
                      <th>Payment Date</th>
                      <th>Payment Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          No payment records found
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{payment.payment_id}</td>
                          <td>{payment.invoice_no || '-'}</td>
                          <td>{payment.fees_type_name || '-'}</td>
                          <td>₹{parseFloat(payment.amount?.toString() || '0').toFixed(2)}</td>
                          <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                          <td>{payment.payment_mode || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ParentFees;

