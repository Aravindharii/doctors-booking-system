#  Doctor's Appointment Booking System

A **full-stack web application** that enables **Patients** to book appointments with **Doctors**, while allowing doctors to manage their available time slots and appointments.



## Table of Contents
1. Features
2. Architecture Overview
3. Tech Stack
4. Project Structure
5. Local Setup
6. Database Setup
7. Running the Project
8. Cypress Test Suite
9. API Endpoints
10. AWS Lambda Deployment
11. Future Enhancements
12. License

---

## Features
- **Authentication:** JWT-based login and registration.
- **Roles:** Doctors & Patients with role-based access.
- **Doctor Portal:** Create/view/delete time slots, confirm/reschedule/cancel appointments.
- **Patient Portal:** Browse availability, book slots, view appointment statuses.
- **Testing:** Cypress E2E tests.
- **Deployment:** AWS Lambda using Serverless Framework.

---

##  Architecture Overview
The system follows a **client-server architecture**:
- **Frontend (React):**
  - Built using **Vite** for faster builds.
  - **Redux Toolkit** manages state across Doctor and Patient portals.
  - Role-based UI rendered based on JWT tokens.

- **Backend (NestJS):**
  - **REST API** with modular architecture (Auth, Doctor, Patient).
  - **Prisma ORM** for PostgreSQL database access.
  - JWT authentication and authorization.

- **Database (PostgreSQL):**
  - Relational database with **Doctors**, **Patients**, **Slots**, and **Appointments** tables.

- **Deployment:**
  - Backend deployed as **serverless functions** on AWS Lambda.
  - Frontend hosted on **Vercel/Netlify**.

---

##  Tech Stack
- **Frontend:** React, Vite, Redux Toolkit, TailwindCSS/Bootstrap.
- **Backend:** NestJS, Prisma ORM, PostgreSQL.
- **Auth:** JWT (JSON Web Token).
- **Testing:** Cypress.
- **Deployment:** AWS Lambda (Serverless Framework).

---

##  Project Structure
```
doctors-booking-system/
│
├── backend/                  
│   ├── prisma/               # Prisma schema & migrations
│   ├── src/                  # NestJS controllers, services, modules
│   ├── test/                 # Backend tests
│   ├── .env.example          # Sample environment variables
│   └── package.json
│
├── frontend/                 
│   ├── src/                  # React components, pages, store
│   ├── cypress/              # Cypress test suite
│   ├── vite.config.js        
│   └── package.json
│
├── serverless.yml            # AWS Lambda configuration
└── README.md
```

---

##  Local Setup

### 1. Clone Repository
```
git clone https://github.com/<your-username>/doctors-booking-system.git
cd doctors-booking-system
```

---

### 2. Backend Setup (NestJS)
```
cd backend
npm install
```

#### Environment Variables
Copy `.env.example` to `.env`:
```
cp .env.example .env
```
Update `.env` with your database and JWT secret:
```
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/doctors_booking"
JWT_SECRET="your-secret-key"
```

---

## Database Setup
- Ensure **PostgreSQL** is installed and running.
- Create a database:
```
CREATE DATABASE doctors_booking;
```
- Run Prisma migrations:
```
npx prisma migrate dev
```

---

## Start Backend
```
npm run start:dev
```
The backend will run on **http://localhost:3000**.

---

## 3. Frontend Setup (React)
```
cd ../frontend
npm install
npm run dev
```
The frontend will run on **http://localhost:5173**.

---

##  Cypress Test Suite

### Run Cypress in Interactive Mode
```
cd frontend
npx cypress open
```

### Run Cypress in Headless Mode
```
npx cypress run
```

The Cypress tests cover:
- User registration/login flow.
- Booking an appointment.
- Doctor slot creation and management.

---

##  API Endpoints

### Auth Routes
- `POST /auth/register` – Register as a doctor or patient.
- `POST /auth/login` – Login and receive JWT.

### Doctor Routes
- `POST /doctor/slots` – Create time slots.
- `GET /doctor/slots` – Get doctor’s time slots.
- `PATCH /doctor/appointments/:id` – Confirm/reschedule/cancel appointments.

### Patient Routes
- `GET /patient/doctors` – List available doctors.
- `POST /patient/book` – Book a slot.
- `GET /patient/appointments` – View all appointments.

---

##  AWS Lambda Deployment

We use the **Serverless Framework** to deploy the backend to AWS Lambda.

### 1. Install Serverless Framework
```
npm install -g serverless
```

### 2. Configure AWS CLI
```
aws configure
```

### 3. Deploy Backend
```
cd backend
serverless deploy
```

### 4. Update Frontend API URL
Update your frontend `.env` file to point to the Lambda API Gateway endpoint.

