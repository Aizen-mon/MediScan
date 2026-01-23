# MediScan Setup Guide

This guide will walk you through setting up the MediScan application from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** - Either:
  - Local installation - [Download here](https://www.mongodb.com/try/download/community)
  - OR MongoDB Atlas (cloud) - [Sign up here](https://www.mongodb.com/cloud/atlas/register)
- **Git** - [Download here](https://git-scm.com/)

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd MediScan
```

## Step 2: Set Up Clerk Authentication

1. **Create a Clerk Account**
   - Go to [Clerk.com](https://clerk.com)
   - Click "Sign Up" and create a free account
   - Verify your email

2. **Create a New Application**
   - After logging in, click "Create Application"
   - Name it "MediScan" or any name you prefer
   - Choose your authentication methods (Email/Password is recommended)
   - Click "Create Application"

3. **Get Your API Keys**
   - Once created, you'll see your dashboard
   - Click on "API Keys" in the left sidebar
   - You'll see two keys:
     - **Publishable Key** (starts with `pk_test_...`)
     - **Secret Key** (starts with `sk_test_...`)
   - Keep this page open, you'll need these keys in the next steps

## Step 3: Configure Backend

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Edit the .env file**
   Open `backend/.env` in your text editor and update:

   ```env
   PORT=5000
   
   # MongoDB Configuration
   # For local MongoDB:
   MONGO_URL=mongodb://127.0.0.1:27017/pharma_noblock
   
   # OR for MongoDB Atlas:
   # MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/pharma_noblock
   
   # Security Keys (generate strong random strings)
   QR_SECRET=your_random_secret_key_for_qr_generation
   JWT_SECRET=your_jwt_secret_for_fallback
   
   # Clerk Keys (from Step 2)
   CLERK_SECRET_KEY=sk_test_paste_your_secret_key_here
   CLERK_PUBLISHABLE_KEY=pk_test_paste_your_publishable_key_here
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

   **Important:** Replace the placeholder values with actual keys!

## Step 4: Configure Frontend

1. **Navigate to root directory**
   ```bash
   cd ..  # Go back to project root
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env.local file**
   ```bash
   cp .env.example .env.local
   ```

4. **Edit the .env.local file**
   Open `.env.local` in your text editor:

   ```env
   # Backend API URL
   VITE_API_URL=http://localhost:5000
   
   # Clerk Publishable Key (from Step 2)
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_paste_your_publishable_key_here
   ```

## Step 5: Start MongoDB

### Option A: Local MongoDB

```bash
# macOS (if installed via Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# MongoDB should start automatically as a service
# Or run: net start MongoDB
```

Verify MongoDB is running:
```bash
mongosh  # or mongo (for older versions)
# You should see a MongoDB shell prompt
```

### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign in and create a cluster (free tier available)
3. Get your connection string
4. Add it to `backend/.env` as MONGO_URL
5. Make sure to whitelist your IP address in Atlas security settings

## Step 6: Start the Application

You'll need **two terminal windows**.

### Terminal 1: Start Backend

```bash
cd backend
npm start
```

You should see:
```
✅ MongoDB Connected
✅ Server running on http://localhost:5000
```

### Terminal 2: Start Frontend

```bash
# In the project root directory
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

## Step 7: Access the Application

1. Open your browser and go to: **http://localhost:5173**

2. You'll see the MediScan login page with Clerk authentication

## Step 8: Create Your First User and Set Role

1. **Sign Up**
   - Click "Sign Up" on the Clerk form
   - Enter your email and password
   - Verify your email if required

2. **Set Your User Role**
   
   By default, users are assigned the "CUSTOMER" role. To test other features, you need to assign a different role:

   **Method 1: Via Clerk Dashboard (Recommended)**
   
   a. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   
   b. Click on your application
   
   c. Click "Users" in the left sidebar
   
   d. Click on your user
   
   e. Click the "Metadata" tab
   
   f. Under "Public metadata", click "Edit"
   
   g. Add this JSON:
   ```json
   {
     "role": "MANUFACTURER"
   }
   ```
   
   h. Click "Save"
   
   i. Refresh your MediScan application page
   
   **Available Roles:**
   - `MANUFACTURER` - Can register new medicines
   - `DISTRIBUTOR` - Can transfer medicines in supply chain
   - `PHARMACY` - Can receive and distribute medicines
   - `CUSTOMER` - Can verify medicines
   - `ADMIN` - Can block medicines and view logs

3. **Start Using MediScan!**
   - You should now see the dashboard with features based on your role
   - If you set role to MANUFACTURER, try registering a medicine
   - Generate QR codes for verification
   - Test the verification system

## Step 9: Testing Different Roles

To test different roles, you can:

1. **Create multiple users** with different email addresses
2. **Assign different roles** to each user via Clerk Dashboard
3. **Test the workflow:**
   - Manufacturer registers medicine
   - Transfer to Distributor
   - Transfer to Pharmacy
   - Customer verifies medicine

## Troubleshooting

### MongoDB Connection Issues

**Error:** `MongoDB Error: connect ECONNREFUSED`

**Solution:**
- Make sure MongoDB is running
- Check your MONGO_URL in `.env`
- For local: verify MongoDB service is active
- For Atlas: check connection string and whitelist your IP

### Clerk Authentication Issues

**Error:** `Missing Clerk Publishable Key`

**Solution:**
- Verify `.env.local` has the correct `VITE_CLERK_PUBLISHABLE_KEY`
- Make sure you copied the **Publishable Key**, not the Secret Key
- Restart the frontend dev server after adding the key

**Error:** `Clerk auth error: Invalid session token`

**Solution:**
- Check that backend `.env` has the correct `CLERK_SECRET_KEY`
- Make sure both frontend and backend are using keys from the same Clerk application
- Clear browser cookies and sign in again

### CORS Issues

**Error:** CORS policy errors in browser console

**Solution:**
- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Default should be `http://localhost:5173`
- Restart backend server after changing

### Port Already in Use

**Error:** `Port 5000 is already in use`

**Solution:**
```bash
# Find and kill the process using port 5000
# macOS/Linux:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# OR change the port in backend/.env
PORT=5001
```

### Dependencies Issues

**Error:** Package installation fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Customize the application** for your specific use case
2. **Add more users** with different roles to test the complete workflow
3. **Set up production deployment** (see deployment guide in README.md)
4. **Configure email notifications** via Clerk
5. **Explore Clerk features** like multi-factor authentication

## Getting Help

- **Clerk Documentation:** https://clerk.com/docs
- **MongoDB Documentation:** https://docs.mongodb.com/
- **Project Issues:** Check the GitHub repository issues section

## Security Notes

🔒 **Important Security Reminders:**

1. **Never commit `.env` files** to version control
2. **Use strong, random secrets** for QR_SECRET and JWT_SECRET
3. **Keep Clerk Secret Key private** - never expose in frontend code
4. **Change default secrets** in production
5. **Use MongoDB Atlas** with proper access controls for production
6. **Enable HTTPS** in production environments

---

**Congratulations!** 🎉 You've successfully set up MediScan!

For more information, check the main README.md file.
