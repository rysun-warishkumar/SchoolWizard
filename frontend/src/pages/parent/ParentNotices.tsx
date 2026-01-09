import { useState } from 'react';
import { useQuery } from 'react-query';
import { communicateService } from '../../services/api/communicateService';
import './ParentNotices.css';

const ParentNotices = () => {
  const [selectedNotice, setSelectedNotice] = useState<any>(null);

  const { data: notices = [], isLoading } = useQuery(
    'parent-notices',
    () =>
      communicateService.getNotices({
        message_to: 'guardians' as any,
      }),
    { refetchOnWindowFocus: false }
  );

  // Sort notices by publish_date (most recent first)
  const sortedNotices = [...notices].sort((a, b) => {
    return new Date(b.publish_date).getTime() - new Date(a.publish_date).getTime();
  });

  if (isLoading) {
    return <div className="loading">Loading notices...</div>;
  }

  return (
    <div className="parent-notices-page">
      <div className="notices-header">
        <h1>Notice Board</h1>
      </div>

      <div className="notices-content">
        {sortedNotices.length === 0 ? (
          <div className="empty-state">No notices available</div>
        ) : (
          <div className="notices-list">
            {sortedNotices.map((notice) => (
              <div
                key={notice.id}
                className="notice-card"
                onClick={() => setSelectedNotice(notice)}
              >
                <div className="notice-header">
                  <h3>{notice.message_title}</h3>
                  <span className="notice-date">
                    {new Date(notice.publish_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="notice-preview">
                  {notice.message.length > 150
                    ? `${notice.message.substring(0, 150)}...`
                    : notice.message}
                </p>
                {notice.created_by_name && (
                  <p className="notice-author">By: {notice.created_by_name}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedNotice && (
        <div className="modal-overlay" onClick={() => setSelectedNotice(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedNotice.message_title}</h2>
              <button className="modal-close" onClick={() => setSelectedNotice(null)}>
                ×
              </button>
            </div>
            <div className="notice-details">
              <div className="notice-meta">
                <span>
                  Date: {new Date(selectedNotice.publish_date).toLocaleDateString()}
                </span>
                {selectedNotice.created_by_name && (
                  <span>By: {selectedNotice.created_by_name}</span>
                )}
              </div>
              <div className="notice-message">{selectedNotice.message}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentNotices;

