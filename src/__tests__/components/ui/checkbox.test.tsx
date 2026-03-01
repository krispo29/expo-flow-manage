import { render, screen, fireEvent } from '@testing-library/react'
import { Checkbox } from '@/components/ui/checkbox'

describe('Checkbox Component', () => {
  describe('Basic Rendering', () => {
    it('should render a checkbox element', () => {
      render(<Checkbox data-testid="checkbox" />)
      
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toBeInTheDocument()
    })

    it('should render with custom className', () => {
      render(<Checkbox className="custom-checkbox" data-testid="checkbox" />)
      
      const checkbox = screen.getByTestId('checkbox')
      expect(checkbox).toHaveClass('custom-checkbox')
    })
  })

  describe('States', () => {
    it('should render unchecked by default', () => {
      render(<Checkbox />)
      
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()
    })

    it('should render checked state', () => {
      render(<Checkbox checked />)
      
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeChecked()
    })

    it('should render indeterminate state', () => {
      render(<Checkbox checked="indeterminate" />)
      
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBePartiallyChecked()
    })

    it('should render disabled state', () => {
      render(<Checkbox disabled />)
      
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeDisabled()
    })
  })

  describe('Interactions', () => {
    it('should handle change events', () => {
      const handleChange = jest.fn()
      render(<Checkbox onCheckedChange={handleChange} />)
      
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      
      expect(handleChange).toHaveBeenCalledWith(true)
    })

    it('should toggle from checked to unchecked', () => {
      const handleChange = jest.fn()
      render(<Checkbox checked onCheckedChange={handleChange} />)
      
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      
      expect(handleChange).toHaveBeenCalledWith(false)
    })

    it('should not change when disabled', () => {
      const handleChange = jest.fn()
      render(<Checkbox disabled onCheckedChange={handleChange} />)
      
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('With Label', () => {
    it('should render with label', () => {
      render(
        <>
          <Checkbox id="terms" />
          <label htmlFor="terms">Accept terms</label>
        </>
      )
      
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should render as checkbox role', () => {
      render(<Checkbox />)
      
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toBeInTheDocument()
    })
  })
})
