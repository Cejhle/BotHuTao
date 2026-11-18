const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: '.toimg',
    alias: [],
    async execute(sock, m, remoteJid, type, helpers) {
        const isSticker = type === 'stickerMessage' || m.message.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
        if (!isSticker) return await sock.sendMessage(remoteJid, { text: 'Reply stiker dengan *.toimg*' }, { quoted: m });

        try {
            const target = m.message.stickerMessage ? m : {
                key: { remoteJid, id: m.message.extendedTextMessage.contextInfo.stanzaId },
                message: m.message.extendedTextMessage.contextInfo.quotedMessage
            };
            const buffer = await downloadMediaMessage(target, 'buffer', {});
            const tmpStk = path.join(__dirname, `../tmp_${Date.now()}.webp`);
            const tmpImg = path.join(__dirname, `../tmp_${Date.now()}.png`);

            fs.writeFileSync(tmpStk, buffer);
            await helpers.stickerToImage(tmpStk, tmpImg);
            await sock.sendMessage(remoteJid, { image: fs.readFileSync(tmpImg), caption: 'Ini gambarnya!' }, { quoted: m });

            if (fs.existsSync(tmpStk)) fs.unlinkSync(tmpStk);
            if (fs.existsSync(tmpImg)) fs.unlinkSync(tmpImg);
        } catch (e) {
            console.log(e);
            await sock.sendMessage(remoteJid, { text: 'Gagal mengubah stiker ke gambar.' }, { quoted: m });
        }
    }
};