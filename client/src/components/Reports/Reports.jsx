import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  Plus, 
  Search, 
  Edit2, 
  Eye, 
  RotateCcw,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import './Reports.css';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [cases, setCases] = useState([]);
  const [obEntries, setObEntries] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'detail', 'edit'
  const [selectedReport, setSelectedReport] = useState(null);

  const reportTypes = ['Warranty', 'Incident', 'Evidence', 'Case Summary', 'Investigation', 'Other'];
  const reportStatuses = ['Pending', 'Approved', 'Completed', 'Rejected'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  useEffect(() => {
    fetchReports();
    fetchRelatedData();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reports');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setError('');
      } else {
        setError('Failed to fetch reports');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    try {
      const [casesRes, obRes, evidenceRes] = await Promise.all([
        fetch('/api/cases'),
        fetch('/api/ob-entries'),
        fetch('/api/evidence')
      ]);
      
      const [casesData, obData, evidenceData] = await Promise.all([
        casesRes.ok ? casesRes.json() : { cases: [] },
        obRes.ok ? obRes.json() : { obEntries: [] },
        evidenceRes.ok ? evidenceRes.json() : { evidence: [] }
      ]);

      setCases(casesData.cases || []);
      setObEntries(obData.obEntries || []);
      setEvidence(evidenceData.evidence || []);
    } catch (error) {
      console.error('Error fetching related data:', error);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchRelatedData();
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reportNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !typeFilter || report.type === typeFilter;
    const matchesStatus = !statusFilter || report.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const navigateToView = (view, report = null) => {
    setCurrentView(view);
    setSelectedReport(report);
  };

  const goBack = () => {
    if (currentView === 'detail') {
      setCurrentView('list');
    } else if (currentView === 'edit') {
      setCurrentView('detail');
    } else {
      setCurrentView('list');
    }
    if (currentView === 'create') {
      setSelectedReport(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Clock size={16} className="status-pending" />;
      case 'approved': return <CheckCircle size={16} className="status-approved" />;
      case 'completed': return <CheckCircle size={16} className="status-completed" />;
      case 'rejected': return <XCircle size={16} className="status-rejected" />;
      default: return <Clock size={16} />;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return <AlertCircle size={16} className="priority-urgent" />;
      case 'high': return <AlertCircle size={16} className="priority-high" />;
      case 'medium': return <AlertCircle size={16} className="priority-medium" />;
      case 'low': return <AlertCircle size={16} className="priority-low" />;
      default: return <AlertCircle size={16} />;
    }
  };

  const ReportsList = () => (
    <div className="reports-list">
      <div className="reports-header">
        <div className="header-content">
          <FileCheck className="header-icon" />
          <div>
            <h1>Generate Reports</h1>
            <p>Create and manage warranty and investigation reports</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="refresh-btn" 
            onClick={fetchReports}
            disabled={isLoading}
            title="Refresh reports list"
          >
            <RotateCcw size={18} className={isLoading ? 'spinning' : ''} />
            Refresh
          </button>
          <button className="add-report-btn" onClick={() => navigateToView('create')}>
            <Plus size={18} />
            New Report
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-controls">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {reportTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {reportStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="reports-grid">
        {isLoading ? (
          <div className="loading-state">Loading reports...</div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state">
            <FileCheck size={48} />
            <h3>No reports found</h3>
            <p>Create a new report or adjust your search filters</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="report-card" onClick={() => navigateToView('detail', report)}>
              <div className="report-header">
                <div className="report-info">
                  <h3>{report.reportNumber}</h3>
                  <p className="report-title">{report.title}</p>
                </div>
                <div className="report-type">
                  <FileText size={16} />
                  <span>{report.type}</span>
                </div>
              </div>
              <div className="report-body">
                <div className="status-priority-row">
                  <div className="status-info">
                    {getStatusIcon(report.status)}
                    <span className="status-text">{report.status}</span>
                  </div>
                  <div className="priority-info">
                    {getPriorityIcon(report.priority)}
                    <span className="priority-text">{report.priority}</span>
                  </div>
                </div>
                <div className="report-details">
                  <p className="content-preview">{report.content?.substring(0, 100)}...</p>
                  <p className="created-date">
                    <Calendar size={14} />
                    Created: {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const CreateReportForm = () => {
    const [formData, setFormData] = useState({
      type: 'Warranty',
      title: '',
      content: '',
      status: 'Pending',
      priority: 'Medium',
      caseId: '',
      obId: '',
      evidenceId: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    };

    const validateForm = () => {
      const newErrors = {};
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.content.trim()) newErrors.content = 'Content is required';
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      setIsSubmitting(true);
      try {
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          await fetchReports();
          goBack();
        } else {
          const errorData = await response.json();
          setErrors({ submit: errorData.message || 'Failed to create report' });
        }
      } catch (error) {
        setErrors({ submit: 'Network error. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="report-form-container">
        <div className="form-header">
          <button className="back-btn" onClick={goBack}>
            <FileCheck size={20} />
            Back to Reports
          </button>
          <h1>Create New Report</h1>
        </div>

        <form onSubmit={handleSubmit} className="report-creation-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="type">Report Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                {reportTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority *</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                {priorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                {reportStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="caseId">Linked Case (Optional)</label>
              <select
                id="caseId"
                name="caseId"
                value={formData.caseId}
                onChange={handleInputChange}
              >
                <option value="">Select a case...</option>
                {cases.map(caseItem => (
                  <option key={caseItem.id} value={caseItem.id}>
                    {caseItem.caseNumber} - {caseItem.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="obId">Linked OB Entry (Optional)</label>
              <select
                id="obId"
                name="obId"
                value={formData.obId}
                onChange={handleInputChange}
              >
                <option value="">Select an OB entry...</option>
                {obEntries.map(ob => (
                  <option key={ob.id} value={ob.id}>
                    {ob.obNumber} - {ob.type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="evidenceId">Linked Evidence (Optional)</label>
              <select
                id="evidenceId"
                name="evidenceId"
                value={formData.evidenceId}
                onChange={handleInputChange}
              >
                <option value="">Select evidence...</option>
                {evidence.map(evidenceItem => (
                  <option key={evidenceItem.id} value={evidenceItem.id}>
                    {evidenceItem.evidenceNumber} - {evidenceItem.type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="title">Report Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter report title"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group full-width">
            <label htmlFor="content">Report Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Enter detailed report content..."
              rows="10"
              className={errors.content ? 'error' : ''}
            />
            {errors.content && <span className="error-text">{errors.content}</span>}
          </div>

          {formData.type === 'Warranty' && (
            <div className="warranty-notice">
              <Shield size={20} />
              <div>
                <h4>Warranty Report Notice</h4>
                <p>This report will be submitted for warranty review. Please ensure all information is accurate and complete.</p>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="submit-error">
              {errors.submit}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={goBack}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Report'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const ReportDetail = () => {
    const linkedCase = cases.find(c => c.id === selectedReport?.caseId);
    const linkedOB = obEntries.find(ob => ob.id === selectedReport?.obId);
    const linkedEvidence = evidence.find(e => e.id === selectedReport?.evidenceId);

    return (
      <div className="report-detail">
        <div className="detail-header">
          <button className="back-btn" onClick={goBack}>
            <FileCheck size={20} />
            Back to Reports
          </button>
          <div className="detail-actions">
            <button onClick={() => window.print()}>
              <FileText size={16} />
              Print Report
            </button>
            <button onClick={() => navigateToView('edit', selectedReport)}>
              <Edit2 size={16} />
              Edit Report
            </button>
          </div>
        </div>
        
        <div className="report-info-panel">
          <div className="panel-header">
            <div className="report-display">
              <FileCheck size={32} />
              <h1>{selectedReport?.reportNumber}</h1>
              <div className="status-priority-badges">
                <div className="status-badge">
                  {getStatusIcon(selectedReport?.status)}
                  {selectedReport?.status}
                </div>
                <div className="priority-badge">
                  {getPriorityIcon(selectedReport?.priority)}
                  {selectedReport?.priority}
                </div>
              </div>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-section">
              <h3>Report Information</h3>
              <div className="info-grid">
                <div><strong>Report Number:</strong> {selectedReport?.reportNumber}</div>
                <div><strong>Type:</strong> {selectedReport?.type}</div>
                <div><strong>Status:</strong> {selectedReport?.status}</div>
                <div><strong>Priority:</strong> {selectedReport?.priority}</div>
                <div><strong>Created:</strong> {new Date(selectedReport?.createdAt).toLocaleString()}</div>
                <div><strong>Updated:</strong> {new Date(selectedReport?.updatedAt).toLocaleString()}</div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Report Title</h3>
              <h2 className="report-title-display">{selectedReport?.title}</h2>
            </div>

            <div className="detail-section">
              <h3>Report Content</h3>
              <div className="report-content">
                {selectedReport?.content?.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h3>Linked Records</h3>
              <div className="linked-records">
                {linkedCase && (
                  <div className="linked-item">
                    <FileText size={16} />
                    <span>Case: {linkedCase.caseNumber} - {linkedCase.title}</span>
                  </div>
                )}
                {linkedOB && (
                  <div className="linked-item">
                    <FileText size={16} />
                    <span>OB: {linkedOB.obNumber} - {linkedOB.type}</span>
                  </div>
                )}
                {linkedEvidence && (
                  <div className="linked-item">
                    <FileText size={16} />
                    <span>Evidence: {linkedEvidence.evidenceNumber} - {linkedEvidence.type}</span>
                  </div>
                )}
                {!linkedCase && !linkedOB && !linkedEvidence && (
                  <p className="no-links">No linked records found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  switch (currentView) {
    case 'detail':
      return <ReportDetail />;
    case 'create':
      return <CreateReportForm />;
    default:
      return <ReportsList />;
  }
};

export default Reports;