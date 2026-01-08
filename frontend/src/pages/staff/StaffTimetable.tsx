import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { hrService } from '../../services/api/hrService';
import './StaffTimetable.css';

const StaffTimetable = () => {
  const [selectedClass, setSelectedClass] = useState<{ class_id: number; section_id: number } | null>(null);

  const { data: classesData } = useQuery('my-classes', () => hrService.getMyClasses(), {
    refetchOnWindowFocus: false,
  });

  const { data: timetableData, isLoading } = useQuery(
    ['my-timetable', selectedClass],
    () => hrService.getMyTimetable(),
    { refetchOnWindowFocus: false }
  );

  const classes = classesData?.data || [];
  const allTimetable = timetableData?.data || [];

  // Filter timetable by selected class if any
  const timetable = selectedClass
    ? allTimetable.filter(
        (entry: any) => entry.class_id === selectedClass.class_id && entry.section_id === selectedClass.section_id
      )
    : allTimetable;

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Group timetable by day
  const timetableByDay = daysOfWeek.reduce((acc, day) => {
    acc[day] = timetable.filter((entry: any) => entry.day_of_week === day);
    return acc;
  }, {} as Record<string, typeof timetable>);

  // Get all unique time slots
  const timeSlots = Array.from(
    new Set(
      timetable.map((entry: any) => `${entry.time_from}-${entry.time_to}`).sort((a, b) => {
        const [aFrom] = a.split('-');
        const [bFrom] = b.split('-');
        return aFrom.localeCompare(bFrom);
      })
    )
  );

  // Auto-select first class if none selected and classes exist
  React.useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass({
        class_id: classes[0].class_id,
        section_id: classes[0].section_id,
      });
    }
  }, [classes, selectedClass]);

  if (isLoading) {
    return <div className="loading">Loading timetable...</div>;
  }

  return (
    <div className="staff-timetable-page">
      <div className="timetable-header">
        <h1>My Timetable</h1>
        {classes.length > 0 && (
          <div className="class-selector">
            <label>Filter by Class:</label>
            <select
              value={selectedClass ? `${selectedClass.class_id}-${selectedClass.section_id}` : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const [class_id, section_id] = e.target.value.split('-').map(Number);
                  setSelectedClass({ class_id, section_id });
                } else {
                  setSelectedClass(null);
                }
              }}
            >
              <option value="">All Classes</option>
              {classes.map((classItem: any) => (
                <option
                  key={`${classItem.class_id}-${classItem.section_id}`}
                  value={`${classItem.class_id}-${classItem.section_id}`}
                >
                  {classItem.class_name} - {classItem.section_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="timetable-container">
        {timetable.length === 0 ? (
          <div className="empty-state">No timetable entries found</div>
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
                        const entries = timetableByDay[day]?.filter(
                          (e: any) => `${e.time_from}-${e.time_to}` === timeSlot
                        );
                        return (
                          <td key={day} className="subject-cell">
                            {entries && entries.length > 0 ? (
                              <div className="timetable-entries">
                                {entries.map((entry: any, idx: number) => (
                                  <div key={idx} className="timetable-entry">
                                    <div className="subject-name">{entry.subject_name}</div>
                                    <div className="class-info">
                                      {entry.class_name} - {entry.section_name}
                                    </div>
                                    {entry.room_no && <div className="room-no">Room: {entry.room_no}</div>}
                                  </div>
                                ))}
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
    </div>
  );
};

export default StaffTimetable;

