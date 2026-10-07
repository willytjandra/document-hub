'use server'

import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export type LoginState = {
  error?: string
}

export const login = async (
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> => {
  const email = formData.get('email')
  const password = formData.get('password')

  if (typeof email !== 'string' || typeof password !== 'string') {
    return {
      error: 'Email and password are required.',
    }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      error: 'Invalid email or password.',
    }
  }

  redirect('/documents')
}
