import { useQuery } from 'react-query';
import { academicsService } from '../../services/api/academicsService';
import { studentsService } from '../../services/api/studentsService';
import './StudentTimetable.css';

const StudentTimetable = () => {
  const { data: student } = useQuery('my-student-profile', () => studentsService.getMyProfile(), {
    refetchOnWindowFocus: false,
  });

  const { data: timetableData, isLoading } = useQuery(
    ['timetable', student?.class_id, student?.section_id],
    () =>
      academicsService.getTimetable({
        class_id: student?.class_id || 0,
        section_id: student?.section_id || 0,
      }),
    { enabled: !!student?.class_id && !!student?.section_id, refetchOnWindowFocus: false }
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

  if (isLoading) {
    return <div className="loading">Loading timetable...</div>;
  }

  return (
    <div className="student-timetable-page">
      <div className="timetable-header">
        <h1>Class Timetable</h1>
        {student && (
          <p className="class-info">
            {student.class_name} - {student.section_name}
          </p>
        )}
      </div>

      <div className="timetable-container">
        {timetable.length === 0 ? (
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
    </div>
  );
};

export default StudentTimetable;

