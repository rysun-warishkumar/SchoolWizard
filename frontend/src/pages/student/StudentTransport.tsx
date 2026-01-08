import React from 'react';
import { useQuery } from 'react-query';
import { transportService } from '../../services/api/transportService';
import { studentsService } from '../../services/api/studentsService';
import './StudentTransport.css';

const StudentTransport = () => {
  const { data: student } = useQuery('my-student-profile', () => studentsService.getMyProfile(), {
    refetchOnWindowFocus: false,
  });

  const { data: routes = [], isLoading } = useQuery(
    'transport-routes',
    () => transportService.getRoutes(),
    { refetchOnWindowFocus: false }
  );

  const { data: vehicles = [] } = useQuery(
    'transport-vehicles',
    () => transportService.getVehicles(),
    { refetchOnWindowFocus: false }
  );

  const { data: assignments = [] } = useQuery(
    'transport-assignments',
    () => transportService.getVehicleAssignments(),
    { refetchOnWindowFocus: false }
  );

  // Find student's assigned route
  const studentRoute = student?.transport_route_id
    ? routes.find((r) => r.id === student.transport_route_id)
    : null;

  const studentVehicle = studentRoute
    ? assignments.find((a) => a.route_id === studentRoute.id)
    : null;

  const vehicleDetails = studentVehicle
    ? vehicles.find((v) => v.id === studentVehicle.vehicle_id)
    : null;

  if (isLoading) {
    return <div className="loading">Loading transport information...</div>;
  }

  return (
    <div className="student-transport-page">
      <div className="transport-header">
        <h1>Transport Routes</h1>
      </div>

      {studentRoute ? (
        <div className="transport-content">
          <div className="assigned-route-card">
            <h2>My Assigned Route</h2>
            <div className="route-details">
              <div className="detail-item">
                <label>Route Title:</label>
                <span>{studentRoute.title}</span>
              </div>
              <div className="detail-item">
                <label>Fare:</label>
                <span>₹{parseFloat(studentRoute.fare?.toString() || '0').toFixed(2)}</span>
              </div>
              {studentRoute.description && (
                <div className="detail-item full-width">
                  <label>Description:</label>
                  <span>{studentRoute.description}</span>
                </div>
              )}
              {vehicleDetails && (
                <>
                  <div className="detail-item">
                    <label>Vehicle Number:</label>
                    <span>{vehicleDetails.vehicle_no}</span>
                  </div>
                  {vehicleDetails.vehicle_model && (
                    <div className="detail-item">
                      <label>Vehicle Model:</label>
                      <span>{vehicleDetails.vehicle_model}</span>
                    </div>
                  )}
                  {vehicleDetails.driver_name && (
                    <div className="detail-item">
                      <label>Driver Name:</label>
                      <span>{vehicleDetails.driver_name}</span>
                    </div>
                  )}
                  {vehicleDetails.driver_contact && (
                    <div className="detail-item">
                      <label>Driver Contact:</label>
                      <span>{vehicleDetails.driver_contact}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="transport-content">
          <div className="no-route-message">
            <p>You are not assigned to any transport route.</p>
          </div>
        </div>
      )}

      <div className="transport-content">
        <h2>All Available Routes</h2>
        {routes.length === 0 ? (
          <div className="empty-state">No transport routes available</div>
        ) : (
          <div className="routes-list">
            {routes.map((route) => (
              <div key={route.id} className="route-card">
                <h3>{route.title}</h3>
                <p className="route-fare">Fare: ₹{parseFloat(route.fare?.toString() || '0').toFixed(2)}</p>
                {route.description && <p className="route-description">{route.description}</p>}
                {route.id === student?.transport_route_id && (
                  <span className="assigned-badge">Assigned to You</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentTransport;

