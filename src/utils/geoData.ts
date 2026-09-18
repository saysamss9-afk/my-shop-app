export interface CountryData {
  name: string;
  currency: string;
  symbol: string;
  rate: number; // 1 Currency = X GHS (for calculation logic)
}

// Key markets with specific rates relative to GHS
const PRIORITY_COUNTRIES: CountryData[] = [
  { name: 'Ghana', currency: 'GHS', symbol: 'GH₵', rate: 1 },
  { name: 'Nigeria', currency: 'NGN', symbol: '₦', rate: 0.01 },
  { name: 'Kenya', currency: 'KES', symbol: 'KSh', rate: 0.12 },
  { name: 'South Africa', currency: 'ZAR', symbol: 'R', rate: 0.85 },
  { name: 'United Kingdom', currency: 'GBP', symbol: '£', rate: 19.5 },
  { name: 'United States', currency: 'USD', symbol: '$', rate: 15.2 },
  { name: 'Canada', currency: 'CAD', symbol: 'C$', rate: 11.2 },
  { name: 'Germany', currency: 'EUR', symbol: '€', rate: 16.5 },
  { name: 'France', currency: 'EUR', symbol: '€', rate: 16.5 },
  { name: 'Italy', currency: 'EUR', symbol: '€', rate: 16.5 },
  { name: 'Spain', currency: 'EUR', symbol: '€', rate: 16.5 },
  { name: 'China', currency: 'CNY', symbol: '¥', rate: 2.1 },
  { name: 'Japan', currency: 'JPY', symbol: '¥', rate: 0.1 },
  { name: 'India', currency: 'INR', symbol: '₹', rate: 0.18 },
  { name: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ', rate: 4.1 },
  { name: 'Australia', currency: 'AUD', symbol: 'A$', rate: 10.2 },
  { name: 'Brazil', currency: 'BRL', symbol: 'R$', rate: 2.7 },
  { name: 'Egypt', currency: 'EGP', symbol: 'E£', rate: 0.31 },
  { name: 'Liberia', currency: 'LRD', symbol: 'L$', rate: 0.08 },
  { name: 'Sierra Leone', currency: 'SLL', symbol: 'Le', rate: 0.0007 },
  { name: 'Tanzania', currency: 'TZS', symbol: 'TSh', rate: 0.006 },
  { name: 'Uganda', currency: 'UGX', symbol: 'USh', rate: 0.004 },
];

const CFA_COUNTRIES = [
  "Benin", "Burkina Faso", "Ivory Coast", "Guinea-Bissau", "Mali", "Niger", "Senegal", "Togo",
  "Cameroon", "Central African Republic", "Chad", "Congo (Congo-Brazzaville)", "Equatorial Guinea", "Gabon"
];

// Full list of countries (simplified names for UI)
export const ALL_COUNTRY_NAMES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Holy See", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
  "Ireland", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
  "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
  "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

export const getCountryData = (name: string): CountryData => {
  const priority = PRIORITY_COUNTRIES.find(c => c.name === name);
  if (priority) return priority;

  if (CFA_COUNTRIES.includes(name)) {
    return {
      name,
      currency: 'CFA',
      symbol: 'FCFA',
      rate: 0.025, // 1 CFA = 0.025 GHS (approx based on EUR rate)
    };
  }

  // Fallback for all other countries: Use USD as international standard
  return {
    name,
    currency: 'USD',
    symbol: '$',
    rate: 15.2, // Default USD to GHS rate
  };
};

// For backward compatibility or components that need a list
export const COUNTRIES: CountryData[] = ALL_COUNTRY_NAMES.map(name => getCountryData(name));
