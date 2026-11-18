const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const Tesseract = require('tesseract.js');

module.exports = {
    name: '.ocr',
    alias: [],
    async execute(sock, m, remoteJid, type) {
        const isImage = type === 'imageMessage' || m.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        if (!isImage) return await sock.sendMessage(remoteJid, { text: 'Kirim/reply gambar dengan *.ocr*' }, { quoted: m });

        try {
            await sock.sendMessage(remoteJid, { text: 'Membaca tulisan dari gambar...' }, { quoted: m });
            const target = m.message.imageMessage ? m : {
                key: { remoteJid, id: m.message.extendedTextMessage.contextInfo.stanzaId },
                message: m.message.extendedTextMessage.contextInfo.quotedMessage
            };
            const buffer = await downloadMediaMessage(target, 'buffer', {});
            const { data: { text: resultText } } = await Tesseract.recognize(buffer, 'ind+eng');
            await sock.sendMessage(remoteJid, { text: `*Hasil OCR:*\n\n${resultText}` }, { quoted: m });
        } catch (e) {
            console.log(e);
            await sock.sendMessage(remoteJid, { text: 'Gagal membaca gambar.' }, { quoted: m });
        }
    }
};