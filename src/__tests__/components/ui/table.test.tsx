import { render, screen } from '@testing-library/react'
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableFooter, 
  TableHead, 
  TableRow, 
  TableCell,
  TableCaption 
} from '@/components/ui/table'

describe('Table Components', () => {
  describe('Table', () => {
    it('should render correctly', () => {
      render(<Table data-testid="table" />)
      
      const table = screen.getByTestId('table')
      expect(table).toBeInTheDocument()
      expect(table).toHaveAttribute('data-slot', 'table')
    })

    it('should wrap in container', () => {
      render(<Table data-testid="table" />)
      
      // Should have a container wrapper
      const container = screen.getByTestId('table').parentElement
      expect(container).toHaveAttribute('data-slot', 'table-container')
    })

    it('should apply custom className', () => {
      render(<Table className="custom-table" data-testid="table" />)
      
      const table = screen.getByTestId('table')
      expect(table).toHaveClass('custom-table')
    })
  })

  describe('TableHeader', () => {
    it('should render correctly', () => {
      render(
        <table>
          <TableHeader data-testid="header" />
        </table>
      )
      
      const header = screen.getByTestId('header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveAttribute('data-slot', 'table-header')
    })
  })

  describe('TableBody', () => {
    it('should render correctly', () => {
      render(
        <table>
          <TableBody data-testid="body" />
        </table>
      )
      
      const body = screen.getByTestId('body')
      expect(body).toBeInTheDocument()
      expect(body).toHaveAttribute('data-slot', 'table-body')
    })
  })

  describe('TableFooter', () => {
    it('should render correctly', () => {
      render(
        <table>
          <TableFooter data-testid="footer" />
        </table>
      )
      
      const footer = screen.getByTestId('footer')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveAttribute('data-slot', 'table-footer')
    })
  })

  describe('TableHead', () => {
    it('should render correctly', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead data-testid="head" />
            </tr>
          </thead>
        </table>
      )
      
      const head = screen.getByTestId('head')
      expect(head).toBeInTheDocument()
      expect(head).toHaveAttribute('data-slot', 'table-head')
    })

    it('should render with content', () => {
      render(
        <table>
          <thead>
            <tr>
              <TableHead>Column Title</TableHead>
            </tr>
          </thead>
        </table>
      )
      
      expect(screen.getByText('Column Title')).toBeInTheDocument()
    })
  })

  describe('TableRow', () => {
    it('should render correctly', () => {
      render(
        <table>
          <tbody>
            <TableRow data-testid="row" />
          </tbody>
        </table>
      )
      
      const row = screen.getByTestId('row')
      expect(row).toBeInTheDocument()
      expect(row).toHaveAttribute('data-slot', 'table-row')
    })
  })

  describe('TableCell', () => {
    it('should render correctly', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell data-testid="cell" />
            </tr>
          </tbody>
        </table>
      )
      
      const cell = screen.getByTestId('cell')
      expect(cell).toBeInTheDocument()
      expect(cell).toHaveAttribute('data-slot', 'table-cell')
    })

    it('should render with content', () => {
      render(
        <table>
          <tbody>
            <tr>
              <TableCell>Cell Content</TableCell>
            </tr>
          </tbody>
        </table>
      )
      
      expect(screen.getByText('Cell Content')).toBeInTheDocument()
    })
  })

  describe('TableCaption', () => {
    it('should render correctly', () => {
      render(
        <table>
          <TableCaption data-testid="caption" />
        </table>
      )
      
      const caption = screen.getByTestId('caption')
      expect(caption).toBeInTheDocument()
      expect(caption).toHaveAttribute('data-slot', 'table-caption')
    })

    it('should render with content', () => {
      render(
        <table>
          <TableCaption>Table Caption</TableCaption>
        </table>
      )
      
      expect(screen.getByText('Table Caption')).toBeInTheDocument()
    })
  })

  describe('Complete Table Layout', () => {
    it('should render complete table structure', () => {
      render(
        <Table>
          <TableCaption>User List</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total: 2</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )
      
      expect(screen.getByText('User List')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
      expect(screen.getByText('Total: 2')).toBeInTheDocument()
    })
  })
})
