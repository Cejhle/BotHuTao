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
// 1. CONFIG: ENVIRONMENT VARIABLES & EXPRESS
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

try {
    const ffmpegPath = require('ffmpeg-static');
    if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
} catch (e) {}

const BOT_NUMBER = process.env.BOT_NUMBER || ""; 
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = "qwen/qwen3.6-27b";

// Server Express untuk Keep-Alive (Render Anti-Sleep & Web QR)
const app = express();
const port = process.env.PORT || 3000;
let latestQR = "", isConnected = false;

app.get('/', (req, res) => {
    if (isConnected) res.send('<h2>✅ Hu Tao WhatsApp Bot Online & Running!</h2>');
    else if (latestQR) res.send(`<img src="${latestQR}" width="280" />`);
    else res.send('<h2>⏳ Memuat QR Bot Hu Tao...</h2>');
});
app.listen(port, () => console.log(`Server HTTP / anti-sleep aktif di port ${port}`));

// ==========================================
// 2. LOAD AUTOMATIC COMMAND HANDLER
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
// 3. CONVERTER HELPERS
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
// 4. MAIN BOT FUNCTION
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
        if (!text && type !== 'imageMessage' && type !== 'stickerMessage') return;

        const args = text.split(/ +/);
        const commandName = args.shift().toLowerCase();
        const textArgs = args.join(' ');

        // A. EKSEKUSI COMMAND FITUR MODULAR (.menu, .s, .toimg, .ocr, .tt, .ig, .douyin, dll)
        if (commands.has(commandName)) {
            const cmd = commands.get(commandName);
            await cmd.execute(sock, m, remoteJid, type, helpers, commandName, textArgs);
            return;
        }

        // B. AI CHATBOT (Groq Utama -> Fallback Gemini)
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
                                         '1. Jika pengguna mengirim sebaris lirik lagu, LANJUTKAN lirik lagu tersebut 2-4 baris berikutnya lalu sebutkan judul lagunya.\n' +
                                         '2. Jika pengguna ngobrol biasa, jawab singkat ala Hu Tao.'
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
                    await sock.sendMessage(remoteJid, { text: replyText.trim() }, { quoted: m });
                }
            } catch (e) {
                console.log("Groq Error:", e.response?.data || e.message);

                // Fallback ke Gemini jika Groq gagal
                if (GEMINI_API_KEY) {
                    try {
                        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                        const modelGemini = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                        const prompt = `Kamu adalah Hu Tao. Jika ini lirik lagu, lanjutkan liriknya. Jika ngobrol biasa, tanggapi ala Hu Tao singkat saja:\n"${text}"`;
                        const result = await modelGemini.generateContent(prompt);
                        await sock.sendMessage(remoteJid, { text: result.response.text() }, { quoted: m });
                    } catch (err) {
                        console.log("Gemini Error:", err.message);
                    }
                }
            }
        }
    });
}

startBot();