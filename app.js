// ============================================
// My Cloud Storage - app.js
// ============================================

// Firebase
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
    where,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ============================================
// Firebase Configuration
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyDdQSIn79XHyD1rZy4sEatETdnbBlJBCKc",
    authDomain: "tele-arrangement.firebaseapp.com",
    projectId: "tele-arrangement",
    storageBucket: "tele-arrangement.firebasestorage.app",
    messagingSenderId: "939924244118",
    appId: "1:939924244118:web:dcc613a89bb158348f24b7"
};


// ============================================
// Initialize Firebase
// ============================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const provider = new GoogleAuthProvider();


// ============================================
// Global Variables
// ============================================

let currentUser = null;

let currentFolderId = null;

let currentFolderName = "الرئيسية";


// ============================================
// DOM Elements
// ============================================

const appContainer =
    document.getElementById("app");


// ============================================
// Create Login Screen
// ============================================

function showLoginScreen() {

    if (!appContainer) {
        console.error("Element #app not found");
        return;
    }

    appContainer.innerHTML = `
        <div class="login-container">

            <div class="login-box">

                <h1>
                    My Cloud Storage
                </h1>

                <p>
                    التخزين السحابي الخاص بك
                </p>

                <button id="googleLoginButton">
                    تسجيل الدخول باستخدام Google
                </button>

            </div>

        </div>
    `;


    const googleLoginButton =
        document.getElementById(
            "googleLoginButton"
        );


    googleLoginButton.addEventListener(
        "click",
        loginWithGoogle
    );
}


// ============================================
// Google Login
// ============================================

async function loginWithGoogle() {

    try {

        const result =
            await signInWithPopup(
                auth,
                provider
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

        currentUser = null;

        currentFolderId = null;

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "حدث خطأ أثناء تسجيل الخروج"
        );
    }
}


// ============================================
// Main Application UI
// ============================================

function showMainApp() {

    if (!appContainer) {
        console.error("Element #app not found");
        return;
    }


    appContainer.innerHTML = `

        <div class="cloud-app">

            <!-- Header -->

            <header class="app-header">

                <div class="app-title">

                    <h1>
                        My Cloud Storage
                    </h1>

                </div>


                <div class="user-area">

                    <span id="userName">
                        ${escapeHtml(
                            currentUser?.displayName ||
                            "المستخدم"
                        )}
                    </span>

                    <button id="logoutButton">
                        تسجيل الخروج
                    </button>

                </div>

            </header>


            <!-- Toolbar -->

            <div class="toolbar">

                <button id="homeButton">
                    الرئيسية
                </button>


                <button id="createFolderButton">
                    + مجلد جديد
                </button>


                <button id="uploadButton">
                    ↑ رفع ملف
                </button>


                <input
                    type="file"
                    id="fileInput"
                    hidden
                />


                <input
                    type="text"
                    id="searchInput"
                    placeholder="بحث..."
                />

            </div>


            <!-- Breadcrumb -->

            <div
                id="breadcrumb"
                class="breadcrumb"
            >
                الرئيسية
            </div>


            <!-- Content -->

            <main
                id="fileContainer"
                class="file-container"
            >

                <p>
                    جاري التحميل...
                </p>

            </main>

        </div>
    `;


    // ========================================
    // Event Listeners
    // ========================================

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    logoutButton.addEventListener(
        "click",
        logout
    );


    const homeButton =
        document.getElementById(
            "homeButton"
        );


    homeButton.addEventListener(
        "click",
        async () => {

            currentFolderId = null;

            currentFolderName =
                "الرئيسية";

            await loadFolders();

            await loadFiles();

            updateBreadcrumb();

        }
    );


    const createFolderButton =
        document.getElementById(
            "createFolderButton"
        );


    createFolderButton.addEventListener(
        "click",
        createFolder
    );


    // ========================================
    // Upload
    // ========================================

    const fileInput =
        document.getElementById(
            "fileInput"
        );


    const uploadButton =
        document.getElementById(
            "uploadButton"
        );


    if (uploadButton && fileInput) {

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
                    fileInput.files[0];

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


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            async () => {

                const searchText =
                    searchInput.value
                        .trim()
                        .toLowerCase();


                if (!searchText) {

                    await loadFolders();

                    await loadFiles();

                    return;
                }


                await searchFiles(
                    searchText
                );

            }
        );

    }


    // ========================================
    // Load Initial Data
    // ========================================

    loadFolders();

    loadFiles();

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


    if (!folderName) {
        return;
    }


    const cleanName =
        folderName.trim();


    if (!cleanName) {
        return;
    }


    try {

        await addDoc(
            collection(
                db,
                "folders"
            ),
            {

                name: cleanName,

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
                ),

                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                foldersQuery
            );


        // Remove existing folders
        const oldFolders =
            container.querySelectorAll(
                ".folder-item"
            );


        oldFolders.forEach(
            item => item.remove()
        );


        // Add folders

        snapshot.forEach(
            docSnapshot => {

                const folder =
                    docSnapshot.data();


                const folderElement =
                    document.createElement(
                        "div"
                    );


                folderElement.className =
                    "folder-item";


                folderElement.dataset.id =
                    docSnapshot.id;


                folderElement.innerHTML = `

                    <div class="folder-icon">
                        📁
                    </div>

                    <div class="folder-name">
                        ${escapeHtml(
                            folder.name
                        )}
                    </div>

                `;


                folderElement.addEventListener(
                    "dblclick",
                    async () => {

                        currentFolderId =
                            docSnapshot.id;

                        currentFolderName =
                            folder.name;


                        await loadFolders();

                        await loadFiles();

                        updateBreadcrumb();

                    }
                );


                container.appendChild(
                    folderElement
                );

            }
        );


    } catch (error) {

        console.error(
            "Load folders error:",
            error
        );


        // If Firestore needs an index,
        // show a useful message.

        if (
            error.message &&
            error.message.includes(
                "index"
            )
        ) {

            console.error(
                "Firestore index required:",
                error
            );

        } else {

            alert(
                "حدث خطأ أثناء تحميل المجلدات:\n\n" +
                error.message
            );

        }

    }
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
                ),

                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                filesQuery
            );


        // Remove existing files

        const oldFiles =
            container.querySelectorAll(
                ".file-item"
            );


        oldFiles.forEach(
            item => item.remove()
        );


        // Add files

        snapshot.forEach(
            docSnapshot => {

                const file =
                    docSnapshot.data();


                const fileElement =
                    document.createElement(
                        "div"
                    );


                fileElement.className =
                    "file-item";


                fileElement.dataset.id =
                    docSnapshot.id;


                fileElement.innerHTML = `

                    <div class="file-icon">
                        ${getFileIcon(
                            file.mimeType,
                            file.name
                        )}
                    </div>

                    <div class="file-name">
                        ${escapeHtml(
                            file.name
                        )}
                    </div>

                    <div class="file-size">
                        ${formatFileSize(
                            file.size
                        )}
                    </div>

                `;


                container.appendChild(
                    fileElement
                );

            }
        );


    } catch (error) {

        console.error(
            "Load files error:",
            error
        );


        if (
            error.message &&
            error.message.includes(
                "index"
            )
        ) {

            console.error(
                "Firestore index required:",
                error
            );

        } else {

            alert(
                "حدث خطأ أثناء تحميل الملفات:\n\n" +
                error.message
            );

        }

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


    // Current Vercel limit

    const MAX_SIZE =
        4 * 1024 * 1024;


    if (file.size > MAX_SIZE) {

        alert(
            "الملف كبير جدًا.\n\n" +
            "الحد الحالي هو 4 MB تقريبًا."
        );

        return;
    }


    try {

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
        // Save Metadata To Firestore
        // ====================================

        const fileData = {

            name:
                result.file.name,

            size:
                result.file.size,

            mimeType:
                result.file.mimeType,

            folderId:
                currentFolderId || null,

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

    }
}


// ============================================
// Search Files
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


        container.innerHTML = "";


        let found =
            false;


        snapshot.forEach(
            docSnapshot => {

                const file =
                    docSnapshot.data();


                const name =
                    (
                        file.name || ""
                    ).toLowerCase();


                if (
                    name.includes(
                        searchText
                    )
                ) {

                    found = true;


                    const fileElement =
                        document.createElement(
                            "div"
                        );


                    fileElement.className =
                        "file-item";


                    fileElement.dataset.id =
                        docSnapshot.id;


                    fileElement.innerHTML = `

                        <div class="file-icon">
                            ${getFileIcon(
                                file.mimeType,
                                file.name
                            )}
                        </div>

                        <div class="file-name">
                            ${escapeHtml(
                                file.name
                            )}
                        </div>

                        <div class="file-size">
                            ${formatFileSize(
                                file.size
                            )}
                        </div>

                    `;


                    container.appendChild(
                        fileElement
                    );

                }

            }
        );


        if (!found) {

            container.innerHTML = `

                <div class="empty-message">
                    لا توجد ملفات مطابقة للبحث.
                </div>

            `;

        }


    } catch (error) {

        console.error(
            "Search error:",
            error
        );


        alert(
            "حدث خطأ أثناء البحث:\n\n" +
            error.message
        );

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

        breadcrumb.innerHTML =
            "الرئيسية";

        return;
    }


    breadcrumb.innerHTML = `

        <button id="breadcrumbHome">
            الرئيسية
        </button>

        <span>
            /
        </span>

        <span>
            ${escapeHtml(
                currentFolderName
            )}
        </span>

    `;


    const breadcrumbHome =
        document.getElementById(
            "breadcrumbHome"
        );


    if (breadcrumbHome) {

        breadcrumbHome.addEventListener(
            "click",
            async () => {

                currentFolderId =
                    null;

                currentFolderName =
                    "الرئيسية";


                await loadFolders();

                await loadFiles();

                updateBreadcrumb();

            }
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

    if (!mimeType) {

        return "📄";

    }


    if (
        mimeType.startsWith(
            "image/"
        )
    ) {

        return "🖼️";

    }


    if (
        mimeType.startsWith(
            "video/"
        )
    ) {

        return "🎬";

    }


    if (
        mimeType.startsWith(
            "audio/"
        )
    ) {

        return "🎵";

    }


    if (
        mimeType.includes(
            "pdf"
        )
    ) {

        return "📕";

    }


    if (
        mimeType.includes(
            "zip"
        ) ||
        mimeType.includes(
            "compressed"
        )
    ) {

        return "🗜️";

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

        return "📝";

    }


    if (
        extension === "xls" ||
        extension === "xlsx"
    ) {

        return "📊";

    }


    if (
        extension === "ppt" ||
        extension === "pptx"
    ) {

        return "📽️";

    }


    return "📄";
}


// ============================================
// Format File Size
// ============================================

function formatFileSize(
    bytes
) {

    if (!bytes || bytes <= 0) {
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
            index === 0 ? 0 : 2
        ) +
        " " +
        units[index]
    );
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
    async (user) => {

        if (user) {

            // User logged in

            currentUser =
                user;


            console.log(
                "User authenticated"
            );


            console.log(
                "Name:",
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


            currentFolderId =
                null;


            currentFolderName =
                "الرئيسية";


            showMainApp();

        } else {

            // User logged out

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
