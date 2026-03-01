import { render, screen, fireEvent } from '@testing-library/react'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea Component', () => {
  describe('Basic Rendering', () => {
    it('should render a textarea element', () => {
      render(<Textarea data-testid="textarea" />)
      
      const textarea = screen.getByTestId('textarea')
      expect(textarea).toBeInTheDocument()
      expect(textarea).toHaveAttribute('data-slot', 'textarea')
    })

    it('should render with placeholder', () => {
      render(<Textarea placeholder="Enter text here" />)
      
      const textarea = screen.getByPlaceholderText('Enter text here')
      expect(textarea).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Textarea className="custom-textarea" data-testid="textarea" />)
      
      const textarea = screen.getByTestId('textarea')
      expect(textarea).toHaveClass('custom-textarea')
    })
  })

  describe('States', () => {
    it('should render with default value', () => {
      render(<Textarea defaultValue="Initial text" />)
      
      const textarea = screen.getByDisplayValue('Initial text')
      expect(textarea).toBeInTheDocument()
    })

    it('should render disabled state', () => {
      render(<Textarea disabled />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeDisabled()
    })

    it('should render readonly state', () => {
      render(<Textarea readOnly value="Read only text" />)
      
      const textarea = screen.getByDisplayValue('Read only text')
      expect(textarea).toHaveAttribute('readonly')
    })
  })

  describe('Attributes', () => {
    it('should have correct rows attribute', () => {
      render(<Textarea rows={5} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('rows', '5')
    })

    it('should have correct cols attribute', () => {
      render(<Textarea cols={50} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('cols', '50')
    })

    it('should have maxLength attribute', () => {
      render(<Textarea maxLength={100} />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('maxLength', '100')
    })
  })

  describe('Interactions', () => {
    it('should handle change events', () => {
      const handleChange = jest.fn()
      render(<Textarea onChange={handleChange} />)
      
      const textarea = screen.getByRole('textbox')
      fireEvent.change(textarea, { target: { value: 'New text' } })
      
      expect(handleChange).toHaveBeenCalled()
    })

    it('should handle focus events', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      textarea.focus()
      
      expect(textarea).toHaveFocus()
    })

    it('should handle blur events', () => {
      const handleBlur = jest.fn()
      render(<Textarea onBlur={handleBlur} />)
      
      const textarea = screen.getByRole('textbox')
      textarea.focus()
      textarea.blur()
      
      expect(handleBlur).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should render as textbox role', () => {
      render(<Textarea />)
      
      const textarea = screen.getByRole('textbox')
      expect(textarea).toBeInTheDocument()
    })
  })
})
