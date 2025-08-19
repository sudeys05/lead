import React, { useState } from 'react';
import { Search, Filter, Plus, Clock, CheckCircle, FileText, Edit, Trash2 } from 'lucide-react';
import './Cases.css';

const Cases = ({ onAddCaseClick, cases, onUpdateCase, onDeleteCase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [editingCase, setEditingCase] = useState(null);

  const stats = [
    { title: 'Total Cases', value: cases.length.toString(), icon: FileText, color: 'orange' },
    { title: 'In Progress', value: cases.filter(c => c.status === 'In Progress').length.toString(), icon: Clock, color: 'blue' },
    { title: 'Closed', value: cases.filter(c => c.status === 'Closed').length.toString(), icon: CheckCircle, color: 'green' }
  ];

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || caseItem.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'all' || caseItem.priority.toLowerCase() === priorityFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
  };

  const handleDelete = (caseId) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      onDeleteCase(caseId);
    }
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    onUpdateCase(editingCase);
    setEditingCase(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingCase(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="cases">
      <div className="cases-header">
        <h1>All Cases</h1>
      </div>

      <div className="cases-controls">
        <div className="search-bar">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Status</option>
            <option value="open">Open</option>
            <option value="in progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
          
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <button className="add-case-btn" onClick={onAddCaseClick}>
          <Plus className="btn-icon" />
          Add Case
        </button>
      </div>

      <div className="cases-stats">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className={`stat-card ${stat.color}`}>
              <IconComponent className="stat-icon" />
              <div className="stat-info">
                <h3>{stat.title}</h3>
                <span className="stat-value">{stat.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cases-table">
        <table>
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Title</th>
              <th>Officer</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Last Update</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((caseItem) => (
              <tr key={caseItem.id}>
                {editingCase && editingCase.id === caseItem.id ? (
                  <>
                    <td className="case-id">{caseItem.id}</td>
                    <td>
                      <input
                        type="text"
                        name="title"
                        value={editingCase.title}
                        onChange={handleEditChange}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="officer"
                        value={editingCase.officer}
                        onChange={handleEditChange}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <select
                        name="status"
                        value={editingCase.status}
                        onChange={handleEditChange}
                        className="edit-select"
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td>
                      <select
                        name="priority"
                        value={editingCase.priority}
                        onChange={handleEditChange}
                        className="edit-select"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </td>
                    <td>{caseItem.lastUpdate}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={handleUpdateSubmit} className="save-btn">
                          Save
                        </button>
                        <button onClick={() => setEditingCase(null)} className="cancel-btn-small">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="case-id">{caseItem.id}</td>
                    <td>{caseItem.title}</td>
                    <td>{caseItem.officer}</td>
                    <td>
                      <span className={`status ${caseItem.status.toLowerCase().replace(' ', '-')}`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td>
                      <span className={`priority ${caseItem.priority.toLowerCase()}`}>
                        {caseItem.priority}
                      </span>
                    </td>
                    <td>{caseItem.lastUpdate}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEdit(caseItem)} className="edit-btn">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(caseItem.id)} className="delete-btn">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Cases;