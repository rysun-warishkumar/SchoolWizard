import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  certificateService,
  CertificateTemplate,
  IdCardTemplate,
} from '../../services/api/certificateService';
import { studentsService } from '../../services/api/studentsService';
import { academicsService } from '../../services/api/academicsService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Certificate.css';

// Get API base URL for images
const getApiBaseUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace('/api/v1', '');
  }
  return 'http://localhost:5000';
};
const API_BASE_URL = getApiBaseUrl();

type TabType = 'certificate' | 'generate-certificate' | 'id-card' | 'generate-id-card';

// ========== Certificate Component ==========

interface CertificateComponentProps {
  student: any;
  template: CertificateTemplate;
}

const CertificateComponent = ({ student, template }: CertificateComponentProps) => {
  // Replace variables in text
  const replaceVariables = (text: string): string => {
    if (!text) return '';
    let result = text;
    const variables: Record<string, string> = {
      student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      admission_no: student.admission_no || '',
      roll_no: student.roll_no || '',
      class: student.class_name || '',
      section: student.section_name || '',
      class_section: student.class_section || `${student.class_name || ''} - ${student.section_name || ''}`,
      father_name: student.father_name || '',
      mother_name: student.mother_name || '',
      guardian_name: student.guardian_name || student.father_name || '',
      date_of_birth: student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '',
      gender: student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : '',
      blood_group: student.blood_group || '',
      address: student.current_address || student.permanent_address || '',
      phone: student.student_mobile || student.father_phone || '',
      email: student.email || '',
      date: new Date().toLocaleDateString(),
    };

    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, variables[key]);
    });
    return result;
  };

  const certificateStyle: React.CSSProperties = {
    width: `${template.body_width || 800}px`,
    margin: '0 auto 40px',
    padding: '20px',
    backgroundColor: 'white',
    border: '2px solid #000',
    position: 'relative',
    backgroundImage: template.background_image ? `url(${API_BASE_URL}${template.background_image})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: `${(template.header_height || 100) + (template.body_height || 400) + (template.footer_height || 100)}px`,
  };

  const headerStyle: React.CSSProperties = {
    minHeight: `${template.header_height || 100}px`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '10px',
    borderBottom: '1px solid #ddd',
  };

  const bodyStyle: React.CSSProperties = {
    minHeight: `${template.body_height || 400}px`,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  };

  const footerStyle: React.CSSProperties = {
    minHeight: `${template.footer_height || 100}px`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '10px',
    borderTop: '1px solid #ddd',
  };

  return (
    <div className="certificate-wrapper" style={certificateStyle}>
      {/* Header */}
      {(template.header_left_text || template.header_center_text || template.header_right_text) && (
        <div style={headerStyle}>
          <div style={{ flex: 1, textAlign: 'left' }}>
            {template.header_left_text && (
              <div dangerouslySetInnerHTML={{ __html: replaceVariables(template.header_left_text).replace(/\n/g, '<br />') }} />
            )}
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            {template.header_center_text && (
              <div dangerouslySetInnerHTML={{ __html: replaceVariables(template.header_center_text).replace(/\n/g, '<br />') }} />
            )}
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {template.header_right_text && (
              <div dangerouslySetInnerHTML={{ __html: replaceVariables(template.header_right_text).replace(/\n/g, '<br />') }} />
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div style={bodyStyle}>
        {template.student_photo_enabled && (
          <div style={{ marginBottom: '20px' }}>
            {student.photo ? (
              <img
                src={`${API_BASE_URL}${student.photo}`}
                alt="Student"
                style={{
                  width: `${template.photo_height || 100}px`,
                  height: `${template.photo_height || 100}px`,
                  objectFit: 'cover',
                  border: '2px solid #000',
                  borderRadius: '4px',
                }}
              />
            ) : (
              <div
                style={{
                  width: `${template.photo_height || 100}px`,
                  height: `${template.photo_height || 100}px`,
                  border: '2px solid #000',
                  borderRadius: '4px',
                  backgroundColor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: '12px',
                }}
              >
                Photo
              </div>
            )}
          </div>
        )}
        {template.body_text && (
          <div
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: '1.8',
              fontSize: '16px',
            }}
            dangerouslySetInnerHTML={{
              __html: replaceVariables(template.body_text).replace(/\n/g, '<br />'),
            }}
          />
        )}
      </div>

      {/* Footer */}
      {(template.footer_left_text || template.footer_center_text || template.footer_right_text) && (
        <div style={footerStyle}>
          <div style={{ flex: 1, textAlign: 'left' }}>
            {template.footer_left_text && (
              <div dangerouslySetInnerHTML={{ __html: replaceVariables(template.footer_left_text).replace(/\n/g, '<br />') }} />
            )}
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            {template.footer_center_text && (
              <div dangerouslySetInnerHTML={{ __html: replaceVariables(template.footer_center_text).replace(/\n/g, '<br />') }} />
            )}
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            {template.footer_right_text && (
              <div dangerouslySetInnerHTML={{ __html: replaceVariables(template.footer_right_text).replace(/\n/g, '<br />') }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ========== ID Card Component ==========

interface IdCardComponentProps {
  student: any;
  template: IdCardTemplate;
}

const IdCardComponent = ({ student, template }: IdCardComponentProps) => {
  // Replace variables in text
  const replaceVariables = (text: string): string => {
    if (!text) return '';
    let result = text;
    const variables: Record<string, string> = {
      student_name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      admission_no: student.admission_no || '',
      roll_no: student.roll_no || '',
      class: student.class_name || '',
      section: student.section_name || '',
      class_section: student.class_section || `${student.class_name || ''} - ${student.section_name || ''}`,
      father_name: student.father_name || '',
      mother_name: student.mother_name || '',
      guardian_name: student.guardian_name || student.father_name || '',
      date_of_birth: student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '',
      gender: student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : '',
      blood_group: student.blood_group || '',
      address: student.current_address || student.permanent_address || '',
      phone: student.student_mobile || student.father_phone || '',
      email: student.email || '',
    };

    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, variables[key]);
    });
    return result;
  };

  const idCardStyle: React.CSSProperties = {
    width: '350px',
    height: '220px',
    margin: '0 auto 20px',
    padding: '15px',
    backgroundColor: 'white',
    border: '2px solid #000',
    position: 'relative',
    backgroundImage: template.background_image ? `url(${API_BASE_URL}${template.background_image})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: template.header_color || '#000000',
    color: 'white',
    padding: '8px',
    textAlign: 'center',
    marginBottom: '10px',
    borderRadius: '4px',
  };

  return (
    <div className="id-card-wrapper" style={idCardStyle}>
      {/* Header */}
      {template.id_card_title && (
        <div style={headerStyle}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{replaceVariables(template.id_card_title)}</div>
        </div>
      )}

      {/* Logo and School Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        {template.logo && (
          <img
            src={`${API_BASE_URL}${template.logo}`}
            alt="Logo"
            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
          />
        )}
        <div style={{ flex: 1, textAlign: 'center', fontSize: '12px' }}>
          {template.school_name && <div style={{ fontWeight: 'bold' }}>{template.school_name}</div>}
          {template.address && <div>{template.address}</div>}
          {template.phone && <div>Phone: {template.phone}</div>}
          {template.email && <div>Email: {template.email}</div>}
        </div>
      </div>

      {/* Student Photo and Info */}
      <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
        <div>
          {student.photo ? (
            <img
              src={`${API_BASE_URL}${student.photo}`}
              alt="Student"
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'cover',
                border: '2px solid #000',
                borderRadius: '4px',
              }}
            />
          ) : (
            <div
              style={{
                width: '80px',
                height: '80px',
                border: '2px solid #000',
                borderRadius: '4px',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '10px',
              }}
            >
              Photo
            </div>
          )}
        </div>
        <div style={{ flex: 1, fontSize: '11px', lineHeight: '1.6' }}>
          {template.admission_number_enabled && (
            <div><strong>Admission No:</strong> {student.admission_no || '-'}</div>
          )}
          {template.student_name_enabled && (
            <div><strong>Name:</strong> {`${student.first_name || ''} ${student.last_name || ''}`.trim() || '-'}</div>
          )}
          {template.class_enabled && (
            <div><strong>Class:</strong> {student.class_section || '-'}</div>
          )}
          {template.father_name_enabled && student.father_name && (
            <div><strong>Father:</strong> {student.father_name}</div>
          )}
          {template.mother_name_enabled && student.mother_name && (
            <div><strong>Mother:</strong> {student.mother_name}</div>
          )}
          {template.student_address_enabled && (student.current_address || student.permanent_address) && (
            <div><strong>Address:</strong> {student.current_address || student.permanent_address}</div>
          )}
          {template.phone_enabled && (student.student_mobile || student.father_phone) && (
            <div><strong>Phone:</strong> {student.student_mobile || student.father_phone}</div>
          )}
          {template.date_of_birth_enabled && student.date_of_birth && (
            <div><strong>DOB:</strong> {new Date(student.date_of_birth).toLocaleDateString()}</div>
          )}
          {template.blood_group_enabled && student.blood_group && (
            <div><strong>Blood Group:</strong> {student.blood_group}</div>
          )}
        </div>
      </div>

      {/* Signature */}
      {template.signature && (
        <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '10px' }}>
          <img
            src={`${API_BASE_URL}${template.signature}`}
            alt="Signature"
            style={{ height: '30px', objectFit: 'contain' }}
          />
          <div>Principal</div>
        </div>
      )}
    </div>
  );
};

const Certificate = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['certificate', 'generate-certificate', 'id-card', 'generate-id-card'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'certificate';

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="certificate-page">
      <div className="page-header">
        <h1>Certificate</h1>
      </div>

      <div className="certificate-tabs">
        <button
          className={activeTab === 'certificate' ? 'active' : ''}
          onClick={() => handleTabChange('certificate')}
        >
          Student Certificate
        </button>
        <button
          className={activeTab === 'generate-certificate' ? 'active' : ''}
          onClick={() => handleTabChange('generate-certificate')}
        >
          Generate Certificate
        </button>
        <button
          className={activeTab === 'id-card' ? 'active' : ''}
          onClick={() => handleTabChange('id-card')}
        >
          Student ID Card
        </button>
        <button
          className={activeTab === 'generate-id-card' ? 'active' : ''}
          onClick={() => handleTabChange('generate-id-card')}
        >
          Generate ID Card
        </button>
      </div>

      <div className="certificate-content">
        {activeTab === 'certificate' && <CertificateTemplateTab />}
        {activeTab === 'generate-certificate' && <GenerateCertificateTab />}
        {activeTab === 'id-card' && <IdCardTemplateTab />}
        {activeTab === 'generate-id-card' && <GenerateIdCardTab />}
      </div>
    </div>
  );
};

// ========== Certificate Template Tab ==========

const CertificateTemplateTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, refetch, error } = useQuery(
    'certificate-templates',
    () => certificateService.getCertificateTemplates(),
    {
      refetchOnWindowFocus: true,
      retry: false,
      onError: (err: any) => {
        console.error('Error fetching certificate templates:', err);
      }
    }
  );

  const [formData, setFormData] = useState({
    name: '',
    header_left_text: '',
    header_center_text: '',
    header_right_text: '',
    body_text: '',
    footer_left_text: '',
    footer_center_text: '',
    footer_right_text: '',
    header_height: '100',
    footer_height: '100',
    body_height: '400',
    body_width: '800',
    student_photo_enabled: false,
    photo_height: '100',
    background_image: null as File | null,
  });

  const createMutation = useMutation(
    (data: any) => certificateService.createCertificateTemplate(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('certificate-templates');
        refetch();
        showToast('Certificate template created successfully', 'success');
        setShowCreateModal(false);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to create certificate template', 'error');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => certificateService.updateCertificateTemplate(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('certificate-templates');
        refetch();
        showToast('Certificate template updated successfully', 'success');
        setShowEditModal(false);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update certificate template', 'error');
      },
    }
  );

  const deleteMutation = useMutation(certificateService.deleteCertificateTemplate, {
    onSuccess: () => {
      queryClient.invalidateQueries('certificate-templates');
      refetch();
      showToast('Certificate template deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete certificate template', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      header_left_text: '',
      header_center_text: '',
      header_right_text: '',
      body_text: '',
      footer_left_text: '',
      footer_center_text: '',
      footer_right_text: '',
      header_height: '100',
      footer_height: '100',
      body_height: '400',
      body_width: '800',
      student_photo_enabled: false,
      photo_height: '100',
      background_image: null,
    });
    setSelectedTemplate(null);
  };

  const handleEdit = (template: CertificateTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      header_left_text: template.header_left_text || '',
      header_center_text: template.header_center_text || '',
      header_right_text: template.header_right_text || '',
      body_text: template.body_text || '',
      footer_left_text: template.footer_left_text || '',
      footer_center_text: template.footer_center_text || '',
      footer_right_text: template.footer_right_text || '',
      header_height: String(template.header_height),
      footer_height: String(template.footer_height),
      body_height: String(template.body_height),
      body_width: String(template.body_width),
      student_photo_enabled: template.student_photo_enabled,
      photo_height: String(template.photo_height),
      background_image: null,
    });
    setShowEditModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('Certificate template name is required', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !formData.name) {
      showToast('Certificate template name is required', 'error');
      return;
    }
    updateMutation.mutate({ id: selectedTemplate.id, data: formData });
  };

  return (
    <div className="certificate-tab-content">
      <div className="tab-header">
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Add Certificate Template
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="empty-state" style={{ color: 'var(--danger-color)' }}>
          Error loading certificate templates. Please ensure the database tables are created.
        </div>
      ) : templates.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{new Date(template.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm btn-secondary" onClick={() => handleEdit(template)}>Edit</button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this certificate template?')) {
                          deleteMutation.mutate(template.id);
                        }
                      }}
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
        <div className="empty-state">No certificate templates found</div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="Add Certificate Template" size="large">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>Certificate Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Header Left Text</label>
              <input
                type="text"
                value={formData.header_left_text}
                onChange={(e) => setFormData({ ...formData, header_left_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Header Center Text</label>
              <input
                type="text"
                value={formData.header_center_text}
                onChange={(e) => setFormData({ ...formData, header_center_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Header Right Text</label>
              <input
                type="text"
                value={formData.header_right_text}
                onChange={(e) => setFormData({ ...formData, header_right_text: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Body Text</label>
            <textarea
              rows={5}
              value={formData.body_text}
              onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
              placeholder="Use keywords like {student_name}, {class}, {date} for dynamic data"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Footer Left Text</label>
              <input
                type="text"
                value={formData.footer_left_text}
                onChange={(e) => setFormData({ ...formData, footer_left_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Footer Center Text</label>
              <input
                type="text"
                value={formData.footer_center_text}
                onChange={(e) => setFormData({ ...formData, footer_center_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Footer Right Text</label>
              <input
                type="text"
                value={formData.footer_right_text}
                onChange={(e) => setFormData({ ...formData, footer_right_text: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Header Height (px)</label>
              <input
                type="number"
                value={formData.header_height}
                onChange={(e) => setFormData({ ...formData, header_height: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Footer Height (px)</label>
              <input
                type="number"
                value={formData.footer_height}
                onChange={(e) => setFormData({ ...formData, footer_height: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Body Height (px)</label>
              <input
                type="number"
                value={formData.body_height}
                onChange={(e) => setFormData({ ...formData, body_height: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Body Width (px)</label>
              <input
                type="number"
                value={formData.body_width}
                onChange={(e) => setFormData({ ...formData, body_width: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.student_photo_enabled}
                  onChange={(e) => setFormData({ ...formData, student_photo_enabled: e.target.checked })}
                />
                Enable Student Photo
              </label>
            </div>
            <div className="form-group">
              <label>Photo Height (px)</label>
              <input
                type="number"
                value={formData.photo_height}
                onChange={(e) => setFormData({ ...formData, photo_height: e.target.value })}
                disabled={!formData.student_photo_enabled}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Background Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, background_image: e.target.files?.[0] || null })}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit Certificate Template" size="large">
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-group">
            <label>Certificate Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Header Left Text</label>
              <input
                type="text"
                value={formData.header_left_text}
                onChange={(e) => setFormData({ ...formData, header_left_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Header Center Text</label>
              <input
                type="text"
                value={formData.header_center_text}
                onChange={(e) => setFormData({ ...formData, header_center_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Header Right Text</label>
              <input
                type="text"
                value={formData.header_right_text}
                onChange={(e) => setFormData({ ...formData, header_right_text: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Body Text</label>
            <textarea
              rows={5}
              value={formData.body_text}
              onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
              placeholder="Use keywords like {student_name}, {class}, {date} for dynamic data"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Footer Left Text</label>
              <input
                type="text"
                value={formData.footer_left_text}
                onChange={(e) => setFormData({ ...formData, footer_left_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Footer Center Text</label>
              <input
                type="text"
                value={formData.footer_center_text}
                onChange={(e) => setFormData({ ...formData, footer_center_text: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Footer Right Text</label>
              <input
                type="text"
                value={formData.footer_right_text}
                onChange={(e) => setFormData({ ...formData, footer_right_text: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Header Height (px)</label>
              <input
                type="number"
                value={formData.header_height}
                onChange={(e) => setFormData({ ...formData, header_height: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Footer Height (px)</label>
              <input
                type="number"
                value={formData.footer_height}
                onChange={(e) => setFormData({ ...formData, footer_height: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Body Height (px)</label>
              <input
                type="number"
                value={formData.body_height}
                onChange={(e) => setFormData({ ...formData, body_height: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Body Width (px)</label>
              <input
                type="number"
                value={formData.body_width}
                onChange={(e) => setFormData({ ...formData, body_width: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.student_photo_enabled}
                  onChange={(e) => setFormData({ ...formData, student_photo_enabled: e.target.checked })}
                />
                Enable Student Photo
              </label>
            </div>
            <div className="form-group">
              <label>Photo Height (px)</label>
              <input
                type="number"
                value={formData.photo_height}
                onChange={(e) => setFormData({ ...formData, photo_height: e.target.value })}
                disabled={!formData.student_photo_enabled}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Background Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, background_image: e.target.files?.[0] || null })}
            />
            {selectedTemplate?.background_image && (
              <p className="form-hint">Current: {selectedTemplate.background_image}</p>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); resetForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Generate Certificate Tab ==========

const GenerateCertificateTab = () => {
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const { showToast } = useToast();

  const { data: templates = [] } = useQuery('certificate-templates', () => certificateService.getCertificateTemplates());
  const { data: classes = [] } = useQuery('classes', () => academicsService.getClasses().then((res) => res.data));
  const { data: sections = [] } = useQuery('sections', () => academicsService.getSections().then((res) => res.data));

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

  const generateMutation = useMutation(certificateService.generateCertificate, {
    onSuccess: (data) => {
      setPreviewData(data.data);
      setShowPreview(true);
      showToast('Certificate generated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to generate certificate', 'error');
    },
  });

  const students = studentsData?.data || [];

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s: any) => s.id));
    }
  };

  const handleGenerate = () => {
    if (!selectedTemplateId) {
      showToast('Please select a certificate template', 'error');
      return;
    }
    if (selectedStudentIds.length === 0) {
      showToast('Please select at least one student', 'error');
      return;
    }
    generateMutation.mutate({
      template_id: Number(selectedTemplateId),
      student_ids: selectedStudentIds,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="certificate-tab-content">
      <div className="filters-section">
        <div className="form-row">
          <div className="form-group">
            <label>Certificate Template</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              <option value="">Select Template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Class</label>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSectionFilter('');
                setSelectedStudentIds([]);
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
              onChange={(e) => {
                setSectionFilter(e.target.value);
                setSelectedStudentIds([]);
              }}
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

      {classFilter && sectionFilter && students.length > 0 && (
        <>
          <div className="tab-header">
            <button className="btn-secondary" onClick={handleSelectAll}>
              {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={!selectedTemplateId || selectedStudentIds.length === 0 || generateMutation.isLoading}
            >
              {generateMutation.isLoading ? 'Generating...' : 'Generate Certificate'}
            </button>
          </div>

          <div className="students-list">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.length === students.length && students.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Admission No</th>
                  <th>Name</th>
                  <th>Class</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any) => (
                  <tr key={student.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => handleStudentToggle(student.id)}
                      />
                    </td>
                    <td>{student.admission_no}</td>
                    <td>{`${student.first_name} ${student.last_name || ''}`.trim()}</td>
                    <td>{student.class_name} - {student.section_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showPreview && previewData && (
        <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Certificate Preview" size="large">
          <div className="certificate-preview">
            <div className="preview-actions">
              <button className="btn-primary" onClick={handlePrint}>Print / Save as PDF</button>
            </div>
            <div className="certificates-container">
              {previewData.students.map((student: any) => (
                <CertificateComponent
                  key={student.id}
                  student={student}
                  template={previewData.template}
                />
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ========== ID Card Template Tab ==========

const IdCardTemplateTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<IdCardTemplate | null>(null);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, refetch, error } = useQuery(
    'id-card-templates',
    () => certificateService.getIdCardTemplates(),
    {
      refetchOnWindowFocus: true,
      retry: false,
      onError: (err: any) => {
        console.error('Error fetching ID card templates:', err);
      }
    }
  );

  const [formData, setFormData] = useState({
    name: '',
    school_name: '',
    address: '',
    phone: '',
    email: '',
    id_card_title: '',
    header_color: '#000000',
    admission_number_enabled: true,
    student_name_enabled: true,
    class_enabled: true,
    father_name_enabled: false,
    mother_name_enabled: false,
    student_address_enabled: false,
    phone_enabled: false,
    date_of_birth_enabled: false,
    blood_group_enabled: false,
    background_image: null as File | null,
    logo: null as File | null,
    signature: null as File | null,
  });

  const createMutation = useMutation(
    (data: any) => certificateService.createIdCardTemplate(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('id-card-templates');
        refetch();
        showToast('ID card template created successfully', 'success');
        setShowCreateModal(false);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to create ID card template', 'error');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: any }) => certificateService.updateIdCardTemplate(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('id-card-templates');
        refetch();
        showToast('ID card template updated successfully', 'success');
        setShowEditModal(false);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update ID card template', 'error');
      },
    }
  );

  const deleteMutation = useMutation(certificateService.deleteIdCardTemplate, {
    onSuccess: () => {
      queryClient.invalidateQueries('id-card-templates');
      refetch();
      showToast('ID card template deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete ID card template', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      school_name: '',
      address: '',
      phone: '',
      email: '',
      id_card_title: '',
      header_color: '#000000',
      admission_number_enabled: true,
      student_name_enabled: true,
      class_enabled: true,
      father_name_enabled: false,
      mother_name_enabled: false,
      student_address_enabled: false,
      phone_enabled: false,
      date_of_birth_enabled: false,
      blood_group_enabled: false,
      background_image: null,
      logo: null,
      signature: null,
    });
    setSelectedTemplate(null);
  };

  const handleEdit = (template: IdCardTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      school_name: template.school_name || '',
      address: template.address || '',
      phone: template.phone || '',
      email: template.email || '',
      id_card_title: template.id_card_title || '',
      header_color: template.header_color,
      admission_number_enabled: template.admission_number_enabled,
      student_name_enabled: template.student_name_enabled,
      class_enabled: template.class_enabled,
      father_name_enabled: template.father_name_enabled,
      mother_name_enabled: template.mother_name_enabled,
      student_address_enabled: template.student_address_enabled,
      phone_enabled: template.phone_enabled,
      date_of_birth_enabled: template.date_of_birth_enabled,
      blood_group_enabled: template.blood_group_enabled,
      background_image: null,
      logo: null,
      signature: null,
    });
    setShowEditModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('ID card template name is required', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !formData.name) {
      showToast('ID card template name is required', 'error');
      return;
    }
    updateMutation.mutate({ id: selectedTemplate.id, data: formData });
  };

  return (
    <div className="certificate-tab-content">
      <div className="tab-header">
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Add ID Card Template
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="empty-state" style={{ color: 'var(--danger-color)' }}>
          Error loading ID card templates. Please ensure the database tables are created.
        </div>
      ) : templates.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{new Date(template.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm btn-secondary" onClick={() => handleEdit(template)}>Edit</button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this ID card template?')) {
                          deleteMutation.mutate(template.id);
                        }
                      }}
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
        <div className="empty-state">No ID card templates found</div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="Add ID Card Template" size="large">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>Template Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Background Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, background_image: e.target.files?.[0] || null })}
              />
            </div>
            <div className="form-group">
              <label>Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] || null })}
              />
            </div>
            <div className="form-group">
              <label>Signature</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, signature: e.target.files?.[0] || null })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>School Name</label>
            <input
              type="text"
              value={formData.school_name}
              onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ID Card Title</label>
              <input
                type="text"
                value={formData.id_card_title}
                onChange={(e) => setFormData({ ...formData, id_card_title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Header Color</label>
              <input
                type="color"
                value={formData.header_color}
                onChange={(e) => setFormData({ ...formData, header_color: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Enable Fields:</label>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.admission_number_enabled}
                  onChange={(e) => setFormData({ ...formData, admission_number_enabled: e.target.checked })}
                />
                Admission Number
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.student_name_enabled}
                  onChange={(e) => setFormData({ ...formData, student_name_enabled: e.target.checked })}
                />
                Student Name
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.class_enabled}
                  onChange={(e) => setFormData({ ...formData, class_enabled: e.target.checked })}
                />
                Class
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.father_name_enabled}
                  onChange={(e) => setFormData({ ...formData, father_name_enabled: e.target.checked })}
                />
                Father Name
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.mother_name_enabled}
                  onChange={(e) => setFormData({ ...formData, mother_name_enabled: e.target.checked })}
                />
                Mother Name
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.student_address_enabled}
                  onChange={(e) => setFormData({ ...formData, student_address_enabled: e.target.checked })}
                />
                Student Address
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.phone_enabled}
                  onChange={(e) => setFormData({ ...formData, phone_enabled: e.target.checked })}
                />
                Phone
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.date_of_birth_enabled}
                  onChange={(e) => setFormData({ ...formData, date_of_birth_enabled: e.target.checked })}
                />
                Date of Birth
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.blood_group_enabled}
                  onChange={(e) => setFormData({ ...formData, blood_group_enabled: e.target.checked })}
                />
                Blood Group
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>
              {createMutation.isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); resetForm(); }} title="Edit ID Card Template" size="large">
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-group">
            <label>Template Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Background Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, background_image: e.target.files?.[0] || null })}
              />
              {selectedTemplate?.background_image && (
                <p className="form-hint">Current: {selectedTemplate.background_image}</p>
              )}
            </div>
            <div className="form-group">
              <label>Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] || null })}
              />
              {selectedTemplate?.logo && (
                <p className="form-hint">Current: {selectedTemplate.logo}</p>
              )}
            </div>
            <div className="form-group">
              <label>Signature</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, signature: e.target.files?.[0] || null })}
              />
              {selectedTemplate?.signature && (
                <p className="form-hint">Current: {selectedTemplate.signature}</p>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>School Name</label>
            <input
              type="text"
              value={formData.school_name}
              onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>ID Card Title</label>
              <input
                type="text"
                value={formData.id_card_title}
                onChange={(e) => setFormData({ ...formData, id_card_title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Header Color</label>
              <input
                type="color"
                value={formData.header_color}
                onChange={(e) => setFormData({ ...formData, header_color: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Enable Fields:</label>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.admission_number_enabled}
                  onChange={(e) => setFormData({ ...formData, admission_number_enabled: e.target.checked })}
                />
                Admission Number
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.student_name_enabled}
                  onChange={(e) => setFormData({ ...formData, student_name_enabled: e.target.checked })}
                />
                Student Name
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.class_enabled}
                  onChange={(e) => setFormData({ ...formData, class_enabled: e.target.checked })}
                />
                Class
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.father_name_enabled}
                  onChange={(e) => setFormData({ ...formData, father_name_enabled: e.target.checked })}
                />
                Father Name
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.mother_name_enabled}
                  onChange={(e) => setFormData({ ...formData, mother_name_enabled: e.target.checked })}
                />
                Mother Name
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.student_address_enabled}
                  onChange={(e) => setFormData({ ...formData, student_address_enabled: e.target.checked })}
                />
                Student Address
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.phone_enabled}
                  onChange={(e) => setFormData({ ...formData, phone_enabled: e.target.checked })}
                />
                Phone
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.date_of_birth_enabled}
                  onChange={(e) => setFormData({ ...formData, date_of_birth_enabled: e.target.checked })}
                />
                Date of Birth
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={formData.blood_group_enabled}
                  onChange={(e) => setFormData({ ...formData, blood_group_enabled: e.target.checked })}
                />
                Blood Group
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); resetForm(); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>
              {updateMutation.isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Generate ID Card Tab ==========

const GenerateIdCardTab = () => {
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const { showToast } = useToast();

  const { data: templates = [] } = useQuery('id-card-templates', () => certificateService.getIdCardTemplates());
  const { data: classes = [] } = useQuery('classes', () => academicsService.getClasses().then((res) => res.data));
  const { data: sections = [] } = useQuery('sections', () => academicsService.getSections().then((res) => res.data));

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

  const generateMutation = useMutation(certificateService.generateIdCard, {
    onSuccess: (data) => {
      setPreviewData(data.data);
      setShowPreview(true);
      showToast('ID card generated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to generate ID card', 'error');
    },
  });

  const students = studentsData?.data || [];

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s: any) => s.id));
    }
  };

  const handleGenerate = () => {
    if (!selectedTemplateId) {
      showToast('Please select an ID card template', 'error');
      return;
    }
    if (selectedStudentIds.length === 0) {
      showToast('Please select at least one student', 'error');
      return;
    }
    generateMutation.mutate({
      template_id: Number(selectedTemplateId),
      student_ids: selectedStudentIds,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="certificate-tab-content">
      <div className="filters-section">
        <div className="form-row">
          <div className="form-group">
            <label>ID Card Template</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              <option value="">Select Template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Class</label>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSectionFilter('');
                setSelectedStudentIds([]);
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
              onChange={(e) => {
                setSectionFilter(e.target.value);
                setSelectedStudentIds([]);
              }}
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

      {classFilter && sectionFilter && students.length > 0 && (
        <>
          <div className="tab-header">
            <button className="btn-secondary" onClick={handleSelectAll}>
              {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={!selectedTemplateId || selectedStudentIds.length === 0 || generateMutation.isLoading}
            >
              {generateMutation.isLoading ? 'Generating...' : 'Generate ID Card'}
            </button>
          </div>

          <div className="students-list">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.length === students.length && students.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Admission No</th>
                  <th>Name</th>
                  <th>Class</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any) => (
                  <tr key={student.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.id)}
                        onChange={() => handleStudentToggle(student.id)}
                      />
                    </td>
                    <td>{student.admission_no}</td>
                    <td>{`${student.first_name} ${student.last_name || ''}`.trim()}</td>
                    <td>{student.class_name} - {student.section_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showPreview && previewData && (
        <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="ID Card Preview" size="large">
          <div className="certificate-preview">
            <div className="preview-actions">
              <button className="btn-primary" onClick={handlePrint}>Print / Save as PDF</button>
            </div>
            <div className="id-cards-container">
              {previewData.students.map((student: any) => (
                <IdCardComponent
                  key={student.id}
                  student={student}
                  template={previewData.template}
                />
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Certificate;

