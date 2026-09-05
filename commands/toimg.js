const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'toimg',
    alias: ['toimage'],
    description: 'Mengubah stiker kembali menjadi foto',
    async execute(sock, m, remoteJid, type, helpers, commandName, textArgs, reply) {
        const isQuotedSticker = type === 'extendedTextMessage' && m.message.extendedTextMessage.contextInfo?.quotedMessage?.stickerMessage;

        if (!isQuotedSticker) {
            return await reply('⚠️ Reply stiker yang mau diubah jadi foto dengan ketik *.toimg*!');
        }

        await reply('⏳ Mengubah stiker menjadi foto...');

        try {
            const targetMsg = {
                message: m.message.extendedTextMessage.contextInfo.quotedMessage
            };

            const mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});

            return await sock.sendMessage(remoteJid, {
                image: mediaBuffer,
                caption: '✨ Berhasil mengubah stiker menjadi foto!'
            }, { quoted: m });

        } catch (e) {
            console.error('Toimg Error:', e);
            await reply('❌ Gagal mengonversi stiker ke foto.');
        }
    }
};