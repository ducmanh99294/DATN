import React from 'react';
import '../assets/notFound.css';

const Test = () => {
  return (
    <div className="app">
      {/* Header / Navigation */}
      <header className="header">
        <div className="logo">MediSaaS</div>
        <nav className="nav">
          <a href="#services">Services</a>
          <a href="#specialists">Specialists</a>
          <a href="#insights">Insights</a>
          <a href="#contact">Contact</a>
        </nav>
        <button className="btn-outline">Portal</button>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Empowering Modern Healthcare with Smart Data.</h1>
          <p>
            Revolutionize patient care and manage clinical workflows with our advanced SaaS platform.
            Efficient, Secure, Integrated.
          </p>
          <div className="search-bar">
            <input type="text" placeholder="Find Doctors, Services, or Clinics..." />
            <button className="btn-primary">Search</button>
          </div>
        </div>
        <div className="hero-image">
          {/* Placeholder for illustration */}
          <div className="image-placeholder">🏥 Healthcare Illustration</div>
        </div>
      </section>

      {/* Key Medical Services */}
      <section id="services" className="services">
        <h2>Key Medical Services</h2>
        <div className="services-grid">
          <div className="service-card">
            <div className="icon">❤️</div>
            <h3>Cardiology</h3>
            <p>Revolutionize patient care connectivity + wellness and unceasing medical records.</p>
          </div>
          <div className="service-card">
            <div className="icon">🦴</div>
            <h3>Orthopedics</h3>
            <p>Revolutionize patient care and manage clinical workflows with our advanced SaaS.</p>
          </div>
          <div className="service-card">
            <div className="icon">🧠</div>
            <h3>Neurology</h3>
            <p>Revolutionize patient care and manage clinical workflows with our open-source solutions.</p>
          </div>
          <div className="service-card">
            <div className="icon">📞</div>
            <h3>Telehealth</h3>
            <p>Revolutionize patient care and manage clinical workflows with our latest technologies.</p>
          </div>
        </div>
      </section>

      {/* Featured Specialists */}
      <section id="specialists" className="specialists">
        <h2>Featured Specialists</h2>
        <div className="specialists-grid">
          <div className="specialist-card">
            <div className="avatar">👩‍⚕️</div>
            <h3>Dr. Alisha Khan</h3>
            <p>Specialty: <strong>Cardiology</strong></p>
            <div className="rating">★★★★☆ <span>(9)</span></div>
            <button className="btn-book">Book Now</button>
          </div>
          <div className="specialist-card">
            <div className="avatar">👨‍⚕️</div>
            <h3>Dr. Marcus Lee</h3>
            <p>Specialty: <strong>Orthopedics</strong></p>
            <div className="rating">★★★★★ <span>(10)</span></div>
            <button className="btn-book">Book Now</button>
          </div>
          <div className="specialist-card">
            <div className="avatar">👩‍⚕️</div>
            <h3>Dr. Sarah Chen</h3>
            <p>Specialty: <strong>Neurology</strong></p>
            <div className="rating">★★★★★ <span>(15)</span></div>
            <button className="btn-book">Book Now</button>
          </div>
        </div>
      </section>

      {/* Latest Healthcare Insights */}
      <section id="insights" className="insights">
        <h2>Latest Healthcare Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-category">Categories - Date</div>
            <h3>Sain atrms to Yourfounding: Healthcare Hi Trady</h3>
            <p>Discover the latest trends and innovations in medical technology and patient care.</p>
            <a href="#" className="read-more">Read more →</a>
          </div>
          <div className="insight-card">
            <div className="insight-category">Innovation - 2 days ago</div>
            <h3>How AI is Transforming Clinical Workflows</h3>
            <p>Learn how artificial intelligence is streamlining operations and improving outcomes.</p>
            <a href="#" className="read-more">Read more →</a>
          </div>
          <div className="insight-card">
            <div className="insight-category">Policy - 1 week ago</div>
            <h3>New Regulations for Telehealth Services</h3>
            <p>Stay updated on the latest compliance requirements for remote patient care.</p>
            <a href="#" className="read-more">Read more →</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">MediSaaS</div>
          <p>© 2025 MediSaaS. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Test;