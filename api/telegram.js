import formidable from "formidable";
import fs from "fs/promises";

export const config = {
    api: {
        bodyParser: false
    }
};


// ============================================
// Main Handler
// ============================================

export default async function handler(
    req,
    res
) {

    const token =
        process.env.TELEGRAM_BOT_TOKEN;


    const chatId =
        process.env.TELEGRAM_CHAT_ID;


    if (!token || !chatId) {

        return res.status(500).json({

            ok: false,

            error:
                "Telegram environment variables are missing"

        });
    }


    // ========================================
    // Upload
    // ========================================

    if (
        req.method === "POST"
    ) {

        return handleUpload(
            req,
            res,
            token,
            chatId
        );
    }


    // ========================================
    // Download / Open
    // ========================================

    if (
        req.method === "GET"
    ) {

        return handleDownload(
            req,
            res,
            token
        );
    }


    // ========================================
    // Delete
    // ========================================

    if (
        req.method === "DELETE"
    ) {

        return handleDelete(
            req,
            res,
            token,
            chatId
        );
    }


    return res.status(405).json({

        ok: false,

        error:
            "Method Not Allowed"

    });
}


// ============================================
// Upload
// ============================================

async function handleUpload(
    req,
    res,
    token,
    chatId
) {

    let uploadedFile;


    try {

        const form =
            formidable({

                multiples:
                    false,

                keepExtensions:
                    true

            });


        const [
            ,
            files
        ] =
            await form.parse(
                req
            );


        uploadedFile =
            Array.isArray(
                files.file
            )
                ? files.file[0]
                : files.file;


        if (!uploadedFile) {

            return res.status(400).json({

                ok: false,

                error:
                    "No file received"

            });
        }


        const filePath =
            uploadedFile.filepath;


        const fileName =
            uploadedFile.originalFilename ||
            "file";


        const mimeType =
            uploadedFile.mimetype ||
            "application/octet-stream";


        const fileSize =
            uploadedFile.size ||
            0;


        // Vercel safe limit

        const MAX_SIZE =
            4 * 1024 * 1024;


        if (
            fileSize >
            MAX_SIZE
        ) {

            return res.status(413).json({

                ok: false,

                error:
                    "File is too large. Maximum supported size is 4 MB."

            });
        }


        const buffer =
            await fs.readFile(
                filePath
            );


        const telegramForm =
            new FormData();


        telegramForm.append(
            "chat_id",
            chatId
        );


        telegramForm.append(

            "document",

            new Blob(
                [
                    buffer
                ],
                {
                    type:
                        mimeType
                }
            ),

            fileName

        );


        const telegramResponse =
            await fetch(

                `https://api.telegram.org/bot${token}/sendDocument`,

                {

                    method:
                        "POST",

                    body:
                        telegramForm

                }
            );


        const telegramData =
            await telegramResponse.json();


        if (
            !telegramResponse.ok ||
            !telegramData.ok
        ) {

            console.error(
                "Telegram upload error:",
                telegramData
            );


            return res.status(500).json({

                ok: false,

                error:
                    "Telegram upload failed",

                telegram:
                    telegramData

            });
        }


        const message =
            telegramData.result;


        const telegramFile =
            message.document ||
            null;


        return res.status(200).json({

            ok: true,

            file: {

                name:
                    fileName,

                size:
                    fileSize,

                mimeType:
                    mimeType

            },

            telegram: {

                messageId:
                    message.message_id,

                fileId:
                    telegramFile
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

            error:
                error.message

        });


    } finally {

        if (
            uploadedFile?.filepath
        ) {

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


// ============================================
// Download / Open
// ============================================

async function handleDownload(
    req,
    res,
    token
) {

    try {

        const fileId =
            req.query?.fileId;


        const download =
            req.query?.download === "1";


        const fileName =
            req.query?.name ||
            "file";


        if (!fileId) {

            return res.status(400).json({

                ok: false,

                error:
                    "Missing fileId"

            });
        }


        // ====================================
        // Telegram getFile
        // ====================================

        const getFileResponse =
            await fetch(

                `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(
                    fileId
                )}`

            );


        const getFileData =
            await getFileResponse.json();


        if (
            !getFileResponse.ok ||
            !getFileData.ok
        ) {

            console.error(
                "Telegram getFile error:",
                getFileData
            );


            return res.status(500).json({

                ok: false,

                error:
                    "Could not get Telegram file",

                telegram:
                    getFileData

            });
        }


        const telegramPath =
            getFileData.result.file_path;


        // ====================================
        // Download from Telegram
        // ====================================

        const telegramFileResponse =
            await fetch(

                `https://api.telegram.org/file/bot${token}/${telegramPath}`

            );


        if (
            !telegramFileResponse.ok
        ) {

            return res.status(500).json({

                ok: false,

                error:
                    "Could not download file from Telegram"

            });
        }


        // ====================================
        // Headers
        // ====================================

        const contentType =
            telegramFileResponse.headers.get(
                "content-type"
            ) ||
            "application/octet-stream";


        const contentLength =
            telegramFileResponse.headers.get(
                "content-length"
            );


        res.setHeader(
            "Content-Type",
            contentType
        );


        if (contentLength) {

            res.setHeader(
                "Content-Length",
                contentLength
            );
        }


        if (download) {

            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${safeFileName(
                    fileName
                )}"`
            );

        } else {

            res.setHeader(
                "Content-Disposition",
                `inline; filename="${safeFileName(
                    fileName
                )}"`
            );
        }


        // ====================================
        // Stream
        // ====================================

        if (
            telegramFileResponse.body
        ) {

            const reader =
                telegramFileResponse.body
                    .getReader();


            while (true) {

                const {
                    done,
                    value
                } =
                    await reader.read();


                if (done) {
                    break;
                }


                res.write(
                    Buffer.from(
                        value
                    )
                );
            }


            res.end();


            return;
        }


        // Fallback

        const buffer =
            Buffer.from(
                await telegramFileResponse.arrayBuffer()
            );


        res.end(
            buffer
        );


    } catch (error) {

        console.error(
            "Telegram download error:",
            error
        );


        if (!res.headersSent) {

            return res.status(500).json({

                ok: false,

                error:
                    error.message

            });
        }


        res.end();
    }
}


// ============================================
// Delete Telegram Message
// ============================================

async function handleDelete(
    req,
    res,
    token,
    chatId
) {

    try {

        let body = req.body;


        if (
            typeof body ===
            "string"
        ) {

            try {

                body =
                    JSON.parse(
                        body
                    );

            } catch {

                body = {};
            }
        }


        const messageId =
            body?.messageId;


        if (!messageId) {

            return res.status(400).json({

                ok: false,

                error:
                    "Missing messageId"

            });
        }


        const response =
            await fetch(

                `https://api.telegram.org/bot${token}/deleteMessage`,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            chat_id:
                                chatId,

                            message_id:
                                Number(
                                    messageId
                                )

                        })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.ok
        ) {

            console.error(
                "Telegram delete error:",
                data
            );


            return res.status(500).json({

                ok: false,

                error:
                    "Telegram delete failed",

                telegram:
                    data

            });
        }


        return res.status(200).json({

            ok: true

        });


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        return res.status(500).json({

            ok: false,

            error:
                error.message

        });
    }
}


// ============================================
// Safe File Name
// ============================================

function safeFileName(
    name
) {

    return String(
        name || "file"
    )
        .replace(
            /[\r\n"]/g,
            "_"
        );
}
