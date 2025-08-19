import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Users, UserPlus, Trash2, Shield, User } from 'lucide-react';
import './UserManagement.css';

const UserManagement = ({ onRegisterClick }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess(`User "${username}" deleted successfully`);
          fetchUsers(); // Refresh the list
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div className="header-info">
          <h1>
            <Users className="header-icon" />
            User Management
          </h1>
          <p>Manage system users and their access permissions</p>
        </div>
        <button className="add-user-btn" onClick={onRegisterClick}>
          <UserPlus className="btn-icon" />
          Add New User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="users-grid">
        {users.map((user) => (
          <div key={user.id} className={`user-card ${user.isActive ? 'active' : 'inactive'}`}>
            <div className="user-card-header">
              <div className="user-avatar">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="user-info">
                <h3>{user.firstName} {user.lastName}</h3>
                <p className="username">@{user.username}</p>
                <div className="user-badges">
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? (
                      <><Shield size={12} /> Admin</>
                    ) : (
                      <><User size={12} /> User</>
                    )}
                  </span>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="user-details">
              <div className="detail-group">
                <label>Email</label>
                <span>{user.email}</span>
              </div>
              
              <div className="detail-group">
                <label>Badge</label>
                <span>{user.badgeNumber || 'Not assigned'}</span>
              </div>

              <div className="detail-group">
                <label>Department</label>
                <span>{user.department || 'Not specified'}</span>
              </div>

              <div className="detail-group">
                <label>Position</label>
                <span>{user.position || 'Not specified'}</span>
              </div>

              <div className="detail-group">
                <label>Phone</label>
                <span>{user.phone || 'Not provided'}</span>
              </div>

              <div className="detail-group">
                <label>Created</label>
                <span>{formatDate(user.createdAt)}</span>
              </div>

              <div className="detail-group">
                <label>Last Login</label>
                <span>{user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</span>
              </div>
            </div>

            {user.id !== currentUser.id && (
              <div className="user-actions">
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteUser(user.id, user.username)}
                  title="Delete User"
                >
                  <Trash2 size={16} />
                  Delete User
                </button>
              </div>
            )}

            {user.id === currentUser.id && (
              <div className="current-user-badge">
                Current User
              </div>
            )}
          </div>
        ))}
      </div>

      {users.length === 0 && !loading && (
        <div className="empty-state">
          <Users size={64} />
          <h3>No Users Found</h3>
          <p>No users have been registered in the system yet.</p>
          <button className="add-user-btn" onClick={onRegisterClick}>
            <UserPlus className="btn-icon" />
            Add First User
          </button>
        </div>
      )}

      <div className="user-stats">
        <div className="stat-card">
          <h4>Total Users</h4>
          <span>{users.length}</span>
        </div>
        <div className="stat-card">
          <h4>Active Users</h4>
          <span>{users.filter(u => u.isActive).length}</span>
        </div>
        <div className="stat-card">
          <h4>Administrators</h4>
          <span>{users.filter(u => u.role === 'admin').length}</span>
        </div>
        <div className="stat-card">
          <h4>Officers</h4>
          <span>{users.filter(u => u.role === 'user').length}</span>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;