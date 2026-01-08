import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { transportService } from '../../services/api/transportService';
import { studentsService } from '../../services/api/studentsService';
import ChildSelector from '../../components/parent/ChildSelector';
import './ParentTransport.css';

const ParentTransport = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const { data: childrenData } = useQuery('my-children', () => studentsService.getMyChildren(), {
    refetchOnWindowFocus: false,
  });

  const children = childrenData?.data || [];

  React.useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  const { data: routes = [], isLoading: routesLoading } = useQuery(
    'parent-transport-routes',
    () => transportService.getRoutes(),
    { refetchOnWindowFocus: false }
  );

  const { data: vehicles = [] } = useQuery(
    'parent-transport-vehicles',
    () => transportService.getVehicles(),
    { refetchOnWindowFocus: false }
  );

  const { data: assignments = [] } = useQuery(
    'parent-transport-assignments',
    () => transportService.getVehicleAssignments(),
    { refetchOnWindowFocus: false }
  );

  // Find selected child's assigned route
  const studentRoute = selectedChild?.transport_route_id
    ? routes.find((r) => r.id === selectedChild.transport_route_id)
    : null;

  const studentVehicle = studentRoute
    ? assignments.find((a) => a.route_id === studentRoute.id)
    : null;

  const vehicleDetails = studentVehicle
    ? vehicles.find((v) => v.id === studentVehicle.vehicle_id)
    : null;

  if (children.length === 0) {
    return <div className="empty-state">No children found</div>;
  }

  return (
    <div className="parent-transport-page">
      <div className="transport-header">
        <h1>Transport Routes</h1>
        <p className="page-subtitle">View transport information for your child</p>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      {selectedChild && (
        <>
          {studentRoute ? (
            <div className="transport-content">
              <div className="assigned-route-card">
                <h2>Assigned Route</h2>
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
                <p>Your child is not assigned to any transport route.</p>
              </div>
            </div>
          )}

          <div className="transport-content">
            <h2>All Available Routes</h2>
            {routesLoading ? (
              <div className="loading">Loading routes...</div>
            ) : routes.length === 0 ? (
              <div className="empty-state">No transport routes available</div>
            ) : (
              <div className="routes-list">
                {routes.map((route) => (
                  <div key={route.id} className="route-card">
                    <h3>{route.title}</h3>
                    <p className="route-fare">Fare: ₹{parseFloat(route.fare?.toString() || '0').toFixed(2)}</p>
                    {route.description && <p className="route-description">{route.description}</p>}
                    {route.id === selectedChild?.transport_route_id && (
                      <span className="assigned-badge">Assigned</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ParentTransport;

