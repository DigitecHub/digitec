"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import 'aos/dist/aos.css';
import AOS from 'aos';
import '../styles/SubscribeSection.css';

const SubscribeSection = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Clear any previous errors
    setError('');
    
    // Simulate form submission
    setIsSubmitted(true);
    
    // Reset form after submission
    setEmail('');
    
    // Reset submission state after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
  };

  return (
    <section className="subscribe-section" id="subscribe">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6" data-aos="fade-right">
            <div className="subscribe-content">
              <span className="section-subtitle">Stay Updated</span>
              <h2 className="section-title">
                Subscribe to Our Newsletter
              </h2>
              <p className="section-description">
                Get the latest updates on our courses, events, and special offers directly to your inbox. 
                Join our community of tech professionals and stay ahead in your career.
              </p>
              
              <div className="subscribe-features">
                <div className="subscribe-feature-item">
                  <div className="feature-icon">
                    <Image 
                      src="/icons/Notification.png" 
                      alt="Course Updates" 
                      width={24} 
                      height={24}
                    />
                  </div>
                  <div className="feature-content">
                    <p>Course Updates & New Certifications</p>
                  </div>
                </div>
                
                <div className="subscribe-feature-item">
                  <div className="feature-icon">
                    <Image 
                      src="/icons/Rank.png" 
                      alt="Tech Insights" 
                      width={24} 
                      height={24}
                    />
                  </div>
                  <div className="feature-content">
                    <p>Industry Insights & Tech Trends</p>
                  </div>
                </div>
                
                <div className="subscribe-feature-item">
                  <div className="feature-icon">
                    <Image 
                      src="/icons/Offline View.png" 
                      alt="Special Offers" 
                      width={24} 
                      height={24}
                    />
                  </div>
                  <div className="feature-content">
                    <p>Special Offers & Exclusive Discounts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-lg-6" data-aos="fade-left">
            <div className="subscribe-form-container">
              <div className="subscribe-form-wrapper">
                <h3>Join Our Newsletter</h3>
                <p>Subscribe to receive updates and stay informed about our latest offerings.</p>
                
                {isSubmitted ? (
                  <div className="subscribe-success">
                    <div className="success-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-check-circle" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                      </svg>
                    </div>
                    <h4>Thank You!</h4>
                    <p>You have successfully subscribed to our newsletter.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="subscribe-form">
                    <div className="form-group">
                      <input 
                        type="email" 
                        className={`form-control ${error ? 'is-invalid' : ''}`}
                        placeholder="Enter your email address" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      {error && <div className="invalid-feedback">{error}</div>}
                    </div>
                    <button type="submit" className="btn btn-primary subscribe-btn">
                      Subscribe Now
                    </button>
                  </form>
                )}
                
                <div className="subscribe-privacy">
                  <p>We respect your privacy. Unsubscribe at any time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscribeSection; 