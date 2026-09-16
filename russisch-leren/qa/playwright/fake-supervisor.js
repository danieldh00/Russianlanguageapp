// Minimal stand-in for Supervisor's Core API proxy, so the Home Assistant
// integration can be exercised without a real Home Assistant. Records every
// request to /tmp/.../fake-supervisor.log as JSON lines.
const http = require('http');
const fs = require('fs');
const LOG = __dirname + '/fake-supervisor.log';
fs.writeFileSync(LOG, '');
http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    fs.appendFileSync(LOG, JSON.stringify({ method: req.method, url: req.url, auth: req.headers.authorization, body: body ? JSON.parse(body) : null }) + '\n');
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/core/api/services') {
      res.end(JSON.stringify([{ domain: 'notify', services: { notify: {}, persistent_notification: {}, mobile_app_iphone_van_daniel: {}, mobile_app_ipad: {} } }, { domain: 'light', services: { turn_on: {} } }]));
    } else if (req.url.startsWith('/core/api/states/')) {
      res.end(JSON.stringify({ entity_id: req.url.split('/').pop(), state: 'ok' }));
    } else if (req.url.startsWith('/core/api/services/')) {
      res.end('[]');
    } else {
      res.statusCode = 404; res.end('{}');
    }
  });
}).listen(3999, () => console.log('fake supervisor on 3999'));
