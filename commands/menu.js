module.exports = {
    name: '.menu',
    alias: ['!menu'],
    async execute(sock, m, remoteJid) {
        const menuText = `
👻 *HU TAO BOT MENU* 👻
Hallo! Aku bot Hu Tao, siap bantu kamu.

👑 *Developer / Owner:* CejhleNihMah.
📺 *YouTube:* https://www.youtube.com/@Cejhle%2E
💬 *Discord:* https://discord.com/invite/3c72ptxSMV
📸 *Instagram:* https://www.instagram.com/cejhle/
🎵 *TikTok:* https://www.tiktok.com/@cejhle

📜 *Daftar Perintah:*
├ 👻 *.menu* : Menampilkan menu ini
├ 🎨 *.sticker / .s* : Kirim/reply gambar jadi stiker
├ 🖼️ *.toimg* : Convert stiker jadi gambar
├ 🔍 *.ocr* : Baca teks di dalam gambar
├ 📥 *.tt / .ytmp3 / .ytmp4* : Download media
└ 💬 *Ngobrol biasa / Lanjut Lirik*

_Ketik pesan biasa tanpa titik (.), Hu Tao bakal otomatis ngebalas!_
        `;
        await sock.sendMessage(remoteJid, { text: menuText }, { quoted: m });
    }
};