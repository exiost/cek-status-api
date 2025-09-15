// File: /api/check-rest.js (Versi Final dengan Fallback Otomatis)

export default async function handler(req, res) {
  let baseUrl, wpUser, wpPass;

  // Mengambil input dari GET atau POST
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

  // --- FUNGSI HELPER INTERNAL UNTUK MELAKUKAN SCAN ---
  // Ini akan kita panggil untuk scan terotentikasi maupun publik
  const performScan = async (authCredentials = null) => {
    const headers = {
      'User-Agent': 'Vercel-External-Checker/1.1-Fallback',
      'Accept': 'application/json',
    };
    if (authCredentials) {
      headers['Authorization'] = `Basic ${authCredentials}`;
    }

    let postsCount = null;
    let futureCount = null;
    let lastScheduledPost = null;
    let finalHttpStatus = null;

    try {
      const publishApiUrl = `${baseUrl.replace(/\/+$/, "")}/wp-json/wp/v2/posts?per_page=1&status=publish&_fields=id`;
      const publishResponse = await fetch(publishApiUrl, { headers, signal: AbortSignal.timeout(15000) });
      finalHttpStatus = publishResponse.status;

      if (publishResponse.ok) {
        postsCount = Number(publishResponse.headers.get("x-wp-total") || 0);
      }

      const futureApiUrl = `${baseUrl.replace(/\/+$/, "")}/wp-json/wp/v2/posts?per_page=1&status=future&orderby=date&order=desc&_fields=id,date`;
      const futureResponse = await fetch(futureApiUrl, { headers, signal: AbortSignal.timeout(15000) });

      if (futureResponse.ok) {
        futureCount = Number(futureResponse.headers.get("x-wp-total") || 0);
        if (futureCount > 0) {
          const futurePosts = await futureResponse.json();
          lastScheduledPost = futurePosts[0]?.date || null;
        }
      }
    } catch (e) {
        // Jika terjadi error network, catat di status
        finalHttpStatus = finalHttpStatus || 599; // 599 = Network Connect Timeout Error
        console.error(`[ performScan Error ] ${e.message}`);
    }
    
    return {
        status_code: finalHttpStatus,
        posts_count: postsCount,
        future_count: futureCount,
        last_scheduled_post: lastScheduledPost,
    };
  };
  // --- AKHIR FUNGSI HELPER ---

  // --- LOGIKA UTAMA DENGAN FALLBACK ---
  if (wpUser && wpPass) {
    // 1. Coba dulu dengan otentikasi
    console.log(`[REST CHECK] Attempting authenticated scan for ${baseUrl}...`);
    const token = Buffer.from(`${wpUser}:${wpPass}`).toString("base64");
    let result = await performScan(token);

    // 2. Jika GAGAL (bukan 200), coba lagi tanpa otentikasi
    if (result.status_code !== 200) {
      console.log(`[REST CHECK] Authenticated scan failed with status ${result.status_code}. Falling back to public scan...`);
      result = await performScan(null); // Panggil lagi tanpa token
      result.note = "Authenticated check failed; showing public data instead."; // Tambahkan catatan
    }
    
    return res.status(200).json({ base_url: baseUrl, ...result });

  } else {
    // Langsung jalankan scan publik jika tidak ada kredensial
    console.log(`[REST CHECK] Performing public scan for ${baseUrl}...`);
    const result = await performScan(null);
    return res.status(200).json({ base_url: baseUrl, ...result });
  }
}
