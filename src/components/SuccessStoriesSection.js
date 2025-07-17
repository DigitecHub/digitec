"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import 'aos/dist/aos.css';
import AOS from 'aos';
import '../styles/SuccessStoriesSection.css';

const SuccessStoriesSection = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      position: "Project Manager",
      company: "Tech Solutions Ltd",
      image: "/images/people/person-1.jpg",
      content: "The PMP certification training I received from Digitec was exceptional. The instructors were knowledgeable and provided practical insights that helped me pass the exam on my first attempt. I've since been promoted to Senior Project Manager!"
    },
    {
      id: 2,
      name: "Michael Okonkwo",
      position: "IT Director",
      company: "Global Finance Nigeria",
      image: "/images/people/person-2.jpg",
      content: "Digitec's cloud migration services transformed our IT infrastructure. Their team provided expert guidance throughout the entire process, resulting in improved efficiency and significant cost savings for our organization."
    },
    {
      id: 3,
      name: "Amina Bello",
      position: "Software Developer",
      company: "InnovateNG",
      image: "/images/people/person-3.jpg",
      content: "The software development bootcamp at Digitec gave me the skills and confidence to transition into tech. Within three months of completing the program, I secured a position as a junior developer. Their hands-on approach to learning makes all the difference."
    }
  ];

  const clients = [
    { id: 1, logo: "/images/client-1.svg", name: "Tech Solutions Ltd" },
    { id: 2, logo: "/images/client-2.svg", name: "Global Finance Nigeria" },
    { id: 3, logo: "/images/client-3.svg", name: "InnovateNG" },
    { id: 4, logo: "/images/client-4.svg", name: "MediHealth" },
    { id: 5, logo: "/images/client-5.svg", name: "ConstructPro" }
  ];

  const handleNext = () => {
    setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  return (
    <section className="success-stories-section" id="success-stories">
      <div className="container">
        <div className="row text-center mb-5">
          <div className="col-lg-8 mx-auto" data-aos="fade-up">
            <span className="section-subtitle">Success Stories</span>
            <h2 className="section-title">
              What Our Clients Say About Us
            </h2>
            <p className="section-description">
              Hear from our clients and students about their experiences working with Digitec. 
              Their success stories inspire us to continue delivering excellence.
            </p>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-10 mx-auto">
            <div className="testimonials-slider" data-aos="fade-up">
              <div className="testimonial-container">
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={testimonial.id} 
                    className={`testimonial-item ${index === activeTestimonial ? 'active' : ''}`}
                  >
                    <div className="testimonial-content">
                      <div className="testimonial-quote">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#FFD600" className="bi bi-quote" viewBox="0 0 16 16">
                          <path d="M12 12a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1h-1.388c0-.351.021-.703.062-1.054.062-.372.166-.703.31-.992.145-.29.331-.517.559-.683.227-.186.516-.279.868-.279V3c-.579 0-1.085.124-1.52.372a3.322 3.322 0 0 0-1.085.992 4.92 4.92 0 0 0-.62 1.458A7.712 7.712 0 0 0 9 7.558V11a1 1 0 0 0 1 1h2Zm-6 0a1 1 0 0 0 1-1V8.558a1 1 0 0 0-1-1H4.612c0-.351.021-.703.062-1.054.062-.372.166-.703.31-.992.145-.29.331-.517.559-.683.227-.186.516-.279.868-.279V3c-.579 0-1.085.124-1.52.372a3.322 3.322 0 0 0-1.085.992 4.92 4.92 0 0 0-.62 1.458A7.712 7.712 0 0 0 3 7.558V11a1 1 0 0 0 1 1h2Z"/>
                        </svg>
                      </div>
                      <p className="testimonial-text">{testimonial.content}</p>
                      <div className="testimonial-author">
                        <div className="author-image">
                          <Image 
                            src={testimonial.image} 
                            alt={testimonial.name} 
                            width={60} 
                            height={60}
                            className="rounded-circle"
                          />
                        </div>
                        <div className="author-info">
                          <h4>{testimonial.name}</h4>
                          <p>{testimonial.position}, {testimonial.company}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="testimonial-controls">
                <button className="testimonial-control prev" onClick={handlePrev}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-arrow-left" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                  </svg>
                </button>
                <div className="testimonial-indicators">
                  {testimonials.map((_, index) => (
                    <button 
                      key={index} 
                      className={`testimonial-indicator ${index === activeTestimonial ? 'active' : ''}`}
                      onClick={() => setActiveTestimonial(index)}
                    ></button>
                  ))}
                </div>
                <button className="testimonial-control next" onClick={handleNext}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-arrow-right" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="row mt-5">
          <div className="col-12" data-aos="fade-up">
          <section className="trusted-section" aria-label="Trusted by Leading Organisations">
            <div className="trusted-inner">
              <h3 className="trusted-title">
                <span className="trusted-icon" aria-hidden="true">★</span>
                Trusted by Leading Organisations
                <span className="trusted-icon" aria-hidden="true">★</span>
              </h3>
              <p className="trusted-subtitle">We’re proud to be the choice of industry leaders and innovators.</p>
              <div className="trusted-logos-grid">
                {clients.map((client) => (
                  <div key={client.id} className="trusted-logo-card" data-aos="zoom-in">
                    <Image
                      src={client.logo}
                      alt={client.name}
                      width={120}
                      height={60}
                      className="trusted-logo-img"
                    />
                    <p className="trusted-logo-name">{client.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStoriesSection; 