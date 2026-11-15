// 8-bit icons: Pixelarticons (https://pixelarticons.com) — MIT License, Copyright (c) 2019 Gerrit Halfmann.
// rocket, satellite, orbit, mountain, satellite-dish and telescope are custom pixel art drawn for Laika Program.
// Keys keep the names used across the code.
const P = {
  'volume': `<path d="M13 22h-2v-2H9v-2h2V6H9V4h2V2h2v20Zm-4-4H7v-2h2v2Zm10 0h-4v-2h4v2ZM7 10H5v4h2v2H3V8h4v2Zm14 6h-2V8h2v8Zm-4-2h-2v-4h2v4ZM9 8H7V6h2v2Zm10 0h-4V6h4v2Z"/>`,
  'volume-x': `<path d="M13 22h-2v-2H9v-2h2V6H9V4h2V2h2v20Zm-4-4H7v-2h2v2Zm-2-8H5v4h2v2H3V8h4v2Zm10.001 5.224h-2v-2H17v-2h-1.999v-2h2v2H19v2h-1.999v2Zm3.999 0h-2v-2h2v2Zm0-4h-2v-2h2v2ZM9 8H7V6h2v2Z"/>`,
  'heart': `<path d="M13 22h-2v-2h2v2Zm-2-2H9v-2h2v2Zm4 0h-2v-2h2v2Zm-6-2H7v-2h2v2Zm8 0h-2v-2h2v2ZM7 16H5v-2h2v2Zm12 0h-2v-2h2v2ZM5 14H3v-2h2v2Zm16 0h-2v-2h2v2ZM3 12H1V6h2v6Zm20 0h-2V6h2v6ZM13 8h-2V6h2v2ZM5 6H3V4h2v2Zm6 0H9V4h2v2Zm4 0h-2V4h2v2Zm6 0h-2V4h2v2ZM9 4H5V2h4v2Zm10 0h-4V2h4v2Z"/>`,
  'heart-pulse': `<path d="M13 22h-2v-2h2v2Zm-2-2H9v-2h2v2Zm4 0h-2v-2h2v2Zm-6-2H7v-2h2v2Zm8 0h-2v-2h2v2ZM7 16H5v-2h2v2Zm12 0h-2v-2h2v2ZM5 14H3v-2h2v2Zm16 0h-2v-2h2v2ZM3 12H1V6h2v6Zm20 0h-2V6h2v6ZM13 8h-2V6h2v2ZM5 6H3V4h2v2Zm6 0H9V4h2v2Zm4 0h-2V4h2v2Zm6 0h-2V4h2v2ZM9 4H5V2h4v2Zm10 0h-4V2h4v2Z"/>`,
  'zap': `<path d="M4 13h8v6h2v2h-2v2h-2v-8H2v-4h2v2Zm12 6h-2v-2h2v2Zm2-2h-2v-2h2v2Zm2-2h-2v-2h2v2Zm-6-6h8v4h-2v-2h-8V5h-2V3h2V1h2v8Zm-8 2H4V9h2v2Zm2-2H6V7h2v2Zm2-2H8V5h2v2Z"/>`,
  'battery-charging': `<path d="M4 5h14v2H4zm0 12h14v2H4zM2 7h2v10H2zm16-2h2v14h-2zm2 4h2v6h-2zM6 9h2v6H6zm4 0h2v6h-2zm4 0h2v6h-2z"/>`,
  'wind': `<path d="M2 7h10v2H2zm10-4h2v4h-2zM7 1h5v2H7zM2 11h18v2H2zm18-4h2v4h-2zm-4-2h4v2h-4zM2 17h12v-2H2zm12 2h2v-2h-2zm-5 2h5v-2H9z"/>`,
  'flask-conical': `<path d="M7 2h10v2H7zm1 2h2v16H8zm2 16h4v2h-4zm4-16h2v16h-2z"/> <path d="M8 13h8v2H8z"/>`,
  'radio-tower': `<path d="M4 10h6v2H4zm8 4h2v6h-2zm6 0h2v6h-2zM4 16h4v4H4zm12-6h2v4h-2zm-2-2h2v2h-2zM4 4h6v2H4zm6 2h4v2h-4zm0 6h2v2h-2z"/>`,
  'clock': `<path d="M6 2h12v2H6zM2 6h2v12H2zm18 0h2v12h-2zm-2-2h2v2h-2zM4 4h2v2H4zm2 18h12v-2H6zm12-2h2v-2h-2zM4 20h2v-2H4zm7-14h2v7h-2zm2 7h2v2h-2zm2 2h2v2h-2z"/>`,
  'brain': `<path d="M9 4h6v2H9zM7 6h2v2H7zm8 0h2v2h-2zm4-2h2v2h-2zm2-2h2v2h-2zM0 10h3v2H0zm21 0h3v2h-3zM3 4h2v2H3zM1 2h2v2H1zm6 12h2v2H7zm8 0h2v2h-2zM5 8h2v6H5zm12 0h2v6h-2zm-8 8h6v2H9zm0 4h6v2H9zm0-2h2v2H9zm4 0h2v2h-2zM11 0h2v3h-2z"/>`,
  'wrench': `<path d="M9 22H7v-2h2v2Zm12-6h2v6h-6v-6h2v-6h2v6Zm-2 2v2h2v-2h-2ZM7 20H5v-8h2v8Zm4 0H9v-8h2v8Zm-6-8H3v-2h2v2Zm8 0h-2v-2h2v2ZM3 10H1V4h2v6Zm12 0h-2V4h2v6Zm4 0h-2V4h2v6Zm4 0h-2V4h2v6ZM7 6h2V2h4v2h-2v4H5V4H3V2h4v4Zm14-2h-2V2h2v2Z"/>`,
  'feather': `<path d="M2 20h2v2H2zm6-2h6v2H8zm-2-2h2v2H6zm-2 2h2v2H4zm4-4h2v2H8zm2-2h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2zm0 8h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2zm2-6h2v6h-2zm-2-2h2v2h-2zM4 10h2v6H4zm2-2h2v2H6zm2-2h2v2H8zm2-2h2v2h-2zm2-2h6v2h-6z"/>`,
  'shield': `<path d="M4 2h16v2H4zM2 4h2v10H2zm18 0h2v10h-2zM4 14h2v2H4zm2 2h2v2H6zm4 4h4v2h-4zm10-6h-2v2h2zm-2 2h-2v2h2zm-2 2h-2v2h2zm-6 0H8v2h2z"/>`,
  'shield-check': `<path d="M4 2h16v2H4zM2 4h2v10H2zm18 0h2v10h-2zM4 14h2v2H4zm2 2h2v2H6zm4 4h4v2h-4zm10-6h-2v2h2zm-2 2h-2v2h2zm-2 2h-2v2h2zm-6 0H8v2h2z"/>`,
  'coins': `<path d="M6 2h6v2H6zM4 4h2v2H4zm8 0h2v2h-2zm-8 8h2v2H4zm8 0h2v2h-2zm-6 2h6v2H6zM2 6h2v6H2zm12 0h2v6h-2z"/> <path d="M14 8h4v2h-4zm-4 10h2v2h-2zm8-8h2v2h-2zm-6 10h2v2h-2zm6-2h2v2h-2z"/> <path d="M12 20h6v2h-6zm-4-6h2v4H8zm12-2h2v6h-2zM7 6h4v2H7z"/> <path d="M9 6h2v6H9zm6 8h2v4h-2zm-1-2h3v2h-3z"/>`,
  'weight': `<path d="M13 9h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2zm2-2h2v8h-2z"/> <path d="M13 3h8v2h-8zm-2 12H9v-2h2zm-2 2H7v-2h2zm-2 2H5v-2h2zm-2 2H3v-8h2z"/> <path d="M11 21H3v-2h8z"/>`,
  'sun': `<path d="M13 22h-2v-3h2v3Zm-6-3H5v-2h2v2Zm12 0h-2v-2h2v2Zm-4-2H9v-2h6v2Zm-6-2H7V9h2v6Zm8 0h-2V9h2v6ZM5 13H2v-2h3v2Zm17 0h-3v-2h3v2Zm-7-4H9V7h6v2ZM7 7H5V5h2v2Zm12 0h-2V5h2v2Zm-6-2h-2V2h2v3Z"/>`,
  'sparkles': `<path d="M11 1h2v4h-2zm0 22h2v-4h-2zM9 5h2v4H9zm0 14h2v-4H9zm4-14h2v4h-2zm0 14h2v-4h-2zM5 9h4v2H5zm14 0h-4v2h4zM1 11h4v2H1zm22 0h-4v2h4zM5 13h4v2H5zm14 0h-4v2h4zm0-12h2v6h-2z"/> <path d="M17 3h6v2h-6zM3 17h2v2H3zm-2 2h2v2H1zm2 2h2v2H3zm2-2h2v2H5z"/>`,
  'circle-help': `<path d="M18 22H6V20H18V22ZM6 20H4V18H6V20ZM20 20H18V18H20V20ZM4 18H2V6H4V18ZM13 18H11V16H13V18ZM22 18H20V6H22V18ZM15 13H13V15H11V11H15V13ZM17 11H15V8H17V11ZM9 10H7V8H9V10ZM15 8H9V6H15V8ZM6 6H4V4H6V6ZM20 6H18V4H20V6ZM18 4H6V2H18V4Z"/>`,
  'x': `<path d="M7 19H5V17H7V19ZM19 19H17V17H19V19ZM9 15V17H7V15H9ZM17 17H15V15H17V17ZM11 15H9V13H11V15ZM15 15H13V13H15V15ZM13 13H11V11H13V13ZM11 11H9V9H11V11ZM15 11H13V9H15V11ZM9 9H7V7H9V9ZM17 9H15V7H17V9ZM7 7H5V5H7V7ZM19 7H17V5H19V7Z"/>`,
  'check': `<path d="M10 18H8v-2h2v2Zm-2-2H6v-2h2v2Zm4-2v2h-2v-2h2Zm-6 0H4v-2h2v2Zm8 0h-2v-2h2v2Zm2-2h-2v-2h2v2Zm2-2h-2V8h2v2Zm2-2h-2V6h2v2Z"/>`,
  'play': `<path d="M15 11h-2V9h2zm0 4h-2v-2h2zm-2 2h-2v-2h2zm0-8h-2V7h2zm-2-2H9V5h2zM9 21H7V3h2zm6-8h2v-2h-2zm-6 4h2v2H9z"/>`,
  'pause': `<path d="M10 20H4V4h6v16Zm8-16v16h-6V4h6Zm-4 2v12h2V6h-2ZM6 18h2V6H6v12Z"/>`,
  'triangle-alert': `<path d="M2 10h2v2H2zm0 4h2v-2H2zm20-4h-2v2h2zm0 4h-2v-2h2zM4 8h2v2H4zm0 8h2v-2H4zm16-8h-2v2h2zm0 8h-2v-2h2zM6 6h2v2H6zm0 12h2v-2H6zM18 6h-2v2h2zm0 12h-2v-2h2zM8 4h2v2H8zm0 16h2v-2H8zm8-16h-2v2h2zm0 16h-2v-2h2zM10 2h2v2h-2zm0 20h2v-2h-2zm4-20h-2v2h2zm0 20h-2v-2h2zm-3-5h2v-2h-2zm0-4h2V7h-2z"/>`,
  'star': `<path d="M5 20H8V22H3V16H5V20ZM21 22H16V20H19V16H21V22ZM10 20H8V18H10V20ZM16 20H14V18H16V20ZM14 18H10V16H14V18ZM7 16H5V13H7V16ZM19 16H17V13H19V16ZM5 13H3V11H5V13ZM21 13H19V11H21V13ZM9 9H3V11H1V7H9V9ZM23 11H21V9H15V7H23V11ZM11 7H9V3H11V7ZM15 7H13V3H15V7ZM13 3H11V1H13V3Z"/>`,
  'users': `<path d="M5 2h6v2H5zm10 0h4v2h-4zM5 10h6v2H5zm10 0h4v2h-4zm4-6h2v6h-2zm-8 0h2v6h-2zM3 4h2v6H3zM0 18h2v4H0zm14 0h2v4h-2zm8 0h2v4h-2zM4 14h8v2H4zm12 0h4v2h-4zM2 16h2v2H2zm10 0h2v2h-2zm8 0h2v2h-2z"/>`,
  'user': `<path d="M9 2h6v2H9zm0 8h6v2H9zm6-6h2v6h-2zM7 4h2v6H7zM4 18h2v4H4zm14 0h2v4h-2zM8 14h8v2H8zm-2 2h2v2H6zm10 0h2v2h-2z"/>`,
  'trophy': `<path d="M16 17H13V19H15V21H9V19H11V17H8V15H16V17ZM18 5H22V11H20V7H18V11H20V13H18V15H16V5H8V15H6V13H4V11H6V7H4V11H2V5H6V3H18V5Z"/>`,
  'lock': `<path d="M5 8h14v2H5zm0 12h14v2H5zM3 10h2v10H3zm16 0h2v10h-2zM7 4h2v4H7zm2-2h6v2H9zm6 2h2v4h-2z"/>`,
  'flame': `<path d="M9 2h2v4H9zM7 6h2v2H7zM5 8h2v2H5zm8 2h2v2h-2zm2-2h2v2h-2zm2 2h2v2h-2zm2 2h2v6h-2zM3 10h2v8H3zm8-4h2v4h-2zm6 12h2v2h-2zM7 20h10v2H7zm-2-2h2v2H5zm4-2h6v4H9z"/> <path d="M11 14h2v3h-2z"/>`,
  'thermometer': `<path d="M9 2h6v2H9zm0 18h6v2H9zm2-4h2v2h-2zM7 4h2v16H7zm8 0h2v16h-2z"/> <path d="M5 16h4v2H5zM5 6h4v2H5zm0 5h4v2H5z"/>`,
  'cpu': `<path d="M5 3h14v2H5zm0 16h14v2H5zM3 5h2v14H3zm16 0h2v14h-2zM9 7h6v2H9zm0 8h6v2H9zM7 9h2v6H7zm8 0h2v6h-2zm-4-8h2v2h-2zm0 20h2v2h-2zM1 11h2v2H1zm20 0h2v2h-2zm0-4h2v2h-2zm0 8h2v2h-2zM1 15h2v2H1zm0-8h2v2H1zm6-6h2v2H7zm8 0h2v2h-2zm0 20h2v2h-2zm-8 0h2v2H7z"/>`,
  'wifi-off': `<path d="M11 19h2v2h-2zm-4-3h2v2H7zm8 0h2v2h-2zm-6-2h6v2H9zm-5-1h2v2H4zm2-2h2v2H6zm2-2h8v2H8zm-7 1h2v2H1zm20 0h2v2h-2zM3 8h2v2H3zm2-2h2v2H5zm2-2h10v2H7zm12 4h2v2h-2zm-2-2h2v2h-2zm1 7h2v2h-2zm-2-2h2v2h-2z"/>`,
  'battery-low': `<path d="M4 5h14v2H4zm0 12h14v2H4zM2 7h2v10H2zm16-2h2v14h-2zm2 4h2v6h-2zM6 9h2v6H6z"/>`,
  'siren': `<path d="M6 11h2v5H6zm2-2h2v2H8zm2-2h4v2h-4zm4 2h2v2h-2zm2 2h2v5h-2zM6 16h12v2H6zm-2 4h16v2H4zm0-2h2v2H4zm14 0h2v2h-2zm-7-6h2v4h-2zm9-1h3v2h-3zM1 11h3v2H1zm5-6h2v2H6zm10 0h2v2h-2zm2-2h2v2h-2zM4 3h2v2H4zm7-1h2v3h-2z"/>`,
  'stethoscope': `<path d="M8 6h8v2H8zm0-4h8v2H8zm0 6h2v2H8zm6 0h2v2h-2zM6 20h12v2H6zm-2-8h2v8H4zm14 0h2v8h-2zM6 10h2v2H6zm10 0h2v2h-2zM6 4h2v2H6zm10 0h2v2h-2z"/>`,
  'compass': `<path d="M18 22H6V20H18V22ZM6 20H4V18H6V20ZM20 20H18V18H20V20ZM10 16H12V18H10V19H8V10H10V16ZM4 18H2V6H4V18ZM22 18H20V6H22V18ZM14 16H12V14H14V16ZM16 14H14V8H12V6H14V5H16V14ZM13 13H11V11H13V13ZM12 10H10V8H12V10ZM6 6H4V4H6V6ZM20 6H18V4H20V6ZM18 4H6V2H18V4Z"/>`,
  'droplet': `<path d="M2 18h4v-2H2zm0-6h4v-2H2zm0-6h4V4H2zm4 14h4v-2H6zm0-6h4v-2H6zm0-6h4V6H6zm4 10h4v-2h-4zm0-6h4v-2h-4zm0-6h4V4h-4zm4 14h4v-2h-4zm0-6h4v-2h-4zm0-6h4V6h-4zm4 10h4v-2h-4zm0-6h4v-2h-4zm0-6h4V4h-4z"/>`,
  'fuel': `<path d="M8 6h8v2H8zm0-4h8v2H8zm0 6h2v2H8zm6 0h2v2h-2zM6 20h12v2H6zm-2-8h2v8H4zm14 0h2v8h-2zM6 10h2v2H6zm10 0h2v2h-2zM6 4h2v2H6zm10 0h2v2h-2z"/>`,
  'radiation': `<path d="M2 10h2v2H2zm0 4h2v-2H2zm20-4h-2v2h2zm0 4h-2v-2h2zM4 8h2v2H4zm0 8h2v-2H4zm16-8h-2v2h2zm0 8h-2v-2h2zM6 6h2v2H6zm0 12h2v-2H6zM18 6h-2v2h2zm0 12h-2v-2h2zM8 4h2v2H8zm0 16h2v-2H8zm8-16h-2v2h2zm0 16h-2v-2h2zM10 2h2v2h-2zm0 20h2v-2h-2zm4-20h-2v2h2zm0 20h-2v-2h2zm-3-5h2v-2h-2zm0-4h2V7h-2z"/>`,
  'package': `<path d="M10 20h4v2h-4zm0-16h4V2h-4zm0 6h4v2h-4zm4 8h4v2h-4zm0-12h4V4h-4zm0 2h4v2h-4zm4 8h4v2h-4zm0-8h4V6h-4zM6 18h4v2H6zM6 6h4V4H6zm0 2h4v2H6zm-4 8h4v2H2zm0-8h4V6H2z"/> <path d="M2 6h2v12H2zm18 0h2v12h-2zm-8 6h2v8h-2zm-2-6h4v2h-4z"/>`,
  'arrow-right': `<path d="M4 11v2h16v-2zm12 2v2h2v-2zm-2 2v2h2v-2zm-2 2v2h2v-2zm4-6V9h2v2z"/> <path d="M14 15V7h2v8zm-2 2V5h2v12z"/>`,
  'refresh-cw': `<path d="M13 20H9V18H13V20ZM19 16H21V18H19V20H17V18H15V16H17V8H19V16ZM9 18H7V16H9V18ZM7 6H9V8H7V16H5V8H3V6H5V4H7V6ZM15 16H13V14H15V16ZM23 16H21V14H23V16ZM3 10H1V8H3V10ZM11 10H9V8H11V10ZM17 8H15V6H17V8ZM15 6H11V4H15V6Z"/>`,
  'house': `<path d="M4 20h16v2H4zm16-10h2v10h-2zM2 10h2v10H2zm2-2h2v2H4zm2-2h2v2H6zm2-2h2v2H8zm2-2h4v2h-4zm4 2h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2zM8 14h2v6H8zm2-2h4v2h-4zm4 2h2v6h-2z"/>`,
  'map': `<path d="M4 20h2v2H2V6h2v14Zm12 0h2v2h-4v-2h-2v-2h2V8h-2V6h4v14Zm-8 0H6v-2h2v2Zm12 0h-2v-2h2v2ZM10 4h2v2h-2v10h2v2H8V4H6V2h4v2Zm12 14h-2V4h-2V2h4v16ZM6 6H4V4h2v2Zm12 0h-2V4h2v2Z"/>`,
  'moon': `<path d="M18 22H8v-2h10v2ZM8 20H6v-2h2v2Zm12 0h-2v-2h2v2ZM6 18H4v-2h2v2Zm16 0h-2v-4h-2v-2h2v-2h2v8ZM4 16H2V6h2v10Zm14 0h-6v-2h6v2Zm-6-2h-2v-2h2v2Zm-2-2H8V6h2v6ZM6 6H4V4h2v2Zm8-2h-2v2h-2V4H6V2h8v2Z"/>`,
  'earth': `<path d="M6 2h12v2H6zm0 18h12v2H6zM18 4h2v2h-2zM4 18h2v2H4zM4 4h2v2H4zm14 14h2v2h-2zM2 6h2v12H2zm18 0h2v12h-2zM8 4h2v4H8zm2 4h4v2h-4zm4 2h4v2h-4zm4-2h2v2h-2zM4 12h2v2H4zm6 4h2v4h-2zm-4-2h4v2H6zm8 2h2v4h-2zm2-2h4v2h-4z"/>`,
  'gem': `<path d="M7 1h10v2H7zM5 3h2v2H5zm12 0h2v2h-2zm2 2h2v2h-2zm0 8h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-2 2h2v2h-2zm-2-2h2v2H9zm-2-2h2v2H7zm-2-2h2v2H5zm-2-2h2v2H3zm0-8h2v2H3zM1 7h2v6H1zm20 0h2v6h-2zM3 9h18v2H3zm6-6h2v3H9zM7 6h2v3H7zm8 0h2v3h-2zm-8 5h2v2H7zm2 2h2v3H9zm2 3h2v3h-2zm2-3h2v3h-2zm2-2h2v2h-2zm-2-8h2v3h-2z"/>`,
  'frown': `<path d="M6 20h12v2H6zM6 2h12v2H6zm12 2h2v2h-2zM4 4h2v2H4zm0 14h2v2H4zm14 0h2v2h-2zM2 6h2v12H2zm18 0h2v12h-2zM8 8h2v2H8zm6 0h2v2h-2zm-7 7h2v2H7zm2-2h6v2H9zm6 2h2v2h-2z"/>`,
  'cloud-lightning': `<path d="M4 13h8v6h2v2h-2v2h-2v-8H2v-4h2v2Zm12 6h-2v-2h2v2Zm2-2h-2v-2h2v2Zm2-2h-2v-2h2v2Zm-6-6h8v4h-2v-2h-8V5h-2V3h2V1h2v8Zm-8 2H4V9h2v2Zm2-2H6V7h2v2Zm2-2H8V5h2v2Z"/>`,
  'bug': `<path d="M2 5h2v4H2zm20 0h-2v4h2zM4 9h2v2H4zm16 0h-2v2h2zM2 13h4v2H2zm20 0h-4v2h4zM4 17h2v2H4zm16 0h-2v2h2zM2 19h2v2H2zm20 0h-2v2h2zM6 11h12v2H6z"/> <path d="M6 7h2v12H6zm10 0h2v12h-2zM8 19h8v2H8zM8 5h8v2H8z"/> <path d="M11 15h2v6h-2zM8 1h2v6H8zm6 0h2v6h-2z"/>`,
  'circle-dot': `<path d="M6 2h12v2H6zm0 18h12v2H6zM2 6h2v12H2zm18 0h2v12h-2zm-2-2h2v2h-2zm0 14h2v2h-2zM4 4h2v2H4zm0 14h2v2H4z"/>`,
  'hard-hat': `<path d="M10 2h4v4h-4zM3 7h18v2H3zm6 2h2v7H9zm4 0h2v7h-2zm-4 7h2v6H9zm4 0h2v6h-2zm-2-2h2v2h-2z"/>`,
  'scan-search': `<path d="M22 22h-2v-2h2v2Zm-2-2h-2v-2h2v2Zm-6-2H6v-2h8v2Zm4 0h-2v-2h2v2ZM6 16H4v-2h2v2Zm10 0h-2v-2h2v2ZM4 14H2V6h2v8Zm14 0h-2V6h2v8ZM6 6H4V4h2v2Zm10 0h-2V4h2v2Zm-2-2H6V2h8v2Z"/>`,
  'target': `<path d="M5 1h14v2H5zM3 3h2v2H3zm0 16h2v2H3zm16 0h2v2h-2zm0-16h2v2h-2zm2 2h2v14h-2zM5 21h14v2H5zM1 5h2v14H1zm8 0h6v2H9zM5 9h2v6H5zm4 8h6v2H9zm8-8h2v6h-2zm-6 0h2v2h-2zM7 7h2v2H7zm0 8h2v2H7zm8 0h2v2h-2zm0-8h2v2h-2zm-6 4h2v2H9zm2 2h2v2h-2zm2-2h2v2h-2z"/>`,
  'timer': `<path d="M16 22H8v-2h8v2Zm-8-2H6v-4h2v4Zm10 0h-2v-4h2v4Zm-8-4H8v-2h2v2Zm6 0h-2v-2h2v2Zm-6-6h4v4h-4v-4Zm0 0H8V8h2v2Zm6 0h-2V8h2v2ZM8 8H6V4h2v4Zm10 0h-2V4h2v4Zm-2-4H8V2h8v2Z"/>`,
  'info': `<path d="M18 22H6V20H18V22ZM6 20H4V18H6V20ZM20 20H18V18H20V20ZM4 18H2V6H4V18ZM22 18H20V6H22V18ZM13 17H11V11H13V17ZM13 9H11V7H13V9ZM6 6H4V4H6V6ZM20 6H18V4H20V6ZM18 4H6V2H18V4Z"/>`,
  'chevron-right': `<path d="M16 13v-2h-2v2h2Zm-2-2V9h-2v2h2Zm0 4v-2h-2v2h2Zm-2-6V7h-2v2h2Zm0 8v-2h-2v2h2ZM10 7V5H8v2h2Zm0 12v-2H8v2h2Z"/>`,
  'signal': `<path d="M19 3h2v18h-2zm-4 4h2v14h-2zm-4 4h2v10h-2zm-4 4h2v6H7zm-4 4h2v2H3z"/>`,
  'cog': `<path d="M4 20h3v-2h4v4h2v-4h4v2h-2v4H9v-4H7v2H2v-5h2v3Zm18 2h-5v-2h3v-3h2v5ZM6 11H2v2h4v4H4v-2H0V9h4V7h2v4Zm14-2h4v6h-4v2h-2v-4h4v-2h-4V7h2v2Zm-6 7h-4v-2h4v2Zm-4-2H8v-4h2v4Zm6 0h-2v-4h2v4Zm-2-4h-4V8h4v2ZM7 4H4v3H2V2h5v2Zm8 0h2V2h5v5h-2V4h-3v2h-4V2h-2v4H7V4h2V0h6v4Z"/>`,
  'tornado': `<path d="M2 18h4v-2H2zm0-6h4v-2H2zm0-6h4V4H2zm4 14h4v-2H6zm0-6h4v-2H6zm0-6h4V6H6zm4 10h4v-2h-4zm0-6h4v-2h-4zm0-6h4V4h-4zm4 14h4v-2h-4zm0-6h4v-2h-4zm0-6h4V6h-4zm4 10h4v-2h-4zm0-6h4v-2h-4zm0-6h4V4h-4z"/>`,
  'box': `<path d="M14 4h4v2h-4zm-4-2h4v2h-4zM6 8h4v2H6zm0 10h4v2H6zm4-8h4v2h-4zm0 10h4v2h-4zm4-12h4v2h-4zm0 10h4v2h-4zM6 4h4v2H6zM2 6h4v2H2zm0 10h4v2H2zM18 6h4v2h-4zm0 10h4v2h-4z"/> <path d="M2 6h2v12H2zm18 0h2v12h-2zm-8 6h2v8h-2z"/>`,
  'shell': `<path d="M4 2h16v2H4zM2 4h2v10H2zm18 0h2v10h-2zM4 14h2v2H4zm2 2h2v2H6zm4 4h4v2h-4zm10-6h-2v2h2zm-2 2h-2v2h2zm-2 2h-2v2h2zm-6 0H8v2h2z"/>`,
  'hammer': `<path d="M9 22H7v-2h2v2Zm12-6h2v6h-6v-6h2v-6h2v6Zm-2 2v2h2v-2h-2ZM7 20H5v-8h2v8Zm4 0H9v-8h2v8Zm-6-8H3v-2h2v2Zm8 0h-2v-2h2v2ZM3 10H1V4h2v6Zm12 0h-2V4h2v6Zm4 0h-2V4h2v6Zm4 0h-2V4h2v6ZM7 6h2V2h4v2h-2v4H5V4H3V2h4v4Zm14-2h-2V2h2v2Z"/>`,
  'bot': `<path d="M5 7h14v2H5zm0 12h14v2H5zM3 9h2v10H3zm16 0h2v10h-2zM1 13h2v2H1zm20 0h2v2h-2zM11 5h2v2h-2zM7 3h4v2H7zm1 9h2v4H8zm6 0h2v4h-2z"/>`,
  'microscope': `<path d="M7 2h10v2H7zm1 2h2v16H8zm2 16h4v2h-4zm4-16h2v16h-2z"/> <path d="M8 13h8v2H8z"/>`,
  'crosshair': `<path d="M5 1h14v2H5zM3 3h2v2H3zm0 16h2v2H3zm16 0h2v2h-2zm0-16h2v2h-2zm2 2h2v14h-2zM5 21h14v2H5zM1 5h2v14H1zm8 0h6v2H9zM5 9h2v6H5zm4 8h6v2H9zm8-8h2v6h-2zm-6 0h2v2h-2zM7 7h2v2H7zm0 8h2v2H7zm8 0h2v2h-2zm0-8h2v2h-2zm-6 4h2v2H9zm2 2h2v2h-2zm2-2h2v2h-2z"/>`,
  'rocket': `<path d="M10 2h4v2h-4zM8 4h8v2h-8zM8 6h2v2h-2zM14 6h2v2h-2zM8 8h2v2h-2zM14 8h2v2h-2zM8 10h8v2h-8zM6 12h12v2h-12zM4 14h16v2h-16zM4 16h4v2h-4zM10 16h4v2h-4zM16 16h4v2h-4zM10 18h4v2h-4zM8 20h2v2h-2zM14 20h2v2h-2z"/>`,
  'satellite': `<path d="M10 2h4v2h-4zM12 4h2v2h-2zM8 6h8v2h-8zM0 8h6v2h-6zM8 8h8v2h-8zM18 8h6v2h-6zM0 10h22v2h-22zM0 12h6v2h-6zM8 12h8v2h-8zM18 12h6v2h-6zM8 14h8v2h-8zM8 16h8v2h-8z"/>`,
  'orbit': `<path d="M8 2h8v2h-8zM4 4h4v2h-4zM16 4h4v2h-4zM2 6h2v2h-2zM8 6h8v2h-8zM20 6h2v2h-2zM0 8h2v2h-2zM6 8h12v2h-12zM22 8h2v2h-2zM0 10h2v2h-2zM6 10h12v2h-12zM20 10h4v2h-4zM0 12h2v2h-2zM6 12h12v2h-12zM22 12h2v2h-2zM2 14h2v2h-2zM8 14h8v2h-8zM20 14h2v2h-2zM4 16h4v2h-4zM16 16h4v2h-4zM8 18h8v2h-8z"/>`,
  'mountain': `<path d="M12 4h2v2h-2zM10 6h6v2h-6zM8 8h10v2h-10zM6 10h6v2h-6zM14 10h6v2h-6zM4 12h4v2h-4zM12 12h2v2h-2zM18 12h4v2h-4zM2 14h4v2h-4zM20 14h4v2h-4zM0 16h24v2h-24z"/>`,
  'satellite-dish': `<path d="M2 2h2v2h-2zM4 4h2v2h-2zM16 4h4v2h-4zM6 6h2v2h-2zM14 6h2v2h-2zM18 6h2v2h-2zM0 8h2v2h-2zM8 8h2v2h-2zM12 8h2v2h-2zM18 8h2v2h-2zM0 10h2v2h-2zM10 10h2v2h-2zM16 10h2v2h-2zM2 12h2v2h-2zM14 12h2v2h-2zM4 14h2v2h-2zM10 14h4v2h-4zM6 16h4v2h-4zM8 18h4v2h-4zM6 20h8v2h-8z"/>`,
  'telescope': `<path d="M16 2h6v2h-6zM12 4h10v2h-10zM8 6h10v2h-10zM4 8h10v2h-10zM4 10h6v2h-6zM8 12h2v2h-2zM12 12h2v2h-2zM6 14h2v2h-2zM14 14h2v2h-2zM4 16h2v2h-2zM16 16h2v2h-2zM2 18h2v2h-2zM18 18h2v2h-2z"/>`,
};

export const iconBody = name => P[name] || P['circle-dot'];

/** Inline pixel icon (fill = currentColor). */
export function icon(name, size = 20, cls = '') {
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" shape-rendering="crispEdges" aria-hidden="true">${iconBody(name)}</svg>`;
}

const imgCache = new Map();
/** Icon as an <img> (for drawing on canvas). Cached per name+color. */
export function iconImage(name, color = '#ffffff') {
  const key = `${name}|${color}`;
  if (imgCache.has(key)) return imgCache.get(key);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${color}" shape-rendering="crispEdges">${iconBody(name)}</svg>`;
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  imgCache.set(key, img);
  return img;
}

/** Draws an icon centered at (x, y) on a canvas context. */
export function drawIcon(ctx, name, x, y, size, color) {
  const img = iconImage(name, color);
  if (img.complete && img.naturalWidth) ctx.drawImage(img, Math.round(x - size / 2), Math.round(y - size / 2), size, size);
}
