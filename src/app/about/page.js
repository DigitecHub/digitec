"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaUsers, FaLaptopCode, FaGraduationCap, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import '../../styles/About.css';

export default function AboutPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact-section');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="about-container">
      <section className="about-hero">
        <div className="hero-content">
          <h1>About Digitec</h1>
          <p>Empowering the next generation of digital creators</p>
          <button className="scroll-down-btn" onClick={scrollToContact}>
            Contact Us <FaChevronDown />
          </button>
        </div>
        <div className="hero-shape shape-1"></div>
        <div className="hero-shape shape-2"></div>
      </section>
      
      <section className="about-mission">
        <div className="mission-content">
          <h2>Our Mission</h2>
          <p>
            At Digitec, our mission is to make quality digital education accessible to everyone. 
            We believe that technology skills are essential in today's world, and we're committed 
            to helping individuals develop these skills through comprehensive, engaging, and 
            practical learning experiences.
          </p>
          <div className="mission-values">
            <div className="value-item">
              <div className="value-icon">
                <FaUsers />
              </div>
              <h3>Community</h3>
              <p>Building a supportive learning community where everyone can grow together</p>
            </div>
            <div className="value-item">
              <div className="value-icon">
                <FaLaptopCode />
              </div>
              <h3>Innovation</h3>
              <p>Embracing new technologies and teaching methods to provide cutting-edge education</p>
            </div>
            <div className="value-item">
              <div className="value-icon">
                <FaGraduationCap />
              </div>
              <h3>Excellence</h3>
              <p>Striving for excellence in everything we do, from course content to student support</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="about-story">
        <div className="story-content">
          <div className="story-text">
            <h2>Our Story</h2>
            <p>
              Digitec was founded in 2020 with a simple goal: to make learning digital skills more 
              accessible, engaging, and effective. What started as a small team of passionate educators 
              and developers has grown into a thriving learning platform serving thousands of students worldwide.
            </p>
            <p>
              We've built our platform based on the belief that learning should be hands-on, relevant, 
              and enjoyable. Our courses are designed to provide practical skills that can be applied 
              immediately, helping our students advance their careers and pursue their passions.
            </p>
            <p>
              Today, we continue to expand our course offerings and improve our learning experience, 
              always guided by feedback from our community and our commitment to educational excellence.
            </p>
          </div>
          <div className="story-image">
            <Image 
              src="/about-image.jpg" 
              alt="Digitec team" 
              width={500} 
              height={350} 
              layout="responsive"
            />
          </div>
        </div>
      </section>
      
      <section className="about-team">
        <h2>Meet Our Team</h2>
        <p className="team-intro">
          Our team consists of passionate educators, experienced developers, and dedicated support staff, 
          all working together to provide you with the best learning experience possible.
        </p>
        <div className="team-grid">
          <div className="team-member">
            <div className="member-avatar">IJ</div>
            <h3>Igho Jereton</h3>
            <p className="member-role">Founder & CEO</p>
          </div>
          <div className="team-member">
            <div className="member-avatar">RA</div>
            <h3>Racheal Anga</h3>
            <p className="member-role">Adminstrating Director</p>
          </div>
          <div className="team-member">
            <div className="member-avatar">PM</div>
            <h3>Paul Madu</h3>
            <p className="member-role">Lead Developer</p>
          </div>
            <div className="team-member">
              <div className="member-avatar">CO</div>
              <h3> Christopher Oluwadara</h3>
              <p className="member-role">Lead Facilitator</p>
            </div>
        </div>
        
      </section>
      
      <section id="contact-section" className="about-contact">
        <h2>Get In Touch</h2>
        <p>
          Have questions about our courses or want to learn more about Digitec? 
          We'd love to hear from you!
        </p>
        <div className="contact-methods">
          <div className="contact-method">
            <h3>Email Us</h3>
            <p>ighojereton@digitecng.com</p>
            <a href="mailto:ighojereton@digitecng.com" className="contact-btn">Send Email</a>
          </div>
          <div className="contact-method">
            <h3>Call Us</h3>
            <p>+234 812 164 1111 </p>
            <a href="tel:+2348121641111" className="contact-btn">Call Now</a>
          </div>
          <div className="contact-method">
            <h3>Visit Us</h3>
            <p>160 Mbiama-Yenagoa Road, Yenagoa 569101, Bayelsa, Nigeria</p>
            <a href="https://maps.app.goo.gl/q8wV1tUddgzPqtsV8" target="_blank" rel="noopener noreferrer" className="contact-btn">Get Directions</a>
          </div>
        </div>
        
        <div className="map-container">
          <div className="map-overlay">
            <h3>Our Location</h3>
            <p>Visit us at our training center</p>
            <a 
              href="https://maps.app.goo.gl/q8wV1tUddgzPqtsV8" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="map-btn"
            >
              Open in Google Maps
            </a>
          </div>
                      <div className="map-frame">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d995.8408569509811!2d6.288607269596566!3d4.930801899999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x106a05b04f030823%3A0x9981bfbf063fbd4e!2sDIGITEC%20HUB%20%2F%20DIGITAL%20GADGETS%20%26%20IT%20SOLUTIONS!5e0!3m2!1sen!2sus!4v1716586299932!5m2!1sen!2sus" 
                width="100%" 
                height="450" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Digitec Location"
              ></iframe>
          </div>
        </div>
      </section>
      
      {showScrollTop && (
        <button 
          className="scroll-to-top" 
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <FaChevronUp />
        </button>
      )}
    </div>
  );
} 