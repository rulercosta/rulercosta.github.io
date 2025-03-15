/**
 * API utilities for handling backend requests
 */

// Determine API base URL dynamically
const getApiBaseUrl = () => {
  // For production, use the environment variable or hardcoded URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://rulercosta.onrender.com';
  }
  
  // For development environment, use the backend server directly
  // return import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return 'https://rulercosta.onrender.com';
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
  
  // Always include credentials for cross-domain requests
  const finalOptions = {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
    }
  };
  
  try {
    const response = await fetch(url, finalOptions);
    
    // Log the status of the response
    if (!response.ok) {
      let errorData;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = await response.text();
        }
      } catch (parseError) {
        // Silently handle parse errors
      }
    }
    
    return response;
  } catch (error) {
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
  });
}

/**
 * Shorthand for API DELETE requests
 */
export async function apiDelete(endpoint, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    method: 'DELETE',
  });
}
