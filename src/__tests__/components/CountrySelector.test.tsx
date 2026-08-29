import { fireEvent, render, screen } from '@testing-library/react'
import { CountrySelector } from '@/components/CountrySelector'
import { THAILAB2026_PROJECT_UUID } from '@/lib/features'
import { useAuthStore } from '@/store/useAuthStore'

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
})

const onChange = jest.fn()

function setActiveProject(projectCode: string) {
  sessionStorage.setItem('selected_project', 'project-1')
  sessionStorage.setItem(
    'auth_projects',
    JSON.stringify([
      {
        project_uuid: 'project-1',
        project_name: 'Test Project',
        project_code: projectCode,
      },
    ])
  )
}

describe('CountrySelector', () => {
  beforeEach(() => {
    onChange.mockReset()
    sessionStorage.clear()
    window.history.pushState({}, '', '/')
    useAuthStore.setState({ user: null })
  })

  it('shows Taiwan and still selects TW for THAILAB2026', () => {
    setActiveProject('THAILAB2026')
    render(<CountrySelector value="TW" onChange={onChange} />)

    expect(screen.getByRole('combobox')).toHaveTextContent('Taiwan')

    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(screen.getAllByText('Taiwan').at(-1)!)

    expect(onChange).toHaveBeenCalledWith('TW')
  })

  it('shows the canonical label for other projects', () => {
    setActiveProject('OTHER2026')
    render(<CountrySelector value="TW" onChange={onChange} />)

    expect(screen.getByRole('combobox')).toHaveTextContent(
      'Taiwan Province of China'
    )
  })

  it('uses the project ID in the URL when session selection is absent', () => {
    sessionStorage.setItem(
      'auth_projects',
      JSON.stringify([
        {
          project_uuid: 'project-1',
          project_name: 'ThaiLab',
          project_code: 'THAILAB2026',
        },
      ])
    )
    window.history.pushState({}, '', '/admin/participants?projectId=project-1')

    render(<CountrySelector value="TW" onChange={onChange} />)

    expect(screen.getByRole('combobox')).toHaveTextContent('Taiwan')
  })

  it('prefers the current URL project over a stale session selection', () => {
    sessionStorage.setItem('selected_project', 'other-project')
    sessionStorage.setItem(
      'auth_projects',
      JSON.stringify([
        {
          project_uuid: 'other-project',
          project_name: 'Other Project',
          project_code: 'OTHER2026',
        },
        {
          project_uuid: 'thailab-project',
          project_name: 'ThaiLab',
          project_code: 'THAILAB2026',
        },
      ])
    )
    window.history.pushState(
      {},
      '',
      '/admin/participants?projectId=thailab-project'
    )

    render(<CountrySelector value="TW" onChange={onChange} />)

    expect(screen.getByRole('combobox')).toHaveTextContent('Taiwan')
  })

  it('uses the organizer project when the URL and project session are absent', () => {
    useAuthStore.setState({
      user: {
        id: 'organizer-1',
        username: 'organizer',
        role: 'ORGANIZER',
        projectId: THAILAB2026_PROJECT_UUID,
      },
    })

    render(<CountrySelector value="TW" onChange={onChange} />)

    expect(screen.getByRole('combobox')).toHaveTextContent('Taiwan')
  })

  it('keeps the canonical label for organizers from other projects', () => {
    useAuthStore.setState({
      user: {
        id: 'organizer-2',
        username: 'other-organizer',
        role: 'ORGANIZER',
        projectId: 'other-project',
      },
    })

    render(<CountrySelector value="TW" onChange={onChange} />)

    expect(screen.getByRole('combobox')).toHaveTextContent(
      'Taiwan Province of China'
    )
  })
})
