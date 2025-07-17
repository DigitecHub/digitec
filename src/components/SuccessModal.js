"use client";
import { useEffect } from 'react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import '../styles/SuccessModal.css';

export default function SuccessModal({ isOpen, onClose, title, message }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <FaTimes />
        </button>
        <div className="modal-icon">
          <FaCheckCircle />
        </div>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <button className="modal-confirm-btn" onClick={onClose}>
          Continue Learning
        </button>
      </div>
    </div>
  );
}
