// File: /api/whois.js

// Gunakan "import" karena package.json Anda memakai "type": "module"
import whois from 'whois-json';

export default async function handler(req, res) {
  // 1. Ambil parameter 'url' dari query string
  const targetUrl = req.query.url;

  // 2. Validasi: Pastikan parameter URL ada
  if (!targetUrl) {
    return res.status(400).json({ error: "Parameter 'url' dibutuhkan di query string." });
  }

  let domainName;
  try {
    // 3. Ekstrak nama domain dari URL lengkap (misal: dari 'https://google.com/search' menjadi 'google.com')
    // Ini membuat API lebih fleksibel, bisa menerima input 'google.com' atau 'https://google.com'
    const urlObject = new URL(targetUrl.startsWith('http') ? targetUrl : `http://${targetUrl}`);
    domainName = urlObject.hostname;
  } catch (error) {
    return res.status(400).json({ error: "Format URL atau domain tidak valid." });
  }

  try {
    // 4. Lakukan pencarian WHOIS menggunakan modul
    const results = await whois(domainName, { follow: 1, verbose: true });
    
    // 5. Kirim hasil yang sukses dalam format JSON
    console.log(`Pengecekan WHOIS ke ${domainName} berhasil.`);
    return res.status(200).json(results);

  } catch (error) {
    // 6. Tangani jika terjadi error
    console.error(`Error saat mengambil WHOIS untuk ${domainName}:`, error.message);
    return res.status(500).json({
      error: `Gagal mengambil data WHOIS untuk ${domainName}.`,
      details: error.message
    });
  }
}
