import React from 'react';
import { Search, Star, Heart, Activity, Brain, Tablet } from 'lucide-react';
import '../assets/notFound.css'

const Test = () => {
  return (
    <div className="medisaas-container">
      
      <div 
        className="layer-1-background" 
      >
        <div 
          className="bg-image-area"
          style={{ backgroundImage: `url(${bg})` }}
        >
          <div 
            className="wave"
          >
            <svg viewBox="0 0 1440 320" style={{ display: 'block', width: '100%', height: 'auto' }}>
              <path
                fill="#ffffff"
                d="M0,224L80,213.3C160,203,320,181,480,186.7C640,192,800,224,960,224C1120,224,1280,192,1360,176L1440,160L1440,320L0,320Z"
              />
            </svg>
          </div>
        </div>
        <div className="bg-white-area" ></div>
      </div>
      <div className="layer-2-content">
        <header className="header-content">  
          <nav className="navbar">
            <div className="logo">
              <Activity className="logo-icon" />
              <span>MediSaaS</span>
            </div>
            <ul className="nav-links">
              <li>Services</li>
              <li>Doctors</li>
              <li>Dashboard</li>
              <li>Resources</li>
              <li>Blog</li>
              <li>Contact</li>
            </ul>
            <div className="nav-actions">
              <Search className="search-icon-nav" size={20} />
              <button className="btn-get-started">Get Started</button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="hero-content" style={{ marginTop: '80px' }}>
            <div className="stats-grid">
              <div className="stat-card glass">
                <span className="stat-value">15K+</span>
                <span className="stat-label">Active Patients</span>
              </div>
              <div className="stat-card glass">
                <span className="stat-value">250+</span>
                <span className="stat-label">Specialized Doctors</span>
              </div>
              <div className="stat-card glass">
                <span className="stat-value">98%</span>
                <span className="stat-label">Satisfaction</span>
              </div>
              <div className="stat-card glass">
                <span className="stat-value">1M+</span>
                <span className="stat-label">Records Managed</span>
              </div>
            </div>

            <h1 style={{ color: 'white' }}>Empowering Modern Healthcare with Smart Data.</h1>
            <p style={{ color: 'white' }}>Revolutionize patient care and manage clinical workflows with our advanced SaaS platform. Efficient, Secure, Integrated.</p>

            <div className="search-bar-container">
              <input type="text" placeholder="Find Doctors, Services, or Clinics..." />
              <button className="btn-search">Search</button>
            </div>
          </div>
        </header>

        {/* Main Content Area (Không chứa background trắng cứng nữa) */}
        <main className="main-content" style={{ backgroundColor: 'transparent', padding: '50px 80px' }}>
          <div className="content-grid">
            {/* Left Column: Services & Insights */}
            <section className="services-section">
              <h2 className="section-title">Key Medical Services</h2>
              <div className="services-grid">
                <ServiceCard icon={<Heart color="#1e90ff" />} title="Cardiology" />
                <ServiceCard icon={<Activity color="#00ced1" />} title="Orthopedics" />
                <ServiceCard icon={<Brain color="#4b0082" />} title="Neurology" />
                <ServiceCard icon={<Tablet color="#4682b4" />} title="Telehealth" />
              </div>

              <h2 className="section-title mt-50">Latest Healthcare Insights</h2>
              <div className="insights-row">
                <div className="insight-card-large">
                  <div className="insight-img-placeholder"></div>
                  <div className="insight-info">
                    <span className="category">Categories - Date</span>
                    <h3>Main access to Your surrounding: Healthcare in Today</h3>
                  </div>
                </div>
              </div>
            </section>

            {/* Right Column: Specialists & Insights list */}
            <aside className="sidebar-section">
              <div className="section-header">
                <h3>Featured Specialists</h3>
                <a href="#">See all</a>
              </div>
              <div className="specialists-list">
                <DoctorCard name="Dr. Alisha Khan" spec="Specialist" rating="5" color="#1e90ff" />
                <DoctorCard name="Dr. Marcus Lee" spec="Specialist" rating="5" color="#00ced1" />
                <DoctorCard name="Dr. Sarah Chen" spec="Specialist" rating="5" color="#ffa500" />
              </div>

              <div className="section-header mt-30">
                <h3>Latest Healthcare Insights</h3>
                <a href="#">See all</a>
              </div>
              <div className="mini-insights">
                <MiniInsight title="How to Create Headlines Healthcare" />
                <MiniInsight title="Images Healthcare in a Smart Life" />
                <MiniInsight title="How to Healthcare Insights - New Smart" />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

// ... Các Component con (ServiceCard, DoctorCard, MiniInsight) giữ nguyên không đổi ...
const ServiceCard = ({ icon, title }) => (
  <div className="service-card">
    <div className="service-icon">{icon}</div>
    <h4>{title}</h4>
    <p>Revolutionize patient care and manage clinical workflow with our advanced SaaS.</p>
    <button className="btn-text">Learn More</button>
  </div>
);

const DoctorCard = ({ name, spec, rating, color }) => (
  <div className="doctor-card">
    <div className="doctor-avatar" style={{ backgroundColor: color }}></div>
    <div className="doctor-info">
      <h4>{name}</h4>
      <p>{spec}</p>
      <div className="rating">
        {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="gold" stroke="none" />)}
        <span>({rating})</span>
      </div>
      <button className="btn-book">Book Now</button>
    </div>
  </div>
);

const MiniInsight = ({ title }) => (
  <div className="mini-insight-card">
    <div className="mini-img"></div>
    <div className="mini-text">
      <h5>{title}</h5>
      <span>Categories - Date</span>
    </div>
  </div>
);

export default Test;