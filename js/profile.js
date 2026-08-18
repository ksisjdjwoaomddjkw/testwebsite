import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js";

import {
    ref as databaseRef,
    update
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

import {
    auth,
    database,
    storage
} from "./firebase.js";


const MAX_FILE_SIZE =
    2 * 1024 * 1024; // 2 MB


const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


// ========================================
// UPLOAD PROFILE PICTURE
// ========================================

export async function uploadProfilePicture(
    file
) {

    const user =
        auth.currentUser;


    if (!user) {

        throw new Error(
            "You must be logged in."
        );
    }


    if (!user.emailVerified) {

        throw new Error(
            "You must verify your email first."
        );
    }


    if (!file) {

        throw new Error(
            "Choose an image first."
        );
    }


    /*
     * Client-side checks.
     *
     * These are for user experience.
     * Storage Rules enforce the real limits.
     */

    if (
        !ALLOWED_TYPES.includes(
            file.type
        )
    ) {

        throw new Error(
            "Profile pictures must be PNG, JPEG, or WebP."
        );
    }


    if (
        file.size > MAX_FILE_SIZE
    ) {

        throw new Error(
            "Profile pictures must be 2 MB or smaller."
        );
    }


    /*
     * Every user gets one fixed file.
     *
     * Uploading again replaces it.
     */

    const fileRef =
        ref(
            storage,
            `profilePictures/${user.uid}`
        );


    await uploadBytes(
        fileRef,
        file,
        {
            contentType:
                file.type,

            cacheControl:
                "public,max-age=3600"
        }
    );


    /*
     * Get the public download URL.
     */

    const photoURL =
        await getDownloadURL(
            fileRef
        );


    /*
     * Store only the URL in
     * Realtime Database.
     */

    await update(
        databaseRef(
            database,
            `users/${user.uid}`
        ),
        {
            photoURL:
                photoURL
        }
    );


    return photoURL;
}


// ========================================
// DELETE PROFILE PICTURE
// ========================================

export async function deleteProfilePicture() {

    const user =
        auth.currentUser;


    if (!user) {

        throw new Error(
            "You must be logged in."
        );
    }


    if (!user.emailVerified) {

        throw new Error(
            "You must verify your email first."
        );
    }


    const fileRef =
        ref(
            storage,
            `profilePictures/${user.uid}`
        );


    try {

        await deleteObject(
            fileRef
        );

    } catch (error) {

        /*
         * If the file doesn't exist,
         * there's nothing to delete.
         */

        if (
            error.code !==
            "storage/object-not-found"
        ) {

            throw error;
        }
    }


    /*
     * Remove URL from profile.
     */

    await update(
        databaseRef(
            database,
            `users/${user.uid}`
        ),
        {
            photoURL:
                null
        }
    );
}
