"use client";
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSave } from 'react-icons/fa';
import '../../styles/Profile.css';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    bio: '',
    phone: '',
    location: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchUserAndProfile() {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          // Redirect to sign in if not authenticated
          router.push('/auth/signin?redirect=/profile');
          return;
        }
        
        setUser(user);
        
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        
        if (profileData) {
          setProfile({
            full_name: profileData.full_name || '',
            email: profileData.email || user.email || '',
            bio: profileData.bio || '',
            phone: profileData.phone || '',
            location: profileData.location || ''
          });
        } else {
          // Set email from user if profile doesn't exist
          setProfile(prev => ({
            ...prev,
            email: user.email || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserAndProfile();
  }, [router, supabase]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          email: profile.email,
          bio: profile.bio,
          phone: profile.phone,
          location: profile.location,
          updated_at: new Date().toISOString()
        });
        
      if (updateError) throw updateError;
      
      setSuccess(true);
      
      // Update user metadata if name has changed
      if (profile.full_name !== user.user_metadata?.full_name) {
        await supabase.auth.updateUser({
          data: { full_name: profile.full_name }
        });
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <Link href="/dashboard" className="back-link">
          <FaArrowLeft /> Back to Dashboard
        </Link>
        <h1>Your Profile</h1>
        <p>Manage your personal information</p>
      </div>
      
      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              {profile.full_name ? profile.full_name[0].toUpperCase() : (profile.email ? profile.email[0].toUpperCase() : 'U')}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="profile-form">
            {error && (
              <div className="profile-alert error">
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="profile-alert success">
                <p>Profile updated successfully!</p>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="full_name">
                <FaUser className="input-icon" />
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={profile.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="form-control"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">
                <FaEnvelope className="input-icon" />
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="form-control"
                disabled
              />
              <small>Email cannot be changed</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="bio">About Me</label>
              <textarea
                id="bio"
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                className="form-control"
                rows="4"
              ></textarea>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">
                  <FaPhone className="input-icon" />
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="location">
                  <FaMapMarkerAlt className="input-icon" />
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  placeholder="Enter your location"
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="save-button"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="spinner-small"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 