import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { studentsService } from '../../../services/api/studentsService';

const DisableReasonsTab: React.FC = () => {
  const { data: reasonsData } = useQuery('disable-reasons', () => studentsService.getDisableReasons());
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '' });

  const createMutation = useMutation(studentsService.createDisableReason, {
    onSuccess: () => {
      queryClient.invalidateQueries('disable-reasons');
      setShowModal(false);
      setFormData({ name: '' });
    },
  });

  return (
    <div className="tab-content">
      <div className="section-header">
        <h3>Disable Reasons</h3>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Reason</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
            {reasonsData?.data.map((reason: any) => (
              <tr key={reason.id}>
                <td>{reason.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Disable Reason</h2>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(formData); }}>
              <div className="form-group">
                <label>Reason Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisableReasonsTab;
