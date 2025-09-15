// File: /api/check.js atau /netlify/functions/check.js

export default async function handler(req, res) {
  let targetUrl;

  // 1. Cek metode request (GET atau POST)
  if (req.method === 'GET') {
    // Untuk GET, ambil 'url' dari query string (?url=...)
    targetUrl = req.query.url;
  } else if (req.method === 'POST') {
    // Untuk POST, ambil 'url' dari body JSON
    targetUrl = req.body.url;
  } else {
    // Jika metode lain, tolak permintaan
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan.` });
  }

  // 2. Validasi: Pastikan parameter URL ada
  if (!targetUrl) {
    return res.status(400).json({
      error: 'Parameter "url" tidak ditemukan di query string (untuk GET) atau body (untuk POST).',
    });
  }

  // 3. Siapkan header "penyamaran"
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  try {
    // 4. Lakukan request ke URL target
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: headers,
      signal: AbortSignal.timeout(10000), // Timeout 10 detik
    });

    // 5. Kirim kembali hasil status dari website target
    console.log(`Pengecekan ke ${targetUrl} via ${req.method} berhasil dengan status: ${response.status}`);
    return res.status(200).json({
      target_url: targetUrl,
      status_code: response.status,
      status_text: response.statusText,
    });

  } catch (error) {
    // 6. Tangani jika terjadi error
    console.error(`Error saat mengecek ${targetUrl}:`, error.name, error.message);
    let errorMessage = `Gagal melakukan request ke ${targetUrl}.`;
    if (error.name === 'TimeoutError') {
      errorMessage = `Request ke ${targetUrl} timeout.`;
    } else if (error.cause?.code === 'ENOTFOUND') {
      errorMessage = `Domain ${targetUrl} tidak dapat ditemukan.`;
    }

    return res.status(500).json({
      error: errorMessage,
      details: error.message
    });
  }
}
