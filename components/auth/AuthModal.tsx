'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)

  const switchToLogin = () => setMode('login')
  const switchToRegister = () => setMode('register')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-md ${mode === 'register' ? 'md:max-w-2xl' : ''} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-center">
            {mode === 'login' ? 'Sign In to BizMitra' : 'Create Your Account'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          {mode === 'login' ? (
            <LoginForm onSwitchToRegister={switchToRegister} />
          ) : (
            <RegisterForm onSwitchToLogin={switchToLogin} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
