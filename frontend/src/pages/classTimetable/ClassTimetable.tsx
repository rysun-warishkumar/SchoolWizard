import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { academicsService, TimetableEntry, Class, Section, Subject } from '../../services/api/academicsService';
import { hrService } from '../../services/api/hrService';
import { profileService } from '../../services/api/profileService';
import './ClassTimetable.css';

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const ClassTimetable: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: permsData } = useQuery('user-permissions', () => profileService.getUserPermissions());
  const userPermissions = permsData?.data || {};
  const modulePerms: string[] = userPermissions['academics'] || [];
  const canAdd = modulePerms.includes('add');
  const canEdit = modulePerms.includes('edit');

  const { data: classesData } = useQuery('classes', () => academicsService.getClasses());
  const classes: Class[] = classesData?.data || [];

  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const { data: sectionsData } = useQuery(['sections', selectedClassId], () => academicsService.getSections(selectedClassId || undefined), { enabled: !!selectedClassId });
  const sections: Section[] = sectionsData?.data || [];

  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  const { data: timetableData, isLoading, refetch } = useQuery(
    ['class-timetable', selectedClassId, selectedSectionId],
    () => {
      if (!selectedClassId || !selectedSectionId) return Promise.resolve({ success: true, data: [] as TimetableEntry[] });
      return academicsService.getTimetable({ class_id: Number(selectedClassId), section_id: Number(selectedSectionId) });
    },
    { enabled: !!selectedClassId && !!selectedSectionId }
  );

  const timetable: TimetableEntry[] = timetableData?.data || [];

  const { data: subjectsData } = useQuery('subjects', () => academicsService.getSubjects());
  const subjects: Subject[] = subjectsData?.data || [];

  const { data: staffData } = useQuery('staff-list', () => hrService.getStaff({}), { staleTime: 5 * 60 * 1000 });
  const staff = staffData?.data || [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<TimetableEntry> | null>(null);

  const createMutation = useMutation(academicsService.createTimetableEntry, {
    onSuccess: () => { queryClient.invalidateQueries(['class-timetable']); refetch(); setShowForm(false); },
  });

  const updateMutation = useMutation(({ id, data }: { id: string; data: Partial<TimetableEntry> }) => academicsService.updateTimetableEntry(id, data), {
    onSuccess: () => { queryClient.invalidateQueries(['class-timetable']); refetch(); setShowForm(false); setEditing(null); },
  });

  const grouped = useMemo(() => {
    const g: Record<string, TimetableEntry[]> = {};
    daysOfWeek.forEach((d) => { g[d] = timetable.filter((t) => t.day_of_week === d); });
    return g;
  }, [timetable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedSectionId) {
      alert('Please select class and section first');
      return;
    }
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const payload: Partial<TimetableEntry> = {
      class_id: Number(selectedClassId),
      section_id: Number(selectedSectionId),
      subject_id: Number(formData.get('subject_id')) || undefined,
      teacher_id: Number(formData.get('teacher_id')) || undefined,
      day_of_week: String(formData.get('day_of_week')) as any,
      time_from: String(formData.get('time_from')),
      time_to: String(formData.get('time_to')),
      room_no: String(formData.get('room_no')) || undefined,
    };

    if (editing && editing.id) {
      updateMutation.mutate({ id: String(editing.id), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="class-timetable-page">
      <div className="page-header">
        <h1>Class Timetable</h1>
        <div className="actions">
          {canAdd && (
            <button className="btn-primary" onClick={() => { setShowForm((s) => !s); setEditing(null); }}>
              {showForm ? 'Close' : 'Add/Edit Timetable'}
            </button>
          )}
        </div>
      </div>

      <div className="filters-section">
        <select value={selectedClassId ?? ''} onChange={(e) => { setSelectedClassId(e.target.value ? Number(e.target.value) : null); setSelectedSectionId(null); }}>
          <option value="">Select Class</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={selectedSectionId ?? ''} onChange={(e) => setSelectedSectionId(e.target.value ? Number(e.target.value) : null)} disabled={!selectedClassId}>
          <option value="">Select Section</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <button className="btn-secondary" onClick={() => refetch()} disabled={!selectedClassId || !selectedSectionId}>View Timetable</button>
      </div>

      {isLoading ? (
        <div className="loading">Loading timetable...</div>
      ) : (!selectedClassId || !selectedSectionId) ? (
        <div className="empty-state">Please select class and section to view timetable.</div>
      ) : timetable.length === 0 ? (
        <div className="empty-state">No timetable entries found for selected class/section.</div>
      ) : (
        <div className="timetable-grid">
          {daysOfWeek.map((day) => (
            <div className="timetable-day" key={day}>
              <h3 className="day-title">{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
              <div className="day-entries">
                {grouped[day].sort((a,b)=> (a.time_from||'').localeCompare(b.time_from||'')).map((entry) => (
                  <div className="timetable-entry" key={entry.id}>
                    <div className="entry-time">{entry.time_from} - {entry.time_to}</div>
                    <div className="entry-subject">{entry.subject_name || entry.subject_id}</div>
                    <div className="entry-teacher">{entry.teacher_name || (staff.find(s=>s.id===entry.teacher_id)?.first_name ?? '')}</div>
                    {canEdit && (
                      <div className="entry-actions">
                        <button className="btn-secondary small" onClick={() => { setEditing(entry); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="timetable-form-wrapper">
          <form className="timetable-form" onSubmit={handleSubmit}>
            <h3>{editing ? 'Edit Timetable Entry' : 'Add Timetable Entry'}</h3>
            <div className="form-row">
              <label>Day</label>
              <select name="day_of_week" defaultValue={editing?.day_of_week || 'monday'}>
                {daysOfWeek.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase()+d.slice(1)}</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>Subject</label>
              <select name="subject_id" defaultValue={editing?.subject_id ?? ''} required>
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>Teacher</label>
              <select name="teacher_id" defaultValue={editing?.teacher_id ?? ''}>
                <option value="">Select Teacher</option>
                {staff.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name || ''}</option>)}
              </select>
            </div>

            <div className="form-row">
              <label>From</label>
              <input type="time" name="time_from" defaultValue={editing?.time_from ?? ''} required />
            </div>

            <div className="form-row">
              <label>To</label>
              <input type="time" name="time_to" defaultValue={editing?.time_to ?? ''} required />
            </div>

            <div className="form-row">
              <label>Room</label>
              <input type="text" name="room_no" defaultValue={editing?.room_no ?? ''} />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={createMutation.isLoading || updateMutation.isLoading}>{createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : 'Save'}</button>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ClassTimetable;
