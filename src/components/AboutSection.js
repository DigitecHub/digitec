"use client";
import React, { useEffect } from 'react';
import Image from 'next/image';
import 'aos/dist/aos.css';
import AOS from 'aos';
import '../styles/AboutSection.css';

const AboutSection = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <section className="about-section" id="about">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6 mb-5 mb-lg-0" data-aos="fade-right">
            <div className="about-image-area">
              <div className="about-image">
                <Image 
                  src="/images/digitec.png" 
                  alt="Digitec" 
                  width={500} 
                  height={500} 
                  className="img-fluid main-image"
                />
              </div>
              <div className="experience-badge" data-aos="fade-up" data-aos-delay="300">
                <Image 
                  src="/icons/7yrs.png" 
                  alt="7+ Years Experience" 
                  width={120} 
                  height={120}
                />
              </div>
            </div>
          </div>
          <div className="col-lg-6" data-aos="fade-left">
            <div className="about-content">
              <span className="section-subtitle">About Digitec</span>
              <h2 className="section-title">
                Leading IT Training & Consulting Company in Nigeria
              </h2>
              <p className="section-description">
                Digitec is a premier IT training and consulting firm dedicated to empowering 
                individuals and organizations with cutting-edge technology skills and solutions. 
                With over 7 years of experience, we've helped thousands of students and 
                businesses achieve their digital transformation goals.
              </p>
              
              <div className="about-features">
                <div className="about-feature-item" data-aos="fade-up" data-aos-delay="100">
                  <div className="feature-icon">
                    <Image 
                      src="/icons/certificate.svg" 
                      alt="Certified Training" 
                      width={32} 
                      height={32}
                    />
                  </div>
                  <div className="feature-content">
                    <h4>Certified Training</h4>
                    <p>Internationally recognized certifications to boost your career prospects.</p>
                  </div>
                </div>
                
                <div className="about-feature-item" data-aos="fade-up" data-aos-delay="200">
                  <div className="feature-icon">
                    <Image 
                      src="/icons/Expert Teacher.png" 
                      alt="Expert Instructors" 
                      width={32} 
                      height={32}
                    />
                  </div>
                  <div className="feature-content">
                    <h4>Expert Instructors</h4>
                    <p>Learn from industry professionals with years of practical experience.</p>
                  </div>
                </div>
                
                <div className="about-feature-item" data-aos="fade-up" data-aos-delay="300">
                  <div className="feature-icon">
                    <Image 
                      src="/icons/learning.svg" 
                      alt="Practical Learning" 
                      width={32} 
                      height={32}
                    />
                  </div>
                  <div className="feature-content">
                    <h4>Practical Learning</h4>
                    <p>Hands-on projects and real-world applications for effective skill building.</p>
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

export default AboutSection; 