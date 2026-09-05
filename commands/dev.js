module.exports = {
    name: 'dev',
    alias: ['owner', 'developer'],
    description: 'Menampilkan informasi developer/owner',
    async execute(sock, m, remoteJid, type, helpers, commandName, textArgs, reply) {
        const devText = `🏮 𝐖𝐀𝐍𝐆𝐒𝐇𝐄𝐍𝐆 𝐅𝐔𝐍𝐄𝐑𝐀𝐋 𝐏𝐀𝐑𝐋𝐎𝐑 🏮\n` +
                        `*Hu Tao's Bosses / Masterminds* 👻✨\n\n` +
                        `_Oya? Mau kenalan sama orang yang bikin aku hidup di WhatsApp? Ini kontak para Director-ku!_ 🌸\n\n` +
                        `┌───〔 👑 *Master Developer 1* 〕\n` +
                        `├ ✦ *Nama:* CejhleNihMah.\n` +
                        `├ 📺 *YouTube:* https://www.youtube.com/@Cejhle%2E\n` +
                        `├ 💬 *Discord:* https://discord.com/invite/3c72ptxSMV\n` +
                        `├ 📸 *Instagram:* https://www.instagram.com/cejhle/\n` +
                        `└ 🎵 *TikTok:* https://www.tiktok.com/@cejhle\n\n` +
                        `┌───〔 👑 *Master Developer 2* 〕\n` +
                        `├ ✦ *Nama:* Manzz.\n` +
                        `├ 📺 *YouTube:* https://youtube.com/@mzkiyo?si=BDjG3CYkOiF4gIXl\n` +
                        `├ 💬 *Discord:* https://discord.gg/xWwgYFjj\n` +
                        `├ 📸 *Instagram:* https://instagram.com/salman.maneh\n` +
                        `└ 🎵 *TikTok:* https://www.tiktok.com/@manzzajh29\n\n` +
                        `⚰️ *Catatan:* Dilarang spam berlebihan ya~ Nanti dapet voucher diskon beli 1 gratis 1 peti mati dari Hu Tao! 👻`;

        return await reply(devText);
    }
};