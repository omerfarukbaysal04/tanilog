const baseUrl = process.env.TANILOG_WEB_URL || 'http://localhost:3000';

const pages = [
  '/',
  '/login',
  '/register',
  '/privacy',
  '/terms',
  '/kvkk',
  '/dashboard',
  '/billing',
  '/settings',
];

for (const page of pages) {
  const response = await fetch(`${baseUrl}${page}`);
  if (!response.ok) {
    throw new Error(`${page} returned ${response.status}`);
  }
  const html = await response.text();
  if (!html.includes('Tan')) {
    throw new Error(`${page} does not look like a Tanilog page`);
  }
}

console.log('Frontend smoke pages passed');
