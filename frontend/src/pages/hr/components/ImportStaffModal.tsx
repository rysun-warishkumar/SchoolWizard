import React, { useState } from 'react';
import { useMutation } from 'react-query';
import { hrService } from '../../../services/api/hrService';
import { useToast } from '../../../contexts/ToastContext';
import Modal from '../../../components/common/Modal';
import * as XLSX from 'xlsx';

interface ImportStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

const ImportStaffModal: React.FC<ImportStaffModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { showToast } = useToast();

  const importMutation = useMutation(hrService.importStaff, {
    onSuccess: (data) => {
      setResults(data.data);
      if (data.data.failed.length === 0) {
        showToast(`Successfully imported ${data.data.success.length} staff members!`, 'success');
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
      showToast(error.response?.data?.message || 'Failed to import staff', 'error');
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
        'staff id': 'staff_id',
        'staff_id': 'staff_id',
        'staffid': 'staff_id',
        'employee id': 'staff_id',
        'employee_id': 'staff_id',
        'role id': 'role_id',
        'role': 'role_id',
        'role_id': 'role_id',
        'designation id': 'designation_id',
        'designation': 'designation_id',
        'designation_id': 'designation_id',
        'department id': 'department_id',
        'department': 'department_id',
        'department_id': 'department_id',
        'first name': 'first_name',
        'firstname': 'first_name',
        'first_name': 'first_name',
        'last name': 'last_name',
        'lastname': 'last_name',
        'last_name': 'last_name',
        'father name': 'father_name',
        'father_name': 'father_name',
        'mother name': 'mother_name',
        'mother_name': 'mother_name',
        'gender': 'gender',
        'marital status': 'marital_status',
        'marital_status': 'marital_status',
        'date of birth': 'date_of_birth',
        'dateofbirth': 'date_of_birth',
        'dob': 'date_of_birth',
        'date_of_birth': 'date_of_birth',
        'birth date': 'date_of_birth',
        'birthdate': 'date_of_birth',
        'date of joining': 'date_of_joining',
        'dateofjoining': 'date_of_joining',
        'joining date': 'date_of_joining',
        'date_of_joining': 'date_of_joining',
        'phone': 'phone',
        'mobile': 'phone',
        'contact': 'phone',
        'emergency contact': 'emergency_contact',
        'emergency_contact': 'emergency_contact',
        'email': 'email',
        'current address': 'current_address',
        'current_address': 'current_address',
        'permanent address': 'permanent_address',
        'permanent_address': 'permanent_address',
        'qualification': 'qualification',
        'work experience': 'work_experience',
        'work_experience': 'work_experience',
        'experience': 'work_experience',
        'note': 'note',
        'notes': 'note',
        'epf no': 'epf_no',
        'epf_no': 'epf_no',
        'epf': 'epf_no',
        'basic salary': 'basic_salary',
        'basic_salary': 'basic_salary',
        'salary': 'basic_salary',
        'contract type': 'contract_type',
        'contract_type': 'contract_type',
        'work shift': 'work_shift',
        'work_shift': 'work_shift',
        'shift': 'work_shift',
        'location': 'location',
        'number of leaves': 'number_of_leaves',
        'number_of_leaves': 'number_of_leaves',
        'leaves': 'number_of_leaves',
        'bank account title': 'bank_account_title',
        'bank_account_title': 'bank_account_title',
        'bank account number': 'bank_account_number',
        'bank_account_number': 'bank_account_number',
        'account number': 'bank_account_number',
        'bank name': 'bank_name',
        'bank_name': 'bank_name',
        'ifsc code': 'ifsc_code',
        'ifsc_code': 'ifsc_code',
        'ifsc': 'ifsc_code',
        'bank branch name': 'bank_branch_name',
        'bank_branch_name': 'bank_branch_name',
        'branch name': 'bank_branch_name',
        'facebook url': 'facebook_url',
        'facebook_url': 'facebook_url',
        'twitter url': 'twitter_url',
        'twitter_url': 'twitter_url',
        'linkedin url': 'linkedin_url',
        'linkedin_url': 'linkedin_url',
        'instagram url': 'instagram_url',
        'instagram_url': 'instagram_url',
      };

      // Convert data rows to staff objects
      const staffMembers: any[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.length === 0) continue;

        const staff: any = {};
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
            if (mappedField === 'date_of_birth' || mappedField === 'date_of_joining') {
              let parsedDate: string | null = null;
              
              // Handle Date objects (from XLSX with cellDates: true)
              if (value instanceof Date) {
                if (!isNaN(value.getTime())) {
                  const year = value.getFullYear();
                  const month = String(value.getMonth() + 1).padStart(2, '0');
                  const day = String(value.getDate()).padStart(2, '0');
                  parsedDate = `${year}-${month}-${day}`;
                }
              } 
              // Handle Excel date serial numbers
              else if (typeof value === 'number') {
                if (value > 0 && value < 100000) {
                  let excelDays = value;
                  if (excelDays >= 60) {
                    excelDays = excelDays - 1; // Account for Excel's 1900-02-29 bug
                  }
                  const excelEpoch = new Date(1899, 11, 30);
                  const date = new Date(excelEpoch.getTime() + excelDays * 86400000);
                  if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    parsedDate = `${year}-${month}-${day}`;
                  }
                }
              } 
              // Handle date strings
              else if (typeof value === 'string') {
                const dateStr = valueStr;
                let date: Date | null = null;
                
                // Format: YYYY-MM-DD (ISO format)
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                  date = new Date(dateStr + 'T00:00:00');
                }
                // Format: DD/MM/YYYY or DD-MM-YYYY
                else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(dateStr)) {
                  const parts = dateStr.split(/[\/\-]/);
                  if (parts.length === 3) {
                    const first = parseInt(parts[0], 10);
                    const second = parseInt(parts[1], 10);
                    const year = parseInt(parts[2], 10);
                    
                    if (first > 12) {
                      date = new Date(year, second - 1, first);
                    } else if (second > 12) {
                      date = new Date(year, first - 1, second);
                    } else {
                      date = new Date(year, second - 1, first);
                      if (date.getMonth() !== second - 1) {
                        date = new Date(year, first - 1, second);
                      }
                    }
                  }
                }
                // Try standard Date parsing
                else {
                  date = new Date(dateStr);
                }
                
                if (date && !isNaN(date.getTime())) {
                  const year = date.getFullYear();
                  if (year >= 1900 && year <= 2100) {
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    parsedDate = `${year}-${month}-${day}`;
                  }
                }
              }
              
              if (parsedDate) {
                value = parsedDate;
              } else {
                // Invalid date - skip this field, will be caught by backend validation
                return;
              }
            }
            
            // Convert numeric fields
            if (['role_id', 'designation_id', 'department_id', 'basic_salary', 'number_of_leaves'].includes(mappedField)) {
              value = Number(value) || (mappedField === 'basic_salary' || mappedField === 'number_of_leaves' ? 0 : null);
            }
            
            // Only set if value is not null/empty
            if (value !== null && value !== '') {
              staff[mappedField] = value;
            }
          }
        });

        // Only add if it has at least staff_id, role_id, and first_name
        if (staff.staff_id && staff.role_id && staff.first_name) {
          staffMembers.push(staff);
        }
      }

      if (staffMembers.length === 0) {
        showToast('No valid staff data found in the Excel file', 'error');
        setIsProcessing(false);
        return;
      }

      // Send to backend
      importMutation.mutate(staffMembers);
    } catch (error: any) {
      showToast('Failed to read Excel file: ' + (error.message || 'Unknown error'), 'error');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setFile(null);
      setResults(null);
      onClose();
    }
  };

  const downloadTemplate = () => {
    // Create template Excel file
    const templateData = [
      [
        'Staff ID',
        'Role ID',
        'Designation ID',
        'Department ID',
        'First Name',
        'Last Name',
        'Father Name',
        'Mother Name',
        'Gender',
        'Marital Status',
        'Date of Birth (YYYY-MM-DD)',
        'Date of Joining (YYYY-MM-DD)',
        'Phone',
        'Emergency Contact',
        'Email',
        'Current Address',
        'Permanent Address',
        'Qualification',
        'Work Experience',
        'Note',
        'EPF No',
        'Basic Salary',
        'Contract Type',
        'Work Shift',
        'Location',
        'Number of Leaves',
        'Bank Account Title',
        'Bank Account Number',
        'Bank Name',
        'IFSC Code',
        'Bank Branch Name',
        'Facebook URL',
        'Twitter URL',
        'LinkedIn URL',
        'Instagram URL',
      ],
      [
        'STF001',
        '3',
        '1',
        '1',
        'John',
        'Doe',
        'John Father',
        'Jane Mother',
        'male',
        'married',
        '1985-05-15',
        '2024-01-01',
        '9876543210',
        '9876543211',
        'john@example.com',
        '123 Main St',
        '123 Main St',
        'M.Sc',
        '5 years',
        '',
        'EPF001',
        '50000',
        'permanent',
        'morning',
        'Main Campus',
        '12',
        'John Doe',
        '1234567890',
        'State Bank',
        'SBIN0001234',
        'Main Branch',
        '',
        '',
        '',
        '',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Staff');
    XLSX.writeFile(wb, 'staff_import_template.xlsx');
  };

  return (
    <Modal isOpen={isOpen} title="Import Staff from Excel" onClose={handleClose} size="large">
      <div style={{ padding: '20px' }}>
        <div className="info-box" style={{ marginBottom: '20px', padding: '15px', background: 'var(--info-bg)', borderRadius: '8px' }}>
          <h4 style={{ marginTop: 0 }}>Instructions:</h4>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li>Download the template Excel file below</li>
            <li>Fill in staff information (required fields: Staff ID, Role ID, First Name, Date of Joining)</li>
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
                      <th style={{ padding: '8px', textAlign: 'left' }}>Staff ID</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.failed.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px' }}>{item.row}</td>
                        <td style={{ padding: '8px' }}>{item.staff_id}</td>
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
            onClick={handleClose}
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
            {isProcessing ? 'Importing...' : 'Import Staff'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportStaffModal;
