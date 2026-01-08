# SchoolWizard Portal Guide

Complete guide to understanding and using all modules in the SchoolWizard School Management System.

## 📋 Table of Contents

1. [Front Office](#1-front-office)
2. [Student Information](#2-student-information)
3. [Fees Collection](#3-fees-collection)
4. [Income](#4-income)
5. [Expenses](#5-expenses)
6. [Attendance](#6-attendance)
7. [Examinations](#7-examinations)
8. [Online Examinations](#8-online-examinations)
9. [Academics](#9-academics)
10. [Human Resource](#10-human-resource)
11. [Communicate](#11-communicate)
12. [Download Center](#12-download-center)
13. [Homework](#13-homework)
14. [Library](#14-library)
15. [Inventory](#15-inventory)
16. [Transport](#16-transport)
17. [Hostel](#17-hostel)
18. [Certificate](#18-certificate)
19. [Front CMS](#19-front-cms)
20. [System Settings](#20-system-settings)
21. [User Panels](#21-user-panels)

---

## 1. Front Office

Manages all reception and front office activities.

### 1.1 Setup Front Office
- **Purpose**: Configure master data for Front Office operations
- **Features**: Add Purpose, Complain Type, Source, Reference
- **Usage**: Master data used across other Front Office sections

### 1.2 Admission Enquiry
- **Purpose**: Lead management for student admissions
- **Features**: 
  - View all active admission enquiries
  - Red marking for enquiries past follow-up date
  - Search/Filter by date, source, status
  - Add/Edit/Delete enquiries
  - Follow Up functionality with status tracking

### 1.3 Visitor Book
- **Purpose**: Record all visitors to school reception
- **Fields**: Purpose, Name, Phone, ID Card, Number Of Person, Date, In Time, Out Time, Note, Attach Document

### 1.4 Phone Call Log
- **Purpose**: Record incoming/outgoing phone calls
- **Fields**: Name, Phone, Date, Description, Next Follow Up Date, Call Duration, Note, Call Type

### 1.5 Postal Dispatch
- **Purpose**: Record postal items dispatched from school
- **Fields**: To Title, Reference No, Address, Note, From Title, Date, Attach Document

### 1.6 Postal Receive
- **Purpose**: Record postal items received by school
- **Fields**: From Title, Reference No, Address, Note, To Title, Date, Attach Document

### 1.7 Complain
- **Purpose**: Manage complaints from reception or online front site
- **Fields**: Complain Type, Source, Complain By, Phone, Date, Description, Action Taken, Assigned, Note, Attach Document

---

## 2. Student Information

Comprehensive student management system.

### 2.1 Student Categories
- **Purpose**: Define student categories (caste, community, or group-wise)
- **Usage**: Used during student admission

### 2.2 Student House
- **Purpose**: Define student houses for grouping students
- **Usage**: Used during student admission

### 2.3 Student Admission
- **Purpose**: Enroll new students into the system
- **Key Features**:
  - Auto-generated admission numbers (configurable)
  - Complete student profile with photo
  - Parent/Guardian details
  - Address, Transport, Hostel details
  - Document upload
  - Bulk Import via CSV
- **Custom Fields**: Add via System Settings > Custom Fields

### 2.4 Student Details
- **Purpose**: View and manage student information
- **Features**:
  - Search by Class, Section, or keyword
  - List View and Details View modes
  - Complete 360° profile view
  - Edit, Add Fee, Disable Student, Login Details, Send Password

### 2.5 Online Admission
- **Purpose**: Allow students to register online from front site
- **Workflow**:
  1. Student submits application from front site
  2. Application appears in Online Admission page
  3. Admin edits and processes application
  4. Save or Save And Enroll options

### 2.6 Disabled Students
- **Purpose**: View all disabled students
- **Usage**: Centralized view of all disabled students

### 2.7 Promote Students
- **Purpose**: Promote students to next session and class-section
- **Features**:
  - Select Class and Section
  - View Current Result (Pass/Fail)
  - Set Next Session Status (Continue/Leave)
  - Automatic promotion logic based on result and status

---

## 3. Fees Collection

Complete fees management system.

### 3.1 Fees Type
- **Purpose**: Define different types of fees collected by school
- **Examples**: Admission Fees, Monthly Fees, Exam Fees, Transport Fees
- **Note**: Not dependent on Academic Session

### 3.2 Fees Group
- **Purpose**: Group different Fees Types together for easy assignment
- **Features**: Create groups, assign to class-section or individual students
- **Example**: Class 6 (2 Instalments) - Admission Fees + 1st Instalment + 2nd Instalment

### 3.3 Fees Master
- **Purpose**: Define fees amounts for current session
- **Features**: 
  - Select Fees Group and Fees Type
  - Set Due Date and Amount
  - Select Fine Type (percentage or fixed)
  - Session-wise configuration
  - Assign to students via Assign/View button

### 3.4 Fees Discount
- **Purpose**: Define and manage fee discounts
- **Features**: 
  - Create discount groups
  - Assign to students
  - Apply discount on fees invoice payment

### 3.5 Collect Fees
- **Purpose**: Collect fees from students
- **Features**:
  - Search students by Class, Section, or keyword
  - Collect Single Fee or Multiple Fees
  - Payment modes: Cash, Cheque, Online, etc.
  - Print Receipt
  - Revert payment option

### 3.6 Search Fees Payment
- **Purpose**: Search fees payment details by Payment ID

### 3.7 Search Due Fees
- **Purpose**: Find students with unpaid fees
- **Features**: Filter by Fees Category, Fees Type, Class, Section

### 3.8 Fees Carry Forward
- **Purpose**: Forward balance fees from previous session to current session
- **Features**: View and edit balance fees to be forwarded

### 3.9 Fees Reminder
- **Purpose**: Send fees reminder notifications to guardians
- **Features**: Configure before and after reminders relative to due dates

---

## 4. Income

Income management (other than fees).

### 4.1 Income Head
- **Purpose**: Define income categories
- **Fields**: Income Head, Description

### 4.2 Add Income
- **Purpose**: Record daily/monthly income
- **Fields**: Income Head, Income Name, Invoice Number, Date, Amount, Attach Document, Description

### 4.3 Search Income
- **Purpose**: Search income records by date range or keyword

---

## 5. Expenses

School expense management.

### 5.1 Expense Head
- **Purpose**: Define expense categories
- **Fields**: Expense Head, Description

### 5.2 Add Expense
- **Purpose**: Record daily/monthly expenses
- **Fields**: Expense Head, Expense Name, Invoice Number, Date, Amount, Attach Document, Description

### 5.3 Search Expense
- **Purpose**: Search expense records by date range or keyword

---

## 6. Attendance

Student attendance management.

### 6.1 Student Attendance
- **Purpose**: Record student attendance
- **Attendance Types**:
  - **Day Wise**: Full day attendance
  - **Period Wise**: Period-by-period attendance
- **Biometric Support**: Available for day-wise attendance (requires Smart School Biometric Desktop Plugin)
- **Features**: 
  - Select Class, Section, Date
  - Mark Present, Late, Absent, or other options
  - Mark Holiday option
  - Edit submitted attendance

### 6.2 Attendance By Date
- **Purpose**: View attendance for a specific date
- **Features**: Filter by Class, Section, Date

### 6.3 Approve Leave
- **Purpose**: Manage student leave requests
- **Features**: View, approve, or reject leave requests, add leaves manually

---

## 7. Examinations

Complete examination management system.

### 7.1 Marks Grade
- **Purpose**: Define grading system for exams
- **Exam Types Supported**:
  1. General Purpose (Pass/Fail)
  2. School Based Grading System
  3. College Based Grading System
  4. GPA Grading System
- **Fields**: Exam Type, Grade Name, Percent From, Percent Upto, Grade Point, Description

### 7.2 Exam Group
- **Purpose**: Group related exams together
- **Fields**: Exam Name, Exam Type, Description

### 7.3 Exam (Adding New Exam)
- **Purpose**: Create individual exams within an exam group
- **Process**:
  1. Create exam with name, session, publish status
  2. Assign students to exam
  3. Add exam subjects and schedule
  4. Enter exam marks (manual or CSV import)
  5. Link exams for consolidated results (optional)

### 7.4 Exam Result
- **Purpose**: View exam results
- **Features**: Filter by Class, Section, Exam, etc.

### 7.5 Design Admit Card
- **Purpose**: Design admit card template
- **Features**: Customize layout, fields, enable/disable variables

### 7.6 Print Admit Card
- **Purpose**: Generate and print admit cards
- **Features**: Select students, generate admit cards
- **Recommendation**: Use "Save As PDF" instead of direct printing

### 7.7 Design Marksheet
- **Purpose**: Design marksheet template
- **Features**: Customize layout, fields, enable/disable variables

### 7.8 Print Marksheet
- **Purpose**: Generate and print marksheets
- **Features**: Select students, generate marksheets
- **Recommendation**: Use "Save As PDF" instead of direct printing

---

## 8. Online Examinations

Online exam creation and management.

### 8.1 Question Bank
- **Purpose**: Store and manage exam questions
- **Features**: 
  - View all questions
  - Add questions with multiple choice options
  - Select correct answer

### 8.2 Online Exam
- **Purpose**: Create and manage online exams
- **Features**:
  - Create exams with date, time, duration
  - Assign students to exam
  - Add questions from Question Bank
  - Students attempt exam from Student Panel
  - Publish results when ready

---

## 9. Academics

Academic parameters and master data management.

### 9.1 Sections
- **Purpose**: Define section names used across classes
- **Note**: Sections are reusable across multiple classes

### 9.2 Class
- **Purpose**: Define classes and their associated sections
- **Features**: Create classes, assign sections to classes

### 9.3 Subjects
- **Purpose**: Define all subjects (theory and practical)
- **Fields**: Subject Name, Subject Type, Subject Code

### 9.4 Subject Group
- **Purpose**: Assign subjects to specific class-sections
- **Features**: Create subject groups, assign subjects to class-sections

### 9.5 Assign Class Teacher
- **Purpose**: Assign class teachers to class-sections
- **Features**: 
  - Select Class and Section
  - Assign one or multiple teachers
  - View all class-section assignments
  - Validation: Prevents duplicate assignments

### 9.6 Class Timetable
- **Purpose**: Create and view class timetables
- **Features**:
  - Add/Edit timetable for each day of week
  - Assign Subject, Teacher, Time, Room No
  - View complete timetable for class-section

### 9.7 Teachers Timetable
- **Purpose**: View timetable for selected teacher
- **Features**: Select teacher to view their complete schedule

### 9.8 Promote Students
- **Location**: Student Information > Promote Students
- **Purpose**: Promote students to next session and class-section
- **Features**: Automatic promotion based on result and continuation status

---

## 10. Human Resource

Complete staff management system.

### 10.1 Department
- **Purpose**: Define staff departments
- **Fields**: Department Name

### 10.2 Designation
- **Purpose**: Define staff designations
- **Fields**: Designation Name

### 10.3 Leave Type
- **Purpose**: Define types of leaves available
- **Fields**: Leave Type Name

### 10.4 Staff Directory
- **Purpose**: Manage all staff members
- **Features**:
  - Search and filter staff
  - Card View and List View
  - Complete staff profile with 360° view
  - Add/Edit/Disable staff
  - Custom fields support

### 10.5 Staff Attendance
- **Purpose**: Record daily staff attendance
- **Features**: 
  - Select Role and Date
  - Mark Present, Late, Absent, Half Day
  - Mark Holiday option
  - Edit submitted attendance

### 10.6 Staff Attendance Report
- **Purpose**: View staff attendance reports
- **Features**: Monthly statistics (Present, Late, Absent, Half Day, Holiday, Gross Present %)

### 10.7 Payroll
- **Purpose**: Generate monthly salary for staff
- **Process**:
  1. Generate Payroll (calculate earnings and deductions)
  2. Proceed To Pay (record payment)
  3. View Payslip (print payslip)
- **Features**: Revert status option available

### 10.8 Payroll Report
- **Purpose**: View payroll reports
- **Features**: Filter by Role, Month, Year

### 10.9 Approve Leave Request
- **Purpose**: Approve or manage staff leave requests
- **Features**: View details, change status, add leave manually

### 10.10 Apply Leave
- **Purpose**: Staff can apply for leave (own requests only)
- **Features**: View applied leaves, apply new leave

### 10.11 Teachers Rating
- **Purpose**: View and manage teacher ratings by students
- **Features**: Approve ratings, display on teacher profile (minimum 3 ratings required)

### 10.12 Disabled Staff
- **Purpose**: View all disabled staff members
- **Features**: View profile, delete staff, enable staff

---

## 11. Communicate

Messaging and communication system.

### 11.1 Notice Board
- **Purpose**: Post and view messages/notices
- **Features**: 
  - Post messages with title, content, dates
  - Set Notice Date and Publish Date
  - Select recipients (Students, Parents, Staff)

### 11.2 Send Email
- **Purpose**: Send emails to students, guardians, and staff
- **Tabs**:
  - Group Tab: Send to all users
  - Individual Tab: Send to selected users
  - Class Tab: Send to class-section
  - Today's Birthday Tab: Send to birthday students

### 11.3 Send SMS
- **Purpose**: Send SMS to students, guardians, and staff
- **Tabs**: Same as Send Email (Group, Individual, Class, Today's Birthday)

### 11.4 Email / SMS Log
- **Purpose**: View all sent emails and SMS
- **Features**: Track communication history

---

## 12. Download Center

Document management system.

### 12.1 Upload Content
- **Purpose**: Upload content files for distribution
- **Content Types**: Assignments, Study Material, Syllabus, Other Download
- **Fields**: Content Title, Content Type, Available For, Class, Upload Date, Description, File

### 12.2-12.5 Content Views
- **Assignments**: View all assignment files
- **Study Material**: View all study material files
- **Syllabus**: View all syllabus files
- **Other Downloads**: View all other download files

---

## 13. Homework

Homework assignment and evaluation.

### 13.1 Add Homework
- **Purpose**: Create and evaluate homework for students
- **Features**:
  - Add homework with Class, Section, Subject, Dates
  - Attach documents
  - Evaluate homework completion
  - Track completed students

---

## 14. Library

Library book and membership management.

### 14.1 Book List
- **Purpose**: View and manage library books
- **Features**: Add books with details (Title, ISBN, Publisher, Author, Subject, Rack No, QTY, Price)

### 14.2 Issue Return
- **Purpose**: Issue and return books to library members
- **Features**: 
  - Issue books to members
  - Set return date
  - Return books
  - View issued books

### 14.3 Add Student
- **Purpose**: Add students as library members
- **Features**: Select Class and Section, add students as members

### 14.4 Add Staff Member
- **Purpose**: Add staff members as library members
- **Features**: Add staff as library members

---

## 15. Inventory

School assets and stock management.

### 15.1 Item Category
- **Purpose**: Define categories for inventory items
- **Fields**: Item Category, Description

### 15.2 Item Store
- **Purpose**: Define storage locations for items
- **Fields**: Item Store Name, Item Stock Code, Description

### 15.3 Item Supplier
- **Purpose**: Manage item suppliers/vendors
- **Fields**: Supplier Name, Contact Details, Address

### 15.4 Add Item
- **Purpose**: Add items to inventory
- **Fields**: Item Name, Item Category, Description

### 15.5 Add Item Stock
- **Purpose**: Add stock quantity for items
- **Fields**: Item Category, Item, Supplier, Store, Quantity, Date, Document, Description

### 15.6 Issue Item
- **Purpose**: Issue items to staff members and track returns
- **Features**: Issue items, set return date, track returns

---

## 16. Transport

Transportation management.

### 16.1 Routes
- **Purpose**: Define transportation routes
- **Fields**: Route Title, Fare

### 16.2 Vehicles
- **Purpose**: Manage school vehicles
- **Fields**: Vehicle No, Vehicle Model, Year Made, Driver Details, Contact

### 16.3 Assign Vehicle
- **Purpose**: Assign vehicles to routes
- **Features**: Select Route and Vehicle, view all assignments

### 16.4 Student Transport Report
- **Location**: Student Information > Student Transport Report
- **Purpose**: View students using transport facility

---

## 17. Hostel

Hostel facility management.

### 17.1 Hostel
- **Purpose**: Define hostels
- **Fields**: Hostel Name, Type, Address, Intake, Description

### 17.2 Room Type
- **Purpose**: Define types of hostel rooms
- **Fields**: Room Type, Description

### 17.3 Hostel Rooms
- **Purpose**: Manage individual hostel rooms
- **Fields**: Room No/Name, Hostel, Room Type, No of Bed, Cost Per Bed, Description

### 17.4 Student Hostel Report
- **Location**: Student Information > Student Hostel Report
- **Purpose**: View students using hostel facility

---

## 18. Certificate

Student certificate and ID card generation.

### 18.1 Student Certificate
- **Purpose**: Design student certificate templates
- **Features**: 
  - Customize header, body, footer text
  - Set dimensions (Header Height, Footer Height, Body Height, Body Width)
  - Enable/disable student photo
  - Set background image
  - Use keywords for dynamic student data

### 18.2 Generate Certificate
- **Purpose**: Generate certificates for selected students
- **Features**: Select students and certificate design, generate and print

### 18.3 Student ID Card
- **Purpose**: Design student ID card templates
- **Features**: 
  - Customize layout and fields
  - Enable/disable various student information fields
  - Set header color, background image, logo, signature

### 18.4 Generate ID Card
- **Purpose**: Generate ID cards for selected students
- **Features**: Select students and ID card design, generate and print

---

## 19. Front CMS

Public website management.

### 19.1 Front CMS Configuration
- **Location**: System Settings > Front CMS Setting
- **Purpose**: Configure Front CMS settings
- **Features**: Enable/disable CMS, configure theme, social media, analytics

### 19.2 Menus
- **Purpose**: Manage website navigation menus
- **Features**: 
  - Create menus (Main Menu, Bottom Menu, Custom)
  - Add menu items (External URL or CMS Pages)
  - Arrange menu order by drag and drop
  - Add sub-menu items

### 19.3 Media Manager
- **Purpose**: Centralized media asset management
- **Features**: 
  - Upload images and documents
  - Add YouTube videos via URL
  - Search and filter media

### 19.4 Pages
- **Purpose**: Manage all Front CMS pages
- **Page Types**: Standard, Event, News, Gallery
- **Features**: 
  - Add/Edit/Delete pages
  - SEO settings (Meta Title, Keywords, Description)
  - Sidebar settings
  - Featured image

### 19.5 Event
- **Purpose**: Add school events (past/future)
- **Fields**: Event Title, Venue, Start Date, End Date, Description, SEO Details, Featured Image

### 19.6 Gallery
- **Purpose**: Add image/video galleries
- **Fields**: Gallery Title, Description, Gallery Images, SEO Details, Featured Image

### 19.7 News
- **Purpose**: Add school news/notices
- **Fields**: News Title, News Date, Description, SEO Details, Featured Image

### 19.8 Banner Images
- **Purpose**: Manage home page banner images
- **Features**: Add/remove images in Home Page banner

---

## 20. System Settings

System-wide configuration management.

### 20.1 General Setting
- **Purpose**: Configure core school and system settings
- **Key Settings**:
  - School Information (Name, Address, Phone, Email, Code)
  - Session Settings (Current Session, Session Start Month)
  - Attendance Settings (Type, Biometric)
  - Language Settings
  - Date & Time Format
  - Currency Settings
  - Admission Number Settings (Auto-generation)
  - Staff ID Settings (Auto-generation)
  - Fees Settings
  - Teacher Settings (Restricted Mode)
  - Online Admission
  - Mobile App Settings
  - Logo Management (Print Logo, Admin Logo, App Logo)

### 20.2 Session Setting
- **Purpose**: Manage academic sessions
- **Features**: Add sessions (format: 2015-16, 2016-17, etc.)

### 20.3 Notification Setting
- **Purpose**: Control automated Email/SMS notifications
- **12 Notification Events**: Student Admission, Exam Result, Fees Submission, Absent Student, Login Credential, Homework Created, Fees Due Reminder, Live Classes, Live Meetings, etc.

### 20.4 SMS Setting
- **Purpose**: Configure SMS gateway for notifications
- **Supported Gateways**: Clickatell, Twilio, MSG91, Text Local, SMS Country, Custom Gateway

### 20.5 Email Setting
- **Purpose**: Configure email delivery engine
- **Engines**: SendMail, SMTP (with Gmail support)

### 20.6 Payment Methods
- **Purpose**: Configure online payment gateways
- **Supported Gateways**: Paypal, Stripe, PayU, CCAvenue, Instamojo, Paystack, Razorpay

### 20.7 Print Header Footer
- **Purpose**: Customize print headers and footers
- **Usage**: Fees receipt headers/footers, Staff payslip headers/footers

### 20.8 Front CMS Setting
- **Purpose**: Configure public website settings
- **Features**: Enable/disable CMS, theme selection, social media URLs, Google Analytics

### 20.9 Roles Permissions
- **Purpose**: Create roles and assign permissions
- **Default Roles**: SuperAdmin, Admin, Teacher, Accountant, Librarian, Receptionist
- **Features**: 
  - Add custom roles
  - Assign module-wise permissions (View, Add, Edit, Delete)

### 20.10 Backup / Restore
- **Purpose**: Database backup and restore functionality
- **Features**: 
  - Create manual backups
  - Restore from backup
  - Auto Backup via Cron

### 20.11 Languages
- **Purpose**: Manage system languages
- **Features**: Enable multiple languages, select default language, edit language phrases

### 20.12 Users
- **Purpose**: Manage user access to User Panel
- **Features**: Enable/disable user login access

### 20.13 Modules
- **Purpose**: Enable/disable system modules
- **Features**: Control module visibility in Admin/Student/Parent panels

### 20.14 Custom Fields
- **Purpose**: Add extra fields to Student or Staff forms
- **Fields**: Field Belongs to, Field Type, Field Name, Grid column, Field Values, Validation, Visibility

### 20.15 System Fields
- **Purpose**: Enable/disable default system fields
- **Features**: Control visibility of default fields in Student or Staff forms

---

## 21. User Panels

### Student Panel

**Login URL**: `http://yourdomain/site/userlogin`

**Available Sections**:
1. **My Profile** - Complete profile view with fees, exams, documents
2. **Fees** - View fees details, payment history, pay online
3. **Class Timetable** - Weekly class timetable
4. **Homework** - View assigned homework
5. **Online Exam** - Take online examinations, view results
6. **Apply Leave** - Apply for leave requests
7. **Download Center** - Download Assignments, Study Material, Syllabus
8. **Attendance** - Monthly attendance records
9. **Notice Board** - View messages from Admin & Teachers
10. **Teachers Review** - Rate and review teachers
11. **Subjects** - View all study subjects
12. **Teachers** - View all teachers list
13. **Library > Books** - View all books in library
14. **Library > Book Issued** - View issued books
15. **Transport Routes** - View transport routes
16. **Hostel Rooms** - View hostel room details

### Parent Panel

**Login URL**: `http://yourdomain/site/userlogin`

**Key Feature**: Multi-child view - Parent can see all their children's details at once

**Available Sections** (similar to Student Panel):
- My Profile (for all children)
- Fees (for all children)
- Class Timetable (for all children)
- Homework (for all children)
- Online Exam (for all children)
- Apply Leave (for all children)
- Download Center
- Attendance (for all children)
- Notice Board
- Teachers Review
- Library Books (for all children)
- Transport Routes (for all children)
- Hostel Rooms (for all children)

---

## 📝 Notes

- All modules are interconnected and work together to provide a complete school management solution
- Proper configuration in System Settings is essential for modules to function correctly
- Most modules support search, filter, and export functionality
- Regular backups are recommended via System Settings > Backup / Restore
- For technical setup and deployment, refer to [README.md](README.md)

---

**Last Updated**: December 2024
