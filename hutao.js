const { default: makeWASocket, useMultiFileAuthState, Browsers, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');
const qrcode = require('qrcode');

// ==========================================
// 1. CONFIG: ENVIRONMENT VARIABLES (.env)
// ==========================================
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key) process.env[key.trim()] = valueParts.join('=').trim();
        }
    });
}

// ==========================================
// 2. FFMPEG SETUP & AUTO-DETECT
// ==========================================
try {
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
    console.log("✅ FFmpeg dimuat via @ffmpeg-installer");
} catch {
    try {
        const ffmpegStatic = require('ffmpeg-static');
        ffmpeg.setFfmpegPath(ffmpegStatic);
        console.log("✅ FFmpeg dimuat via ffmpeg-static");
    } catch {
        console.log("⚠️ Menggunakan FFmpeg dari PATH sistem...");
    }
}

const BOT_NUMBER = process.env.BOT_NUMBER || ""; 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = "qwen/qwen3.6-27b";

// ==========================================
// 3. LOAD AUTOMATIC COMMAND HANDLER
// ==========================================
const commands = new Map();
const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    for (const file of files) {
        const cmd = require(path.join(commandsPath, file));
        if (cmd.name) commands.set(cmd.name, cmd);
        if (cmd.alias) cmd.alias.forEach(a => commands.set(a, cmd));
    }
}

// ==========================================
// 4. EXPRESS HTTP SERVER (KEEP ALIVE / QR CODE)
// ==========================================
const app = express();
const port = process.env.PORT || 24717;
let latestQR = "", isConnected = false;

app.get('/', (req, res) => {
    if (isConnected) res.send('<h2>✅ Bot WhatsApp Online!</h2>');
    else if (latestQR) res.send(`<img src="${latestQR}" width="280" />`);
    else res.send('<h2>⏳ Memuat QR...</h2>');
});
app.listen(port, () => console.log(`Server HTTP aktif di port ${port}`));

// ==========================================
// 5. HELPER FUNCTIONS
// ==========================================
const helpers = {
    imageToSticker(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions(['-vcodec', 'libwebp', '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-ih)/2:(oh-ih)/2:color=0x00000000'])
                .toFormat('webp').save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', (err) => reject(err));
        });
    },
    stickerToImage(inputPath, outputPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat('png').save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', (err) => reject(err));
        });
    }
};

// ==========================================
// 6. MAIN BOT FUNCTION
// ==========================================
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.macOS('Desktop')
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            isConnected = false;
            latestQR = await qrcode.toDataURL(qr);
        }
        if (connection === 'open') {
            isConnected = true;
            latestQR = "";
            console.log('=== Hu Tao Bot Online & Terhubung! ===');
        }
        if (connection === 'close') {
            isConnected = false;
            setTimeout(startBot, 5000);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const remoteJid = m.key.remoteJid;
        const type = Object.keys(m.message)[0];
        const body = m.message.conversation || 
                     m.message.extendedTextMessage?.text || 
                     m.message.imageMessage?.caption || 
                     m.message.videoMessage?.caption || '';

        const text = body.trim();

        // Helper reply ringkas
        const reply = async (content) => {
            if (typeof content === 'string') {
                return await sock.sendMessage(remoteJid, { text: content }, { quoted: m });
            }
            return await sock.sendMessage(remoteJid, content, { quoted: m });
        };

        if (!text && type !== 'imageMessage' && type !== 'stickerMessage') return;

        const args = text.split(/ +/);
        const rawCmd = args.shift().toLowerCase();
        const commandName = rawCmd.startsWith('.') ? rawCmd.slice(1) : rawCmd;
        const textArgs = args.join(' ');

        // ------------------------------------------
        // A. EKSEKUSI MODULAR COMMANDS FROM /commands
        // ------------------------------------------
        if (rawCmd.startsWith('.') && commands.has(commandName)) {
            const cmd = commands.get(commandName);
            try {
                // Pass 'commands' Map ke fungsi execute agar .menu bisa membaca semua daftar perintah
                await cmd.execute(sock, m, remoteJid, type, helpers, commandName, textArgs, reply, commands);
            } catch (err) {
                console.error(`Error pada command ${commandName}:`, err);
                await reply("⚠️ Terjadi kesalahan saat menjalankan perintah tersebut.");
            }
            return;
        }

        // ------------------------------------------
        // B. AI CHATBOT (Groq -> Fallback Gemini)
        // ------------------------------------------
        if (text && !text.startsWith('.')) {
            try {
                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: GROQ_MODEL,
                        messages: [
                            {
                                role: 'system',
                                content: 'Kamu adalah Hu Tao dari Genshin Impact.\n' +
                                         '1. Jawab pertanyaan pengguna dengan gaya santai khas Hu Tao.\n' +
                                         '2. Buat jawaban singkat, padat, dan menarik.'
                            },
                            { role: 'user', content: text }
                        ],
                        max_tokens: 1000
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${GROQ_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    }
                );

                let replyText = response.data?.choices?.[0]?.message?.content || "";
                if (replyText.includes("</think>")) replyText = replyText.split("</think>")[1];

                if (replyText.trim()) {
                    await reply(replyText.trim());
                }
            } catch (e) {
                console.log("Groq Error:", e.response?.data || e.message);

                // Fallback ke Gemini
                if (GEMINI_API_KEY) {
                    try {
                        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                        const modelGemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                        const prompt = `Kamu adalah Hu Tao dari Genshin Impact. Tanggapi obrolan ini singkat dan ala Hu Tao:\n"${text}"`;
                        const result = await modelGemini.generateContent(prompt);
                        await reply(result.response.text());
                    } catch (err) {
                        console.log("Gemini Error:", err.message);
                    }
                }
            }
        }
    });
}

startBot();