import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendEmailVerification,
    reload
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    auth
} from "./firebase.js";


// ========================================
// LOGIN
// ========================================

export async function login(email, password) {

    return await signInWithEmailAndPassword(
        auth,
        email,
        password
    );
}


// ========================================
// SIGN UP
// ========================================

export async function signup(email, password) {

    const credential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

    try {

        await sendEmailVerification(
            credential.user
        );

        return credential;

    } catch (error) {

        /*
         * If Firebase couldn't send the
         * verification email, remove the
         * newly-created account.
         */

        try {
            await credential.user.delete();
        } catch {
            // Ignore cleanup error.
        }

        throw error;
    }
}


// ========================================
// RESEND VERIFICATION EMAIL
// ========================================

export async function resendVerificationEmail() {

    const user = auth.currentUser;

    if (!user) {
        throw new Error(
            "You are not logged in."
        );
    }

    if (user.emailVerified) {
        return;
    }

    await sendEmailVerification(user);
}


// ========================================
// CHECK VERIFICATION
// ========================================

export async function checkEmailVerified() {

    const user = auth.currentUser;

    if (!user) {
        return false;
    }

    /*
     * Get the newest user information
     * from Firebase Authentication.
     */

    await reload(user);

    /*
     * Refresh the ID token so Firebase
     * Security Rules receive the new
     * email_verified claim.
     */

    await user.getIdToken(true);

    return auth.currentUser.emailVerified;
}


// ========================================
// LOG OUT
// ========================================

export async function logout() {
    await signOut(auth);
}


// ========================================
// AUTH STATE
// ========================================

export function listenForAuth(callback) {

    return onAuthStateChanged(
        auth,
        callback
    );
}


// ========================================
// ERROR MESSAGES
// ========================================

export function getAuthError(error) {

    switch (error.code) {

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/email-already-in-use":
            return "That email is already registered.";

        case "auth/invalid-email":
            return "That email address is invalid.";

        case "auth/weak-password":
            return "Password is too weak.";

        case "auth/user-not-found":
            return "Account not found.";

        case "auth/wrong-password":
            return "Incorrect email or password.";

        case "auth/too-many-requests":
            return "Too many attempts. Please wait and try again.";

        case "auth/network-request-failed":
            return "Network error. Check your internet connection.";

        default:
            return (
                error.message ||
                "Something went wrong."
            );
    }
}
