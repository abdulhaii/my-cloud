import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


// =====================================================
// Firebase Configuration
// =====================================================

const firebaseConfig = {
    apiKey: "AIzaSyDdQSIn79XHyD1rZy4sEatETdnbBlJBCKc",
    authDomain: "tele-arrangement.firebaseapp.com",
    projectId: "tele-arrangement",
    storageBucket: "tele-arrangement.firebasestorage.app",
    messagingSenderId: "939924244118",
    appId: "1:939924244118:web:dcc613a89bb158348f24b7"
};


// =====================================================
// Initialize Firebase
// =====================================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);

const googleProvider =
    new GoogleAuthProvider();


// =====================================================
// DOM Elements
// =====================================================

const folderGrid =
    document.getElementById("folderGrid");

const fileGrid =
    document.getElementById("fileGrid");

const newButton =
    document.getElementById("newButton");

const newModal =
    document.getElementById("newModal");

const closeModal =
    document.getElementById("closeModal");

const createFolderButton =
    document.getElementById("createFolderButton");

const uploadButton =
    document.getElementById("uploadButton");

const fileInput =
    document.getElementById("fileInput");

const searchInput =
    document.getElementById("searchInput");


// =====================================================
// Application State
// =====================================================

let currentFolderId = null;

let currentUser = null;


// =====================================================
// Login UI
// =====================================================

function createLoginScreen() {

    document.body.innerHTML = `

        <div style="
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#f8f9fa;
            font-family:Arial,sans-serif;
        ">

            <div style="
                width:360px;
                max-width:90%;
                background:white;
                padding:35px;
                border-radius:18px;
                box-shadow:0 5px 30px rgba(0,0,0,.12);
                text-align:center;
            ">

                <div style="
                    font-size:55px;
                    margin-bottom:15px;
                ">
                    ☁️
                </div>

                <h1>
                    My Cloud
                </h1>

                <p style="
                    color:#666;
                    margin-bottom:25px;
                ">
                    سجّل الدخول للوصول إلى ملفاتك
                </p>

                <button
                    id="googleLoginButton"
                    style="
                        width:100%;
                        padding:13px;
                        border:none;
                        border-radius:10px;
                        background:#4285f4;
                        color:white;
                        font-size:16px;
                        cursor:pointer;
                    "
                >
                    🔵 تسجيل الدخول بحساب Google
                </button>

                <p
                    id="loginError"
                    style="
                        color:#d93025;
                        margin-top:15px;
                    "
                ></p>

            </div>

        </div>
    `;


    const googleLoginButton =
        document.getElementById(
            "googleLoginButton"
        );


    const loginError =
        document.getElementById(
            "loginError"
        );


    googleLoginButton.addEventListener(
        "click",
        async () => {

            googleLoginButton.disabled =
                true;

            googleLoginButton.textContent =
                "جاري تسجيل الدخول...";


            loginError.textContent =
                "";


            try {

                await signInWithPopup(
                    auth,
                    googleProvider
                );

            } catch (error) {

                console.error(
                    "Google login error:",
                    error
                );


                loginError.textContent =
                    "فشل تسجيل الدخول: " +
                    error.message;


                googleLoginButton.disabled =
                    false;


                googleLoginButton.textContent =
                    "🔵 تسجيل الدخول بحساب Google";

            }

        }
    );

}


// =====================================================
// Initialize Application
// =====================================================

async function init() {

    if (!currentUser) {
        return;
    }


    try {

        await loadFolders();

        await loadFiles();

    } catch (error) {

        console.error(
            "Initialization error:",
            error
        );

        alert(
            "حدث خطأ أثناء الاتصال بـ Firebase."
        );

    }

}


// =====================================================
// Load Folders
// =====================================================

async function loadFolders() {

    folderGrid.innerHTML = "";

    try {

        const foldersRef =
            collection(
                db,
                "folders"
            );


        let foldersQuery;


        if (currentFolderId === null) {

            foldersQuery =
                query(
                    foldersRef,
                    where(
                        "parentId",
                        "==",
                        null
                    )
                );

        } else {

            foldersQuery =
                query(
                    foldersRef,
                    where(
                        "parentId",
                        "==",
                        currentFolderId
                    )
                );

        }


        const snapshot =
            await getDocs(
                foldersQuery
            );


        if (snapshot.empty) {

            folderGrid.innerHTML = `
                <div class="empty-message">
                    لا توجد مجلدات هنا
                </div>
            `;

            return;
        }


        snapshot.forEach(
            documentSnapshot => {

                const folder =
                    documentSnapshot.data();


                createFolderElement(
                    documentSnapshot.id,
                    folder.name
                );

            }
        );


    } catch (error) {

        console.error(
            "Load folders error:",
            error
        );


        folderGrid.innerHTML = `
            <div class="empty-message">
                تعذر تحميل المجلدات
            </div>
        `;

    }

}


// =====================================================
// Create Folder Element
// =====================================================

function createFolderElement(
    id,
    name
) {

    const element =
        document.createElement("div");


    element.className =
        "folder";


    element.innerHTML = `

        <div class="folder-icon">
            📁
        </div>

        <div class="folder-name">
            ${escapeHtml(name)}
        </div>

    `;


    element.addEventListener(
        "dblclick",
        async () => {

            currentFolderId =
                id;


            await loadFolders();

            await loadFiles();


            updateBreadcrumb(
                name
            );

        }
    );


    folderGrid.appendChild(
        element
    );

}


// =====================================================
// Create Folder in Firestore
// =====================================================

async function createFolder(
    name
) {

    if (!name) {
        return;
    }


    if (!currentUser) {

        alert(
            "يجب تسجيل الدخول أولاً."
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

                name: name,

                parentId:
                    currentFolderId,

                createdAt:
                    serverTimestamp(),

                ownerId:
                    currentUser.uid

            }
        );


        await loadFolders();


    } catch (error) {

        console.error(
            "Create folder error:",
            error
        );


        alert(
            "فشل إنشاء المجلد."
        );

    }

}


// =====================================================
// Load Files
// =====================================================

async function loadFiles() {

    fileGrid.innerHTML = "";


    try {

        const filesRef =
            collection(
                db,
                "files"
            );


        let filesQuery;


        if (currentFolderId === null) {

            filesQuery =
                query(
                    filesRef,
                    where(
                        "folderId",
                        "==",
                        null
                    )
                );

        } else {

            filesQuery =
                query(
                    filesRef,
                    where(
                        "folderId",
                        "==",
                        currentFolderId
                    )
                );

        }


        const snapshot =
            await getDocs(
                filesQuery
            );


        if (snapshot.empty) {

            fileGrid.innerHTML = `
                <div class="empty-message">
                    لا توجد ملفات هنا
                </div>
            `;

            return;
        }


        snapshot.forEach(
            documentSnapshot => {

                const file =
                    documentSnapshot.data();


                createFileElement(
                    documentSnapshot.id,
                    file
                );

            }
        );


    } catch (error) {

        console.error(
            "Load files error:",
            error
        );


        fileGrid.innerHTML = `
            <div class="empty-message">
                تعذر تحميل الملفات
            </div>
        `;

    }

}


// =====================================================
// Create File Element
// =====================================================

function createFileElement(
    id,
    file
) {

    const element =
        document.createElement("div");


    element.className =
        "file";


    element.innerHTML = `

        <div class="file-icon">
            ${getFileIcon(
                file.mimeType
            )}
        </div>

        <div class="file-name">
            ${escapeHtml(
                file.name
            )}
        </div>

        <div class="file-size">
            ${formatBytes(
                file.size
            )}
        </div>

    `;


    fileGrid.appendChild(
        element
    );

}


// =====================================================
// File Icon
// =====================================================

function getFileIcon(
    mimeType
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
        mimeType ===
        "application/pdf"
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

        return "📦";

    }


    if (
        mimeType.includes(
            "text"
        )
    ) {

        return "📄";

    }


    return "📄";

}


// =====================================================
// Format File Size
// =====================================================

function formatBytes(
    bytes
) {

    if (
        bytes === undefined ||
        bytes === null ||
        bytes === 0
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


    const safeIndex =
        Math.min(
            index,
            units.length - 1
        );


    return (
        bytes /
        Math.pow(
            1024,
            safeIndex
        )
    ).toFixed(
        safeIndex === 0
            ? 0
            : 1
    )
    + " "
    + units[safeIndex];

}


// =====================================================
// Escape HTML
// =====================================================

function escapeHtml(
    text
) {

    return String(text)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// =====================================================
// Breadcrumb
// =====================================================

function updateBreadcrumb(
    folderName
) {

    const breadcrumb =
        document.querySelector(
            ".breadcrumb"
        );


    if (!breadcrumb) {
        return;
    }


    breadcrumb.textContent =
        `My Cloud / ${folderName}`;

}


// =====================================================
// Open New Modal
// =====================================================

newButton.addEventListener(
    "click",
    () => {

        newModal.classList.remove(
            "hidden"
        );

    }
);


// =====================================================
// Close Modal
// =====================================================

closeModal.addEventListener(
    "click",
    () => {

        newModal.classList.add(
            "hidden"
        );

    }
);


// =====================================================
// Close Modal Outside
// =====================================================

newModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            newModal
        ) {

            newModal.classList.add(
                "hidden"
            );

        }

    }
);


// =====================================================
// Create Folder Button
// =====================================================

createFolderButton.addEventListener(
    "click",
    async () => {

        const name =
            prompt(
                "أدخل اسم المجلد:"
            );


        if (
            !name ||
            !name.trim()
        ) {

            return;

        }


        await createFolder(
            name.trim()
        );


        newModal.classList.add(
            "hidden"
        );

    }
);


// =====================================================
// Upload Button
// =====================================================

uploadButton.addEventListener(
    "click",
    () => {

        newModal.classList.add(
            "hidden"
        );


        fileInput.click();

    }
);


// =====================================================
// File Selected
// =====================================================

fileInput.addEventListener(
    "change",
    async event => {

        const selectedFile =
            event.target.files[0];


        if (!selectedFile) {
            return;
        }


        console.log(
            "Selected file:",
            selectedFile
        );


        alert(
            `تم اختيار الملف:\n\n` +
            `${selectedFile.name}\n\n` +
            `الحجم: ` +
            `${formatBytes(
                selectedFile.size
            )}`
        );


        fileInput.value = "";

    }
);


// =====================================================
// Search
// =====================================================

searchInput.addEventListener(
    "input",
    () => {

        const search =
            searchInput.value
                .toLowerCase()
                .trim();


        document
            .querySelectorAll(
                ".folder"
            )
            .forEach(
                folder => {

                    const name =
                        folder
                            .querySelector(
                                ".folder-name"
                            )
                            .textContent
                            .toLowerCase();


                    folder.style.display =
                        name.includes(
                            search
                        )
                            ? "flex"
                            : "none";

                }
            );


        document
            .querySelectorAll(
                ".file"
            )
            .forEach(
                file => {

                    const name =
                        file
                            .querySelector(
                                ".file-name"
                            )
                            .textContent
                            .toLowerCase();


                    file.style.display =
                        name.includes(
                            search
                        )
                            ? "flex"
                            : "none";

                }
            );

    }
);


// =====================================================
// Home Button
// =====================================================

const homeButton =
    document.querySelector(
        ".nav-item.active"
    );


if (homeButton) {

    homeButton.addEventListener(
        "click",
        async () => {

            currentFolderId =
                null;


            await loadFolders();

            await loadFiles();


            const breadcrumb =
                document.querySelector(
                    ".breadcrumb"
                );


            if (breadcrumb) {

                breadcrumb.textContent =
                    "My Cloud";

            }

        }
    );

}


// =====================================================
// Logout Button
// =====================================================

document.addEventListener(
    "click",
    async event => {

        if (
            event.target.id ===
            "logoutButton"
        ) {

            try {

                await signOut(auth);

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }

    }
);


// =====================================================
// Authentication State
// =====================================================

onAuthStateChanged(
    auth,
    async user => {

        if (user) {

            currentUser =
                user;


            console.log(
                "Logged in user:"
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


            await init();

        } else {

            currentUser =
                null;


            createLoginScreen();

        }

    }
);