// File: /api/check-rest.js
// Endpoint: namadomain.vercel.app/api/check-rest

export default async function handler(req, res) {
  let baseUrl;

  if (req.method === 'GET') {
    baseUrl = req.query.url;
  } else if (req.method === 'POST') {
    baseUrl = req.headers['x-target-url'];
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan.` });
  }

  if (!baseUrl) {
    return res.status(400).json({
      error: "Parameter 'url' (base URL website) tidak ditemukan di query string (GET) atau header 'x-target-url' (POST).",
    });
  }

  // Membuat URL REST API yang akan dicek dari base URL
  const restApiUrl = `${baseUrl.replace(/\/+$/, "")}/wp-json/wp/v2/posts?per_page=1&_fields=id`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Accept': 'application/json', // Meminta JSON karena ini REST API
  };

  try {
    const response = await fetch(restApiUrl, {
      method: 'GET',
      headers: headers,
      signal: AbortSignal.timeout(20000), // Timeout 20 detik untuk API
    });
    
    console.log(`[REST CHECK] Pengecekan ke ${restApiUrl} berhasil dengan status: ${response.status}`);
    return res.status(200).json({
      base_url: baseUrl,
      checked_endpoint: restApiUrl,
      status_code: response.status,
      status_text: response.statusText,
    });

  } catch (error) {
    console.error(`[REST CHECK] Error saat mengecek ${restApiUrl}:`, error.message);
    return res.status(500).json({
      error: `Gagal melakukan request ke ${restApiUrl}.`,
      details: error.message
    });
  }
}
