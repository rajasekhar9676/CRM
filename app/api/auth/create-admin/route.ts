import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating admin user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    console.log('Password hashed successfully');
    
    // Try to create admin user
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: 'admin-user-id-123',
        email: 'admin@minicrm.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email'
      });

    if (error) {
      console.error('Error creating admin user:', error);
      return NextResponse.json({ 
        error: 'Failed to create admin user: ' + error.message,
        details: error
      }, { status: 500 });
    }

    console.log('Admin user created successfully:', data);

    return NextResponse.json({ 
      message: 'Admin user created successfully',
      email: 'admin@minicrm.com',
      password: 'admin123',
      data: data
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message,
      stack: (error as Error).stack
    }, { status: 500 });
  }
}
