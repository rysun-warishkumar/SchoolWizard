import React, { useState } from 'react';
import './CurriculumPage.css';

const CurriculumPage: React.FC = () => {
  const [activeLevel, setActiveLevel] = useState<string>('primary');

  const levels = [
    { id: 'primary', name: 'Primary', icon: 'fas fa-child' },
    { id: 'middle', name: 'Middle School', icon: 'fas fa-user-graduate' },
    { id: 'high', name: 'High School', icon: 'fas fa-graduation-cap' },
  ];

  const subjects = {
    primary: [
      { name: 'English', description: 'Language skills, reading, writing, and communication', icon: 'fas fa-book' },
      { name: 'Mathematics', description: 'Basic arithmetic, problem-solving, and logical thinking', icon: 'fas fa-calculator' },
      { name: 'Science', description: 'Introduction to natural sciences and experiments', icon: 'fas fa-flask' },
      { name: 'Social Studies', description: 'History, geography, and civic education', icon: 'fas fa-globe' },
      { name: 'Arts & Crafts', description: 'Creative expression through various art forms', icon: 'fas fa-palette' },
      { name: 'Physical Education', description: 'Sports, fitness, and healthy lifestyle habits', icon: 'fas fa-running' },
    ],
    middle: [
      { name: 'English Language', description: 'Advanced language skills and literature', icon: 'fas fa-book-open' },
      { name: 'Mathematics', description: 'Algebra, geometry, and advanced problem-solving', icon: 'fas fa-calculator' },
      { name: 'Science', description: 'Physics, Chemistry, and Biology fundamentals', icon: 'fas fa-atom' },
      { name: 'Social Studies', description: 'World history, geography, and civics', icon: 'fas fa-map' },
      { name: 'Computer Science', description: 'Programming basics and digital literacy', icon: 'fas fa-laptop-code' },
      { name: 'Foreign Language', description: 'Second language acquisition and culture', icon: 'fas fa-language' },
      { name: 'Arts', description: 'Visual arts, music, and performing arts', icon: 'fas fa-music' },
      { name: 'Physical Education', description: 'Team sports and fitness training', icon: 'fas fa-dumbbell' },
    ],
    high: [
      { name: 'English Literature', description: 'Advanced literature analysis and composition', icon: 'fas fa-scroll' },
      { name: 'Advanced Mathematics', description: 'Calculus, statistics, and advanced algebra', icon: 'fas fa-chart-line' },
      { name: 'Physics', description: 'Mechanics, thermodynamics, and modern physics', icon: 'fas fa-atom' },
      { name: 'Chemistry', description: 'Organic, inorganic, and physical chemistry', icon: 'fas fa-vial' },
      { name: 'Biology', description: 'Cell biology, genetics, and ecology', icon: 'fas fa-dna' },
      { name: 'History', description: 'World history and historical analysis', icon: 'fas fa-landmark' },
      { name: 'Economics', description: 'Micro and macroeconomics principles', icon: 'fas fa-chart-pie' },
      { name: 'Computer Science', description: 'Advanced programming and software development', icon: 'fas fa-code' },
      { name: 'Foreign Language', description: 'Advanced language proficiency', icon: 'fas fa-comments' },
    ],
  };

  const features = [
    {
      icon: 'fas fa-chalkboard-teacher',
      title: 'Experienced Faculty',
      description: 'Our teachers are highly qualified and dedicated to student success.',
    },
    {
      icon: 'fas fa-laptop',
      title: 'Digital Learning',
      description: 'Modern technology integrated into every aspect of learning.',
    },
    {
      icon: 'fas fa-users',
      title: 'Small Class Sizes',
      description: 'Personalized attention with optimal student-teacher ratios.',
    },
    {
      icon: 'fas fa-trophy',
      title: 'Competitive Programs',
      description: 'Preparation for national and international competitions.',
    },
  ];

  return (
    <div className="curriculum-page">
      {/* Hero Section */}
      <section className="curriculum-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Our Curriculum</h1>
            <p className="hero-subtitle">A Comprehensive Educational Program Designed for Excellence</p>
          </div>
        </div>
      </section>

      {/* Level Tabs */}
      <section className="levels-section">
        <div className="container">
          <div className="levels-tabs">
            {levels.map((level) => (
              <button
                key={level.id}
                className={`level-tab ${activeLevel === level.id ? 'active' : ''}`}
                onClick={() => setActiveLevel(level.id)}
              >
                <i className={level.icon}></i>
                <span>{level.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="subjects-section">
        <div className="container">
          <div className="section-header">
            <h2>{levels.find(l => l.id === activeLevel)?.name} Curriculum</h2>
            <p className="section-subtitle">Comprehensive subjects designed to foster holistic development</p>
          </div>
          <div className="subjects-grid">
            {subjects[activeLevel as keyof typeof subjects].map((subject, index) => (
              <div
                key={index}
                className="subject-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="subject-icon">
                  <i className={subject.icon}></i>
                </div>
                <h3>{subject.name}</h3>
                <p>{subject.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="curriculum-features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Our Curriculum?</h2>
            <p className="section-subtitle">Features that set us apart</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="feature-icon">
                  <i className={feature.icon}></i>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Assessment Section */}
      <section className="assessment-section">
        <div className="container">
          <div className="assessment-content">
            <div className="assessment-text">
              <h2>Continuous Assessment</h2>
              <p>
                We believe in continuous evaluation rather than relying solely on final examinations. Our assessment
                system includes:
              </p>
              <ul className="assessment-list">
                <li>
                  <i className="fas fa-check-circle"></i>
                  <span>Regular quizzes and assignments</span>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <span>Project-based learning assessments</span>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <span>Practical examinations and presentations</span>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <span>Mid-term and final examinations</span>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  <span>Portfolio-based evaluation</span>
                </li>
              </ul>
            </div>
            <div className="assessment-image">
              <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600" alt="Assessment" />
            </div>
          </div>
        </div>
      </section>

      {/* Extracurricular Section */}
      <section className="extracurricular-section">
        <div className="container">
          <div className="section-header">
            <h2>Beyond the Classroom</h2>
            <p className="section-subtitle">Extracurricular activities that complement our curriculum</p>
          </div>
          <div className="extracurricular-grid">
            <div className="activity-card">
              <div className="activity-icon">
                <i className="fas fa-futbol"></i>
              </div>
              <h3>Sports</h3>
              <p>Cricket, Football, Basketball, Swimming, Athletics, and more</p>
            </div>
            <div className="activity-card">
              <div className="activity-icon">
                <i className="fas fa-paint-brush"></i>
              </div>
              <h3>Arts & Culture</h3>
              <p>Drama, Music, Dance, Painting, and Cultural Programs</p>
            </div>
            <div className="activity-card">
              <div className="activity-icon">
                <i className="fas fa-robot"></i>
              </div>
              <h3>STEM Clubs</h3>
              <p>Robotics, Science Club, Math Olympiad, Coding Club</p>
            </div>
            <div className="activity-card">
              <div className="activity-icon">
                <i className="fas fa-hands-helping"></i>
              </div>
              <h3>Community Service</h3>
              <p>Social work, Environmental initiatives, Charity drives</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CurriculumPage;
