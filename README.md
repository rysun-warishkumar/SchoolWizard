# SchoolWizard - School Management System

A comprehensive, modern school management system built with React, Node.js, and MySQL.

## 🛠️ Tech Stack

- **Frontend**: React 18+ with TypeScript, Vite
- **Backend**: Node.js 18+ with Express.js, TypeScript
- **Database**: MySQL 5.7+ (via XAMPP or standalone)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **State Management**: React Query
- **Styling**: CSS Modules

## 📋 System Overview

SchoolWizard is a complete school management solution designed to handle all aspects of school administration, from student enrollment to financial management, academics, and communication.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v5.7 or higher) or **XAMPP** - [Download XAMPP](https://www.apachefriends.org/)
- **Git** (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SchoolWizard
   ```

2. **Database Setup**
   - Start MySQL service (XAMPP or standalone)
   - Create a new database: `schoolwizard`
   - Import database files from `database/consolidated/`:
     - **Easiest**: Import `00_complete_database.sql` (single file)
     - **OR**: Import files 01-05 in order (modular approach)

3. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure database credentials
   npm run build
   npm start
   ```
   Backend runs on `http://localhost:5000`

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env  # Configure API base URL
   npm run dev
   ```
   Frontend runs on `http://localhost:5173`

5. **Default Login**
   - Email: `admin@schoolwizard.com`
   - Password: `admin123`

## 📁 Project Structure

```
SchoolWizard/
├── backend/                 # Node.js Backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   ├── config/         # Configuration
│   │   └── utils/          # Utility functions
│   ├── dist/               # Compiled JavaScript
│   └── uploads/            # File uploads directory
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── contexts/       # React contexts
│   │   └── layouts/        # Layout components
│   └── public/             # Static assets
│
├── database/                # Database scripts
│   ├── consolidated/       # Consolidated SQL files
│   └── migrations/         # Migration files
│
├── SchoolPortal/            # Public website
│   └── src/                # React components for public site
│
└── README.md               # This file
```

## 🔧 Environment Configuration

### Backend (.env)

```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=schoolwizard
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## 🏗️ Build & Deployment

### Development

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Production Build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Deploy dist/ folder to web server
```

## 📚 API Structure

### Base URL
- Development: `http://localhost:5000/api/v1`
- Production: `https://yourdomain.com/api/v1`

### Authentication
All protected routes require JWT token in header:
```
Authorization: Bearer <token>
```

### Main API Endpoints

- `/auth` - Authentication (login, register, refresh)
- `/students` - Student management
- `/staff` - Staff management
- `/academics` - Classes, sections, subjects
- `/examinations` - Exam management
- `/fees` - Fees collection
- `/attendance` - Attendance tracking
- `/settings` - System settings
- `/reports` - Reports generation

## 🗄️ Database

### Database Files Location
- `database/consolidated/00_complete_database.sql` - Complete database (recommended)
- `database/consolidated/01-05_*.sql` - Modular database files

### Key Tables
- `users` - User accounts
- `students` - Student records
- `staff` - Staff records
- `classes`, `sections`, `subjects` - Academic structure
- `exams`, `exam_marks` - Examination data
- `fees`, `fees_payments` - Financial data
- `attendance` - Attendance records

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting
- Input validation

## 📦 Key Features

### Admin Panel (27 Modules)
- Front Office Management
- Student Information System
- Fees Collection
- Income & Expenses
- Attendance Tracking
- Examinations
- Online Examinations
- Academics Management
- Human Resource
- Communication Tools
- Download Center
- Library Management
- Transport & Hostel
- Certificate Generation
- Front CMS Website
- And more...

### User Panels
- **Student Panel**: View profile, fees, attendance, exams, homework
- **Parent Panel**: Multi-child view, fees payment, communication
- **Staff Panel**: Profile, attendance, payroll, leave management

### Public Website
- Responsive design
- CMS-based content management
- Gallery, News, Events
- Online admission form

## 🛠️ Development

### Code Standards

- **TypeScript**: Type safety throughout
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Git**: Version control with meaningful commits

### File Naming
- Components: PascalCase (`StudentProfile.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

## 📝 Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL service is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**
   - Change port in `.env` file
   - Kill process using the port

3. **Module Not Found**
   - Run `npm install` in both backend and frontend
   - Clear `node_modules` and reinstall

4. **Build Errors**
   - Check TypeScript errors: `npm run build`
   - Verify all dependencies are installed
   - Check for missing environment variables

## 📄 License

[Your License Here]

## 👥 Contributors

[Contributors List]

## 📞 Support

For detailed module documentation, see [PortalGuide.md](PortalGuide.md)

---

**Last Updated**: December 2024
