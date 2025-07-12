"use client";
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import 'aos/dist/aos.css';
import AOS from 'aos';
import '../styles/AchievementsSection.css';

const AchievementsSection = () => {
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef(null);
  
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const achievements = [
    {
      id: 1,
      icon: "/icons/Registered Students.png",
      count: 1000,
      suffix: "+",
      title: "Students Trained",
      delay: 100
    },
    {
      id: 2,
      icon: "/icons/Helped Students.png",
      count: 50,
      suffix: "+",
      title: "Business Clients",
      delay: 300
    },
    {
      id: 3,
      icon: "/icons/Course Modules.png",
      count: 25,
      suffix: "+",
      title: "Certification Courses",
      delay: 500
    },
    {
      id: 4,
      icon: "/icons/Expert Teacher.png",
      count: 98,
      suffix: "%",
      title: "Client Satisfaction",
      delay: 700
    }
  ];

  const Counter = ({ targetNumber, suffix, duration = 2000, start = 0 }) => {
    const [count, setCount] = useState(start);
    
    useEffect(() => {
      if (!isInView) return;
      
      let startTime;
      const animateCount = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const progressRatio = Math.min(progress / duration, 1);
        
        setCount(Math.floor(progressRatio * (targetNumber - start) + start));
        
        if (progressRatio < 1) {
          requestAnimationFrame(animateCount);
        }
      };
      
      requestAnimationFrame(animateCount);
    }, [isInView, targetNumber, duration, start]);
    
    return <span>{count}{suffix}</span>;
  };

  return (
    <section className="achievements-section" id="achievements" ref={sectionRef}>
      <div className="container">
        <div className="row text-center mb-5">
          <div className="col-lg-8 mx-auto" data-aos="fade-up">
            <span className="section-subtitle">Our Achievements</span>
            <h2 className="section-title">
              Numbers That Speak For Themselves
            </h2>
            <p className="section-description">
              Over the years, we have achieved significant milestones that reflect our commitment to excellence and customer satisfaction.
            </p>
          </div>
        </div>
        
        <div className="row">
          {achievements.map((achievement) => (
            <div 
              className="col-md-6 col-lg-3 mb-4" 
              key={achievement.id} 
              data-aos="fade-up" 
              data-aos-delay={achievement.delay}
            >
              <div className="achievement-card">
                <div className="achievement-icon">
                  <Image 
                    src={achievement.icon} 
                    alt={achievement.title} 
                    width={48} 
                    height={48}
                  />
                </div>
                <div className="achievement-content">
                  <h3 className="achievement-count">
                    {isInView ? (
                      <Counter 
                        targetNumber={achievement.count} 
                        suffix={achievement.suffix} 
                      />
                    ) : (
                      `0${achievement.suffix}`
                    )}
                  </h3>
                  <p className="achievement-title">{achievement.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AchievementsSection; 