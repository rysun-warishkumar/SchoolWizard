import React, { useState } from 'react';
import { websiteService } from '../services/api';
import './ContactPage.css';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

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
      await websiteService.submitContactMessage({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject || undefined,
        message: formData.message,
      });
      
      alert('Thank you for contacting us! We will get back to you soon.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: 'fas fa-map-marker-alt',
      title: 'Address',
      details: [
        'School Name',
        'Street Address, City',
        'State - PIN Code',
        'Country',
      ],
      color: 'var(--primary-blue)',
    },
    {
      icon: 'fas fa-phone',
      title: 'Phone',
      details: [
        '+91 1234567890',
        '+91 9876543210',
        'Mon - Fri: 9:00 AM - 5:00 PM',
      ],
      color: 'var(--accent-green)',
    },
    {
      icon: 'fas fa-envelope',
      title: 'Email',
      details: [
        'info@schoolname.edu',
        'admissions@schoolname.edu',
        'support@schoolname.edu',
      ],
      color: 'var(--accent-yellow)',
    },
    {
      icon: 'fas fa-clock',
      title: 'Office Hours',
      details: [
        'Monday - Friday: 9:00 AM - 5:00 PM',
        'Saturday: 9:00 AM - 1:00 PM',
        'Sunday: Closed',
      ],
      color: 'var(--accent-orange)',
    },
  ];

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Contact Us</h1>
            <p className="hero-subtitle">We'd love to hear from you. Get in touch with us!</p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="contact-info-section">
        <div className="container">
          <div className="contact-info-grid">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="contact-info-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="info-icon" style={{ backgroundColor: info.color }}>
                  <i className={info.icon}></i>
                </div>
                <h3>{info.title}</h3>
                <div className="info-details">
                  {info.details.map((detail, idx) => (
                    <p key={idx}>{detail}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map Section */}
      <section className="contact-form-section">
        <div className="container">
          <div className="contact-form-container">
            <div className="form-wrapper">
              <div className="form-header">
                <h2>Send us a Message</h2>
                <p>Fill out the form below and we'll respond as soon as possible</p>
              </div>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Your Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
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
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 1234567890"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a subject</option>
                      <option value="admission">Admission Inquiry</option>
                      <option value="general">General Inquiry</option>
                      <option value="academic">Academic Information</option>
                      <option value="sports">Sports & Activities</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    placeholder="Type your message here..."
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={submitting}>
                  <i className="fas fa-paper-plane"></i>
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            <div className="map-wrapper">
              <div className="map-container">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.184132576894!2d-73.98811768459384!3d40.75889597932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25855c6480299%3A0x55194ec5a1ae072e!2sTimes%20Square!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0, borderRadius: '12px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="School Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="social-section">
        <div className="container">
          <div className="section-header">
            <h2>Connect With Us</h2>
            <p className="section-subtitle">Follow us on social media for updates and news</p>
          </div>
          <div className="social-links-grid">
            <a href="#" className="social-link facebook">
              <i className="fab fa-facebook-f"></i>
              <span>Facebook</span>
            </a>
            <a href="#" className="social-link twitter">
              <i className="fab fa-twitter"></i>
              <span>Twitter</span>
            </a>
            <a href="#" className="social-link instagram">
              <i className="fab fa-instagram"></i>
              <span>Instagram</span>
            </a>
            <a href="#" className="social-link youtube">
              <i className="fab fa-youtube"></i>
              <span>YouTube</span>
            </a>
            <a href="#" className="social-link linkedin">
              <i className="fab fa-linkedin-in"></i>
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
