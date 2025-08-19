
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Car, 
  Truck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Navigation,
  Radio,
  Shield,
  Plus,
  Route,
  Eye,
  Crosshair,
  Layers,
  Settings,
  Target,
  Search
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './InteractiveMap.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const InteractiveMap = ({ vehicles = [], showPatrolAreas = true, onVehicleSelect }) => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [mapCenter, setMapCenter] = useState([45.0792, -74.5058]); // Montreal coordinates as default
  const [zoom, setZoom] = useState(12);
  const [showRoutes, setShowRoutes] = useState(false);
  const [locationPins, setLocationPins] = useState([]);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [vehicleRoutes, setVehicleRoutes] = useState({});
  const [mapMode, setMapMode] = useState('street'); // street, satellite, terrain
  const [showTrafficLayer, setShowTrafficLayer] = useState(false);
  const [trackingVehicle, setTrackingVehicle] = useState(null);
  const [newPinData, setNewPinData] = useState({ address: '', description: '', type: 'incident' });
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingPinLocation, setPendingPinLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [clickedAddress, setClickedAddress] = useState(null);
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [addressPopupPosition, setAddressPopupPosition] = useState(null);
  const [searchMarkers, setSearchMarkers] = useState([]);
  const [isMapMinimized, setIsMapMinimized] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // Custom icons for different vehicle types and statuses
  const createVehicleIcon = (vehicleType, status) => {
    const color = getStatusColor(status);
    const iconSize = status === 'responding' ? [30, 30] : [25, 25];
    
    return L.divIcon({
      className: `custom-vehicle-icon ${status}`,
      html: `
        <div style="
          background: ${color};
          width: ${iconSize[0]}px;
          height: ${iconSize[1]}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          position: relative;
        ">
          ${getVehicleSymbol(vehicleType)}
          ${status === 'responding' ? '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #e74c3c; border-radius: 50%; animation: pulse 1s infinite;"></div>' : ''}
        </div>
      `,
      iconSize: iconSize,
      iconAnchor: [iconSize[0]/2, iconSize[1]/2]
    });
  };

  const createLocationPinIcon = (type) => {
    const colors = {
      incident: '#e74c3c',
      checkpoint: '#3498db',
      station: '#2ecc71',
      emergency: '#f39c12'
    };
    
    return L.divIcon({
      className: 'custom-location-pin',
      html: `
        <div style="
          background: ${colors[type] || '#95a5a6'};
          width: 20px;
          height: 20px;
          border-radius: 50% 50% 50% 0;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transform: rotate(-45deg);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            color: white;
            font-size: 10px;
          ">📍</div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 20]
    });
  };

  const createSearchMarkerIcon = (isMainResult = false) => {
    return L.divIcon({
      className: 'search-result-marker',
      html: `
        <div style="
          background: ${isMainResult ? '#2ecc71' : '#3498db'};
          width: ${isMainResult ? '28px' : '22px'};
          height: ${isMainResult ? '28px' : '22px'};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${isMainResult ? '16px' : '12px'};
          position: relative;
          ${isMainResult ? 'animation: searchPulse 2s infinite;' : ''}
        ">
          🔍
        </div>
      `,
      iconSize: isMainResult ? [28, 28] : [22, 22],
      iconAnchor: isMainResult ? [14, 14] : [11, 11]
    });
  };

  const getVehicleSymbol = (vehicleType) => {
    switch (vehicleType) {
      case 'motorcycle': return '🏍';
      case 'k9': return '🐕';
      case 'special': return '🚐';
      default: return '🚔';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return '#2ecc71';
      case 'on_patrol': return '#3498db';
      case 'responding': return '#e74c3c';
      case 'out_of_service': return '#95a5a6';
      default: return '#7f8c8d';
    }
  };

  const getStatusIcon = (status) => {
    const iconProps = { size: 16 };
    switch (status) {
      case 'available': return <CheckCircle {...iconProps} />;
      case 'on_patrol': return <Navigation {...iconProps} />;
      case 'responding': return <AlertTriangle {...iconProps} />;
      case 'out_of_service': return <XCircle {...iconProps} />;
      default: return <Clock {...iconProps} />;
    }
  };

  // Parse coordinates from JSON string
  const parseCoordinates = (coordString) => {
    try {
      if (typeof coordString === 'string') {
        return JSON.parse(coordString);
      }
      return coordString;
    } catch {
      return null;
    }
  };

  // Generate random route for demonstration
  const generateVehicleRoute = (vehicleCoords) => {
    if (!vehicleCoords) return [];
    
    const route = [vehicleCoords];
    for (let i = 0; i < 10; i++) {
      const lastPoint = route[route.length - 1];
      const newPoint = [
        lastPoint[0] + (Math.random() - 0.5) * 0.01,
        lastPoint[1] + (Math.random() - 0.5) * 0.01
      ];
      route.push(newPoint);
    }
    return route;
  };

  // Advanced geocoding with Nominatim (free OpenStreetMap service)
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&addressdetails=1&limit=5&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          coordinates: [parseFloat(data[0].lat), parseFloat(data[0].lon)],
          results: data.map(item => ({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            display_name: item.display_name,
            address: item.address,
            place_id: item.place_id,
            importance: item.importance
          }))
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        return {
          display_name: data.display_name,
          address: data.address,
          place_id: data.place_id
        };
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
    return null;
  };

  // Search for places/cities
  const searchPlaces = async (query) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&addressdetails=1&limit=10&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      
      return data.map(item => ({
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        display_name: item.display_name,
        address: item.address,
        place_id: item.place_id,
        type: item.type,
        class: item.class,
        importance: item.importance
      }));
    } catch (error) {
      console.error('Place search error:', error);
      return [];
    }
  };

  const handleVehicleClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    if (onVehicleSelect) {
      onVehicleSelect(vehicle);
    }
    
    const coords = parseCoordinates(vehicle.currentLocation);
    if (coords) {
      setMapCenter(coords);
      setZoom(15);
    }
  };

  const handleAddressSearch = async () => {
    if (!searchAddress.trim()) return;
    
    setIsSearching(true);
    setShowSearchResults(false);
    
    try {
      const results = await searchPlaces(searchAddress);
      if (results && results.length > 0) {
        setSearchResults(results);
        setShowSearchResults(true);
        
        // Auto-navigate to first result and add search markers
        const firstResult = results[0];
        setMapCenter([firstResult.lat, firstResult.lon]);
        setZoom(15);
        
        // Clear existing search markers and add new ones
        const markers = results.slice(0, 8).map((result, index) => ({
          id: `search-${Date.now()}-${index}`,
          position: [result.lat, result.lon],
          title: result.display_name,
          type: 'search_result',
          importance: result.importance || 0,
          isMainResult: index === 0,
          address: result.address,
          placeType: result.type,
          placeClass: result.class
        }));
        setSearchMarkers(markers);
      } else {
        alert('No places found for your search. Please try a different query.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    setMapCenter([result.lat, result.lon]);
    setZoom(15);
    setShowSearchResults(false);
    setSearchAddress(result.display_name);
    
    // Update search markers to highlight selected result
    const markers = searchResults.slice(0, 5).map((r, index) => ({
      id: `search-${Date.now()}-${index}`,
      position: [r.lat, r.lon],
      title: r.display_name,
      type: 'search_result',
      importance: r.importance || 0,
      isMainResult: r.place_id === result.place_id
    }));
    setSearchMarkers(markers);
  };

  const toggleVehicleRoute = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    const coords = parseCoordinates(vehicle.currentLocation);
    if (!coords) return;
    
    if (vehicleRoutes[vehicleId]) {
      const newRoutes = { ...vehicleRoutes };
      delete newRoutes[vehicleId];
      setVehicleRoutes(newRoutes);
    } else {
      const route = generateVehicleRoute(coords);
      setVehicleRoutes({ ...vehicleRoutes, [vehicleId]: route });
    }
  };

  const addLocationPin = async (location, data) => {
    setIsGeocoding(true);
    let finalLocation = location;
    let finalAddress = data.address;
    
    // If user entered a new address, geocode it
    if (data.address && data.address !== newPinData.address) {
      try {
        const geocodeResult = await geocodeAddress(data.address);
        if (geocodeResult && geocodeResult.coordinates) {
          finalLocation = geocodeResult.coordinates;
          finalAddress = geocodeResult.results[0].display_name;
        }
      } catch (error) {
        console.error('Geocoding failed:', error);
      }
    }
    
    const newPin = {
      id: Date.now(),
      position: finalLocation,
      address: finalAddress,
      description: data.description,
      type: data.type,
      timestamp: new Date().toISOString(),
      isGeocoded: data.address !== newPinData.address
    };
    
    setLocationPins([...locationPins, newPin]);
    setShowPinModal(false);
    setPendingPinLocation(null);
    setNewPinData({ address: '', description: '', type: 'incident' });
    setIsGeocoding(false);
    
    // Center map on new pin
    setMapCenter(finalLocation);
    setZoom(16);
  };

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        
        if (isAddingPin) {
          // Auto-fill address when adding pin
          const addressData = await reverseGeocode(lat, lng);
          setPendingPinLocation([lat, lng]);
          if (addressData) {
            setNewPinData(prev => ({
              ...prev,
              address: addressData.display_name
            }));
          }
          setShowPinModal(true);
          setIsAddingPin(false);
        } else {
          // Show address popup for any map click
          const addressData = await reverseGeocode(lat, lng);
          if (addressData) {
            setClickedAddress({
              ...addressData,
              coordinates: [lat, lng]
            });
            setAddressPopupPosition([lat, lng]);
            setShowAddressPopup(true);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
              setShowAddressPopup(false);
            }, 5000);
          }
        }
      }
    });
    return null;
  };

  // Auto-center on tracking vehicle
  useEffect(() => {
    if (trackingVehicle) {
      const vehicle = vehicles.find(v => v.id === trackingVehicle);
      if (vehicle) {
        const coords = parseCoordinates(vehicle.currentLocation);
        if (coords) {
          setMapCenter(coords);
        }
      }
    }
  }, [vehicles, trackingVehicle]);

  const getTileLayerUrl = () => {
    switch (mapMode) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  return (
    <div className="enhanced-map-container">
      {/* Enhanced Map Header */}
      <div className="map-header">
        <div className="map-title">
          <Radio size={24} />
          <h3>Police Command Center</h3>
          <span className="vehicle-count">{vehicles.length} Active Units</span>
        </div>
        
        <div className="map-size-controls">
          <button 
            className="size-control-btn"
            onClick={() => setIsMapMinimized(!isMapMinimized)}
            title={isMapMinimized ? "Maximize Map" : "Minimize Map"}
          >
            {isMapMinimized ? (
              <>
                <Plus size={14} />
                Maximize
              </>
            ) : (
              <>
                <Eye size={14} />
                Minimize
              </>
            )}
          </button>
        </div>
        
        <div className="map-search">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search cities, places, addresses..."
              value={searchAddress}
              onChange={(e) => {
                setSearchAddress(e.target.value);
                if (!e.target.value.trim()) {
                  setShowSearchResults(false);
                }
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
            />
            <button onClick={handleAddressSearch} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="search-results-dropdown">
              {searchResults.slice(0, 8).map((result, index) => (
                <div
                  key={result.place_id || index}
                  className="search-result-item"
                  onClick={() => selectSearchResult(result)}
                >
                  <div className="result-main">
                    <MapPin size={14} />
                    <span className="result-name">
                      {result.address?.city || result.address?.town || result.address?.village || 
                       result.display_name.split(',')[0]}
                    </span>
                  </div>
                  <div className="result-address">
                    {result.display_name}
                  </div>
                  <div className="result-type">
                    {result.type && result.class && `${result.class} • ${result.type}`}
                  </div>
                </div>
              ))}
              <div className="search-results-footer">
                <button onClick={() => setShowSearchResults(false)}>Close</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="map-controls">
          <button 
            className={`control-btn ${mapMode === 'street' ? 'active' : ''}`}
            onClick={() => setMapMode('street')}
            title="Street View"
          >
            <Layers size={16} />
            Street
          </button>
          <button 
            className={`control-btn ${mapMode === 'satellite' ? 'active' : ''}`}
            onClick={() => setMapMode('satellite')}
            title="Satellite View"
          >
            <Eye size={16} />
            Satellite
          </button>
          <button 
            className={`control-btn ${showRoutes ? 'active' : ''}`}
            onClick={() => setShowRoutes(!showRoutes)}
            title="Toggle Routes"
          >
            <Route size={16} />
            Routes
          </button>
          <button 
            className={`control-btn ${isAddingPin ? 'active' : ''}`}
            onClick={() => setIsAddingPin(!isAddingPin)}
            title="Add Location Pin"
          >
            <Plus size={16} />
            Pin
          </button>
          <button 
            className="control-btn"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const { latitude, longitude } = position.coords;
                    setMapCenter([latitude, longitude]);
                    setZoom(16);
                  },
                  (error) => {
                    alert('Unable to get your location. Please enable location services.');
                  }
                );
              } else {
                alert('Geolocation is not supported by this browser.');
              }
            }}
            title="My Location"
          >
            <Crosshair size={16} />
            My Location
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className={`map-viewport ${isMapMinimized ? 'minimized' : ''}`}>
        {!isMapMinimized ? (
          <MapContainer
            center={mapCenter}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
          <TileLayer
            url={getTileLayerUrl()}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapClickHandler />
          
          {/* Vehicle Markers */}
          {vehicles.map((vehicle) => {
            const coords = parseCoordinates(vehicle.currentLocation);
            if (!coords) return null;
            
            return (
              <Marker
                key={`vehicle-${vehicle.id}`}
                position={coords}
                icon={createVehicleIcon(vehicle.vehicleType, vehicle.status)}
                eventHandlers={{
                  click: () => handleVehicleClick(vehicle)
                }}
              >
                <Popup>
                  <div className="vehicle-popup">
                    <div className="popup-header">
                      <strong>{vehicle.vehicleId}</strong>
                      <span className={`status-badge ${vehicle.status}`}>
                        {getStatusIcon(vehicle.status)}
                        {vehicle.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="popup-content">
                      <p><strong>Vehicle:</strong> {vehicle.make} {vehicle.model} ({vehicle.year})</p>
                      <p><strong>License:</strong> {vehicle.licensePlate}</p>
                      <p><strong>Type:</strong> {vehicle.vehicleType}</p>
                      {vehicle.assignedOfficerId && (
                        <p><strong>Officer:</strong> #{vehicle.assignedOfficerId}</p>
                      )}
                      <p><strong>Last Update:</strong> {new Date(vehicle.lastUpdate).toLocaleString()}</p>
                    </div>
                    <div className="popup-actions">
                      <button 
                        onClick={() => toggleVehicleRoute(vehicle.id)}
                        className="route-btn"
                      >
                        <Route size={14} />
                        {vehicleRoutes[vehicle.id] ? 'Hide Route' : 'Show Route'}
                      </button>
                      <button 
                        onClick={() => setTrackingVehicle(trackingVehicle === vehicle.id ? null : vehicle.id)}
                        className={`track-btn ${trackingVehicle === vehicle.id ? 'active' : ''}`}
                      >
                        <Target size={14} />
                        {trackingVehicle === vehicle.id ? 'Stop Tracking' : 'Track Vehicle'}
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
          
          {/* Vehicle Routes */}
          {showRoutes && Object.entries(vehicleRoutes).map(([vehicleId, route]) => {
            const vehicle = vehicles.find(v => v.id === vehicleId);
            if (!vehicle || !route || route.length < 2) return null;
            
            return (
              <Polyline
                key={`route-${vehicleId}`}
                positions={route}
                color={getStatusColor(vehicle.status)}
                weight={3}
                opacity={0.8}
                dashArray="5, 10"
              />
            );
          })}
          
          {/* Search Result Markers */}
          {searchMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              icon={createSearchMarkerIcon(marker.isMainResult)}
            >
              <Popup>
                <div className="search-marker-popup">
                  <h4>🔍 {marker.isMainResult ? 'Main Search Result' : 'Search Result'}</h4>
                  <p><strong>Location:</strong> {marker.title}</p>
                  {marker.address?.city && (
                    <p><strong>City:</strong> {marker.address.city}</p>
                  )}
                  {marker.address?.country && (
                    <p><strong>Country:</strong> {marker.address.country}</p>
                  )}
                  {marker.placeType && marker.placeClass && (
                    <p><strong>Type:</strong> {marker.placeClass} • {marker.placeType}</p>
                  )}
                  <p><strong>Coordinates:</strong> {marker.position[0].toFixed(6)}, {marker.position[1].toFixed(6)}</p>
                  <div className="search-popup-actions">
                    <button 
                      onClick={() => {
                        setPendingPinLocation(marker.position);
                        setNewPinData(prev => ({
                          ...prev,
                          address: marker.title
                        }));
                        setShowPinModal(true);
                      }}
                      className="add-pin-here-btn"
                    >
                      <Plus size={12} />
                      Add Pin Here
                    </button>
                    <button 
                      onClick={() => setSearchMarkers(searchMarkers.filter(m => m.id !== marker.id))}
                      className="remove-marker-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Location Pins */}
          {locationPins.map((pin) => (
            <Marker
              key={`pin-${pin.id}`}
              position={pin.position}
              icon={createLocationPinIcon(pin.type)}
            >
              <Popup>
                <div className="pin-popup">
                  <h4>{pin.type.charAt(0).toUpperCase() + pin.type.slice(1)}</h4>
                  {pin.address && <p><strong>Address:</strong> {pin.address}</p>}
                  {pin.description && <p><strong>Description:</strong> {pin.description}</p>}
                  <p><strong>Added:</strong> {new Date(pin.timestamp).toLocaleString()}</p>
                  {pin.isGeocoded && <p><strong>📍 Geocoded Location</strong></p>}
                  <button 
                    onClick={() => setLocationPins(locationPins.filter(p => p.id !== pin.id))}
                    className="remove-pin-btn"
                  >
                    Remove Pin
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Address Popup for clicked locations */}
          {showAddressPopup && clickedAddress && addressPopupPosition && (
            <Marker
              position={addressPopupPosition}
              icon={L.divIcon({
                className: 'address-popup-marker',
                html: `
                  <div style="
                    background: #2c3e50;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    border: 2px solid #3498db;
                    font-size: 12px;
                    white-space: nowrap;
                    max-width: 250px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    position: relative;
                  ">
                    <div style="font-weight: bold; margin-bottom: 4px;">📍 Clicked Location</div>
                    <div style="font-size: 11px; opacity: 0.9;">${clickedAddress.display_name}</div>
                    <div style="
                      position: absolute;
                      bottom: -6px;
                      left: 50%;
                      transform: translateX(-50%);
                      width: 0;
                      height: 0;
                      border-left: 6px solid transparent;
                      border-right: 6px solid transparent;
                      border-top: 6px solid #3498db;
                    "></div>
                  </div>
                `,
                iconSize: [250, 50],
                iconAnchor: [125, 50]
              })}
            >
              <Popup>
                <div className="address-popup">
                  <h4>📍 Location Details</h4>
                  <p><strong>Address:</strong> {clickedAddress.display_name}</p>
                  <p><strong>Coordinates:</strong> {clickedAddress.coordinates[0].toFixed(6)}, {clickedAddress.coordinates[1].toFixed(6)}</p>
                  {clickedAddress.address?.country && (
                    <p><strong>Country:</strong> {clickedAddress.address.country}</p>
                  )}
                  {clickedAddress.address?.city && (
                    <p><strong>City:</strong> {clickedAddress.address.city}</p>
                  )}
                  <div className="address-popup-actions">
                    <button 
                      onClick={() => {
                        setPendingPinLocation(clickedAddress.coordinates);
                        setNewPinData(prev => ({
                          ...prev,
                          address: clickedAddress.display_name
                        }));
                        setShowPinModal(true);
                        setShowAddressPopup(false);
                      }}
                      className="add-pin-here-btn"
                    >
                      <Plus size={12} />
                      Add Pin Here
                    </button>
                    <button 
                      onClick={() => setShowAddressPopup(false)}
                      className="close-popup-btn"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
        ) : (
          <div className="minimized-map-view">
            <div className="minimized-content">
              <div className="minimized-title">
                <Radio size={32} />
                <h2>Police Command Center</h2>
              </div>
              <div className="minimized-stats">
                <div className="stat-item">
                  <Car size={20} />
                  <span>{vehicles.length} Active Units</span>
                </div>
                <div className="stat-item">
                  <MapPin size={20} />
                  <span>{locationPins.length} Location Pins</span>
                </div>
                <div className="stat-item">
                  <Search size={20} />
                  <span>{searchMarkers.length} Search Results</span>
                </div>
              </div>
              <button 
                className="expand-map-btn"
                onClick={() => setIsMapMinimized(false)}
              >
                <Plus size={16} />
                Expand Map View
              </button>
            </div>
          </div>
        )}
      </div>

      

      {/* Location Pin Modal */}
      {showPinModal && (
        <div className="pin-modal-overlay">
          <div className="pin-modal">
            <div className="modal-header">
              <h3>Add Location Pin</h3>
              <button onClick={() => setShowPinModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Type:</label>
                <select 
                  value={newPinData.type} 
                  onChange={(e) => setNewPinData({...newPinData, type: e.target.value})}
                >
                  <option value="incident">Incident</option>
                  <option value="checkpoint">Checkpoint</option>
                  <option value="station">Station</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div className="form-group">
                <label>Address:</label>
                <input
                  type="text"
                  placeholder="Enter specific address to geocode..."
                  value={newPinData.address}
                  onChange={(e) => setNewPinData({...newPinData, address: e.target.value})}
                />
                <small className="address-help">
                  💡 Enter a new address to automatically find its location on the map
                </small>
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  placeholder="Enter description..."
                  value={newPinData.description}
                  onChange={(e) => setNewPinData({...newPinData, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowPinModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button 
                  onClick={() => addLocationPin(pendingPinLocation, newPinData)}
                  className="add-btn"
                  disabled={isGeocoding}
                >
                  {isGeocoding ? 'Geocoding...' : 'Add Pin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Map Legend */}
      {!isMapMinimized && showLegend && (
        <div className="professional-legend">
          <div className="legend-header">
            <Shield size={18} />
            <h5>Command Center Legend</h5>
            <button 
              className="legend-toggle"
              onClick={() => setShowLegend(false)}
              title="Hide Legend"
            >
              ×
            </button>
          </div>
          
          <div className="legend-content">
            <div className="legend-section">
              <h6><Car size={14} /> Vehicle Status</h6>
              <div className="legend-grid">
                <div className="legend-item">
                  <div className="status-indicator available"></div>
                  <span>Available</span>
                  <small>Ready for deployment</small>
                </div>
                <div className="legend-item">
                  <div className="status-indicator on-patrol"></div>
                  <span>On Patrol</span>
                  <small>Active monitoring</small>
                </div>
                <div className="legend-item">
                  <div className="status-indicator responding"></div>
                  <span>Responding</span>
                  <small>Emergency response</small>
                </div>
                <div className="legend-item">
                  <div className="status-indicator out-of-service"></div>
                  <span>Out of Service</span>
                  <small>Maintenance/Break</small>
                </div>
              </div>
            </div>
            
            <div className="legend-section">
              <h6><MapPin size={14} /> Location Markers</h6>
              <div className="legend-grid">
                <div className="legend-item">
                  <div className="location-indicator incident">📍</div>
                  <span>Incident</span>
                  <small>Active incident</small>
                </div>
                <div className="legend-item">
                  <div className="location-indicator checkpoint">📍</div>
                  <span>Checkpoint</span>
                  <small>Security checkpoint</small>
                </div>
                <div className="legend-item">
                  <div className="location-indicator station">📍</div>
                  <span>Station</span>
                  <small>Police station</small>
                </div>
                <div className="legend-item">
                  <div className="location-indicator emergency">📍</div>
                  <span>Emergency</span>
                  <small>Emergency location</small>
                </div>
              </div>
            </div>
            
            <div className="legend-section">
              <h6><Search size={14} /> Search Results</h6>
              <div className="legend-grid">
                <div className="legend-item">
                  <div className="search-indicator main">🔍</div>
                  <span>Main Result</span>
                  <small>Primary search match</small>
                </div>
                <div className="legend-item">
                  <div className="search-indicator secondary">🔍</div>
                  <span>Other Results</span>
                  <small>Additional matches</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Show Legend Button when hidden */}
      {!isMapMinimized && !showLegend && (
        <button 
          className="show-legend-btn"
          onClick={() => setShowLegend(true)}
          title="Show Legend"
        >
          <Settings size={16} />
          Legend
        </button>
      )}
    </div>
  );
};

export default InteractiveMap;
