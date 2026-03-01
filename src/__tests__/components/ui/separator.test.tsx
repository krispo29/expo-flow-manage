import { render, screen } from '@testing-library/react'
import { Separator } from '@/components/ui/separator'

describe('Separator Component', () => {
  describe('Basic Rendering', () => {
    it('should render a separator element', () => {
      render(<Separator data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toBeInTheDocument()
      expect(separator).toHaveAttribute('data-slot', 'separator')
    })

    it('should apply custom className', () => {
      render(<Separator className="custom-separator" data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveClass('custom-separator')
    })
  })

  describe('Orientations', () => {
    it('should render with horizontal orientation by default', () => {
      render(<Separator data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toBeInTheDocument()
    })

    it('should render with horizontal orientation explicitly', () => {
      render(<Separator orientation="horizontal" data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toBeInTheDocument()
    })

    it('should render with vertical orientation', () => {
      render(<Separator orientation="vertical" data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toBeInTheDocument()
    })
  })

  describe('Decorative', () => {
    it('should render decorative separator by default', () => {
      render(<Separator data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toHaveAttribute('data-orientation', 'horizontal')
    })

    it('should accept decorative prop', () => {
      render(<Separator decorative data-testid="separator" />)
      
      const separator = screen.getByTestId('separator')
      expect(separator).toBeInTheDocument()
    })
  })
})
