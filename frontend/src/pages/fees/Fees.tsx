import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  feesService,
  FeesType,
  FeesGroup,
  FeesMaster,
  FeesDiscount,
  FeesInvoice,
  FeesPayment,
  FeesCarryForward,
  FeesReminderSetting,
  FeesReminderLog,
} from '../../services/api/feesService';
import { settingsService } from '../../services/api/settingsService';
import { academicsService } from '../../services/api/academicsService';
import { studentsService } from '../../services/api/studentsService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Fees.css';

type TabType =
  | 'fees-types'
  | 'fees-groups'
  | 'fees-master'
  | 'fees-discounts'
  | 'collect-fees'
  | 'search-payment'
  | 'due-fees'
  | 'carry-forward'
  | 'reminder';

const Fees = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = [
    'fees-types',
    'fees-groups',
    'fees-master',
    'fees-discounts',
    'collect-fees',
    'search-payment',
    'due-fees',
    'carry-forward',
    'reminder',
  ];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'fees-types';

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setTimeout(() => {
      scrollToActiveTab();
    }, 100);
  };

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

      const targetScroll = tabLeft - containerWidth / 2 + tabWidth / 2;

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
      // Only show arrows if tabs overflow the container width
      const hasOverflow = container.scrollWidth > container.clientWidth;
      
      if (hasOverflow) {
        setShowLeftArrow(container.scrollLeft > 5);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 5
        );
      } else {
        // Hide arrows if no overflow
        setShowLeftArrow(false);
        setShowRightArrow(false);
      }
    }
  };

  // Scroll tabs left/right
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 250;
      const container = tabsContainerRef.current;
      const currentScroll = container.scrollLeft;
      const newScrollLeft =
        direction === 'left'
          ? Math.max(0, currentScroll - scrollAmount)
          : Math.min(
              container.scrollWidth - container.clientWidth,
              currentScroll + scrollAmount
            );

      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });

      setTimeout(() => {
        checkArrows();
      }, 300);
    }
  };

  // Initialize tab from URL and check arrows
  useEffect(() => {
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
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
    <div className="fees-page">
      <div className="page-header">
        <h1>Fees Collection</h1>
      </div>

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
              ref={activeTab === 'fees-types' ? activeTabRef : null}
              className={activeTab === 'fees-types' ? 'active' : ''}
              onClick={() => handleTabChange('fees-types')}
            >
              Fees Types
            </button>
            <button
              ref={activeTab === 'fees-groups' ? activeTabRef : null}
              className={activeTab === 'fees-groups' ? 'active' : ''}
              onClick={() => handleTabChange('fees-groups')}
            >
              Fees Groups
            </button>
            <button
              ref={activeTab === 'fees-master' ? activeTabRef : null}
              className={activeTab === 'fees-master' ? 'active' : ''}
              onClick={() => handleTabChange('fees-master')}
            >
              Fees Master
            </button>
            <button
              ref={activeTab === 'fees-discounts' ? activeTabRef : null}
              className={activeTab === 'fees-discounts' ? 'active' : ''}
              onClick={() => handleTabChange('fees-discounts')}
            >
              Fees Discount
            </button>
            <button
              ref={activeTab === 'collect-fees' ? activeTabRef : null}
              className={activeTab === 'collect-fees' ? 'active' : ''}
              onClick={() => handleTabChange('collect-fees')}
            >
              Collect Fees
            </button>
            <button
              ref={activeTab === 'search-payment' ? activeTabRef : null}
              className={activeTab === 'search-payment' ? 'active' : ''}
              onClick={() => handleTabChange('search-payment')}
            >
              Search Payment
            </button>
            <button
              ref={activeTab === 'due-fees' ? activeTabRef : null}
              className={activeTab === 'due-fees' ? 'active' : ''}
              onClick={() => handleTabChange('due-fees')}
            >
              Due Fees
            </button>
            <button
              ref={activeTab === 'carry-forward' ? activeTabRef : null}
              className={activeTab === 'carry-forward' ? 'active' : ''}
              onClick={() => handleTabChange('carry-forward')}
            >
              Carry Forward
            </button>
            <button
              ref={activeTab === 'reminder' ? activeTabRef : null}
              className={activeTab === 'reminder' ? 'active' : ''}
              onClick={() => handleTabChange('reminder')}
            >
              Fees Reminder
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

      <div className="fees-content">
        {activeTab === 'fees-types' && <FeesTypesTab />}
        {activeTab === 'fees-groups' && <FeesGroupsTab />}
        {activeTab === 'fees-master' && <FeesMasterTab />}
        {activeTab === 'fees-discounts' && <FeesDiscountsTab />}
        {activeTab === 'collect-fees' && <CollectFeesTab />}
        {activeTab === 'search-payment' && <SearchPaymentTab />}
        {activeTab === 'due-fees' && <DueFeesTab />}
        {activeTab === 'carry-forward' && <CarryForwardTab />}
        {activeTab === 'reminder' && <ReminderTab />}
      </div>
    </div>
  );
};

// ========== Tab Components ==========

const FeesTypesTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: feesTypes, isLoading } = useQuery('fees-types', feesService.getFeesTypes);

  const createMutation = useMutation(feesService.createFeesType, {
    onSuccess: () => {
      queryClient.invalidateQueries('fees-types');
      showToast('Fees type created successfully', 'success');
      setShowModal(false);
      setFormData({ name: '', code: '', description: '' });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create fees type', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('Name and code are required', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="fees-tab-content">
      <div className="tab-header">
        <h2>Fees Types</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Fees Type
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="fees-types-list">
          {feesTypes && feesTypes.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {feesTypes.map((type) => (
                  <tr key={type.id}>
                    <td>{type.code}</td>
                    <td>{type.name}</td>
                    <td>{type.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No fees types found</div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData({ name: '', code: '', description: '' });
        }}
        title="Add Fees Type"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>
              Code <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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

const FeesGroupsTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FeesGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fees_type_ids: [] as number[],
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: feesGroups, isLoading } = useQuery('fees-groups', feesService.getFeesGroups);
  const { data: feesTypes } = useQuery('fees-types', feesService.getFeesTypes);

  const createMutation = useMutation(feesService.createFeesGroup, {
    onSuccess: () => {
      queryClient.invalidateQueries('fees-groups');
      showToast('Fees group created successfully', 'success');
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create fees group', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => feesService.updateFeesGroup(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('fees-groups');
        showToast('Fees group updated successfully', 'success');
        setShowModal(false);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update fees group', 'error');
      },
    }
  );

  const resetForm = () => {
    setFormData({ name: '', description: '', fees_type_ids: [] });
    setEditingGroup(null);
  };

  const handleEdit = async (group: FeesGroup) => {
    try {
      const fullGroup = await feesService.getFeesGroupById(group.id);
      setEditingGroup(fullGroup);
      setFormData({
        name: fullGroup.name,
        description: fullGroup.description || '',
        fees_type_ids: fullGroup.fees_types?.map((ft) => ft.id) || [],
      });
      setShowModal(true);
    } catch (error: any) {
      showToast('Failed to load fees group details', 'error');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleFeesType = (typeId: number) => {
    setFormData((prev) => ({
      ...prev,
      fees_type_ids: prev.fees_type_ids.includes(typeId)
        ? prev.fees_type_ids.filter((id) => id !== typeId)
        : [...prev.fees_type_ids, typeId],
    }));
  };

  return (
    <div className="fees-tab-content">
      <div className="tab-header">
        <h2>Fees Groups</h2>
        <button
          className="btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Fees Group
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="fees-groups-list">
          {feesGroups && feesGroups.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Fees Types</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feesGroups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.name}</td>
                    <td>{group.description || '-'}</td>
                    <td>
                      {group.fees_types && group.fees_types.length > 0
                        ? group.fees_types.map((ft) => ft.name).join(', ')
                        : '-'}
                    </td>
                    <td>
                      <button
                        className="btn-sm btn-secondary"
                        onClick={() => handleEdit(group)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No fees groups found</div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingGroup ? 'Edit Fees Group' : 'Add Fees Group'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Name <span className="required">*</span>
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
          <div className="form-group">
            <label>Fees Types</label>
            <div className="checkbox-group">
              {feesTypes?.map((type) => (
                <label key={type.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.fees_type_ids.includes(type.id)}
                    onChange={() => toggleFeesType(type.id)}
                  />
                  <span>
                    {type.name} ({type.code})
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {createMutation.isLoading || updateMutation.isLoading
                ? 'Saving...'
                : editingGroup
                ? 'Update'
                : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const FeesMasterTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFeesGroup, setSelectedFeesGroup] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<number | ''>('');
  const [formData, setFormData] = useState({
    fees_group_id: '',
    fees_type_id: '',
    session_id: '',
    amount: '',
    due_date: '',
    fine_type: 'percentage' as 'percentage' | 'fixed',
    fine_amount: '',
  });
  
  // Assignment modal state
  const [assignMode, setAssignMode] = useState<'class' | 'student'>('class');
  const [assignClassId, setAssignClassId] = useState('');
  const [assignSectionId, setAssignSectionId] = useState('');
  const [assignStudentIds, setAssignStudentIds] = useState<number[]>([]);
  const [assignSearchTerm, setAssignSearchTerm] = useState('');

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: feesMaster, isLoading } = useQuery(
    ['fees-master', selectedSession],
    () => feesService.getFeesMaster(selectedSession ? { session_id: Number(selectedSession) } : undefined),
    { enabled: true }
  );

  const { data: feesGroups } = useQuery('fees-groups', feesService.getFeesGroups);
  const { data: feesTypes } = useQuery('fees-types', feesService.getFeesTypes);
  const { data: sessionsData } = useQuery('sessions', () => settingsService.getSessions());
  const { data: classesResponse } = useQuery('classes', academicsService.getClasses, {
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const classes = Array.isArray(classesResponse?.data) ? classesResponse.data : [];
  
  const { data: sectionsResponse } = useQuery(
    ['sections', assignClassId],
    () => academicsService.getSections(assignClassId ? Number(assignClassId) : undefined),
    {
      refetchOnWindowFocus: false,
      retry: 1,
      enabled: assignMode === 'class' && !!assignClassId,
    }
  );
  const sections = Array.isArray(sectionsResponse?.data) ? sectionsResponse.data : [];
  
  const { data: studentsResponse } = useQuery(
    ['students-for-assignment', assignClassId, assignSectionId, assignSearchTerm],
    () =>
      studentsService.getStudents({
        class_id: assignClassId ? Number(assignClassId) : undefined,
        section_id: assignSectionId ? Number(assignSectionId) : undefined,
        search: assignSearchTerm || undefined,
        page: 1,
        limit: 1000,
      }),
    {
      enabled: assignMode === 'student' && (!!assignClassId || !!assignSearchTerm),
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );
  const availableStudents = Array.isArray(studentsResponse?.data) ? studentsResponse.data : [];

  const sessions = sessionsData?.data || [];
  const currentSession = sessions.find((s) => s.is_current) || sessions[0];

  // Set default session on mount
  useEffect(() => {
    if (currentSession && !selectedSession) {
      setSelectedSession(currentSession.id);
    }
  }, [currentSession]);

  const createMutation = useMutation(feesService.createFeesMaster, {
    onSuccess: () => {
      queryClient.invalidateQueries('fees-master');
      showToast('Fees master created successfully', 'success');
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create fees master', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      fees_group_id: '',
      fees_type_id: '',
      session_id: selectedSession ? String(selectedSession) : '',
      amount: '',
      due_date: '',
      fine_type: 'percentage',
      fine_amount: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fees_group_id || !formData.fees_type_id || !formData.session_id) {
      showToast('Fees group, fees type, and session are required', 'error');
      return;
    }
    if (!formData.amount || Number(formData.amount) < 0) {
      showToast('Amount is required and must be positive', 'error');
      return;
    }

    createMutation.mutate({
      fees_group_id: Number(formData.fees_group_id),
      fees_type_id: Number(formData.fees_type_id),
      session_id: Number(formData.session_id),
      amount: Number(formData.amount),
      due_date: formData.due_date || undefined,
      fine_type: formData.fine_type,
      fine_amount: formData.fine_amount ? Number(formData.fine_amount) : 0,
    });
  };

  // Update session_id when selectedSession changes
  useEffect(() => {
    if (selectedSession) {
      setFormData((prev) => ({ ...prev, session_id: String(selectedSession) }));
    }
  }, [selectedSession]);

  const handleAssignClick = (feesGroupId: number, feesGroupName: string) => {
    const group = feesGroups?.find((g: any) => g.id === feesGroupId);
    setSelectedFeesGroup({ id: feesGroupId, name: feesGroupName, ...group });
    setAssignMode('class');
    setAssignClassId('');
    setAssignSectionId('');
    setAssignStudentIds([]);
    setAssignSearchTerm('');
    setShowAssignModal(true);
  };

  const assignMutation = useMutation(feesService.assignFeesGroup, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('fees-master');
      queryClient.invalidateQueries('fees-invoices');
      showToast(data.message || 'Fees group assigned successfully', 'success');
      setShowAssignModal(false);
      setSelectedFeesGroup(null);
      setAssignClassId('');
      setAssignSectionId('');
      setAssignStudentIds([]);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to assign fees group', 'error');
    },
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeesGroup || !selectedSession) {
      showToast('Please select fees group and session', 'error');
      return;
    }

    if (assignMode === 'class') {
      if (!assignClassId || !assignSectionId) {
        showToast('Please select both class and section', 'error');
        return;
      }
      assignMutation.mutate({
        fees_group_id: selectedFeesGroup.id,
        session_id: Number(selectedSession),
        class_id: Number(assignClassId),
        section_id: Number(assignSectionId),
      });
    } else {
      if (assignStudentIds.length === 0) {
        showToast('Please select at least one student', 'error');
        return;
      }
      assignMutation.mutate({
        fees_group_id: selectedFeesGroup.id,
        session_id: Number(selectedSession),
        student_ids: assignStudentIds,
      });
    }
  };

  return (
    <div className="fees-tab-content">
      <div className="tab-header">
        <h2>Fees Master</h2>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Session:</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value ? Number(e.target.value) : '')}
              style={{ minWidth: '200px' }}
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} {session.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + Add Fees Master
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="fees-master-list">
          {feesMaster && feesMaster.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fees Group</th>
                  <th>Fees Type</th>
                  <th>Code</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Fine Type</th>
                  <th>Fine Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {feesMaster.map((master) => (
                  <tr key={master.id}>
                    <td>{master.fees_group_name}</td>
                    <td>{master.fees_type_name}</td>
                    <td>{master.fees_type_code}</td>
                    <td>₹{master.amount}</td>
                    <td>{master.due_date ? new Date(master.due_date).toLocaleDateString() : '-'}</td>
                    <td>
                      <span className="badge">
                        {master.fine_type === 'percentage' ? 'Percentage' : 'Fixed'}
                      </span>
                    </td>
                    <td>
                      {master.fine_type === 'percentage'
                        ? `${master.fine_amount}%`
                        : `₹${master.fine_amount}`}
                    </td>
                    <td>
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => handleAssignClick(master.fees_group_id, master.fees_group_name || '')}
                        title="Assign/View Fees Group"
                      >
                        Assign/View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              No fees master entries found for selected session
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title="Add Fees Master"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Session <span className="required">*</span>
            </label>
            <select
              value={formData.session_id}
              onChange={(e) => setFormData({ ...formData, session_id: e.target.value })}
              required
            >
              <option value="">Select Session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} {session.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>
              Fees Group <span className="required">*</span>
            </label>
            <select
              value={formData.fees_group_id}
              onChange={(e) => setFormData({ ...formData, fees_group_id: e.target.value })}
              required
            >
              <option value="">Select Fees Group</option>
              {feesGroups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>
              Fees Type <span className="required">*</span>
            </label>
            <select
              value={formData.fees_type_id}
              onChange={(e) => setFormData({ ...formData, fees_type_id: e.target.value })}
              required
            >
              <option value="">Select Fees Type</option>
              {feesTypes?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.code})
                </option>
              ))}
            </select>
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
            <label>Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Fine Type</label>
            <select
              value={formData.fine_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fine_type: e.target.value as 'percentage' | 'fixed',
                })
              }
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div className="form-group">
            <label>Fine Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.fine_amount}
              onChange={(e) => setFormData({ ...formData, fine_amount: e.target.value })}
            />
            <small>
              {formData.fine_type === 'percentage'
                ? 'Enter percentage (e.g., 5 for 5%)'
                : 'Enter amount in currency'}
            </small>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Fees Group Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedFeesGroup(null);
          setAssignClassId('');
          setAssignSectionId('');
          setAssignStudentIds([]);
          setAssignSearchTerm('');
        }}
        title={`Assign Fees Group: ${selectedFeesGroup?.name || ''}`}
      >
        <form onSubmit={handleAssignSubmit}>
          <div className="form-group">
            <label>
              Assignment Mode <span className="required">*</span>
            </label>
            <select
              value={assignMode}
              onChange={(e) => {
                setAssignMode(e.target.value as 'class' | 'student');
                setAssignClassId('');
                setAssignSectionId('');
                setAssignStudentIds([]);
                setAssignSearchTerm('');
              }}
              required
            >
              <option value="class">Assign to Class-Section</option>
              <option value="student">Assign to Individual Students</option>
            </select>
          </div>

          {assignMode === 'class' ? (
            <>
              <div className="form-group">
                <label>
                  Class <span className="required">*</span>
                </label>
                <select
                  value={assignClassId}
                  onChange={(e) => {
                    setAssignClassId(e.target.value);
                    setAssignSectionId('');
                  }}
                  required
                >
                  <option value="">Select Class</option>
                  {Array.isArray(classes) && classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Section <span className="required">*</span>
                </label>
                <select
                  value={assignSectionId}
                  onChange={(e) => setAssignSectionId(e.target.value)}
                  disabled={!assignClassId}
                  required
                >
                  <option value="">Select Section</option>
                  {Array.isArray(sections) && sections.map((sec: any) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label>Search Students</label>
                <input
                  type="text"
                  placeholder="Search by name or admission no..."
                  value={assignSearchTerm}
                  onChange={(e) => setAssignSearchTerm(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Class (Optional - for filtering)</label>
                <select
                  value={assignClassId}
                  onChange={(e) => {
                    setAssignClassId(e.target.value);
                    setAssignSectionId('');
                  }}
                >
                  <option value="">All Classes</option>
                  {Array.isArray(classes) && classes.map((cls: any) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Section (Optional - for filtering)</label>
                <select
                  value={assignSectionId}
                  onChange={(e) => setAssignSectionId(e.target.value)}
                  disabled={!assignClassId}
                >
                  <option value="">All Sections</option>
                  {Array.isArray(sections) && sections.map((sec: any) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Select Students <span className="required">*</span>
                </label>
                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                  {availableStudents.length > 0 ? (
                    availableStudents.map((student: any) => (
                      <label
                        key={student.id}
                        style={{ display: 'block', padding: '8px', cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={assignStudentIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignStudentIds([...assignStudentIds, student.id]);
                            } else {
                              setAssignStudentIds(assignStudentIds.filter((id) => id !== student.id));
                            }
                          }}
                        />
                        <span style={{ marginLeft: '8px' }}>
                          {student.admission_no} - {student.first_name} {student.last_name || ''}
                          {student.class_name && ` (${student.class_name}${student.section_name ? '-' + student.section_name : ''})`}
                        </span>
                      </label>
                    ))
                  ) : (
                    <div className="empty-state">No students found</div>
                  )}
                </div>
                {assignStudentIds.length > 0 && (
                  <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
                    {assignStudentIds.length} student(s) selected
                  </small>
                )}
              </div>
            </>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowAssignModal(false);
                setSelectedFeesGroup(null);
                setAssignClassId('');
                setAssignSectionId('');
                setAssignStudentIds([]);
                setAssignSearchTerm('');
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={assignMutation.isLoading}
            >
              {assignMutation.isLoading ? 'Assigning...' : 'Assign Fees Group'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const FeesDiscountsTab = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    amount: '',
    discount_type: 'fixed' as 'percentage' | 'fixed',
    description: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: discounts, isLoading } = useQuery('fees-discounts', feesService.getFeesDiscounts);

  const createMutation = useMutation(feesService.createFeesDiscount, {
    onSuccess: () => {
      queryClient.invalidateQueries('fees-discounts');
      showToast('Fees discount created successfully', 'success');
      setShowModal(false);
      setFormData({
        name: '',
        code: '',
        amount: '',
        discount_type: 'fixed',
        description: '',
      });
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create fees discount', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.amount) {
      showToast('Name, code, and amount are required', 'error');
      return;
    }
    if (Number(formData.amount) < 0) {
      showToast('Amount must be positive', 'error');
      return;
    }
    createMutation.mutate({
      ...formData,
      amount: Number(formData.amount),
    });
  };

  return (
    <div className="fees-tab-content">
      <div className="tab-header">
        <h2>Fees Discounts</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Fees Discount
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="fees-discounts-list">
          {discounts && discounts.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr key={discount.id}>
                    <td>{discount.code}</td>
                    <td>{discount.name}</td>
                    <td>
                      <span className="badge">
                        {discount.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}
                      </span>
                    </td>
                    <td>
                      {discount.discount_type === 'percentage'
                        ? `${discount.amount}%`
                        : `₹${discount.amount}`}
                    </td>
                    <td>{discount.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No fees discounts found</div>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFormData({
            name: '',
            code: '',
            amount: '',
            discount_type: 'fixed',
            description: '',
          });
        }}
        title="Add Fees Discount"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>
              Code <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>
              Discount Type <span className="required">*</span>
            </label>
            <select
              value={formData.discount_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discount_type: e.target.value as 'percentage' | 'fixed',
                })
              }
              required
            >
              <option value="fixed">Fixed Amount</option>
              <option value="percentage">Percentage</option>
            </select>
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
            <small>
              {formData.discount_type === 'percentage'
                ? 'Enter percentage (e.g., 10 for 10%)'
                : 'Enter amount in currency'}
            </small>
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
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowModal(false)}
            >
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

const CollectFeesTab = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FeesInvoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    discount_amount: '',
    fine_amount: '',
    payment_mode: 'cash' as 'cash' | 'cheque' | 'bank_transfer' | 'online' | 'card',
    note: '',
  });

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: classesResponse } = useQuery('classes', academicsService.getClasses, {
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const classes = Array.isArray(classesResponse?.data) ? classesResponse.data : [];

  const { data: sectionsResponse } = useQuery(
    ['sections', selectedClass],
    () => academicsService.getSections(selectedClass ? Number(selectedClass) : undefined),
    {
      refetchOnWindowFocus: false,
      retry: 1,
      enabled: true, // Always fetch, but filter by class if selected
    }
  );
  const sections = Array.isArray(sectionsResponse?.data) ? sectionsResponse.data : [];

  const { data: sessionsData } = useQuery('sessions', () => settingsService.getSessions());

  const sessions = sessionsData?.data || [];
  const currentSession = sessions.find((s) => s.is_current) || sessions[0];

  const { data: studentsData, isLoading: studentsLoading, error: studentsError } = useQuery(
    ['students', selectedClass, selectedSection, searchTerm],
    () =>
      studentsService.getStudents({
        class_id: selectedClass ? Number(selectedClass) : undefined,
        section_id: selectedSection ? Number(selectedSection) : undefined,
        search: searchTerm || undefined,
        page: 1,
        limit: 100,
      }),
    { 
      enabled: !!selectedClass && !!selectedSection,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  const { data: invoicesData, refetch: refetchInvoices } = useQuery(
    ['fees-invoices', selectedStudent?.id, currentSession?.id],
    () =>
      feesService.getStudentFeesInvoices({
        student_id: selectedStudent?.id,
        session_id: currentSession?.id,
      }),
    { enabled: !!selectedStudent && !!currentSession }
  );

  const paymentMutation = useMutation(feesService.createFeesPayment, {
    onSuccess: () => {
      queryClient.invalidateQueries('fees-payments');
      refetchInvoices();
      showToast('Payment recorded successfully', 'success');
      setShowPaymentModal(false);
      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        discount_amount: '',
        fine_amount: '',
        payment_mode: 'cash',
        note: '',
      });
      setSelectedInvoice(null);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to record payment', 'error');
    },
  });

  const handleCollectFees = (invoice: FeesInvoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      payment_date: new Date().toISOString().split('T')[0],
      amount: String(invoice.balance_amount),
      discount_amount: '',
      fine_amount: '',
      payment_mode: 'cash',
      note: '',
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !selectedStudent) {
      showToast('Please select a student and invoice', 'error');
      return;
    }
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      showToast('Payment amount is required', 'error');
      return;
    }

    paymentMutation.mutate({
      fees_invoice_id: selectedInvoice.id,
      student_id: selectedStudent.id,
      payment_date: paymentForm.payment_date,
      amount: Number(paymentForm.amount),
      discount_amount: paymentForm.discount_amount ? Number(paymentForm.discount_amount) : 0,
      fine_amount: paymentForm.fine_amount ? Number(paymentForm.fine_amount) : 0,
      payment_mode: paymentForm.payment_mode,
      note: paymentForm.note,
    });
  };

  // Extract students array from response: { success: true, data: Student[], pagination: {...} }
  // The service returns response.data which is { success: true, data: [...], pagination: {...} }
  // So studentsData is already { success: true, data: [...], pagination: {...} }
  const students = Array.isArray(studentsData?.data) 
    ? studentsData.data 
    : (studentsData && typeof studentsData === 'object' && 'data' in studentsData && Array.isArray((studentsData as any).data))
      ? (studentsData as any).data
      : [];
  const invoices = Array.isArray(invoicesData) ? invoicesData : [];

  return (
    <div className="fees-tab-content">
      <div className="tab-header">
        <h2>Collect Fees</h2>
      </div>

      <div className="fees-collection-filters">
        <div className="form-row">
          <div className="form-group">
            <label>Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
                setSelectedStudent(null);
              }}
            >
              <option value="">Select Class</option>
              {Array.isArray(classes) && classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setSelectedStudent(null);
              }}
              disabled={!selectedClass}
            >
              <option value="">Select Section</option>
              {Array.isArray(sections) && sections.length > 0 ? (
                sections.map((sec: any) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  {selectedClass ? 'No sections found for this class' : 'Select a class first'}
                </option>
              )}
            </select>
          </div>
          <div className="form-group">
            <label>Search Student</label>
            <input
              type="text"
              placeholder="Search by name or admission no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {studentsLoading ? (
        <div className="loading">Loading students...</div>
      ) : studentsError ? (
        <div className="error-message">
          Error loading students: {studentsError instanceof Error ? studentsError.message : 'Unknown error'}
        </div>
      ) : students.length > 0 ? (
        <div className="students-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student: any) => (
                <tr
                  key={student.id}
                  className={selectedStudent?.id === student.id ? 'selected' : ''}
                >
                  <td>{student.admission_no}</td>
                  <td>
                    {student.first_name} {student.last_name}
                  </td>
                  <td>{student.class_name}</td>
                  <td>{student.section_name}</td>
                  <td>
                    <button
                      className="btn-sm btn-primary"
                      onClick={() => setSelectedStudent(student)}
                    >
                      View Fees
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          {selectedClass && selectedSection 
            ? 'No students found for the selected class and section.' 
            : 'Please select class and section to view students.'}
        </div>
      )}

      {selectedStudent && (
        <div className="student-fees-section">
          <h3>
            Fees for {selectedStudent.first_name} {selectedStudent.last_name} (
            {selectedStudent.admission_no})
          </h3>
          {invoices.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Fees Group</th>
                  <th>Fees Type</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoice_no}</td>
                    <td>{invoice.fees_group_name}</td>
                    <td>{invoice.fees_type_name}</td>
                    <td>₹{invoice.amount}</td>
                    <td>₹{invoice.paid_amount}</td>
                    <td>₹{invoice.balance_amount}</td>
                    <td>
                      {invoice.due_date
                        ? new Date(invoice.due_date).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          invoice.status === 'paid'
                            ? 'badge-success'
                            : invoice.status === 'partial'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      {invoice.balance_amount > 0 && (
                        <button
                          className="btn-sm btn-primary"
                          onClick={() => handleCollectFees(invoice)}
                        >
                          Collect
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No fees invoices found for this student.</div>
          )}
        </div>
      )}

      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedInvoice(null);
        }}
        title="Collect Fees Payment"
      >
        {selectedInvoice && (
          <form onSubmit={handlePaymentSubmit}>
            <div className="payment-info">
              <p>
                <strong>Invoice:</strong> {selectedInvoice.invoice_no}
              </p>
              <p>
                <strong>Fees Type:</strong> {selectedInvoice.fees_type_name}
              </p>
              <p>
                <strong>Balance Amount:</strong> ₹{selectedInvoice.balance_amount}
              </p>
            </div>
            <div className="form-group">
              <label>
                Payment Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, payment_date: e.target.value })
                }
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
                max={selectedInvoice.balance_amount}
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                required
              />
              <small>Maximum: ₹{selectedInvoice.balance_amount}</small>
            </div>
            <div className="form-group">
              <label>Discount Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paymentForm.discount_amount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, discount_amount: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Fine Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paymentForm.fine_amount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, fine_amount: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>
                Payment Mode <span className="required">*</span>
              </label>
              <select
                value={paymentForm.payment_mode}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    payment_mode: e.target.value as any,
                  })
                }
                required
              >
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="online">Online</option>
                <option value="card">Card</option>
              </select>
            </div>
            <div className="form-group">
              <label>Note</label>
              <textarea
                value={paymentForm.note}
                onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={paymentMutation.isLoading}>
                {paymentMutation.isLoading ? 'Processing...' : 'Collect Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

const SearchPaymentTab = () => {
  const [paymentId, setPaymentId] = useState('');
  const [searchResults, setSearchResults] = useState<FeesPayment[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { showToast } = useToast();

  const handleSearch = async () => {
    if (!paymentId.trim()) {
      showToast('Please enter a payment ID', 'error');
      return;
    }

    setIsSearching(true);
    try {
      const results = await feesService.getFeesPayments({ payment_id: paymentId.trim() });
      setSearchResults(results);
      if (results.length === 0) {
        showToast('No payment found with this ID', 'info');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to search payment', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fees-tab-content">
      <div className="tab-header">
        <h2>Search Fees Payment</h2>
      </div>

      <div className="search-payment-form">
        <div className="form-group">
          <label>Payment ID</label>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <input
              type="text"
              placeholder="Enter Payment ID"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-primary" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Payment Details</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Student</th>
                <th>Admission No</th>
                <th>Invoice No</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Payment Mode</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.payment_id}</td>
                  <td>
                    {payment.first_name} {payment.last_name}
                  </td>
                  <td>{payment.admission_no}</td>
                  <td>{payment.invoice_no}</td>
                  <td>₹{payment.amount}</td>
                  <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                  <td>
                    <span className="badge">{payment.payment_mode}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const DueFeesTab = () => {
  const [feesGroup, setFeesGroup] = useState('');
  const [feesType, setFeesType] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [dueStudents, setDueStudents] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { showToast } = useToast();

  const { data: feesGroups } = useQuery('fees-groups', feesService.getFeesGroups);
  const { data: feesTypes } = useQuery('fees-types', feesService.getFeesTypes);
  const { data: classesData } = useQuery('classes', academicsService.getClasses);
  const { data: sectionsData } = useQuery('sections', () => academicsService.getSections());
  const { data: sessionsData } = useQuery('sessions', () => settingsService.getSessions());

  const sessions = sessionsData?.data || [];
  const currentSession = sessions.find((s) => s.is_current) || sessions[0];

  const handleSearch = async () => {
    if (!selectedClass || !selectedSection) {
      showToast('Please select class and section', 'error');
      return;
    }

    setIsSearching(true);
    try {
      // Get students with due fees
      const students = await studentsService.getStudents({
        class_id: Number(selectedClass),
        section_id: Number(selectedSection),
        page: 1,
        limit: 1000,
      });

      // Get invoices for these students
      const allInvoices: FeesInvoice[] = [];
      const studentList = students?.data || [];
      for (const student of studentList) {
        try {
          const invoices = await feesService.getStudentFeesInvoices({
            student_id: student.id,
            session_id: currentSession?.id,
            status: 'pending',
          });
          allInvoices.push(...invoices);
        } catch (error) {
          // Skip if error
        }
      }

      // Filter by fees type if selected
      const filteredInvoices = feesType
        ? allInvoices.filter((inv) => (inv as any).fees_type_id === Number(feesType))
        : allInvoices;

      // Group by student
      const studentMap = new Map();
      filteredInvoices.forEach((invoice) => {
        if (invoice.balance_amount > 0) {
          if (!studentMap.has(invoice.student_id)) {
            studentMap.set(invoice.student_id, {
              student_id: invoice.student_id,
              invoices: [],
              total_due: 0,
            });
          }
          const studentData = studentMap.get(invoice.student_id);
          studentData.invoices.push(invoice);
          studentData.total_due += invoice.balance_amount;
        }
      });

      setDueStudents(Array.from(studentMap.values()));
      if (studentMap.size === 0) {
        showToast('No students with due fees found', 'info');
      }
    } catch (error: any) {
      showToast('Failed to search due fees', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fees-tab-content">
      <div className="tab-header">
        <h2>Search Due Fees</h2>
      </div>

      <div className="due-fees-filters">
        <div className="form-row">
          <div className="form-group">
            <label>Fees Group</label>
            <select value={feesGroup} onChange={(e) => setFeesGroup(e.target.value)}>
              <option value="">All Groups</option>
              {feesGroups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Fees Type</label>
            <select value={feesType} onChange={(e) => setFeesType(e.target.value)}>
              <option value="">All Types</option>
              {feesTypes?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
              }}
            >
              <option value="">Select Class</option>
              {classesData?.data?.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">Select Section</option>
              {(sectionsData as any)?.data?.map((sec: any) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn-primary" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {dueStudents.length > 0 && (
        <div className="due-fees-results">
          <h3>Students with Due Fees</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Total Due</th>
                <th>Invoices</th>
              </tr>
            </thead>
            <tbody>
              {dueStudents.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.student_id}</td>
                  <td>₹{item.total_due.toFixed(2)}</td>
                  <td>{item.invoices.length} invoice(s)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const CarryForwardTab = () => {
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [selectedSectionId, setSelectedSectionId] = useState<number | ''>('');
  const [fromSessionId, setFromSessionId] = useState<number | ''>('');
  const [toSessionId, setToSessionId] = useState<number | ''>('');
  const [editingEntry, setEditingEntry] = useState<FeesCarryForward | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: classesData } = useQuery('classes', () => academicsService.getClasses());
  const { data: sectionsData } = useQuery('sections', () => academicsService.getSections());
  const { data: sessionsData } = useQuery('sessions', () => settingsService.getSessions());
  const { data: generalSettings } = useQuery('general-settings', () => settingsService.getGeneralSettings());

  const { data: studentsWithBalance, refetch: refetchStudents } = useQuery(
    ['carry-forward-students', selectedClassId, selectedSectionId, fromSessionId, toSessionId],
    () => feesService.getStudentBalanceForCarryForward({
      class_id: selectedClassId ? Number(selectedClassId) : undefined,
      section_id: selectedSectionId ? Number(selectedSectionId) : undefined,
      from_session_id: Number(fromSessionId),
      to_session_id: Number(toSessionId),
    }),
    { enabled: false }
  );

  const { data: carryForwardData, refetch: refetchCarryForward } = useQuery(
    ['carry-forward', selectedClassId, selectedSectionId, fromSessionId, toSessionId],
    () => feesService.getCarryForward({
      class_id: selectedClassId ? Number(selectedClassId) : undefined,
      section_id: selectedSectionId ? Number(selectedSectionId) : undefined,
      from_session_id: Number(fromSessionId),
      to_session_id: Number(toSessionId),
    }),
    { enabled: false }
  );

  const createMutation = useMutation(feesService.createCarryForward, {
    onSuccess: () => {
      queryClient.invalidateQueries('carry-forward');
      refetchCarryForward();
      refetchStudents();
      showToast('Fees carry forward created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create carry forward', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => feesService.updateCarryForward(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('carry-forward');
        refetchCarryForward();
        setShowEditModal(false);
        setEditingEntry(null);
        showToast('Carry forward updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update carry forward', 'error');
      },
    }
  );

  const handleSearch = () => {
    if (!fromSessionId || !toSessionId) {
      showToast('Please select both from and to sessions', 'error');
      return;
    }
    refetchStudents();
    refetchCarryForward();
  };

  const handleForwardFees = (student: any) => {
    const feesDueDays = generalSettings?.data?.feesDueDays ? Number(generalSettings.data.feesDueDays) : 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + feesDueDays);

    createMutation.mutate({
      student_id: student.student_id,
      from_session_id: Number(fromSessionId),
      to_session_id: Number(toSessionId),
      amount: Number(student.balance_amount),
      due_date: dueDate.toISOString().split('T')[0],
    });
  };

  const handleEdit = (entry: FeesCarryForward) => {
    setEditingEntry(entry);
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!editingEntry) return;
    updateMutation.mutate({
      id: editingEntry.id,
      data: {
        amount: editingEntry.amount,
        due_date: editingEntry.due_date,
      },
    });
  };

  const classes = classesData?.data || [];
  const sections = sectionsData?.data || [];
  const sessions = sessionsData?.data || [];
  const students = (studentsWithBalance as any) || [];
  const carryForward = (carryForwardData as any) || [];

  const availableSections = selectedClassId
    ? sections.filter(s => {
        const selectedClass = classes.find(c => c.id === Number(selectedClassId));
        if (!selectedClass?.section_ids) return false;
        const sectionIds = selectedClass.section_ids.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
        return sectionIds.includes(s.id);
      })
    : [];

  const currentSession = sessions.find((s: any) => s.is_current);
  const previousSessions = sessions.filter((s: any) => !s.is_current);

  // Set default sessions if not set
  useEffect(() => {
    if (!fromSessionId && previousSessions.length > 0) {
      setFromSessionId(previousSessions[previousSessions.length - 1].id);
    }
    if (!toSessionId && currentSession) {
      setToSessionId(currentSession.id);
    }
  }, [sessions, fromSessionId, toSessionId]);

  return (
    <div className="fees-tab-content">
      <div className="tab-header">
        <h2>Fees Carry Forward</h2>
      </div>

      <div className="form-section" style={{ marginBottom: '20px' }}>
        <div className="form-row">
          <div className="form-group">
            <label>From Session</label>
            <select
              value={fromSessionId}
              onChange={(e) => setFromSessionId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select Session</option>
              {previousSessions.map((session: any) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>To Session</label>
            <select
              value={toSessionId}
              onChange={(e) => setToSessionId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select Session</option>
              {sessions.map((session: any) => (
                <option key={session.id} value={session.id}>
                  {session.name} {session.is_current ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value ? Number(e.target.value) : '');
                setSelectedSectionId('');
              }}
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Section</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value ? Number(e.target.value) : '')}
              disabled={!selectedClassId}
            >
              <option value="">All Sections</option>
              {availableSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <button className="btn-primary" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </div>

      {students.length > 0 && (
        <div className="table-section" style={{ marginBottom: '30px' }}>
          <h3>Students with Balance Fees</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>Balance Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student: any) => {
                const alreadyForwarded = carryForward.some((cf: FeesCarryForward) => cf.student_id === student.student_id);
                return (
                  <tr key={student.student_id}>
                    <td>{student.admission_no}</td>
                    <td>{student.first_name} {student.last_name}</td>
                    <td>{student.class_name}</td>
                    <td>{student.section_name}</td>
                    <td>₹{Number(student.balance_amount).toFixed(2)}</td>
                    <td>
                      {alreadyForwarded ? (
                        <span style={{ color: 'var(--success-color)' }}>Already Forwarded</span>
                      ) : (
                        <button
                          className="btn-primary"
                          onClick={() => handleForwardFees(student)}
                          disabled={createMutation.isLoading}
                        >
                          Forward Fees
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {carryForward.length > 0 && (
        <div className="table-section">
          <h3>Forwarded Fees</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {carryForward.map((entry: FeesCarryForward) => (
                <tr key={entry.id}>
                  <td>{entry.admission_no}</td>
                  <td>{entry.first_name} {entry.last_name}</td>
                  <td>{entry.class_name}</td>
                  <td>{entry.section_name}</td>
                  <td>₹{Number(entry.amount).toFixed(2)}</td>
                  <td>{entry.due_date ? new Date(entry.due_date).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`status-badge ${entry.status === 'paid' ? 'status-paid' : 'status-pending'}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(entry)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEditModal && editingEntry && (
        <Modal
          isOpen={showEditModal}
          title="Edit Carry Forward"
          onClose={() => {
            setShowEditModal(false);
            setEditingEntry(null);
          }}
        >
          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              step="0.01"
              value={editingEntry.amount}
              onChange={(e) => setEditingEntry({ ...editingEntry, amount: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              value={editingEntry.due_date || ''}
              onChange={(e) => setEditingEntry({ ...editingEntry, due_date: e.target.value })}
            />
          </div>
          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setShowEditModal(false);
                setEditingEntry(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleUpdate}
              disabled={updateMutation.isLoading}
            >
              {updateMutation.isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const ReminderTab = () => {
  const [reminderTypeFilter, setReminderTypeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: reminderSettingsData, refetch: refetchSettings } = useQuery(
    'fees-reminder-settings',
    () => feesService.getFeesReminderSettings()
  );

  const { data: reminderLogsData } = useQuery(
    ['fees-reminder-logs', reminderTypeFilter, startDate, endDate],
    () => feesService.getFeesReminderLogs({
      reminder_type: reminderTypeFilter as any,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    })
  );

  const updateMutation = useMutation(feesService.updateFeesReminderSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('fees-reminder-settings');
      refetchSettings();
      showToast('Reminder settings updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update reminder settings', 'error');
    },
  });

  const handleUpdateSetting = (reminderType: 'before_1' | 'before_2' | 'after_1' | 'after_2', isActive: boolean, days: number) => {
    updateMutation.mutate({
      reminder_type: reminderType,
      is_active: isActive,
      days: days,
    });
  };

  const reminderSettings = reminderSettingsData || [];
  const reminderLogs = reminderLogsData || [];

  // Initialize default settings if not exist
  const defaultSettings = [
    { reminder_type: 'before_1', label: 'Before Reminder 1', days: 5 },
    { reminder_type: 'before_2', label: 'Before Reminder 2', days: 2 },
    { reminder_type: 'after_1', label: 'After Reminder 1', days: 3 },
    { reminder_type: 'after_2', label: 'After Reminder 2', days: 7 },
  ];

  const getSetting = (type: string) => {
    return reminderSettings.find((s: FeesReminderSetting) => s.reminder_type === type) || {
      reminder_type: type as any,
      is_active: false,
      days: defaultSettings.find(d => d.reminder_type === type)?.days || 0,
    };
  };

  return (
    <div className="fees-tab-content">
      <div className="tab-header">
        <h2>Fees Reminder</h2>
      </div>

      <div className="form-section" style={{ marginBottom: '30px' }}>
        <h3>Reminder Settings</h3>
        <p style={{ marginBottom: '20px', color: 'var(--gray-600)' }}>
          Configure automated reminders for due fees. Reminders are sent relative to the fees due date.
        </p>

        <div className="reminder-settings-grid">
          {defaultSettings.map((defaultSetting) => {
            const setting = getSetting(defaultSetting.reminder_type);
            return (
              <div key={defaultSetting.reminder_type} className="reminder-setting-card">
                <div className="reminder-setting-header">
                  <h4>{defaultSetting.label}</h4>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={setting.is_active}
                      onChange={(e) => {
                        handleUpdateSetting(
                          defaultSetting.reminder_type as any,
                          e.target.checked,
                          setting.days
                        );
                      }}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="form-group">
                  <label>Days {defaultSetting.reminder_type.startsWith('before') ? 'Before' : 'After'} Due Date</label>
                  <input
                    type="number"
                    min="0"
                    value={setting.days}
                    onChange={(e) => {
                      const newDays = Number(e.target.value);
                      if (newDays >= 0) {
                        handleUpdateSetting(
                          defaultSetting.reminder_type as any,
                          setting.is_active,
                          newDays
                        );
                      }
                    }}
                    disabled={!setting.is_active}
                  />
                </div>
                <p className="reminder-description">
                  {defaultSetting.reminder_type.startsWith('before')
                    ? `Reminder will be sent ${setting.days} day(s) before the fees due date.`
                    : `Reminder will be sent ${setting.days} day(s) after the fees due date.`}
                </p>
              </div>
            );
          })}
        </div>

        <div className="info-box" style={{ marginTop: '20px', padding: '15px', background: 'var(--gray-50)', borderRadius: '8px' }}>
          <p><strong>Note:</strong> To enable automated reminders, you need to set up a cron job that calls:</p>
          <code style={{ display: 'block', marginTop: '10px', padding: '10px', background: 'var(--white)', borderRadius: '4px' }}>
            http://yoursite.com/api/cron/fees-reminder
          </code>
        </div>
      </div>

      <div className="table-section">
        <h3>Reminder Logs</h3>
        <div className="form-row" style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <label>Reminder Type</label>
            <select
              value={reminderTypeFilter}
              onChange={(e) => setReminderTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="before_1">Before Reminder 1</option>
              <option value="before_2">Before Reminder 2</option>
              <option value="after_1">After Reminder 1</option>
              <option value="after_2">After Reminder 2</option>
            </select>
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {reminderLogs.length === 0 ? (
          <div className="empty-state">No reminder logs found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Sent At</th>
                <th>Reminder Type</th>
                <th>Invoice No</th>
                <th>Student</th>
                <th>Admission No</th>
              </tr>
            </thead>
            <tbody>
              {reminderLogs.map((log: FeesReminderLog) => (
                <tr key={log.id}>
                  <td>{new Date(log.sent_at).toLocaleString()}</td>
                  <td>
                    {log.reminder_type === 'before_1' && 'Before Reminder 1'}
                    {log.reminder_type === 'before_2' && 'Before Reminder 2'}
                    {log.reminder_type === 'after_1' && 'After Reminder 1'}
                    {log.reminder_type === 'after_2' && 'After Reminder 2'}
                  </td>
                  <td>{log.invoice_no || '-'}</td>
                  <td>{log.first_name} {log.last_name}</td>
                  <td>{log.admission_no || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Fees;

