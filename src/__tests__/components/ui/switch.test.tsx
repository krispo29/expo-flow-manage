import { render, screen, fireEvent } from '@testing-library/react'
import { Switch } from '@/components/ui/switch'

describe('Switch Component', () => {
  describe('Basic Rendering', () => {
    it('should render a switch element', () => {
      render(<Switch data-testid="switch" />)
      
      const switchEl = screen.getByTestId('switch')
      expect(switchEl).toBeInTheDocument()
      expect(switchEl).toHaveAttribute('data-slot', 'switch')
    })

    it('should render with custom className', () => {
      render(<Switch className="custom-switch" data-testid="switch" />)
      
      const switchEl = screen.getByTestId('switch')
      expect(switchEl).toHaveClass('custom-switch')
    })
  })

  describe('States', () => {
    it('should render unchecked by default', () => {
      render(<Switch />)
      
      const switchEl = screen.getByRole('switch', { name: '' })
      expect(switchEl).not.toBeChecked()
    })

    it('should render checked state', () => {
      render(<Switch checked />)
      
      const switchEl = screen.getByRole('switch', { name: '' })
      expect(switchEl).toBeChecked()
    })

    it('should render disabled state', () => {
      render(<Switch disabled />)
      
      const switchEl = screen.getByRole('switch', { name: '' })
      expect(switchEl).toBeDisabled()
    })
  })

  describe('Interactions', () => {
    it('should handle change events', () => {
      const handleChange = jest.fn()
      render(<Switch onCheckedChange={handleChange} />)
      
      const switchEl = screen.getByRole('switch', { name: '' })
      fireEvent.click(switchEl)
      
      expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('should toggle from checked to unchecked', () => {
      const handleChange = jest.fn()
      render(<Switch checked onCheckedChange={handleChange} />)
      
      const switchEl = screen.getByRole('switch', { name: '' })
      fireEvent.click(switchEl)
      
      expect(handleChange).toHaveBeenCalledWith(false)
    })

    it('should not change when disabled', () => {
      const handleChange = jest.fn()
      render(<Switch disabled onCheckedChange={handleChange} />)
      
      const switchEl = screen.getByRole('switch', { name: '' })
      fireEvent.click(switchEl)
      
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should render as a switch role', () => {
      render(<Switch />)
      
      const switchEl = screen.getByRole('switch', { name: '' })
      expect(switchEl).toBeInTheDocument()
    })
  })
})
