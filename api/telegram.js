export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            ok: false,
            error: "Method Not Allowed"
        });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token) {
        return res.status(500).json({
            ok: false,
            error: "TELEGRAM_BOT_TOKEN is missing"
        });
    }

    if (!chatId) {
        return res.status(500).json({
            ok: false,
            error: "TELEGRAM_CHAT_ID is missing"
        });
    }

    try {
        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: "✅ My Cloud Storage\n\nTelegram connection test successful."
                })
            }
        );

        const data = await telegramResponse.json();

        if (!telegramResponse.ok || !data.ok) {
            return res.status(500).json({
                ok: false,
                telegram: data
            });
        }

        return res.status(200).json({
            ok: true,
            message: "Telegram connection successful",
            telegram_message_id: data.result.message_id
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            error: error.message
        });
    }
}
