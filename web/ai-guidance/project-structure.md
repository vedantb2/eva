# Vense CRM Project Structure

## Overview

Vense is a modern CRM (Customer Relationship Management) application built with Next.js, React, and Tailwind CSS. It features a clean, glassmorphic design with a focus on usability and aesthetics. The application provides comprehensive tools for managing contacts, invoices, projects, tasks, sales opportunities, and scheduling.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Charts & Visualisations**: Recharts
- **Calendar**: React Big Calendar
- **Date Handling**: date-fns
- **Icons**: Lucide React

## Project Structure

### Core Directories

- `/app`: Main application code using Next.js App Router
  - `/dashboard`: Dashboard and all module pages
  - `/api`: API routes
- `/components`: Reusable UI components
  - `/ui`: Shadcn UI components
- `/lib`: Utility functions and shared code
- `/public`: Static assets
- `/ai-guidance`: Documentation and guidance for the project

### Module Structure

The application is organised into several key modules:

1. **Dashboard**: Main overview with stats, recent activity, and quick access to other modules
2. **Contacts**: Contact management for individuals and companies
3. **Invoices**: Invoice creation, management, and tracking
4. **Projects**: Project management with progress tracking
5. **Tasks**: Task management with Kanban board view
6. **Sales**: Sales pipeline and opportunity management
7. **Calendar**: Event scheduling and calendar management
8. **Analytics**: Reports and data visualisation

### Key Files

- `app/dashboard/layout.tsx`: Main dashboard layout with navigation
- `app/dashboard/MobileNav.tsx`: Mobile navigation component
- `app/dashboard/page.tsx`: Dashboard home page
- `app/dashboard/DashboardContent.tsx`: Dashboard content component
- Module-specific directories:
  - `app/dashboard/contacts/`: Contact management module
  - `app/dashboard/invoices/`: Invoice management module
  - `app/dashboard/projects/`: Project management module
  - `app/dashboard/tasks/`: Task management module
  - `app/dashboard/sales/`: Sales pipeline module
  - `app/dashboard/calendar/`: Calendar and scheduling module
  - `app/dashboard/analytics/`: Analytics and reporting module

## Component Architecture

The application follows a component-based architecture with:

- **Server Components**: Used by default for most UI rendering
- **Client Components**: Used only where interactivity is required (marked with "use client" directive)
- **Layout Components**: For consistent page layouts
- **Page Components**: For specific routes
- **UI Components**: Reusable UI elements

## Design Principles

1. **Glassmorphism**: Modern UI with frosted glass effects
2. **Responsive Design**: Works on all device sizes
3. **Component Reusability**: DRY principles with shared components
4. **Type Safety**: TypeScript for better developer experience
5. **Performance**: Server components for improved loading times
6. **Accessibility**: Following best practices for inclusive design

## Module Details

### Dashboard
The dashboard provides a comprehensive overview of the CRM system, displaying key metrics, recent activities, upcoming tasks, recent projects, sales pipeline summary, and upcoming events. It serves as the central hub for users to monitor their business activities at a glance.

### Projects & Tasks
The Projects & Tasks module offers a complete project management solution with:
- Project listing with progress tracking
- Task management with an interactive Kanban board
- Task creation, editing, and status management
- Task filtering and search capabilities
- Task prioritisation with visual indicators
- Task assignment to team members

### Sales Pipeline
The Sales Pipeline module provides a visual representation of the sales process, allowing users to:
- View opportunities at different stages
- Track deal progress
- Manage deal stages
- View opportunity details

### Calendar
The Calendar module offers a comprehensive scheduling system with:
- Multiple view modes (month, week, day, agenda)
- Event categorisation with visual indicators
- Event details view

### Analytics
The Analytics module provides data visualisations for business intelligence:
- Revenue tracking
- Contact growth metrics
- Invoice status distribution
- Sales performance charts
- Project status breakdown
- Task completion metrics

### Contacts
The Contacts module provides comprehensive contact management with:
- Contact listing with search and filtering
- Contact details view
- Contact creation and editing
- Contact status management
- Contact deletion

### Invoices
The Invoices module offers complete invoice management capabilities:
- Invoice listing with search and filtering
- Invoice creation and editing
- Payment status tracking
- Mark invoices as paid functionality
- Invoice deletion 