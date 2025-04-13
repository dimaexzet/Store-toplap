import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SignUpPage from '@/app/(auth)/sign-up/page'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

// Mock the modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('next-auth/react', () => ({
  signIn: jest.fn()
}))

describe('SignUpPage', () => {
  const mockPush = jest.fn()
  const mockRefresh = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup router mock implementation
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh
    })
    
    // Setup fetch mock
    global.fetch = jest.fn()
  })
  
  it('renders the signup form correctly', () => {
    render(<SignUpPage />)
    
    expect(screen.getByText('Create an account')).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByText('Already have an account?')).toBeInTheDocument()
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })
  
  it('shows error when passwords do not match', async () => {
    render(<SignUpPage />)
    
    // Fill in the form with non-matching passwords
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password456' } })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    })
    
    // Ensure fetch was not called
    expect(global.fetch).not.toHaveBeenCalled()
  })
  
  it('handles successful registration', async () => {
    // Mock successful fetch response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Registration successful' })
    })
    
    // Mock successful sign in
    ;(signIn as jest.Mock).mockResolvedValueOnce({ ok: true })
    
    render(<SignUpPage />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    
    await waitFor(() => {
      // Check if fetch was called with correct params
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      })
      
      // Check if signIn was called
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        email: 'test@example.com',
        password: 'password123',
      })
      
      // Check if router.push was called
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })
  
  it('handles registration failure', async () => {
    const errorMessage = 'Email already exists'
    
    // Mock failed fetch response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: errorMessage })
    })
    
    render(<SignUpPage />)
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } })
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }))
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
    
    // Ensure router was not called
    expect(mockPush).not.toHaveBeenCalled()
  })
}) 