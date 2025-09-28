import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Special handling for admin user
          if (credentials.email === 'admin@minicrm.com' && credentials.password === 'admin123') {
            // First, check if admin user already exists
            const { data: existingAdmin } = await supabase
              .from('users')
              .select('id, role')
              .eq('email', 'admin@minicrm.com')
              .single();

            let adminId = existingAdmin?.id;
            
            // If admin doesn't exist, create with a fixed UUID to avoid foreign key issues
            if (!adminId) {
              adminId = '00000000-0000-0000-0000-000000000001'; // Fixed admin UUID
              
              const hashedPassword = await bcrypt.hash('admin123', 12);
              
              const { error: createError } = await supabase
                .from('users')
                .insert({
                  id: adminId,
                  email: 'admin@minicrm.com',
                  name: 'Admin User',
                  password: hashedPassword,
                  role: 'admin',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });

              if (createError) {
                console.error('Error creating admin user:', createError);
              }
            } else {
              // Update existing admin user role if needed
              const { error: updateError } = await supabase
                .from('users')
                .update({
                  role: 'admin',
                  updated_at: new Date().toISOString(),
                })
                .eq('email', 'admin@minicrm.com');

              if (updateError) {
                console.error('Error updating admin user:', updateError);
              }
            }

            return {
              id: adminId,
              name: 'Admin User',
              email: 'admin@minicrm.com',
              image: null,
            }
          }

          // Check if user exists in Supabase
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single()

          if (error || !user) {
            return null
          }

          // Check if password matches using bcrypt
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          }
        } catch (error) {
          console.error('Error during credentials authentication:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Generate a proper UUID for the user
          const userId = crypto.randomUUID()

          // Check if user exists in Supabase by email
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single()

          if (!existingUser) {
            // Create new user in Supabase
            const { error } = await supabase
              .from('users')
              .insert({
                id: userId,
                name: user.name,
                email: user.email!,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })

            if (error) {
              console.error('Error creating user:', error)
              return false
            }

            // Update the user object with our generated ID
            user.id = userId
          } else {
            // Use existing user's ID
            user.id = existingUser.id
          }
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
  },
}
