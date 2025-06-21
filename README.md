# Meds Buddy - Medication Management System
# Live URL - "https://meds-buddy-check-task-16jj.vercel.app/"

A comprehensive medication management application built with React, TypeScript, Vite, and Supabase. The system provides separate dashboards for patients and caretakers to manage medications, track adherence, and monitor medication schedules.

## Features

### Core Functionality
- **User Authentication**: Secure login/signup with Supabase Auth
- **Role-based Access**: Separate interfaces for patients and caretakers
- **Medication Management**: Add, edit, delete medications with schedules
- **Adherence Tracking**: Real-time medication adherence monitoring
- **Proof Photos**: Upload and view medication proof photos
- **Real-time Updates**: Live medication log updates using Supabase subscriptions
- **Responsive Design**: Mobile-friendly interface with modern UI components

### Patient Features
- View assigned medications and schedules
- Log medication intake with timestamps
- Upload proof photos for medication verification
- Track personal adherence statistics
- Real-time medication reminders

### Caretaker Features
- Manage multiple patients' medications
- View patient adherence reports
- Monitor medication logs and proof photos
- Set up medication schedules and dosages
- Receive notifications for missed doses

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Testing**: Vitest, React Testing Library
- **Package Manager**: npm/bun

## Prerequisites

- Node.js 18+ or Bun
- Supabase account
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd meds-buddy-check-task
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using Bun:
```bash
bun install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_ENV=development
```

### 4. Supabase Setup

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from the API settings

#### Database Schema Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('patient', 'caretaker')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medications table
CREATE TABLE medications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  time_of_day TEXT[] NOT NULL,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  caretaker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medication_logs table
CREATE TABLE medication_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  proof_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Medications policies
CREATE POLICY "Patients can view own medications" ON medications
  FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = caretaker_id);

CREATE POLICY "Caretakers can manage medications" ON medications
  FOR ALL USING (auth.uid() = caretaker_id);

-- Medication logs policies
CREATE POLICY "Users can view own logs" ON medication_logs
  FOR SELECT USING (auth.uid() = patient_id OR 
    EXISTS (SELECT 1 FROM medications WHERE id = medication_logs.medication_id AND caretaker_id = auth.uid()));

CREATE POLICY "Patients can create logs" ON medication_logs
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Function to delete medication and logs atomically
CREATE OR REPLACE FUNCTION delete_medication_with_logs(medication_uuid UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM medication_logs WHERE medication_id = medication_uuid;
  DELETE FROM medications WHERE id = medication_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_medication_with_logs(UUID) TO authenticated;
```

#### Storage Bucket Setup
1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `medication-proofs`
3. Set the bucket to public
4. Add storage policies for file uploads

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Testing

### Run Tests
```bash
npm run test
npm run test:ui
npm run test:watch
```

## Building for Production

### Build the Application
```bash
npm run build
npm run preview
```

## Deployment

### Vercel Deployment(I prefer this)

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy: `vercel --prod`

### Netlify Deployment

1. Push code to GitHub
2. Connect repository in Netlify dashboard
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard

### Manual Deployment

1. Build: `npm run build`
2. Upload `dist` folder to web server
3. Configure server to serve SPA correctly

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Shadcn/ui components
│   ├── AuthForm.tsx    # Authentication form
│   ├── CaretakerDashboard.tsx
│   ├── MedicationForm.tsx
│   ├── MedicationList.tsx
│   ├── MedicationTracker.tsx
│   ├── NotificationSettings.tsx
│   ├── Onboarding.tsx
│   ├── PatientDashboard.tsx
│   └── PatientRealtimeLogs.tsx
├── hooks/              # Custom React hooks
├── lib/                # API clients and utilities
├── pages/              # Page components
├── tests/              # Test files
├── types/              # TypeScript type definitions
└── main.tsx           # Application entry point
```

