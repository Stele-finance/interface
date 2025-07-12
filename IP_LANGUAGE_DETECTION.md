# IP-based Language Auto-Detection Feature

This feature detects the user's country based on their IP address and automatically sets the appropriate language translation for that country.

## Feature Overview

- **Auto Detection**: Detects country based on IP address when users first visit
- **Language Mapping**: Automatically sets appropriate language based on detected country
- **User Choice Priority**: Manual language selection takes precedence over auto-detection
- **Notification System**: Shows notification when language is automatically set

## How It Works

1. User visits site for the first time
2. Check localStorage for manual language selection history
3. If no manual selection, call `/api/detect-language` API
4. API detects country based on IP address
5. Automatically set to appropriate language for the country
6. Show notification to user

## Supported Countries & Languages

### Asia
- 🇰🇷 South Korea → Korean (kr)
- 🇯🇵 Japan → Japanese (jp)
- 🇨🇳 China → Simplified Chinese (zh-cn)
- 🇹🇼 Taiwan → Traditional Chinese (zh-tw)
- 🇭🇰 Hong Kong → Traditional Chinese (zh-tw)
- 🇮🇳 India → Hindi (hi)
- 🇧🇩 Bangladesh → Bengali (bn)
- 🇵🇰 Pakistan → Hindi (hi)
- 🇮🇩 Indonesia → Indonesian (id)
- 🇲🇾 Malaysia → Malay (ms)
- 🇹🇭 Thailand → Thai (th)
- 🇻🇳 Vietnam → Vietnamese (vi)

### Europe
- 🇫🇷 France → French (fr)
- 🇩🇪 Germany → German (de)
- 🇮🇹 Italy → Italian (it)
- 🇪🇸 Spain → Spanish (es)
- 🇳🇱 Netherlands → Dutch (nl)
- 🇩🇰 Denmark → Danish (da)
- 🇫🇮 Finland → Finnish (fi)
- 🇬🇷 Greece → Greek (el)
- 🇭🇺 Hungary → Hungarian (hu)
- 🇷🇺 Russia → Russian (ru)

### Americas
- 🇺🇸 United States → English (en)
- 🇬🇧 United Kingdom → English (en)
- 🇲🇽 Mexico → Spanish (es)
- 🇧🇷 Brazil → Portuguese (pt)
- 🇵🇹 Portugal → Portuguese (pt)
- 🇦🇷 Argentina → Spanish (es)
- Other South American countries → Spanish (es)

### Middle East
- 🇪🇬 Egypt → Arabic (ar)
- 🇸🇦 Saudi Arabia → Arabic (ar)
- 🇦🇪 UAE → Arabic (ar)
- 🇮🇱 Israel → Hebrew (he)
- Other Arab countries → Arabic (ar)

## API Endpoint

### GET `/api/detect-language`

Detects country and language based on user's IP address.

**Response Example:**
```json
{
  "ip": "123.456.789.0",
  "country": "KR",
  "language": "kr",
  "success": true
}
```

## Implementation Files

- `app/api/detect-language/route.ts` - IP-based country detection API
- `lib/language-context.tsx` - Language context with auto-detection logic
- `components/language-auto-detect-notification.tsx` - Auto-detection notification component
- `components/language-auto-detect-test.tsx` - Development test component

## Developer Testing

Test panel appears in bottom-left corner in development environment:

- **Test IP Detection**: Test country detection for current IP
- **Reset Settings**: Reset language settings to re-test auto-detection
- **Status Display**: Check current language and auto-detection status

## User Experience

1. **First-time visitors**: Auto-set language based on IP + show notification
2. **Return visitors**: Keep previously selected language
3. **Manual selection**: Disable auto-detection when user selects language
4. **Settings reset**: Re-enable auto-detection after localStorage deletion

## Limitations

- Uses free IP geolocation API (1000 requests per month limit)
- Uses default values (US/English) in local development environment
- May differ from actual location when using VPN

## Future Improvements

- Implement more accurate IP geolocation service
- Hybrid detection combining browser language settings
- Improve country-language mapping through user feedback 