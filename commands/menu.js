module.exports = {
    name: 'menu',
    alias: ['help'],
    description: 'Menampilkan daftar menu bot',
    async execute(sock, m, remoteJid, type, helpers, commandName, textArgs, reply, commands) {
        const categories = {
            '🔥 𝑾𝒂𝒏𝒈𝒔𝒉𝒆𝒏𝒈 𝑺𝒑𝒆𝒄𝒊𝒂𝒍': [],
            '📸 𝑴𝒆𝒅𝒊𝒂 & 𝑪𝒐𝒏𝒗𝒆𝒓𝒕𝒆𝒓': [],
            '📥 𝑫𝒐𝝒𝒏𝒍𝒐𝒂𝒅𝒆𝒓': []
        };

        const processedCmds = new Set();

        commands.forEach((cmd) => {
            if (!cmd.name || processedCmds.has(cmd)) return;
            processedCmds.add(cmd);

            const cleanName = cmd.name.replace(/^\.+/, '');
            const desc = cmd.description || 'Fitur rahasia Wangsheng Parlor';

            if (['menu', 'dev'].includes(cleanName)) {
                categories['🔥 𝑾𝒂𝒏𝒈𝒔𝒉𝒆𝒏𝒈 𝑺𝒑𝒆𝒄𝒊𝒂𝒍'].push(`├ ✦ *.${cleanName}* ── ${desc}`);
            } else if (['s', 'toimg', 'ocr'].includes(cleanName)) {
                categories['📸 𝑴𝒆𝒅𝒊𝒂 & 𝑪𝒐𝒏𝒗𝒆𝒓𝒕𝒆𝒓'].push(`├ ✦ *.${cleanName}* ── ${desc}`);
            } else if (['tt', 'ytmp3', 'ytmp4'].includes(cleanName)) {
                categories['📥 𝑫𝒐𝝒𝒏𝒍𝒐𝒂𝒅𝒆𝒓'].push(`├ ✦ *.${cleanName}* ── ${desc}`);
            }
        });

        let menuContent = '';
        for (const [category, list] of Object.entries(categories)) {
            if (list.length > 0) {
                menuContent += `\n┌───〔 ${category} 〕\n${list.join('\n')}\n└────────────────────────\n`;
            }
        }

        const menuText = `🏮 𝐖𝐀𝐍𝐆𝐒𝐇𝐄𝐍𝐆 𝐅𝐔𝐍𝐄𝐑𝐀𝐋 𝐏𝐀𝐑𝐋𝐎𝐑 🏮\n` +
                         `*Hu Tao Bot Multi-Device* 👻✨\n\n` +
                         `_Oya? Mau pesan peti mati... eh, mau pakai fitur bot-ku maksudnya?~_\n` +
                         `${menuContent}\n` +
                         `💡 *Petunjuk:* Kirim pesan biasa (tanpa titik) buat ngobrol langsung sama Hu Tao! Kalau mau diskon peti mati, chat *.dev* ya~ 🌸`;

        return await reply(menuText);
    }
};