# Admin Panel Setup Guide

This guide will help you set up the admin panel for your MiniCRM application.

## 🗄️ Database Setup

### 1. Run the SQL Schema
Execute the SQL commands in `ADMIN_SCHEMA.sql` in your Supabase SQL Editor:

```sql
-- This will create the profiles table with role-based access control
-- See ADMIN_SCHEMA.sql for the complete schema
```

## 🔑 Admin Access Setup

### 1. Create Admin User
After running the schema, you need to promote a user to admin:

```sql
-- Replace 'user-email@example.com' with the email of the user you want to make admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'user-email@example.com';
```

### 2. Verify Admin Access
- Sign in with the admin user account
- Navigate to `/admin` to access the admin panel
- Only users with `role = 'admin'` can access admin routes

## 📋 Features Implemented

### ✅ Admin Dashboard (`/admin`)
- **Overview Cards**: Total users, Pro/Business subscribers, invoices this month
- **Quick Stats**: Customer count, product count, revenue overview
- **Recent Activity**: Real-time activity feed
- **Revenue Breakdown**: Monthly revenue by plan

### ✅ Users Management (`/admin/users`)
- **User List**: View all users with their roles and subscriptions
- **Role Management**: Change user roles (user/admin)
- **Subscription Management**: Change user subscription plans
- **Search & Filter**: Search by email/name, filter by role
- **CSV Export**: Export user data

### ✅ Customers Management (`/admin/customers`)
- **Customer Overview**: View all customers across the platform
- **Owner Information**: See which user owns each customer
- **Contact Details**: Email, phone, Instagram handles
- **Tags Display**: Customer tags and categorization
- **CSV Export**: Export customer data

### ✅ Invoices Management (`/admin/invoices`)
- **Invoice List**: View all invoices across the platform
- **Revenue Stats**: Total revenue, paid revenue tracking
- **Status Tracking**: Paid/unpaid invoice status
- **Customer & Owner Info**: Complete invoice context
- **CSV Export**: Export invoice data

### ✅ Products Management (`/admin/products`)
- **Product Catalog**: View all products across the platform
- **Product Stats**: Total products, active products, total value
- **Category Tracking**: Product categories and organization
- **Image Display**: Product images and thumbnails
- **CSV Export**: Export product data

### ✅ Analytics Dashboard (`/admin/analytics`)
- **Charts & Visualizations**:
  - Users by Plan (Pie Chart)
  - Invoices per Month (Bar Chart)
  - User Growth (Line Chart)
  - Revenue by Plan (Bar Chart)
- **Key Metrics**: Total users, subscribers, monthly revenue
- **Data Export**: Analytics data export

## 🎨 UI Features

### ✅ Responsive Design
- **Mobile-First**: Collapsible sidebar on mobile
- **Desktop Optimized**: Full sidebar on desktop
- **Tablet Friendly**: Adaptive layout for tablets

### ✅ Navigation
- **Sidebar Navigation**: Easy access to all admin sections
- **Active States**: Visual indication of current page
- **User Info**: Admin user details in sidebar
- **Sign Out**: Easy logout functionality

### ✅ Data Tables
- **Sortable Columns**: Click to sort data
- **Search Functionality**: Real-time search across data
- **Pagination**: Handle large datasets efficiently
- **Responsive Tables**: Mobile-friendly table display

## 🔒 Security Features

### ✅ Role-Based Access Control
- **Database Level**: RLS policies enforce admin-only access
- **Application Level**: Route protection middleware
- **UI Level**: Admin-only components and features

### ✅ Data Protection
- **User Isolation**: Users can only see their own data in regular app
- **Admin Override**: Admins can see all data across platform
- **Secure Queries**: All database queries use proper authentication

## 🚀 Usage Instructions

### 1. Access Admin Panel
1. Sign in with an admin account
2. Navigate to `/admin`
3. Use the sidebar to access different sections

### 2. Manage Users
1. Go to `/admin/users`
2. Search for specific users
3. Change roles or subscriptions using dropdowns
4. Export data using the CSV button

### 3. View Analytics
1. Go to `/admin/analytics`
2. View charts and metrics
3. Export analytics data
4. Refresh data as needed

### 4. Export Data
1. Navigate to any management section
2. Click "Export CSV" button
3. Download will start automatically
4. Data includes all relevant fields

## 🔧 Technical Implementation

### Database Schema
- **profiles table**: Extended user information with roles
- **RLS policies**: Secure data access based on roles
- **Views**: Optimized queries for admin dashboard
- **Triggers**: Automatic profile creation on user signup

### API Integration
- **Supabase Queries**: Efficient data fetching
- **Real-time Updates**: Live data refresh
- **Error Handling**: Comprehensive error management
- **Loading States**: User-friendly loading indicators

### UI Components
- **Reusable Components**: Consistent admin interface
- **Responsive Layout**: Mobile-first design approach
- **Charts Integration**: Recharts for data visualization
- **Export Functionality**: CSV generation and download

## 📊 Analytics Features

### Charts Available
1. **Users by Plan**: Pie chart showing subscription distribution
2. **Invoices per Month**: Bar chart of monthly invoice creation
3. **User Growth**: Line chart of cumulative user growth
4. **Revenue by Plan**: Bar chart of monthly revenue breakdown

### Metrics Tracked
- Total users across all plans
- Active Pro and Business subscribers
- Monthly invoice creation trends
- Revenue generation by plan
- User growth over time

## 🛠️ Troubleshooting

### Common Issues

1. **Cannot access `/admin`**
   - Check if user has admin role in profiles table
   - Verify RLS policies are properly set up
   - Check browser console for errors

2. **Data not loading**
   - Verify Supabase connection
   - Check database permissions
   - Review error logs in console

3. **Charts not displaying**
   - Ensure recharts is installed
   - Check data format for charts
   - Verify responsive container setup

### Debug Mode
Enable debug logging by checking browser console for detailed error messages.

## 📈 Next Steps

1. **Set up admin user** using the SQL commands
2. **Test admin access** by navigating to `/admin`
3. **Explore all sections** to familiarize with features
4. **Set up regular monitoring** of platform metrics
5. **Customize analytics** based on your needs

## 🔍 Monitoring

### Key Metrics to Watch
- User growth rate
- Subscription conversion rates
- Revenue trends
- Customer acquisition
- Product catalog growth

### Regular Tasks
- Monitor user registrations
- Check subscription statuses
- Review revenue reports
- Analyze user behavior
- Export data for external analysis

The admin panel is now fully functional and ready for production use! 🚀


