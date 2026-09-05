const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');

module.exports = {
    name: 'ocr',
    alias: ['readtext'],
    description: 'Membaca tulisan/teks yang ada pada gambar',
    async execute(sock, m, remoteJid, type, helpers, commandName, textArgs, reply) {
        const isImage = type === 'imageMessage';
        const isQuotedImage = type === 'extendedTextMessage' && m.message.extendedTextMessage.contextInfo?.quotedMessage?.imageMessage;

        if (!isImage && !isQuotedImage) {
            return await reply('⚠️ Kirim gambar dengan caption *.ocr* atau reply gambar yang berisi teks!');
        }

        await reply('⏳ Sedang memproses dan membaca teks dari gambar...');

        try {
            let targetMsg = m;
            if (isQuotedImage) {
                targetMsg = {
                    message: m.message.extendedTextMessage.contextInfo.quotedMessage
                };
            }

            const mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});

            // Kirim buffer gambar ke API OCR gratis (OCR.space API)
            const formData = new (require('form-data'))();
            formData.append('file', mediaBuffer, { filename: 'image.jpg' });
            formData.append('apikey', 'helloworld'); // Public API key dari OCR.Space

            const res = await axios.post('https://api.ocr.space/parse/image', formData, {
                headers: formData.getHeaders()
            });

            const parsedText = res.data?.ParsedResults?.[0]?.ParsedText;

            if (parsedText && parsedText.trim().length > 0) {
                return await reply(`📝 *Hasil Pembacaan Teks:* \n\n${parsedText.trim()}`);
            }

            await reply('❌ Tidak ada teks yang terdeteksi pada gambar tersebut.');

        } catch (e) {
            console.error('OCR Error:', e);
            await reply('❌ Terjadi kesalahan saat membaca teks dari gambar.');
        }
    }
};