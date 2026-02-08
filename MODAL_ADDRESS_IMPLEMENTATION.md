# Implementation Plan: Modal Address Search

## Changes Needed:

1. Add imports: useCallback, useRef, FlatList
2. Add states: showAddressModal, addressInput, addressSuggestions, isLoadingAddresses
3. Add ref: lastSearchQueryRef
4. Add handler: handleAddressInputChange
5. Add useEffect: debounce search
6. Add functions: handleOpenAddressModal, handleCloseAddressModal, handleSelectSuggestion (with auto-save)
7. Update UI: Simple button to open modal
8. Add Modal component at the end with:
   - Header with close button
   - TextInput for search
   - Loading indicator
   - ScrollView with FlatList for suggestions
   - No results message

## Implementation starts now...
