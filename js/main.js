import {
    listenForAuth,
    login,
    signup,
    logout,
    resendVerificationEmail,
    refreshVerificationStatus,
    getAuthError
} from "./auth.js";

import {
    listenToUser
} from "./users.js";

import {
    createPost,
    listenToPosts,
    listenToLikes,
    toggleLike
} from "./posts.js";

import {
    auth
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


// ========================================
// DOM ELEMENTS
// ========================================

const authSection =
    document.getElementById("auth-section");

const verificationSection =
    document.getElementById("verification-section");

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

const verificationEmail =
    document.getElementById("verification-email");

const checkVerificationButton =
    document.getElementById(
        "check-verification-button"
    );

const resendVerificationButton =
    document.getElementById(
        "resend-verification-button"
    );

const verificationLogoutButton =
    document.getElementById(
        "verification-logout-button"
    );

const verificationMessage =
    document.getElementById(
        "verification-message"
    );

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


// ========================================
// STATE
// ========================================

let loginMode = true;

let unsubscribePosts = null;


// Keep track of the currently authenticated
// user for the like buttons.

let currentAuthUser = null;


// ========================================
// LOGIN / SIGNUP MODE
// ========================================

switchAuth.addEventListener(
    "click",
    () => {

        loginMode =
            !loginMode;

        authError.textContent =
            "";

        if (loginMode) {

            authTitle.textContent =
                "Log in";

            authButton.textContent =
                "Log in";

            switchAuth.textContent =
                "Create an account";

            usernameInput.classList.add(
                "hidden"
            );

        } else {

            authTitle.textContent =
                "Create an account";

            authButton.textContent =
                "Sign up";

            switchAuth.textContent =
                "Already have an account? Log in";

            usernameInput.classList.remove(
                "hidden"
            );
        }
    }
);


// ========================================
// LOGIN / SIGNUP BUTTON
// ========================================

authButton.addEventListener(
    "click",
    async () => {

        authError.textContent =
            "";

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        const username =
            usernameInput.value.trim();


        if (!email || !password) {

            authError.textContent =
                "Enter your email and password.";

            return;
        }


        authButton.disabled =
            true;


        try {

            if (loginMode) {

                await login(
                    email,
                    password
                );

            } else {

                if (!username) {

                    authError.textContent =
                        "Choose a username.";

                    return;
                }

                await signup(
                    email,
                    password,
                    username
                );
            }


            emailInput.value =
                "";

            passwordInput.value =
                "";

            usernameInput.value =
                "";


        } catch (error) {

            console.error(
                "Authentication error:",
                error
            );


            if (
                error.message ===
                "That username is already taken."
            ) {

                authError.textContent =
                    error.message;

            } else if (
                error.message &&
                error.message.startsWith(
                    "Username"
                )
            ) {

                authError.textContent =
                    error.message;

            } else {

                authError.textContent =
                    getAuthError(error);
            }

        } finally {

            authButton.disabled =
                false;
        }
    }
);


// ========================================
// LOGOUT
// ========================================

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await logout();

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );
        }
    }
);


verificationLogoutButton.addEventListener(
    "click",
    async () => {

        try {

            await logout();

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );
        }
    }
);


// ========================================
// EMAIL VERIFICATION
// ========================================

checkVerificationButton.addEventListener(
    "click",
    async () => {

        verificationMessage.textContent =
            "Checking...";

        checkVerificationButton.disabled =
            true;


        try {

            const verified =
                await refreshVerificationStatus();


            if (verified) {

                verificationMessage.textContent =
                    "Email verified! Loading...";

                /*
                 * Firebase's auth state may not
                 * immediately refresh the UI after
                 * reload(), so explicitly update it.
                 */

                handleAuthenticatedUser(
                    auth.currentUser
                );

            } else {

                verificationMessage.textContent =
                    "Your email is not verified yet. Check your inbox and click the verification link.";

            }

        } catch (error) {

            console.error(
                "Verification check error:",
                error
            );

            verificationMessage.textContent =
                "Unable to check verification status.";

        } finally {

            checkVerificationButton.disabled =
                false;
        }
    }
);


resendVerificationButton.addEventListener(
    "click",
    async () => {

        verificationMessage.textContent =
            "Sending...";

        resendVerificationButton.disabled =
            true;


        try {

            await resendVerificationEmail();

            verificationMessage.textContent =
                "Verification email sent! Check your inbox.";

        } catch (error) {

            console.error(
                "Verification email error:",
                error
            );


            if (
                error.code ===
                "auth/too-many-requests"
            ) {

                verificationMessage.textContent =
                    "Too many requests. Please wait before trying again.";

            } else {

                verificationMessage.textContent =
                    error.message ||
                    "Unable to send verification email.";
            }

        } finally {

            resendVerificationButton.disabled =
                false;
        }
    }
);


// ========================================
// AUTH STATE
// ========================================

listenForAuth(
    (user) => {

        currentAuthUser =
            user;


        /*
         * Nobody is logged in.
         */

        if (!user) {

            showLoggedOut();

            return;
        }


        /*
         * User is logged in but hasn't
         * verified their email.
         */

        if (!user.emailVerified) {

            showVerificationScreen(
                user
            );

            return;
        }


        /*
         * User is logged in and verified.
         */

        handleAuthenticatedUser(
            user
        );
    }
);


// ========================================
// LOGGED OUT UI
// ========================================

function showLoggedOut() {

    authSection.classList.remove(
        "hidden"
    );

    verificationSection.classList.add(
        "hidden"
    );

    socialSection.classList.add(
        "hidden"
    );

    logoutButton.classList.add(
        "hidden"
    );

    currentUser.textContent =
        "";

    feed.innerHTML =
        "";


    if (unsubscribePosts) {

        unsubscribePosts();

        unsubscribePosts =
            null;
    }
}


// ========================================
// VERIFICATION UI
// ========================================

function showVerificationScreen(
    user
) {

    authSection.classList.add(
        "hidden"
    );

    verificationSection.classList.remove(
        "hidden"
    );

    socialSection.classList.add(
        "hidden"
    );

    logoutButton.classList.add(
        "hidden"
    );


    verificationEmail.textContent =
        user.email || "";

    verificationMessage.textContent =
        "";


    if (unsubscribePosts) {

        unsubscribePosts();

        unsubscribePosts =
            null;
    }


    feed.innerHTML =
        "";
}


// ========================================
// VERIFIED USER UI
// ========================================

function handleAuthenticatedUser(
    user
) {

    if (!user) {
        return;
    }


    /*
     * Don't allow an unverified account
     * into the social section.
     */

    if (!user.emailVerified) {

        showVerificationScreen(
            user
        );

        return;
    }


    authSection.classList.add(
        "hidden"
    );

    verificationSection.classList.add(
        "hidden"
    );

    socialSection.classList.remove(
        "hidden"
    );

    logoutButton.classList.remove(
        "hidden"
    );


    /*
     * Load the user's profile.
     */

    listenToUser(
        user.uid,
        (userData) => {

            if (
                userData &&
                userData.username
            ) {

                currentUser.textContent =
                    "@" +
                    userData.username;

            } else {

                currentUser.textContent =
                    user.email || "";
            }
        }
    );


    /*
     * Start the feed.
     */

    startFeed();
}


// ========================================
// POSTS
// ========================================

postText.addEventListener(
    "input",
    () => {

        characterCount.textContent =
            `${postText.value.length} / 280`;
    }
);


postButton.addEventListener(
    "click",
    async () => {

        postError.textContent =
            "";


        if (
            !currentAuthUser ||
            !currentAuthUser.emailVerified
        ) {

            postError.textContent =
                "You must verify your email first.";

            return;
        }


        postButton.disabled =
            true;


        try {

            await createPost(
                postText.value
            );


            postText.value =
                "";

            characterCount.textContent =
                "0 / 280";


        } catch (error) {

            console.error(
                "Post error:",
                error
            );

            postError.textContent =
                error.message ||
                "Unable to create post.";

        } finally {

            postButton.disabled =
                false;
        }
    }
);


// ========================================
// FEED
// ========================================

function startFeed() {

    if (unsubscribePosts) {

        unsubscribePosts();
    }


    unsubscribePosts =
        listenToPosts(
            renderFeed
        );
}


function renderFeed(
    posts
) {

    feed.innerHTML =
        "";


    for (const post of posts) {

        renderPost(
            post
        );
    }
}


// ========================================
// RENDER POST
// ========================================

function renderPost(
    post
) {

    const clone =
        postTemplate.content.cloneNode(
            true
        );


    const article =
        clone.querySelector(
            ".post"
        );

    const username =
        clone.querySelector(
            ".post-username"
        );

    const time =
        clone.querySelector(
            ".post-time"
        );

    const content =
        clone.querySelector(
            ".post-content"
        );

    const likeButton =
        clone.querySelector(
            ".like-button"
        );

    const likeCount =
        clone.querySelector(
            ".like-count"
        );


    /*
     * Load author profile.
     */

    listenToUser(
        post.authorUid,
        (userData) => {

            if (
                userData &&
                userData.username
            ) {

                username.textContent =
                    "@" +
                    userData.username;

            } else {

                username.textContent =
                    "Unknown user";
            }
        }
    );


    /*
     * IMPORTANT:
     * Use textContent rather than innerHTML.
     *
     * This prevents HTML/JavaScript
     * entered into posts from becoming
     * executable HTML.
     */

    content.textContent =
        post.text;


    /*
     * Timestamp.
     */

    if (post.timestamp) {

        time.textContent =
            formatTime(
                post.timestamp
            );
    }


    /*
     * Likes.
     */

    listenToLikes(
        post.id,
        (likes) => {

            const count =
                Object.keys(
                    likes
                ).length;


            likeCount.textContent =
                count;


            if (
                currentAuthUser &&
                likes[currentAuthUser.uid]
            ) {

                likeButton.classList.add(
                    "liked"
                );

                likeButton.firstChild.textContent =
                    "♥ ";

            } else {

                likeButton.classList.remove(
                    "liked"
                );

                likeButton.firstChild.textContent =
                    "♡ ";
            }
        }
    );


    /*
     * Like button.
     */

    likeButton.addEventListener(
        "click",
        async () => {

            if (
                !currentAuthUser ||
                !currentAuthUser.emailVerified
            ) {

                return;
            }


            likeButton.disabled =
                true;


            try {

                await toggleLike(
                    post.id
                );

            } catch (error) {

                console.error(
                    "Like error:",
                    error
                );

            } finally {

                likeButton.disabled =
                    false;
            }
        }
    );


    feed.appendChild(
        article
    );
}


// ========================================
// TIME FORMAT
// ========================================

function formatTime(
    timestamp
) {

    const date =
        new Date(
            timestamp
        );


    return date.toLocaleString();
}
