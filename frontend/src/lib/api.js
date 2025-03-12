/**
 * API utilities for handling backend requests
 */

// Determine API base URL dynamically
const getApiBaseUrl = () => {
  // For production, use the environment variable or fallback to the hardcoded URL
  if (import.meta.env.PROD) {
    return 'https://rulercosta.onrender.com';
  }
  
  // For development environment, use the backend server directly
  // Don't leave this empty - Vite will proxy /api requests to itself otherwise
  return 'http://localhost:5000';
};

// Export the base URL for use in components
export const API_BASE_URL = getApiBaseUrl();

/**
 * Make an API request with proper error handling and logging
 * @param {string} endpoint - The API endpoint (without the base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, options);
    
    // Log the status of the response
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText} for ${url}`);
      
      // Try to parse error response as JSON
      let errorData;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          console.error('API Error Details:', errorData);
        } else {
          errorData = await response.text();
          console.error('API Error Response:', errorData);
        }
      } catch (parseError) {
        console.error('Error parsing API error response:', parseError);
      }
    }
    
    return response;
  } catch (error) {
    console.error(`Network error for ${url}:`, error);
    throw error;
  }
}

/**
 * Shorthand for API GET requests
 */
export async function apiGet(endpoint, options = {}) {
  return apiRequest(endpoint, { 
    ...options, 
    method: 'GET',
    credentials: options.credentials || 'include'
  });
}

/**
 * Shorthand for API POST requests
 * @param {string} endpoint - The API endpoint
 * @param {Object|FormData} data - The data to send
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Response>} - Fetch response
 */
export async function apiPost(endpoint, data, options = {}) {
  // Check if the data is FormData
  const isFormData = data instanceof FormData;
  
  // Don't set Content-Type for FormData as the browser will set it automatically
  // with the correct boundary string
  const headers = !isFormData 
    ? { 'Content-Type': 'application/json', ...options.headers }
    : { ...options.headers };
  
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    headers,
    // Only stringify JSON bodies, not FormData
    body: isFormData ? data : JSON.stringify(data),
    credentials: options.credentials || 'include'
  });
}

/**
 * Shorthand for API PUT requests
 */
export async function apiPut(endpoint, data, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
    credentials: options.credentials || 'include'
  });
}

/**
 * Shorthand for API DELETE requests
 */
export async function apiDelete(endpoint, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: 'DELETE',
    credentials: options.credentials || 'include'
  });
}
