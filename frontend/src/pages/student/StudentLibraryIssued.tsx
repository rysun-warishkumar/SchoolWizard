import React from 'react';
import { useQuery } from 'react-query';
import { libraryService } from '../../services/api/libraryService';
import { studentsService } from '../../services/api/studentsService';
import './StudentLibraryIssued.css';

const StudentLibraryIssued = () => {
  const { data: student } = useQuery('my-student-profile', () => studentsService.getMyProfile(), {
    refetchOnWindowFocus: false,
  });

  const { data: memberData } = useQuery(
    ['library-member', student?.id],
    () =>
      libraryService.getLibraryMembers({
        member_type: 'student',
      }),
    { enabled: !!student?.id, refetchOnWindowFocus: false }
  );

  const member = memberData?.find((m) => m.student_id === student?.id);

  const { data: issues = [], isLoading } = useQuery(
    ['book-issues', member?.id],
    () =>
      libraryService.getBookIssues({
        member_id: member?.id,
      }),
    { enabled: !!member?.id, refetchOnWindowFocus: false }
  );

  if (isLoading) {
    return <div className="loading">Loading issued books...</div>;
  }

  return (
    <div className="student-library-issued-page">
      <div className="issued-header">
        <h1>Book Issued</h1>
      </div>

      <div className="issued-content">
        {issues.length === 0 ? (
          <div className="empty-state">No books issued</div>
        ) : (
          <div className="issues-table-container">
            <table className="issues-table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Book No</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Fine</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => {
                  const dueDate = new Date(issue.due_date);
                  const isOverdue = dueDate < new Date() && issue.return_status === 'issued';

                  return (
                    <tr key={issue.id} className={isOverdue ? 'overdue' : ''}>
                      <td>{issue.book_title}</td>
                      <td>{issue.book_no || '-'}</td>
                      <td>{new Date(issue.issue_date).toLocaleDateString()}</td>
                      <td className={isOverdue ? 'overdue-date' : ''}>
                        {dueDate.toLocaleDateString()}
                      </td>
                      <td>
                        {issue.return_date ? new Date(issue.return_date).toLocaleDateString() : '-'}
                      </td>
                      <td>
                        <span className={`status-badge ${issue.return_status}`}>
                          {issue.return_status}
                        </span>
                      </td>
                      <td>₹{parseFloat(issue.fine_amount?.toString() || '0').toFixed(2)}</td>
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

export default StudentLibraryIssued;

