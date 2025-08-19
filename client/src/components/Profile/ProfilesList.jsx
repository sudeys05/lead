
import React, { useState, useEffect } from 'react';
import './ProfilesList.css';
import AddProfileModal from './AddProfileModal';

const ProfilesList = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching all profiles...');
      
      const response = await fetch('/api/profiles');
      const data = await response.json();
      
      if (response.ok) {
        console.log('📊 Received profiles from API:', data);
        setProfiles(data.profiles || []);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch profiles');
      }
    } catch (error) {
      console.error('❌ Error fetching profiles:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileAdded = (newProfile) => {
    setProfiles(prev => [newProfile, ...prev]);
    console.log('✅ Profile added to list:', newProfile);
  };

  if (loading) {
    return <div className="profiles-loading">Loading profiles...</div>;
  }

  if (error) {
    return <div className="profiles-error">Error: {error}</div>;
  }

  return (
    <div className="profiles-list-container">
      <div className="profiles-header">
        <div className="header-content">
          <div className="header-info">
            <h2>User Profiles</h2>
            <p>Showing {profiles.length} profile{profiles.length !== 1 ? 's' : ''}</p>
          </div>
          <button 
            className="add-profile-btn"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add Profile
          </button>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="no-profiles">
          <p>No profiles found in the database.</p>
        </div>
      ) : (
        <div className="profiles-grid">
          {profiles.map((profile) => (
            <div key={profile.id} className="profile-card">
              <div className="profile-card-header">
                <div className="profile-avatar">
                  <span className="avatar-initials">
                    {profile.firstName?.[0] || ''}{profile.lastName?.[0] || ''}
                  </span>
                </div>
                <div className="profile-basic-info">
                  <h3 className="profile-name">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <p className="profile-username">@{profile.username}</p>
                  <span className={`role-badge ${profile.role}`}>
                    {profile.role === 'admin' ? 'Administrator' : 'Officer'}
                  </span>
                </div>
              </div>

              <div className="profile-card-body">
                <div className="profile-detail">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{profile.email || 'Not provided'}</span>
                </div>
                
                <div className="profile-detail">
                  <span className="detail-label">Badge Number:</span>
                  <span className="detail-value">{profile.badgeNumber || 'Not assigned'}</span>
                </div>
                
                <div className="profile-detail">
                  <span className="detail-label">Department:</span>
                  <span className="detail-value">{profile.department || 'Not specified'}</span>
                </div>
                
                <div className="profile-detail">
                  <span className="detail-label">Position:</span>
                  <span className="detail-value">{profile.position || 'Not specified'}</span>
                </div>
                
                <div className="profile-detail">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{profile.phone || 'Not provided'}</span>
                </div>
                
                <div className="profile-detail">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${profile.isActive ? 'active' : 'inactive'}`}>
                    {profile.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="profile-card-footer">
                <div className="profile-timestamps">
                  <small>
                    Created: {new Date(profile.createdAt).toLocaleDateString()}
                  </small>
                  <small>
                    Updated: {new Date(profile.updatedAt).toLocaleDateString()}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddProfileModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProfileAdded={handleProfileAdded}
      />
    </div>
  );
};

export default ProfilesList;
