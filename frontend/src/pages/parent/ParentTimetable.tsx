import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { academicsService } from '../../services/api/academicsService';
import { studentsService } from '../../services/api/studentsService';
import ChildSelector from '../../components/parent/ChildSelector';
import './ParentTimetable.css';

const ParentTimetable = () => {
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

  const { data: timetableData, isLoading } = useQuery(
    ['parent-timetable', selectedChild?.class_id, selectedChild?.section_id],
    () =>
      academicsService.getTimetable({
        class_id: selectedChild?.class_id || 0,
        section_id: selectedChild?.section_id || 0,
      }),
    { enabled: !!selectedChild?.class_id && !!selectedChild?.section_id, refetchOnWindowFocus: false }
  );

  const timetable = timetableData?.data || [];

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Group timetable by day
  const timetableByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = timetable.filter((entry) => entry.day_of_week === day);
    return acc;
  }, {} as Record<string, typeof timetable>);

  // Get all unique time slots
  const timeSlots = Array.from(
    new Set(
      timetable.map((entry) => `${entry.time_from}-${entry.time_to}`).sort((a, b) => {
        const [aFrom] = a.split('-');
        const [bFrom] = b.split('-');
        return aFrom.localeCompare(bFrom);
      })
    )
  );

  if (children.length === 0) {
    return <div className="empty-state">No children found</div>;
  }

  return (
    <div className="parent-timetable-page">
      <div className="timetable-header">
        <h1>Class Timetable</h1>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />

      {selectedChild && (
        <div className="timetable-container">
          {isLoading ? (
            <div className="loading">Loading timetable...</div>
          ) : timetable.length === 0 ? (
            <div className="empty-state">No timetable available</div>
          ) : (
            <div className="timetable-table-wrapper">
              <table className="timetable-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    {daysOfWeek.map((day) => (
                      <th key={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((timeSlot) => {
                    const [timeFrom, timeTo] = timeSlot.split('-');
                    return (
                      <tr key={timeSlot}>
                        <td className="time-cell">
                          <div className="time-from">{timeFrom}</div>
                          <div className="time-to">{timeTo}</div>
                        </td>
                        {daysOfWeek.map((day) => {
                          const entry = timetableByDay[day]?.find(
                            (e) => `${e.time_from}-${e.time_to}` === timeSlot
                          );
                          return (
                            <td key={day} className="subject-cell">
                              {entry ? (
                                <div className="timetable-entry">
                                  <div className="subject-name">{entry.subject_name}</div>
                                  {entry.teacher_name && (
                                    <div className="teacher-name">{entry.teacher_name}</div>
                                  )}
                                  {entry.room_no && (
                                    <div className="room-no">Room: {entry.room_no}</div>
                                  )}
                                </div>
                              ) : (
                                <div className="empty-slot">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParentTimetable;

