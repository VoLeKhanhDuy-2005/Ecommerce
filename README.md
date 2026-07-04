# Fullstack Web Application

A professional, production-ready Fullstack Web Application built with the modern MERN stack (MongoDB, Express, React, Node.js). Designed with performance, scalability, and security in mind.

## Table of Contents
- [Technologies Used](#technologies-used)
  - [Backend (`ExpressJS01`)](#backend-expressjs01)
  - [Frontend (`ReactJS01`)](#frontend-reactjs01)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
  - [Prerequisites](#prerequisites)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Backend Setup (`ExpressJS01`)](#2-backend-setup-expressjs01)
  - [3. Frontend Setup (`ReactJS01`)](#3-frontend-setup-reactjs01)
- [Key Features](#key-features)
- [Author](#author)

## Technologies Used

### Backend (`ExpressJS01`)
- **Core Framework**: Node.js & Express v5
- **Database**: MongoDB (Mongoose)
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens), bcrypt
- **File Uploads & Storage**: Multer, AWS S3 (`@aws-sdk/client-s3`)
- **Image Processing**: Sharp
- **Security & Middlewares**: CORS, Cookie-parser, dotenv

### Frontend (`ReactJS01`)
- **Core Framework**: React 19 + Vite
- **Styling & UI**: Tailwind CSS, Ant Design (antd)
- **Icons & Assets**: Lucide React, Swiper (Carousels)
- **Routing**: React Router v7
- **Data Fetching & State**: Axios
- **Form Validation**: Zod

---

## Project Structure

```text
.
├── ExpressJS01/        # Backend API Service
│   ├── src/            # Controllers, Models, Routes, Middlewares, Services
│   └── package.json    # Backend dependencies and scripts
├── ReactJS01/          # Frontend Web Client
│   ├── src/            # React Components, Pages, Context, Utils
│   └── package.json    # Frontend dependencies and scripts
└── README.md           # Project documentation
```

---

## Installation & Setup

### Prerequisites
Make sure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)
- [Redis](https://redis.io/)

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd VoLeKhanhDuy_23110196_FullStackNodeJS01_11_05_2026
```

### 2. Backend Setup (`ExpressJS01`)
Open a terminal and navigate to the backend directory:
```bash
cd ExpressJS01
npm install
```

Create a `.env` file in the `ExpressJS01` directory and configure the required environment variables:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_url
JWT_SECRET=your_jwt_secret_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_aws_s3_bucket
```

Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup (`ReactJS01`)
Open a new terminal and navigate to the frontend directory:
```bash
cd ReactJS01
npm install
```

Start the frontend development server:
```bash
npm run dev
```

---

## Key Features

- **Secure Authentication & Authorization**: Robust user authentication flow using JWT stored securely in cookies, and password hashing via bcrypt.
- **High Performance & Scalability**: Optimized with Redis caching on the backend to reduce database load, alongside Vite's ultra-fast HMR on the frontend.
- **Cloud Storage Integration**: Seamless file and media uploads directly to AWS S3, utilizing `sharp` for on-the-fly image optimization and resizing.
- **Modern & Responsive UI**: Beautifully crafted interface using Tailwind CSS and Ant Design, ensuring a highly responsive and accessible user experience across all devices.
- **Robust Data Validation**: Comprehensive request validation on both the client (using `Zod`) and server sides.

---

## Deploy information
- BE: render

- FE: vercel

- link: https://ecommerce-rho-opal-64.vercel.app/

- email: admin@ecommerce.com - pass: 123456

- email: vlkd1001@gmail.com - pass: 123456

---

## Author
**Võ Lê Khánh Duy**