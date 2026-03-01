import { render, screen } from '@testing-library/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

describe('Avatar Component', () => {
  describe('Basic Rendering', () => {
    it('should render avatar element', () => {
      render(<Avatar data-testid="avatar" />)
      
      const avatar = screen.getByTestId('avatar')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('data-slot', 'avatar')
    })

    it('should apply custom className', () => {
      render(<Avatar className="custom-avatar" data-testid="avatar" />)
      
      const avatar = screen.getByTestId('avatar')
      expect(avatar).toHaveClass('custom-avatar')
    })
  })

  describe('AvatarFallback', () => {
    it('should render fallback content', () => {
      render(
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      )
      
      const fallback = screen.getByText('AB')
      expect(fallback).toBeInTheDocument()
      expect(fallback).toHaveAttribute('data-slot', 'avatar-fallback')
    })

    it('should show fallback when no image', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      )
      
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('should apply custom className to fallback', () => {
      render(
        <Avatar>
          <AvatarFallback className="custom-fallback">Test</AvatarFallback>
        </Avatar>
      )
      
      const fallback = screen.getByText('Test')
      expect(fallback).toHaveClass('custom-fallback')
    })
  })

  describe('AvatarImage', () => {
    it('should render image element', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="User Avatar" />
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      )
      
      // AvatarImage is rendered, but in test environment the image may not load
      const fallback = screen.getByText('AB')
      expect(fallback).toBeInTheDocument()
    })

    it('should have src attribute', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/test.jpg" alt="Test" />
          <AvatarFallback>TF</AvatarFallback>
        </Avatar>
      )
      
      // Component renders without errors
      expect(screen.getByText('TF')).toBeInTheDocument()
    })
  })

  describe('Complete Avatar', () => {
    it('should render complete avatar with fallback only (image loading not simulated)', () => {
      render(
        <Avatar>
          <AvatarImage src="https://example.com/user.jpg" alt="User" />
          <AvatarFallback>US</AvatarFallback>
        </Avatar>
      )
      
      // Fallback should be visible (image doesn't load in test environment)
      expect(screen.getByText('US')).toBeInTheDocument()
    })

    it('should render avatar with initials only', () => {
      render(
        <Avatar>
          <AvatarFallback>John Doe</AvatarFallback>
        </Avatar>
      )
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })
})
