import { render, screen } from '@testing-library/react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  CardAction 
} from '@/components/ui/card'

describe('Card Components', () => {
  describe('Card', () => {
    it('should render correctly', () => {
      render(<Card data-testid="card">Card Content</Card>)
      
      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('bg-card')
    })

    it('should apply custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>)
      
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-class')
    })

    it('should render children', () => {
      render(<Card><span>Child Content</span></Card>)
      
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    it('should have correct data-slot attribute', () => {
      render(<Card data-testid="card">Content</Card>)
      
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('data-slot', 'card')
    })
  })

  describe('CardHeader', () => {
    it('should render correctly', () => {
      render(<CardHeader data-testid="header">Header Content</CardHeader>)
      
      const header = screen.getByTestId('header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveAttribute('data-slot', 'card-header')
    })

    it('should render with children', () => {
      render(
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
      )
      
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })
  })

  describe('CardTitle', () => {
    it('should render correctly', () => {
      render(<CardTitle data-testid="title">My Title</CardTitle>)
      
      const title = screen.getByTestId('title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('My Title')
      expect(title).toHaveAttribute('data-slot', 'card-title')
    })
  })

  describe('CardDescription', () => {
    it('should render correctly', () => {
      render(<CardDescription data-testid="desc">My Description</CardDescription>)
      
      const desc = screen.getByTestId('desc')
      expect(desc).toBeInTheDocument()
      expect(desc).toHaveTextContent('My Description')
      expect(desc).toHaveAttribute('data-slot', 'card-description')
    })
  })

  describe('CardContent', () => {
    it('should render correctly', () => {
      render(<CardContent data-testid="content">Content</CardContent>)
      
      const content = screen.getByTestId('content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveAttribute('data-slot', 'card-content')
    })
  })

  describe('CardFooter', () => {
    it('should render correctly', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>)
      
      const footer = screen.getByTestId('footer')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveAttribute('data-slot', 'card-footer')
    })
  })

  describe('CardAction', () => {
    it('should render correctly', () => {
      render(<CardAction data-testid="action">Action</CardAction>)
      
      const action = screen.getByTestId('action')
      expect(action).toBeInTheDocument()
      expect(action).toHaveAttribute('data-slot', 'card-action')
    })
  })

  describe('Complete Card Layout', () => {
    it('should render complete card structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardAction>Edit</CardAction>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card Body Content</CardContent>
          <CardFooter>Card Footer Content</CardFooter>
        </Card>
      )
      
      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card Description')).toBeInTheDocument()
      expect(screen.getByText('Card Body Content')).toBeInTheDocument()
      expect(screen.getByText('Card Footer Content')).toBeInTheDocument()
    })
  })
})
