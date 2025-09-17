// File: /api/whois.js - KODE BARU UNTUK WHOISER

import whoiser from 'whoiser';

export default async function handler(req, res) {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: "Parameter 'url' dibutuhkan di query string." });
  }

  let domainName;
  try {
    const urlObject = new URL(targetUrl.startsWith('http') ? targetUrl : `http://${targetUrl}`);
    domainName = urlObject.hostname.replace(/^www\./, ''); // Hapus 'www.' jika ada
  } catch (error) {
    return res.status(400).json({ error: "Format URL atau domain tidak valid." });
  }

  try {
    const results = await whoiser(domainName);
    const whoisData = results[Object.keys(results)[0]];

    console.log(`Pengecekan WHOIS ke ${domainName} berhasil.`);
    return res.status(200).json(whoisData);

  } catch (error) {
    console.error(`Error saat mengambil WHOIS untuk ${domainName}:`, error.message);
    return res.status(500).json({
      error: `Gagal mengambil data WHOIS untuk ${domainName}.`,
      details: error.message
    });
  }
}
