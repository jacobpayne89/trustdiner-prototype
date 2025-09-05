import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from '@/app/components/search/SearchBar'

// Mock the search context
const mockSearchStore = {
  query: '',
  setQuery: jest.fn(),
  searchResults: [],
  searchMetadata: null,
  isSearching: false,
  showDropdown: false,
  setShowDropdown: jest.fn(),
  clearSearch: jest.fn(),
  hasLoadedGoogleResults: false,
  handleSearchSubmit: jest.fn(),
}

jest.mock('@/hooks/useSearchStore', () => ({
  useSearchStore: () => mockSearchStore,
}))

// Mock the place context
const mockPlaceContext = {
  openPlaceCard: jest.fn(),
}

jest.mock('@/hooks/usePlaceContext', () => ({
  usePlaceContext: () => mockPlaceContext,
}))

describe('SearchBar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders search input with placeholder', () => {
    render(
      <SearchBar
        placeholder="Search restaurants..."
        onResultClick={jest.fn()}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search restaurants...')
    expect(searchInput).toBeInTheDocument()
  })

  it('calls setQuery when user types', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchBar
        placeholder="Search restaurants..."
        onResultClick={jest.fn()}
      />
    )

    const searchInput = screen.getByPlaceholderText('Search restaurants...')
    await user.type(searchInput, 'pizza')

    expect(mockSearchStore.setQuery).toHaveBeenCalledWith('pizza')
  })

  it('shows search results when dropdown is open', () => {
    const mockSearchStoreWithResults = {
      ...mockSearchStore,
      showDropdown: true,
      searchResults: [
        {
          place_id: '1',
          name: 'Test Restaurant',
          address: '123 Test St',
          rating: 4.5,
          inDatabase: true,
        },
      ],
      searchMetadata: {
        source: 'database' as const,
        count: 1,
        breakdown: { database: 1, google_total: 0, google_new: 0 },
      },
    }

    jest.mocked(require('@/hooks/useSearchStore').useSearchStore).mockReturnValue(mockSearchStoreWithResults)

    render(
      <SearchBar
        placeholder="Search restaurants..."
        onResultClick={jest.fn()}
      />
    )

    expect(screen.getByText('Test Restaurant')).toBeInTheDocument()
    expect(screen.getByText('123 Test St')).toBeInTheDocument()
  })

  it('calls onResultClick when a result is clicked', async () => {
    const mockOnResultClick = jest.fn()
    const user = userEvent.setup()

    const mockSearchStoreWithResults = {
      ...mockSearchStore,
      showDropdown: true,
      searchResults: [
        {
          place_id: '1',
          name: 'Test Restaurant',
          address: '123 Test St',
          rating: 4.5,
          inDatabase: true,
        },
      ],
      searchMetadata: {
        source: 'database' as const,
        count: 1,
        breakdown: { database: 1, google_total: 0, google_new: 0 },
      },
    }

    jest.mocked(require('@/hooks/useSearchStore').useSearchStore).mockReturnValue(mockSearchStoreWithResults)

    render(
      <SearchBar
        placeholder="Search restaurants..."
        onResultClick={mockOnResultClick}
      />
    )

    const resultButton = screen.getByText('Test Restaurant').closest('button')
    expect(resultButton).toBeInTheDocument()
    
    if (resultButton) {
      await user.click(resultButton)
      expect(mockOnResultClick).toHaveBeenCalled()
    }
  })

  it('clears search when clear button is clicked', async () => {
    const user = userEvent.setup()
    
    const mockSearchStoreWithQuery = {
      ...mockSearchStore,
      query: 'pizza',
    }

    jest.mocked(require('@/hooks/useSearchStore').useSearchStore).mockReturnValue(mockSearchStoreWithQuery)

    render(
      <SearchBar
        placeholder="Search restaurants..."
        onResultClick={jest.fn()}
      />
    )

    const clearButton = screen.getByRole('button', { name: /clear/i })
    await user.click(clearButton)

    expect(mockSearchStore.clearSearch).toHaveBeenCalled()
  })
})
