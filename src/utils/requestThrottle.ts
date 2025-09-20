// Request throttling utility to prevent 429 errors

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests per minute per endpoint

export const shouldThrottleRequest = (endpoint: string): boolean => {
  const now = Date.now();
  const key = endpoint;
  
  const current = requestCounts.get(key);
  
  if (!current || now >= current.resetTime) {
    // Reset the counter if window expired or first request
    requestCounts.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return false;
  }
  
  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    console.warn(`Rate limit reached for ${endpoint}. Throttling request.`);
    return true;
  }
  
  // Increment the counter
  requestCounts.set(key, {
    ...current,
    count: current.count + 1
  });
  
  return false;
};

export const getThrottleDelay = (endpoint: string): number => {
  const current = requestCounts.get(endpoint);
  if (!current) return 0;
  
  const timeUntilReset = current.resetTime - Date.now();
  return Math.max(0, timeUntilReset);
};

// Debounce function for API calls
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Rate-limited API call wrapper
export const withRateLimit = async <T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  if (shouldThrottleRequest(endpoint)) {
    const delay = getThrottleDelay(endpoint);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  try {
    return await apiCall();
  } catch (error: any) {
    if (error?.response?.status === 429) {
      console.error(`Rate limit exceeded for ${endpoint}:`, error);
      // Wait before allowing future requests
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
    }
    throw error;
  }
};