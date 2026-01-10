import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { studentsService } from '../../services/api/studentsService';
import { academicsService } from '../../services/api/academicsService';
import { useToast } from '../../contexts/ToastContext';
import './Students.css';

// Import all tab components
import StudentListTab from './components/StudentListTab';
import StudentAdmissionTab from './components/StudentAdmissionTab';
import OnlineAdmissionsTab from './components/OnlineAdmissionsTab';
import CategoriesTab from './components/CategoriesTab';
import HousesTab from './components/HousesTab';
import DisableReasonsTab from './components/DisableReasonsTab';
import PromoteStudentsTab from './components/PromoteStudentsTab';
import ImportStudentsModal from './components/ImportStudentsModal';
import StudentsTabs from './components/StudentsTabs';

const Students = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'admission' | 'online-admissions' | 'categories' | 'houses' | 'disable-reasons' | 'promote'>('list');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [classFilter, sectionFilter, searchTerm]);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: studentsData, isLoading, error, isError } = useQuery(
    ['students', page, classFilter, sectionFilter, searchTerm],
    () => studentsService.getStudents({
      page,
      limit: 20,
      class_id: classFilter ? Number(classFilter) : undefined,
      section_id: sectionFilter ? Number(sectionFilter) : undefined,
      search: searchTerm || undefined,
    }),
    {
      retry: 1,
      retryDelay: 1000,
      keepPreviousData: true, // Keep previous data while loading new page
      onError: (err: any) => {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load students';
        showToast(errorMessage, 'error');
      },
    }
  );

  const { data: classesData } = useQuery('classes', () => academicsService.getClasses());
  const { data: sectionsData } = useQuery('sections', () => academicsService.getSections());

  const { showToast } = useToast();

  const deleteMutation = useMutation(studentsService.deleteStudent, {
    onSuccess: () => {
      queryClient.invalidateQueries('students');
      showToast('Student deleted successfully', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to delete student', 'error');
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteMutation.mutate(String(id));
    }
  };

  // Tab scrolling functions
  const checkArrows = () => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    const container = tabsContainerRef.current;
    if (!container) return;

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
  };

  // Initialize and check arrows
  useEffect(() => {
    checkArrows();
    const container = tabsContainerRef.current;
    if (container) {
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

  return (
    <div className="students-page">
      <div className="page-header">
        <h1>Student Information</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => setShowImportModal(true)}>
            📥 Import Students
          </button>
          <button className="btn-primary" onClick={() => setActiveTab('admission')}>
            + Add Student
          </button>
        </div>
      </div>

      <div className="students-tabs-wrapper">
        <div className="students-tabs-container">
          {showLeftArrow && (
            <button
              className="students-tabs-arrow students-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="students-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'list' ? activeTabRef : null}
              className={activeTab === 'list' ? 'active' : ''}
              onClick={() => setActiveTab('list')}
            >
              Student List
            </button>
            <button
              ref={activeTab === 'admission' ? activeTabRef : null}
              className={activeTab === 'admission' ? 'active' : ''}
              onClick={() => setActiveTab('admission')}
            >
              Student Admission
            </button>
            <button
              ref={activeTab === 'online-admissions' ? activeTabRef : null}
              className={activeTab === 'online-admissions' ? 'active' : ''}
              onClick={() => setActiveTab('online-admissions')}
            >
              Online Admissions
            </button>
            <button
              ref={activeTab === 'categories' ? activeTabRef : null}
              className={activeTab === 'categories' ? 'active' : ''}
              onClick={() => setActiveTab('categories')}
            >
              Categories
            </button>
            <button
              ref={activeTab === 'houses' ? activeTabRef : null}
              className={activeTab === 'houses' ? 'active' : ''}
              onClick={() => setActiveTab('houses')}
            >
              Houses
            </button>
            <button
              ref={activeTab === 'disable-reasons' ? activeTabRef : null}
              className={activeTab === 'disable-reasons' ? 'active' : ''}
              onClick={() => setActiveTab('disable-reasons')}
            >
              Disable Reasons
            </button>
            <button
              ref={activeTab === 'promote' ? activeTabRef : null}
              className={activeTab === 'promote' ? 'active' : ''}
              onClick={() => setActiveTab('promote')}
            >
              Promote Students
            </button>
          </div>
          {showRightArrow && (
            <button
              className="students-tabs-arrow students-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      <div className="students-content">
        {activeTab === 'list' && (
          <StudentListTab
            students={studentsData?.data || []}
            classes={classesData?.data || []}
            sections={sectionsData?.data || []}
            pagination={studentsData?.pagination}
            classFilter={classFilter}
            sectionFilter={sectionFilter}
            searchTerm={searchTerm}
            onClassFilterChange={setClassFilter}
            onSectionFilterChange={setSectionFilter}
            onSearchChange={setSearchTerm}
            onPageChange={setPage}
            onDelete={handleDelete}
            isLoading={isLoading}
            error={error}
            isError={isError}
          />
        )}
        {activeTab === 'admission' && (
          <StudentAdmissionTab
            classes={classesData?.data || []}
            sections={sectionsData?.data || []}
          />
        )}
        {activeTab === 'online-admissions' && (
          <OnlineAdmissionsTab />
        )}
        {activeTab === 'categories' && (
          <CategoriesTab />
        )}
        {activeTab === 'houses' && (
          <HousesTab />
        )}
        {activeTab === 'disable-reasons' && (
          <DisableReasonsTab />
        )}
        {activeTab === 'promote' && (
          <PromoteStudentsTab
            classes={classesData?.data || []}
            sections={sectionsData?.data || []}
          />
        )}
      </div>

      {/* Import Students Modal */}
      {showImportModal && (
        <ImportStudentsModal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
          }}
          onImportSuccess={() => {
            queryClient.invalidateQueries('students');
          }}
        />
      )}
    </div>
  );
};

export default Students;
