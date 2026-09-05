const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 's',
    alias: ['sticker', 'stiker'],
    description: 'Mengubah gambar/video singkat menjadi stiker',
    async execute(sock, m, remoteJid, type, helpers, commandName, textArgs, reply) {
        // Cek apakah pesan berisi gambar ATAU me-reply gambar/video
        const isImage = type === 'imageMessage';
        const isVideo = type === 'videoMessage';
        const isQuotedImage = type === 'extendedTextMessage' && m.message.extendedTextMessage.contextInfo?.quotedMessage?.imageMessage;
        const isQuotedVideo = type === 'extendedTextMessage' && m.message.extendedTextMessage.contextInfo?.quotedMessage?.videoMessage;

        if (!isImage && !isVideo && !isQuotedImage && !isQuotedVideo) {
            return await reply('⚠️ Kirim gambar/video dengan caption *.s* atau reply media yang ingin dijadikan stiker!');
        }

        await reply('⏳ Sedang membuat stiker...');

        try {
            let targetMsg = m;
            if (isQuotedImage || isQuotedVideo) {
                targetMsg = {
                    message: m.message.extendedTextMessage.contextInfo.quotedMessage
                };
            }

            const mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});

            return await sock.sendMessage(remoteJid, {
                sticker: mediaBuffer
            }, { quoted: m });

        } catch (e) {
            console.error('Sticker Error:', e);
            await reply('❌ Gagal membuat stiker dari media tersebut.');
        }
    }
};