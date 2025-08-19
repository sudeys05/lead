// MongoDB-based API routes for Police Management System
import {
  UsersCRUD,
  CasesCRUD,
  OBEntriesCRUD,
  LicensePlatesCRUD,
  EvidenceCRUD,
  PoliceVehiclesCRUD,
  GeofilesCRUD,
  ProfilesCRUD,
  OfficersCRUD
} from './mongodb-crud.js';
import bcrypt from 'bcryptjs';

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export function registerMongoDBRoutes(app) {
  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await UsersCRUD.findByUsername(username);

      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid credentials or account disabled' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.userId = user._id.toString();
      req.session.user = {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      };

      res.json({
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          badgeNumber: user.badgeNumber
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json({ user: req.session.user });
  });

  // Users API Routes
  app.get('/api/users', async (req, res) => {
    try {
      const users = await UsersCRUD.findAll();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await UsersCRUD.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const userData = { ...req.body };
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      const user = await UsersCRUD.create(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    try {
      const updateData = { ...req.body };
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      const updated = await UsersCRUD.update(req.params.id, updateData);
      if (!updated) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const deleted = await UsersCRUD.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
  });

  // Cases API Routes
  app.get('/api/cases', async (req, res) => {
    try {
      console.log('🔍 Fetching all cases from MongoDB...');
      const cases = await CasesCRUD.findAll();
      console.log('📊 Found cases in MongoDB:', cases.length, 'records');

      // Add case numbers and map to expected format
      const mappedCases = cases.map(caseItem => ({
        ...caseItem,
        id: caseItem._id.toString(),
        caseNumber: caseItem.caseNumber || `CASE-${new Date().getFullYear()}-${caseItem._id.toString().slice(-3).toUpperCase()}`
      }));

      res.json({ cases: mappedCases });
    } catch (error) {
      console.error('❌ Failed to fetch cases:', error);
      res.status(500).json({ message: 'Failed to fetch cases', error: error.message });
    }
  });

  app.post('/api/cases', async (req, res) => {
    try {
      console.log('🔍 Creating new case with data:', req.body);

      // Generate case number
      const caseNumber = `CASE-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const caseData = {
        ...req.body,
        caseNumber,
        reportedDate: new Date(),
        createdById: 1 // Default admin user
      };

      const createdCase = await CasesCRUD.create(caseData);
      console.log('✅ Case created successfully:', createdCase);

      const responseCase = {
        ...createdCase,
        id: createdCase._id.toString()
      };

      res.status(201).json({ case: responseCase });
    } catch (error) {
      console.error('❌ Failed to create case:', error);
      res.status(500).json({ message: 'Failed to create case', error: error.message });
    }
  });

  app.put('/api/cases/:id', async (req, res) => {
    try {
      console.log('🔍 Updating case:', req.params.id, 'with data:', req.body);
      const updated = await CasesCRUD.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Case not found' });
      }

      // Fetch the updated case
      const updatedCase = await CasesCRUD.findById(req.params.id);
      const responseCase = {
        ...updatedCase,
        id: updatedCase._id.toString()
      };

      res.json({ case: responseCase });
    } catch (error) {
      console.error('❌ Failed to update case:', error);
      res.status(500).json({ message: 'Failed to update case', error: error.message });
    }
  });

  // OB Entries API Routes
  app.get('/api/ob-entries', async (req, res) => {
    try {
      console.log('🔍 Fetching all OB entries from MongoDB...');
      const obEntries = await OBEntriesCRUD.findAll();
      console.log('📊 Found OB entries in MongoDB:', obEntries.length, 'records');

      // Transform MongoDB data to match frontend expectations
      const transformedEntries = obEntries.map(entry => ({
        ...entry,
        id: entry._id.toString(),
        obNumber: entry.obNumber || `OB-${new Date().getFullYear()}-${entry._id.toString().slice(-3).toUpperCase()}`,
        officer: entry.officer || 'Officer Smith'
      }));

      res.json({ obEntries: transformedEntries });
    } catch (error) {
      console.error('❌ Failed to fetch OB entries:', error);
      res.status(500).json({ message: 'Failed to fetch OB entries', error: error.message });
    }
  });

  app.post('/api/ob-entries', async (req, res) => {
    try {
      console.log('🔍 Creating new OB entry with data:', req.body);

      // Generate OB number if not provided
      const obNumber = req.body.obNumber || `OB-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const obData = {
        ...req.body,
        obNumber,
        dateTime: req.body.dateTime || new Date().toISOString(),
        date: req.body.date || new Date().toISOString().split('T')[0],
        time: req.body.time || new Date().toTimeString().split(' ')[0],
        status: req.body.status || 'Pending',
        officer: req.body.officer || 'Officer Smith',
        recordingOfficerId: 1 // Default admin user
      };

      const createdEntry = await OBEntriesCRUD.create(obData);
      console.log('✅ OB entry created successfully:', createdEntry);

      const responseEntry = {
        ...createdEntry,
        id: createdEntry._id.toString()
      };

      res.status(201).json({ obEntry: responseEntry });
    } catch (error) {
      console.error('❌ Failed to create OB entry:', error);
      res.status(500).json({ message: 'Failed to create OB entry', error: error.message });
    }
  });

  app.put('/api/ob-entries/:id', async (req, res) => {
    try {
      console.log('🔍 Updating OB entry:', req.params.id, 'with data:', req.body);
      const updated = await OBEntriesCRUD.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'OB entry not found' });
      }

      // Fetch the updated entry
      const updatedEntry = await OBEntriesCRUD.findById(req.params.id);
      const responseEntry = {
        ...updatedEntry,
        id: updatedEntry._id.toString()
      };

      res.json({ obEntry: responseEntry });
    } catch (error) {
      console.error('❌ Failed to update OB entry:', error);
      res.status(500).json({ message: 'Failed to update OB entry', error: error.message });
    }
  });

  app.delete('/api/ob-entries/:id', async (req, res) => {
    try {
      console.log('🗑️ Deleting OB entry:', req.params.id);
      const deleted = await OBEntriesCRUD.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'OB entry not found' });
      }
      console.log('✅ OB entry deleted successfully');
      res.json({ message: 'OB entry deleted successfully' });
    } catch (error) {
      console.error('❌ Failed to delete OB entry:', error);
      res.status(500).json({ message: 'Failed to delete OB entry', error: error.message });
    }
  });

  // License Plates API Routes
  app.get('/api/license-plates', async (req, res) => {
    try {
      console.log('🔍 Fetching all license plates from MongoDB...');
      const plates = await LicensePlatesCRUD.findAll();
      console.log('📊 Found license plates in MongoDB:', plates.length, 'records');

      res.json({ licensePlates: plates });
    } catch (error) {
      console.error('❌ Failed to fetch license plates:', error);
      res.status(500).json({ message: 'Failed to fetch license plates', error: error.message });
    }
  });

  // Add mongo prefix route for compatibility
  app.get('/api/mongo/license-plates', async (req, res) => {
    try {
      console.log('🔍 Fetching all license plates from MongoDB via /mongo endpoint...');
      const plates = await LicensePlatesCRUD.findAll();
      console.log('📊 Found license plates in MongoDB:', plates.length, 'records');

      res.json({ licensePlates: plates });
    } catch (error) {
      console.error('❌ Failed to fetch license plates:', error);
      res.status(500).json({ message: 'Failed to fetch license plates', error: error.message });
    }
  });

  app.get('/api/license-plates/search/:plateNumber', async (req, res) => {
    try {
      console.log('🔍 Searching for license plate:', req.params.plateNumber);
      const plate = await LicensePlatesCRUD.findByPlateNumber(req.params.plateNumber);

      if (!plate) {
        return res.status(404).json({ message: "License plate not found" });
      }

      const responsePlate = {
        ...plate,
        id: plate._id.toString()
      };

      res.json({ licensePlate: responsePlate });
    } catch (error) {
      console.error('❌ Failed to search license plate:', error);
      res.status(500).json({ message: 'Failed to search license plate', error: error.message });
    }
  });

  app.post('/api/license-plates', async (req, res) => {
    try {
      console.log('🔍 Creating new license plate with data:', req.body);

      const plateData = {
        ...req.body,
        addedById: 1, // Default admin user
        status: req.body.status || 'Active'
      };

      const createdPlate = await LicensePlatesCRUD.create(plateData);
      console.log('✅ License plate created successfully:', createdPlate);

      res.status(201).json({ licensePlate: createdPlate });
    } catch (error) {
      console.error('❌ Failed to create license plate:', error);
      res.status(500).json({ message: 'Failed to create license plate', error: error.message });
    }
  });

  app.put('/api/license-plates/:id', async (req, res) => {
    try {
      console.log('🔍 Updating license plate:', req.params.id, 'with data:', req.body);
      const updated = await LicensePlatesCRUD.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'License plate not found' });
      }

      // Fetch the updated plate
      const updatedPlate = await LicensePlatesCRUD.findById(req.params.id);
      const responsePlate = {
        ...updatedPlate,
        id: updatedPlate._id.toString()
      };

      res.json({ licensePlate: responsePlate });
    } catch (error) {
      console.error('❌ Failed to update license plate:', error);
      res.status(500).json({ message: 'Failed to update license plate', error: error.message });
    }
  });

  app.delete('/api/license-plates/:id', async (req, res) => {
    try {
      console.log('🗑️ Deleting license plate:', req.params.id);
      const deleted = await LicensePlatesCRUD.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'License plate not found' });
      }
      console.log('✅ License plate deleted successfully');
      res.json({ message: 'License plate deleted successfully' });
    } catch (error) {
      console.error('❌ Failed to delete license plate:', error);
      res.status(500).json({ message: 'Failed to delete license plate', error: error.message });
    }
  });

  // Evidence routes are handled in evidence-routes.js

  // Police Vehicles API Routes
  app.get('/api/police-vehicles', async (req, res) => {
    try {
      const vehicles = await PoliceVehiclesCRUD.findAll();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch police vehicles', error: error.message });
    }
  });

  app.post('/api/police-vehicles', async (req, res) => {
    try {
      const vehicle = await PoliceVehiclesCRUD.create(req.body);
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create police vehicle record', error: error.message });
    }
  });

  // Profiles API Routes
  app.get('/api/profiles', async (req, res) => {
    try {
      console.log('🔍 Fetching all profiles from MongoDB...');
      const profiles = await ProfilesCRUD.findAll();
      console.log('📊 Found profiles in MongoDB:', profiles.length, 'records');

      const mappedProfiles = profiles.map(profile => ({
        ...profile,
        id: profile._id.toString()
      }));

      res.json({ profiles: mappedProfiles });
    } catch (error) {
      console.error('❌ Failed to fetch profiles:', error);
      res.status(500).json({ message: 'Failed to fetch profiles', error: error.message });
    }
  });

  app.post('/api/profiles', async (req, res) => {
    try {
      console.log('🔍 Creating new profile with data:', req.body);
      const profile = await ProfilesCRUD.create(req.body);
      const responseProfile = {
        ...profile,
        id: profile._id.toString()
      };
      res.status(201).json({ profile: responseProfile });
    } catch (error) {
      console.error('❌ Failed to create profile:', error);
      res.status(500).json({ message: 'Failed to create profile', error: error.message });
    }
  });

  // Officers API Routes
  app.get('/api/officers', async (req, res) => {
    try {
      console.log('🔍 Fetching all officers from MongoDB...');
      const officers = await OfficersCRUD.findAll();
      console.log('📊 Found officers in MongoDB:', officers.length, 'records');

      const mappedOfficers = officers.map(officer => ({
        ...officer,
        id: officer._id.toString()
      }));

      res.json({ officers: mappedOfficers });
    } catch (error) {
      console.error('❌ Failed to fetch officers:', error);
      res.status(500).json({ message: 'Failed to fetch officers', error: error.message });
    }
  });

  app.post('/api/officers', async (req, res) => {
    try {
      console.log('🔍 Creating new officer with data:', req.body);
      const officer = await OfficersCRUD.create(req.body);
      const responseOfficer = {
        ...officer,
        id: officer._id.toString()
      };
      res.status(201).json({ officer: responseOfficer });
    } catch (error) {
      console.error('❌ Failed to create officer:', error);
      res.status(500).json({ message: 'Failed to create officer', error: error.message });
    }
  });

  app.put('/api/officers/:id', async (req, res) => {
    try {
      console.log('🔍 Updating officer:', req.params.id, 'with data:', req.body);
      const updated = await OfficersCRUD.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Officer not found' });
      }

      // Fetch the updated officer
      const updatedOfficer = await OfficersCRUD.findById(req.params.id);
      const responseOfficer = {
        ...updatedOfficer,
        id: updatedOfficer._id.toString()
      };

      res.json({ officer: responseOfficer });
    } catch (error) {
      console.error('❌ Failed to update officer:', error);
      res.status(500).json({ message: 'Failed to update officer', error: error.message });
    }
  });

  app.delete('/api/officers/:id', async (req, res) => {
    try {
      console.log('🗑️ Deleting officer:', req.params.id);
      const deleted = await OfficersCRUD.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Officer not found' });
      }
      console.log('✅ Officer deleted successfully');
      res.json({ message: 'Officer deleted successfully' });
    } catch (error) {
      console.error('❌ Failed to delete officer:', error);
      res.status(500).json({ message: 'Failed to delete officer', error: error.message });
    }
  });

  // Geofiles API Routes
  app.get('/api/geofiles', async (req, res) => {
    try {
      console.log('🔍 Fetching geofiles with query params:', req.query);
      
      // Extract filter parameters
      const filters = {
        search: req.query.search,
        fileType: req.query.fileType,
        accessLevel: req.query.accessLevel,
        tags: req.query.tags ? req.query.tags.split(',') : [],
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };
      
      const geofiles = await GeofilesCRUD.findAll(filters);
      console.log('📊 Found geofiles:', geofiles.length, 'records');
      
      res.json({ geofiles });
    } catch (error) {
      console.error('❌ Failed to fetch geofiles:', error);
      res.status(500).json({ message: 'Failed to fetch geofiles', error: error.message });
    }
  });

  app.get('/api/geofiles/:id', async (req, res) => {
    try {
      console.log('🔍 Fetching geofile by ID:', req.params.id);
      const geofile = await GeofilesCRUD.findById(req.params.id);
      
      if (!geofile) {
        return res.status(404).json({ message: 'Geofile not found' });
      }
      
      // Update access timestamp
      await GeofilesCRUD.updateAccess(req.params.id);
      
      const responseGeofile = {
        ...geofile,
        id: geofile._id.toString()
      };
      
      res.json({ geofile: responseGeofile });
    } catch (error) {
      console.error('❌ Failed to fetch geofile:', error);
      res.status(500).json({ message: 'Failed to fetch geofile', error: error.message });
    }
  });

  app.post('/api/geofiles', async (req, res) => {
    try {
      console.log('🔍 Creating new geofile with data:', req.body);
      
      const geofileData = {
        ...req.body,
        uploadedBy: req.session?.userId || 1, // Use session user or default to admin
        lastAccessedAt: new Date(),
        downloadCount: 0
      };
      
      // Validate required fields
      if (!geofileData.filename || !geofileData.fileType) {
        return res.status(400).json({ message: 'Filename and file type are required' });
      }
      
      // Validate file type
      const allowedTypes = ['shp', 'kml', 'geojson', 'csv', 'gpx', 'kmz', 'gml'];
      if (!allowedTypes.includes(geofileData.fileType.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid file type. Allowed types: ' + allowedTypes.join(', ') });
      }
      
      const createdGeofile = await GeofilesCRUD.create(geofileData);
      console.log('✅ Geofile created successfully:', createdGeofile.id);
      
      res.status(201).json({ geofile: createdGeofile });
    } catch (error) {
      console.error('❌ Failed to create geofile:', error);
      res.status(500).json({ message: 'Failed to create geofile record', error: error.message });
    }
  });

  app.put('/api/geofiles/:id', async (req, res) => {
    try {
      console.log('🔍 Updating geofile:', req.params.id, 'with data:', req.body);
      const updated = await GeofilesCRUD.update(req.params.id, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: 'Geofile not found' });
      }
      
      // Fetch the updated geofile
      const updatedGeofile = await GeofilesCRUD.findById(req.params.id);
      const responseGeofile = {
        ...updatedGeofile,
        id: updatedGeofile._id.toString()
      };
      
      console.log('✅ Geofile updated successfully');
      res.json({ geofile: responseGeofile });
    } catch (error) {
      console.error('❌ Failed to update geofile:', error);
      res.status(500).json({ message: 'Failed to update geofile', error: error.message });
    }
  });

  app.delete('/api/geofiles/:id', async (req, res) => {
    try {
      console.log('🗑️ Deleting geofile:', req.params.id);
      const deleted = await GeofilesCRUD.delete(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Geofile not found' });
      }
      
      console.log('✅ Geofile deleted successfully');
      res.json({ message: 'Geofile deleted successfully' });
    } catch (error) {
      console.error('❌ Failed to delete geofile:', error);
      res.status(500).json({ message: 'Failed to delete geofile', error: error.message });
    }
  });

  app.post('/api/geofiles/upload', async (req, res) => {
    try {
      console.log('🔍 Uploading geofile with form data:', req.body);
      
      // Validate required fields
      if (!req.body.name) {
        return res.status(400).json({ message: 'Name is required' });
      }
      
      // Set default file type if not provided
      const fileType = req.body.fileType || 'GEOJSON';
      const fileName = req.body.name;
      
      // For now, simulate file upload without actual file storage
      const geofileData = {
        filename: fileName + '.' + fileType.toLowerCase(),
        filepath: `/geofiles/${fileName}.${fileType.toLowerCase()}`,
        fileType: fileType.toUpperCase(),
        fileSize: Math.floor(Math.random() * 100000) + 10000, // Random size for demo
        description: req.body.description || '',
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
        coordinateSystem: req.body.coordinateSystem || 'WGS84',
        accessLevel: req.body.accessLevel || 'internal',
        isPublic: req.body.isPublic === 'true',
        caseId: req.body.caseId || null,
        obId: req.body.obId || null,
        evidenceId: req.body.evidenceId || null,
        address: `${fileName} Location`,
        locationName: fileName,
        coordinates: JSON.stringify([-122.4194, 37.7749]), // Default SF coordinates
        boundingBox: JSON.stringify([[-122.45, 37.75], [-122.38, 37.80]]),
        metadata: JSON.stringify({
          creator: 'Police Department',
          coordinateSystem: req.body.coordinateSystem || 'WGS84',
          uploadMethod: 'web_interface'
        }),
        uploadedBy: req.session?.userId || 1,
        downloadCount: 0
      };
      
      const createdGeofile = await GeofilesCRUD.create(geofileData);
      console.log('✅ Geofile uploaded successfully:', createdGeofile.id);
      
      res.status(201).json({ 
        geofile: createdGeofile,
        message: 'Geofile uploaded successfully' 
      });
    } catch (error) {
      console.error('❌ Failed to upload geofile:', error);
      res.status(500).json({ message: 'Failed to upload geofile', error: error.message });
    }
  });

  app.post('/api/geofiles/:id/download', async (req, res) => {
    try {
      console.log('📥 Recording download for geofile:', req.params.id);
      await GeofilesCRUD.incrementDownload(req.params.id);
      res.json({ message: 'Download recorded successfully' });
    } catch (error) {
      console.error('❌ Failed to record download:', error);
      res.status(500).json({ message: 'Failed to record download', error: error.message });
    }
  });

  app.get('/api/geofiles/stats/summary', async (req, res) => {
    try {
      console.log('📊 Fetching geofiles statistics');
      const stats = await GeofilesCRUD.getStats();
      res.json({ stats });
    } catch (error) {
      console.error('❌ Failed to fetch geofiles stats:', error);
      res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
    }
  });

  // Profile API Routes
  app.get('/api/profile', async (req, res) => {
    try {
      console.log('🔍 Fetching user profile...');
      console.log('📍 Session data:', { userId: req.session?.userId, user: req.session?.user });

      let user;
      let profile;

      // First try to get from session
      if (req.session?.userId) {
        try {
          user = await UsersCRUD.findById(req.session.userId);
          if (user) {
            profile = await ProfilesCRUD.findByUserId(req.session.userId);
          }
          console.log('📊 Found user by session ID:', user ? 'Found' : 'Not found');
          console.log('📊 Found profile by user ID:', profile ? 'Found' : 'Not found');
        } catch (error) {
          console.log('⚠️ Session ID lookup failed:', error.message);
        }
      }

      // If no user found, try to find admin user
      if (!user) {
        console.log('🔍 Looking for admin user by username...');
        user = await UsersCRUD.findByUsername('admin');
        if (user) {
          profile = await ProfilesCRUD.findByUserId(user._id.toString());
          if (!profile) {
            // Create profile from user data if it doesn't exist
            const profileData = {
              userId: user._id.toString(),
              username: user.username,
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              email: user.email || '',
              badgeNumber: user.badgeNumber || '',
              department: user.department || 'Police Department',
              position: user.position || user.role || 'Officer',
              phone: user.phone || '',
              role: user.role,
              isActive: user.isActive,
              lastLoginAt: user.lastLoginAt
            };
            profile = await ProfilesCRUD.create(profileData);
            console.log('📝 Created new profile for admin user:', profile);
          }
        }
        console.log('📊 Admin user found:', user ? 'Yes' : 'No');
        console.log('📊 Admin profile found/created:', profile ? 'Yes' : 'No');
      }

      if (!user || !profile) {
        console.error('❌ No user or profile found in database');
        return res.status(404).json({ message: 'User profile not found' });
      }

      // Combine user and profile data
      const responseUser = {
        id: profile._id?.toString() || profile.id,
        userId: profile.userId,
        username: profile.username,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        badgeNumber: profile.badgeNumber,
        department: profile.department,
        position: profile.position,
        phone: profile.phone,
        role: profile.role,
        isActive: profile.isActive,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        lastLoginAt: profile.lastLoginAt
      };

      console.log('✅ Profile retrieved successfully:', {
        username: responseUser.username,
        firstName: responseUser.firstName,
        lastName: responseUser.lastName,
        email: responseUser.email,
        department: responseUser.department,
        position: responseUser.position
      });
      res.json({ user: responseUser });
    } catch (error) {
      console.error('❌ Failed to fetch profile:', error);
      res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
    }
  });

  app.put('/api/profile', async (req, res) => {
    try {
      console.log('🔍 Updating user profile with data:', req.body);

      let user;
      let profile;
      let userId;

      // First try to get current user
      if (req.session?.userId) {
        try {
          user = await UsersCRUD.findById(req.session.userId);
          userId = req.session.userId;
          if (user) {
            profile = await ProfilesCRUD.findByUserId(userId);
          }
        } catch (error) {
          console.log('⚠️ Session ID lookup failed for update');
        }
      }

      // If no user found, use admin user
      if (!user) {
        user = await UsersCRUD.findByUsername('admin');
        if (user) {
          userId = user._id.toString();
          profile = await ProfilesCRUD.findByUserId(userId);
        }
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updateData = { ...req.body };
      // Remove sensitive fields that shouldn't be updated via profile
      delete updateData.password;
      delete updateData._id;
      delete updateData.id;
      delete updateData.userId;

      let updatedProfile;

      if (profile) {
        // Update existing profile
        console.log('📝 Updating existing profile with ID:', profile._id.toString());
        const updated = await ProfilesCRUD.update(profile._id.toString(), updateData);

        if (!updated) {
          return res.status(404).json({ message: 'Failed to update profile' });
        }

        updatedProfile = await ProfilesCRUD.findById(profile._id.toString());
      } else {
        // Create new profile
        console.log('📝 Creating new profile for user:', userId);
        const profileData = {
          userId,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
          ...updateData
        };
        updatedProfile = await ProfilesCRUD.create(profileData);
      }

      const responseUser = {
        id: updatedProfile._id?.toString() || updatedProfile.id,
        userId: updatedProfile.userId,
        username: updatedProfile.username,
        firstName: updatedProfile.firstName,
        lastName: updatedProfile.lastName,
        email: updatedProfile.email,
        badgeNumber: updatedProfile.badgeNumber,
        department: updatedProfile.department,
        position: updatedProfile.position,
        phone: updatedProfile.phone,
        role: updatedProfile.role,
        isActive: updatedProfile.isActive,
        createdAt: updatedProfile.createdAt,
        updatedAt: updatedProfile.updatedAt
      };

      console.log('✅ Profile updated successfully');
      res.json({ user: responseUser });
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
  });

  

  // Evidence routes handled in evidence-routes.js
}