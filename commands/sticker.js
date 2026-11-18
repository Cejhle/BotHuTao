const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: '.s',
    alias: ['.sticker'],
    async execute(sock, m, remoteJid, type, helpers) {
        const isImage = type === 'imageMessage' || m.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        if (!isImage) return await sock.sendMessage(remoteJid, { text: 'Kirim/reply gambar dengan caption *.s*' }, { quoted: m });

        try {
            await sock.sendMessage(remoteJid, { text: 'Membuat stiker...' }, { quoted: m });
            const target = m.message.imageMessage ? m : {
                key: { remoteJid, id: m.message.extendedTextMessage.contextInfo.stanzaId },
                message: m.message.extendedTextMessage.contextInfo.quotedMessage
            };
            const buffer = await downloadMediaMessage(target, 'buffer', {});
            const tmpImg = path.join(__dirname, `../tmp_${Date.now()}.jpg`);
            const tmpStk = path.join(__dirname, `../tmp_${Date.now()}.webp`);

            fs.writeFileSync(tmpImg, buffer);
            await helpers.imageToSticker(tmpImg, tmpStk);
            await sock.sendMessage(remoteJid, { sticker: fs.readFileSync(tmpStk) }, { quoted: m });

            if (fs.existsSync(tmpImg)) fs.unlinkSync(tmpImg);
            if (fs.existsSync(tmpStk)) fs.unlinkSync(tmpStk);
        } catch (e) {
            console.log(e);
            await sock.sendMessage(remoteJid, { text: 'Gagal membuat stiker.' }, { quoted: m });
        }
    }
};