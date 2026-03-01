import { render, screen } from '@testing-library/react'
import { Label } from '@/components/ui/label'

describe('Label Component', () => {
  describe('Basic Rendering', () => {
    it('should render a label element', () => {
      render(<Label>Label Text</Label>)
      
      const label = screen.getByText('Label Text')
      expect(label).toBeInTheDocument()
    })

    it('should render with correct element', () => {
      render(<Label>Test Label</Label>)
      
      const label = screen.getByText('Test Label')
      expect(label).toHaveAttribute('data-slot', 'label')
    })

    it('should apply custom className', () => {
      render(<Label className="custom-label">Custom</Label>)
      
      const label = screen.getByText('Custom')
      expect(label).toHaveClass('custom-label')
    })
  })

  describe('Associations', () => {
    it('should associate with input via htmlFor', () => {
      render(<Label htmlFor="username">Username</Label>)
      
      const label = screen.getByText('Username')
      expect(label).toHaveAttribute('for', 'username')
    })

    it('should render without htmlFor', () => {
      render(<Label>Simple Label</Label>)
      
      const label = screen.getByText('Simple Label')
      expect(label).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('should apply default styles', () => {
      render(<Label>Default Label</Label>)
      
      const label = screen.getByText('Default Label')
      expect(label).toHaveClass('text-sm')
    })
  })

  describe('Accessibility', () => {
    it('should render as label element', () => {
      render(<Label>Accessible Label</Label>)
      
      const label = screen.getByText('Accessible Label')
      expect(label).toHaveProperty('tagName', 'LABEL')
    })
  })
})
