import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  Users,
  FileText,
  Shield,
  TrendingUp
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ onAddCaseClick, onLicensePlateClick, cases, setActiveSection }) => {
  const openCases = cases.filter(c => c.status === 'Open').length;
  const inProgressCases = cases.filter(c => c.status === 'In Progress').length;
  const closedCases = cases.filter(c => c.status === 'Closed').length;
  const priorityCases = cases.filter(c => c.priority === 'High').length;

  const stats = [
    { title: 'Open Cases', value: openCases.toString(), change: '+2 from last week', color: 'orange', icon: FileText, onClick: () => setActiveSection?.('cases') },
    { title: 'In Progress', value: inProgressCases.toString(), change: '+1 from last week', color: 'blue', icon: Clock, onClick: () => setActiveSection?.('cases') },
    { title: 'Closed Cases', value: closedCases.toString(), change: '+5 from last week', color: 'green', icon: CheckCircle, onClick: () => setActiveSection?.('cases') },
    { title: 'Priority Cases', value: priorityCases.toString(), change: '+1 from last week', color: 'red', icon: AlertTriangle, onClick: () => setActiveSection?.('cases') }
  ];

  const quickActions = [
    { title: 'Add Case', subtitle: 'Create new case file', icon: Plus, color: 'blue', onClick: onAddCaseClick },
    { title: 'New Arrests', subtitle: '3 pending entries', icon: Users, color: 'red' },
    { title: 'Geofile Access', subtitle: 'Location tracking', icon: Shield, color: 'green' },
    { title: 'License Plate', subtitle: 'Vehicle lookup', icon: FileText, color: 'purple', onClick: onLicensePlateClick },
    { title: 'Evidence Log', subtitle: 'Upload evidence', icon: TrendingUp, color: 'teal' },
    { title: 'Generate Report', subtitle: 'Create case report', icon: FileText, color: 'indigo' }
  ];

  const recentUpdates = [
    { id: 'UPD003', time: '2024-01-15 14:30', officer: 'Officer Johnson', caseId: 'CASE-2024-001', description: 'Evidence submitted for forensic analysis', priority: 'HIGH' },
    { id: 'UPD002', time: '2024-01-15 12:15', officer: 'Officer Davis', caseId: 'CASE-2024-002', description: 'Witness statement recorded', priority: 'MEDIUM' },
    { id: 'UPD001', time: '2024-01-15 09:45', officer: 'Officer Smith', caseId: 'CASE-2024-003', description: 'Suspect interview completed', priority: 'HIGH' },
    { id: 'UPD004', time: '2024-01-14 16:20', officer: 'Officer Wilson', caseId: 'CASE-2024-004', description: 'Crime scene photos uploaded', priority: 'LOW' },
    { id: 'UPD005', time: '2024-01-14 11:30', officer: 'Officer Brown', caseId: 'CASE-2024-005', description: 'Background check completed', priority: 'MEDIUM' }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, Officer Smith</h1>
          <p>Monday, July 28, 2025</p>
        </div>
        <div className="header-actions">
          <div className="notification-badge">
            <span>3</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <section className="stats-section">
          <h2>Case Overview</h2>
          <div className="stats-grid">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div 
                  key={index} 
                  className={`stat-card ${stat.color}`}
                  onClick={stat.onClick}
                  style={{ cursor: stat.onClick ? 'pointer' : 'default' }}
                  data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}
                >
                  <div className="stat-header">
                    <IconComponent className="stat-icon" />
                    <span className="stat-value">{stat.value}</span>
                  </div>
                  <div className="stat-info">
                    <h3>{stat.title}</h3>
                    <p>{stat.change}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <div 
                  key={index} 
                  className={`action-card ${action.color}`}
                  onClick={action.onClick}
                  style={{ cursor: action.onClick ? 'pointer' : 'default' }}
                >
                  <IconComponent className="action-icon" />
                  <div className="action-info">
                    <h3>{action.title}</h3>
                    <p>{action.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="updates-section">
          <h2>Recent Updates</h2>
          <table className="updates-table">
            <thead>
              <tr>
                <th>Entry ID</th>
                <th>Date & Time</th>
                <th>Officer</th>
                <th>Case ID</th>
                <th>Description</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {recentUpdates.map((update) => (
                <tr key={update.id}>
                  <td>{update.id}</td>
                  <td>{update.time}</td>
                  <td>{update.officer}</td>
                  <td className="case-link">{update.caseId}</td>
                  <td>{update.description}</td>
                  <td>
                    <span className={`priority ${update.priority.toLowerCase()}`}>
                      {update.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;