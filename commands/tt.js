const axios = require('axios');

module.exports = {
    name: 'tt',
    alias: ['tiktok'],
    description: 'Download video TikTok tanpa watermark',
    async execute(sock, m, remoteJid, type, helpers, commandName, textArgs, reply) {
        // Cek link dari argumen teks ATAU dari pesan yang di-reply
        const quotedText = m.message.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
                           m.message.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || '';
        
        const targetUrl = textArgs.trim() || quotedText.trim();

        if (!targetUrl) {
            return await reply(`⚠️ Masukkan link TikTok atau reply pesan yang berisi link TikTok!\nContoh: *.tt https://vt.tiktok.com/xxxx*`);
        }

        // Cari URL TikTok dalam teks (jika ada teks tambahan di pesannya)
        const urlMatch = targetUrl.match(/https?:\/\/(www\.|v[tm]\.)?tiktok\.com\/[^\s]+/i);
        const finalUrl = urlMatch ? urlMatch[0] : targetUrl;

        await reply('⏳ Sedang mengunduh video TikTok...');

        try {
            const res = await axios.post('https://www.tikwm.com/api/', `url=${encodeURIComponent(finalUrl)}`);
            const data = res.data?.data;

            if (data?.play) {
                return await sock.sendMessage(remoteJid, { 
                    video: { url: data.play }, 
                    caption: data.title || 'Berhasil mengunduh video TikTok!' 
                }, { quoted: m });
            }

            await reply('❌ Gagal mengambil data video TikTok. Pastikan link valid!');
        } catch (e) {
            console.error('TikTok DL Error:', e);
            await reply('❌ Terjadi kesalahan saat mendownload video TikTok.');
        }
    }
};