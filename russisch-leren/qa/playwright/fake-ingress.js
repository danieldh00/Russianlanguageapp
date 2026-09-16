// Stand-in for Home Assistant's Ingress proxy: serves the add-on under
// /api/hassio_ingress/<token>/ and strips that prefix before forwarding,
// exactly as supervisor/api/ingress.py does (_create_url builds
// http://<ip>:<ingress_port>/<path> from the remainder).
const http = require('http');

const PREFIX = '/api/hassio_ingress/TESTTOKEN';
const UPSTREAM = { host: '127.0.0.1', port: 3000 };

http.createServer((req, res) => {
  if (!req.url.startsWith(PREFIX)) {
    res.statusCode = 404;
    return res.end('not ingress');
  }
  const rest = req.url.slice(PREFIX.length) || '/';
  const headers = { ...req.headers };
  delete headers.host;
  const proxied = http.request(
    { ...UPSTREAM, method: req.method, path: rest, headers },
    (up) => {
      res.writeHead(up.statusCode, up.headers);
      up.pipe(res);
    }
  );
  proxied.on('error', (e) => { res.statusCode = 502; res.end(String(e)); });
  req.pipe(proxied);
}).listen(3998, () => console.log('fake ingress op 3998, prefix ' + PREFIX));
