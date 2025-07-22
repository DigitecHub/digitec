"use client";
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import '../styles/HeroSection.css';

const HeroSection = () => {
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateStats();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
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
      const duration = 2500;
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
      <div className="hero-overlay"></div>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6 hero-content-col">
            <div className="hero-content">
              <span className="hero-badge">Transform Your Future</span>
              <h1 className="hero-title">
                Master Your <span className="text-gold">Tech Career</span> with <span className="text-gold">Elite </span>Training
              </h1>
              <p className="hero-description">
                Unlock your potential with cutting-edge IT courses, globally recognized certifications, and hands-on training designed to propel you to the top of the tech industry.
              </p>
              <div className="hero-cta">
                <Link href="/courses" className="btn btn-primary">
                  Discover Courses
                </Link>
                <Link href="/contact" className="btn btn-secondary">
                  Contact Us
                </Link>
              </div>
              <div className="hero-stats" ref={statsRef}>
                <div className="hero-stat">
                  <svg className="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="#D4A017"/>
                    <path d="M12 6l1.42 4.26h4.58l-3.7 2.68 1.42 4.26-3.7-2.68-3.7 2.68 1.42-4.26-3.7-2.68h4.58L12 6z" fill="#D4A017"/>
                  </svg>
                  <span className="hero-stat-number" data-value="8000">0</span>
                  <span className="hero-stat-label">Students Empowered</span>
                </div>
                <div className="hero-stat">
                  <svg className="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" fill="#D4A017"/>
                    <path d="M7 9h10v2H7zM7 13h10v2H7z" fill="#D4A017"/>
                  </svg>
                  <span className="hero-stat-number" data-value="200">0</span>
                  <span className="hero-stat-label">Expert-Led Courses</span>
                </div>
                <div className="hero-stat">
                  <svg className="stat-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-7 7z" fill="#D4A017"/>
                  </svg>
                  <span className="hero-stat-number" data-value="99">0</span>
                  <span className="hero-stat-label">Success Rate</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-6 hero-image-col">
            <div className="hero-image-wrapper">
              <Image
                src="/images/people/young-guy.png"
                alt="Tech Professional Training"
                width={600}
                height={600}
                className="hero-image"
                priority
              />
              <div className="feature-card feature-card-1">
                <svg className="feature-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="#FFFFFF"/>
                  <path d="M12 6l1.42 4.26h4.58l-3.7 2.68 1.42 4.26-3.7-2.68-3.7 2.68 1.42-4.26-3.7-2.68h4.58L12 6z" fill="#FFFFFF"/>
                </svg>
                <div className="feature-content">
                  <h4>Certified Excellence</h4>
                  <p>Globally recognized credentials</p>
                </div>
              </div>
              <div className="feature-card feature-card-2">
                <svg className="feature-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="#FFFFFF"/>
                  <path d="M8 9h8v2H8zm0 4h8v2H8z" fill="#FFFFFF"/>
                </svg>
                <div className="feature-content">
                  <h4>Live Learning</h4>
                  <p>Engaging, real-time sessions</p>
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