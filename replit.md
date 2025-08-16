# Web Scraper & Document Generator

## Overview

This is a full-stack web application that allows users to scrape website content and generate downloadable documents (PDF or DOCX format). The application features a React frontend with a Node.js/Express backend, using Puppeteer for web scraping and document generation capabilities. Users can input a URL, select their preferred output format, and receive a formatted document containing the extracted content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and theming
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Web Scraping**: Puppeteer for dynamic content extraction and browser automation
- **Document Generation**: 
  - PDFKit for PDF generation
  - docx library for Word document creation
- **File Handling**: Built-in Node.js fs module for file operations
- **Storage**: In-memory storage implementation with interface for future database integration

### Database Schema
The application defines schemas for:
- **Users**: Basic user authentication with username/password
- **Scrape Jobs**: Job tracking with status, progress, metadata, and file information
- **Database Setup**: Drizzle ORM configured for PostgreSQL with migration support

### API Design
- RESTful endpoints for scrape job management
- Real-time job status polling
- File download endpoints
- CRUD operations for document management
- Error handling with standardized response format

### Key Features
- **Progressive Web Scraping**: Extracts clean content while filtering out ads, navigation, and irrelevant elements
- **Multi-format Output**: Supports both PDF and DOCX document generation
- **Job Status Tracking**: Real-time progress monitoring with polling mechanism
- **Document Management**: History of generated documents with metadata
- **Responsive Design**: Mobile-friendly interface with adaptive layouts
- **Error Handling**: Comprehensive error states and user feedback

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React router

### UI and Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Web Scraping and Document Generation
- **puppeteer**: Headless Chrome automation for web scraping
- **pdfkit**: PDF document generation
- **docx**: Microsoft Word document creation

### Development and Build Tools
- **vite**: Fast build tool and development server
- **typescript**: Type safety and enhanced developer experience
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Development tooling for Replit environment

### Authentication and Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional class name utility
- **react-hook-form**: Form state management
- **zod**: Schema validation