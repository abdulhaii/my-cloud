// ============================================
// My Cloud Storage
// app.js
// ============================================


// ============================================
// Firebase
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
    where,
    updateDoc,
    deleteDoc,
    doc
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
// Initialize
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
// State
// ============================================

let currentUser = null;

let currentFolderId = null;

let currentFolderName = "الرئيسية";

let currentFolderPath = [];

let foldersCache = [];


// ============================================
// Root
// ============================================

const appContainer =
    document.getElementById("app");


// ============================================
// Icon
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

    appContainer.innerHTML = `

        <div class="login-container">

            <div class="login-box">

                <div class="login-logo">
                    ${icon(
                        "cloud",
                        "login-cloud-icon"
                    )}
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


    const button =
        document.getElementById(
            "googleLoginButton"
        );


    button.addEventListener(
        "click",
        loginWithGoogle
    );
}


// ============================================
// Login
// ============================================

async function loginWithGoogle() {

    const button =
        document.getElementById(
            "googleLoginButton"
        );


    try {

        button.disabled = true;

        button.innerHTML = `

            ${icon(
                "progress_activity",
                "loading-icon"
            )}

            <span>
                جاري تسجيل الدخول...
            </span>
        `;


        await signInWithPopup(
            auth,
            googleProvider
        );


    } catch (error) {

        console.error(
            "Login error:",
            error
        );


        button.disabled = false;

        button.innerHTML = `

            ${icon("account_circle")}

            <span>
                تسجيل الدخول باستخدام Google
            </span>
        `;


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

    const displayName =
        currentUser?.displayName ||
        "المستخدم";


    const email =
        currentUser?.email ||
        "";


    appContainer.innerHTML = `

        <div class="cloud-app">

            <!-- Header -->

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


            <!-- Toolbar -->

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


            <!-- Breadcrumb -->

            <div
                id="breadcrumb"
                class="breadcrumb"
            ></div>


            <!-- Content -->

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


        <!-- File Menu -->

        <div
            id="fileMenu"
            class="file-menu"
        ></div>


        <!-- Move Modal -->

        <div
            id="moveModal"
            class="modal-overlay"
        >

            <div class="modal-box">

                <div class="modal-header">

                    <h3>
                        نقل الملف
                    </h3>

                    <button
                        id="closeMoveModal"
                        class="modal-close"
                    >
                        ${icon("close")}
                    </button>

                </div>


                <div class="modal-body">

                    <p class="modal-description">
                        اختر المجلد الذي تريد نقل الملف إليه:
                    </p>

                    <select
                        id="moveFolderSelect"
                        class="folder-select"
                    ></select>

                </div>


                <div class="modal-actions">

                    <button
                        id="cancelMoveButton"
                        class="modal-button secondary"
                    >
                        إلغاء
                    </button>

                    <button
                        id="confirmMoveButton"
                        class="modal-button primary"
                    >
                        ${icon("drive_file_move")}
                        نقل
                    </button>

                </div>

            </div>

        </div>
    `;


    // ========================================
    // Events
    // ========================================

    document
        .getElementById("logoutButton")
        .addEventListener(
            "click",
            logout
        );


    document
        .getElementById("homeButton")
        .addEventListener(
            "click",
            goHome
        );


    document
        .getElementById("createFolderButton")
        .addEventListener(
            "click",
            createFolder
        );


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


    searchInput.addEventListener(
        "input",
        async () => {

            const text =
                searchInput.value
                    .trim()
                    .toLowerCase();


            clearSearchButton.style.display =
                text
                    ? "flex"
                    : "none";


            if (!text) {

                await refreshCurrentFolder();

                return;
            }


            await searchFiles(
                text
            );
        }
    );


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


    // ========================================
    // Modal Events
    // ========================================

    document
        .getElementById("closeMoveModal")
        .addEventListener(
            "click",
            closeMoveModal
        );


    document
        .getElementById("cancelMoveButton")
        .addEventListener(
            "click",
            closeMoveModal
        );


    document
        .getElementById("confirmMoveButton")
        .addEventListener(
            "click",
            confirmMoveFile
        );


    // Close menu when clicking elsewhere

    document.addEventListener(
        "click",
        handleDocumentClick
    );


    updateBreadcrumb();

    refreshCurrentFolder();
}


// ============================================
// Document Click
// ============================================

function handleDocumentClick(
    event
) {

    const menu =
        document.getElementById(
            "fileMenu"
        );


    if (!menu) {
        return;
    }


    if (
        !event.target.closest(
            ".file-menu"
        ) &&
        !event.target.closest(
            ".file-menu-button"
        )
    ) {

        menu.classList.remove(
            "visible"
        );
    }
}


// ============================================
// Go Home
// ============================================

async function goHome() {

    currentFolderId = null;

    currentFolderName =
        "الرئيسية";

    currentFolderPath = [];


    clearSearch();


    updateBreadcrumb();

    await refreshCurrentFolder();
}


// ============================================
// Clear Search
// ============================================

function clearSearch() {

    const input =
        document.getElementById(
            "searchInput"
        );


    const clear =
        document.getElementById(
            "clearSearchButton"
        );


    if (input) {
        input.value = "";
    }


    if (clear) {
        clear.style.display = "none";
    }
}


// ============================================
// Refresh
// ============================================

async function refreshCurrentFolder() {

    await loadAllFolders();

    await loadCurrentFolderItems();

    updateBreadcrumb();
}


// ============================================
// Load All Folders
// ============================================

async function loadAllFolders() {

    if (!currentUser) {
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
                )
            );


        const snapshot =
            await getDocs(
                foldersQuery
            );


        foldersCache = [];


        snapshot.forEach(
            folderDoc => {

                foldersCache.push({

                    id:
                        folderDoc.id,

                    ...folderDoc.data()

                });

            }
        );


    } catch (error) {

        console.error(
            "Load folders error:",
            error
        );
    }
}


// ============================================
// Load Current Folder Items
// ============================================

async function loadCurrentFolderItems() {

    const container =
        document.getElementById(
            "fileContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="loading-container">

            ${icon(
                "progress_activity",
                "loading-icon"
            )}

            <span>
                جاري تحميل الملفات...
            </span>

        </div>
    `;


    try {

        const parentId =
            currentFolderId || null;


        // ====================================
        // Folders
        // ====================================

        const folders =
            foldersCache
                .filter(
                    folder =>
                        (folder.parentId || null) ===
                        parentId
                )
                .sort(
                    sortByDate
                );


        // ====================================
        // Files
        // ====================================

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
                    parentId
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
            fileDoc => {

                files.push({

                    id:
                        fileDoc.id,

                    ...fileDoc.data()

                });

            }
        );


        files.sort(
            sortByDate
        );


        container.innerHTML = "";


        // ====================================
        // Render folders
        // ====================================

        folders.forEach(
            folder => {

                container.appendChild(
                    createFolderElement(
                        folder
                    )
                );

            }
        );


        // ====================================
        // Render files
        // ====================================

        files.forEach(
            file => {

                container.appendChild(
                    createFileElement(
                        file
                    )
                );

            }
        );


        // ====================================
        // Empty
        // ====================================

        if (
            folders.length === 0 &&
            files.length === 0
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


    } catch (error) {

        console.error(
            "Load items error:",
            error
        );


        showError(
            "حدث خطأ أثناء تحميل الملفات",
            error
        );
    }
}


// ============================================
// Sort
// ============================================

function sortByDate(
    a,
    b
) {

    return (
        getTimestamp(
            b.createdAt
        ) -
        getTimestamp(
            a.createdAt
        )
    );
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


    const name =
        prompt(
            "اكتب اسم المجلد:"
        );


    if (name === null) {
        return;
    }


    const cleanName =
        name.trim();


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
                    currentFolderId ||
                    null,

                ownerId:
                    currentUser.uid,

                createdAt:
                    new Date()

            }
        );


        await refreshCurrentFolder();


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
// Folder Element
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


    element.addEventListener(
        "dblclick",
        async () => {

            currentFolderId =
                folder.id;

            currentFolderName =
                folder.name;


            currentFolderPath =
                buildFolderPath(
                    folder.id
                );


            clearSearch();

            updateBreadcrumb();

            await refreshCurrentFolder();
        }
    );


    return element;
}


// ============================================
// Build Folder Path
// ============================================

function buildFolderPath(
    folderId
) {

    const path = [];

    let current =
        foldersCache.find(
            folder =>
                folder.id === folderId
        );


    while (current) {

        path.unshift(
            current
        );


        current =
            foldersCache.find(
                folder =>
                    folder.id ===
                    (current.parentId || null)
            );
    }


    return path;
}


// ============================================
// File Element
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


        <div class="item-bottom">

            <div class="item-type">

                ${formatFileSize(
                    file.size
                )}

            </div>


            <button
                class="file-menu-button"
                title="خيارات الملف"
            >

                ${icon("more_vert")}

            </button>

        </div>

    `;


    const menuButton =
        element.querySelector(
            ".file-menu-button"
        );


    menuButton.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            showFileMenu(
                file,
                menuButton
            );
        }
    );


    // Single click opens menu

    element.addEventListener(
        "click",
        event => {

            if (
                event.target.closest(
                    ".file-menu-button"
                )
            ) {
                return;
            }


            showFileMenu(
                file,
                element
            );
        }
    );


    return element;
}


// ============================================
// File Menu
// ============================================

function showFileMenu(
    file,
    anchor
) {

    const menu =
        document.getElementById(
            "fileMenu"
        );


    if (!menu) {
        return;
    }


    menu.innerHTML = `

        <button
            data-action="open"
        >
            ${icon("open_in_new")}
            <span>فتح الملف</span>
        </button>


        <button
            data-action="download"
        >
            ${icon("download")}
            <span>تنزيل</span>
        </button>


        <div class="menu-divider"></div>


        <button
            data-action="rename"
        >
            ${icon("edit")}
            <span>إعادة تسمية</span>
        </button>


        <button
            data-action="move"
        >
            ${icon("drive_file_move")}
            <span>نقل إلى مجلد</span>
        </button>


        <div class="menu-divider"></div>


        <button
            data-action="delete"
            class="danger"
        >
            ${icon("delete")}
            <span>حذف</span>
        </button>
    `;


    const rect =
        anchor.getBoundingClientRect();


    menu.style.top =
        `${rect.bottom + 6}px`;


    menu.style.left =
        `${Math.min(
            rect.left,
            window.innerWidth - 220
        )}px`;


    menu.classList.add(
        "visible"
    );


    menu.querySelectorAll(
        "button"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                async event => {

                    event.stopPropagation();

                    const action =
                        button.dataset.action;


                    menu.classList.remove(
                        "visible"
                    );


                    if (
                        action ===
                        "open"
                    ) {

                        openFile(
                            file
                        );

                    }


                    if (
                        action ===
                        "download"
                    ) {

                        downloadFile(
                            file
                        );

                    }


                    if (
                        action ===
                        "rename"
                    ) {

                        await renameFile(
                            file
                        );

                    }


                    if (
                        action ===
                        "move"
                    ) {

                        await openMoveModal(
                            file
                        );

                    }


                    if (
                        action ===
                        "delete"
                    ) {

                        await deleteFile(
                            file
                        );

                    }
                }
            );
        }
    );
}


// ============================================
// Open File
// ============================================

function openFile(
    file
) {

    if (!file.telegramFileId) {

        alert(
            "لا يوجد ملف Telegram مرتبط بهذا الملف."
        );

        return;
    }


    const url =
        `/api/telegram?fileId=${encodeURIComponent(
            file.telegramFileId
        )}`;


    window.open(
        url,
        "_blank"
    );
}


// ============================================
// Download
// ============================================

function downloadFile(
    file
) {

    if (!file.telegramFileId) {

        alert(
            "لا يوجد ملف Telegram مرتبط بهذا الملف."
        );

        return;
    }


    const url =
        `/api/telegram?fileId=${encodeURIComponent(
            file.telegramFileId
        )}&download=1&name=${encodeURIComponent(
            file.name
        )}`;


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        file.name;

    link.target =
        "_blank";

    document.body.appendChild(
        link
    );


    link.click();


    link.remove();
}


// ============================================
// Rename
// ============================================

async function renameFile(
    file
) {

    const newName =
        prompt(
            "اكتب الاسم الجديد:",
            file.name
        );


    if (newName === null) {
        return;
    }


    const cleanName =
        newName.trim();


    if (!cleanName) {

        alert(
            "اسم الملف لا يمكن أن يكون فارغًا."
        );

        return;
    }


    if (
        cleanName ===
        file.name
    ) {

        return;
    }


    try {

        await updateDoc(
            doc(
                db,
                "files",
                file.id
            ),
            {

                name:
                    cleanName

            }
        );


        await refreshCurrentFolder();


    } catch (error) {

        console.error(
            "Rename error:",
            error
        );


        alert(
            "حدث خطأ أثناء إعادة التسمية:\n\n" +
            error.message
        );
    }
}


// ============================================
// Open Move Modal
// ============================================

async function openMoveModal(
    file
) {

    await loadAllFolders();


    const modal =
        document.getElementById(
            "moveModal"
        );


    const select =
        document.getElementById(
            "moveFolderSelect"
        );


    if (!modal || !select) {
        return;
    }


    select.innerHTML = "";


    // Root option

    const rootOption =
        document.createElement(
            "option"
        );


    rootOption.value = "";

    rootOption.textContent =
        "الرئيسية";


    select.appendChild(
        rootOption
    );


    // Folders

    foldersCache
        .sort(
            (a, b) =>
                String(a.name)
                    .localeCompare(
                        String(b.name),
                        "ar"
                    )
        )
        .forEach(
            folder => {

                // Don't allow moving into current folder

                if (
                    folder.id ===
                    file.folderId
                ) {
                    return;
                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    folder.id;


                option.textContent =
                    getFolderDisplayName(
                        folder
                    );


                select.appendChild(
                    option
                );
            }
        );


    // Select current folder

    select.value =
        file.folderId || "";


    select.dataset.fileId =
        file.id;


    modal.classList.add(
        "visible"
    );
}


// ============================================
// Folder Display Name
// ============================================

function getFolderDisplayName(
    folder
) {

    const names = [];

    let current =
        folder;


    while (current) {

        names.unshift(
            current.name
        );


        current =
            foldersCache.find(
                item =>
                    item.id ===
                    (current.parentId || null)
            );
    }


    return names.join(
        " / "
    );
}


// ============================================
// Close Move Modal
// ============================================

function closeMoveModal() {

    const modal =
        document.getElementById(
            "moveModal"
        );


    if (modal) {

        modal.classList.remove(
            "visible"
        );
    }
}


// ============================================
// Confirm Move
// ============================================

async function confirmMoveFile() {

    const modal =
        document.getElementById(
            "moveModal"
        );


    const select =
        document.getElementById(
            "moveFolderSelect"
        );


    const button =
        document.getElementById(
            "confirmMoveButton"
        );


    const fileId =
        select.dataset.fileId;


    const newFolderId =
        select.value ||
        null;


    if (!fileId) {
        return;
    }


    try {

        button.disabled = true;


        button.innerHTML = `

            ${icon(
                "progress_activity",
                "loading-icon"
            )}

            <span>
                جاري النقل...
            </span>
        `;


        await updateDoc(
            doc(
                db,
                "files",
                fileId
            ),
            {

                folderId:
                    newFolderId

            }
        );


        closeMoveModal();


        await refreshCurrentFolder();


    } catch (error) {

        console.error(
            "Move error:",
            error
        );


        alert(
            "حدث خطأ أثناء نقل الملف:\n\n" +
            error.message
        );


    } finally {

        button.disabled =
            false;


        button.innerHTML = `

            ${icon("drive_file_move")}

            نقل
        `;
    }
}


// ============================================
// Delete File
// ============================================

async function deleteFile(
    file
) {

    const confirmed =
        confirm(
            `هل أنت متأكد من حذف الملف؟\n\n${file.name}\n\nسيتم حذف الملف من Telegram وقاعدة البيانات.`
        );


    if (!confirmed) {
        return;
    }


    try {

        // ====================================
        // Delete Telegram message
        // ====================================

        const response =
            await fetch(
                "/api/telegram",
                {

                    method:
                        "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            messageId:
                                file.telegramMessageId

                        })
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.ok
        ) {

            throw new Error(
                result.error ||
                "Telegram delete failed"
            );
        }


        // ====================================
        // Delete Firestore document
        // ====================================

        await deleteDoc(
            doc(
                db,
                "files",
                file.id
            )
        );


        alert(
            "تم حذف الملف بنجاح."
        );


        await refreshCurrentFolder();


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            "حدث خطأ أثناء حذف الملف:\n\n" +
            error.message
        );
    }
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
            fileDoc => {

                const file =
                    fileDoc.data();


                const name =
                    String(
                        file.name || ""
                    ).toLowerCase();


                if (
                    name.includes(
                        searchText
                    )
                ) {

                    results.push({

                        id:
                            fileDoc.id,

                        ...file

                    });
                }
            }
        );


        results.sort(
            sortByDate
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

                container.appendChild(
                    createFileElement(
                        file
                    )
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
// Upload
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


    const MAX_SIZE =
        4 * 1024 * 1024;


    if (
        file.size >
        MAX_SIZE
    ) {

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

                    method:
                        "POST",

                    body:
                        formData

                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.ok
        ) {

            throw new Error(
                result.error ||
                "Upload failed"
            );
        }


        await addDoc(
            collection(
                db,
                "files"
            ),
            {

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

            }
        );


        alert(
            "تم رفع الملف بنجاح ✅"
        );


        await refreshCurrentFolder();


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


    const parts = [];


    parts.push(`

        <button
            id="breadcrumbHome"
            class="breadcrumb-button"
        >

            ${icon("home")}

            <span>
                الرئيسية
            </span>

        </button>
    `);


    currentFolderPath.forEach(
        (folder, index) => {

            parts.push(`

                <span class="breadcrumb-separator">

                    ${icon("chevron_left")}

                </span>
            `);


            if (
                index ===
                currentFolderPath.length - 1
            ) {

                parts.push(`

                    <div class="breadcrumb-current">

                        ${icon("folder")}

                        <span>
                            ${escapeHtml(
                                folder.name
                            )}
                        </span>

                    </div>
                `);

            } else {

                parts.push(`

                    <button
                        class="breadcrumb-folder-button"
                        data-folder-id="${folder.id}"
                    >

                        ${icon("folder")}

                        <span>
                            ${escapeHtml(
                                folder.name
                            )}
                        </span>

                    </button>
                `);
            }
        }
    );


    breadcrumb.innerHTML =
        parts.join("");


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


    breadcrumb
        .querySelectorAll(
            ".breadcrumb-folder-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const folder =
                            foldersCache.find(
                                item =>
                                    item.id ===
                                    button.dataset.folderId
                            );


                        if (!folder) {
                            return;
                        }


                        currentFolderId =
                            folder.id;

                        currentFolderName =
                            folder.name;

                        currentFolderPath =
                            buildFolderPath(
                                folder.id
                            );


                        clearSearch();

                        updateBreadcrumb();

                        await refreshCurrentFolder();
                    }
                );
            }
        );
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
        type.includes("zip") ||
        type.includes("compressed") ||
        type.includes("rar")
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
        [
            "js",
            "html",
            "css",
            "java",
            "cpp",
            "py",
            "c"
        ].includes(
            extension
        )
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
        Math.min(
            Math.floor(
                Math.log(bytes) /
                Math.log(1024)
            ),
            units.length - 1
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
        typeof value ===
        "number"
    ) {

        return value;
    }


    return 0;
}


// ============================================
// Error
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
// Auth State
// ============================================

onAuthStateChanged(
    auth,
    user => {

        if (user) {

            currentUser =
                user;

            currentFolderId =
                null;

            currentFolderName =
                "الرئيسية";

            currentFolderPath =
                [];

            showMainApp();

        } else {

            currentUser =
                null;

            currentFolderId =
                null;

            currentFolderName =
                "الرئيسية";

            currentFolderPath =
                [];

            showLoginScreen();
        }
    }
);
