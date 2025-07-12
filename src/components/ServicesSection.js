"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import 'aos/dist/aos.css';
import AOS from 'aos';
import '../styles/ServicesSection.css';

const ServicesSection = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const services = [
    {
      id: 1,
      icon: "/icons/certificate.svg",
      title: "Professional Training",
      description: "Industry-recognized certification courses including PMP, ITIL, Agile, and more to advance your career.",
      link: "/training"
    },
    {
      id: 2,
      icon: "/icons/learning.svg",
      title: "IT Consulting",
      description: "Strategic technology planning, implementation and support services tailored to your business needs.",
      link: "/consulting"
    },
    {
      id: 3,
      icon: "/icons/Course Modules.png",
      title: "Cloud Solutions",
      description: "Secure and scalable cloud infrastructure setup, migration, and management for modern businesses.",
      link: "/cloud"
    },
    {
      id: 4,
      icon: "/icons/Expert Teacher.png",
      title: "Software Development",
      description: "Custom software solutions designed to streamline operations and enhance business efficiency.",
      link: "/development"
    },
    {
      id: 5,
      icon: "/icons/Learn Anywhere.png",
      title: "Online Learning",
      description: "Flexible e-learning platforms with comprehensive course materials and expert instructor support.",
      link: "/online-learning"
    },
    {
      id: 6,
      icon: "/icons/Unlimited Access.png",
      title: "Cybersecurity Services",
      description: "Comprehensive security assessments, implementation, and training to protect your digital assets.",
      link: "/security"
    }
  ];

  return (
    <section className="services-section" id="services">
      <div className="container">
        <div className="row text-center mb-5">
          <div className="col-lg-8 mx-auto" data-aos="fade-up">
            <span className="section-subtitle">Our Services</span>
            <h2 className="section-title">
              Comprehensive IT Solutions for Your Business
            </h2>
            <p className="section-description">
              We offer a wide range of IT services to help businesses and individuals thrive in the digital era.
              From professional training to custom technology solutions, we've got you covered.
            </p>
          </div>
        </div>
        
        <div className="row">
          {services.map((service) => (
            <div className="col-md-6 col-lg-4 mb-4" key={service.id} data-aos="fade-up" data-aos-delay={service.id * 100}>
              <div className="service-card">
                <div className="service-icon">
                  <Image 
                    src={service.icon} 
                    alt={service.title} 
                    width={40} 
                    height={40}
                  />
                </div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <Link href={service.link} className="service-link">
                  Learn More
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-right" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection; 