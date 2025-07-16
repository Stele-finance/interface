import { NextRequest, NextResponse } from 'next/server';

// Country code to language code mapping
const countryToLanguage: { [key: string]: string } = {
  'US': 'en',
  'GB': 'en',
  'KR': 'kr',
  'JP': 'jp',
  'CN': 'zh-cn',
  'TW': 'zh-tw',
  'HK': 'zh-tw',
  'ES': 'es',
  'MX': 'es',
  'AR': 'es',
  'CO': 'es',
  'PE': 'es',
  'VE': 'es',
  'CL': 'es',
  'EC': 'es',
  'GT': 'es',
  'CU': 'es',
  'BO': 'es',
  'DO': 'es',
  'HN': 'es',
  'PY': 'es',
  'SV': 'es',
  'NI': 'es',
  'CR': 'es',
  'PA': 'es',
  'UY': 'es',
  'FR': 'fr',
  'DE': 'de',
  'IT': 'it',
  'PT': 'pt',
  'BR': 'pt',
  'RU': 'ru',
  'IN': 'hi',
  'BD': 'bn',
  'PK': 'hi',
  'ID': 'id',
  'MY': 'ms',
  'SG': 'en',
  'TH': 'th',
  'VN': 'vi',
  'PH': 'en',
  'NL': 'nl',
  'DK': 'da',
  'FI': 'fi',
  'GR': 'el',
  'IL': 'he',
  'HU': 'hu',
  'EG': 'ar',
  'SA': 'ar',
  'AE': 'ar',
  'MA': 'ar',
  'TN': 'ar',
  'DZ': 'ar',
  'IQ': 'ar',
  'JO': 'ar',
  'KW': 'ar',
  'LB': 'ar',
  'LY': 'ar',
  'OM': 'ar',
  'QA': 'ar',
  'SY': 'ar',
  'YE': 'ar',
};

// Get client IP address - check various headers including mobile environments
function getClientIP(request: NextRequest): string {
  // Headers to get real client IP in various proxy and CDN environments
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'x-forwarded',
    'x-cluster-client-ip',
    'cf-connecting-ip',
    'fastly-client-ip',
    'true-client-ip',
    'x-original-forwarded-for',
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // Use the first IP when multiple IPs are present
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        return ip;
      }
    }
  }

  // Return default value when IP cannot be found in all headers
  return '127.0.0.1';
}

// IP address validation function
function isValidIP(ip: string): boolean {
  // IPv4 address validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // IPv6 address validation (simple form)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Local IP address check function
function isLocalIP(ip: string): boolean {
  return ip === '127.0.0.1' || 
         ip === '::1' || 
         ip.startsWith('192.168.') || 
         ip.startsWith('10.') || 
         ip.startsWith('172.16.') ||
         ip.startsWith('172.17.') ||
         ip.startsWith('172.18.') ||
         ip.startsWith('172.19.') ||
         ip.startsWith('172.20.') ||
         ip.startsWith('172.21.') ||
         ip.startsWith('172.22.') ||
         ip.startsWith('172.23.') ||
         ip.startsWith('172.24.') ||
         ip.startsWith('172.25.') ||
         ip.startsWith('172.26.') ||
         ip.startsWith('172.27.') ||
         ip.startsWith('172.28.') ||
         ip.startsWith('172.29.') ||
         ip.startsWith('172.30.') ||
         ip.startsWith('172.31.');
}

// Get geographical location info from IP (using free API)
async function getCountryFromIP(ip: string): Promise<string> {
  try {
    // Return default value for local IP addresses
    if (isLocalIP(ip)) {
      return 'US';
    }
    
    // IP address validation
    if (!isValidIP(ip)) {
      console.warn('Invalid IP address:', ip);
      return 'US';
    }
    
    // Use ipapi.co free API (1000 requests per month limit)
    const response = await fetch(`https://ipapi.co/${ip}/country/`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Stele/1.0)',
        'Accept': 'text/plain',
      },
      // Set timeout (10 seconds)
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const country = await response.text();
    const countryCode = country.trim().toUpperCase();
    
    // Country code validation
    if (countryCode && countryCode.length === 2) {
      return countryCode;
    }
    
    throw new Error('Invalid country code received');
  } catch (error) {
    console.error('Error fetching country from IP:', error);
    return 'US'; // Default value
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);    
    const country = await getCountryFromIP(ip);
    const language = countryToLanguage[country] || 'en';
    
    return NextResponse.json({
      ip,
      country,
      language,
      success: true
    });
  } catch (error) {
    console.error('Error in detect-language API:', error);
    return NextResponse.json({
      ip: 'unknown',
      country: 'US',
      language: 'en',
      success: false,
      error: 'Failed to detect language'
    }, { status: 500 });
  }
} 