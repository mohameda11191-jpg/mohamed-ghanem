import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AutocompleteInputFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  type?: string;
  icon?: React.ElementType;
  required?: boolean;
  min?: number;
  rows?: number; // Added for textarea support
  suggestions: string[];
  onSuggestionSelected: (value: string) => void;
}

const AutocompleteInputField: React.FC<AutocompleteInputFieldProps> = React.memo(
  ({ label, value, onChange, placeholder, type = 'text', icon: Icon, required = false, min, rows, suggestions, onSuggestionSelected }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    // FIX: Update ref type to accommodate both input and textarea
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Effect to filter suggestions based on input value and update highlighted index
    useEffect(() => {
      if (value.length > 0) {
        const filtered = suggestions.filter(
          (s) => s.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions(filtered);
      } else {
        // If input is empty, show all suggestions
        setFilteredSuggestions(suggestions);
      }
      setHighlightedIndex(-1); // Reset highlight whenever filtered suggestions change
      // This effect should NOT control setShowSuggestions; that's handled by focus/blur/input
    }, [value, suggestions]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e); // Pass event up to parent
      // When input changes, if there are any *current* filtered suggestions, show them.
      // This allows the dropdown to appear as the user types.
      // We check filteredSuggestions directly as it's updated by the useEffect.
      if (filteredSuggestions.length > 0) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false); // Hide if no matches
      }
      setHighlightedIndex(-1); // Reset highlight on input change
    }, [onChange, filteredSuggestions.length]);

    const handleSuggestionClick = useCallback((suggestion: string) => {
      onSuggestionSelected(suggestion);
      setShowSuggestions(false);
      inputRef.current?.focus(); // Keep focus on the input after selection
    }, [onSuggestionSelected]);

    // FIX: Update onKeyDown event type to accept KeyboardEvent from both HTMLInputElement and HTMLTextAreaElement
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // ALWAYS prevent form submission on Enter in this input
        if (showSuggestions && highlightedIndex > -1) {
          handleSuggestionClick(filteredSuggestions[highlightedIndex]);
        } else {
          setShowSuggestions(false); // Close suggestions if Enter is pressed without selection
        }
      } else if (e.key === 'Escape') {
        e.preventDefault(); // Prevent default escape behavior too
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
      } else if (showSuggestions && filteredSuggestions.length > 0) { // Only handle arrow keys if suggestions are shown
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setHighlightedIndex((prevIndex) =>
            prevIndex === filteredSuggestions.length - 1 ? 0 : prevIndex + 1
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setHighlightedIndex((prevIndex) =>
            prevIndex <= 0 ? filteredSuggestions.length - 1 : prevIndex - 1
          );
        }
      }
    }, [filteredSuggestions, highlightedIndex, handleSuggestionClick, showSuggestions]);

    const handleFocus = useCallback(() => {
        // On focus, always attempt to show suggestions if the filtered list has items.
        // `filteredSuggestions` is already kept up-to-date by the `useEffect` based on `value`.
        if (filteredSuggestions.length > 0) {
            setShowSuggestions(true);
        }
        setHighlightedIndex(-1); // Reset highlighted index on focus
    }, [filteredSuggestions.length]);

    const handleBlur = useCallback(() => {
      // Delay hiding suggestions to allow a click event on a suggestion to register
      setTimeout(() => {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }, 100);
    }, []); // Empty dependency array as setShowSuggestions is stable

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />}
          {rows ? (
            <textarea
              rows={rows}
              required={required}
              value={value}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 resize-none transition-all duration-200 ease-in-out ${Icon ? 'pl-10' : ''}`}
              ref={inputRef as React.RefObject<HTMLTextAreaElement>} // Explicitly cast for clarity
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>} // Explicitly cast for clarity
              type={type}
              required={required}
              value={value}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={`w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-all duration-200 ease-in-out ${Icon ? 'pl-10' : ''}`}
              min={min}
              autoComplete="off" // Disable browser's autocomplete
            />
          )}
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto custom-scrollbar"
            style={{ top: 'calc(100% + 5px)' }} // Position below the input
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  index === highlightedIndex
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
                onMouseDown={(e) => { // Use onMouseDown to prevent blur before click
                  e.preventDefault(); // Prevent input blur, allowing click to register
                  handleSuggestionClick(suggestion);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

export default AutocompleteInputField;