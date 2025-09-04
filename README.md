# Nurse Schedule Pro Frontend

![Nurse Pro Frontend](https://img.shields.io/badge/Nurse-Pro%20Frontend-blueviolet)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![Vite](https://img.shields.io/badge/Vite-5.x-646cff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8)

A modern, responsive frontend application for Nurse Schedule Pro - a professional shift management system designed for healthcare organizations.

## 🚀 Features

- **Interactive Schedule Management**: Calendar and table views for shift planning
- **Drag & Drop Scheduling**: Intuitive shift assignment with react-beautiful-dnd
- **Real-time Updates**: Live synchronization with backend API
- **Export Functionality**: PDF and Excel export capabilities
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Professional UI**: Clean, healthcare-focused interface
- **Shift Management**: Create, edit, and manage nursing shifts
- **Nurse Profiles**: Comprehensive nurse management
- **Swap Requests**: Shift exchange system with approval workflow

## 🛠️ Tech Stack

### Core Technologies

- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite 5** - Fast build tool and development server
- **Tailwind CSS 3** - Utility-first CSS framework
- **Zustand** - Lightweight state management

### Key Dependencies

- **React Beautiful DnD** - Drag and drop functionality
- **React Hook Form** - Form management with validation
- **Axios** - HTTP client for API communication
- **Date-fns** - Date manipulation and formatting
- **Lucide React** - Beautiful icons
- **Yup** - Schema validation

### Export Capabilities

- **html2canvas** - HTML to image conversion
- **jspdf** - PDF generation
- **PapaParse** - CSV parsing for bulk uploads

## 📦 Project Structure

```
src/
├── components/
│   ├── Common/                 # Reusable components
│   │   └── LoadingSpinner.tsx
│   ├── Dashboard/              # Dashboard components
│   │   └── Dashboard.tsx
│   ├── Layout/                 # Layout components
│   │   ├── Header.tsx
│   │   ├── Layout.tsx
│   │   └── Sidebar.tsx
│   ├── Notifications/          # Notification system
│   │   └── NotificationContainer.tsx
│   ├── Nurses/                 # Nurse management
│   │   ├── BulkUpload.tsx
│   │   ├── NurseForm.tsx
│   │   ├── NurseList.tsx
│   │   └── NurseProfile.tsx
│   ├── Schedule/               # Schedule management
│   │   ├── ScheduleCalendar.tsx
│   │   ├── ScheduleEditor.tsx
│   │   ├── ScheduleGenerator.tsx
│   │   ├── SchedulePage.tsx
│   │   ├── ScheduleTable.tsx
│   │   ├── ShiftDetailsModal.tsx
│   │   └── ShiftForm.tsx
│   └── SwapRequests/           # Swap request management
│       ├── CreateSwapRequest.tsx
│       └── SwapRequestList.tsx
├── stores/                     # State management
│   ├── notificationStore.ts
│   ├── nurseStore.ts
│   ├── scheduleStore.ts
│   └── uiStore.ts
├── types/                      # TypeScript definitions
│   └── index.ts
├── utils/                      # Utility functions
│   └── api.ts
└── main.tsx                    # Application entry point
```

## 🎨 UI/UX Features

### Design System

- **Color Scheme**: Professional healthcare colors with accessibility contrast
- **Typography**: Clean, readable fonts optimized for medical data
- **Icons**: Consistent iconography with Lucide React
- **Spacing**: Consistent spacing system with Tailwind's scale

### Responsive Layout

- **Mobile**: Collapsible sidebar, touch-friendly interfaces
- **Tablet**: Optimized for medium screens
- **Desktop**: Full-featured with multi-column layouts

### Interactive Components

- **Collapsible Sidebar**: Retractable navigation for more screen space
- **Modals**: Shift details and forms in accessible modals
- **Notifications**: Toast notifications for user feedback
- **Loading States**: Skeleton screens and spinners

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Nurse Pro Backend API running

### Installation

1. **Clone the repository**
   
   ```bash
   git clone https://github.com/your-org/nurse-pro-frontend.git
   cd nurse-pro-frontend
   ```
2. **Install dependencies**
   
   ```bash
   npm install
   # or
   yarn install
   ```
3. **Configure environment**
   
   ```bash
   # Create .env file
   cp .env.example .env
   ```
   
   Update `.env` with your API URL:
   
   ```env
   VITE_API_URL=http://localhost:8080/api
   VITE_API_TIMEOUT=20000
   ```
4. **Start development server**
   
   ```bash
   npm run dev
   # or
   yarn dev
   ```
5. **Open in browser**
   
   ```
   http://localhost:5173
   ```

### Building for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## 🔧 Configuration

### Environment Variables

```env
VITE_API_URL=your_api_url
VITE_API_TIMEOUT=20000
VITE_API_RETRY_ATTEMPTS=3
```

### Tailwind CSS Configuration

The project uses a custom Tailwind configuration with healthcare-specific colors and components.

### Vite Configuration

Optimized for React and TypeScript with hot module replacement.

## 📱 Key Features in Detail

### Schedule Management

- **Calendar View**: Monthly calendar with shift visualization
- **Table View**: Weekly table format for detailed planning
- **Shift Creation**: Modal forms for creating new shifts
- **Drag & Drop**: Intuitive nurse assignment
- **Export Options**: PDF and Excel generation

### Nurse Management

- **Nurse Profiles**: Complete nurse information
- **Bulk Upload**: CSV import for multiple nurses
- **Qualifications**: Specialization and experience tracking
- **Availability**: Unavailable dates and shift preferences

### Swap Requests

- **Request Creation**: Easy shift swap requests
- **Approval Workflow**: Manager approval system
- **Notification System**: Real-time updates on request status

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Build for production test
npm run build && npm run preview
```

## 📊 Performance Optimizations

- **Code Splitting**: Automatic chunk splitting with Vite
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: Optimized assets
- **Lazy Loading**: Component and route lazy loading
- **Memoization**: Optimized re-renders with React memo

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+


### Code Style

- TypeScript strict mode
- ESLint for code quality
- Prettier for formatting
- Component-driven development

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Component documentation in code
- **Issues**: GitHub issue tracker
- **Email**: support@nursepro.com

## 🙏 Acknowledgments

- Healthcare professionals for feedback and testing
- Open source community for amazing tools
- React and Vite teams for excellent frameworks
- Tailwind CSS for the utility-first approach

---

**Nurse Schedule Pro Frontend** - Modern, accessible, and efficient scheduling for healthcare professionals.

