import { fireEvent, render, screen } from '@testing-library/react'
import { Combobox } from '@/components/ui/combobox'

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('Combobox', () => {
  it('shows a disabled loading trigger instead of the empty state', () => {
    render(<Combobox loading emptyMessage="No events found" placeholder="Select event" options={[]} />)

    expect(screen.getByRole('combobox')).toBeDisabled()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByText('No events found')).not.toBeInTheDocument()
  })

  it('shows the empty message after loading completes with no options', () => {
    render(<Combobox emptyMessage="No events found" placeholder="Select event" options={[]} />)

    fireEvent.click(screen.getByRole('combobox'))

    expect(screen.getByText('No events found')).toBeInTheDocument()
  })
})
