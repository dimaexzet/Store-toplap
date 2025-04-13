'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, ArrowUpRight } from 'lucide-react'
import { useDebounce } from '@/lib/hooks/use-debounce'

// Client-side cache for suggestions
interface CacheEntry {
  suggestions: string[];
  timestamp: number;
}

// Cache expiry in milliseconds (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

// Global cache shared between all search components
const suggestionsCache = new Map<string, CacheEntry>();

export function SearchAutocomplete({
  placeholder = 'Search products...',
  initialValue = '',
  onSearch,
  className = '',
}: {
  placeholder?: string
  initialValue?: string
  onSearch?: (term: string) => void
  className?: string
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const debouncedSearchTerm = useDebounce(searchQuery, 300)

  // Fetch suggestions with caching and abort controller
  const fetchSuggestions = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    // Check cache first
    const now = Date.now();
    const cacheKey = term.toLowerCase();
    const cachedEntry = suggestionsCache.get(cacheKey);

    if (cachedEntry && now - cachedEntry.timestamp < CACHE_EXPIRY) {
      setSuggestions(cachedEntry.suggestions);
      return;
    }

    setLoading(true);

    // Cancel any ongoing fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(term)}`,
        { signal: abortControllerRef.current.signal }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      const data = await response.json();
      const newSuggestions = data.suggestions || [];
      
      // Update cache with new suggestions
      suggestionsCache.set(cacheKey, {
        suggestions: newSuggestions,
        timestamp: now
      });

      // Cleanup cache if it gets too large
      if (suggestionsCache.size > 50) {
        const oldestEntries = [...suggestionsCache.entries()]
          .sort((a, b) => a[1].timestamp - b[1].timestamp)
          .slice(0, 10)
          .map(entry => entry[0]);
        
        oldestEntries.forEach(key => suggestionsCache.delete(key));
      }
      
      setSuggestions(newSuggestions);
    } catch (error) {
      // Only log error if it's not an abort error
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        console.error('Error fetching suggestions:', error);
      }
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch suggestions when search query changes
  useEffect(() => {
    if (debouncedSearchTerm.length < 2) {
      setSuggestions([])
      return
    }

    fetchSuggestions(debouncedSearchTerm);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchTerm, fetchSuggestions])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current && 
        !suggestionRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim())
      } else {
        router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      }
      setShowSuggestions(false)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    if (onSearch) {
      onSearch(suggestion)
    } else {
      router.push(`/products?search=${encodeURIComponent(suggestion)}`)
    }
    setShowSuggestions(false)
  }

  // Clear search query
  const clearSearch = () => {
    setSearchQuery('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 focus:ring-2 focus:ring-offset-1 focus:ring-primary ${className}`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          aria-label="Search"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </form>

      {/* Suggestions dropdown */}
      {showSuggestions && searchQuery.length >= 2 && (
        <div 
          ref={suggestionRef}
          className="absolute z-50 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">Loading suggestions...</div>
          ) : suggestions.length > 0 ? (
            <ul>
              {suggestions.map((suggestion, index) => (
                <li 
                  key={index}
                  className="px-4 py-2 text-sm hover:bg-accent cursor-pointer flex items-center justify-between"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="flex-1">{suggestion}</span>
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                </li>
              ))}
            </ul>
          ) : searchQuery.length >= 2 ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">No suggestions found</div>
          ) : null}
        </div>
      )}
    </div>
  )
} 