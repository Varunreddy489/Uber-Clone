# Ride-Sharing Platform

## Overview

This is a comprehensive ride-sharing platform built using Node.js, Express, and TypeScript. The platform provides a robust and scalable solution for managing ride requests, driver assignments, and payment processing. It also includes features for user authentication, notification management, and analytics.

## Project Structure

 node_modules/ # Dependencies  
 prisma/ # Prisma schema and migrations  
 src/  
	├── config/ # App configurations (DB, Redis, Logger, Mail, etc.)  
	├── controllers/ # Route controllers (Auth, Driver, Ride, User, Wallet, etc.)  
	├── generated/ # Auto-generated files (Prisma client)  
	├── helper/ # Helper utilities (distance calc, faker, file helpers, etc.)  
	├── jobs/ # Cron jobs and background tasks  
	├── middleware/ # Express middlewares (auth, upload, validation)  
	├── routes/ # API route definitions (v1 - auth, driver, ride, user, wallet)  
	├── seed/ # Database seeders (driver, user, vehicle)  
	├── services/ # Business logic (auth, driver, fare, mail, payment, etc.)  
	├── socket/ # WebSocket / Socket.IO setup  
	├── utils/ # Utility functions, constants, error handling  
	├── validations/ # Request validations (auth, ride, server, file)  
	├── workers/ # Queue workers (cache, location, notification, payment)  
	├── app.ts # Express app setup  
	└── server.ts # Server entry point
├── tests/ # Test cases  
├── .dockerignore # Docker ignore rules  
├── .env # Environment variables  
├── .gitignore # Git ignore rules  
├── docker-compose.yaml # Docker Compose setup  
├── Dockerfile # Docker build file  
├── jest.config.js # Jest config for testing  
├── package.json # Project dependencies  
├── pnpm-lock.yaml # PNPM lock file  
├── tsconfig.json # TypeScript configuration  
├── README.md # Project documentation

## Features

- **User Management**: Register, login, and manage profiles  
- **Ride Management**: Request rides, accept/decline rides  
- **Driver Management**: Manage driver profiles, view ride requests, update status  
- **Payment Processing**: Secure payments via **Stripe**  
- **Notification Management**: Notifications for ride requests, updates, cancellations using **BullMQ**  
- **Analytics**: Insights into ride usage, driver performance, and revenue  

## Architecture

- **Backend**: Node.js, Express, TypeScript  
- **Database**: Prisma ORM  
- **API**: RESTful APIs  
- **Security**: JWT authentication & authorization  
- **Payment Gateway**: Stripe integration  
- **Notification Service**: BullMQ  

## Getting Started

### Clone the repository:

```
git clone https://github.com/your-repo/ride-sharing-platform.git
```

### Install dependencies:

```
pnpm install
```

### Start the server:

```
pnpm run dev
```

___

[SWAGGER Docs](http://localhost:5000/api/docs)
## API Endpoints

### Auth Routes

- `POST /api/v1/auth/register` → Register a new user  
- `POST /api/v1/auth/login` → Login user  
- `POST /api/v1/auth/logout` → Logout user  
- `POST /api/v1/auth/refresh` → Refresh JWT token  
- `POST /api/v1/auth/forgot-password` → Request password reset  
- `POST /api/v1/auth/verify-otp` → Verify OTP for password reset  
- `POST /api/v1/auth/reset-password` → Reset user password  

---
### Driver Routes

- `GET /api/v1/driver/` → Get all available drivers  
- `PUT /api/v1/driver/:driverId` → Update driver location  
- `PUT /api/v1/driver/:driverId/upload-docs` → Upload driver documents (License, Govt Proof) & create profile  
- `PUT /api/v1/driver/:driverId/status` → Toggle driver status (active/inactive)  
- `GET /api/v1/driver/:driverId/status` → Get driver status  
- `POST /api/v1/driver/:driverId/vehicle` → Register driver vehicle  

---
### Ride Routes

- `POST /api/v1/rides/:driverId` → Request a new ride  
- `GET /api/v1/rides/:location/:destination` → Get all available rides for a route  
- `PATCH /api/v1/rides/:rideRequestId` → Update ride request status (accept/decline)  
- `PATCH /api/v1/rides/:rideId` → Mark ride pickup status  
- `POST /api/v1/rides/:rideId/:driverId/rating` → Rate a driver for a completed ride  

---
### User Routes

- `PUT /api/v1/user/:userId` → Change user role (e.g., rider/driver)  
- `GET /api/v1/user/:userId` → Get user details by ID  

---
### Wallet Routes

- `POST /api/v1/wallet/topup/intent` → Create a wallet top-up intent  
- `GET /api/v1/wallet/topup/intent` → Confirm wallet top-up success  
- `GET /api/v1/wallet/user` → Get user wallet stats  
- `GET /api/v1/wallet/driver` → Get driver wallet stats  
- `POST /api/v1/wallet/refund` → Process a wallet refund  
