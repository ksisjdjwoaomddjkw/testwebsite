import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    set,
    push,
    onValue,
    update,
    remove,
    serverTimestamp,
    runTransaction
} from
    "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";


/*
    PASTE YOUR FIREBASE CONFIG HERE
*/

const firebaseConfig = {

    apiKey: "AIzaSyB1P2P-3dR6DDKyEbglxQ4ElGd5au006n4",

    authDomain: "test-1619e.firebaseapp.com",

    databaseURL:
        "https://test-1619e-default-rtdb.firebaseio.com",

    projectId: "test-1619e",

    storageBucket: "test-1619e.firebasestorage.app",

    messagingSenderId: "374500672512",

    appId: "1:374500672512:web:6c5529a84b56ce017204e5",
};


/*
    Initialize Firebase
*/

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const database = getDatabase(app);


/*
    HTML elements
*/

const authSection =
    document.getElementById("auth-section");

const socialSection =
    document.getElementById("social-section");

const authTitle =
    document.getElementById("auth-title");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const usernameInput =
    document.getElementById("username");

const authButton =
    document.getElementById("auth-button");

const switchAuth =
    document.getElementById("switch-auth");

const authError =
    document.getElementById("auth-error");

const logoutButton =
    document.getElementById("logout-button");

const currentUser =
    document.getElementById("current-user");

const postText =
    document.getElementById("post-text");

const postButton =
    document.getElementById("post-button");

const postError =
    document.getElementById("post-error");

const characterCount =
    document.getElementById("character-count");

const feed =
    document.getElementById("feed");

const postTemplate =
    document.getElementById("post-template");


/*
    Authentication mode

    true = login
    false = signup
*/

let loginMode = true;


/*
    Switch login/signup
*/

switchAuth.addEventListener("click", () => {

    loginMode = !loginMode;

    authError.textContent = "";

    if (loginMode) {

        authTitle.textContent = "Log in";

        authButton.textContent = "Log in";

        switchAuth.textContent =
            "Create an account";

        usernameInput.classList.add("hidden");

    } else {

        authTitle.textContent =
            "Create an account";

        authButton.textContent =
            "Sign up";

        switchAuth.textContent =
            "Already have an account? Log in";

        usernameInput.classList.remove("hidden");
    }

});


/*
    Login / signup
*/

authButton.addEventListener("click", async () => {

    authError.textContent = "";

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;

    if (!email || !password) {

        authError.textContent =
            "Enter your email and password.";

        return;
    }

    try {

        if (loginMode) {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

} else {

    const username =
        usernameInput.value.trim();

    if (!username) {
        authError.textContent =
            "Choose a username.";
        return;
    }

    if (username.length < 3 || username.length > 20) {
        authError.textContent =
            "Username must be 3-20 characters.";
        return;
    }

    if (!/^[A-Za-z0-9_]+$/.test(username)) {
        authError.textContent =
            "Username can only contain letters, numbers, and underscores.";
        return;
    }

    /*
        Normalize the username so usernames are
        case-insensitive.
    */

    const usernameKey =
        username.toLowerCase();

    /*
        Create Firebase Authentication account.
    */

    const credential =
        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

    const uid =
        credential.user.uid;

    /*
        Atomically claim the username.

        If someone else already owns it,
        the transaction returns committed=false.
    */

    const usernameRef =
        ref(database, `usernames/${usernameKey}`);

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

    /*
        Username was already taken.
    */

    if (!result.committed) {

        await credential.user.delete();

        authError.textContent =
            "That username is already taken.";

        return;
    }

    /*
        Create the user's profile.
    */

    try {

        await set(
            ref(database, `users/${uid}`),
            {
                username: username,
                createdAt: serverTimestamp()
            }
        );

    } catch (error) {

        /*
            If profile creation failed,
            release the username reservation.
        */

        await remove(usernameRef);

        await credential.user.delete();

        throw error;
    }
}

        emailInput.value = "";
        passwordInput.value = "";
        usernameInput.value = "";

    } catch (error) {

        console.error(error);

        authError.textContent =
            getAuthError(error.code);
    }

});


/*
    Logout
*/

logoutButton.addEventListener("click", async () => {

    await signOut(auth);

});


/*
    Authentication state
*/

onAuthStateChanged(auth, async (user) => {

    if (user) {

        authSection.classList.add("hidden");

        socialSection.classList.remove("hidden");

        logoutButton.classList.remove("hidden");

        const userRef =
            ref(database, `users/${user.uid}`);

        onValue(userRef, (snapshot) => {

            const data = snapshot.val();

            if (data && data.username) {

                currentUser.textContent =
                    "@" + data.username;

            } else {

                currentUser.textContent =
                    user.email;
            }

        });

        loadFeed();

    } else {

        authSection.classList.remove("hidden");

        socialSection.classList.add("hidden");

        logoutButton.classList.add("hidden");

        currentUser.textContent = "";

        feed.innerHTML = "";
    }

});


/*
    Character counter
*/

postText.addEventListener("input", () => {

    characterCount.textContent =
        `${postText.value.length} / 280`;

});


/*
    Create post
*/

postButton.addEventListener("click", async () => {

    postError.textContent = "";

    const user = auth.currentUser;

    if (!user) {
        return;
    }

    const text =
        postText.value.trim();

    if (!text) {

        postError.textContent =
            "Write something first.";

        return;
    }

    if (text.length > 280) {

        postError.textContent =
            "Your post is too long.";

        return;
    }

    try {

        const postRef =
            push(ref(database, "posts"));

        await set(postRef, {

            authorUid: user.uid,

            text: text,

            timestamp: serverTimestamp()

        });

        postText.value = "";

        characterCount.textContent =
            "0 / 280";

    } catch (error) {

        console.error(error);

        postError.textContent =
            "Could not create the post.";
    }

});


/*
    Load live feed
*/

function loadFeed() {

    const postsRef =
        ref(database, "posts");

    onValue(postsRef, async (snapshot) => {

        feed.innerHTML = "";

        const posts = [];

        snapshot.forEach((child) => {

            posts.push({

                id: child.key,

                ...child.val()

            });

        });

        posts.sort((a, b) =>
            (b.timestamp || 0) -
            (a.timestamp || 0)
        );

        /*
            Only display the latest 50 posts.
        */

        const latestPosts =
            posts.slice(0, 50);

        for (const post of latestPosts) {

            await displayPost(post);
        }

    });

}


/*
    Display a post
*/

async function displayPost(post) {

    const clone =
        postTemplate.content.cloneNode(true);

    const article =
        clone.querySelector(".post");

    const username =
        clone.querySelector(".post-username");

    const time =
        clone.querySelector(".post-time");

    const content =
        clone.querySelector(".post-content");

    const likeButton =
        clone.querySelector(".like-button");

    const likeCount =
        clone.querySelector(".like-count");


    /*
        Get author
    */

    const userSnapshot =
        await new Promise((resolve) => {

            onValue(
                ref(database, `users/${post.authorUid}`),
                resolve,
                { onlyOnce: true }
            );

        });

    const userData =
        userSnapshot.val();

    username.textContent =
        userData?.username
        ? "@" + userData.username
        : "Unknown user";


    /*
        Post content
    */

    content.textContent =
        post.text;


    /*
        Timestamp
    */

    if (post.timestamp) {

        time.textContent =
            formatTime(post.timestamp);

    }


    /*
        Likes
    */

    const likesRef =
        ref(database, `likes/${post.id}`);

    onValue(likesRef, (snapshot) => {

        const likes =
            snapshot.val() || {};

        const count =
            Object.keys(likes).length;

        likeCount.textContent =
            count;

        const user =
            auth.currentUser;

        if (
            user &&
            likes[user.uid]
        ) {

            likeButton.classList.add("liked");

            likeButton.firstChild.textContent =
                "♥ ";

        } else {

            likeButton.classList.remove("liked");

            likeButton.firstChild.textContent =
                "♡ ";
        }

    });


    /*
        Like button
    */

    likeButton.addEventListener("click", async () => {

        const user =
            auth.currentUser;

        if (!user) {
            return;
        }

        const likeRef =
            ref(
                database,
                `likes/${post.id}/${user.uid}`
            );

        const snapshot =
            await new Promise((resolve) => {

                onValue(
                    likeRef,
                    resolve,
                    { onlyOnce: true }
                );

            });

        if (snapshot.exists()) {

            await remove(likeRef);

        } else {

            await set(likeRef, true);

        }

    });


    feed.appendChild(article);

}


/*
    Format timestamps
*/

function formatTime(timestamp) {

    const date =
        new Date(timestamp);

    return date.toLocaleString();

}


/*
    Firebase authentication errors
*/

function getAuthError(code) {

    switch (code) {

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
            return "Something went wrong. Try again.";
    }

}
