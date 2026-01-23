# MediScan - Medicine Verification System

A comprehensive medicine verification system using QR codes, built with React, Node.js, MongoDB, and Clerk authentication.

## Features

- 🔐 **Clerk Authentication** - Secure user authentication and authorization
- 💊 **Medicine Registration** - Manufacturers can register medicine batches
- 📦 **Ownership Transfer** - Track medicine through supply chain
- 🔍 **QR Verification** - Public verification of medicine authenticity
- 📊 **Admin Dashboard** - Monitor scan logs and block counterfeit medicines
- 🗄️ **MongoDB Storage** - Persistent data storage with Mongoose ODM

## Tech Stack

### Frontend
- React 19.2.3
- TypeScript
- Vite
- Tailwind CSS 4.x
- Clerk React SDK
- Lucide Icons

### Backend
- Node.js
- Express 5.x
- MongoDB with Mongoose
- Clerk Node.js SDK
- QRCode generation
- Crypto for QR signature verification

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Clerk account (free tier available)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MediScan
```

### 2. Set Up Clerk

1. Go to [Clerk.com](https://clerk.com) and create a free account
2. Create a new application
3. Copy your **Publishable Key** and **Secret Key**

### 3. Backend Setup

```bash
cd backend
npm install
```

Create/update `.env` file in `backend/` directory:

```env
PORT=5000
MONGO_URL=mongodb://127.0.0.1:27017/pharma_noblock
QR_SECRET=YOUR_RANDOM_SECRET_KEY_FOR_QR
JWT_SECRET=YOUR_JWT_SECRET_FOR_FALLBACK

# Clerk Configuration
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Optional: Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

**Set up user roles in Clerk:**
1. In Clerk Dashboard, go to Users
2. Click on a user
3. Go to "Metadata" tab
4. Add public metadata:
   ```json
   {
     "role": "MANUFACTURER"
   }
   ```
   Available roles: `MANUFACTURER`, `DISTRIBUTOR`, `PHARMACY`, `CUSTOMER`, `ADMIN`

### 4. Frontend Setup

```bash
cd ..  # Back to root directory
npm install
```

Create `.env.local` file in root directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000

# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

### 5. Start MongoDB

Make sure MongoDB is running:

```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas cloud database
# Update MONGO_URL in backend/.env with your Atlas connection string
```

### 6. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## API Endpoints

### Authentication (Clerk-based)
- `GET /auth/profile` - Get current user profile
- `PUT /auth/role` - Update user role (Admin only)

### Medicine Management
- `GET /medicine/list` - Get all medicines (with optional filters)
- `POST /medicine/register` - Register new medicine (Manufacturer only)
- `POST /medicine/transfer/:batchID` - Transfer ownership
- `POST /medicine/block/:batchID` - Block medicine (Admin only)
- `GET /medicine/qrcode/:batchID` - Generate QR code
- `GET /medicine/verify/:batchID?sig=xxx` - Verify medicine (Public)

### Admin
- `GET /logs` - Get scan logs (Admin only)
- `GET /health` - Health check endpoint

## User Roles

1. **MANUFACTURER** - Can register medicines and transfer ownership
2. **DISTRIBUTOR** - Can transfer medicines in the supply chain
3. **PHARMACY** - Can receive and transfer medicines to customers
4. **CUSTOMER** - Can view and verify medicines
5. **ADMIN** - Can block medicines and view logs

## Security Features

- ✅ Clerk-based authentication with session tokens
- ✅ Role-based access control (RBAC)
- ✅ QR code signature verification
- ✅ CORS protection
- ✅ Input validation
- ✅ Secure MongoDB connections

## Development Notes

### Setting User Roles

Since we're using Clerk for authentication, user roles are stored in Clerk's user metadata:

1. **Via Clerk Dashboard:**
   - Go to Users → Select User → Metadata
   - Add to Public Metadata: `{ "role": "MANUFACTURER" }`

2. **Via API (Admin only):**
   ```bash
   PUT /auth/role
   Body: { "userId": "user_xxx", "role": "MANUFACTURER" }
   ```

### Database Schema

**Medicine Schema:**
```javascript
{
  batchID: String (unique),
  name: String,
  manufacturer: String,
  mfgDate: String,
  expDate: String,
  currentOwner: String (email),
  status: String (ACTIVE/BLOCKED),
  ownerHistory: [{ owner, role, time }],
  createdAt: Date
}
```

**ScanLog Schema:**
```javascript
{
  batchID: String,
  result: String,
  scanner: String,
  time: Date
}
```

## Improvements Made

1. ✅ **Replaced JWT with Clerk** - More secure, managed authentication
2. ✅ **Added API service layer** - Centralized API calls in frontend
3. ✅ **Improved error handling** - Better error messages and logging
4. ✅ **Added validation** - Input validation for all endpoints
5. ✅ **Added health check** - Monitor API status
6. ✅ **Improved CORS** - Configurable CORS for production
7. ✅ **Added .gitignore** - Prevent committing sensitive files
8. ✅ **Better response format** - Consistent API responses with `success` field
9. ✅ **Enhanced documentation** - Comprehensive README and code comments

## Future Enhancements

- [ ] Add email notifications via Clerk
- [ ] Implement blockchain for immutable records
- [ ] Add analytics dashboard
- [ ] Mobile app with QR scanner
- [ ] Multi-language support
- [ ] Export data to PDF/Excel
- [ ] Two-factor authentication
- [ ] Real-time notifications with WebSockets

## Troubleshooting

**MongoDB Connection Issues:**
- Ensure MongoDB is running
- Check connection string in `.env`
- Try using MongoDB Atlas if local connection fails

**Clerk Authentication Issues:**
- Verify Clerk keys are correct
- Check that user has role set in metadata
- Clear browser cache and cookies

**CORS Issues:**
- Update FRONTEND_URL in backend `.env`
- Check backend CORS configuration

## License

ISC

## Contributors

Built with ❤️ for safer medicine supply chains
