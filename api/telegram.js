import formidable from "formidable";
import fs from "fs/promises";

export const config = {
    api: {
        bodyParser: false
    }
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            ok: false,
            error: "Method Not Allowed"
        });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        return res.status(500).json({
            ok: false,
            error: "Telegram environment variables are missing"
        });
    }

    let uploadedFile;

    try {
        const form = formidable({
            multiples: false,
            keepExtensions: true
        });

        const [, files] = await form.parse(req);

        uploadedFile = Array.isArray(files.file)
            ? files.file[0]
            : files.file;

        if (!uploadedFile) {
            return res.status(400).json({
                ok: false,
                error: "No file received"
            });
        }

        const filePath = uploadedFile.filepath;

        const fileName =
            uploadedFile.originalFilename || "file";

        const mimeType =
            uploadedFile.mimetype ||
            "application/octet-stream";

        const fileSize = uploadedFile.size || 0;

        /*
         * Vercel has a request limit.
         * Keep a safety limit below 4.5 MB.
         */
        const MAX_SIZE = 4 * 1024 * 1024;

        if (fileSize > MAX_SIZE) {
            return res.status(413).json({
                ok: false,
                error: "File is too large. Maximum supported size is 4 MB."
            });
        }

        // Read temporary file
        const buffer = await fs.readFile(filePath);

        // Native Node.js FormData
        const telegramForm = new FormData();

        telegramForm.append("chat_id", chatId);

        telegramForm.append(
            "document",
            new Blob([buffer], {
                type: mimeType
            }),
            fileName
        );

        const telegramResponse = await fetch(
            `https://api.telegram.org/bot${token}/sendDocument`,
            {
                method: "POST",
                body: telegramForm
            }
        );

        const telegramData =
            await telegramResponse.json();

        if (!telegramResponse.ok || !telegramData.ok) {
            console.error(
                "Telegram error:",
                telegramData
            );

            return res.status(500).json({
                ok: false,
                error: "Telegram upload failed",
                telegram: telegramData
            });
        }

        const message = telegramData.result;

        const telegramFile =
            message.document || null;

        return res.status(200).json({
            ok: true,

            file: {
                name: fileName,
                size: fileSize,
                mimeType: mimeType
            },

            telegram: {
                messageId: message.message_id,
                fileId: telegramFile
                    ? telegramFile.file_id
                    : null
            }
        });

    } catch (error) {
        console.error(
            "Telegram upload error:",
            error
        );

        return res.status(500).json({
            ok: false,
            error: error.message
        });
    } finally {
        // Delete temporary file
        if (uploadedFile?.filepath) {
            try {
                await fs.unlink(
                    uploadedFile.filepath
                );
            } catch {
                // Ignore cleanup errors
            }
        }
    }
}
