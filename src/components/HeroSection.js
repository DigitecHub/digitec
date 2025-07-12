"use client";
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import '../styles/HeroSection.css';

const HeroSection = () => {
  const statsRef = useRef(null);
  
  useEffect(() => {
    // Animation for stats when in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateStats();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, []);

  const animateStats = () => {
    const statNumbers = document.querySelectorAll('.hero-stat-number');
    statNumbers.forEach((statNumber) => {
      const targetValue = parseInt(statNumber.getAttribute('data-value'), 10);
      let currentValue = 0;
      const duration = 2000; // 2 seconds
      const increment = targetValue / (duration / 16);
      
      const updateCounter = () => {
        currentValue += increment;
        if (currentValue < targetValue) {
          statNumber.textContent = Math.ceil(currentValue);
          requestAnimationFrame(updateCounter);
        } else {
          statNumber.textContent = targetValue.toString();
        }
      };
      
      requestAnimationFrame(updateCounter);
    });
  };

  return (
    <section className="hero-section">
      <div className="hero-background-image"></div>
      <div className="hero-shape-left"></div>
      <div className="hero-shape-right"></div>
      
      <div className="container">
        <div className="row align-items-center min-vh-80">
          <div className="col-lg-6">
            <div className="hero-content">
              <span className="hero-subtitle">Digital Excellence</span>
              <h1 className="hero-title">
                Empowering Your <span className="text-highlight">Digital Journey</span> With Expert Training
              </h1>
              <p className="hero-text">
                Transform your career with industry-leading IT courses, professional certifications, and expert-led training programs designed to elevate your skills and unlock new opportunities.
              </p>
              
              <div className="hero-buttons">
                <Link href="/courses" className="hero-btn-primary">
                  Explore Courses
                </Link>
                <Link href="/contact" className="hero-btn-secondary">
                  Get in Touch
                </Link>
              </div>
              
              <div className="hero-stats" ref={statsRef}>
                <div className="hero-stat-item">
                  <span className="hero-stat-number" data-value="7500">0</span>
                  <span className="hero-stat-text">Students Trained</span>
                </div>
                <div className="hero-stat-item">
                  <span className="hero-stat-number" data-value="150">0</span>
                  <span className="hero-stat-text">Expert Courses</span>
                </div>
                <div className="hero-stat-item">
                  <span className="hero-stat-number" data-value="98">0</span>
                  <span className="hero-stat-text">Success Rate</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-lg-6">
            <div className="hero-image-container">
              <div className="hero-image">
                <Image 
                  src="/favicon.png" 
                  alt="Digitec Training" 
                  width={600} 
                  height={500}
                  className="hero-main-image"
                  priority
                />
                
                <div className="floating-card floating-card-1">
                  <div className="floating-card-icon">
                    <Image 
                      src="/globe.svg" 
                      alt="Global Certifications" 
                      width={24} 
                      height={24}
                    />
                  </div>
                  <div className="floating-card-content">
                    <h4>Global Certifications</h4>
                    <p>Internationally recognized</p>
                  </div>
                </div>
                
                <div className="floating-card floating-card-2">
                  <div className="floating-card-icon">
                    <Image 
                      src="/window.svg" 
                      alt="Live Training" 
                      width={24} 
                      height={24}
                    />
                  </div>
                  <div className="floating-card-content">
                    <h4>Live Training</h4>
                    <p>Interactive sessions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 