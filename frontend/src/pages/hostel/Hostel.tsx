import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import {
  hostelService,
  Hostel as HostelType,
  RoomType,
  HostelRoom,
} from '../../services/api/hostelService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './Hostel.css';

type TabType = 'hostel' | 'room-type' | 'hostel-rooms';

const Hostel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType;
  const validTabs: TabType[] = ['hostel', 'room-type', 'hostel-rooms'];
  const defaultTab: TabType = validTabs.includes(tabFromUrl) ? tabFromUrl : 'hostel';

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="hostel-page">
      <div className="page-header">
        <h1>Hostel</h1>
      </div>

      <div className="hostel-tabs">
        <button
          className={activeTab === 'hostel' ? 'active' : ''}
          onClick={() => handleTabChange('hostel')}
        >
          Hostel
        </button>
        <button
          className={activeTab === 'room-type' ? 'active' : ''}
          onClick={() => handleTabChange('room-type')}
        >
          Room Type
        </button>
        <button
          className={activeTab === 'hostel-rooms' ? 'active' : ''}
          onClick={() => handleTabChange('hostel-rooms')}
        >
          Hostel Rooms
        </button>
      </div>

      <div className="hostel-content">
        {activeTab === 'hostel' && <HostelTab />}
        {activeTab === 'room-type' && <RoomTypeTab />}
        {activeTab === 'hostel-rooms' && <HostelRoomsTab />}
      </div>
    </div>
  );
};

// ========== Hostel Tab ==========

const HostelTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState<HostelType | null>(null);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: hostels = [], isLoading, refetch, error } = useQuery(
    'hostels',
    () => hostelService.getHostels(),
    { 
      refetchOnWindowFocus: true,
      retry: false,
      onError: (err: any) => {
        console.error('Error fetching hostels:', err);
      }
    }
  );

  const [formData, setFormData] = useState({
    name: '',
    type: 'mixed' as 'boys' | 'girls' | 'mixed',
    address: '',
    intake: '',
    description: '',
  });

  const createMutation = useMutation(hostelService.createHostel, {
    onSuccess: () => {
      queryClient.invalidateQueries('hostels');
      refetch();
      showToast('Hostel created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create hostel', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<HostelType> }) => hostelService.updateHostel(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hostels');
        refetch();
        showToast('Hostel updated successfully', 'success');
        setShowEditModal(false);
        setSelectedHostel(null);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update hostel', 'error');
      },
    }
  );

  const deleteMutation = useMutation(hostelService.deleteHostel, {
    onSuccess: () => {
      queryClient.invalidateQueries('hostels');
      refetch();
      showToast('Hostel deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete hostel', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'mixed',
      address: '',
      intake: '',
      description: '',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type) {
      showToast('Hostel name and type are required', 'error');
      return;
    }
    if (formData.intake && Number(formData.intake) < 0) {
      showToast('Intake must be a positive number', 'error');
      return;
    }
    createMutation.mutate({
      name: formData.name,
      type: formData.type,
      address: formData.address || undefined,
      intake: formData.intake ? Number(formData.intake) : 0,
      description: formData.description || undefined,
    });
  };

  const handleEdit = (hostel: HostelType) => {
    setSelectedHostel(hostel);
    setFormData({
      name: hostel.name,
      type: hostel.type,
      address: hostel.address || '',
      intake: hostel.intake.toString(),
      description: hostel.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostel || !formData.name || !formData.type) {
      showToast('Hostel name and type are required', 'error');
      return;
    }
    if (formData.intake && Number(formData.intake) < 0) {
      showToast('Intake must be a positive number', 'error');
      return;
    }
    updateMutation.mutate({
      id: selectedHostel.id,
      data: {
        name: formData.name,
        type: formData.type,
        address: formData.address || undefined,
        intake: formData.intake ? Number(formData.intake) : 0,
        description: formData.description || undefined,
      },
    });
  };

  return (
    <div className="hostel-tab-content">
      <div className="tab-header">
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Add Hostel
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="empty-state" style={{ color: 'var(--danger-color)' }}>
          Error loading hostels. Please ensure the database tables are created.
        </div>
      ) : hostels.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Address</th>
              <th>Intake</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hostels.map((hostel) => (
              <tr key={hostel.id}>
                <td>{hostel.name}</td>
                <td>
                  <span className="type-badge">{hostel.type}</span>
                </td>
                <td>{hostel.address || '-'}</td>
                <td>{hostel.intake}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm btn-secondary" onClick={() => handleEdit(hostel)}>Edit</button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this hostel?')) {
                          deleteMutation.mutate(hostel.id);
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
        <div className="empty-state">No hostels found</div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="Add Hostel" size="large">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>Hostel Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter hostel name"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type <span className="required">*</span></label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                required
              >
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Intake</label>
              <input
                type="number"
                min="0"
                value={formData.intake}
                onChange={(e) => setFormData({ ...formData, intake: e.target.value })}
                placeholder="Enter intake capacity"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              placeholder="Enter hostel address"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Enter description"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedHostel(null); resetForm(); }} title="Edit Hostel" size="large">
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-group">
            <label>Hostel Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type <span className="required">*</span></label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                required
              >
                <option value="boys">Boys</option>
                <option value="girls">Girls</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div className="form-group">
              <label>Intake</label>
              <input
                type="number"
                min="0"
                value={formData.intake}
                onChange={(e) => setFormData({ ...formData, intake: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
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
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedHostel(null); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Room Type Tab ==========

const RoomTypeTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: roomTypes = [], isLoading, refetch, error } = useQuery(
    'room-types',
    () => hostelService.getRoomTypes(),
    { 
      refetchOnWindowFocus: true,
      retry: false,
      onError: (err: any) => {
        console.error('Error fetching room types:', err);
      }
    }
  );

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const createMutation = useMutation(hostelService.createRoomType, {
    onSuccess: () => {
      queryClient.invalidateQueries('room-types');
      refetch();
      showToast('Room type created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create room type', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<RoomType> }) => hostelService.updateRoomType(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('room-types');
        refetch();
        showToast('Room type updated successfully', 'success');
        setShowEditModal(false);
        setSelectedRoomType(null);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update room type', 'error');
      },
    }
  );

  const deleteMutation = useMutation(hostelService.deleteRoomType, {
    onSuccess: () => {
      queryClient.invalidateQueries('room-types');
      refetch();
      showToast('Room type deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete room type', 'error');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '' });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('Room type name is required', 'error');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setFormData({
      name: roomType.name,
      description: roomType.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomType || !formData.name) {
      showToast('Room type name is required', 'error');
      return;
    }
    updateMutation.mutate({ id: selectedRoomType.id, data: formData });
  };

  return (
    <div className="hostel-tab-content">
      <div className="tab-header">
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Add Room Type
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="empty-state" style={{ color: 'var(--danger-color)' }}>
          Error loading room types. Please ensure the database tables are created.
        </div>
      ) : roomTypes.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roomTypes.map((roomType) => (
              <tr key={roomType.id}>
                <td>{roomType.name}</td>
                <td>{roomType.description || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm btn-secondary" onClick={() => handleEdit(roomType)}>Edit</button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this room type?')) {
                          deleteMutation.mutate(roomType.id);
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
        <div className="empty-state">No room types found</div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="Add Room Type">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label>Room Type Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter room type name"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Enter description"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedRoomType(null); resetForm(); }} title="Edit Room Type">
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-group">
            <label>Room Type Name <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedRoomType(null); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// ========== Hostel Rooms Tab ==========

const HostelRoomsTab = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<HostelRoom | null>(null);
  const [hostelFilter, setHostelFilter] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('');

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: hostels = [] } = useQuery('hostels', () => hostelService.getHostels());
  const { data: roomTypes = [] } = useQuery('room-types', () => hostelService.getRoomTypes());

  const { data: rooms = [], isLoading, refetch, error } = useQuery(
    ['hostel-rooms', hostelFilter, roomTypeFilter],
    () => hostelService.getHostelRooms({
      hostel_id: hostelFilter ? Number(hostelFilter) : undefined,
      room_type_id: roomTypeFilter ? Number(roomTypeFilter) : undefined,
    }),
    { 
      refetchOnWindowFocus: true,
      retry: false,
      onError: (err: any) => {
        console.error('Error fetching hostel rooms:', err);
      }
    }
  );

  const [formData, setFormData] = useState({
    hostel_id: '',
    room_type_id: '',
    room_no: '',
    no_of_bed: '1',
    cost_per_bed: '',
    description: '',
  });

  const createMutation = useMutation(hostelService.createHostelRoom, {
    onSuccess: () => {
      queryClient.invalidateQueries('hostel-rooms');
      refetch();
      showToast('Hostel room created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create room', 'error');
    },
  });

  const updateMutation = useMutation(
    (data: { id: number; data: Partial<HostelRoom> }) => hostelService.updateHostelRoom(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('hostel-rooms');
        refetch();
        showToast('Hostel room updated successfully', 'success');
        setShowEditModal(false);
        setSelectedRoom(null);
        resetForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update room', 'error');
      },
    }
  );

  const deleteMutation = useMutation(hostelService.deleteHostelRoom, {
    onSuccess: () => {
      queryClient.invalidateQueries('hostel-rooms');
      refetch();
      showToast('Hostel room deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete room', 'error');
    },
  });

  const resetForm = () => {
    setFormData({
      hostel_id: '',
      room_type_id: '',
      room_no: '',
      no_of_bed: '1',
      cost_per_bed: '',
      description: '',
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hostel_id || !formData.room_type_id || !formData.room_no || !formData.no_of_bed || formData.cost_per_bed === '') {
      showToast('All required fields must be filled', 'error');
      return;
    }
    if (Number(formData.no_of_bed) <= 0) {
      showToast('Number of beds must be greater than 0', 'error');
      return;
    }
    if (Number(formData.cost_per_bed) < 0) {
      showToast('Cost per bed must be a positive number', 'error');
      return;
    }
    createMutation.mutate({
      hostel_id: Number(formData.hostel_id),
      room_type_id: Number(formData.room_type_id),
      room_no: formData.room_no,
      no_of_bed: Number(formData.no_of_bed),
      cost_per_bed: Number(formData.cost_per_bed),
      description: formData.description || undefined,
    });
  };

  const handleEdit = (room: HostelRoom) => {
    setSelectedRoom(room);
    setFormData({
      hostel_id: room.hostel_id.toString(),
      room_type_id: room.room_type_id.toString(),
      room_no: room.room_no,
      no_of_bed: room.no_of_bed.toString(),
      cost_per_bed: Number(room.cost_per_bed).toString(),
      description: room.description || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !formData.hostel_id || !formData.room_type_id || !formData.room_no || !formData.no_of_bed || formData.cost_per_bed === '') {
      showToast('All required fields must be filled', 'error');
      return;
    }
    if (Number(formData.no_of_bed) <= 0) {
      showToast('Number of beds must be greater than 0', 'error');
      return;
    }
    if (Number(formData.cost_per_bed) < 0) {
      showToast('Cost per bed must be a positive number', 'error');
      return;
    }
    updateMutation.mutate({
      id: selectedRoom.id,
      data: {
        hostel_id: Number(formData.hostel_id),
        room_type_id: Number(formData.room_type_id),
        room_no: formData.room_no,
        no_of_bed: Number(formData.no_of_bed),
        cost_per_bed: Number(formData.cost_per_bed),
        description: formData.description || undefined,
      },
    });
  };

  return (
    <div className="hostel-tab-content">
      <div className="tab-header">
        <div className="filters-section">
          <select
            value={hostelFilter}
            onChange={(e) => setHostelFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Hostels</option>
            {hostels.map((hostel) => (
              <option key={hostel.id} value={hostel.id}>
                {hostel.name}
              </option>
            ))}
          </select>
          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Room Types</option>
            {roomTypes.map((roomType) => (
              <option key={roomType.id} value={roomType.id}>
                {roomType.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
          + Add Room
        </button>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="empty-state" style={{ color: 'var(--danger-color)' }}>
          Error loading rooms. Please ensure the database tables are created.
        </div>
      ) : rooms.length > 0 ? (
        <table className="data-table">
          <thead>
            <tr>
              <th>Hostel</th>
              <th>Room No</th>
              <th>Room Type</th>
              <th>No. of Beds</th>
              <th>Cost per Bed</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td>{room.hostel_name || '-'}</td>
                <td>{room.room_no}</td>
                <td>{room.room_type_name || '-'}</td>
                <td>{room.no_of_bed}</td>
                <td>${Number(room.cost_per_bed).toFixed(2)}</td>
                <td>{room.description || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-sm btn-secondary" onClick={() => handleEdit(room)}>Edit</button>
                    <button
                      className="btn-sm btn-danger"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this room?')) {
                          deleteMutation.mutate(room.id);
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
        <div className="empty-state">No rooms found</div>
      )}

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="Add Room" size="large">
        <form onSubmit={handleCreateSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Hostel <span className="required">*</span></label>
              <select
                value={formData.hostel_id}
                onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value })}
                required
              >
                <option value="">Select Hostel</option>
                {hostels.map((hostel) => (
                  <option key={hostel.id} value={hostel.id}>
                    {hostel.name} ({hostel.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Room Type <span className="required">*</span></label>
              <select
                value={formData.room_type_id}
                onChange={(e) => setFormData({ ...formData, room_type_id: e.target.value })}
                required
              >
                <option value="">Select Room Type</option>
                {roomTypes.map((roomType) => (
                  <option key={roomType.id} value={roomType.id}>
                    {roomType.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Room No <span className="required">*</span></label>
            <input
              type="text"
              value={formData.room_no}
              onChange={(e) => setFormData({ ...formData, room_no: e.target.value })}
              required
              placeholder="Enter room number"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>No. of Beds <span className="required">*</span></label>
              <input
                type="number"
                min="1"
                value={formData.no_of_bed}
                onChange={(e) => setFormData({ ...formData, no_of_bed: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Cost per Bed <span className="required">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_per_bed}
                onChange={(e) => setFormData({ ...formData, cost_per_bed: e.target.value })}
                required
                placeholder="Enter cost per bed"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Enter description"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={createMutation.isLoading}>Save</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedRoom(null); resetForm(); }} title="Edit Room" size="large">
        <form onSubmit={handleUpdateSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Hostel <span className="required">*</span></label>
              <select
                value={formData.hostel_id}
                onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value })}
                required
              >
                <option value="">Select Hostel</option>
                {hostels.map((hostel) => (
                  <option key={hostel.id} value={hostel.id}>
                    {hostel.name} ({hostel.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Room Type <span className="required">*</span></label>
              <select
                value={formData.room_type_id}
                onChange={(e) => setFormData({ ...formData, room_type_id: e.target.value })}
                required
              >
                <option value="">Select Room Type</option>
                {roomTypes.map((roomType) => (
                  <option key={roomType.id} value={roomType.id}>
                    {roomType.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Room No <span className="required">*</span></label>
            <input
              type="text"
              value={formData.room_no}
              onChange={(e) => setFormData({ ...formData, room_no: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>No. of Beds <span className="required">*</span></label>
              <input
                type="number"
                min="1"
                value={formData.no_of_bed}
                onChange={(e) => setFormData({ ...formData, no_of_bed: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Cost per Bed <span className="required">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_per_bed}
                onChange={(e) => setFormData({ ...formData, cost_per_bed: e.target.value })}
                required
              />
            </div>
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
            <button type="button" className="btn-secondary" onClick={() => { setShowEditModal(false); setSelectedRoom(null); resetForm(); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={updateMutation.isLoading}>Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Hostel;

