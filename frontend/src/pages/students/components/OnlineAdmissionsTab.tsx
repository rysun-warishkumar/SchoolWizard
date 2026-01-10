import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { studentsService } from '../../../services/api/studentsService';
import { useToast } from '../../../contexts/ToastContext';

const OnlineAdmissionsTab: React.FC = () => {
  const { data: admissionsData, isLoading } = useQuery('online-admissions', () => studentsService.getOnlineAdmissions());
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const approveMutation = useMutation(studentsService.approveOnlineAdmission, {
    onSuccess: () => {
      queryClient.invalidateQueries('online-admissions');
      queryClient.invalidateQueries('students');
      showToast('Admission approved and student created!', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to approve admission', 'error');
    },
  });

  const rejectMutation = useMutation(studentsService.rejectOnlineAdmission, {
    onSuccess: () => {
      queryClient.invalidateQueries('online-admissions');
      showToast('Admission rejected!', 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to reject admission', 'error');
    },
  });

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Online Admissions</h3>
      </div>

      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admissionsData?.data.map((admission: any) => (
                <tr key={admission.id}>
                  <td>{admission.first_name} {admission.last_name || ''}</td>
                  <td>{admission.class_name || '-'}</td>
                  <td>{admission.phone || '-'}</td>
                  <td>{admission.email || '-'}</td>
                  <td>
                    <span className={`status-badge ${admission.status === 'approved' ? 'active' : admission.status === 'rejected' ? 'inactive' : 'pending'}`}>
                      {admission.status}
                    </span>
                  </td>
                  <td>{new Date(admission.created_at).toLocaleDateString()}</td>
                  <td>
                    {admission.status === 'pending' && (
                      <div className="action-buttons">
                        <button onClick={() => approveMutation.mutate(String(admission.id))} className="btn-edit">
                          Approve
                        </button>
                        <button onClick={() => rejectMutation.mutate(String(admission.id))} className="btn-delete">
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OnlineAdmissionsTab;
