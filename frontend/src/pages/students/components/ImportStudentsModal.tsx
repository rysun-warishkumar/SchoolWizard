import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { studentsService } from '../../../services/api/studentsService';
import { useToast } from '../../../contexts/ToastContext';
import Modal from '../../../components/common/Modal';
import * as XLSX from 'xlsx';

interface ImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

const ImportStudentsModal: React.FC<ImportStudentsModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { showToast } = useToast();

  const importMutation = useMutation(studentsService.importStudents, {
    onSuccess: (data) => {
      setResults(data.data);
      if (data.data.failed.length === 0) {
        showToast(`Successfully imported ${data.data.success.length} students!`, 'success');
      } else {
        showToast(
          `Import completed: ${data.data.success.length} successful, ${data.data.failed.length} failed`,
          data.data.success.length > 0 ? 'warning' : 'error'
        );
      }
      onImportSuccess();
      setIsProcessing(false);
    },
    onError: (error: any) => {
      showToast(error.response?.data?.message || 'Failed to import students', 'error');
      setIsProcessing(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
        showToast('Please select a valid Excel file (.xlsx, .xls, or .csv)', 'error');
        return;
      }
      
      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      showToast('Please select an Excel file', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // Read Excel file
      const fileData = await file.arrayBuffer();
      const workbook = XLSX.read(fileData, { 
        type: 'array',
        cellDates: true, // Parse dates as Date objects
        cellNF: false,
        cellText: false
      });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      // Get data with raw: true - this gives us Date objects for dates (when cellDates: true)
      // or date serial numbers as fallback
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
        header: 1, 
        defval: '',
        raw: true, // Get raw values (Date objects for dates when cellDates: true, or numbers)
        blankrows: false
      });

      if (jsonData.length < 2) {
        showToast('Excel file must have at least a header row and one data row', 'error');
        setIsProcessing(false);
        return;
      }

      // Get header row (first row)
      // Normalize headers: lowercase, trim, and remove parenthetical notes like "(YYYY-MM-DD)"
      const headers = (jsonData[0] as any[]).map((h: any) => {
        let header = String(h).toLowerCase().trim();
        // Remove parenthetical notes like "(YYYY-MM-DD)" or "(optional)"
        header = header.replace(/\s*\([^)]*\)\s*/g, '').trim();
        return header;
      });
      
      // Map common header variations to our field names
      const headerMap: Record<string, string> = {
        'admission no': 'admission_no',
        'admission number': 'admission_no',
        'admission_no': 'admission_no',
        'roll no': 'roll_no',
        'roll number': 'roll_no',
        'roll_no': 'roll_no',
        'class id': 'class_id',
        'class': 'class_id',
        'class_id': 'class_id',
        'section id': 'section_id',
        'section': 'section_id',
        'section_id': 'section_id',
        'first name': 'first_name',
        'firstname': 'first_name',
        'first_name': 'first_name',
        'last name': 'last_name',
        'lastname': 'last_name',
        'last_name': 'last_name',
        'gender': 'gender',
        'date of birth': 'date_of_birth',
        'dateofbirth': 'date_of_birth',
        'dob': 'date_of_birth',
        'date_of_birth': 'date_of_birth',
        'birth date': 'date_of_birth',
        'birthdate': 'date_of_birth',
        'admission date': 'admission_date',
        'admissiondate': 'admission_date',
        'admission_date': 'admission_date',
        'admission': 'admission_date',
        'category id': 'category_id',
        'category': 'category_id',
        'category_id': 'category_id',
        'religion': 'religion',
        'caste': 'caste',
        'student mobile': 'student_mobile',
        'mobile': 'student_mobile',
        'phone': 'student_mobile',
        'student_mobile': 'student_mobile',
        'email': 'email',
        'blood group': 'blood_group',
        'blood_group': 'blood_group',
        'house id': 'house_id',
        'house': 'house_id',
        'house_id': 'house_id',
        'height': 'height',
        'weight': 'weight',
        'father name': 'father_name',
        'father_name': 'father_name',
        'father occupation': 'father_occupation',
        'father_occupation': 'father_occupation',
        'father phone': 'father_phone',
        'father_phone': 'father_phone',
        'father email': 'father_email',
        'father_email': 'father_email',
        'mother name': 'mother_name',
        'mother_name': 'mother_name',
        'mother occupation': 'mother_occupation',
        'mother_occupation': 'mother_occupation',
        'mother phone': 'mother_phone',
        'mother_phone': 'mother_phone',
        'mother email': 'mother_email',
        'mother_email': 'mother_email',
        'guardian name': 'guardian_name',
        'guardian_name': 'guardian_name',
        'guardian relation': 'guardian_relation',
        'guardian_relation': 'guardian_relation',
        'guardian occupation': 'guardian_occupation',
        'guardian_occupation': 'guardian_occupation',
        'guardian phone': 'guardian_phone',
        'guardian_phone': 'guardian_phone',
        'guardian email': 'guardian_email',
        'guardian_email': 'guardian_email',
        'current address': 'current_address',
        'current_address': 'current_address',
        'permanent address': 'permanent_address',
        'permanent_address': 'permanent_address',
      };

      // Debug: Log headers in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Excel Headers:', headers);
        console.log('Header Map Keys:', Object.keys(headerMap));
        // Check if date headers are found
        const dateHeaders = headers.filter(h => 
          h.includes('date') || h.includes('birth') || h.includes('dob') || h.includes('admission')
        );
        console.log('Date-related headers found:', dateHeaders);
        dateHeaders.forEach(h => {
          const mapped = headerMap[h];
          console.log(`  "${h}" maps to:`, mapped || 'NOT FOUND');
          if (mapped) {
            // Find the index of this header
            const headerIndex = headers.indexOf(h);
            console.log(`    Header index: ${headerIndex}`);
            // Show sample value from first data row
            if (jsonData.length > 1) {
              const sampleValue = (jsonData[1] as any[])[headerIndex];
              console.log(`    Sample value from row 2:`, sampleValue, 'Type:', typeof sampleValue, 'IsDate:', sampleValue instanceof Date);
            }
          }
        });
      }

      // Convert data rows to student objects
      const students: any[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.length === 0) continue;

        const student: any = {};
        headers.forEach((header, index) => {
          const mappedField = headerMap[header];
          if (mappedField && row[index] !== undefined && row[index] !== null) {
            let value = row[index];
            const valueStr = String(value).trim();
            
            // Skip empty values (but allow 0 for numbers)
            if (valueStr === '' || valueStr === 'null' || valueStr === 'undefined') {
              return;
            }
            
            // Handle date fields - convert Excel date numbers or date strings to YYYY-MM-DD format
            if (mappedField === 'date_of_birth' || mappedField === 'admission_date') {
              let parsedDate: string | null = null;
              
              // Debug in development
              if (process.env.NODE_ENV === 'development' && i === 1) {
                console.log(`Processing ${mappedField} for row ${i + 1}:`, { 
                  value, 
                  type: typeof value, 
                  valueStr,
                  isDate: value instanceof Date 
                });
              }
              
              // Handle Date objects (from XLSX with cellDates: true)
              if (value instanceof Date) {
                if (!isNaN(value.getTime())) {
                  const year = value.getFullYear();
                  const month = String(value.getMonth() + 1).padStart(2, '0');
                  const day = String(value.getDate()).padStart(2, '0');
                  parsedDate = `${year}-${month}-${day}`;
                  
                  if (process.env.NODE_ENV === 'development' && i === 1) {
                    console.log(`  Date object converted to:`, parsedDate);
                  }
                }
              } 
              // Handle Excel date serial numbers (when raw: true or cellDates: false)
              else if (typeof value === 'number') {
                // Check if it's a reasonable date serial number (between 1 and ~100000)
                // Excel dates are typically between 1 (1900-01-01) and ~50000 (2037+)
                if (value > 0 && value < 100000) {
                  // Excel date serial number (days since 1900-01-01)
                  // Excel incorrectly treats 1900 as a leap year, so we adjust
                  let excelDays = value;
                  if (excelDays >= 60) {
                    excelDays = excelDays - 1; // Account for Excel's 1900-02-29 bug
                  }
                  const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
                  const date = new Date(excelEpoch.getTime() + excelDays * 86400000);
                  if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    parsedDate = `${year}-${month}-${day}`;
                    
                    if (process.env.NODE_ENV === 'development' && i === 1) {
                      console.log(`  Excel date number ${value} converted to:`, parsedDate);
                    }
                  }
                }
              } 
              // Handle date strings
              else if (typeof value === 'string') {
                const dateStr = valueStr;
                
                // Try multiple date formats
                let date: Date | null = null;
                
                // Format: YYYY-MM-DD (ISO format)
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                  date = new Date(dateStr + 'T00:00:00'); // Add time to avoid timezone issues
                }
                // Format: DD/MM/YYYY or DD-MM-YYYY (common in India)
                else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(dateStr)) {
                  const parts = dateStr.split(/[\/\-]/);
                  if (parts.length === 3) {
                    const first = parseInt(parts[0], 10);
                    const second = parseInt(parts[1], 10);
                    const year = parseInt(parts[2], 10);
                    
                    // Heuristic: if first > 12, it's likely DD/MM/YYYY
                    // If first <= 12 and second > 12, it's MM/DD/YYYY
                    // Otherwise, prefer DD/MM (common in India)
                    if (first > 12) {
                      // Definitely DD/MM/YYYY
                      date = new Date(year, second - 1, first);
                    } else if (second > 12) {
                      // Definitely MM/DD/YYYY
                      date = new Date(year, first - 1, second);
                    } else {
                      // Ambiguous - try DD/MM first (more common in India)
                      date = new Date(year, second - 1, first);
                      // Validate: if date seems wrong (e.g., month > 11), try MM/DD
                      if (date.getMonth() !== second - 1) {
                        date = new Date(year, first - 1, second);
                      }
                    }
                  }
                }
                // Try standard Date parsing as last resort
                if (!date) {
                  date = new Date(dateStr);
                }
                
                if (date && !isNaN(date.getTime())) {
                  // Validate the date is reasonable (not 1970-01-01 from invalid parse)
                  const year = date.getFullYear();
                  if (year >= 1900 && year <= 2100) {
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    parsedDate = `${year}-${month}-${day}`;
                    
                    if (process.env.NODE_ENV === 'development' && i === 1) {
                      console.log(`  Date string "${dateStr}" parsed to:`, parsedDate);
                    }
                  } else if (process.env.NODE_ENV === 'development' && i === 1) {
                    console.warn(`  Date "${dateStr}" parsed to invalid year:`, year);
                  }
                } else if (process.env.NODE_ENV === 'development' && i === 1) {
                  console.warn(`  Failed to parse date: "${dateStr}"`);
                }
              }
              
              if (parsedDate) {
                value = parsedDate;
              } else {
                // Invalid date - log but don't skip, let backend validate
                if (process.env.NODE_ENV === 'development' && i === 1) {
                  console.warn(`  Could not parse ${mappedField} value:`, value, 'Type:', typeof value, 'for row', i + 1);
                }
                // Don't set invalid dates - backend will catch this
                return; // Skip this field
              }
            }
            
            // Convert numeric fields
            if (['class_id', 'section_id', 'category_id', 'house_id'].includes(mappedField)) {
              value = Number(value) || null;
            }
            
            // Only set if value is not null/empty
            if (value !== null && value !== '') {
              student[mappedField] = value;
            }
          }
        });
        
        // Debug first student in development
        if (process.env.NODE_ENV === 'development' && i === 1) {
          console.log('First student object:', student);
          console.log('Has date_of_birth:', !!student.date_of_birth, student.date_of_birth);
          console.log('Has admission_date:', !!student.admission_date, student.admission_date);
        }

        // Only add if it has at least admission_no and first_name
        if (student.admission_no && student.first_name) {
          students.push(student);
        }
      }

      if (students.length === 0) {
        showToast('No valid student data found in the Excel file', 'error');
        setIsProcessing(false);
        return;
      }

      // Send to backend
      importMutation.mutate(students);
    } catch (error: any) {
      showToast('Failed to read Excel file: ' + (error.message || 'Unknown error'), 'error');
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    // Create template Excel file
    const templateData = [
      [
        'Admission No',
        'Roll No',
        'Class ID',
        'Section ID',
        'First Name',
        'Last Name',
        'Gender',
        'Date of Birth (YYYY-MM-DD)',
        'Admission Date (YYYY-MM-DD)',
        'Category ID',
        'Religion',
        'Caste',
        'Student Mobile',
        'Email',
        'Blood Group',
        'House ID',
        'Height',
        'Weight',
        'Father Name',
        'Father Occupation',
        'Father Phone',
        'Father Email',
        'Mother Name',
        'Mother Occupation',
        'Mother Phone',
        'Mother Email',
        'Guardian Name',
        'Guardian Relation',
        'Guardian Occupation',
        'Guardian Phone',
        'Guardian Email',
        'Current Address',
        'Permanent Address',
      ],
      [
        'STU001',
        '1',
        '1',
        '1',
        'John',
        'Doe',
        'male',
        '2010-05-15',
        '2024-04-01',
        '',
        '',
        '',
        '9876543210',
        'john@example.com',
        'O+',
        '',
        '',
        '',
        'John Father',
        'Engineer',
        '9876543211',
        'father@example.com',
        'Jane Mother',
        'Teacher',
        '9876543212',
        'mother@example.com',
        '',
        '',
        '',
        '',
        '',
        '123 Main St',
        '123 Main St',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_import_template.xlsx');
  };

  return (
    <Modal isOpen={isOpen} title="Import Students from Excel" onClose={onClose} size="large">
      <div style={{ padding: '20px' }}>
        <div className="info-box" style={{ marginBottom: '20px', padding: '15px', background: 'var(--info-bg)', borderRadius: '8px' }}>
          <h4 style={{ marginTop: 0 }}>Instructions:</h4>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li>Download the template Excel file below</li>
            <li>Fill in student information (required fields: Admission No, Class ID, Section ID, First Name, Gender, Date of Birth, Admission Date)</li>
            <li>Upload the completed Excel file</li>
            <li>Profile pictures are not included in import - add them manually after import</li>
          </ul>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={downloadTemplate}
            style={{ marginBottom: '10px' }}
          >
            📥 Download Template
          </button>
        </div>

        <div className="form-group">
          <label>Select Excel File (.xlsx, .xls, or .csv)</label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            disabled={isProcessing}
            style={{ padding: '8px', width: '100%' }}
          />
          {file && (
            <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {results && (
          <div style={{ marginTop: '20px' }}>
            <h4>Import Results:</h4>
            <div style={{ marginTop: '10px' }}>
              <p style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>
                ✅ Successful: {results.success.length} / {results.total}
              </p>
              {results.failed.length > 0 && (
                <p style={{ color: 'var(--error-color)', fontWeight: 'bold' }}>
                  ❌ Failed: {results.failed.length} / {results.total}
                </p>
              )}
            </div>

            {results.failed.length > 0 && (
              <div style={{ marginTop: '15px', maxHeight: '300px', overflowY: 'auto' }}>
                <h5>Failed Rows:</h5>
                <table style={{ width: '100%', fontSize: '12px', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ background: 'var(--gray-100)' }}>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Row</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Admission No</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.failed.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px' }}>{item.row}</td>
                        <td style={{ padding: '8px' }}>{item.admission_no}</td>
                        <td style={{ padding: '8px' }}>{item.first_name}</td>
                        <td style={{ padding: '8px', color: 'var(--error-color)' }}>{item.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="form-actions" style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isProcessing}
          >
            Close
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleImport}
            disabled={!file || isProcessing}
          >
            {isProcessing ? 'Importing...' : 'Import Students'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportStudentsModal;
