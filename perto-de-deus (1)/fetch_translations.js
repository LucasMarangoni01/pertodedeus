
import fetch from 'node-fetch';

async function list() {
  try {
    const res = await fetch('https://bolls.life/get-translations/Portuguese/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
list();
