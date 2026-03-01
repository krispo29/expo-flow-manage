import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('should render correctly', () => {
    render(<Input data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toBeInTheDocument()
  })

  it('should have correct data-slot attribute', () => {
    render(<Input data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('data-slot', 'input')
  })

  it('should accept placeholder prop', () => {
    render(<Input placeholder="Enter text" data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('placeholder', 'Enter text')
  })

  it('should accept type prop', () => {
    render(<Input type="password" data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('should accept default value', () => {
    render(<Input defaultValue="test value" data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveValue('test value')
  })

  it('should handle onChange event', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} data-testid="input" />)
    
    const input = screen.getByTestId('input')
    fireEvent.change(input, { target: { value: 'new value' } })
    
    expect(handleChange).toHaveBeenCalled()
  })

  it('should be disabled when disabled prop is set', () => {
    render(<Input disabled data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toBeDisabled()
  })

  it('should accept custom className', () => {
    render(<Input className="custom-input-class" data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveClass('custom-input-class')
  })

  it('should accept name prop', () => {
    render(<Input name="username" data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('name', 'username')
  })

  it('should accept id prop', () => {
    render(<Input id="email-input" data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('id', 'email-input')
  })

  it('should filter Thai characters on change', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} data-testid="input" />)
    
    const input = screen.getByTestId('input')
    
    // Input contains Thai characters
    fireEvent.change(input, { target: { value: 'helloสวัสดี' } })
    
    // Value should be filtered to only contain non-Thai characters
    expect(input).toHaveValue('hello')
  })

  it('should handle aria-invalid prop', () => {
    render(<Input aria-invalid="true" data-testid="input" />)
    
    const input = screen.getByTestId('input')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })
})
