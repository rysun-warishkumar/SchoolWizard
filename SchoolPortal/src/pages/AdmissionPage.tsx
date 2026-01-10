import React, { useState, useEffect } from 'react';
import { websiteService } from '../services/api';
import './AdmissionPage.css';

const AdmissionPage: React.FC = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    parentName: '',
    email: '',
    phone: '',
    grade: '',
    previousSchool: '',
    address: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [importantDates, setImportantDates] = useState<any[]>([]);
  const [contactDetails, setContactDetails] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dates, contact] = await Promise.all([
          websiteService.getImportantDates(),
          websiteService.getContactDetails(),
        ]);
        setImportantDates(dates);
        setContactDetails(contact);
      } catch (error) {
        console.error('Error fetching admission data:', error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await websiteService.submitAdmissionInquiry({
        student_name: formData.studentName,
        parent_name: formData.parentName,
        email: formData.email,
        phone: formData.phone,
        grade: formData.grade,
        previous_school: formData.previousSchool || undefined,
        address: formData.address,
        message: formData.message || undefined,
      });
      alert('Thank you for your interest! We will contact you soon.');
      setFormData({
        studentName: '',
        parentName: '',
        email: '',
        phone: '',
        grade: '',
        previousSchool: '',
        address: '',
        message: '',
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const admissionProcess = [
    {
      step: '01',
      title: 'Inquiry',
      description: 'Submit an inquiry form or visit our school for information',
    },
    {
      step: '02',
      title: 'Application',
      description: 'Fill out the admission application form with required documents',
    },
    {
      step: '03',
      title: 'Assessment',
      description: 'Student assessment and interaction with the admission committee',
    },
    {
      step: '04',
      title: 'Confirmation',
      description: 'Receive admission confirmation and complete enrollment process',
    },
  ];

  const requirements = [
    'Birth Certificate',
    'Previous School Records',
    'Transfer Certificate (if applicable)',
    'Medical Certificate',
    'Passport-sized Photographs',
    'Parent/Guardian ID Proof',
    'Address Proof',
  ];

  const grades = [
    'Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  ];

  return (
    <div className="admission-page">
      {/* Hero Section */}
      <section className="admission-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Admission</h1>
            <p className="hero-subtitle">Begin Your Journey with Us - Excellence Awaits</p>
          </div>
        </div>
      </section>

      {/* Admission Process Section */}
      <section className="process-section">
        <div className="container">
          <div className="section-header">
            <h2>Admission Process</h2>
            <p className="section-subtitle">Simple steps to join our school community</p>
          </div>
          <div className="process-timeline">
            {admissionProcess.map((process, index) => (
              <div key={index} className="process-step" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="step-number">{process.step}</div>
                <div className="step-content">
                  <h3>{process.title}</h3>
                  <p>{process.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="form-section">
        <div className="container">
          <div className="form-container">
            <div className="form-header">
              <h2>Admission Application Form</h2>
              <p>Fill out the form below and we'll get back to you soon</p>
            </div>
            <form onSubmit={handleSubmit} className="admission-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="studentName">Student Name *</label>
                  <input
                    type="text"
                    id="studentName"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    required
                    placeholder="Enter student's full name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="parentName">Parent/Guardian Name *</label>
                  <input
                    type="text"
                    id="parentName"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleChange}
                    required
                    placeholder="Enter parent/guardian name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 1234567890"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="grade">Grade Applying For *</label>
                  <select
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Grade</option>
                    {grades.map((grade, index) => (
                      <option key={index} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="previousSchool">Previous School</label>
                  <input
                    type="text"
                    id="previousSchool"
                    name="previousSchool"
                    value={formData.previousSchool}
                    onChange={handleChange}
                    placeholder="Name of previous school (if applicable)"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Enter your complete address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Additional Information</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Any additional information you'd like to share..."
                />
              </div>

              <button type="submit" className="submit-btn" disabled={submitting}>
                <i className="fas fa-paper-plane"></i>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="requirements-section">
        <div className="container">
          <div className="requirements-content">
            <div className="requirements-text">
              <h2>Required Documents</h2>
              <p>Please ensure you have the following documents ready for the admission process:</p>
              <ul className="requirements-list">
                {requirements.map((req, index) => (
                  <li key={index}>
                    <i className="fas fa-check"></i>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="requirements-image">
              <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600" alt="Documents" />
            </div>
          </div>
        </div>
      </section>

      {/* Important Dates Section */}
      {contactDetails?.important_dates_visible !== false && (
        <section className="dates-section">
          <div className="container">
            <div className="section-header">
              <h2>Important Dates</h2>
              <p className="section-subtitle">Mark your calendar for admission-related events</p>
            </div>
            {importantDates.length > 0 ? (
              <div className="dates-grid">
                {importantDates.map((date) => (
                  <div key={date.id} className="date-card">
                    <div className="date-icon">
                      <i className="fas fa-calendar-alt"></i>
                    </div>
                    <h3>{date.title}</h3>
                    <p className="date">{new Date(date.date_value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    {date.description && <p className="description">{date.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No important dates configured yet.</div>
            )}
          </div>
        </section>
      )}

      {/* Contact Info Section */}
      {contactDetails?.contact_details_visible !== false && contactDetails && (
        <section className="contact-info-section">
          <div className="container">
            <div className="contact-info-grid">
              {(() => {
                try {
                  const callNumbers = contactDetails.call_us_numbers ? JSON.parse(contactDetails.call_us_numbers) : [];
                  const emailAddresses = contactDetails.email_us_addresses ? JSON.parse(contactDetails.email_us_addresses) : [];
                  
                  return (
                    <>
                      {Array.isArray(callNumbers) && callNumbers.length > 0 && (
                        <div className="info-card">
                          <div className="info-icon">
                            <i className="fas fa-phone"></i>
                          </div>
                          <h3>Call Us</h3>
                          {callNumbers.map((num: string, idx: number) => (
                            <p key={idx}>{num}</p>
                          ))}
                        </div>
                      )}
                      {Array.isArray(emailAddresses) && emailAddresses.length > 0 && (
                        <div className="info-card">
                          <div className="info-icon">
                            <i className="fas fa-envelope"></i>
                          </div>
                          <h3>Email Us</h3>
                          {emailAddresses.map((email: string, idx: number) => (
                            <p key={idx}>{email}</p>
                          ))}
                        </div>
                      )}
                      {contactDetails.visit_us_address && (
                        <div className="info-card">
                          <div className="info-icon">
                            <i className="fas fa-map-marker-alt"></i>
                          </div>
                          <h3>Visit Us</h3>
                          {contactDetails.visit_us_address.split('\n').map((line: string, idx: number) => (
                            <p key={idx}>{line}</p>
                          ))}
                        </div>
                      )}
                      {contactDetails.office_hours && (
                        <div className="info-card">
                          <div className="info-icon">
                            <i className="fas fa-clock"></i>
                          </div>
                          <h3>Office Hours</h3>
                          {contactDetails.office_hours.split('\n').map((line: string, idx: number) => (
                            <p key={idx}>{line}</p>
                          ))}
                        </div>
                      )}
                    </>
                  );
                } catch (e) {
                  return null;
                }
              })()}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AdmissionPage;
