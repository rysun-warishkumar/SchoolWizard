import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { settingsService, GeneralSettings, Session, EmailSettings, NotificationSetting, SMSSetting, PaymentGateway, Language, Module, CustomField, SystemField, BackupRecord, BackupSettings } from '../../services/api/settingsService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Settings.css';

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as 'general' | 'sessions' | 'email' | 'notifications' | 'sms' | 'payment' | 'print' | 'languages' | 'modules' | 'custom-fields' | 'system-fields' | 'backup' | null;
  const [activeTab, setActiveTab] = useState<'general' | 'sessions' | 'email' | 'notifications' | 'sms' | 'payment' | 'print' | 'languages' | 'modules' | 'custom-fields' | 'system-fields' | 'backup'>(tabFromUrl || 'general');
  const { showToast } = useToast();

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, setSearchParams]);

  // Update tab when URL changes
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [sessionForm, setSessionForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_current: false,
  });

  const queryClient = useQueryClient();

  const { data: settingsData, isLoading: settingsLoading } = useQuery(
    'general-settings',
    () => settingsService.getGeneralSettings()
  );

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery(
    'sessions',
    () => settingsService.getSessions()
  );

  const { data: emailSettingsData, isLoading: emailSettingsLoading } = useQuery(
    'email-settings',
    () => settingsService.getEmailSettings()
  );

  const [emailForm, setEmailForm] = useState<Partial<EmailSettings>>({
    smtp_host: '',
    smtp_port: 587,
    smtp_secure: false,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: 'SchoolWizard',
    is_enabled: false,
  });

  const [testEmail, setTestEmail] = useState('');

  // Update email form when data loads
  React.useEffect(() => {
    if (emailSettingsData?.data) {
      setEmailForm({
        smtp_host: emailSettingsData.data.smtp_host || '',
        smtp_port: emailSettingsData.data.smtp_port || 587,
        smtp_secure: emailSettingsData.data.smtp_secure || false,
        smtp_username: emailSettingsData.data.smtp_username || '',
        smtp_password: '', // Don't populate password
        from_email: emailSettingsData.data.from_email || '',
        from_name: emailSettingsData.data.from_name || 'SchoolWizard',
        is_enabled: emailSettingsData.data.is_enabled || false,
      });
    }
  }, [emailSettingsData]);

  const updateEmailSettingsMutation = useMutation(settingsService.updateEmailSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('email-settings');
      showToast('Email settings updated successfully!', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update email settings', 'error');
    },
  });

  const testEmailMutation = useMutation(settingsService.testEmailSettings, {
    onSuccess: (data) => {
      showToast(data.message, 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to send test email', 'error');
    },
  });

  const handleEmailSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmailSettingsMutation.mutate(emailForm);
  };

  const handleTestEmail = () => {
    if (!testEmail || !testEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    testEmailMutation.mutate(testEmail);
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
      
      // Calculate scroll position to center the tab
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
      // Only show arrows if tabs overflow the container width
      const hasOverflow = container.scrollWidth > container.clientWidth;
      
      if (hasOverflow) {
        const hasLeftScroll = container.scrollLeft > 5;
        const hasRightScroll = container.scrollLeft < (container.scrollWidth - container.clientWidth - 5);
        setShowLeftArrow(hasLeftScroll);
        setShowRightArrow(hasRightScroll);
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
      
      // Update arrow visibility after scroll
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

  const updateSettingsMutation = useMutation(settingsService.updateGeneralSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('general-settings');
      queryClient.refetchQueries('general-settings'); // Force refetch to get updated image paths
      showToast('Settings updated successfully!', 'success');
      // Reset file inputs
      setAdminLogoFile(null);
      setFaviconFile(null);
      // Clear file input values
      if (adminLogoInputRef.current) adminLogoInputRef.current.value = '';
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update settings', 'error');
    },
  });

  const createSessionMutation = useMutation(settingsService.createSession, {
    onSuccess: () => {
      queryClient.invalidateQueries('sessions');
      setShowSessionModal(false);
      resetSessionForm();
    },
  });

  const updateSessionMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => settingsService.updateSession(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sessions');
        setShowSessionModal(false);
        resetSessionForm();
      },
    }
  );

  const deleteSessionMutation = useMutation(settingsService.deleteSession, {
    onSuccess: () => {
      queryClient.invalidateQueries('sessions');
    },
  });

  const resetSessionForm = () => {
    setSessionForm({ name: '', start_date: '', end_date: '', is_current: false });
    setEditingSession(null);
  };

  const handleEditSession = (session: Session) => {
    setEditingSession(session);
    setSessionForm({
      name: session.name,
      start_date: session.start_date,
      end_date: session.end_date,
      is_current: session.is_current,
    });
    setShowSessionModal(true);
  };

  const handleSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSession) {
      updateSessionMutation.mutate({ id: String(editingSession.id), data: sessionForm });
    } else {
      createSessionMutation.mutate(sessionForm);
    }
  };

  const handleDeleteSession = (id: number) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteSessionMutation.mutate(String(id));
    }
  };

  const [adminLogoFile, setAdminLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [adminLogoPreview, setAdminLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const adminLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (settingsData?.data) {
      // Set preview URLs if logo/favicon exist and are not empty
      if (settingsData.data.adminLogo && settingsData.data.adminLogo.trim() !== '') {
        const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
        const baseUrl = apiBaseUrl.replace('/api/v1', '');
        // Add timestamp to force refresh
        setAdminLogoPreview(`${baseUrl}${settingsData.data.adminLogo}?t=${Date.now()}`);
      } else {
        setAdminLogoPreview(null);
      }
      if (settingsData.data.favicon && settingsData.data.favicon.trim() !== '') {
        const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';
        const baseUrl = apiBaseUrl.replace('/api/v1', '');
        // Add timestamp to force refresh
        setFaviconPreview(`${baseUrl}${settingsData.data.favicon}?t=${Date.now()}`);
      } else {
        setFaviconPreview(null);
      }
    }
  }, [settingsData]);

  const handleAdminLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAdminLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdminLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaviconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // If files are selected, use FormData directly
    if (adminLogoFile || faviconFile) {
      const formDataToSend = new FormData();
      
      // Add files
      if (adminLogoFile) {
        formDataToSend.append('adminLogo', adminLogoFile);
      }
      if (faviconFile) {
        formDataToSend.append('favicon', faviconFile);
      }
      
      // Add other form fields
      formData.forEach((value, key) => {
        if (key !== 'adminLogo' && key !== 'favicon') {
          formDataToSend.append(key, value as string);
        }
      });
      
      // Add existing logo/favicon paths if no new file
      if (!adminLogoFile && settingsData?.data?.adminLogo) {
        formDataToSend.append('adminLogo', settingsData.data.adminLogo);
      }
      if (!faviconFile && settingsData?.data?.favicon) {
        formDataToSend.append('favicon', settingsData.data.favicon);
      }
      
      // Convert FormData to object for mutation
      const settings: Partial<GeneralSettings> = {};
      formDataToSend.forEach((value, key) => {
        if (key === 'biometricAttendance' || key === 'autoStaffId' || key === 'duplicateFeesInvoice' || 
            key === 'teacherRestrictedMode' || key === 'onlineAdmission' || key === 'is_current') {
          (settings as any)[key] = value === 'true' || value === 'on';
        } else if (key === 'admissionNoDigit' || key === 'admissionStartFrom' || key === 'staffNoDigit' || 
                   key === 'staffIdStartFrom' || key === 'feesDueDays') {
          (settings as any)[key] = Number(value);
        } else if (typeof value === 'string') {
          (settings as any)[key] = value;
        }
      });
      
      // Use FormData for file upload
      updateSettingsMutation.mutate(formDataToSend as any);
    } else {
      // No files, use regular object
      const settings: Partial<GeneralSettings> = {};
      formData.forEach((value, key) => {
        if (key === 'biometricAttendance' || key === 'autoStaffId' || key === 'duplicateFeesInvoice' || 
            key === 'teacherRestrictedMode' || key === 'onlineAdmission' || key === 'is_current') {
          (settings as any)[key] = value === 'true' || value === 'on';
        } else if (key === 'admissionNoDigit' || key === 'admissionStartFrom' || key === 'staffNoDigit' || 
                   key === 'staffIdStartFrom' || key === 'feesDueDays') {
          (settings as any)[key] = Number(value);
        } else {
          (settings as any)[key] = value;
        }
      });
      updateSettingsMutation.mutate(settings);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>System Settings</h1>
      </div>

      <div className="settings-tabs-wrapper">
        <div className="settings-tabs-container">
          {showLeftArrow && (
            <button
              className="settings-tabs-arrow settings-tabs-arrow-left"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              ‹
            </button>
          )}
          <div className="settings-tabs" ref={tabsContainerRef}>
            <button
              ref={activeTab === 'general' ? activeTabRef : null}
              className={activeTab === 'general' ? 'active' : ''}
              onClick={() => handleTabChange('general')}
            >
              General Settings
            </button>
            <button
              ref={activeTab === 'sessions' ? activeTabRef : null}
              className={activeTab === 'sessions' ? 'active' : ''}
              onClick={() => handleTabChange('sessions')}
            >
              Session Settings
            </button>
            <button
              ref={activeTab === 'email' ? activeTabRef : null}
              className={activeTab === 'email' ? 'active' : ''}
              onClick={() => handleTabChange('email')}
            >
              Email Settings
            </button>
            <button
              ref={activeTab === 'notifications' ? activeTabRef : null}
              className={activeTab === 'notifications' ? 'active' : ''}
              onClick={() => handleTabChange('notifications')}
            >
              Notification Settings
            </button>
            <button
              ref={activeTab === 'sms' ? activeTabRef : null}
              className={activeTab === 'sms' ? 'active' : ''}
              onClick={() => handleTabChange('sms')}
            >
              SMS Settings
            </button>
            <button
              ref={activeTab === 'payment' ? activeTabRef : null}
              className={activeTab === 'payment' ? 'active' : ''}
              onClick={() => handleTabChange('payment')}
            >
              Payment Methods
            </button>
            <button
              ref={activeTab === 'print' ? activeTabRef : null}
              className={activeTab === 'print' ? 'active' : ''}
              onClick={() => handleTabChange('print')}
            >
              Print Header Footer
            </button>
            <button
              ref={activeTab === 'languages' ? activeTabRef : null}
              className={activeTab === 'languages' ? 'active' : ''}
              onClick={() => handleTabChange('languages')}
            >
              Languages
            </button>
            <button
              ref={activeTab === 'modules' ? activeTabRef : null}
              className={activeTab === 'modules' ? 'active' : ''}
              onClick={() => handleTabChange('modules')}
            >
              Modules
            </button>
            <button
              ref={activeTab === 'custom-fields' ? activeTabRef : null}
              className={activeTab === 'custom-fields' ? 'active' : ''}
              onClick={() => handleTabChange('custom-fields')}
            >
              Custom Fields
            </button>
            <button
              ref={activeTab === 'system-fields' ? activeTabRef : null}
              className={activeTab === 'system-fields' ? 'active' : ''}
              onClick={() => handleTabChange('system-fields')}
            >
              System Fields
            </button>
            <button
              ref={activeTab === 'backup' ? activeTabRef : null}
              className={activeTab === 'backup' ? 'active' : ''}
              onClick={() => handleTabChange('backup')}
            >
              Backup / Restore
            </button>
          </div>
          {showRightArrow && (
            <button
              className="settings-tabs-arrow settings-tabs-arrow-right"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              ›
            </button>
          )}
        </div>
      </div>

      {activeTab === 'general' && (
        <div className="settings-content">
          {settingsLoading ? (
            <div className="loading">Loading settings...</div>
          ) : (
            <form onSubmit={handleSettingsSubmit} className="settings-form">
              <div className="form-section">
                <h3>School Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>School Name</label>
                    <input
                      type="text"
                      name="schoolName"
                      defaultValue={settingsData?.data.schoolName}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>School Code</label>
                    <input
                      type="text"
                      name="schoolCode"
                      defaultValue={settingsData?.data.schoolCode}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    defaultValue={settingsData?.data.address}
                    rows={3}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={settingsData?.data.phone}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={settingsData?.data.email}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Academic Settings</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Session Start Month</label>
                    <select name="sessionStartMonth" defaultValue={settingsData?.data.sessionStartMonth}>
                      <option value="January">January</option>
                      <option value="April">April</option>
                      <option value="September">September</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Attendance Type</label>
                    <select name="attendanceType" defaultValue={settingsData?.data.attendanceType}>
                      <option value="day_wise">Day Wise</option>
                      <option value="period_wise">Period Wise</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="biometricAttendance"
                      defaultChecked={settingsData?.data.biometricAttendance}
                    />
                    Enable Biometric Attendance
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h3>Logo Management</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Admin Logo (Header Logo)</label>
                    <input
                      ref={adminLogoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAdminLogoChange}
                    />
                    {adminLogoPreview && (
                      <div style={{ marginTop: '10px' }}>
                        <img 
                          src={adminLogoPreview} 
                          alt="Admin logo preview" 
                          style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain', display: 'block' }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                              parent.style.display = 'none';
                            }
                            setAdminLogoPreview(null);
                          }}
                        />
                      </div>
                    )}
                    <small>Recommended: PNG format, transparent/white background, ~200px x 200px</small>
                  </div>
                  <div className="form-group">
                    <label>Favicon (Browser Tab Icon)</label>
                    <input
                      ref={faviconInputRef}
                      type="file"
                      accept="image/*,.ico"
                      onChange={handleFaviconChange}
                    />
                    {faviconPreview && (
                      <div style={{ marginTop: '10px' }}>
                        <img 
                          src={faviconPreview} 
                          alt="Favicon preview" 
                          style={{ maxWidth: '32px', maxHeight: '32px', objectFit: 'contain', display: 'block' }}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                              parent.style.display = 'none';
                            }
                            setFaviconPreview(null);
                          }}
                        />
                      </div>
                    )}
                    <small>Recommended: ICO or PNG format, 32x32px or 16x16px</small>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Print Logo Path</label>
                    <input
                      type="text"
                      name="printLogo"
                      defaultValue={settingsData?.data.printLogo}
                      placeholder="/uploads/logos/print-logo.png"
                    />
                    <small>Recommended: PNG format, transparent/white background, ~200px x 200px</small>
                  </div>
                  <div className="form-group">
                    <label>Admin Small Logo Path</label>
                    <input
                      type="text"
                      name="adminSmallLogo"
                      defaultValue={settingsData?.data.adminSmallLogo}
                      placeholder="/uploads/logos/admin-small-logo.png"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Mobile App Logo Path</label>
                    <input
                      type="text"
                      name="appLogo"
                      defaultValue={settingsData?.data.appLogo}
                      placeholder="/uploads/logos/app-logo.png"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Mobile App Settings</h3>
                <div className="form-group">
                  <label>Mobile App API URL</label>
                  <input
                    type="url"
                    name="mobileAppApiUrl"
                    defaultValue={settingsData?.data.mobileAppApiUrl}
                    placeholder="https://api.yourschool.com"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Primary Color Code</label>
                    <input
                      type="color"
                      name="mobileAppPrimaryColor"
                      defaultValue={settingsData?.data.mobileAppPrimaryColor || '#2563eb'}
                      style={{ width: '100%', height: '40px' }}
                    />
                    <input
                      type="text"
                      name="mobileAppPrimaryColor"
                      defaultValue={settingsData?.data.mobileAppPrimaryColor || '#2563eb'}
                      placeholder="#2563eb"
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Secondary Color Code</label>
                    <input
                      type="color"
                      name="mobileAppSecondaryColor"
                      defaultValue={settingsData?.data.mobileAppSecondaryColor || '#64748b'}
                      style={{ width: '100%', height: '40px' }}
                    />
                    <input
                      type="text"
                      name="mobileAppSecondaryColor"
                      defaultValue={settingsData?.data.mobileAppSecondaryColor || '#64748b'}
                      placeholder="#64748b"
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="androidAppRegistered"
                      defaultChecked={settingsData?.data.androidAppRegistered}
                    />
                    Android App Registered
                  </label>
                  <small>Check this if you have registered your Android app with Envato purchase code</small>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Save Settings
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="settings-content">
          <div className="section-header">
            <h3>Academic Sessions</h3>
            <button className="btn-primary" onClick={() => { resetSessionForm(); setShowSessionModal(true); }}>
              + Add Session
            </button>
          </div>

          {sessionsLoading ? (
            <div className="loading">Loading sessions...</div>
          ) : (
            <div className="sessions-table">
              <table>
                <thead>
                  <tr>
                    <th>Session Name</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionsData?.data.map((session) => (
                    <tr key={session.id}>
                      <td>{session.name}</td>
                      <td>{new Date(session.start_date).toLocaleDateString()}</td>
                      <td>{new Date(session.end_date).toLocaleDateString()}</td>
                      <td>
                        {session.is_current ? (
                          <span className="status-badge active">Current</span>
                        ) : (
                          <span className="status-badge inactive">Inactive</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button onClick={() => handleEditSession(session)} className="btn-edit">
                            Edit
                          </button>
                          {!session.is_current && (
                            <button onClick={() => handleDeleteSession(session.id)} className="btn-delete">
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showSessionModal && (
        <div className="modal-overlay" onClick={() => { setShowSessionModal(false); resetSessionForm(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingSession ? 'Edit Session' : 'Add Session'}</h2>
            <form onSubmit={handleSessionSubmit}>
              <div className="form-group">
                <label>Session Name</label>
                <input
                  type="text"
                  value={sessionForm.name}
                  onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                  placeholder="e.g., 2024-25"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={sessionForm.start_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={sessionForm.end_date}
                    onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={sessionForm.is_current}
                    onChange={(e) => setSessionForm({ ...sessionForm, is_current: e.target.checked })}
                  />
                  Set as Current Session
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowSessionModal(false); resetSessionForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingSession ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="settings-content">
          {emailSettingsLoading ? (
            <div className="loading">Loading email settings...</div>
          ) : (
            <form onSubmit={handleEmailSettingsSubmit} className="settings-form">
              <div className="form-section">
                <h3>SMTP Configuration</h3>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={emailForm.is_enabled || false}
                      onChange={(e) => setEmailForm({ ...emailForm, is_enabled: e.target.checked })}
                    />
                    Enable Email Service
                  </label>
                  <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                    When enabled, the system will send emails for student admissions and other notifications.
                  </p>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>SMTP Host *</label>
                    <input
                      type="text"
                      value={emailForm.smtp_host || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                      placeholder="e.g., smtp.gmail.com"
                      required={emailForm.is_enabled}
                      disabled={!emailForm.is_enabled}
                    />
                  </div>
                  <div className="form-group">
                    <label>SMTP Port *</label>
                    <input
                      type="number"
                      value={emailForm.smtp_port || 587}
                      onChange={(e) => setEmailForm({ ...emailForm, smtp_port: Number(e.target.value) })}
                      placeholder="587 or 465"
                      required={emailForm.is_enabled}
                      disabled={!emailForm.is_enabled}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Use 587 for TLS or 465 for SSL
                    </p>
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={emailForm.smtp_secure || false}
                      onChange={(e) => setEmailForm({ ...emailForm, smtp_secure: e.target.checked })}
                      disabled={!emailForm.is_enabled}
                    />
                    Use SSL (check if using port 465)
                  </label>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>SMTP Username *</label>
                    <input
                      type="text"
                      value={emailForm.smtp_username || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, smtp_username: e.target.value })}
                      placeholder="your-email@gmail.com"
                      required={emailForm.is_enabled}
                      disabled={!emailForm.is_enabled}
                    />
                  </div>
                  <div className="form-group">
                    <label>SMTP Password *</label>
                    <input
                      type="password"
                      value={emailForm.smtp_password || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, smtp_password: e.target.value })}
                      placeholder="Enter password or app password"
                      required={emailForm.is_enabled}
                      disabled={!emailForm.is_enabled}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      For Gmail, use an App Password instead of your regular password
                    </p>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>From Email</label>
                    <input
                      type="email"
                      value={emailForm.from_email || ''}
                      onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })}
                      placeholder="noreply@schoolwizard.com"
                      disabled={!emailForm.is_enabled}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                      Leave empty to use SMTP username
                    </p>
                  </div>
                  <div className="form-group">
                    <label>From Name</label>
                    <input
                      type="text"
                      value={emailForm.from_name || 'SchoolWizard'}
                      onChange={(e) => setEmailForm({ ...emailForm, from_name: e.target.value })}
                      placeholder="SchoolWizard"
                      disabled={!emailForm.is_enabled}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Test Email Configuration</h3>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Test Email Address</label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      disabled={!emailForm.is_enabled || updateEmailSettingsMutation.isLoading}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleTestEmail}
                      disabled={!emailForm.is_enabled || !testEmail || testEmailMutation.isLoading || updateEmailSettingsMutation.isLoading}
                    >
                      {testEmailMutation.isLoading ? 'Sending...' : 'Send Test Email'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updateEmailSettingsMutation.isLoading}
                >
                  {updateEmailSettingsMutation.isLoading ? 'Saving...' : 'Save Email Settings'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Notification Settings Tab */}
      {activeTab === 'notifications' && <NotificationSettingsTab />}

      {/* SMS Settings Tab */}
      {activeTab === 'sms' && <SMSSettingsTab />}

      {/* Payment Gateway Settings Tab */}
      {activeTab === 'payment' && <PaymentGatewaySettingsTab />}

      {/* Print Settings Tab */}
      {activeTab === 'print' && <PrintSettingsTab />}


      {/* Languages Tab */}
      {activeTab === 'languages' && <LanguagesTab />}

      {/* Modules Tab */}
      {activeTab === 'modules' && <ModulesTab />}

      {/* Custom Fields Tab */}
      {activeTab === 'custom-fields' && <CustomFieldsTab />}

      {/* System Fields Tab */}
      {activeTab === 'system-fields' && <SystemFieldsTab />}

      {/* Backup / Restore Tab */}
      {activeTab === 'backup' && <BackupRestoreTab />}
    </div>
  );
};

// Notification Settings Component
const NotificationSettingsTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery(
    'notification-settings',
    () => settingsService.getNotificationSettings(),
    { refetchOnWindowFocus: false }
  );

  const [notifications, setNotifications] = useState<NotificationSetting[]>([]);

  React.useEffect(() => {
    if (notificationsData?.data) {
      setNotifications(notificationsData.data);
    }
  }, [notificationsData]);

  const updateNotificationMutation = useMutation(settingsService.updateNotificationSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('notification-settings');
      showToast('Notification settings updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update notification settings', 'error');
    },
  });

  const handleToggle = (index: number, field: keyof NotificationSetting) => {
    const updated = [...notifications];
    updated[index] = { ...updated[index], [field]: !updated[index][field] };
    setNotifications(updated);
  };

  const handleSave = () => {
    updateNotificationMutation.mutate(notifications);
  };

  if (isLoading) {
    return <div className="loading">Loading notification settings...</div>;
  }

  return (
    <div className="settings-content">
      <div className="section-header">
        <h3>Notification Settings</h3>
        <p>Configure which notifications to send via Email and SMS for different events</p>
      </div>

      <div className="notifications-table-wrapper">
        <table className="notifications-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Description</th>
              <th>Email - Student</th>
              <th>Email - Guardian</th>
              <th>Email - Staff</th>
              <th>SMS - Student</th>
              <th>SMS - Guardian</th>
              <th>SMS - Staff</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification, index) => (
              <tr key={notification.id}>
                <td><strong>{notification.display_name}</strong></td>
                <td>{notification.description || '-'}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={notification.email_enabled_student}
                    onChange={() => handleToggle(index, 'email_enabled_student')}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={notification.email_enabled_guardian}
                    onChange={() => handleToggle(index, 'email_enabled_guardian')}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={notification.email_enabled_staff}
                    onChange={() => handleToggle(index, 'email_enabled_staff')}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={notification.sms_enabled_student}
                    onChange={() => handleToggle(index, 'sms_enabled_student')}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={notification.sms_enabled_guardian}
                    onChange={() => handleToggle(index, 'sms_enabled_guardian')}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={notification.sms_enabled_staff}
                    onChange={() => handleToggle(index, 'sms_enabled_staff')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="form-actions">
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={updateNotificationMutation.isLoading}
        >
          {updateNotificationMutation.isLoading ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  );
};

// SMS Settings Component
const SMSSettingsTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState<SMSSetting | null>(null);

  const { data: smsData, isLoading } = useQuery(
    'sms-settings',
    () => settingsService.getSMSSettings(),
    { refetchOnWindowFocus: false }
  );

  const [formData, setFormData] = useState({
    sms_gateway: '',
    sms_api_key: '',
    sms_api_secret: '',
    sms_sender_id: '',
    sms_username: '',
    sms_password: '',
    sms_url: '',
    is_enabled: false,
  });

  const createMutation = useMutation(settingsService.createSMSSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('sms-settings');
      setShowModal(false);
      resetForm();
      showToast('SMS gateway added successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to add SMS gateway', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<SMSSetting> }) => settingsService.updateSMSSettings(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sms-settings');
        setShowModal(false);
        resetForm();
        showToast('SMS gateway updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update SMS gateway', 'error');
      },
    }
  );

  const deleteMutation = useMutation(settingsService.deleteSMSSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('sms-settings');
      showToast('SMS gateway deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete SMS gateway', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      sms_gateway: '',
      sms_api_key: '',
      sms_api_secret: '',
      sms_sender_id: '',
      sms_username: '',
      sms_password: '',
      sms_url: '',
      is_enabled: false,
    });
    setEditingGateway(null);
  };

  const handleEdit = (gateway: SMSSetting) => {
    setEditingGateway(gateway);
    setFormData({
      sms_gateway: gateway.sms_gateway,
      sms_api_key: gateway.sms_api_key || '',
      sms_api_secret: '',
      sms_sender_id: gateway.sms_sender_id || '',
      sms_username: gateway.sms_username || '',
      sms_password: '',
      sms_url: gateway.sms_url || '',
      is_enabled: gateway.is_enabled,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGateway) {
      updateMutation.mutate({ id: String(editingGateway.id), data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this SMS gateway?')) {
      deleteMutation.mutate(String(id));
    }
  };

  if (isLoading) {
    return <div className="loading">Loading SMS settings...</div>;
  }

  const gateways = smsData?.data || [];
  const gatewayOptions = ['twilio', 'msg91', 'clickatell', 'textlocal', 'sms_country', 'custom'];

  return (
    <div className="settings-content">
      <div className="section-header">
        <h3>SMS Gateway Settings</h3>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Add SMS Gateway
        </button>
      </div>

      <div className="sms-gateways-list">
        {gateways.length === 0 ? (
          <div className="empty-state">No SMS gateways configured. Add one to get started.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Gateway</th>
                <th>Sender ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {gateways.map((gateway) => (
                <tr key={gateway.id}>
                  <td>{gateway.sms_gateway}</td>
                  <td>{gateway.sms_sender_id || '-'}</td>
                  <td>
                    <span className={`status-badge ${gateway.is_enabled ? 'active' : 'inactive'}`}>
                      {gateway.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(gateway)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(gateway.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal isOpen={showModal} title={editingGateway ? 'Edit SMS Gateway' : 'Add SMS Gateway'} onClose={() => { setShowModal(false); resetForm(); }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>SMS Gateway *</label>
              <select
                value={formData.sms_gateway}
                onChange={(e) => setFormData({ ...formData, sms_gateway: e.target.value })}
                required
                disabled={!!editingGateway}
              >
                <option value="">Select Gateway</option>
                {gatewayOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>API Key</label>
                <input
                  type="text"
                  value={formData.sms_api_key}
                  onChange={(e) => setFormData({ ...formData, sms_api_key: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>API Secret</label>
                <input
                  type="password"
                  value={formData.sms_api_secret}
                  onChange={(e) => setFormData({ ...formData, sms_api_secret: e.target.value })}
                  placeholder={editingGateway ? 'Leave blank to keep current' : ''}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sender ID</label>
                <input
                  type="text"
                  value={formData.sms_sender_id}
                  onChange={(e) => setFormData({ ...formData, sms_sender_id: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.sms_username}
                  onChange={(e) => setFormData({ ...formData, sms_username: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.sms_password}
                onChange={(e) => setFormData({ ...formData, sms_password: e.target.value })}
                placeholder={editingGateway ? 'Leave blank to keep current' : ''}
              />
            </div>

            {formData.sms_gateway === 'custom' && (
              <div className="form-group">
                <label>API URL</label>
                <input
                  type="url"
                  value={formData.sms_url}
                  onChange={(e) => setFormData({ ...formData, sms_url: e.target.value })}
                  placeholder="https://api.example.com/send"
                />
              </div>
            )}

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                />
                Enable this gateway
              </label>
              <small>Only one gateway can be enabled at a time</small>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createMutation.isLoading || updateMutation.isLoading}>
                {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : editingGateway ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Payment Gateway Settings Component
const PaymentGatewaySettingsTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null);

  const { data: paymentData, isLoading } = useQuery(
    'payment-gateways',
    () => settingsService.getPaymentGateways(),
    { refetchOnWindowFocus: false }
  );

  const [formData, setFormData] = useState({
    gateway_name: '',
    display_name: '',
    api_key: '',
    api_secret: '',
    merchant_id: '',
    test_mode: true,
    is_enabled: false,
  });

  const createMutation = useMutation(settingsService.createPaymentGateway, {
    onSuccess: () => {
      queryClient.invalidateQueries('payment-gateways');
      setShowModal(false);
      resetForm();
      showToast('Payment gateway added successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to add payment gateway', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<PaymentGateway> }) => settingsService.updatePaymentGateway(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('payment-gateways');
        setShowModal(false);
        resetForm();
        showToast('Payment gateway updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update payment gateway', 'error');
      },
    }
  );

  const deleteMutation = useMutation(settingsService.deletePaymentGateway, {
    onSuccess: () => {
      queryClient.invalidateQueries('payment-gateways');
      showToast('Payment gateway deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete payment gateway', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      gateway_name: '',
      display_name: '',
      api_key: '',
      api_secret: '',
      merchant_id: '',
      test_mode: true,
      is_enabled: false,
    });
    setEditingGateway(null);
  };

  const handleEdit = (gateway: PaymentGateway) => {
    setEditingGateway(gateway);
    setFormData({
      gateway_name: gateway.gateway_name,
      display_name: gateway.display_name,
      api_key: gateway.api_key || '',
      api_secret: '',
      merchant_id: gateway.merchant_id || '',
      test_mode: gateway.test_mode,
      is_enabled: gateway.is_enabled,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGateway) {
      updateMutation.mutate({ id: String(editingGateway.id), data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this payment gateway?')) {
      deleteMutation.mutate(String(id));
    }
  };

  if (isLoading) {
    return <div className="loading">Loading payment gateway settings...</div>;
  }

  const gateways = paymentData?.data || [];
  const gatewayOptions = [
    { value: 'paypal', label: 'PayPal' },
    { value: 'stripe', label: 'Stripe' },
    { value: 'payu', label: 'PayU' },
    { value: 'ccavenue', label: 'CCAvenue' },
    { value: 'instamojo', label: 'Instamojo' },
    { value: 'paystack', label: 'Paystack' },
    { value: 'razorpay', label: 'Razorpay' },
  ];

  return (
    <div className="settings-content">
      <div className="section-header">
        <h3>Payment Gateway Settings</h3>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Add Payment Gateway
        </button>
      </div>

      <div className="payment-gateways-list">
        {gateways.length === 0 ? (
          <div className="empty-state">No payment gateways configured. Add one to enable online payments.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Gateway</th>
                <th>Display Name</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {gateways.map((gateway) => (
                <tr key={gateway.id}>
                  <td>{gateway.gateway_name}</td>
                  <td>{gateway.display_name}</td>
                  <td>
                    <span className={`status-badge ${gateway.test_mode ? 'warning' : 'success'}`}>
                      {gateway.test_mode ? 'Test Mode' : 'Live Mode'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${gateway.is_enabled ? 'active' : 'inactive'}`}>
                      {gateway.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(gateway)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(gateway.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal isOpen={showModal} title={editingGateway ? 'Edit Payment Gateway' : 'Add Payment Gateway'} onClose={() => { setShowModal(false); resetForm(); }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Gateway Name *</label>
              <select
                value={formData.gateway_name}
                onChange={(e) => setFormData({ ...formData, gateway_name: e.target.value, display_name: gatewayOptions.find(o => o.value === e.target.value)?.label || '' })}
                required
                disabled={!!editingGateway}
              >
                <option value="">Select Gateway</option>
                {gatewayOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Display Name *</label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>API Key</label>
                <input
                  type="text"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>API Secret</label>
                <input
                  type="password"
                  value={formData.api_secret}
                  onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                  placeholder={editingGateway ? 'Leave blank to keep current' : ''}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Merchant ID</label>
              <input
                type="text"
                value={formData.merchant_id}
                onChange={(e) => setFormData({ ...formData, merchant_id: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.test_mode}
                  onChange={(e) => setFormData({ ...formData, test_mode: e.target.checked })}
                />
                Test Mode
              </label>
              <small>Enable test mode for testing payments without real transactions</small>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                />
                Enable this gateway
              </label>
              <small>Only one gateway can be enabled at a time</small>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createMutation.isLoading || updateMutation.isLoading}>
                {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : editingGateway ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Print Settings Component
const PrintSettingsTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: printData, isLoading } = useQuery(
    'print-settings',
    () => settingsService.getPrintSettings(),
    { refetchOnWindowFocus: false }
  );

  const [formData, setFormData] = useState({
    header_image: '',
    footer_text: '',
  });

  React.useEffect(() => {
    if (printData?.data) {
      setFormData({
        header_image: printData.data.header?.header_image || '',
        footer_text: printData.data.footer?.footer_text || '',
      });
    }
  }, [printData]);

  const updateMutation = useMutation(settingsService.updatePrintSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('print-settings');
      showToast('Print settings updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update print settings', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="loading">Loading print settings...</div>;
  }

  return (
    <div className="settings-content">
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-section">
          <h3>Print Header & Footer Settings</h3>
          <div className="form-group">
            <label>Header Image URL</label>
            <input
              type="text"
              value={formData.header_image}
              onChange={(e) => setFormData({ ...formData, header_image: e.target.value })}
              placeholder="Path to header image (e.g., /uploads/header.png)"
            />
            <small>Upload header image and enter the path here</small>
          </div>
          <div className="form-group">
            <label>Footer Text</label>
            <textarea
              value={formData.footer_text}
              onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
              rows={4}
              placeholder="Enter footer text for printed documents"
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>
            {updateMutation.isLoading ? 'Saving...' : 'Save Print Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Languages Component
const LanguagesTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);

  const { data: languagesData, isLoading } = useQuery(
    'languages',
    () => settingsService.getLanguages(),
    { refetchOnWindowFocus: false }
  );

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_default: false,
    is_active: true,
  });

  const createMutation = useMutation(settingsService.createLanguage, {
    onSuccess: () => {
      queryClient.invalidateQueries('languages');
      setShowModal(false);
      resetForm();
      showToast('Language added successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to add language', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<Language> }) => settingsService.updateLanguage(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('languages');
        setShowModal(false);
        resetForm();
        showToast('Language updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update language', 'error');
      },
    }
  );

  const deleteMutation = useMutation(settingsService.deleteLanguage, {
    onSuccess: () => {
      queryClient.invalidateQueries('languages');
      showToast('Language deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete language', 'error');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', code: '', is_default: false, is_active: true });
    setEditingLanguage(null);
  };

  const handleEdit = (language: Language) => {
    setEditingLanguage(language);
    setFormData({
      name: language.name,
      code: language.code,
      is_default: language.is_default,
      is_active: language.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLanguage) {
      updateMutation.mutate({ id: String(editingLanguage.id), data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this language?')) {
      deleteMutation.mutate(String(id));
    }
  };

  if (isLoading) {
    return <div className="loading">Loading languages...</div>;
  }

  const languages = languagesData?.data || [];

  return (
    <div className="settings-content">
      <div className="section-header">
        <h3>Languages</h3>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + Add Language
        </button>
      </div>

      <div className="languages-list">
        {languages.length === 0 ? (
          <div className="empty-state">No languages configured.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Default</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {languages.map((lang) => (
                <tr key={lang.id}>
                  <td>{lang.name}</td>
                  <td>{lang.code}</td>
                  <td>
                    {lang.is_default && <span className="status-badge active">Default</span>}
                  </td>
                  <td>
                    <span className={`status-badge ${lang.is_active ? 'active' : 'inactive'}`}>
                      {lang.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(lang)}>Edit</button>
                      {!lang.is_default && (
                        <button className="btn-delete" onClick={() => handleDelete(lang.id)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal isOpen={showModal} title={editingLanguage ? 'Edit Language' : 'Add Language'} onClose={() => { setShowModal(false); resetForm(); }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Language Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Language Code (ISO) *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., EN, HI"
                maxLength={10}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                />
                Set as Default Language
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createMutation.isLoading || updateMutation.isLoading}>
                {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : editingLanguage ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Modules Component
const ModulesTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: modulesData, isLoading } = useQuery(
    'modules-settings',
    () => settingsService.getModulesSettings(),
    { refetchOnWindowFocus: false }
  );

  const updateMutation = useMutation(
    ({ id, is_active }: { id: string; is_active: boolean }) => settingsService.updateModuleStatus(id, is_active),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('modules-settings');
        showToast('Module status updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update module status', 'error');
      },
    }
  );

  const handleToggle = (module: Module) => {
    if (module.name === 'dashboard') {
      showToast('Cannot disable dashboard module', 'error');
      return;
    }
    updateMutation.mutate({ id: String(module.id), is_active: !module.is_active });
  };

  if (isLoading) {
    return <div className="loading">Loading modules...</div>;
  }

  const modules = modulesData?.data || [];

  return (
    <div className="settings-content">
      <div className="section-header">
        <h3>Modules Settings</h3>
        <p>Enable or disable system modules</p>
      </div>

      <div className="modules-list">
        <table className="data-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((module) => (
              <tr key={module.id}>
                <td>
                  <strong>{module.display_name}</strong>
                  {module.name === 'dashboard' && <span className="status-badge warning" style={{ marginLeft: '8px' }}>Protected</span>}
                </td>
                <td>{module.description || '-'}</td>
                <td>
                  <span className={`status-badge ${module.is_active ? 'active' : 'inactive'}`}>
                    {module.is_active ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <button
                    className={module.is_active ? 'btn-secondary' : 'btn-primary'}
                    onClick={() => handleToggle(module)}
                    disabled={module.name === 'dashboard' || updateMutation.isLoading}
                  >
                    {module.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Custom Fields Component
const CustomFieldsTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [filterType, setFilterType] = useState<'student' | 'staff' | ''>('');

  const { data: fieldsData, isLoading } = useQuery(
    ['custom-fields', filterType],
    () => settingsService.getCustomFields(filterType || undefined),
    { refetchOnWindowFocus: false }
  );

  const [formData, setFormData] = useState({
    field_belongs_to: 'student' as 'student' | 'staff',
    field_type: 'text',
    field_name: '',
    field_label: '',
    field_values: '',
    grid_column: 12,
    is_required: false,
    is_visible: true,
    display_order: 0,
  });

  const createMutation = useMutation(settingsService.createCustomField, {
    onSuccess: () => {
      queryClient.invalidateQueries('custom-fields');
      setShowModal(false);
      resetForm();
      showToast('Custom field added successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to add custom field', 'error');
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<CustomField> }) => settingsService.updateCustomField(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('custom-fields');
        setShowModal(false);
        resetForm();
        showToast('Custom field updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update custom field', 'error');
      },
    }
  );

  const deleteMutation = useMutation(settingsService.deleteCustomField, {
    onSuccess: () => {
      queryClient.invalidateQueries('custom-fields');
      showToast('Custom field deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete custom field', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      field_belongs_to: 'student',
      field_type: 'text',
      field_name: '',
      field_label: '',
      field_values: '',
      grid_column: 12,
      is_required: false,
      is_visible: true,
      display_order: 0,
    });
    setEditingField(null);
  };

  const handleEdit = (field: CustomField) => {
    setEditingField(field);
    setFormData({
      field_belongs_to: field.field_belongs_to,
      field_type: field.field_type,
      field_name: field.field_name,
      field_label: field.field_label,
      field_values: field.field_values || '',
      grid_column: field.grid_column,
      is_required: field.is_required,
      is_visible: field.is_visible,
      display_order: field.display_order,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingField) {
      updateMutation.mutate({ id: String(editingField.id), data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this custom field?')) {
      deleteMutation.mutate(String(id));
    }
  };

  if (isLoading) {
    return <div className="loading">Loading custom fields...</div>;
  }

  const fields = fieldsData?.data || [];
  const fieldTypes = ['text', 'number', 'date', 'select', 'textarea', 'email', 'tel', 'url'];

  return (
    <div className="settings-content">
      <div className="section-header">
        <h3>Custom Fields</h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
            <option value="">All</option>
            <option value="student">Student</option>
            <option value="staff">Staff</option>
          </select>
          <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            + Add Custom Field
          </button>
        </div>
      </div>

      <div className="custom-fields-list">
        {fields.length === 0 ? (
          <div className="empty-state">No custom fields configured.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Field Label</th>
                <th>Field Name</th>
                <th>Type</th>
                <th>Belongs To</th>
                <th>Required</th>
                <th>Visible</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.id}>
                  <td>{field.field_label}</td>
                  <td>{field.field_name}</td>
                  <td>{field.field_type}</td>
                  <td>{field.field_belongs_to}</td>
                  <td>{field.is_required ? 'Yes' : 'No'}</td>
                  <td>{field.is_visible ? 'Yes' : 'No'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(field)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(field.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <Modal isOpen={showModal} title={editingField ? 'Edit Custom Field' : 'Add Custom Field'} onClose={() => { setShowModal(false); resetForm(); }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Field Belongs To *</label>
              <select
                value={formData.field_belongs_to}
                onChange={(e) => setFormData({ ...formData, field_belongs_to: e.target.value as 'student' | 'staff' })}
                required
                disabled={!!editingField}
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
              </select>
            </div>
            <div className="form-group">
              <label>Field Type *</label>
              <select
                value={formData.field_type}
                onChange={(e) => setFormData({ ...formData, field_type: e.target.value })}
                required
              >
                {fieldTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Field Name *</label>
              <input
                type="text"
                value={formData.field_name}
                onChange={(e) => setFormData({ ...formData, field_name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                placeholder="field_name (auto-formatted)"
                required
              />
            </div>
            <div className="form-group">
              <label>Field Label *</label>
              <input
                type="text"
                value={formData.field_label}
                onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                required
              />
            </div>
            {formData.field_type === 'select' && (
              <div className="form-group">
                <label>Field Values (comma-separated) *</label>
                <input
                  type="text"
                  value={formData.field_values}
                  onChange={(e) => setFormData({ ...formData, field_values: e.target.value })}
                  placeholder="Option1, Option2, Option3"
                  required={formData.field_type === 'select'}
                />
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>Grid Column</label>
                <input
                  type="number"
                  value={formData.grid_column}
                  onChange={(e) => setFormData({ ...formData, grid_column: Number(e.target.value) })}
                  min={1}
                  max={12}
                />
              </div>
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                  min={0}
                />
              </div>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                />
                Required Field
              </label>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_visible}
                  onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                />
                Visible
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createMutation.isLoading || updateMutation.isLoading}>
                {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : editingField ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// System Fields Component
const SystemFieldsTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<'student' | 'staff' | ''>('');

  const { data: fieldsData, isLoading } = useQuery(
    ['system-fields', filterType],
    () => settingsService.getSystemFields(filterType || undefined),
    { refetchOnWindowFocus: false }
  );

  const updateMutation = useMutation(
    ({ id, is_enabled }: { id: string; is_enabled: boolean }) => settingsService.updateSystemFieldStatus(id, is_enabled),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('system-fields');
        showToast('System field status updated successfully', 'success');
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update system field status', 'error');
      },
    }
  );

  const handleToggle = (field: SystemField) => {
    updateMutation.mutate({ id: String(field.id), is_enabled: !field.is_enabled });
  };

  if (isLoading) {
    return <div className="loading">Loading system fields...</div>;
  }

  const fields = fieldsData?.data || [];

  return (
    <div className="settings-content">
      <div className="section-header">
        <h3>System Fields</h3>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
          <option value="">All</option>
          <option value="student">Student</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      <div className="system-fields-list">
        {fields.length === 0 ? (
          <div className="empty-state">No system fields found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Field Label</th>
                <th>Field Name</th>
                <th>Belongs To</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field.id}>
                  <td>{field.field_label}</td>
                  <td>{field.field_name}</td>
                  <td>{field.field_belongs_to}</td>
                  <td>
                    <span className={`status-badge ${field.is_enabled ? 'active' : 'inactive'}`}>
                      {field.is_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={field.is_enabled ? 'btn-secondary' : 'btn-primary'}
                      onClick={() => handleToggle(field)}
                      disabled={updateMutation.isLoading}
                    >
                      {field.is_enabled ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// Backup / Restore Component
const BackupRestoreTab = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreBackupId, setRestoreBackupId] = useState<number | null>(null);
  const [showCronKey, setShowCronKey] = useState(false);

  const { data: backupsData, isLoading: backupsLoading } = useQuery(
    'backup-records',
    () => settingsService.getBackupRecords(),
    { refetchOnWindowFocus: false }
  );

  const { data: backupSettingsData, isLoading: settingsLoading } = useQuery(
    'backup-settings',
    () => settingsService.getBackupSettings(),
    { refetchOnWindowFocus: false }
  );

  const [settingsForm, setSettingsForm] = useState<Partial<BackupSettings>>({});

  React.useEffect(() => {
    if (backupSettingsData?.data) {
      setSettingsForm(backupSettingsData.data);
    }
  }, [backupSettingsData]);

  const createBackupMutation = useMutation(settingsService.createBackup, {
    onSuccess: () => {
      queryClient.invalidateQueries('backup-records');
      showToast('Backup created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create backup', 'error');
    },
  });

  const restoreBackupMutation = useMutation(settingsService.restoreBackup, {
    onSuccess: () => {
      queryClient.invalidateQueries('backup-records');
      setShowRestoreConfirm(false);
      setRestoreBackupId(null);
      showToast('Backup restored successfully. Please refresh the page.', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to restore backup', 'error');
    },
  });

  const deleteBackupMutation = useMutation(settingsService.deleteBackup, {
    onSuccess: () => {
      queryClient.invalidateQueries('backup-records');
      showToast('Backup deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete backup', 'error');
    },
  });

  const updateSettingsMutation = useMutation(settingsService.updateBackupSettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('backup-settings');
      showToast('Backup settings updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update backup settings', 'error');
    },
  });

  const generateCronKeyMutation = useMutation(settingsService.generateCronSecretKey, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('backup-settings');
      setSettingsForm({ ...settingsForm, cron_secret_key: data.data.cron_secret_key });
      showToast('Cron secret key generated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to generate cron key', 'error');
    },
  });

  const handleDownload = async (backup: BackupRecord) => {
    try {
      const blob = await settingsService.downloadBackup(String(backup.id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backup.backup_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Backup download started', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to download backup', 'error');
    }
  };

  const handleRestore = (id: number) => {
    setRestoreBackupId(id);
    setShowRestoreConfirm(true);
  };

  const confirmRestore = () => {
    if (restoreBackupId) {
      if (window.confirm('⚠️ WARNING: This will replace all current data with the backup. This action cannot be undone. Are you absolutely sure?')) {
        restoreBackupMutation.mutate(String(restoreBackupId));
      }
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this backup?')) {
      deleteBackupMutation.mutate(String(id));
    }
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settingsForm);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (backupsLoading || settingsLoading) {
    return <div className="loading">Loading backup settings...</div>;
  }

  const backups = backupsData?.data || [];

  return (
    <div className="settings-content">
      <div className="section-header">
        <h3>Backup & Restore</h3>
        <button
          className="btn-primary"
          onClick={() => createBackupMutation.mutate()}
          disabled={createBackupMutation.isLoading}
        >
          {createBackupMutation.isLoading ? 'Creating...' : '+ Create Backup'}
        </button>
      </div>

      <div className="backup-section">
        <h4>Backup Records</h4>
        {backups.length === 0 ? (
          <div className="empty-state">No backups found. Create your first backup to get started.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Backup Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.id}>
                  <td>{backup.backup_name}</td>
                  <td>
                    <span className={`status-badge ${backup.backup_type === 'automatic' ? 'warning' : 'active'}`}>
                      {backup.backup_type}
                    </span>
                  </td>
                  <td>{formatFileSize(backup.file_size)}</td>
                  <td>{backup.created_by_name || 'System'}</td>
                  <td>{new Date(backup.created_at).toLocaleString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleDownload(backup)}>Download</button>
                      <button className="btn-secondary" onClick={() => handleRestore(backup.id)}>Restore</button>
                      <button className="btn-delete" onClick={() => handleDelete(backup.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="backup-settings-section" style={{ marginTop: 'var(--spacing-2xl)' }}>
        <h4>Backup Settings</h4>
        <form onSubmit={handleSettingsSubmit} className="settings-form">
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={settingsForm.auto_backup_enabled || false}
                onChange={(e) => setSettingsForm({ ...settingsForm, auto_backup_enabled: e.target.checked })}
              />
              Enable Automatic Backups
            </label>
          </div>

          {settingsForm.auto_backup_enabled && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label>Backup Frequency</label>
                  <select
                    value={settingsForm.backup_frequency || 'daily'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, backup_frequency: e.target.value as any })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Backup Time</label>
                  <input
                    type="time"
                    value={settingsForm.backup_time || '02:00'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, backup_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Keep Backups (Number)</label>
                <input
                  type="number"
                  value={settingsForm.keep_backups || 7}
                  onChange={(e) => setSettingsForm({ ...settingsForm, keep_backups: Number(e.target.value) })}
                  min={1}
                  max={30}
                />
                <small>Number of backups to keep. Older backups will be automatically deleted.</small>
              </div>

              <div className="form-group">
                <label>Cron Secret Key</label>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                  <input
                    type={showCronKey ? 'text' : 'password'}
                    value={settingsForm.cron_secret_key || ''}
                    readOnly
                    style={{ flex: 1 }}
                    placeholder="Generate a secret key for cron job"
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowCronKey(!showCronKey)}
                  >
                    {showCronKey ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => generateCronKeyMutation.mutate()}
                    disabled={generateCronKeyMutation.isLoading}
                  >
                    {generateCronKeyMutation.isLoading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
                <small>
                  Use this key in your cron job URL: /api/v1/settings/backups/cron?key=YOUR_SECRET_KEY
                </small>
              </div>
            </>
          )}

          {settingsForm.last_backup_at && (
            <div className="form-group">
              <label>Last Backup</label>
              <p>{new Date(settingsForm.last_backup_at).toLocaleString()}</p>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={updateSettingsMutation.isLoading}>
              {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Backup Settings'}
            </button>
          </div>
        </form>
      </div>

      {showRestoreConfirm && (
        <Modal isOpen={showRestoreConfirm} title="Confirm Restore" onClose={() => { setShowRestoreConfirm(false); setRestoreBackupId(null); }}>
          <div>
            <p style={{ color: 'var(--error-color)', fontWeight: 'bold', marginBottom: 'var(--spacing-md)' }}>
              ⚠️ WARNING: This action cannot be undone!
            </p>
            <p>Restoring this backup will replace all current database data. Make sure you have a current backup before proceeding.</p>
            <div className="modal-actions" style={{ marginTop: 'var(--spacing-lg)' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setShowRestoreConfirm(false); setRestoreBackupId(null); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmRestore}
                disabled={restoreBackupMutation.isLoading}
                style={{ background: 'var(--error-color)' }}
              >
                {restoreBackupMutation.isLoading ? 'Restoring...' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Settings;

