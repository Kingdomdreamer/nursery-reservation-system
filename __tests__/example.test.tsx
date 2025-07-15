import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Simple example test to verify the test environment is working
describe('Test Environment', () => {
  it('should render a basic component', () => {
    // Simple test component
    const TestComponent = () => <div>Test Component</div>
    
    render(<TestComponent />)
    
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })
})

// Test for utility functions
describe('Utility Functions', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-01')
    const formatted = date.toLocaleDateString('ja-JP')
    
    expect(formatted).toBe('2024/1/1')
  })
  
  it('should handle basic math operations', () => {
    expect(2 + 2).toBe(4)
    expect(10 - 5).toBe(5)
    expect(3 * 4).toBe(12)
    expect(8 / 2).toBe(4)
  })
})