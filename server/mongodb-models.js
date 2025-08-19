
import mongoose from 'mongoose';

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['admin', 'officer', 'detective', 'supervisor'], default: 'officer' },
  badgeNumber: { type: String, unique: true, sparse: true },
  department: String,
  position: String,
  phone: String,
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Case Schema
const caseSchema = new mongoose.Schema({
  caseNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  type: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Closed', 'Suspended'], default: 'Open' },
  incidentDate: Date,
  location: String,
  assignedOfficer: String,
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// OB Entry Schema
const obEntrySchema = new mongoose.Schema({
  obNumber: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  time: { type: Date, required: true },
  location: String,
  involvedPersons: String,
  actionTaken: String,
  reportingOfficer: String,
  createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Evidence Schema
const evidenceSchema = new mongoose.Schema({
  evidenceNumber: { type: String, required: true, unique: true },
  type: { type: String, required: true, enum: ['Physical', 'Digital', 'Document', 'Photo', 'Video', 'Audio', 'Other'] },
  description: { type: String, required: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  obId: { type: mongoose.Schema.Types.ObjectId, ref: 'OBEntry' },
  location: { type: String, required: true },
  chain_of_custody: String,
  status: { type: String, enum: ['Collected', 'Analyzed', 'Stored', 'Released', 'Disposed', 'Missing'], default: 'Collected' },
  collectedBy: { type: String, required: true },
  collectedAt: { type: Date, default: Date.now },
  // Enhanced evidence tracking fields
  tags: [String], // For categorization and search
  weight: String,
  dimensions: String,
  serialNumber: String,
  condition: { type: String, enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'], default: 'Good' },
  storageLocation: String,
  evidenceRoom: String,
  bagsSealed: { type: Boolean, default: false },
  photographed: { type: Boolean, default: false },
  fingerprinted: { type: Boolean, default: false },
  dnaCollected: { type: Boolean, default: false },
  // Chain of custody tracking
  custodyLog: [{
    action: { type: String, required: true }, // 'collected', 'transferred', 'analyzed', etc.
    officer: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    notes: String,
    location: String
  }],
  // Media attachments
  media: [{
    name: String,
    url: String,
    type: { type: String, enum: ['photo', 'video', 'audio', 'document'] },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: String
  }],
  // Administrative fields
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  isSealed: { type: Boolean, default: false },
  disposalDate: Date,
  disposalMethod: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Report Schema
const reportSchema = new mongoose.Schema({
  reportNumber: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  obId: { type: mongoose.Schema.Types.ObjectId, ref: 'OBEntry' },
  evidenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Evidence' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Pending', 'Approved', 'Completed', 'Rejected'], default: 'Pending' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// License Plate Schema
const licensePlateSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true, unique: true },
  ownerName: String,
  fatherName: String,
  motherName: String,
  idNumber: String,
  passportNumber: String,
  ownerImage: String,
  vehicleType: String,
  vehicleModel: String,
  vehicleColor: String,
  registrationDate: Date,
  expiryDate: Date,
  status: { type: String, enum: ['Active', 'Suspended', 'Expired'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create and export models
export const User = mongoose.model('User', userSchema);
export const Case = mongoose.model('Case', caseSchema);
export const OBEntry = mongoose.model('OBEntry', obEntrySchema);
export const Evidence = mongoose.model('Evidence', evidenceSchema);
export const Report = mongoose.model('Report', reportSchema);
export const LicensePlate = mongoose.model('LicensePlate', licensePlateSchema);
