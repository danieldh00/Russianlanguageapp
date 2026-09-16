const fs = require('fs');

// When running as a Home Assistant Add-on, Supervisor writes the user's
// configured options (Settings > Add-ons > this add-on > Configuration) to
// /data/options.json inside the container. Map the ones this app cares about
// onto process.env before anything else reads them. No-op for every other
// deployment (plain Docker / local dev), where that file doesn't exist.
function loadAddonOptions() {
  const OPTIONS_PATH = '/data/options.json';
  if (!fs.existsSync(OPTIONS_PATH)) return;

  let options;
  try {
    options = JSON.parse(fs.readFileSync(OPTIONS_PATH, 'utf8'));
  } catch (e) {
    console.warn('Kon /data/options.json niet lezen:', e.message);
    return;
  }

  if (options.session_secret && !process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = options.session_secret;
  }
  if (options.anthropic_api_key && !process.env.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = options.anthropic_api_key;
  }
  if (options.ai_model && !process.env.ANTHROPIC_API_MODEL) {
    process.env.ANTHROPIC_API_MODEL = options.ai_model;
  }
  // Off by default is wrong for the existing household install (it would
  // silently disappear on upgrade), so this only ever *disables* on an
  // explicit opt-out -- never require the option to be present to work.
  if (options.leaderboard_enabled === false) {
    process.env.LEADERBOARD_ENABLED = 'false';
  }
  // the address the app is reachable on from a phone (e.g. the Cloudflare
  // hostname), used as the link inside Home Assistant notifications
  if (options.public_url && !process.env.PUBLIC_URL) {
    process.env.PUBLIC_URL = String(options.public_url).replace(/\/+$/, '');
  }
}

module.exports = { loadAddonOptions };
