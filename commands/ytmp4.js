const axios = require('axios');

module.exports = {
    name: 'ytmp4',
    alias: ['ytvideo'],
    description: 'Download video dari YouTube',
    async execute(sock, m, remoteJid, type, helpers, commandName, textArgs, reply) {
        const quotedText = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
                           m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || '';
        
        const targetText = textArgs.trim() || quotedText.trim();

        if (!targetText) {
            return await reply(`⚠️ Masukkan link YouTube atau reply pesan yang berisi link!\nContoh: *.ytmp4 https://youtu.be/xxxx*`);
        }

        const urlMatch = targetText.match(/https?:\/\/(www\.|music\.)?(youtube\.com|youtu\.be)\/[^\s]+/i);
        const finalUrl = urlMatch ? urlMatch[0] : targetText;

        await reply('⏳ Sedang memproses video YouTube...');

        try {
            const aio = await axios.post('https://api.cobalt.tools/', {
                url: finalUrl
            }, {
                headers: { 
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (aio.data?.url) {
                return await sock.sendMessage(remoteJid, { 
                    video: { url: aio.data.url }, 
                    caption: '✨ Berhasil mengunduh video YouTube!' 
                }, { quoted: m });
            }

            await reply('❌ Gagal memproses video dari link tersebut.');
        } catch (e) {
            console.error('YTMP4 Error:', e);
            await reply('❌ Terjadi kesalahan saat mendownload video YouTube.');
        }
    }
};