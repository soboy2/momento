'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X, MapPin, ChevronDown } from 'lucide-react';

// List of popular cities
const POPULAR_CITIES = [
  'New York, NY',
  'Los Angeles, CA',
  'Chicago, IL',
  'Houston, TX',
  'Phoenix, AZ',
  'Philadelphia, PA',
  'San Antonio, TX',
  'San Diego, CA',
  'Dallas, TX',
  'San Jose, CA',
  'Austin, TX',
  'Jacksonville, FL',
  'Fort Worth, TX',
  'Columbus, OH',
  'San Francisco, CA',
  'Charlotte, NC',
  'Indianapolis, IN',
  'Seattle, WA',
  'Denver, CO',
  'Washington, DC',
  'Boston, MA',
  'Nashville, TN',
  'Baltimore, MD',
  'Oklahoma City, OK',
  'Portland, OR',
  'Las Vegas, NV',
  'Miami, FL',
  'Atlanta, GA',
  'London, UK',
  'Paris, France',
  'Tokyo, Japan',
  'Sydney, Australia',
  'Toronto, Canada',
  'Berlin, Germany',
  'Madrid, Spain',
  'Rome, Italy',
  'Amsterdam, Netherlands',
  'Dubai, UAE',
  'Singapore',
  'Hong Kong',
];

interface LocationAutocompleteProps {
  value: string;
  onSave: (value: string) => void;
}

export default function LocationAutocomplete({ value, onSave }: LocationAutocompleteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      
      // Show initial suggestions when editing starts
      if (inputValue) {
        updateSuggestions(inputValue);
      } else {
        // Show top 5 cities if no input
        setSuggestions(POPULAR_CITIES.slice(0, 5));
        setShowSuggestions(true);
      }
    }
  }, [isEditing, inputValue]);

  useEffect(() => {
    // Handle clicks outside the component to close suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateSuggestions = (text: string) => {
    if (!text.trim()) {
      // Show top 5 cities if no input
      setSuggestions(POPULAR_CITIES.slice(0, 5));
      setShowSuggestions(true);
      return;
    }
    
    // Filter cities based on input
    const filtered = POPULAR_CITIES.filter(city => 
      city.toLowerCase().includes(text.toLowerCase())
    ).slice(0, 5); // Limit to 5 suggestions
    
    setSuggestions(filtered);
    setShowSuggestions(true);
  };

  const handleEdit = () => {
    setIsEditing(true);
    // Show suggestions immediately when editing starts
    setSuggestions(POPULAR_CITIES.slice(0, 5));
    setShowSuggestions(true);
  };

  const handleCancel = () => {
    setInputValue(value);
    setIsEditing(false);
    setShowSuggestions(false);
  };

  const handleSave = () => {
    onSave(inputValue);
    setIsEditing(false);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'ArrowDown') {
      setShowSuggestions(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    updateSuggestions(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onSave(suggestion);
    setIsEditing(false);
    setShowSuggestions(false);
  };

  const toggleSuggestions = () => {
    if (!showSuggestions) {
      updateSuggestions(inputValue);
    }
    setShowSuggestions(!showSuggestions);
  };

  const handleBlur = () => {
    setShowSuggestions(false);
  };

  const handleClearInput = () => {
    setInputValue('');
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center text-gray-600 group">
        <div className="mr-2">
          <MapPin className="h-4 w-4" />
        </div>
        
        {isEditing ? (
          <div className="flex items-center flex-1 relative">
            <div className="relative flex-1">
              <div className="relative w-full">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={handleBlur}
                  placeholder="Add your location"
                  className="w-full py-2 pr-10 border-b border-blue-400 focus:outline-none text-black"
                />
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                  onClick={handleClearInput}
                >
                  <MapPin size={18} />
                </button>
              </div>
              <button
                type="button"
                onClick={toggleSuggestions}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown size={16} />
              </button>
            </div>
            <button 
              onClick={handleSave}
              className="ml-2 p-1 text-green-500 hover:bg-green-50 rounded-full"
              type="button"
            >
              <Check size={16} />
            </button>
            <button 
              onClick={handleCancel}
              className="ml-1 p-1 text-red-500 hover:bg-red-50 rounded-full"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <span className="text-sm flex-1">{value || 'Add your location'}</span>
            <button 
              onClick={handleEdit}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
            >
              <ChevronDown size={14} />
            </button>
          </>
        )}
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto"
        >
          {suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li 
                  key={index}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-800"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">No locations found</div>
          )}
        </div>
      )}
    </div>
  );
} 