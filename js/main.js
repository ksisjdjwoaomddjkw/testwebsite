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
    listenToUser,
    validateUsername,
    claimUsername
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


// ========================================
// DOM ELEMENTS
// ========================================

const authSection =
    document.getElementById(
        "auth-section"
    );

const verificationSection =
    document.getElementById(
        "verification-section"
    );

const socialSection =
    document.getElementById(
        "social-section"
    );

const authTitle =
    document.getElementById(
        "auth-title"
    );

const emailInput =
    document.getElementById(
        "email"
    );

const passwordInput =
    document.getElementById(
        "password"
    );

const usernameInput =
    document.getElementById(
        "username"
    );

const authButton =
    document.getElementById(
        "auth-button"
    );

const switchAuth =
    document.getElementById(
        "switch-auth"
    );

const authError =
    document.getElementById(
        "auth-error"
    );

const logoutButton =
    document.getElementById(
        "logout-button"
    );

const currentUser =
    document.getElementById(
        "current-user"
    );


// ========================================
// VERIFICATION ELEMENTS
// ========================================

const verificationEmail =
    document.getElementById(
        "verification-email"
    );

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


// ========================================
// USERNAME SETUP
// ========================================

const usernameSetup =
    document.getElementById(
        "username-setup"
    );

const verifiedUsername =
    document.getElementById(
        "verified-username"
    );

const claimUsernameButton =
    document.getElementById(
        "claim-username-button"
    );

const usernameError =
    document.getElementById(
        "username-error"
    );


// ========================================
// POST ELEMENTS
// ========================================

const postText =
    document.getElementById(
        "post-text"
    );

const postButton =
    document.getElementById(
        "post-button"
    );

const postError =
    document.getElementById(
        "post-error"
    );

const characterCount =
    document.getElementById(
        "character-count"
    );

const feed =
    document.getElementById(
        "feed"
    );

const postTemplate =
    document.getElementById(
        "post-template"
    );


// ========================================
// STATE
// ========================================

let loginMode =
    true;

let unsubscribePosts =
    null;

let currentAuthUser =
    null;


// ========================================
// LOGIN / SIGNUP SWITCH
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
// LOGIN / SIGNUP
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


        if (
            !email ||
            !password
        ) {

            authError.textContent =
                "Enter your email and password.";

            return;
        }


        /*
         * Username is NOT required here anymore.
         *
         * It is selected after email verification.
         */

        authButton.disabled =
            true;


        try {

            if (loginMode) {

                await login(
                    email,
                    password
                );

            } else {

                await signup(
                    email,
                    password
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


            authError.textContent =
                getAuthError(
                    error
                );

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
// CHECK EMAIL VERIFICATION
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


            if (!verified) {

                verificationMessage.textContent =
                    "Your email is not verified yet. Check your inbox and click the verification link.";

                return;
            }


            /*
             * Email is verified.
             *
             * Now show username setup.
             */

            verificationMessage.textContent =
                "Email verified! Choose your username.";


            usernameSetup.classList.remove(
                "hidden"
            );


            checkVerificationButton.classList.add(
                "hidden"
            );


            resendVerificationButton.classList.add(
                "hidden"
            );


        } catch (error) {

            console.error(
                "Verification error:",
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


// ========================================
// RESEND VERIFICATION EMAIL
// ========================================

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
                "Resend verification error:",
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
// CLAIM USERNAME
// ========================================

claimUsernameButton.addEventListener(
    "click",
    async () => {

        usernameError.textContent =
            "";


        const username =
            verifiedUsername.value.trim();


        /*
         * Validate username locally first.
         */

        const validationError =
            validateUsername(
                username
            );


        if (validationError) {

            usernameError.textContent =
                validationError;

            return;
        }


        /*
         * Get current Firebase user.
         */

        const user =
            auth.currentUser;


        if (!user) {

            usernameError.textContent =
                "You are not logged in.";

            return;
        }


        /*
         * Email must be verified.
         */

        if (!user.emailVerified) {

            usernameError.textContent =
                "You must verify your email first.";

            return;
        }


        claimUsernameButton.disabled =
            true;


        try {

            const claimed =
                await claimUsername(
                    username,
                    user.uid
                );


            if (!claimed) {

                usernameError.textContent =
                    "That username is already taken.";

                return;
            }


            /*
             * Username successfully claimed.
             */

            usernameSetup.classList.add(
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


            handleAuthenticatedUser(
                user
            );


        } catch (error) {

            console.error(
                "Username claim error:",
                error
            );


            usernameError.textContent =
                error.message ||
                "Unable to claim username.";

        } finally {

            claimUsernameButton.disabled =
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
         * Not logged in.
         */

        if (!user) {

            showLoggedOut();

            return;
        }


        /*
         * Logged in but not verified.
         */

        if (!user.emailVerified) {

            showVerificationScreen(
                user
            );

            return;
        }


        /*
         * Verified user.
         *
         * They may either already have a
         * profile or need to choose a username.
         */

        checkUserProfile(
            user
        );
    }
);


// ========================================
// CHECK USER PROFILE
// ========================================

function checkUserProfile(
    user
) {

    listenToUser(
        user.uid,
        (userData) => {

            if (
                userData &&
                userData.username
            ) {

                /*
                 * Existing verified user.
                 */

                handleAuthenticatedUser(
                    user
                );

            } else {

                /*
                 * Verified but hasn't chosen
                 * a username yet.
                 */

                showUsernameSetup(
                    user
                );
            }
        }
    );
}


// ========================================
// LOGGED OUT SCREEN
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
// VERIFICATION SCREEN
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


    usernameSetup.classList.add(
        "hidden"
    );


    checkVerificationButton.classList.remove(
        "hidden"
    );


    resendVerificationButton.classList.remove(
        "hidden"
    );


    verifiedUsername.value =
        "";


    usernameError.textContent =
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
// USERNAME SETUP SCREEN
// ========================================

function showUsernameSetup(
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
        "Your email is verified. Choose your username.";


    usernameSetup.classList.remove(
        "hidden"
    );


    checkVerificationButton.classList.add(
        "hidden"
    );


    resendVerificationButton.classList.add(
        "hidden"
    );
}


// ========================================
// VERIFIED USER / SOCIAL NETWORK
// ========================================

function handleAuthenticatedUser(
    user
) {

    if (!user) {
        return;
    }


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
     * Load user's profile.
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


    startFeed();
}


// ========================================
// CHARACTER COUNTER
// ========================================

postText.addEventListener(
    "input",
    () => {

        characterCount.textContent =
            `${postText.value.length} / 280`;
    }
);


// ========================================
// CREATE POST
// ========================================

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
// START FEED
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


// ========================================
// RENDER FEED
// ========================================

function renderFeed(
    posts
) {

    feed.innerHTML =
        "";


    for (
        const post of posts
    ) {

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
     * SECURITY:
     *
     * textContent prevents somebody from
     * putting HTML/JavaScript into a post.
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
                likes[
                    currentAuthUser.uid
                ]
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
// FORMAT TIME
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
