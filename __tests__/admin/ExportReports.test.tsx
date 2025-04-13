import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ExportReports } from '@/components/admin/export-reports'

// Mock the fetch API
global.fetch = jest.fn()

describe('ExportReports Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock the URL creation and DOM manipulation
    global.URL.createObjectURL = jest.fn(() => 'mock-url')
    global.URL.revokeObjectURL = jest.fn()
    
    // Mock document functions
    document.createElement = jest.fn().mockImplementation(tag => {
      if (tag === 'a') {
        return {
          href: '',
          download: '',
          click: jest.fn(),
          setAttribute: jest.fn()
        }
      }
      return document.createElement(tag)
    })
    document.body.appendChild = jest.fn()
    document.body.removeChild = jest.fn()
  })

  it('renders the export reports component correctly', () => {
    render(<ExportReports />)
    
    // Check if component renders with all its elements
    expect(screen.getByText('Export & Reports')).toBeInTheDocument()
    expect(screen.getByText('Export data and generate reports for your business analytics')).toBeInTheDocument()
    
    // Date selectors
    expect(screen.getByText('Start Date')).toBeInTheDocument()
    expect(screen.getByText('End Date')).toBeInTheDocument()
    
    // Data type selector
    expect(screen.getByText('Data Type')).toBeInTheDocument()
    
    // Export format buttons
    expect(screen.getByText('CSV')).toBeInTheDocument()
    expect(screen.getByText('PDF')).toBeInTheDocument()
    
    // Export button
    expect(screen.getByText(/Export/)).toBeInTheDocument()
  })

  it('allows selecting different export formats', () => {
    render(<ExportReports />)
    
    // Test CSV button
    const csvButton = screen.getByText('CSV')
    fireEvent.click(csvButton)
    expect(csvButton.closest('button')).toHaveClass('bg-primary')
    
    // Test PDF button
    const pdfButton = screen.getByText('PDF')
    fireEvent.click(pdfButton)
    expect(pdfButton.closest('button')).toHaveClass('bg-primary')
    expect(csvButton.closest('button')).not.toHaveClass('bg-primary')
  })

  it('handles successful CSV export', async () => {
    // Mock a successful fetch response
    const mockBlob = new Blob(['mock csv content'], { type: 'text/csv' })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob
    })
    
    render(<ExportReports />)
    
    // Trigger the export
    const exportButton = screen.getByText(/Export orders/i)
    fireEvent.click(exportButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(document.body.appendChild).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalled()
    })
  })

  it('handles failed export', async () => {
    // Mock console.error and window.alert
    const originalConsoleError = console.error
    const originalAlert = window.alert
    console.error = jest.fn()
    window.alert = jest.fn()
    
    // Mock a failed fetch response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Export failed' })
    })
    
    render(<ExportReports />)
    
    // Trigger the export
    const exportButton = screen.getByText(/Export orders/i)
    fireEvent.click(exportButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith('Failed to export data. Please try again.')
    })
    
    // Restore original functions
    console.error = originalConsoleError
    window.alert = originalAlert
  })

  it('handles PDF export format', async () => {
    // Mock a successful fetch response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'PDF generation is not implemented in this demo' })
    })
    
    // Mock window.alert
    const originalAlert = window.alert
    window.alert = jest.fn()
    
    render(<ExportReports />)
    
    // Switch to PDF format
    fireEvent.click(screen.getByText('PDF'))
    
    // Trigger the export
    const exportButton = screen.getByText(/Export orders/i)
    fireEvent.click(exportButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
      expect(window.alert).toHaveBeenCalledWith('PDF generation is not implemented in this demo')
    })
    
    // Restore original function
    window.alert = originalAlert
  })

  it('disables export button when generating export', async () => {
    // Make fetch take some time to resolve
    ;(global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => 
          resolve({
            ok: true,
            blob: async () => new Blob(['mock csv content'], { type: 'text/csv' })
          }), 
          100
        )
      )
    )
    
    render(<ExportReports />)
    
    // Trigger the export
    const exportButton = screen.getByText(/Export orders/i)
    fireEvent.click(exportButton)
    
    // Button should show loading state
    expect(screen.getByText('Generating...')).toBeInTheDocument()
    expect(exportButton).toBeDisabled()
    
    // Wait for the operation to complete
    await waitFor(() => {
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument()
    })
  })
}) 