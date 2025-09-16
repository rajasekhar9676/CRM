# Business Profile Setup

## Database Schema Update

Run this SQL in your Supabase SQL Editor to add business profile fields to the users table:

```sql
-- Add business profile columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_zip VARCHAR(20),
ADD COLUMN IF NOT EXISTS business_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS business_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_website VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_tax_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS business_logo_url TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Update existing users to have default business name if they have business_name from registration
UPDATE users 
SET business_name = COALESCE(business_name, 'My Business')
WHERE business_name IS NULL;
```

## Business Profile Fields

The following fields will be available for business profile:

- **business_name**: Company/Business name
- **business_address**: Street address
- **business_city**: City
- **business_state**: State/Province
- **business_zip**: ZIP/Postal code
- **business_phone**: Business phone number
- **business_email**: Business email
- **business_website**: Business website URL
- **business_tax_id**: Tax ID/VAT number
- **business_logo_url**: Logo image URL (for future use)

## Features

- ✅ Business profile form in settings
- ✅ PDF generation with real business details
- ✅ Invoice customization with business branding
- ✅ Professional invoice appearance
