// File: /api/check-rest.js (Versi Lengkap dengan Data Detail)

export default async function handler(req, res) {
  let baseUrl, wpUser, wpPass;

  if (req.method === 'GET') {
    baseUrl = req.query.url;
    wpUser = req.query.user;
    wpPass = req.query.pass;
  } else if (req.method === 'POST') {
    baseUrl = req.headers['x-target-url'];
    wpUser = req.headers['x-wp-user'];
    wpPass = req.headers['x-wp-app-password'];
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan.` });
  }

  if (!baseUrl) {
    return res.status(400).json({ error: "Parameter 'url' tidak ditemukan." });
  }

  const headers = {
    'User-Agent': 'Vercel-External-Checker/1.0',
    'Accept': 'application/json',
  };

  if (wpUser && wpPass) {
    const token = Buffer.from(`${wpUser}:${wpPass}`).toString("base64");
    headers["Authorization"] = `Basic ${token}`;
  }

  // DITAMBAHKAN: Variabel untuk menampung hasil
  let postsCount = null;
  let futureCount = null;
  let lastScheduledPost = null;
  let finalHttpStatus = null;

  try {
    // --- Pengecekan 1: Post yang sudah terbit (status=publish) ---
    const publishApiUrl = `${baseUrl.replace(/\/+$/, "")}/wp-json/wp/v2/posts?per_page=1&status=publish&_fields=id`;
    const publishResponse = await fetch(publishApiUrl, { headers, signal: AbortSignal.timeout(15000) });
    
    // Status HTTP utama kita ambil dari sini
    finalHttpStatus = publishResponse.status;

    if (publishResponse.ok) {
      const total = publishResponse.headers.get("x-wp-total");
      postsCount = total ? Number(total) : null;
    }

    // --- Pengecekan 2: Post terjadwal (status=future) ---
    const futureApiUrl = `${baseUrl.replace(/\/+$/, "")}/wp-json/wp/v2/posts?per_page=1&status=future&orderby=date&order=desc&_fields=id,date`;
    const futureResponse = await fetch(futureApiUrl, { headers, signal: AbortSignal.timeout(15000) });

    if (futureResponse.ok) {
      const totalFuture = futureResponse.headers.get("x-wp-total");
      futureCount = totalFuture ? Number(totalFuture) : 0;
      
      if (futureCount > 0) {
        const futurePosts = await futureResponse.json();
        if (Array.isArray(futurePosts) && futurePosts[0]?.date) {
          lastScheduledPost = futurePosts[0].date;
        }
      }
    }

    // Kirim kembali semua data yang sudah dikumpulkan
    return res.status(200).json({
      base_url: baseUrl,
      status_code: finalHttpStatus,
      posts_count: postsCount,
      future_count: futureCount,
      last_scheduled_post: lastScheduledPost,
    });

  } catch (error) {
    console.error(`[REST CHECK] Error saat mengecek ${baseUrl}:`, error.message);
    return res.status(500).json({
      error: `Gagal melakukan request ke ${baseUrl}.`,
      details: error.message,
      // Kembalikan data yang mungkin sudah berhasil didapat sebelum error
      posts_count: postsCount,
      future_count: futureCount,
      last_scheduled_post: lastScheduledPost,
    });
  }
}
