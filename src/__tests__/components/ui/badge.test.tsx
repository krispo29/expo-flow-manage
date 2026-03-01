import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/badge'

describe('Badge Component', () => {
  describe('Basic Rendering', () => {
    it('should render a badge element', () => {
      render(<Badge>Badge</Badge>)
      
      const badge = screen.getByText('Badge')
      expect(badge).toBeInTheDocument()
    })

    it('should render with default variant', () => {
      render(<Badge>Default</Badge>)
      
      const badge = screen.getByText('Default')
      expect(badge).toHaveAttribute('data-slot', 'badge')
    })

    it('should apply custom className', () => {
      render(<Badge className="custom-badge">Custom</Badge>)
      
      const badge = screen.getByText('Custom')
      expect(badge).toHaveClass('custom-badge')
    })
  })

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Badge variant="default">Default</Badge>)
      
      const badge = screen.getByText('Default')
      expect(badge).toBeInTheDocument()
    })

    it('should render secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>)
      
      const badge = screen.getByText('Secondary')
      expect(badge).toBeInTheDocument()
    })

    it('should render destructive variant', () => {
      render(<Badge variant="destructive">Destructive</Badge>)
      
      const badge = screen.getByText('Destructive')
      expect(badge).toBeInTheDocument()
    })

    it('should render outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>)
      
      const badge = screen.getByText('Outline')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Use Cases', () => {
    it('should render as status indicator', () => {
      render(<Badge variant="default">Active</Badge>)
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should render as count badge', () => {
      render(<Badge variant="secondary">5</Badge>)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should render as warning indicator', () => {
      render(<Badge variant="destructive">Error</Badge>)
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })
})
