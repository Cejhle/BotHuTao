const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'toimg',
    alias: ['toimage'],
    description: 'Mengubah stiker kembali menjadi foto',
    async execute(sock, m, remoteJid, type, helpers, commandName, textArgs, reply) {
        // 1. Ambil quoted message dengan aman (menggunakan optional chaining ?.)
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const isQuotedSticker = quoted?.stickerMessage;

        if (!isQuotedSticker) {
            return await reply('⚠️ Reply stiker yang mau diubah jadi foto dengan ketik *.toimg*!');
        }

        await reply('⏳ Mengubah stiker menjadi foto...');

        let tmpStk = '';
        let tmpImg = '';

        try {
            // 2. Buat targetMsg TANPA menyertakan stanzaId yang bikin error/null
            const targetMsg = {
                message: {
                    stickerMessage: quoted.stickerMessage
                }
            };

            // 3. Download buffer stiker
            const buffer = await downloadMediaMessage(targetMsg, 'buffer', {});

            if (!buffer || buffer.length === 0) {
                return await reply('❌ Gagal mengunduh media stiker.');
            }

            // 4. Buat file temporary
            const timeStamp = Date.now();
            tmpStk = path.join(__dirname, `../tmp_${timeStamp}.webp`);
            tmpImg = path.join(__dirname, `../tmp_${timeStamp}.png`);

            fs.writeFileSync(tmpStk, buffer);

            // 5. Eksekusi FFmpeg
            await new Promise((resolve, reject) => {
                exec(`ffmpeg -i "${tmpStk}" "${tmpImg}"`, (error) => {
                    if (error) return reject(error);
                    resolve(true);
                });
            });

            // 6. Kirim hasil foto
            await sock.sendMessage(remoteJid, {
                image: fs.readFileSync(tmpImg),
                caption: '✨ Berhasil mengubah stiker menjadi foto!'
            }, { quoted: m });

        } catch (e) {
            console.error('Toimg Error:', e);
            await reply('❌ Gagal mengonversi stiker ke foto.');
        } finally {
            // Bersihkan file sementara
            if (tmpStk && fs.existsSync(tmpStk)) fs.unlinkSync(tmpStk);
            if (tmpImg && fs.existsSync(tmpImg)) fs.unlinkSync(tmpImg);
        }
    }
};
