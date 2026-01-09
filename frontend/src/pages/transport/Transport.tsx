import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  transportService,
  Route,
  Vehicle,
} from '../../services/api/transportService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Transport.css';

type TabType = 'routes' | 'vehicles' | 'assign-vehicle';

const Transport = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['routes', 'vehicles', 'assign-vehicle'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'routes';

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="transport-page">
      <div className="page-header">
        <h1>Transport</h1>
      </div>

      <div className="transport-tabs">
        <button
          className={activeTab === 'routes' ? 'active' : ''}
          onClick={() => handleTabChange('routes')}
        >
          Routes
        </button>
        <button
          className={activeTab === 'vehicles' ? 'active' : ''}
          onClick={() => handleTabChange('vehicles')}
        >
          Vehicles
        </button>
        <button
          className={activeTab === 'assign-vehicle' ? 'active' : ''}
          onClick={() => handleTabChange('assign-vehicle')}
        >
          Assign Vehicle
        </button>
      </div>

      <div className="transport-content">
        {activeTab === 'routes' && <RoutesTab />}
        {activeTab === 'vehicles' && <VehiclesTab />}
        {activeTab === 'assign-vehicle' && <AssignVehicleTab />}
      </div>
    </div>
  );
};

// ========== Routes Tab ==========

const RoutesTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: routes = [], isLoading, refetch } = useQuery(
    'routes',
    () => transportService.getRoutes(),
    { refetchOnWindowFocus: true }
  );

  const [formData, setFormData] = useState({
    title: '',
    fare: '',
    description: '',
  });

  const createMutation = useMutation(transportService.createRoute, {
    onSuccess: () => {
      queryClient.invalidateQueries('routes');
      refetch();
      showToast('Route created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create route', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<Route> }) => transportService.updateRoute(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('routes');
        refetch();
        showToast('Route updated successfully', 'success');
        setShowEditModal(false);
        setSelectedRoute(null);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update route', 'error');
      },
    }
  );

  const deleteMutation = useMutation(transportService.deleteRoute, {
    onSuccess: () => {
      queryClient.invalidateQueries('routes');
      refetch();
      showToast('Route deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete route', 'error');
    },
  });

  const resetForm = () => {
    setFormData({ title: '', fare: '', description: '' });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.fare === '') {
      showToast('Route title and fare are required', 'error');
      return;
    }
    if (Number(formData.fare) < 0) {
      showToast('Fare must be a positive number', 'error');
      return;
    }
    createMutation.mutate({
      title: formData.title,
      fare: Number(formData.fare),
      description: formData.description || undefined,
    });
  };

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setFormData({
      title: route.title,
      fare: Number(route.fare).toString(),
      description: route.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoute || !formData.title || formData.fare === '') {
      showToast('Route title and fare are required', 'error');
      return;
    }
    if (Number(formData.fare) < 0) {
      showToast('Fare must be a positive number', 'error');
      return;
    }
    updateMutation.mutate({
      id: selectedRoute.id,
      data: {
        title: formData.title,
        fare: Number(formData.fare),
        description: formData.description || undefined,
      },
    });
  };

  return (
    <div className="transport-tab-content">
      <div className="tab-header">
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Add Route
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : routes.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Route Title</th>
              <th>Fare</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr key={route.id}>
                <td>{route.title}</td>
                <td>${Number(route.fare).toFixed(2)}</td>
                <td>{route.description || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm btn-secondary" onClick={() => handleEdit(route)}>Edit</button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this route?')) {
                          deleteMutation.mutate(route.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No routes found</div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="Add Route">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>Route Title <span className="required">*</span></label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Enter route title"
            />
          </div>
          <div className="form-group">
            <label>Fare <span className="required">*</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.fare}
              onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
              required
              placeholder="Enter fare amount"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Enter route description"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedRoute(null); resetForm(); }} title="Edit Route">
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-group">
            <label>Route Title <span className="required">*</span></label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Fare <span className="required">*</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.fare}
              onChange={(e) => setFormData({ ...formData, fare: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedRoute(null); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Vehicles Tab ==========

const VehiclesTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading, refetch } = useQuery(
    'vehicles',
    () => transportService.getVehicles(),
    { refetchOnWindowFocus: true }
  );

  const [formData, setFormData] = useState({
    vehicle_no: '',
    vehicle_model: '',
    year_made: '',
    driver_name: '',
    driver_license: '',
    driver_contact: '',
    note: '',
  });

  const createMutation = useMutation(transportService.createVehicle, {
    onSuccess: () => {
      queryClient.invalidateQueries('vehicles');
      refetch();
      showToast('Vehicle created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create vehicle', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<Vehicle> }) => transportService.updateVehicle(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicles');
        refetch();
        showToast('Vehicle updated successfully', 'success');
        setShowEditModal(false);
        setSelectedVehicle(null);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update vehicle', 'error');
      },
    }
  );

  const deleteMutation = useMutation(transportService.deleteVehicle, {
    onSuccess: () => {
      queryClient.invalidateQueries('vehicles');
      refetch();
      showToast('Vehicle deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete vehicle', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      vehicle_no: '',
      vehicle_model: '',
      year_made: '',
      driver_name: '',
      driver_license: '',
      driver_contact: '',
      note: '',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_no) {
      showToast('Vehicle number is required', 'error');
      return;
    }
    createMutation.mutate({
      vehicle_no: formData.vehicle_no,
      vehicle_model: formData.vehicle_model || undefined,
      year_made: formData.year_made ? Number(formData.year_made) : undefined,
      driver_name: formData.driver_name || undefined,
      driver_license: formData.driver_license || undefined,
      driver_contact: formData.driver_contact || undefined,
      note: formData.note || undefined,
    });
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      vehicle_no: vehicle.vehicle_no,
      vehicle_model: vehicle.vehicle_model || '',
      year_made: vehicle.year_made?.toString() || '',
      driver_name: vehicle.driver_name || '',
      driver_license: vehicle.driver_license || '',
      driver_contact: vehicle.driver_contact || '',
      note: vehicle.note || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !formData.vehicle_no) {
      showToast('Vehicle number is required', 'error');
      return;
    }
    updateMutation.mutate({
      id: selectedVehicle.id,
      data: {
        vehicle_no: formData.vehicle_no,
        vehicle_model: formData.vehicle_model || undefined,
        year_made: formData.year_made ? Number(formData.year_made) : undefined,
        driver_name: formData.driver_name || undefined,
        driver_license: formData.driver_license || undefined,
        driver_contact: formData.driver_contact || undefined,
        note: formData.note || undefined,
      },
    });
  };

  return (
    <div className="transport-tab-content">
      <div className="tab-header">
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Add Vehicle
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : vehicles.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle No</th>
              <th>Model</th>
              <th>Year</th>
              <th>Driver Name</th>
              <th>Driver Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>{vehicle.vehicle_no}</td>
                <td>{vehicle.vehicle_model || '-'}</td>
                <td>{vehicle.year_made || '-'}</td>
                <td>{vehicle.driver_name || '-'}</td>
                <td>{vehicle.driver_contact || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm btn-secondary" onClick={() => handleEdit(vehicle)}>Edit</button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this vehicle?')) {
                          deleteMutation.mutate(vehicle.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No vehicles found</div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="Add Vehicle" size="large">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>Vehicle No <span className="required">*</span></label>
            <input
              type="text"
              value={formData.vehicle_no}
              onChange={(e) => setFormData({ ...formData, vehicle_no: e.target.value })}
              required
              placeholder="Enter vehicle number"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Vehicle Model</label>
              <input
                type="text"
                value={formData.vehicle_model}
                onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                placeholder="Enter vehicle model"
              />
            </div>
            <div className="form-group">
              <label>Year Made</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.year_made}
                onChange={(e) => setFormData({ ...formData, year_made: e.target.value })}
                placeholder="Enter year"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Driver Name</label>
            <input
              type="text"
              value={formData.driver_name}
              onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
              placeholder="Enter driver name"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Driver License</label>
              <input
                type="text"
                value={formData.driver_license}
                onChange={(e) => setFormData({ ...formData, driver_license: e.target.value })}
                placeholder="Enter driver license"
              />
            </div>
            <div className="form-group">
              <label>Driver Contact</label>
              <input
                type="text"
                value={formData.driver_contact}
                onChange={(e) => setFormData({ ...formData, driver_contact: e.target.value })}
                placeholder="Enter driver contact"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Note</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
              placeholder="Enter any additional notes"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedVehicle(null); resetForm(); }} title="Edit Vehicle" size="large">
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-group">
            <label>Vehicle No <span className="required">*</span></label>
            <input
              type="text"
              value={formData.vehicle_no}
              onChange={(e) => setFormData({ ...formData, vehicle_no: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Vehicle Model</label>
              <input
                type="text"
                value={formData.vehicle_model}
                onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Year Made</label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.year_made}
                onChange={(e) => setFormData({ ...formData, year_made: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Driver Name</label>
            <input
              type="text"
              value={formData.driver_name}
              onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Driver License</label>
              <input
                type="text"
                value={formData.driver_license}
                onChange={(e) => setFormData({ ...formData, driver_license: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Driver Contact</label>
              <input
                type="text"
                value={formData.driver_contact}
                onChange={(e) => setFormData({ ...formData, driver_contact: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Note</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedVehicle(null); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Assign Vehicle Tab ==========

const AssignVehicleTab = () => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [routeFilter, setRouteFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: routes = [] } = useQuery('routes', () => transportService.getRoutes());
  const { data: vehicles = [] } = useQuery('vehicles', () => transportService.getVehicles());

  const { data: assignments = [], isLoading, refetch } = useQuery(
    ['vehicle-assignments', routeFilter, vehicleFilter],
    () => transportService.getVehicleAssignments({
      route_id: routeFilter ? Number(routeFilter) : undefined,
      vehicle_id: vehicleFilter ? Number(vehicleFilter) : undefined,
    }),
    { refetchOnWindowFocus: true }
  );

  const [formData, setFormData] = useState({
    route_id: '',
    vehicle_id: '',
  });

  const createMutation = useMutation(transportService.createVehicleAssignment, {
    onSuccess: () => {
      queryClient.invalidateQueries('vehicle-assignments');
      refetch();
      showToast('Vehicle assigned to route successfully', 'success');
      setShowAssignModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to assign vehicle', 'error');
    },
  });

  const deleteMutation = useMutation(transportService.deleteVehicleAssignment, {
    onSuccess: () => {
      queryClient.invalidateQueries('vehicle-assignments');
      refetch();
      showToast('Vehicle assignment removed successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to remove assignment', 'error');
    },
  });

  const resetForm = () => {
    setFormData({ route_id: '', vehicle_id: '' });
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.route_id || !formData.vehicle_id) {
      showToast('Route and vehicle are required', 'error');
      return;
    }
    createMutation.mutate({
      route_id: Number(formData.route_id),
      vehicle_id: Number(formData.vehicle_id),
    });
  };

  return (
    <div className="transport-tab-content">
      <div className="tab-header">
        <div className="filters-section">
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Routes</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.title}
              </option>
            ))}
          </select>
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Vehicles</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.vehicle_no}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowAssignModal(true); }}>
          + Assign Vehicle
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : assignments.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Fare</th>
              <th>Vehicle No</th>
              <th>Vehicle Model</th>
              <th>Driver Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>{assignment.route_title || '-'}</td>
                <td>{assignment.route_fare ? `$${Number(assignment.route_fare).toFixed(2)}` : '-'}</td>
                <td>{assignment.vehicle_no || '-'}</td>
                <td>{assignment.vehicle_model || '-'}</td>
                <td>{assignment.driver_name || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to remove this vehicle assignment?')) {
                          deleteMutation.mutate(assignment.id);
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty-state">No vehicle assignments found</div>
      )}

      <Modal isOpen={showAssignModal} onClose={() => { setShowAssignModal(false); resetForm(); }} title="Assign Vehicle">
        <form onSubmit={handleAssignSubmit}>
          <div className="form-group">
            <label>Route <span className="required">*</span></label>
            <select
              value={formData.route_id}
              onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
              required
            >
              <option value="">Select Route</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.title} (${Number(route.fare).toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Vehicle <span className="required">*</span></label>
            <select
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              required
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicle_no} {vehicle.vehicle_model ? `- ${vehicle.vehicle_model}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowAssignModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>Assign</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Transport;

