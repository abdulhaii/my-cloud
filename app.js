// ============================================
// My Cloud Storage
// app.js
// ============================================

// ============================================
// Firebase App
// ============================================

import {
initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
getAuth,
GoogleAuthProvider,
signInWithPopup,
signOut,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
getFirestore,
collection,
addDoc,
getDocs,
query,
where
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// ============================================
// Firebase Configuration
// ============================================

const firebaseConfig = {

apiKey:
    "AIzaSyDdQSIn79XHyD1rZy4sEatETdnbBlJBCKc",

authDomain:
    "tele-arrangement.firebaseapp.com",

projectId:
    "tele-arrangement",

storageBucket:
    "tele-arrangement.firebasestorage.app",

messagingSenderId:
    "939924244118",

appId:
    "1:939924244118:web:dcc613a89bb158348f24b7"

};

// ============================================
// Initialize Firebase
// ============================================

const firebaseApp =
initializeApp(firebaseConfig);

const auth =
getAuth(firebaseApp);

const db =
getFirestore(firebaseApp);

const googleProvider =
new GoogleAuthProvider();

// ============================================
// Global State
// ============================================

let currentUser = null;

let currentFolderId = null;

let currentFolderName = "الرئيسية";

// ============================================
// Application Root
// ============================================

const appContainer =
document.getElementById("app");

// ============================================
// Material Icon Helper
// ============================================

function icon(
name,
className = ""
) {

return `
    <span class="material-symbols-rounded ${className}">
        ${name}
    </span>
`;

}

// ============================================
// Login Screen
// ============================================

function showLoginScreen() {

if (!appContainer) {
    return;
}


appContainer.innerHTML = `

    <div class="login-container">

        <div class="login-box">

            <div class="login-logo">

                ${icon("cloud", "login-cloud-icon")}

            </div>


            <h1>
                My Cloud Storage
            </h1>


            <p>
                التخزين السحابي الخاص بك
            </p>


            <button
                id="googleLoginButton"
                class="google-login-button"
            >

                ${icon("account_circle")}

                <span>
                    تسجيل الدخول باستخدام Google
                </span>

            </button>

        </div>

    </div>
`;


const loginButton =
    document.getElementById(
        "googleLoginButton"
    );


if (loginButton) {

    loginButton.addEventListener(
        "click",
        loginWithGoogle
    );

}

}

// ============================================
// Google Login
// ============================================

async function loginWithGoogle() {

const button =
    document.getElementById(
        "googleLoginButton"
    );


try {

    if (button) {

        button.disabled = true;

        button.innerHTML = `

            ${icon("progress_activity", "loading-icon")}

            <span>
                جاري تسجيل الدخول...
            </span>

        `;
    }


    const result =
        await signInWithPopup(
            auth,
            googleProvider
        );


    const user =
        result.user;


    console.log(
        "Logged in:",
        user.displayName
    );


    console.log(
        "Email:",
        user.email
    );


    console.log(
        "UID:",
        user.uid
    );


} catch (error) {

    console.error(
        "Login error:",
        error
    );


    if (button) {

        button.disabled = false;

        button.innerHTML = `

            ${icon("account_circle")}

            <span>
                تسجيل الدخول باستخدام Google
            </span>

        `;
    }


    alert(
        "حدث خطأ أثناء تسجيل الدخول:\n\n" +
        error.message
    );
}

}

// ============================================
// Logout
// ============================================

async function logout() {

try {

    await signOut(auth);

} catch (error) {

    console.error(
        "Logout error:",
        error
    );


    alert(
        "حدث خطأ أثناء تسجيل الخروج:\n\n" +
        error.message
    );
}

}

// ============================================
// Main Application
// ============================================

function showMainApp() {

if (!appContainer) {
    return;
}


const displayName =
    currentUser?.displayName ||
    "المستخدم";


const email =
    currentUser?.email ||
    "";


appContainer.innerHTML = `

    <div class="cloud-app">

        <!-- ============================= -->
        <!-- Header -->
        <!-- ============================= -->

        <header class="app-header">

            <div class="brand">

                <div class="brand-icon">

                    ${icon("cloud")}

                </div>


                <div>

                    <h1>
                        My Cloud Storage
                    </h1>

                    <span>
                        التخزين السحابي
                    </span>

                </div>

            </div>


            <div class="user-area">

                <div class="user-info">

                    <div class="user-avatar">

                        ${
                            currentUser?.photoURL
                                ? `
                                    <img
                                        src="${escapeHtml(
                                            currentUser.photoURL
                                        )}"
                                        alt="User"
                                    >
                                `
                                : icon("person")
                        }

                    </div>


                    <div class="user-text">

                        <strong>
                            ${escapeHtml(
                                displayName
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                email
                            )}
                        </small>

                    </div>

                </div>


                <button
                    id="logoutButton"
                    class="icon-button"
                    title="تسجيل الخروج"
                >

                    ${icon("logout")}

                </button>

            </div>

        </header>


        <!-- ============================= -->
        <!-- Toolbar -->
        <!-- ============================= -->

        <div class="toolbar">

            <div class="toolbar-main">

                <button
                    id="homeButton"
                    class="toolbar-button secondary"
                >

                    ${icon("home")}

                    <span>
                        الرئيسية
                    </span>

                </button>


                <button
                    id="createFolderButton"
                    class="toolbar-button primary"
                >

                    ${icon("create_new_folder")}

                    <span>
                        مجلد جديد
                    </span>

                </button>


                <button
                    id="uploadButton"
                    class="toolbar-button success"
                >

                    ${icon("upload_file")}

                    <span>
                        رفع ملف
                    </span>

                </button>


                <input
                    type="file"
                    id="fileInput"
                    hidden
                >

            </div>


            <div class="search-box">

                ${icon("search")}

                <input
                    type="text"
                    id="searchInput"
                    placeholder="البحث في الملفات..."
                    autocomplete="off"
                >

                <button
                    id="clearSearchButton"
                    class="clear-search"
                    title="مسح البحث"
                    style="display:none;"
                >

                    ${icon("close")}

                </button>

            </div>

        </div>


        <!-- ============================= -->
        <!-- Breadcrumb -->
        <!-- ============================= -->

        <div
            id="breadcrumb"
            class="breadcrumb"
        ></div>


        <!-- ============================= -->
        <!-- Content -->
        <!-- ============================= -->

        <main
            id="fileContainer"
            class="file-container"
        >

            <div class="loading-container">

                ${icon(
                    "progress_activity",
                    "loading-icon"
                )}

                <span>
                    جاري تحميل الملفات...
                </span>

            </div>

        </main>

    </div>
`;


// ========================================
// Events
// ========================================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logout
    );

}


const homeButton =
    document.getElementById(
        "homeButton"
    );


if (homeButton) {

    homeButton.addEventListener(
        "click",
        goHome
    );

}


const createFolderButton =
    document.getElementById(
        "createFolderButton"
    );


if (createFolderButton) {

    createFolderButton.addEventListener(
        "click",
        createFolder
    );

}


// ========================================
// Upload
// ========================================

const uploadButton =
    document.getElementById(
        "uploadButton"
    );


const fileInput =
    document.getElementById(
        "fileInput"
    );


if (
    uploadButton &&
    fileInput
) {

    uploadButton.addEventListener(
        "click",
        () => {

            if (!currentUser) {

                alert(
                    "يجب تسجيل الدخول أولاً"
                );

                return;
            }


            fileInput.click();

        }
    );


    fileInput.addEventListener(
        "change",
        async () => {

            const file =
                fileInput.files?.[0];


            if (!file) {
                return;
            }


            await uploadFileToTelegram(
                file
            );


            fileInput.value = "";

        }
    );

}


// ========================================
// Search
// ========================================

const searchInput =
    document.getElementById(
        "searchInput"
    );


const clearSearchButton =
    document.getElementById(
        "clearSearchButton"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        async () => {

            const text =
                searchInput.value
                    .trim()
                    .toLowerCase();


            if (clearSearchButton) {

                clearSearchButton.style.display =
                    text
                        ? "flex"
                        : "none";

            }


            if (!text) {

                await refreshCurrentFolder();

                return;
            }


            await searchFiles(
                text
            );

        }
    );

}


if (clearSearchButton) {

    clearSearchButton.addEventListener(
        "click",
        async () => {

            searchInput.value = "";

            clearSearchButton.style.display =
                "none";

            await refreshCurrentFolder();

            searchInput.focus();

        }
    );

}


// ========================================
// Initial Load
// ========================================

updateBreadcrumb();

refreshCurrentFolder();

}

// ============================================
// Go Home
// ============================================

async function goHome() {

currentFolderId = null;

currentFolderName =
    "الرئيسية";


const searchInput =
    document.getElementById(
        "searchInput"
    );


const clearButton =
    document.getElementById(
        "clearSearchButton"
    );


if (searchInput) {
    searchInput.value = "";
}


if (clearButton) {
    clearButton.style.display = "none";
}


updateBreadcrumb();

await refreshCurrentFolder();

}

// ============================================
// Refresh Folder
// ============================================

async function refreshCurrentFolder() {

await loadFolders();

await loadFiles();

updateBreadcrumb();

}

// ============================================
// Create Folder
// ============================================

async function createFolder() {

if (!currentUser) {

    alert(
        "يجب تسجيل الدخول أولاً"
    );

    return;
}


const folderName =
    prompt(
        "اكتب اسم المجلد:"
    );


if (folderName === null) {
    return;
}


const cleanName =
    folderName.trim();


if (!cleanName) {

    alert(
        "اسم المجلد لا يمكن أن يكون فارغًا."
    );

    return;
}


try {

    await addDoc(
        collection(
            db,
            "folders"
        ),
        {

            name:
                cleanName,

            parentId:
                currentFolderId || null,

            ownerId:
                currentUser.uid,

            createdAt:
                new Date()

        }
    );


    await loadFolders();


} catch (error) {

    console.error(
        "Create folder error:",
        error
    );


    alert(
        "حدث خطأ أثناء إنشاء المجلد:\n\n" +
        error.message
    );
}

}

// ============================================
// Load Folders
// ============================================

async function loadFolders() {

if (!currentUser) {
    return;
}


const container =
    document.getElementById(
        "fileContainer"
    );


if (!container) {
    return;
}


try {

    const foldersQuery =
        query(
            collection(
                db,
                "folders"
            ),

            where(
                "ownerId",
                "==",
                currentUser.uid
            ),

            where(
                "parentId",
                "==",
                currentFolderId || null
            )
        );


    const snapshot =
        await getDocs(
            foldersQuery
        );


    const folders = [];


    snapshot.forEach(
        docSnapshot => {

            folders.push({
                id:
                    docSnapshot.id,

                ...docSnapshot.data()
            });

        }
    );


    // Sort newest first

    folders.sort(
        (a, b) => {

            const aTime =
                getTimestamp(
                    a.createdAt
                );

            const bTime =
                getTimestamp(
                    b.createdAt
                );

            return bTime - aTime;

        }
    );


    // Remove old folders

    const oldFolders =
        container.querySelectorAll(
            ".folder-item"
        );


    oldFolders.forEach(
        item => item.remove()
    );


    // Render folders

    folders.forEach(
        folder => {

            const element =
                createFolderElement(
                    folder
                );


            container.appendChild(
                element
            );

        }
    );


} catch (error) {

    console.error(
        "Load folders error:",
        error
    );


    showError(
        "حدث خطأ أثناء تحميل المجلدات",
        error
    );
}

}

// ============================================
// Create Folder Element
// ============================================

function createFolderElement(
folder
) {

const element =
    document.createElement(
        "div"
    );


element.className =
    "folder-item";


element.dataset.id =
    folder.id;


element.innerHTML = `

    <div class="item-icon folder-icon">

        ${icon("folder")}

    </div>


    <div class="item-name">

        ${escapeHtml(
            folder.name
        )}

    </div>


    <div class="item-type">

        مجلد

    </div>

`;


// Double click to open

element.addEventListener(
    "dblclick",
    async () => {

        currentFolderId =
            folder.id;

        currentFolderName =
            folder.name;


        updateBreadcrumb();

        await refreshCurrentFolder();

    }
);


return element;

}

// ============================================
// Load Files
// ============================================

async function loadFiles(
folderId = currentFolderId
) {

if (!currentUser) {
    return;
}


const container =
    document.getElementById(
        "fileContainer"
    );


if (!container) {
    return;
}


try {

    const filesQuery =
        query(
            collection(
                db,
                "files"
            ),

            where(
                "ownerId",
                "==",
                currentUser.uid
            ),

            where(
                "folderId",
                "==",
                folderId || null
            ),

            where(
                "deleted",
                "==",
                false
            )
        );


    const snapshot =
        await getDocs(
            filesQuery
        );


    const files = [];


    snapshot.forEach(
        docSnapshot => {

            files.push({
                id:
                    docSnapshot.id,

                ...docSnapshot.data()
            });

        }
    );


    // Sort newest first

    files.sort(
        (a, b) => {

            const aTime =
                getTimestamp(
                    a.createdAt
                );

            const bTime =
                getTimestamp(
                    b.createdAt
                );

            return bTime - aTime;

        }
    );


    // Remove old files

    const oldFiles =
        container.querySelectorAll(
            ".file-item"
        );


    oldFiles.forEach(
        item => item.remove()
    );


    // Render files

    files.forEach(
        file => {

            const element =
                createFileElement(
                    file
                );


            container.appendChild(
                element
            );

        }
    );


    updateEmptyState();


} catch (error) {

    console.error(
        "Load files error:",
        error
    );


    showError(
        "حدث خطأ أثناء تحميل الملفات",
        error
    );
}

}

// ============================================
// Create File Element
// ============================================

function createFileElement(
file
) {

const element =
    document.createElement(
        "div"
    );


element.className =
    "file-item";


element.dataset.id =
    file.id;


element.innerHTML = `

    <div class="item-icon file-icon">

        ${icon(
            getFileIcon(
                file.mimeType,
                file.name
            )
        )}

    </div>


    <div class="item-name">

        ${escapeHtml(
            file.name
        )}

    </div>


    <div class="item-type">

        ${formatFileSize(
            file.size
        )}

    </div>

`;


return element;

}

// ============================================
// Search
// ============================================

async function searchFiles(
searchText
) {

if (!currentUser) {
    return;
}


const container =
    document.getElementById(
        "fileContainer"
    );


if (!container) {
    return;
}


try {

    const filesQuery =
        query(
            collection(
                db,
                "files"
            ),

            where(
                "ownerId",
                "==",
                currentUser.uid
            ),

            where(
                "deleted",
                "==",
                false
            )
        );


    const snapshot =
        await getDocs(
            filesQuery
        );


    const results = [];


    snapshot.forEach(
        docSnapshot => {

            const file =
                docSnapshot.data();


            const name =
                (
                    file.name ||
                    ""
                ).toLowerCase();


            if (
                name.includes(
                    searchText
                )
            ) {

                results.push({

                    id:
                        docSnapshot.id,

                    ...file

                });

            }

        }
    );


    results.sort(
        (a, b) => {

            const aTime =
                getTimestamp(
                    a.createdAt
                );

            const bTime =
                getTimestamp(
                    b.createdAt
                );

            return bTime - aTime;

        }
    );


    container.innerHTML = "";


    if (!results.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">

                    ${icon("search_off")}

                </div>

                <h3>
                    لا توجد نتائج
                </h3>

                <p>
                    لم نجد ملفات تطابق بحثك.
                </p>

            </div>

        `;

        return;
    }


    results.forEach(
        file => {

            const element =
                createFileElement(
                    file
                );


            container.appendChild(
                element
            );

        }
    );


} catch (error) {

    console.error(
        "Search error:",
        error
    );


    showError(
        "حدث خطأ أثناء البحث",
        error
    );
}

}

// ============================================
// Upload File To Telegram
// ============================================

async function uploadFileToTelegram(
file
) {

if (!currentUser) {

    alert(
        "يجب تسجيل الدخول أولاً"
    );

    return;
}


if (!file) {
    return;
}


// Current safe limit
// because Vercel Function request limit

const MAX_SIZE =
    4 * 1024 * 1024;


if (file.size > MAX_SIZE) {

    alert(
        "الملف كبير جدًا.\n\n" +
        "الحد الحالي للرفع هو 4 MB تقريبًا."
    );

    return;
}


const uploadButton =
    document.getElementById(
        "uploadButton"
    );


try {

    if (uploadButton) {

        uploadButton.disabled = true;

        uploadButton.innerHTML = `

            ${icon(
                "progress_activity",
                "loading-icon"
            )}

            <span>
                جاري الرفع...
            </span>

        `;
    }


    console.log(
        "Starting upload:",
        file.name
    );


    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    const response =
        await fetch(
            "/api/telegram",
            {
                method: "POST",
                body: formData
            }
        );


    const result =
        await response.json();


    console.log(
        "Telegram API response:",
        result
    );


    if (
        !response.ok ||
        !result.ok
    ) {

        throw new Error(
            result.error ||
            "Upload failed"
        );
    }


    // ====================================
    // Save Metadata
    // ====================================

    const fileData = {

        name:
            result.file.name,

        size:
            result.file.size,

        mimeType:
            result.file.mimeType,

        folderId:
            currentFolderId ||
            null,

        telegramMessageId:
            result.telegram.messageId,

        telegramFileId:
            result.telegram.fileId,

        ownerId:
            currentUser.uid,

        deleted:
            false,

        createdAt:
            new Date()

    };


    const fileRef =
        await addDoc(
            collection(
                db,
                "files"
            ),
            fileData
        );


    console.log(
        "Firestore document created:",
        fileRef.id
    );


    alert(
        "تم رفع الملف بنجاح ✅\n\n" +
        file.name
    );


    await loadFiles();


} catch (error) {

    console.error(
        "Upload error:",
        error
    );


    alert(
        "حدث خطأ أثناء رفع الملف:\n\n" +
        error.message
    );


} finally {

    if (uploadButton) {

        uploadButton.disabled =
            false;


        uploadButton.innerHTML = `

            ${icon("upload_file")}

            <span>
                رفع ملف
            </span>

        `;
    }
}

}

// ============================================
// Breadcrumb
// ============================================

function updateBreadcrumb() {

const breadcrumb =
    document.getElementById(
        "breadcrumb"
    );


if (!breadcrumb) {
    return;
}


if (!currentFolderId) {

    breadcrumb.innerHTML = `

        <div class="breadcrumb-item active">

            ${icon("home")}

            <span>
                الرئيسية
            </span>

        </div>

    `;

    return;
}


breadcrumb.innerHTML = `

    <button
        id="breadcrumbHome"
        class="breadcrumb-button"
    >

        ${icon("home")}

        <span>
            الرئيسية
        </span>

    </button>


    <span class="breadcrumb-separator">

        ${icon("chevron_left")}

    </span>


    <div class="breadcrumb-current">

        ${icon("folder")}

        <span>
            ${escapeHtml(
                currentFolderName
            )}
        </span>

    </div>

`;


const home =
    document.getElementById(
        "breadcrumbHome"
    );


if (home) {

    home.addEventListener(
        "click",
        goHome
    );

}

}

// ============================================
// File Icon
// ============================================

function getFileIcon(
mimeType,
fileName
) {

const type =
    mimeType || "";


if (
    type.startsWith(
        "image/"
    )
) {

    return "image";

}


if (
    type.startsWith(
        "video/"
    )
) {

    return "video_file";

}


if (
    type.startsWith(
        "audio/"
    )
) {

    return "audio_file";

}


if (
    type.includes(
        "pdf"
    )
) {

    return "picture_as_pdf";

}


if (
    type.includes(
        "zip"
    ) ||
    type.includes(
        "compressed"
    ) ||
    type.includes(
        "rar"
    )
) {

    return "folder_zip";

}


const extension =
    fileName
        ?.split(".")
        .pop()
        ?.toLowerCase();


if (
    extension === "doc" ||
    extension === "docx"
) {

    return "article";

}


if (
    extension === "xls" ||
    extension === "xlsx"
) {

    return "table_chart";

}


if (
    extension === "ppt" ||
    extension === "pptx"
) {

    return "slideshow";

}


if (
    extension === "txt"
) {

    return "text_snippet";

}


if (
    extension === "js" ||
    extension === "html" ||
    extension === "css" ||
    extension === "java" ||
    extension === "cpp" ||
    extension === "py"
) {

    return "code";

}


return "description";

}

// ============================================
// File Size
// ============================================

function formatFileSize(
bytes
) {

if (
    !bytes ||
    bytes <= 0
) {

    return "0 B";
}


const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB"
];


const index =
    Math.floor(
        Math.log(bytes) /
        Math.log(1024)
    );


const size =
    bytes /
    Math.pow(
        1024,
        index
    );


return (
    size.toFixed(
        index === 0
            ? 0
            : 2
    ) +
    " " +
    units[index]
);

}

// ============================================
// Timestamp
// ============================================

function getTimestamp(
value
) {

if (!value) {
    return 0;
}


if (
    typeof value.toMillis ===
    "function"
) {

    return value.toMillis();

}


if (
    value instanceof Date
) {

    return value.getTime();

}


if (
    typeof value === "number"
) {

    return value;

}


return 0;

}

// ============================================
// Empty State
// ============================================

function updateEmptyState() {

const container =
    document.getElementById(
        "fileContainer"
    );


if (!container) {
    return;
}


const items =
    container.querySelectorAll(
        ".folder-item, .file-item"
    );


const existingEmpty =
    container.querySelector(
        ".empty-state"
    );


if (
    items.length === 0 &&
    !existingEmpty
) {

    container.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">

                ${icon("cloud_off")}

            </div>


            <h3>
                المجلد فارغ
            </h3>


            <p>
                ابدأ برفع ملف أو إنشاء مجلد جديد.
            </p>

        </div>

    `;

}

}

// ============================================
// Error Display
// ============================================

function showError(
title,
error
) {

const container =
    document.getElementById(
        "fileContainer"
    );


if (!container) {
    return;
}


console.error(
    title,
    error
);


container.innerHTML = `

    <div class="empty-state error-state">

        <div class="empty-icon">

            ${icon("error")}

        </div>


        <h3>
            ${escapeHtml(
                title
            )}
        </h3>


        <p>
            ${escapeHtml(
                error?.message ||
                "حدث خطأ غير معروف"
            )}
        </p>

    </div>

`;

}

// ============================================
// Escape HTML
// ============================================

function escapeHtml(
value
) {

if (
    value === null ||
    value === undefined
) {

    return "";

}


return String(value)

    .replace(
        /&/g,
        "&amp;"
    )

    .replace(
        /</g,
        "&lt;"
    )

    .replace(
        />/g,
        "&gt;"
    )

    .replace(
        /"/g,
        "&quot;"
    )

    .replace(
        /'/g,
        "&#039;"
    );

}

// ============================================
// Authentication State
// ============================================

onAuthStateChanged(
auth,
user => {

    if (user) {

        currentUser =
            user;


        console.log(
            "Authenticated user:",
            user.uid
        );


        currentFolderId =
            null;


        currentFolderName =
            "الرئيسية";


        showMainApp();

    } else {

        currentUser =
            null;


        currentFolderId =
            null;


        currentFolderName =
            "الرئيسية";


        showLoginScreen();

    }

}

);
