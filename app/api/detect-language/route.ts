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

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return '127.0.0.1';
}

// Get geographical location info from IP (using free API)
async function getCountryFromIP(ip: string): Promise<string> {
  try {
    // Return default value for local IP addresses
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return 'US';
    }
    
    // Use ipapi.co free API (1000 requests per month limit)
    const response = await fetch(`https://ipapi.co/${ip}/country/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Stele/1.0)'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch country');
    }
    
    const country = await response.text();
    return country.trim().toUpperCase();
  } catch (error) {
    console.error('Error fetching country from IP:', error);
    return 'US'; // Default value
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    console.log('Detected IP:', ip);
    
    const country = await getCountryFromIP(ip);
    console.log('Detected country:', country);
    
    const language = countryToLanguage[country] || 'en';
    console.log('Suggested language:', language);
    
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