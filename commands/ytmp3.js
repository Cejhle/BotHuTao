const axios = require('axios');

module.exports = {
    name: 'ytmp3',
    alias: ['ytaudio', 'play'],
    description: 'Download audio/lagu dari YouTube',
    async execute(sock, m, remoteJid, type, helpers, commandName, textArgs, reply) {
        // Ambil teks dari argumen ATAU dari pesan yang di-reply
        const quotedText = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
                           m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || '';
        
        const targetText = textArgs.trim() || quotedText.trim();

        if (!targetText) {
            return await reply(`⚠️ Masukkan link YouTube atau reply pesan yang berisi link!\nContoh: *.ytmp3 https://youtu.be/xxxx*`);
        }

        // Ambil link YouTube saja jika ada teks lain
        const urlMatch = targetText.match(/https?:\/\/(www\.|music\.)?(youtube\.com|youtu\.be)\/[^\s]+/i);
        const finalUrl = urlMatch ? urlMatch[0] : targetText;

        await reply('⏳ Sedang memproses audio YouTube...');

        try {
            const aio = await axios.post('https://api.nexray.eu.cc/downloader/v1/ytmp3?url=' + encodeURIComponent(finalUrl));

            if (aio.data?.result?.url) {
                return await sock.sendMessage(remoteJid, { 
                    audio: { url: aio.data.result.url }, 
                    mimetype: 'audio/mp4' 
                }, { quoted: m });
            }

            await reply('❌ Gagal memproses audio dari link tersebut.');
        } catch (e) {
            console.error('YTMP3 Error:', e);
            await reply('❌ Terjadi kesalahan saat mendownload audio YouTube.');
        }
    }
};