self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'TanıLog', body: event.data ? event.data.text() : 'Yeni bildirim' };
  }
  const title = payload.title || 'TanıLog';
  const options = {
    body: payload.body || 'Yeni bildirimin var.',
    data: { route: payload.route || '/dashboard' },
    icon: '/logos/logo-white-text.png',
    badge: '/logos/logo-white-text.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = event.notification.data?.route || '/dashboard';
  event.waitUntil(clients.openWindow(route));
});
