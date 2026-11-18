const axios = require('axios');

module.exports = {
    name: '.tt',
    alias: ['.tiktok', '.ytmp3', '.ytmp4', '.ig', '.instagram', '.douyin', '.dy'],
    async execute(sock, m, remoteJid, type, helpers, command, textArgs) {
        if (!textArgs) return await sock.sendMessage(remoteJid, { text: `Contoh: *${command} <link>*` }, { quoted: m });
        await sock.sendMessage(remoteJid, { text: 'Sedang mengunduh media, sabar ya kak... ⏳' }, { quoted: m });

        try {
            // Khusus TikTok/TT bisa pake TikWM duluan karena cepet & stabil
            if (command === '.tt' || command === '.tiktok') {
                const res = await axios.post('https://www.tikwm.com/api/', `url=${encodeURIComponent(textArgs)}`);
                if (res.data.data?.play) {
                    return await sock.sendMessage(remoteJid, { video: { url: res.data.data.play }, caption: res.data.data.title || 'TikTok berhasil diunduh!' }, { quoted: m });
                }
            }

            // Untuk YouTube, Instagram, Douyin, dll., lempar ke Cobalt AIO API yang super lengkap
            const response = await axios.post('https://api.cobalt.tools/api/json', {
                url: textArgs,
                vQuality: '720' // Kualitas video default
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            const result = response.data;

            if (result.status === 'redirect' || result.status === 'stream' || result.url) {
                const mediaUrl = result.url || result.picker?.[0]?.url;

                if (!mediaUrl) throw new Error('Link media tidak ditemukan.');

                if (command === '.ytmp3') {
                    return await sock.sendMessage(remoteJid, { audio: { url: mediaUrl }, mimetype: 'audio/mp4' }, { quoted: m });
                }

                // Deteksi otomatis apakah itu video atau gambar (misal IG post foto)
                if (result.type === 'photo' || (result.picker && result.picker.length > 0)) {
                    // Kalau multi-image atau foto satuan dari IG
                    return await sock.sendMessage(remoteJid, { image: { url: mediaUrl }, caption: 'Berhasil didownload!' }, { quoted: m });
                }

                return await sock.sendMessage(remoteJid, { video: { url: mediaUrl }, caption: 'Berhasil didownload!' }, { quoted: m });
            }

            // Kalau Cobalt gagal atau format tak dikenal
            return await sock.sendMessage(remoteJid, { text: 'Gagal memproses link tersebut.' }, { quoted: m });

        } catch (e) {
            console.error("Error downloader:", e.message);
            return await sock.sendMessage(remoteJid, { text: 'Gagal mendownload media. Pastikan link-nya valid ya!' }, { quoted: m });
        }
    }
};