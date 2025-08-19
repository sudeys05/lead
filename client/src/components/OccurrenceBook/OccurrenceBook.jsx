import React, { useState } from 'react';
import { Search, Plus, Clock, FileText, Edit, Trash2, AlertTriangle } from 'lucide-react';
import './OccurrenceBook.css';

const OccurrenceBook = ({ onAddOBClick, obEntries, onUpdateOB, onDeleteOB }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [editingEntry, setEditingEntry] = useState(null);

  const stats = [
    { title: 'Total Entries', value: obEntries.length.toString(), icon: FileText, color: 'blue' },
    { title: 'Today\'s Entries', value: obEntries.filter(e => e.date === new Date().toISOString().split('T')[0]).length.toString(), icon: Clock, color: 'orange' },
    { title: 'Pending Review', value: obEntries.filter(e => e.status === 'Pending').length.toString(), icon: AlertTriangle, color: 'red' }
  ];

  const filteredEntries = obEntries.filter(entry => {
    const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.obNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.reportedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || entry.type.toLowerCase() === typeFilter.toLowerCase();
    
    return matchesSearch && matchesType;
  });

  const handleEdit = (entry) => {
    setEditingEntry(entry);
  };

  const handleDelete = (obId) => {
    if (window.confirm('Are you sure you want to delete this OB entry?')) {
      onDeleteOB(obId);
    }
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    onUpdateOB(editingEntry);
    setEditingEntry(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="occurrence-book">
      <div className="ob-header">
        <h1>Occurrence Book (OB)</h1>
      </div>

      <div className="ob-controls">
        <div className="search-bar">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search OB entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="incident">Incident</option>
            <option value="complaint">Complaint</option>
            <option value="arrest">Arrest</option>
            <option value="accident">Accident</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button className="add-ob-btn" onClick={onAddOBClick}>
          <Plus className="btn-icon" />
          Add OB Entry
        </button>
      </div>

      <div className="ob-stats">
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

      <div className="ob-table">
        <table>
          <thead>
            <tr>
              <th>OB Number</th>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Description</th>
              <th>Reported By</th>
              <th>Officer</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => (
              <tr key={entry.id}>
                {editingEntry && editingEntry.id === entry.id ? (
                  <>
                    <td className="ob-number">{entry.obNumber}</td>
                    <td>{entry.dateTime}</td>
                    <td>
                      <select
                        name="type"
                        value={editingEntry.type}
                        onChange={handleEditChange}
                        className="edit-select"
                      >
                        <option value="Incident">Incident</option>
                        <option value="Complaint">Complaint</option>
                        <option value="Arrest">Arrest</option>
                        <option value="Accident">Accident</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        name="description"
                        value={editingEntry.description}
                        onChange={handleEditChange}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="reportedBy"
                        value={editingEntry.reportedBy}
                        onChange={handleEditChange}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="officer"
                        value={editingEntry.officer}
                        onChange={handleEditChange}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <select
                        name="status"
                        value={editingEntry.status}
                        onChange={handleEditChange}
                        className="edit-select"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={handleUpdateSubmit} className="save-btn">
                          Save
                        </button>
                        <button onClick={() => setEditingEntry(null)} className="cancel-btn-small">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="ob-number">{entry.obNumber}</td>
                    <td>{entry.dateTime}</td>
                    <td>
                      <span className={`type ${entry.type.toLowerCase()}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td>{entry.description}</td>
                    <td>{entry.reportedBy}</td>
                    <td>{entry.officer}</td>
                    <td>
                      <span className={`status ${entry.status.toLowerCase().replace(' ', '-')}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={() => handleEdit(entry)} className="edit-btn">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(entry.id)} className="delete-btn">
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

export default OccurrenceBook;