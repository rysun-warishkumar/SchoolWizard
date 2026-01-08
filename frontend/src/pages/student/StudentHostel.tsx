import React from 'react';
import { useQuery } from 'react-query';
import { hostelService } from '../../services/api/hostelService';
import { studentsService } from '../../services/api/studentsService';
import './StudentHostel.css';

const StudentHostel = () => {
  const { data: student } = useQuery('my-student-profile', () => studentsService.getMyProfile(), {
    refetchOnWindowFocus: false,
  });

  const { data: hostels = [] } = useQuery(
    'hostels',
    () => hostelService.getHostels(),
    { refetchOnWindowFocus: false }
  );

  const { data: rooms = [], isLoading } = useQuery(
    'hostel-rooms',
    () => hostelService.getHostelRooms(),
    { refetchOnWindowFocus: false }
  );

  // Find student's assigned hostel room
  const studentRoom = student?.hostel_room_id
    ? rooms.find((r) => r.id === student.hostel_room_id)
    : null;

  const studentHostel = studentRoom
    ? hostels.find((h) => h.id === studentRoom.hostel_id)
    : null;

  if (isLoading) {
    return <div className="loading">Loading hostel information...</div>;
  }

  return (
    <div className="student-hostel-page">
      <div className="hostel-header">
        <h1>Hostel Rooms</h1>
      </div>

      {studentRoom && studentHostel ? (
        <div className="hostel-content">
          <div className="assigned-room-card">
            <h2>My Assigned Room</h2>
            <div className="room-details">
              <div className="detail-item">
                <label>Hostel Name:</label>
                <span>{studentHostel.name}</span>
              </div>
              <div className="detail-item">
                <label>Room Number:</label>
                <span>{studentRoom.room_no}</span>
              </div>
              <div className="detail-item">
                <label>Room Type:</label>
                <span>{studentRoom.room_type_name || '-'}</span>
              </div>
              <div className="detail-item">
                <label>Number of Beds:</label>
                <span>{studentRoom.no_of_bed}</span>
              </div>
              <div className="detail-item">
                <label>Cost per Bed:</label>
                <span>₹{parseFloat(studentRoom.cost_per_bed?.toString() || '0').toFixed(2)}</span>
              </div>
              {studentRoom.description && (
                <div className="detail-item full-width">
                  <label>Description:</label>
                  <span>{studentRoom.description}</span>
                </div>
              )}
              {studentHostel.address && (
                <div className="detail-item full-width">
                  <label>Hostel Address:</label>
                  <span>{studentHostel.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="hostel-content">
          <div className="no-room-message">
            <p>You are not assigned to any hostel room.</p>
          </div>
        </div>
      )}

      <div className="hostel-content">
        <h2>All Available Hostels</h2>
        {hostels.length === 0 ? (
          <div className="empty-state">No hostels available</div>
        ) : (
          <div className="hostels-list">
            {hostels.map((hostel) => {
              const hostelRooms = rooms.filter((r) => r.hostel_id === hostel.id);
              return (
                <div key={hostel.id} className="hostel-card">
                  <h3>{hostel.name}</h3>
                  <p className="hostel-type">Type: {hostel.type}</p>
                  {hostel.address && <p className="hostel-address">{hostel.address}</p>}
                  <p className="hostel-intake">Intake: {hostel.intake} students</p>
                  {hostel.description && (
                    <p className="hostel-description">{hostel.description}</p>
                  )}
                  {hostelRooms.length > 0 && (
                    <div className="rooms-summary">
                      <p>Available Rooms: {hostelRooms.length}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHostel;

