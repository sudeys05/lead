import { createServer } from "http";
import session from "express-session";
import { storage } from "./db-config.js";
import { registerMongoDBRoutes } from "./mongodb-routes.js";
import { 
  loginSchema, 
  registerSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  updateProfileSchema,
  insertCaseSchema,
  insertOBSchema,
  insertLicensePlateSchema,
  insertEvidenceSchema,
  insertGeofileSchema,
  insertReportSchema,
  insertPoliceVehicleSchema
} from "../shared/schema.js";
import { randomBytes } from "crypto";

// Authentication middleware
export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Admin middleware
export const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export async function registerRoutes(app) {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'police-system-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    name: 'police.sid',
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  }));

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      console.log('Login attempt:', { username: req.body.username });
      const { username, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log('User not found:', username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // For the default admin user with plain text password, allow direct comparison
      // In production, all passwords should be hashed
      const isValidPassword = user.password === password || 
        (user.username === 'admin' && password === 'admin123');

      if (!isValidPassword) {
        console.log('Invalid password for user:', username);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        console.log('User account deactivated:', username);
        return res.status(403).json({ message: "Account is deactivated" });
      }

      await storage.updateLastLogin(user.id);
      req.session.userId = user.id;
      req.session.user = user;

      console.log('Login successful for user:', username);
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // Create user (remove confirmPassword before saving)
      const { confirmPassword, ...userToCreate } = userData;
      const newUser = await storage.createUser(userToCreate);

      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { username } = forgotPasswordSchema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        // Don't reveal if user exists or not
        return res.json({ message: "If the username exists, a reset token has been generated" });
      }

      const token = randomBytes(32).toString('hex');
      await storage.createPasswordResetToken(user.id, token);

      // In production, send email here
      // For development, return the token
      res.json({ 
        message: "Password reset token generated",
        token // Remove this in production
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);

      const resetData = await storage.getPasswordResetToken(token);
      if (!resetData) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      await storage.updateUserPassword(resetData.userId, password);
      await storage.deletePasswordResetToken(token);

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    // Return default admin user if no session
    const userId = req.session?.userId || 1;
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  // Profile routes
  app.put('/api/profile', async (req, res) => {
    try {
      const updates = updateProfileSchema.parse(req.body);
      const userId = req.session?.userId || 1;
      const updatedUser = await storage.updateUser(userId, updates);

      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  // User management routes
  app.get('/api/users', async (req, res) => {
    const users = await storage.getAllUsers();
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json({ users: usersWithoutPasswords });
  });

  app.delete('/api/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);

    if (userId === 1) {
      return res.status(400).json({ message: "Cannot delete admin account" });
    }

    try {
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(404).json({ message: "User not found" });
    }
  });

  // Profiles routes are now handled by MongoDB routes

  app.post('/api/cases', async (req, res) => {
    try {
      const caseData = insertCaseSchema.parse(req.body);
      const newCase = await storage.createCase({
        ...caseData,
        createdById: 1 // Default to admin user
      });
      res.status(201).json({ case: newCase });
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.put('/api/cases/:id', async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const updates = req.body;
      const updatedCase = await storage.updateCase(caseId, updates);
      res.json({ case: updatedCase });
    } catch (error) {
      res.status(404).json({ message: "Case not found" });
    }
  });

  app.delete('/api/cases/:id', async (req, res) => {
    try {
      const caseId = parseInt(req.params.id);
      await storage.deleteCase(caseId);
      res.json({ message: "Case deleted successfully" });
    } catch (error) {
      res.status(404).json({ message: "Case not found" });
    }
  });

  // OB Entry routes - using MongoDB
  app.get('/api/ob-entries', async (req, res) => {
    try {
      const { OBEntriesCRUD } = await import('./mongodb-crud.js');
      const obEntries = await OBEntriesCRUD.findAll();
      console.log('📊 Raw OB entries from MongoDB:', obEntries.length, 'entries found');
      console.log('📄 Raw OB entries data:', obEntries);ries);

      // Transform MongoDB data to match frontend expectations
      const transformedEntries = obEntries.map(entry => {
        const transformed = {
          id: entry._id.toString(),
          obNumber: entry.obNumber || `OB-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          type: entry.type || 'Incident',
          description: entry.description || '',
          reportedBy: entry.reportedBy || '',
          officer: entry.officer || 'Officer Smith',
          dateTime: entry.dateTime || entry.createdAt?.toISOString() || new Date().toISOString(),
          date: entry.date || (entry.createdAt ? entry.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          time: entry.time || (entry.createdAt ? entry.createdAt.toTimeString().split(' ')[0] : new Date().toTimeString().split(' ')[0]),
          status: entry.status || 'Pending',
          recordingOfficerId: entry.recordingOfficerId || 1,
          location: entry.location || '',
          details: entry.details || '',
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt
        };
        return transformed;
      });

      console.log('🔄 Transformed OB entries:', transformedEntries.length);
      res.json({ obEntries: transformedEntries });
    } catch (error) {
      console.error('Error fetching OB entries:', error);
      res.status(500).json({ message: 'Failed to fetch OB entries' });
    }
  });

  app.post('/api/ob-entries', async (req, res) => {
    try {
      const obData = insertOBSchema.parse(req.body);
      const { OBEntriesCRUD } = await import('./mongodb-crud.js');

      console.log('🔍 Creating OB entry with data:', obData);

      // Generate OB number if not provided
      const obNumber = obData.obNumber || `OB-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const entryToCreate = {
        ...obData,
        obNumber,
        dateTime: obData.dateTime || new Date().toISOString(),
        date: obData.date || new Date().toISOString().split('T')[0],
        time: obData.time || new Date().toTimeString().split(' ')[0],
        status: obData.status || 'Pending',
        recordingOfficerId: 1 // Default to admin user
      };

      console.log('📝 OB entry to create:', entryToCreate);

      const newOBEntry = await OBEntriesCRUD.create(entryToCreate);

      console.log('✅ Created OB entry in MongoDB:', newOBEntry);

      // Transform response to match frontend expectations
      const transformedEntry = {
        id: newOBEntry._id.toString(),
        obNumber: newOBEntry.obNumber,
        type: newOBEntry.type,
        description: newOBEntry.description,
        reportedBy: newOBEntry.reportedBy,
        officer: newOBEntry.officer,
        dateTime: newOBEntry.dateTime,
        date: newOBEntry.date,
        time: newOBEntry.time,
        status: newOBEntry.status,
        location: newOBEntry.location,
        details: newOBEntry.details,
        recordingOfficerId: newOBEntry.recordingOfficerId,
        createdAt: newOBEntry.createdAt,
        updatedAt: newOBEntry.updatedAt
      };

      res.status(201).json({ obEntry: transformedEntry });
    } catch (error) {
      console.error('Error creating OB entry:', error);
      res.status(400).json({ message: "Invalid input", error: error.message });
    }
  });

  app.put('/api/ob-entries/:id', async (req, res) => {
    try {
      const updates = req.body;
      const { OBEntriesCRUD } = await import('./mongodb-crud.js');
      console.log('🔄 Updating OB entry:', req.params.id, 'with data:', updates);
      const updated = await OBEntriesCRUD.update(req.params.id, updates);
      if (!updated) {
        return res.status(404).json({ message: "OB Entry not found" });
      }
      console.log('✅ OB entry updated successfully');
      res.json({ message: "OB Entry updated successfully" });
    } catch (error) {
      console.error('Error updating OB entry:', error);
      res.status(404).json({ message: "OB Entry not found" });
    }
  });

  app.delete('/api/ob-entries/:id', async (req, res) => {
    try {
      const { OBEntriesCRUD } = await import('./mongodb-crud.js');
      console.log('🗑️ Deleting OB entry:', req.params.id);
      const deleted = await OBEntriesCRUD.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "OB Entry not found" });
      }
      console.log('✅ OB entry deleted successfully');
      res.json({ message: "OB Entry deleted successfully" });
    } catch (error) {
      console.error('Error deleting OB entry:', error);
      res.status(500).json({ message: "Failed to delete OB entry" });
    }
  });

  // License Plate routes
  app.get('/api/license-plates', async (req, res) => {
    const licensePlates = await storage.getLicensePlates();
    res.json({ licensePlates });
  });

  app.get('/api/license-plates/search/:plateNumber', async (req, res) => {
    const plateNumber = req.params.plateNumber;
    const licensePlate = await storage.getLicensePlateByNumber(plateNumber);

    if (!licensePlate) {
      return res.status(404).json({ message: "License plate not found" });
    }

    res.json({ licensePlate });
  });

  app.post('/api/license-plates', async (req, res) => {
    try {
      const plateData = insertLicensePlateSchema.parse(req.body);
      const newPlate = await storage.createLicensePlate({
        ...plateData,
        addedById: 1 // Default to admin user
      });
      res.status(201).json({ licensePlate: newPlate });
    } catch (error) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.put('/api/license-plates/:id', async (req, res) => {
    try {
      const plateId = parseInt(req.params.id);
      const updates = req.body;
      const updatedPlate = await storage.updateLicensePlate(plateId, updates);
      res.json({ licensePlate: updatedPlate });
    } catch (error) {
      res.status(404).json({ message: "License plate not found" });
    }
  });

  app.delete('/api/license-plates/:id', async (req, res) => {
    try {
      const plateId = parseInt(req.params.id);
      await storage.deleteLicensePlate(plateId);
      res.json({ message: "License plate deleted successfully" });
    } catch (error) {
      res.status(404).json({ message: "License plate not found" });
    }
  });

  // Cases endpoint using storage
  app.get('/api/cases', async (req, res) => {
    try {
      const cases = await storage.getCases();
      res.json({ cases });
    } catch (error) {
      console.error('Error fetching cases:', error);
      res.status(500).json({ message: 'Failed to fetch cases' });
    }
  });

  // Evidence routes
  app.get('/api/evidence', async (req, res) => {
    try {
      const evidence = await storage.getEvidence();
      res.json({ evidence });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch evidence' });
    }
  });

  app.get('/api/evidence/:id', async (req, res) => {
    try {
      const evidenceItem = await storage.getEvidenceItem(parseInt(req.params.id));
      if (!evidenceItem) {
        return res.status(404).json({ message: 'Evidence not found' });
      }
      res.json(evidenceItem);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch evidence' });
    }
  });

  app.post('/api/evidence', async (req, res) => {
    try {
      const evidenceData = insertEvidenceSchema.parse(req.body);
      const newEvidence = await storage.createEvidence(evidenceData);
      res.status(201).json(newEvidence);
    } catch (error) {
      res.status(400).json({ message: 'Invalid evidence data' });
    }
  });

  app.put('/api/evidence/:id', async (req, res) => {
    try {
      const evidenceData = insertEvidenceSchema.parse(req.body);
      const updatedEvidence = await storage.updateEvidence(parseInt(req.params.id), evidenceData);
      res.json(updatedEvidence);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update evidence' });
    }
  });

  app.delete('/api/evidence/:id', async (req, res) => {
    try {
      await storage.deleteEvidence(parseInt(req.params.id));
      res.json({ message: 'Evidence deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete evidence' });
    }
  });

  // Geofiles routes
  app.get('/api/geofiles', async (req, res) => {
    try {
      const { search, type, tags, accessLevel, dateFrom, dateTo } = req.query;
      const geofiles = await storage.getGeofiles({
        search,
        fileType: type,
        tags: tags ? tags.split(',') : undefined,
        accessLevel,
        dateFrom,
        dateTo
      });
      res.json({ geofiles });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch geofiles' });
    }
  });

  app.get('/api/geofiles/:id', async (req, res) => {
    try {
      const geofile = await storage.getGeofile(parseInt(req.params.id));
      if (!geofile) {
        return res.status(404).json({ message: 'Geofile not found' });
      }

      // Update last accessed time for analytics
      await storage.updateGeofileAccess(parseInt(req.params.id));

      res.json(geofile);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch geofile' });
    }
  });

  app.get('/api/geofiles/:id/download', async (req, res) => {
    try {
      const geofile = await storage.getGeofile(parseInt(req.params.id));
      if (!geofile) {
        return res.status(404).json({ message: 'Geofile not found' });
      }

      // Increment download count
      await storage.incrementGeofileDownload(parseInt(req.params.id));

      // Provide download information
      res.json({ 
        downloadUrl: geofile.fileUrl || geofile.filepath,
        filename: geofile.filename,
        fileType: geofile.fileType,
        fileSize: geofile.fileSize 
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to download geofile' });
    }
  });

  app.get('/api/geofiles/search/by-location', async (req, res) => {
    try {
      const { lat, lng, radius } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ message: 'Latitude and longitude required' });
      }

      const geofiles = await storage.searchGeofilesByLocation(
        parseFloat(lat), 
        parseFloat(lng), 
        parseFloat(radius) || 1000 // Default 1km radius
      );
      res.json({ geofiles });
    } catch (error) {
      res.status(500).json({ message: 'Failed to search geofiles by location' });
    }
  });

  app.post('/api/geofiles', async (req, res) => {
    try {
      const geofileData = {
        ...req.body,
        uploadedBy: 1, // Default to admin user
        lastAccessedAt: new Date(),
        downloadCount: 0
      };

      // Validate file type
      const allowedTypes = ['kml', 'gpx', 'shp', 'geojson', 'kmz', 'gml', 'other'];
      if (!allowedTypes.includes(geofileData.fileType?.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid file type' });
      }

      const newGeofile = await storage.createGeofile(geofileData);
      res.status(201).json(newGeofile);
    } catch (error) {
      console.error('Error creating geofile:', error);
      res.status(400).json({ message: 'Invalid geofile data' });
    }
  });

  app.put('/api/geofiles/:id', async (req, res) => {
    try {
      const geofileData = req.body;
      const updatedGeofile = await storage.updateGeofile(parseInt(req.params.id), geofileData);
      res.json(updatedGeofile);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update geofile' });
    }
  });

  app.delete('/api/geofiles/:id', async (req, res) => {
    try {
      await storage.deleteGeofile(parseInt(req.params.id));
      res.json({ message: 'Geofile deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete geofile' });
    }
  });

  app.post('/api/geofiles/:id/link-case/:caseId', async (req, res) => {
    try {
      const geofileId = parseInt(req.params.id);
      const caseId = parseInt(req.params.caseId);
      await storage.linkGeofileToCase(geofileId, caseId);
      res.json({ message: 'Geofile linked to case successfully' });
    } catch (error) {
      res.status(400).json({ message: 'Failed to link geofile to case' });
    }
  });

  app.post('/api/geofiles/:id/add-tags', async (req, res) => {
    try {
      const geofileId = parseInt(req.params.id);
      const { tags } = req.body;
      await storage.addGeofileTags(geofileId, tags);
      res.json({ message: 'Tags added successfully' });
    } catch (error) {
      res.status(400).json({ message: 'Failed to add tags' });
    }
  });

  // Reports routes
  app.get('/api/reports', async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json({ reports });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch reports' });
    }
  });

  app.get('/api/reports/:id', async (req, res) => {
    try {
      const report = await storage.getReport(parseInt(req.params.id));
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch report' });
    }
  });

  app.post('/api/reports', async (req, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      const newReport = await storage.createReport({
        ...reportData,
        requestedBy: 1 // Default to admin user
      });
      res.status(201).json(newReport);
    } catch (error) {
      res.status(400).json({ message: 'Invalid report data' });
    }
  });

  app.put('/api/reports/:id', async (req, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      const updatedReport = await storage.updateReport(parseInt(req.params.id), reportData);
      res.json(updatedReport);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update report' });
    }
  });

  app.delete('/api/reports/:id', async (req, res) => {
    try {
      await storage.deleteReport(parseInt(req.params.id));
      res.json({ message: 'Report deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete report' });
    }
  });

  // Police Vehicles routes
  app.get('/api/police-vehicles', async (req, res) => {
    try {
      const vehicles = await storage.getPoliceVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch police vehicles' });
    }
  });

  app.get('/api/police-vehicles/:id', async (req, res) => {
    try {
      const vehicle = await storage.getPoliceVehicle(parseInt(req.params.id));
      if (!vehicle) {
        return res.status(404).json({ message: 'Police vehicle not found' });
      }
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch police vehicle' });
    }
  });

  app.post('/api/police-vehicles', async (req, res) => {
    try {
      const vehicleData = insertPoliceVehicleSchema.parse(req.body);
      const newVehicle = await storage.createPoliceVehicle(vehicleData);
      res.status(201).json(newVehicle);
    } catch (error) {
      res.status(400).json({ message: 'Invalid police vehicle data' });
    }
  });

  app.put('/api/police-vehicles/:id', async (req, res) => {
    try {
      const vehicleData = insertPoliceVehicleSchema.parse(req.body);
      const updatedVehicle = await storage.updatePoliceVehicle(parseInt(req.params.id), vehicleData);
      res.json(updatedVehicle);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update police vehicle' });
    }
  });

  app.patch('/api/police-vehicles/:id/location', async (req, res) => {
    try {
      const { location } = req.body;
      if (!location || !Array.isArray(location) || location.length !== 2) {
        return res.status(400).json({ message: 'Invalid location format. Expected [longitude, latitude]' });
      }
      const updatedVehicle = await storage.updateVehicleLocation(parseInt(req.params.id), location);
      res.json(updatedVehicle);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update vehicle location' });
    }
  });

  app.patch('/api/police-vehicles/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !['available', 'on_patrol', 'responding', 'out_of_service'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be one of: available, on_patrol, responding, out_of_service' });
      }
      const updatedVehicle = await storage.updateVehicleStatus(parseInt(req.params.id), status);
      res.json(updatedVehicle);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update vehicle status' });
    }
  });

  app.delete('/api/police-vehicles/:id', async (req, res) => {
    try {
      await storage.deletePoliceVehicle(parseInt(req.params.id));
      res.json({ message: 'Police vehicle deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete police vehicle' });
    }
  });

  // Register MongoDB API routes (with /api/mongo prefix)
  registerMongoDBRoutes(app);

  const server = createServer(app);
  return server;
}