import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    auth
} from "./firebase.js";

import {
    validateUsername,
    claimUsername
} from "./users.js";


export async function login(email, password) {

    return await signInWithEmailAndPassword(
        auth,
        email,
        password
    );
}


export async function signup(
    email,
    password,
    username
) {

    const usernameError =
        validateUsername(username);


    if (usernameError) {

        throw new Error(
            usernameError
        );
    }


    const credential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );


    const uid =
        credential.user.uid;


    try {

        const claimed =
            await claimUsername(
                username,
                uid
            );


        if (!claimed) {

            await credential.user.delete();

            throw new Error(
                "That username is already taken."
            );
        }


        return credential;


    } catch (error) {

        /*
         * If anything goes wrong,
         * remove the newly-created account.
         */

        try {
            await credential.user.delete();
        } catch {
            // Ignore cleanup error.
        }

        throw error;
    }
}


export async function logout() {

    await signOut(auth);

}


export function listenForAuth(callback) {

    return onAuthStateChanged(
        auth,
        callback
    );
}


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
            return "Incorrect password.";

        default:
            return error.message ||
                "Something went wrong.";
    }
}
