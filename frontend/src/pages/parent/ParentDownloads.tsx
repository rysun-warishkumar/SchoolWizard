import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { downloadCenterService } from '../../services/api/downloadCenterService';
import { studentsService } from '../../services/api/studentsService';
import ChildSelector from '../../components/parent/ChildSelector';
import './ParentDownloads.css';

const ParentDownloads = () => {
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [contentTypeFilter, setContentTypeFilter] = useState('');

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

  const { data: downloads = [], isLoading } = useQuery(
    ['parent-downloads', selectedChild?.class_id, selectedChild?.section_id, contentTypeFilter],
    () =>
      downloadCenterService.getDownloadContents({
        available_for: 'students',
        class_id: selectedChild?.class_id,
        section_id: selectedChild?.section_id,
        content_type: contentTypeFilter || undefined,
      }),
    { enabled: !!selectedChild?.class_id && !!selectedChild?.section_id, refetchOnWindowFocus: false }
  );

  const handleDownload = (download: any) => {
    const url = `${import.meta.env.VITE_API_BASE_URL}${download.file_path}`;
    window.open(url, '_blank');
  };

  if (children.length === 0) {
    return <div className="empty-state">No children found</div>;
  }

  return (
    <div className="parent-downloads-page">
      <div className="downloads-header">
        <h1>Download Center</h1>
        <div className="downloads-filters">
          <select value={contentTypeFilter} onChange={(e) => setContentTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="assignments">Assignments</option>
            <option value="study_material">Study Material</option>
            <option value="syllabus">Syllabus</option>
            <option value="other_downloads">Other Downloads</option>
          </select>
        </div>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      {selectedChild && (
        <div className="downloads-content">
          {isLoading ? (
            <div className="loading">Loading downloads...</div>
          ) : downloads.length === 0 ? (
            <div className="empty-state">No downloads available</div>
          ) : (
            <div className="downloads-grid">
              {downloads.map((download) => (
                <div key={download.id} className="download-card">
                  <div className="download-icon">
                    {download.content_type === 'assignments' && '📝'}
                    {download.content_type === 'study_material' && '📚'}
                    {download.content_type === 'syllabus' && '📋'}
                    {download.content_type === 'other_downloads' && '📄'}
                  </div>
                  <div className="download-info">
                    <h3>{download.content_title}</h3>
                    <p className="content-type">
                      {download.content_type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    {download.description && (
                      <p className="description">{download.description}</p>
                    )}
                    <div className="download-meta">
                      <span className="upload-date">
                        {new Date(download.upload_date).toLocaleDateString()}
                      </span>
                      {download.file_size && (
                        <span className="file-size">
                          {(download.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="btn-download" onClick={() => handleDownload(download)}>
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParentDownloads;

