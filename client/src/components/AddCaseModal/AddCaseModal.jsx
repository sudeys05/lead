import React, { useState } from 'react';
import { X, Save, AlertCircle, Minimize2, Maximize2, Square } from 'lucide-react';
import './AddCaseModal.css';

const AddCaseModal = ({ isOpen, onClose, onAddCase }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    officer: '',
    priority: 'Medium',
    status: 'Open',
    description: '',
    location: '',
    reportedBy: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Case title is required';
    }
    
    if (!formData.officer.trim()) {
      newErrors.officer = 'Officer name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      setErrors({});
      
      try {
        const response = await fetch('/api/cases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            priority: formData.priority.toLowerCase(),
            status: formData.status.toLowerCase()
          })
        });

        if (response.ok) {
          const result = await response.json();
          onAddCase(result.case);
          setFormData({
            title: '',
            officer: '',
            priority: 'Medium',
            status: 'Open',
            description: '',
            location: '',
            reportedBy: ''
          });
          onClose();
        } else {
          const errorData = await response.json();
          setErrors({ submit: errorData.message || 'Failed to create case' });
        }
      } catch (error) {
        console.error('Error creating case:', error);
        setErrors({ submit: 'Failed to create case. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      officer: '',
      priority: 'Medium',
      status: 'Open',
      description: '',
      location: '',
      reportedBy: ''
    });
    setErrors({});
    onClose();
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    setIsMaximized(false);
  };

  if (!isOpen) return null;

  const modalClass = `modal-content ${isMaximized ? 'maximized' : ''} ${isMinimized ? 'minimized' : ''}`;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Case</h2>
          <div className="modal-controls">
            <button className="minimize-btn" onClick={handleMinimize}>
              <Minimize2 size={16} />
            </button>
            <button className="maximize-btn" onClick={handleMaximize}>
              {isMaximized ? <Square size={16} /> : <Maximize2 size={16} />}
            </button>
            <button className="close-btn" onClick={handleClose}>
              <X size={20} />
            </button>
          </div>
        </div>
        
        {!isMinimized && (
          <form onSubmit={handleSubmit} className="case-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Case Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter case title"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && (
                <span className="error-message">
                  <AlertCircle size={14} />
                  {errors.title}
                </span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="officer">Assigned Officer *</label>
              <input
                type="text"
                id="officer"
                name="officer"
                value={formData.officer}
                onChange={handleInputChange}
                placeholder="Enter officer name"
                className={errors.officer ? 'error' : ''}
              />
              {errors.officer && (
                <span className="error-message">
                  <AlertCircle size={14} />
                  {errors.officer}
                </span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter incident location"
              className={errors.location ? 'error' : ''}
            />
            {errors.location && (
              <span className="error-message">
                <AlertCircle size={14} />
                {errors.location}
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="reportedBy">Reported By</label>
            <input
              type="text"
              id="reportedBy"
              name="reportedBy"
              value={formData.reportedBy}
              onChange={handleInputChange}
              placeholder="Enter reporter name (optional)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter case description"
              rows="4"
              className={errors.description ? 'error' : ''}
            />
            {errors.description && (
              <span className="error-message">
                <AlertCircle size={14} />
                {errors.description}
              </span>
            )}
          </div>

          {errors.submit && (
            <div className="submit-error">
              <AlertCircle size={16} />
              {errors.submit}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting} data-testid="button-submit">
              <Save size={16} />
              {isSubmitting ? 'Creating Case...' : 'Add Case'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default AddCaseModal;