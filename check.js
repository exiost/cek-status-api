// File: /api/check.js
// Endpoint ini akan dapat diakses melalui domainanda.com/api/check

export default async function handler(req, res) {
  // 1. Ambil URL target dari query parameter
  // Contoh: /api/check?url=https://google.com
  const targetUrl = req.query.url;

  // 2. Validasi: Pastikan parameter URL ada
  if (!targetUrl) {
    return res.status(400).json({ 
      error: 'Parameter "url" tidak ditemukan.',
      usage: '/api/check?url=https://example.com' 
    });
  }

  // 3. Siapkan header "penyamaran" agar tidak terdeteksi sebagai bot
  // Ini adalah bagian terpenting untuk melewati verifikasi bot sederhana.
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Accept-Language': 'en-US,en;q=0.9',
  };

  try {
    // 4. Lakukan request ke URL target menggunakan fetch bawaan Node.js
    const response = await fetch(targetUrl, { 
      method: 'GET',
      headers: headers,
      // Opsi untuk menghentikan jika terlalu lama (misal: 10 detik)
      signal: AbortSignal.timeout(10000), 
    });

    // 5. Kirim kembali hasil status dari website target dalam format JSON
    console.log(`Pengecekan ke ${targetUrl} berhasil dengan status: ${response.status}`);
    return res.status(200).json({
      target_url: targetUrl,
      status_code: response.status,
      status_text: response.statusText,
    });

  } catch (error) {
    // 6. Tangani jika terjadi error (misal: domain tidak ada, timeout, dll)
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
