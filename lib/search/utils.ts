import { Product } from '@prisma/client';

// Define extended product type that includes category
interface ProductWithCategory extends Product {
  category?: {
    id: string;
    name: string;
  };
}

/**
 * Highlight the search term in a text by wrapping it with HTML tags
 */
export function highlightText(text: string, query: string, tag = 'span'): string {
  if (!query || !text) return text;
  
  // Split the query into words for more precise highlighting
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  
  // If no valid query words, return the original text
  if (queryWords.length === 0) return text;
  
  // Create a regex pattern that matches any of the query words
  const pattern = queryWords.map(word => escapeRegex(word)).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  
  return text.replace(regex, `<${tag} class="bg-yellow-100 dark:bg-yellow-800">$1</${tag}>`);
}

/**
 * Escape special regex characters to safely use in RegExp
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract relevant keywords for product search
 * This helps build a more robust search index
 */
export function extractKeywords(product: ProductWithCategory): string[] {
  const nameWords = product.name.toLowerCase().split(/\s+/);
  const descriptionWords = product.description?.toLowerCase().split(/\s+/) || [];
  const categoryName = product.category?.name?.toLowerCase().split(/\s+/) || [];
  
  // Remove duplicates and common words
  const keywords = [...new Set([...nameWords, ...descriptionWords, ...categoryName])]
    .filter(word => word.length > 2) // Filter out short words
    .filter(word => !commonWords.includes(word)); // Filter out common words
  
  return keywords;
}

/**
 * Calculate relevance score for search results sorting
 * Higher score means more relevant to the search query
 */
export function calculateRelevanceScore(product: ProductWithCategory, query: string): number {
  const queryLower = query.toLowerCase();
  const nameLower = product.name.toLowerCase();
  const descriptionLower = product.description?.toLowerCase() || '';
  const categoryName = product.category?.name?.toLowerCase() || '';
  
  let score = 0;
  
  // Split query into words for more granular matching
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);
  
  // Exact match in name (highest priority)
  if (nameLower === queryLower) {
    score += 100;
  }
  
  // Name contains the exact query
  if (nameLower.includes(queryLower)) {
    score += 50;
  }
  
  // Name starts with the query
  if (nameLower.startsWith(queryLower)) {
    score += 30;
  }
  
  // Category name exact match or contains the query
  if (categoryName === queryLower) {
    score += 40;
  } else if (categoryName.includes(queryLower)) {
    score += 20;
  }
  
  // Individual words in name match query words
  const nameWords = nameLower.split(/\s+/);
  for (const queryWord of queryWords) {
    // Exact word matches
    for (const word of nameWords) {
      if (word === queryWord) score += 20;
      if (word.startsWith(queryWord)) score += 10;
      if (fuzzyMatch(word, queryWord, 2)) score += 5; // Fuzzy matching
    }
  }
  
  // Description contains the query
  if (descriptionLower.includes(queryLower)) {
    score += 15;
  }
  
  // Count matches of query words in description
  let descriptionMatches = 0;
  for (const queryWord of queryWords) {
    if (descriptionLower.includes(queryWord)) {
      descriptionMatches++;
    }
  }
  
  // Add score based on percentage of query words matched in description
  if (queryWords.length > 0) {
    score += (descriptionMatches / queryWords.length) * 10;
  }
  
  return score;
}

/**
 * Perform fuzzy matching between two strings
 * Returns true if they are similar within the given threshold
 */
export function fuzzyMatch(str1: string, str2: string, maxDistance: number): boolean {
  // For very short strings, just check startsWith
  if (str1.length < 3 || str2.length < 3) {
    return str1.startsWith(str2) || str2.startsWith(str1);
  }
  
  // Calculate Levenshtein distance
  const dist = levenshteinDistance(str1, str2);
  return dist <= maxDistance;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    track[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    track[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return track[str2.length][str1.length];
}

/**
 * Generate search suggestions based on a partial query
 */
export function generateSuggestions(products: ProductWithCategory[], partialQuery: string, limit = 5): string[] {
  if (!partialQuery || partialQuery.length < 2) return [];
  
  const query = partialQuery.toLowerCase();
  const suggestions = new Set<string>();
  
  // Find products matching the partial query
  for (const product of products) {
    const name = product.name.toLowerCase();
    const description = product.description?.toLowerCase() || '';
    
    // Add exact product names that match the query
    if (name.includes(query)) {
      suggestions.add(product.name);
    }
    
    // Add individual words from product names that match
    const nameWords = name.split(/\s+/);
    for (const word of nameWords) {
      if (word.startsWith(query) && word.length > 3) {
        suggestions.add(word.charAt(0).toUpperCase() + word.slice(1));
      }
      
      // Add fuzzy matches
      if (word.length > 3 && fuzzyMatch(word, query, 2)) {
        suggestions.add(word.charAt(0).toUpperCase() + word.slice(1));
      }
    }
    
    // Add relevant phrases from description
    if (description.includes(query)) {
      const descWords = description.split(/\s+/);
      for (let i = 0; i < descWords.length - 1; i++) {
        const word = descWords[i];
        if ((word.startsWith(query) || fuzzyMatch(word, query, 2)) && word.length > 3) {
          const phrase = `${word} ${descWords[i + 1]}`.trim();
          if (phrase.length > 5) {
            suggestions.add(phrase.charAt(0).toUpperCase() + phrase.slice(1));
          }
        }
      }
    }
  }
  
  // Limit and return suggestions
  return Array.from(suggestions).slice(0, limit);
}

// Common words to filter out from search
const commonWords = [
  'the', 'and', 'for', 'with', 'this', 'that', 'from',
  'have', 'has', 'had', 'not', 'are', 'is', 'was', 'were',
  'will', 'would', 'should', 'can', 'could', 'may', 'might',
  'must', 'its', 'it\'s', 'their', 'there', 'these', 'those',
  'our', 'your', 'all', 'any', 'one', 'two', 'new', 'more'
]; 