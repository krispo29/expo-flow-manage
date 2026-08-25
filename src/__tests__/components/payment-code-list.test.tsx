import { render, screen, waitFor } from '@testing-library/react'
import { PaymentCodeList } from '@/components/payment-code-list'
import { getPaymentCodes } from '@/app/actions/payment-code'

jest.mock('@/app/actions/payment-code', () => ({
  getPaymentCodes: jest.fn(),
  exportPaymentCodes: jest.fn(),
}))

jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }))

const getPaymentCodesMock = getPaymentCodes as jest.MockedFunction<typeof getPaymentCodes>

describe('PaymentCodeList', () => {
  it('renders summary cards and links a used code to its participant filter', async () => {
    getPaymentCodesMock.mockResolvedValue({
      success: true,
      data: {
        summary: { total: 2, used: 1, unused: 1 },
        items: [{
          payment_code_uuid: 'code-1', code: 'PAY-001', status: 'used', used_at: '2026-08-25T08:00:00Z', used_by_registration_uuid: 'registration-1',
          registration: { registration_uuid: 'registration-1', registration_code: 'REG-001', first_name: 'Alice', last_name: 'Example', email: 'alice@example.com' },
        }],
        page: 1, page_size: 25, total: 2,
      },
    })

    render(<PaymentCodeList projectId="project-1" />)

    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument())
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Alice Example/i })).toHaveAttribute(
      'href',
      '/admin/participants?projectId=project-1&registration_code=REG-001',
    )
    expect(getPaymentCodesMock).toHaveBeenCalledWith('project-1', expect.objectContaining({ status: 'all', page: 1, pageSize: 25 }))
  })
})
