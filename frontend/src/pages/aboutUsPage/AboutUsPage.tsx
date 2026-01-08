import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { aboutUsPageService, MissionVision, Counter, History, CoreValue, Achievement, Leader } from '../../services/api/aboutUsPageService';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import './AboutUsPage.css';

type TabType = 'mission-vision' | 'counters' | 'history' | 'values' | 'achievements' | 'leadership';

const AboutUsPage: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('mission-vision');

  // Mission & Vision
  const { data: missionVision, isLoading: mvLoading } = useQuery('about-us-mission-vision', aboutUsPageService.getMissionVision);
  const [mvForm, setMvForm] = useState({ mission_content: '', vision_content: '' });

  useEffect(() => {
    if (missionVision) {
      setMvForm({
        mission_content: missionVision.mission_content || '',
        vision_content: missionVision.vision_content || '',
      });
    }
  }, [missionVision]);

  const updateMvMutation = useMutation(aboutUsPageService.updateMissionVision, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-mission-vision');
      showToast('Mission & Vision updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update Mission & Vision', 'error');
    },
  });

  // Counters
  const { data: counters = [], isLoading: countersLoading } = useQuery('about-us-counters', aboutUsPageService.getCounters);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
  const [counterForm, setCounterForm] = useState({ counter_number: '', counter_label: '', sort_order: 0, is_active: true });

  const createCounterMutation = useMutation(aboutUsPageService.createCounter, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-counters');
      showToast('Counter created successfully', 'success');
      setShowCounterModal(false);
      resetCounterForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create counter', 'error');
    },
  });

  const updateCounterMutation = useMutation(({ id, data }: { id: number; data: Partial<Counter> }) => aboutUsPageService.updateCounter(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-counters');
      showToast('Counter updated successfully', 'success');
      setShowCounterModal(false);
      resetCounterForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update counter', 'error');
    },
  });

  const deleteCounterMutation = useMutation(aboutUsPageService.deleteCounter, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-counters');
      showToast('Counter deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete counter', 'error');
    },
  });

  const resetCounterForm = () => {
    setCounterForm({ counter_number: '', counter_label: '', sort_order: 0, is_active: true });
    setEditingCounter(null);
  };

  const handleEditCounter = (counter: Counter) => {
    setEditingCounter(counter);
    setCounterForm({
      counter_number: counter.counter_number,
      counter_label: counter.counter_label,
      sort_order: counter.sort_order,
      is_active: counter.is_active,
    });
    setShowCounterModal(true);
  };

  // History
  const { data: history, isLoading: historyLoading } = useQuery('about-us-history', aboutUsPageService.getHistory);
  const [historyForm, setHistoryForm] = useState({ history_content: '' });
  const [historyImageFile, setHistoryImageFile] = useState<File | null>(null);
  const [historyImagePreview, setHistoryImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (history) {
      setHistoryForm({ history_content: history.history_content || '' });
      if (history.history_image) {
        const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
        setHistoryImagePreview(`${apiBase}${history.history_image}`);
      }
    }
  }, [history]);

  const updateHistoryMutation = useMutation(
    ({ data, imageFile }: { data: { history_content: string; history_image?: string | null }; imageFile?: File | null }) =>
      aboutUsPageService.updateHistory(data, imageFile || undefined),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('about-us-history');
        showToast('History updated successfully', 'success');
        setHistoryImageFile(null);
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update history', 'error');
      },
    }
  );

  // Core Values
  const { data: values = [], isLoading: valuesLoading } = useQuery('about-us-values', aboutUsPageService.getValues);
  const [showValueModal, setShowValueModal] = useState(false);
  const [editingValue, setEditingValue] = useState<CoreValue | null>(null);
  const [valueForm, setValueForm] = useState({ icon_class: 'fas fa-star', title: '', description: '', sort_order: 0, is_active: true });

  const createValueMutation = useMutation(aboutUsPageService.createValue, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-values');
      showToast('Core Value created successfully', 'success');
      setShowValueModal(false);
      resetValueForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create core value', 'error');
    },
  });

  const updateValueMutation = useMutation(({ id, data }: { id: number; data: Partial<CoreValue> }) => aboutUsPageService.updateValue(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-values');
      showToast('Core Value updated successfully', 'success');
      setShowValueModal(false);
      resetValueForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update core value', 'error');
    },
  });

  const deleteValueMutation = useMutation(aboutUsPageService.deleteValue, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-values');
      showToast('Core Value deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete core value', 'error');
    },
  });

  const resetValueForm = () => {
    setValueForm({ icon_class: 'fas fa-star', title: '', description: '', sort_order: 0, is_active: true });
    setEditingValue(null);
  };

  const handleEditValue = (value: CoreValue) => {
    setEditingValue(value);
    setValueForm({
      icon_class: value.icon_class,
      title: value.title,
      description: value.description,
      sort_order: value.sort_order,
      is_active: value.is_active,
    });
    setShowValueModal(true);
  };

  // Achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery('about-us-achievements', aboutUsPageService.getAchievements);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [achievementForm, setAchievementForm] = useState({ achievement_year: '', achievement_title: '', achievement_description: '', sort_order: 0, is_active: true });

  const createAchievementMutation = useMutation(aboutUsPageService.createAchievement, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-achievements');
      showToast('Achievement created successfully', 'success');
      setShowAchievementModal(false);
      resetAchievementForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to create achievement', 'error');
    },
  });

  const updateAchievementMutation = useMutation(({ id, data }: { id: number; data: Partial<Achievement> }) => aboutUsPageService.updateAchievement(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-achievements');
      showToast('Achievement updated successfully', 'success');
      setShowAchievementModal(false);
      resetAchievementForm();
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to update achievement', 'error');
    },
  });

  const deleteAchievementMutation = useMutation(aboutUsPageService.deleteAchievement, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-achievements');
      showToast('Achievement deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete achievement', 'error');
    },
  });

  const resetAchievementForm = () => {
    setAchievementForm({ achievement_year: '', achievement_title: '', achievement_description: '', sort_order: 0, is_active: true });
    setEditingAchievement(null);
  };

  const handleEditAchievement = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setAchievementForm({
      achievement_year: achievement.achievement_year,
      achievement_title: achievement.achievement_title,
      achievement_description: achievement.achievement_description,
      sort_order: achievement.sort_order,
      is_active: achievement.is_active,
    });
    setShowAchievementModal(true);
  };

  // Leadership
  const { data: leadership = [], isLoading: leadershipLoading } = useQuery('about-us-leadership', aboutUsPageService.getLeadership);
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [leaderForm, setLeaderForm] = useState({ leader_name: '', leader_role: '', leader_bio: '', sort_order: 0, is_active: true });
  const [leaderImageFile, setLeaderImageFile] = useState<File | null>(null);
  const [leaderImagePreview, setLeaderImagePreview] = useState<string | null>(null);

  const createLeaderMutation = useMutation(
    ({ data, imageFile }: { data: Partial<Leader>; imageFile?: File | null }) => aboutUsPageService.createLeader(data, imageFile || undefined),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('about-us-leadership');
        showToast('Leader created successfully', 'success');
        setShowLeaderModal(false);
        resetLeaderForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to create leader', 'error');
      },
    }
  );

  const updateLeaderMutation = useMutation(
    ({ id, data, imageFile }: { id: number; data: Partial<Leader>; imageFile?: File | null }) =>
      aboutUsPageService.updateLeader(id, data, imageFile || undefined),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('about-us-leadership');
        showToast('Leader updated successfully', 'success');
        setShowLeaderModal(false);
        resetLeaderForm();
      },
      onError: (error: any) => {
        showToast(error.response?.data?.message || 'Failed to update leader', 'error');
      },
    }
  );

  const deleteLeaderMutation = useMutation(aboutUsPageService.deleteLeader, {
    onSuccess: () => {
      queryClient.invalidateQueries('about-us-leadership');
      showToast('Leader deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to delete leader', 'error');
    },
  });

  const resetLeaderForm = () => {
    setLeaderForm({ leader_name: '', leader_role: '', leader_bio: '', sort_order: 0, is_active: true });
    setLeaderImageFile(null);
    setLeaderImagePreview(null);
    setEditingLeader(null);
  };

  const handleEditLeader = (leader: Leader) => {
    setEditingLeader(leader);
    setLeaderForm({
      leader_name: leader.leader_name,
      leader_role: leader.leader_role,
      leader_bio: leader.leader_bio,
      sort_order: leader.sort_order,
      is_active: leader.is_active,
    });
    if (leader.leader_image) {
      const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
      setLeaderImagePreview(`${apiBase}${leader.leader_image}`);
    }
    setShowLeaderModal(true);
  };

  const getImageUrl = (path?: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';
    return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  };

  return (
    <div className="about-us-page-admin">
      <div className="page-header">
        <h1>About Us Page Management</h1>
        <p>Configure content for the About Us page on your school website</p>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'mission-vision' ? 'active' : ''}`} onClick={() => setActiveTab('mission-vision')}>
          Mission & Vision
        </button>
        <button className={`tab ${activeTab === 'counters' ? 'active' : ''}`} onClick={() => setActiveTab('counters')}>
          Counters
        </button>
        <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          History
        </button>
        <button className={`tab ${activeTab === 'values' ? 'active' : ''}`} onClick={() => setActiveTab('values')}>
          Core Values
        </button>
        <button className={`tab ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}>
          Achievements
        </button>
        <button className={`tab ${activeTab === 'leadership' ? 'active' : ''}`} onClick={() => setActiveTab('leadership')}>
          Leadership
        </button>
      </div>

      <div className="tab-content">
        {/* Mission & Vision Tab */}
        {activeTab === 'mission-vision' && (
          <div className="tab-panel">
            <h2>Mission & Vision</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMvMutation.mutate(mvForm);
              }}
            >
              <div className="form-group">
                <label>Mission Content *</label>
                <textarea
                  rows={6}
                  value={mvForm.mission_content}
                  onChange={(e) => setMvForm({ ...mvForm, mission_content: e.target.value })}
                  required
                  placeholder="Enter mission content..."
                />
              </div>
              <div className="form-group">
                <label>Vision Content *</label>
                <textarea
                  rows={6}
                  value={mvForm.vision_content}
                  onChange={(e) => setMvForm({ ...mvForm, vision_content: e.target.value })}
                  required
                  placeholder="Enter vision content..."
                />
              </div>
              <button type="submit" className="btn-primary" disabled={updateMvMutation.isLoading}>
                {updateMvMutation.isLoading ? 'Saving...' : 'Save Mission & Vision'}
              </button>
            </form>
          </div>
        )}

        {/* Counters Tab */}
        {activeTab === 'counters' && (
          <div className="tab-panel">
            <div className="section-header">
              <h2>Counters / Statistics</h2>
              <button className="btn-primary" onClick={() => { resetCounterForm(); setShowCounterModal(true); }}>
                <i className="fas fa-plus"></i> Add Counter
              </button>
            </div>
            {countersLoading ? (
              <div className="loading">Loading counters...</div>
            ) : counters.length === 0 ? (
              <div className="empty-state">No counters added yet. Click "Add Counter" to create one.</div>
            ) : (
              <div className="items-grid">
                {counters.map((counter) => (
                  <div key={counter.id} className="item-card">
                    <div className="item-content">
                      <h3>{counter.counter_number}</h3>
                      <p>{counter.counter_label}</p>
                      <span className={`badge ${counter.is_active ? 'active' : 'inactive'}`}>
                        {counter.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="item-actions">
                      <button className="btn-edit" onClick={() => handleEditCounter(counter)}>
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button className="btn-delete" onClick={() => deleteCounterMutation.mutate(counter.id!)}>
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="tab-panel">
            <h2>Our History</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateHistoryMutation.mutate({
                  data: { history_content: historyForm.history_content, history_image: history?.history_image },
                  imageFile: historyImageFile,
                });
              }}
            >
              <div className="form-group">
                <label>History Content *</label>
                <textarea
                  rows={10}
                  value={historyForm.history_content}
                  onChange={(e) => setHistoryForm({ history_content: e.target.value })}
                  required
                  placeholder="Enter history content..."
                />
              </div>
              <div className="form-group">
                <label>History Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setHistoryImageFile(file);
                      setHistoryImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {historyImagePreview && (
                  <div className="image-preview">
                    <img src={historyImagePreview} alt="History preview" />
                  </div>
                )}
                {!historyImagePreview && history?.history_image && (
                  <p>Current Image: <a href={getImageUrl(history.history_image)} target="_blank" rel="noopener noreferrer">View</a></p>
                )}
              </div>
              <button type="submit" className="btn-primary" disabled={updateHistoryMutation.isLoading}>
                {updateHistoryMutation.isLoading ? 'Saving...' : 'Save History'}
              </button>
            </form>
          </div>
        )}

        {/* Core Values Tab */}
        {activeTab === 'values' && (
          <div className="tab-panel">
            <div className="section-header">
              <h2>Core Values (Max 5 cards)</h2>
              <button
                className="btn-primary"
                onClick={() => { resetValueForm(); setShowValueModal(true); }}
                disabled={values.length >= 5}
              >
                <i className="fas fa-plus"></i> Add Core Value {values.length >= 5 && '(Max 5)'}
              </button>
            </div>
            {valuesLoading ? (
              <div className="loading">Loading core values...</div>
            ) : values.length === 0 ? (
              <div className="empty-state">No core values added yet. Click "Add Core Value" to create one.</div>
            ) : (
              <div className="items-grid">
                {values.map((value) => (
                  <div key={value.id} className="item-card">
                    <div className="item-content">
                      <i className={value.icon_class} style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
                      <h3>{value.title}</h3>
                      <p>{value.description}</p>
                      <span className={`badge ${value.is_active ? 'active' : 'inactive'}`}>
                        {value.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="item-actions">
                      <button className="btn-edit" onClick={() => handleEditValue(value)}>
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button className="btn-delete" onClick={() => deleteValueMutation.mutate(value.id!)}>
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="tab-panel">
            <div className="section-header">
              <h2>Achievements</h2>
              <button className="btn-primary" onClick={() => { resetAchievementForm(); setShowAchievementModal(true); }}>
                <i className="fas fa-plus"></i> Add Achievement
              </button>
            </div>
            {achievementsLoading ? (
              <div className="loading">Loading achievements...</div>
            ) : achievements.length === 0 ? (
              <div className="empty-state">No achievements added yet. Click "Add Achievement" to create one.</div>
            ) : (
              <div className="items-list">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="item-card">
                    <div className="item-content">
                      <div className="achievement-year">{achievement.achievement_year}</div>
                      <div>
                        <h3>{achievement.achievement_title}</h3>
                        <p>{achievement.achievement_description}</p>
                      </div>
                      <span className={`badge ${achievement.is_active ? 'active' : 'inactive'}`}>
                        {achievement.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="item-actions">
                      <button className="btn-edit" onClick={() => handleEditAchievement(achievement)}>
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button className="btn-delete" onClick={() => deleteAchievementMutation.mutate(achievement.id!)}>
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leadership Tab */}
        {activeTab === 'leadership' && (
          <div className="tab-panel">
            <div className="section-header">
              <h2>Leadership</h2>
              <button className="btn-primary" onClick={() => { resetLeaderForm(); setShowLeaderModal(true); }}>
                <i className="fas fa-plus"></i> Add Leader
              </button>
            </div>
            {leadershipLoading ? (
              <div className="loading">Loading leadership...</div>
            ) : leadership.length === 0 ? (
              <div className="empty-state">No leaders added yet. Click "Add Leader" to create one.</div>
            ) : (
              <div className="items-grid">
                {leadership.map((leader) => (
                  <div key={leader.id} className="item-card">
                    <div className="item-content">
                      {leader.leader_image && (
                        <img src={getImageUrl(leader.leader_image)} alt={leader.leader_name} className="leader-image" />
                      )}
                      <h3>{leader.leader_name}</h3>
                      <p className="leader-role">{leader.leader_role}</p>
                      <p>{leader.leader_bio}</p>
                      <span className={`badge ${leader.is_active ? 'active' : 'inactive'}`}>
                        {leader.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="item-actions">
                      <button className="btn-edit" onClick={() => handleEditLeader(leader)}>
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button className="btn-delete" onClick={() => deleteLeaderMutation.mutate(leader.id!)}>
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Counter Modal */}
      {showCounterModal && (
        <Modal
          isOpen={showCounterModal}
          title={editingCounter ? 'Edit Counter' : 'Add Counter'}
          onClose={() => { setShowCounterModal(false); resetCounterForm(); }}
          size="medium"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingCounter) {
                updateCounterMutation.mutate({ id: editingCounter.id!, data: counterForm });
              } else {
                createCounterMutation.mutate(counterForm);
              }
            }}
          >
            <div className="form-group">
              <label>Counter Number *</label>
              <input
                type="text"
                value={counterForm.counter_number}
                onChange={(e) => setCounterForm({ ...counterForm, counter_number: e.target.value })}
                required
                placeholder="e.g., 5000+"
              />
            </div>
            <div className="form-group">
              <label>Counter Label *</label>
              <input
                type="text"
                value={counterForm.counter_label}
                onChange={(e) => setCounterForm({ ...counterForm, counter_label: e.target.value })}
                required
                placeholder="e.g., Students"
              />
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                value={counterForm.sort_order}
                onChange={(e) => setCounterForm({ ...counterForm, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={counterForm.is_active}
                  onChange={(e) => setCounterForm({ ...counterForm, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowCounterModal(false); resetCounterForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createCounterMutation.isLoading || updateCounterMutation.isLoading}>
                {createCounterMutation.isLoading || updateCounterMutation.isLoading ? 'Saving...' : editingCounter ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Value Modal */}
      {showValueModal && (
        <Modal
          isOpen={showValueModal}
          title={editingValue ? 'Edit Core Value' : 'Add Core Value'}
          onClose={() => { setShowValueModal(false); resetValueForm(); }}
          size="medium"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingValue) {
                updateValueMutation.mutate({ id: editingValue.id!, data: valueForm });
              } else {
                createValueMutation.mutate(valueForm);
              }
            }}
          >
            <div className="form-group">
              <label>Icon Class *</label>
              <input
                type="text"
                value={valueForm.icon_class}
                onChange={(e) => setValueForm({ ...valueForm, icon_class: e.target.value })}
                required
                placeholder="e.g., fas fa-graduation-cap"
              />
              <small>Use Font Awesome icon classes (e.g., fas fa-heart, fas fa-users)</small>
            </div>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={valueForm.title}
                onChange={(e) => setValueForm({ ...valueForm, title: e.target.value })}
                required
                placeholder="e.g., Excellence"
              />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea
                rows={4}
                value={valueForm.description}
                onChange={(e) => setValueForm({ ...valueForm, description: e.target.value })}
                required
                placeholder="Enter description..."
              />
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                value={valueForm.sort_order}
                onChange={(e) => setValueForm({ ...valueForm, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={valueForm.is_active}
                  onChange={(e) => setValueForm({ ...valueForm, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowValueModal(false); resetValueForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createValueMutation.isLoading || updateValueMutation.isLoading}>
                {createValueMutation.isLoading || updateValueMutation.isLoading ? 'Saving...' : editingValue ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Achievement Modal */}
      {showAchievementModal && (
        <Modal
          isOpen={showAchievementModal}
          title={editingAchievement ? 'Edit Achievement' : 'Add Achievement'}
          onClose={() => { setShowAchievementModal(false); resetAchievementForm(); }}
          size="medium"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingAchievement) {
                updateAchievementMutation.mutate({ id: editingAchievement.id!, data: achievementForm });
              } else {
                createAchievementMutation.mutate(achievementForm);
              }
            }}
          >
            <div className="form-group">
              <label>Achievement Year *</label>
              <input
                type="text"
                value={achievementForm.achievement_year}
                onChange={(e) => setAchievementForm({ ...achievementForm, achievement_year: e.target.value })}
                required
                placeholder="e.g., 2024"
              />
            </div>
            <div className="form-group">
              <label>Achievement Title *</label>
              <input
                type="text"
                value={achievementForm.achievement_title}
                onChange={(e) => setAchievementForm({ ...achievementForm, achievement_title: e.target.value })}
                required
                placeholder="e.g., Best School Award"
              />
            </div>
            <div className="form-group">
              <label>Achievement Description *</label>
              <textarea
                rows={4}
                value={achievementForm.achievement_description}
                onChange={(e) => setAchievementForm({ ...achievementForm, achievement_description: e.target.value })}
                required
                placeholder="Enter achievement description..."
              />
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                value={achievementForm.sort_order}
                onChange={(e) => setAchievementForm({ ...achievementForm, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={achievementForm.is_active}
                  onChange={(e) => setAchievementForm({ ...achievementForm, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowAchievementModal(false); resetAchievementForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createAchievementMutation.isLoading || updateAchievementMutation.isLoading}>
                {createAchievementMutation.isLoading || updateAchievementMutation.isLoading ? 'Saving...' : editingAchievement ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Leader Modal */}
      {showLeaderModal && (
        <Modal
          isOpen={showLeaderModal}
          title={editingLeader ? 'Edit Leader' : 'Add Leader'}
          onClose={() => { setShowLeaderModal(false); resetLeaderForm(); }}
          size="large"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingLeader) {
                updateLeaderMutation.mutate({ id: editingLeader.id!, data: leaderForm, imageFile: leaderImageFile });
              } else {
                createLeaderMutation.mutate({ data: leaderForm, imageFile: leaderImageFile });
              }
            }}
          >
            <div className="form-group">
              <label>Leader Name *</label>
              <input
                type="text"
                value={leaderForm.leader_name}
                onChange={(e) => setLeaderForm({ ...leaderForm, leader_name: e.target.value })}
                required
                placeholder="e.g., Dr. John Smith"
              />
            </div>
            <div className="form-group">
              <label>Leader Role *</label>
              <input
                type="text"
                value={leaderForm.leader_role}
                onChange={(e) => setLeaderForm({ ...leaderForm, leader_role: e.target.value })}
                required
                placeholder="e.g., Principal"
              />
            </div>
            <div className="form-group">
              <label>Leader Bio *</label>
              <textarea
                rows={4}
                value={leaderForm.leader_bio}
                onChange={(e) => setLeaderForm({ ...leaderForm, leader_bio: e.target.value })}
                required
                placeholder="Enter leader biography..."
              />
            </div>
            <div className="form-group">
              <label>Leader Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLeaderImageFile(file);
                    setLeaderImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
              {leaderImagePreview && (
                <div className="image-preview">
                  <img src={leaderImagePreview} alt="Leader preview" />
                </div>
              )}
              {!leaderImagePreview && editingLeader?.leader_image && (
                <p>Current Image: <a href={getImageUrl(editingLeader.leader_image)} target="_blank" rel="noopener noreferrer">View</a></p>
              )}
            </div>
            <div className="form-group">
              <label>Sort Order</label>
              <input
                type="number"
                value={leaderForm.sort_order}
                onChange={(e) => setLeaderForm({ ...leaderForm, sort_order: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={leaderForm.is_active}
                  onChange={(e) => setLeaderForm({ ...leaderForm, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowLeaderModal(false); resetLeaderForm(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={createLeaderMutation.isLoading || updateLeaderMutation.isLoading}>
                {createLeaderMutation.isLoading || updateLeaderMutation.isLoading ? 'Saving...' : editingLeader ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AboutUsPage;

