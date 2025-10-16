# BizMitra - Customer Management System

A complete Next.js 14 + TypeScript + Tailwind + Firebase PWA for managing customers, orders, and invoices.

## Features

### 🔐 Authentication
- Google OAuth login with Firebase Auth
- Secure user profile management
- Protected routes and data access

### 👥 Customer Management
- CRUD operations for customers
- Customer profiles with contact information
- Instagram handle integration
- Tags and notes system
- WhatsApp messaging integration

### 📦 Order Tracking
- Create and manage orders
- Link orders to customers
- Order status tracking (New, In Progress, Completed, Paid)
- Item-based order management
- Due date tracking

### 🧾 Invoice Generation
- Generate invoices from orders or manually
- PDF generation capability
- WhatsApp invoice sharing
- Payment status tracking
- Invoice management

### 📊 Dashboard & Analytics
- Real-time business metrics
- Customer, order, and revenue statistics
- Quick action buttons
- Visual data representation

### 📱 PWA Features
- Installable on mobile devices
- Offline functionality
- Service worker implementation
- Mobile-responsive design

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **PDF Generation**: jsPDF
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- Firebase project
- Google Cloud Console setup

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd minicrm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Create a new Firebase project
   - Enable Authentication (Google provider)
   - Enable Firestore Database
   - Enable Storage
   - Get your Firebase config

4. **Environment Variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
minicrm/
├── app/                    # Next.js 14 App Router
│   ├── dashboard/         # Dashboard pages
│   ├── customers/         # Customer management
│   ├── orders/           # Order management
│   ├── invoices/         # Invoice management
│   ├── settings/         # Settings page
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
│   ├── ui/              # shadcn/ui components
│   └── layout/          # Layout components
├── context/             # React contexts
├── hooks/               # Custom hooks
├── lib/                 # Utilities and configs
├── types/               # TypeScript type definitions
├── public/              # Static assets
│   ├── manifest.json    # PWA manifest
│   └── sw.js           # Service worker
└── firestore.rules     # Firestore security rules
```

## Firebase Setup

### Authentication
1. Go to Firebase Console > Authentication
2. Enable Google sign-in provider
3. Add your domain to authorized domains

### Firestore Database
1. Create a Firestore database
2. Deploy the provided security rules
3. The app will automatically create collections

### Storage
1. Enable Firebase Storage
2. Set up storage rules for file uploads

## Security Rules

The app includes comprehensive Firestore security rules that ensure:
- Users can only access their own data
- All operations require authentication
- Data ownership is enforced at the database level

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Netlify
1. Build the project: `npm run build`
2. Deploy the `out` folder to Netlify
3. Add environment variables

### Manual Deployment
1. Build the project: `npm run build`
2. Start the production server: `npm start`

## Features in Detail

### Customer Management
- Add customers with contact information
- Tag customers for easy categorization
- WhatsApp integration for quick messaging
- Instagram handle linking
- Search and filter functionality

### Order Management
- Create orders linked to customers
- Track order status through workflow
- Item-based order structure
- Due date management
- Order notes and details

### Invoice System
- Generate invoices from orders
- Manual invoice creation
- PDF generation and download
- WhatsApp sharing
- Payment status tracking

### Dashboard Analytics
- Total customers count
- Pending/completed orders
- Revenue tracking
- Quick action buttons
- Real-time updates

## PWA Features

- **Installable**: Add to home screen on mobile
- **Offline**: Basic functionality works offline
- **Responsive**: Optimized for all screen sizes
- **Fast**: Service worker caching

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.

---

Built with ❤️ using Next.js, Firebase, and modern web technologies.

