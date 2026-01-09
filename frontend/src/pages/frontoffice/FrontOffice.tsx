import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { frontofficeService, AdmissionEnquiry, Visitor, PhoneCallLog, PostalDispatch, PostalReceive, Complain } from '../../services/api/frontofficeService';
import { academicsService } from '../../services/api/academicsService';
import { usersService } from '../../services/api/usersService';
import './FrontOffice.css';

const FrontOffice = () => {
  const [activeTab, setActiveTab] = useState<'enquiries' | 'visitors' | 'calls' | 'postal' | 'complains' | 'setup'>('enquiries');
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

  return (
    <div className="frontoffice-page">
      <div className="page-header">
        <h1>Front Office</h1>
      </div>

      <div className="frontoffice-tabs-wrapper">
        <div className="frontoffice-tabs-container">
          {showLeftArrow && (
            <button
              className="frontoffice-tabs-arrow frontoffice-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="frontoffice-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'enquiries' ? activeTabRef : null}
              className={activeTab === 'enquiries' ? 'active' : ''}
              onClick={() => setActiveTab('enquiries')}
            >
              Admission Enquiries
            </button>
            <button
              ref={activeTab === 'visitors' ? activeTabRef : null}
              className={activeTab === 'visitors' ? 'active' : ''}
              onClick={() => setActiveTab('visitors')}
            >
              Visitor Book
            </button>
            <button
              ref={activeTab === 'calls' ? activeTabRef : null}
              className={activeTab === 'calls' ? 'active' : ''}
              onClick={() => setActiveTab('calls')}
            >
              Phone Call Log
            </button>
            <button
              ref={activeTab === 'postal' ? activeTabRef : null}
              className={activeTab === 'postal' ? 'active' : ''}
              onClick={() => setActiveTab('postal')}
            >
              Postal
            </button>
            <button
              ref={activeTab === 'complains' ? activeTabRef : null}
              className={activeTab === 'complains' ? 'active' : ''}
              onClick={() => setActiveTab('complains')}
            >
              Complains
            </button>
            <button
              ref={activeTab === 'setup' ? activeTabRef : null}
              className={activeTab === 'setup' ? 'active' : ''}
              onClick={() => setActiveTab('setup')}
            >
              Setup
            </button>
          </div>
          {showRightArrow && (
            <button
              className="frontoffice-tabs-arrow frontoffice-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      <div className="frontoffice-content">
        {activeTab === 'enquiries' && <AdmissionEnquiriesTab />}
        {activeTab === 'visitors' && <VisitorBookTab />}
        {activeTab === 'calls' && <PhoneCallLogTab />}
        {activeTab === 'postal' && <PostalTab />}
        {activeTab === 'complains' && <ComplainsTab />}
        {activeTab === 'setup' && <SetupTab />}
      </div>
    </div>
  );
};

// Admission Enquiries Tab
const AdmissionEnquiriesTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<AdmissionEnquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data: enquiriesData, isLoading } = useQuery(
    ['admission-enquiries', statusFilter, searchTerm],
    () => frontofficeService.getAdmissionEnquiries({ status: statusFilter || undefined, search: searchTerm || undefined })
  );

  const { data: classesData } = useQuery('classes', () => academicsService.getClasses());
  const { data: sourcesData } = useQuery('sources', () => frontofficeService.getSources());
  const { data: referencesData } = useQuery('references', () => frontofficeService.getReferences());
  const { data: usersData } = useQuery('users', () => usersService.getUsers());

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    note: '',
    enquiry_date: new Date().toISOString().split('T')[0],
    next_follow_up_date: '',
    assigned_to: '',
    reference_id: '',
    source_id: '',
    class_id: '',
    number_of_child: 1,
    status: 'pending' as 'pending' | 'contacted' | 'enrolled' | 'rejected',
  });

  const createMutation = useMutation(frontofficeService.createAdmissionEnquiry, {
    onSuccess: () => {
      queryClient.invalidateQueries('admission-enquiries');
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => frontofficeService.updateAdmissionEnquiry(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admission-enquiries');
        setShowModal(false);
        resetForm();
      },
    }
  );

  const deleteMutation = useMutation(frontofficeService.deleteAdmissionEnquiry, {
    onSuccess: () => {
      queryClient.invalidateQueries('admission-enquiries');
    },
  });

  const followUpMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => frontofficeService.addEnquiryFollowUp(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admission-enquiries');
        setShowFollowUpModal(false);
      },
    }
  );

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      description: '',
      note: '',
      enquiry_date: new Date().toISOString().split('T')[0],
      next_follow_up_date: '',
      assigned_to: '',
      reference_id: '',
      source_id: '',
      class_id: '',
      number_of_child: 1,
      status: 'pending',
    });
    setSelectedEnquiry(null);
  };

  const handleEdit = (enquiry: AdmissionEnquiry) => {
    setSelectedEnquiry(enquiry);
    setFormData({
      name: enquiry.name,
      phone: enquiry.phone || '',
      email: enquiry.email || '',
      address: enquiry.address || '',
      description: enquiry.description || '',
      note: enquiry.note || '',
      enquiry_date: enquiry.enquiry_date,
      next_follow_up_date: enquiry.next_follow_up_date || '',
      assigned_to: String(enquiry.assigned_to || ''),
      reference_id: String(enquiry.reference_id || ''),
      source_id: String(enquiry.source_id || ''),
      class_id: String(enquiry.class_id || ''),
      number_of_child: enquiry.number_of_child,
      status: enquiry.status,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      ...formData,
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
      reference_id: formData.reference_id ? Number(formData.reference_id) : null,
      source_id: formData.source_id ? Number(formData.source_id) : null,
      class_id: formData.class_id ? Number(formData.class_id) : null,
    };

    if (selectedEnquiry) {
      updateMutation.mutate({ id: String(selectedEnquiry.id), data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleFollowUp = (enquiry: AdmissionEnquiry) => {
    setSelectedEnquiry(enquiry);
    setShowFollowUpModal(true);
  };

  const handleFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = {
      follow_up_date: formData.get('follow_up_date') as string,
      next_follow_up_date: formData.get('next_follow_up_date') as string || undefined,
      response: formData.get('response') as string || undefined,
      note: formData.get('note') as string || undefined,
    };
    if (selectedEnquiry) {
      followUpMutation.mutate({ id: String(selectedEnquiry.id), data });
    }
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Admission Enquiries</h3>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Add Enquiry
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="enrolled">Enrolled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Class</th>
                <th>Source</th>
                <th>Status</th>
                <th>Enquiry Date</th>
                <th>Next Follow Up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiriesData?.data.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td>{enquiry.name}</td>
                  <td>{enquiry.phone || '-'}</td>
                  <td>{enquiry.email || '-'}</td>
                  <td>{enquiry.class_name || '-'}</td>
                  <td>{enquiry.source_name || '-'}</td>
                  <td>
                    <span className={`status-badge ${enquiry.status}`}>
                      {enquiry.status}
                    </span>
                  </td>
                  <td>{new Date(enquiry.enquiry_date).toLocaleDateString()}</td>
                  <td>{enquiry.next_follow_up_date ? new Date(enquiry.next_follow_up_date).toLocaleDateString() : '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleFollowUp(enquiry)} className="btn-view">Follow Up</button>
                      <button onClick={() => handleEdit(enquiry)} className="btn-edit">Edit</button>
                      <button onClick={() => { if (window.confirm('Delete this enquiry?')) deleteMutation.mutate(String(enquiry.id)); }} className="btn-delete">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedEnquiry ? 'Edit Enquiry' : 'Add Admission Enquiry'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Enquiry Date *</label>
                  <input
                    type="date"
                    value={formData.enquiry_date}
                    onChange={(e) => setFormData({ ...formData, enquiry_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Class</label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  >
                    <option value="">Select Class</option>
                    {classesData?.data.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Source</label>
                  <select
                    value={formData.source_id}
                    onChange={(e) => setFormData({ ...formData, source_id: e.target.value })}
                  >
                    <option value="">Select Source</option>
                    {sourcesData?.data.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Reference</label>
                  <select
                    value={formData.reference_id}
                    onChange={(e) => setFormData({ ...formData, reference_id: e.target.value })}
                  >
                    <option value="">Select Reference</option>
                    {referencesData?.data.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assigned To</label>
                  <select
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  >
                    <option value="">Select User</option>
                    {usersData?.data.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Number of Children</label>
                  <input
                    type="number"
                    value={formData.number_of_child}
                    onChange={(e) => setFormData({ ...formData, number_of_child: Number(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Next Follow Up Date</label>
                <input
                  type="date"
                  value={formData.next_follow_up_date}
                  onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
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
              <div className="form-group">
                <label>Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary">{selectedEnquiry ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFollowUpModal && selectedEnquiry && (
        <div className="modal-overlay" onClick={() => setShowFollowUpModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Follow Up - {selectedEnquiry.name}</h2>
            <form onSubmit={handleFollowUpSubmit}>
              <div className="form-group">
                <label>Follow Up Date *</label>
                <input type="date" name="follow_up_date" required defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label>Next Follow Up Date</label>
                <input type="date" name="next_follow_up_date" />
              </div>
              <div className="form-group">
                <label>Response</label>
                <textarea name="response" rows={3} />
              </div>
              <div className="form-group">
                <label>Note</label>
                <textarea name="note" rows={2} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowFollowUpModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Follow Up</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Visitor Book Tab
const VisitorBookTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data: visitorsData, isLoading } = useQuery(
    ['visitors', dateFilter, searchTerm],
    () => frontofficeService.getVisitors({ date: dateFilter || undefined, search: searchTerm || undefined })
  );

  const { data: purposesData } = useQuery('purposes', () => frontofficeService.getPurposes());

  const [formData, setFormData] = useState({
    purpose_id: '',
    name: '',
    phone: '',
    id_card: '',
    number_of_person: 1,
    visit_date: new Date().toISOString().split('T')[0],
    in_time: new Date().toTimeString().slice(0, 5),
    out_time: '',
    note: '',
  });

  const createMutation = useMutation(frontofficeService.createVisitor, {
    onSuccess: () => {
      queryClient.invalidateQueries('visitors');
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => frontofficeService.updateVisitor(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('visitors');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      purpose_id: '',
      name: '',
      phone: '',
      id_card: '',
      number_of_person: 1,
      visit_date: new Date().toISOString().split('T')[0],
      in_time: new Date().toTimeString().slice(0, 5),
      out_time: '',
      note: '',
    });
  };

  const handleCheckOut = (visitor: Visitor) => {
    const outTime = new Date().toTimeString().slice(0, 5);
    updateMutation.mutate({ id: String(visitor.id), data: { out_time: outTime } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      purpose_id: formData.purpose_id ? Number(formData.purpose_id) : undefined,
    });
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Visitor Book</h3>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Add Visitor
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="filter-select"
        />
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Purpose</th>
                <th>Visit Date</th>
                <th>In Time</th>
                <th>Out Time</th>
                <th>Persons</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visitorsData?.data.map((visitor) => (
                <tr key={visitor.id}>
                  <td>{visitor.name}</td>
                  <td>{visitor.phone || '-'}</td>
                  <td>{visitor.purpose_name || '-'}</td>
                  <td>{new Date(visitor.visit_date).toLocaleDateString()}</td>
                  <td>{visitor.in_time}</td>
                  <td>{visitor.out_time || '-'}</td>
                  <td>{visitor.number_of_person}</td>
                  <td>
                    {!visitor.out_time && (
                      <button onClick={() => handleCheckOut(visitor)} className="btn-edit">Check Out</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Visitor</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>ID Card</label>
                  <input
                    type="text"
                    value={formData.id_card}
                    onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Purpose</label>
                  <select
                    value={formData.purpose_id}
                    onChange={(e) => setFormData({ ...formData, purpose_id: e.target.value })}
                  >
                    <option value="">Select Purpose</option>
                    {purposesData?.data.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Number of Persons</label>
                  <input
                    type="number"
                    value={formData.number_of_person}
                    onChange={(e) => setFormData({ ...formData, number_of_person: Number(e.target.value) })}
                    min="1"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Visit Date *</label>
                  <input
                    type="date"
                    value={formData.visit_date}
                    onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>In Time *</label>
                  <input
                    type="time"
                    value={formData.in_time}
                    onChange={(e) => setFormData({ ...formData, in_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary">Add Visitor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Phone Call Log Tab
const PhoneCallLogTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [callTypeFilter, setCallTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data: logsData, isLoading } = useQuery(
    ['phone-call-logs', dateFilter, callTypeFilter, searchTerm],
    () => frontofficeService.getPhoneCallLogs({ date: dateFilter || undefined, call_type: callTypeFilter || undefined, search: searchTerm || undefined })
  );

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    call_date: new Date().toISOString().split('T')[0],
    call_time: new Date().toTimeString().slice(0, 5),
    description: '',
    next_follow_up_date: '',
    call_duration: '',
    note: '',
    call_type: 'incoming' as 'incoming' | 'outgoing',
  });

  const createMutation = useMutation(frontofficeService.createPhoneCallLog, {
    onSuccess: () => {
      queryClient.invalidateQueries('phone-call-logs');
      setShowModal(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      call_date: new Date().toISOString().split('T')[0],
      call_time: new Date().toTimeString().slice(0, 5),
      description: '',
      next_follow_up_date: '',
      call_duration: '',
      note: '',
      call_type: 'incoming',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Phone Call Log</h3>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Add Call Log
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="filter-select"
        />
        <select
          value={callTypeFilter}
          onChange={(e) => setCallTypeFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          <option value="incoming">Incoming</option>
          <option value="outgoing">Outgoing</option>
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Call Date</th>
                <th>Call Time</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Description</th>
                <th>Next Follow Up</th>
              </tr>
            </thead>
            <tbody>
              {logsData?.data.map((log) => (
                <tr key={log.id}>
                  <td>{log.name}</td>
                  <td>{log.phone}</td>
                  <td>{new Date(log.call_date).toLocaleDateString()}</td>
                  <td>{log.call_time || '-'}</td>
                  <td>
                    <span className={`status-badge ${log.call_type}`}>
                      {log.call_type}
                    </span>
                  </td>
                  <td>{log.call_duration || '-'}</td>
                  <td>{log.description || '-'}</td>
                  <td>{log.next_follow_up_date ? new Date(log.next_follow_up_date).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Phone Call Log</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Call Date *</label>
                  <input
                    type="date"
                    value={formData.call_date}
                    onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Call Time</label>
                  <input
                    type="time"
                    value={formData.call_time}
                    onChange={(e) => setFormData({ ...formData, call_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Call Type</label>
                  <select
                    value={formData.call_type}
                    onChange={(e) => setFormData({ ...formData, call_type: e.target.value as any })}
                  >
                    <option value="incoming">Incoming</option>
                    <option value="outgoing">Outgoing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Call Duration</label>
                  <input
                    type="text"
                    value={formData.call_duration}
                    onChange={(e) => setFormData({ ...formData, call_duration: e.target.value })}
                    placeholder="e.g., 5 min"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Next Follow Up Date</label>
                <input
                  type="date"
                  value={formData.next_follow_up_date}
                  onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
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
              <div className="form-group">
                <label>Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary">Add Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Postal Tab
const PostalTab = () => {
  const [activeSubTab, setActiveSubTab] = useState<'dispatch' | 'receive'>('dispatch');

  return (
    <div className="tab-content">
      <div className="sub-tabs">
        <button
          className={activeSubTab === 'dispatch' ? 'active' : ''}
          onClick={() => setActiveSubTab('dispatch')}
        >
          Postal Dispatch
        </button>
        <button
          className={activeSubTab === 'receive' ? 'active' : ''}
          onClick={() => setActiveSubTab('receive')}
        >
          Postal Receive
        </button>
      </div>

      {activeSubTab === 'dispatch' && <PostalDispatchSubTab />}
      {activeSubTab === 'receive' && <PostalReceiveSubTab />}
    </div>
  );
};

// Postal Dispatch Sub Tab
const PostalDispatchSubTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data: dispatchData, isLoading } = useQuery(
    ['postal-dispatch', dateFilter, searchTerm],
    () => frontofficeService.getPostalDispatch({ date: dateFilter || undefined, search: searchTerm || undefined })
  );

  const [formData, setFormData] = useState({
    to_title: '',
    reference_no: '',
    address: '',
    note: '',
    from_title: '',
    dispatch_date: new Date().toISOString().split('T')[0],
  });

  const createMutation = useMutation(frontofficeService.createPostalDispatch, {
    onSuccess: () => {
      queryClient.invalidateQueries('postal-dispatch');
      setShowModal(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      to_title: '',
      reference_no: '',
      address: '',
      note: '',
      from_title: '',
      dispatch_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <>
      <div className="section-header">
        <h3>Postal Dispatch</h3>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Add Dispatch
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="filter-select"
        />
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>To</th>
                <th>From</th>
                <th>Reference No</th>
                <th>Dispatch Date</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {dispatchData?.data.map((item) => (
                <tr key={item.id}>
                  <td>{item.to_title}</td>
                  <td>{item.from_title || '-'}</td>
                  <td>{item.reference_no || '-'}</td>
                  <td>{new Date(item.dispatch_date).toLocaleDateString()}</td>
                  <td>{item.address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Postal Dispatch</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>To Title *</label>
                <input
                  type="text"
                  value={formData.to_title}
                  onChange={(e) => setFormData({ ...formData, to_title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>From Title</label>
                <input
                  type="text"
                  value={formData.from_title}
                  onChange={(e) => setFormData({ ...formData, from_title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Reference No</label>
                <input
                  type="text"
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Dispatch Date *</label>
                <input
                  type="date"
                  value={formData.dispatch_date}
                  onChange={(e) => setFormData({ ...formData, dispatch_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary">Add Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Postal Receive Sub Tab
const PostalReceiveSubTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data: receiveData, isLoading } = useQuery(
    ['postal-receive', dateFilter, searchTerm],
    () => frontofficeService.getPostalReceive({ date: dateFilter || undefined, search: searchTerm || undefined })
  );

  const [formData, setFormData] = useState({
    from_title: '',
    reference_no: '',
    address: '',
    note: '',
    to_title: '',
    receive_date: new Date().toISOString().split('T')[0],
  });

  const createMutation = useMutation(frontofficeService.createPostalReceive, {
    onSuccess: () => {
      queryClient.invalidateQueries('postal-receive');
      setShowModal(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      from_title: '',
      reference_no: '',
      address: '',
      note: '',
      to_title: '',
      receive_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <>
      <div className="section-header">
        <h3>Postal Receive</h3>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Add Receive
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="filter-select"
        />
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Reference No</th>
                <th>Receive Date</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {receiveData?.data.map((item) => (
                <tr key={item.id}>
                  <td>{item.from_title}</td>
                  <td>{item.to_title || '-'}</td>
                  <td>{item.reference_no || '-'}</td>
                  <td>{new Date(item.receive_date).toLocaleDateString()}</td>
                  <td>{item.address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Postal Receive</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>From Title *</label>
                <input
                  type="text"
                  value={formData.from_title}
                  onChange={(e) => setFormData({ ...formData, from_title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>To Title</label>
                <input
                  type="text"
                  value={formData.to_title}
                  onChange={(e) => setFormData({ ...formData, to_title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Reference No</label>
                <input
                  type="text"
                  value={formData.reference_no}
                  onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Receive Date *</label>
                <input
                  type="date"
                  value={formData.receive_date}
                  onChange={(e) => setFormData({ ...formData, receive_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary">Add Receive</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Complains Tab
const ComplainsTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedComplain, setSelectedComplain] = useState<Complain | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const queryClient = useQueryClient();

  const { data: complainsData, isLoading } = useQuery(
    ['complains', statusFilter, searchTerm],
    () => frontofficeService.getComplains({ status: statusFilter || undefined, search: searchTerm || undefined })
  );

  const { data: complainTypesData } = useQuery('complain-types', () => frontofficeService.getComplainTypes());
  const { data: sourcesData } = useQuery('sources', () => frontofficeService.getSources());
  const { data: usersData } = useQuery('users', () => usersService.getUsers());

  const [formData, setFormData] = useState({
    complain_type_id: '',
    source_id: '',
    complain_by: '',
    phone: '',
    complain_date: new Date().toISOString().split('T')[0],
    description: '',
    action_taken: '',
    assigned_to: '',
    note: '',
    status: 'pending' as 'pending' | 'in_progress' | 'resolved' | 'closed',
  });

  const createMutation = useMutation(frontofficeService.createComplain, {
    onSuccess: () => {
      queryClient.invalidateQueries('complains');
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => frontofficeService.updateComplain(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('complains');
        setShowModal(false);
        resetForm();
      },
    }
  );

  const resetForm = () => {
    setFormData({
      complain_type_id: '',
      source_id: '',
      complain_by: '',
      phone: '',
      complain_date: new Date().toISOString().split('T')[0],
      description: '',
      action_taken: '',
      assigned_to: '',
      note: '',
      status: 'pending',
    });
    setSelectedComplain(null);
  };

  const handleEdit = (complain: Complain) => {
    setSelectedComplain(complain);
    setFormData({
      complain_type_id: String(complain.complain_type_id || ''),
      source_id: String(complain.source_id || ''),
      complain_by: complain.complain_by,
      phone: complain.phone || '',
      complain_date: complain.complain_date,
      description: complain.description,
      action_taken: complain.action_taken || '',
      assigned_to: String(complain.assigned_to || ''),
      note: complain.note || '',
      status: complain.status,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      ...formData,
      complain_type_id: formData.complain_type_id ? Number(formData.complain_type_id) : null,
      source_id: formData.source_id ? Number(formData.source_id) : null,
      assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
    };

    if (selectedComplain) {
      updateMutation.mutate({ id: String(selectedComplain.id), data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Complains</h3>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Add Complain
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Complain By</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Complain Date</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complainsData?.data.map((complain) => (
                <tr key={complain.id}>
                  <td>{complain.complain_by}</td>
                  <td>{complain.phone || '-'}</td>
                  <td>{complain.complain_type_name || '-'}</td>
                  <td>{new Date(complain.complain_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${complain.status}`}>
                      {complain.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{complain.assigned_name || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEdit(complain)} className="btn-edit">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedComplain ? 'Edit Complain' : 'Add Complain'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Complain By *</label>
                  <input
                    type="text"
                    value={formData.complain_by}
                    onChange={(e) => setFormData({ ...formData, complain_by: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Complain Type</label>
                  <select
                    value={formData.complain_type_id}
                    onChange={(e) => setFormData({ ...formData, complain_type_id: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    {complainTypesData?.data.map((ct: any) => (
                      <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Source</label>
                  <select
                    value={formData.source_id}
                    onChange={(e) => setFormData({ ...formData, source_id: e.target.value })}
                  >
                    <option value="">Select Source</option>
                    {sourcesData?.data.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Complain Date *</label>
                  <input
                    type="date"
                    value={formData.complain_date}
                    onChange={(e) => setFormData({ ...formData, complain_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Assigned To</label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                >
                  <option value="">Select User</option>
                  {usersData?.data.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div className="form-group">
                <label>Action Taken</label>
                <textarea
                  value={formData.action_taken}
                  onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary">{selectedComplain ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Setup Tab
const SetupTab = () => {
  const [activeSetupTab, setActiveSetupTab] = useState<'purposes' | 'complain-types' | 'sources' | 'references'>('purposes');

  return (
    <div className="tab-content">
      <div className="sub-tabs">
        <button
          className={activeSetupTab === 'purposes' ? 'active' : ''}
          onClick={() => setActiveSetupTab('purposes')}
        >
          Purposes
        </button>
        <button
          className={activeSetupTab === 'complain-types' ? 'active' : ''}
          onClick={() => setActiveSetupTab('complain-types')}
        >
          Complain Types
        </button>
        <button
          className={activeSetupTab === 'sources' ? 'active' : ''}
          onClick={() => setActiveSetupTab('sources')}
        >
          Sources
        </button>
        <button
          className={activeSetupTab === 'references' ? 'active' : ''}
          onClick={() => setActiveSetupTab('references')}
        >
          References
        </button>
      </div>

      {activeSetupTab === 'purposes' && <SetupListTab title="Purposes" queryKey="purposes" service={frontofficeService.getPurposes} createService={frontofficeService.createPurpose} />}
      {activeSetupTab === 'complain-types' && <SetupListTab title="Complain Types" queryKey="complain-types" service={frontofficeService.getComplainTypes} createService={frontofficeService.createComplainType} />}
      {activeSetupTab === 'sources' && <SetupListTab title="Sources" queryKey="sources" service={frontofficeService.getSources} createService={frontofficeService.createSource} />}
      {activeSetupTab === 'references' && <SetupListTab title="References" queryKey="references" service={frontofficeService.getReferences} createService={frontofficeService.createReference} />}
    </div>
  );
};

// Setup List Tab Component
const SetupListTab = ({ title, queryKey, service, createService }: any) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const queryClient = useQueryClient();

  const { data } = useQuery(queryKey, service);

  const createMutation = useMutation((data: any) => createService(data), {
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);
      setShowModal(false);
      setFormData({ name: '', description: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <>
      <div className="section-header">
        <h3>{title}</h3>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add {title.slice(0, -1)}</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {(data && typeof data === 'object' && 'data' in data && Array.isArray(data.data) ? data.data : []).map((item: any) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setFormData({ name: '', description: '' }); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add {title.slice(0, -1)}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
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
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowModal(false); setFormData({ name: '', description: '' }); }}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FrontOffice;
