'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export type SignUpState = {
  error?: string
}

export const signUp = async (
  _previousState: SignUpState,
  formData: FormData
): Promise<SignUpState> => {
  const email = formData.get('email')
  const password = formData.get('password')

  if (typeof email !== 'string' || typeof password !== 'string') {
    return {
      error: 'Email and password are required.',
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    if (error.code === 'weak_password') {
      return {
        error: 'Please choose a stronger password.',
      }
    }

    return {
      error: 'Unable to create your account. Please try again.',
    }
  }

  redirect('/auth/check-email')
}