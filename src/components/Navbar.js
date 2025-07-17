"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { FaHome, FaInfoCircle, FaBook, FaEnvelope, FaUser, FaSignOutAlt, FaSignInAlt, FaChartLine, FaGraduationCap, FaBars, FaTimes } from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    console.log('Initializing AOS');
    AOS.init({ duration: 600, once: true });
    AOS.refresh();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        console.log('Fetched user:', user, 'Error:', error);
        setUser(user);

        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          console.log('Profile:', profileData, 'Profile Error:', profileError);
          if (!profileError && profileData) {
            setUserProfile(profileData);
          } else {
            console.warn('No profile data or error:', profileError);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      setUser(session?.user || null);

      if (session?.user) {
        const fetchUserProfile = async () => {
          const { data: profileData, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          console.log('Profile on auth change:', profileData, 'Error:', error);
          if (!error && profileData) {
            setUserProfile(profileData);
          }
        };
        fetchUserProfile();
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const toggleDropdown = () => {
    if (window.innerWidth <= 991) return; // Prevent dropdown on mobile, only allow in desktop
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
    setIsDropdownOpen(false); // Always close profile dropdown when opening mobile menu
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      console.log('Attempting sign out');
      await supabase.auth.signOut();
      setIsDropdownOpen(false);
      router.push('/'); // Redirect to home after sign-out
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    }
  };

  const navLinks = [
    { title: 'Home', path: '/', icon: <FaHome /> },
    { title: 'About', path: '/about', icon: <FaInfoCircle /> },
    { title: 'Courses', path: '/courses', icon: <FaBook /> },
    { title: 'Contact', path: '/contact', icon: <FaEnvelope /> },
  ];

  const closeDropdownOnOutsideClick = (e) => {
    if (isDropdownOpen && !e.target.closest('.user-profile')) {
      console.log('Closing dropdown due to outside click');
      setIsDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', closeDropdownOnOutsideClick);
    return () => {
      document.removeEventListener('click', closeDropdownOnOutsideClick);
    };
  }, [isDropdownOpen]);

  return (
    <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`} data-aos="fade-down">
      <div className="navbar-bg-gradient"></div>
      <div className="container">
        <nav className="navbar-container">
          <Link href="/" className="navbar-logo" data-aos="zoom-in">
            <Image
              src="/favicon.png"
              alt="Digitec Solutions"
              width={50}
              height={50}
              className="logo-image"
              priority
            />
            <span className="logo-text">Digitec</span>
          </Link>

          <button
            className={`navbar-hamburger${isMobileMenuOpen ? ' open' : ''}`}
            aria-label="Open menu"
            onClick={toggleMobileMenu}
          >
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
          </button>

          <div className="navbar-menu">
            <ul className="navbar-nav">
              {navLinks.map((link, index) => (
                <li
                  key={index}
                  className="nav-item"
                  data-aos="fade-down"
                  data-aos-delay={`${index * 100}`}
                >
                  <Link
                    href={link.path}
                    className={`nav-link ${pathname === link.path ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{link.icon}</span>
                    {link.title}
                    <span className="nav-link-highlight"></span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="navbar-auth" data-aos="fade-down" data-aos-delay="400">
              {user ? (
                <div className="user-profile">
                  <button
                    className="profile-button"
                    onClick={toggleDropdown}
                    aria-label="User menu"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url}
                        alt={userProfile?.full_name || user.user_metadata.full_name || 'User'}
                        width={36}
                        height={36}
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {(userProfile?.full_name?.[0] || user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <span className="profile-name">
                      {userProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                    <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}></span>
                  </button>

                  {isDropdownOpen && (
                    <div className="profile-dropdown">
                      <div className="dropdown-header">
                        <div className="dropdown-user-info">
                          {user.user_metadata?.avatar_url ? (
                            <Image
                              src={user.user_metadata.avatar_url}
                              alt={userProfile?.full_name || user.user_metadata.full_name || 'User'}
                              width={50}
                              height={50}
                              className="dropdown-avatar"
                            />
                          ) : (
                            <div className="dropdown-avatar-placeholder">
                              {(userProfile?.full_name?.[0] || user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                            </div>
                          )}
                          <div className="dropdown-user-details">
                            <p className="dropdown-user-name">
                              {userProfile?.full_name || user.user_metadata?.full_name || 'User'}
                            </p>
                            <p className="dropdown-user-email">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      <ul className="dropdown-menu">
                        <li>
                          <Link href="/dashboard" onClick={() => setIsDropdownOpen(false)}>
                            <FaChartLine className="dropdown-icon" />
                            Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link href="/profile" onClick={() => setIsDropdownOpen(false)}>
                            <FaUser className="dropdown-icon" />
                            My Profile
                          </Link>
                        </li>
                        <li>
                          <Link href="/courses" onClick={() => setIsDropdownOpen(false)}>
                            <FaGraduationCap className="dropdown-icon" />
                            My Learning
                          </Link>
                        </li>
                        <li className="dropdown-divider"></li>
                        <li>
                          <button onClick={handleSignOut} className="sign-out-button">
                            <FaSignOutAlt className="dropdown-icon" />
                            Sign Out
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link href="/auth/signin" className="google-signin-btn">
                    <FaSignInAlt className="google-icon" />
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className={`mobile-menu-overlay${isMobileMenuOpen ? ' open' : ''}`} onClick={closeMobileMenu}></div>

          <div className={`mobile-menu${isMobileMenuOpen ? ' open' : ''}`}>
            <ul className="mobile-nav">
              {navLinks.map((link, index) => (
                <li key={index} className="mobile-nav-item">
                  <Link
                    href={link.path}
                    className={`mobile-nav-link${pathname === link.path ? ' active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <span className="nav-icon">{link.icon}</span>
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mobile-auth">
              {user ? (
                <button className="mobile-sign-out" onClick={() => { handleSignOut(); closeMobileMenu(); }}>
                  <FaSignOutAlt className="dropdown-icon" /> Sign Out
                </button>
              ) : (
                <Link href="/auth/signin" className="mobile-sign-in" onClick={closeMobileMenu}>
                  <FaSignInAlt className="dropdown-icon" /> Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>
      </div>

      <div className="navbar-shape shape-1"></div>
      <div className="navbar-shape shape-2"></div>
      <div className="navbar-shape shape-3"></div>
    </header>
  );
};

export default Navbar;