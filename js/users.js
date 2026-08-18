import {
    ref,
    runTransaction,
    set,
    remove,
    serverTimestamp,
    onValue
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

import {
    database
} from "./firebase.js";


export function validateUsername(username) {

    if (!username) {
        return "Choose a username.";
    }

    if (username.length < 3 || username.length > 20) {
        return "Username must be 3-20 characters.";
    }

    if (!/^[A-Za-z0-9_]+$/.test(username)) {
        return "Username can only contain letters, numbers, and underscores.";
    }

    return null;
}


export async function claimUsername(username, uid) {

    const usernameKey =
        username.toLowerCase();


    const usernameRef =
        ref(
            database,
            `usernames/${usernameKey}`
        );


    const result =
        await runTransaction(
            usernameRef,
            (currentValue) => {

                if (currentValue !== null) {
                    return;
                }

                return uid;
            }
        );


    if (!result.committed) {
        return false;
    }


    try {

        await set(
            ref(database, `users/${uid}`),
            {
                username: username,
                createdAt: serverTimestamp()
            }
        );

        return true;

    } catch (error) {

        /*
         * If profile creation fails,
         * release the username.
         */

        await remove(usernameRef);

        throw error;
    }
}


export function listenToUser(uid, callback) {

    const userRef =
        ref(database, `users/${uid}`);


    return onValue(
        userRef,
        (snapshot) => {

            callback(
                snapshot.val()
            );

        }
    );
}
