import {
    listenForAuth,
    login,
    signup,
    logout,
    resendVerificationEmail,
    checkEmailVerified,
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
// AUTH ELEMENTS
// ========================================

const authSection =
    document.getElementById("auth-section");

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


// ========================================
// VERIFICATION ELEMENTS
// ========================================

const verificationSection =
    document.getElementById(
        "verification-section"
    );

const verificationEmail =
    document.getElementById(
        "verification-email"
    );

const verificationMessage =
    document.getElementById(
        "verification-message"
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


// ========================================
// USERNAME ELEMENTS
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
// SOCIAL ELEMENTS
// ========================================

const socialSection =
    document.getElementById(
        "social-section"
    );

const logoutButton =
    document.getElementById(
        "logout-button"
    );

const currentUser =
    document.getElementById(
        "current-user"
    );

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

let loginMode = true;

let currentAuthUser = null;

let unsubscribePosts = null;

let verificationEmailAddress = "";


// ========================================
// INITIAL UI
// ========================================

showAuthScreen();


// ========================================
// LOGIN / SIGNUP SWITCH
// ========================================

switchAuth.addEventListener(
    "click",
    () => {

        loginMode = !loginMode;

        authError.textContent = "";

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

        authError.textContent = "";

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        if (!email) {

            authError.textContent =
                "Enter your email.";

            return;
        }


        if (!password) {

            authError.textContent =
                "Enter your password.";

            return;
        }


        authButton.disabled = true;


        try {

            if (loginMode) {

                await login(
                    email,
                    password
                );

            } else {

                /*
                 * Username is intentionally NOT
                 * created yet.
                 *
                 * It happens after verification.
                 */

                await signup(
                    email,
                    password
                );
            }


            emailInput.value = "";
            passwordInput.value = "";
            usernameInput.value = "";


        } catch (error) {

            console.error(
                "Authentication error:",
                error
            );

            authError.textContent =
                getAuthError(error);

        } finally {

            authButton.disabled = false;
        }
    }
);


// ========================================
// AUTH STATE
// ========================================

listenForAuth(
    async (user) => {

        currentAuthUser = user;


        /*
         * Logged out.
         */

        if (!user) {

            showAuthScreen();

            return;
        }


        /*
         * Account exists but email is
         * not verified.
         */

        if (!user.emailVerified) {

            showVerificationScreen(
                user
            );

            return;
        }


        /*
         * Email is verified.
         *
         * Check whether the user already
         * has a username.
         */

        listenToUser(
            user.uid,
            (userData) => {

                if (
                    userData &&
                    userData.username
                ) {

                    showSocialScreen(
                        user,
                        userData
                    );

                } else {

                    showUsernameScreen();
                }
            }
        );
    }
);


// ========================================
// VERIFICATION SCREEN
// ========================================

function showVerificationScreen(
    user
) {

    hideAllScreens();

    verificationSection.classList.remove(
        "hidden"
    );


    verificationEmailAddress =
        user.email || "";


    verificationEmail.textContent =
        verificationEmailAddress;


    verificationMessage.textContent =
        "";


    /*
     * Show verification instructions.
     */

    checkVerificationButton.classList.remove(
        "hidden"
    );

    resendVerificationButton.classList.remove(
        "hidden"
    );


    /*
     * Username setup must remain hidden
     * until verification succeeds.
     */

    usernameSetup.classList.add(
        "hidden"
    );


    verifiedUsername.value = "";

    usernameError.textContent = "";
}


// ========================================
// CHECK VERIFICATION
// ========================================

checkVerificationButton.addEventListener(
    "click",
    async () => {

        verificationMessage.textContent =
            "Checking your email verification...";

        checkVerificationButton.disabled =
            true;


        try {

            const verified =
                await checkEmailVerified();


            if (!verified) {

                verificationMessage.textContent =
                    "Your email hasn't been verified yet. Please click the verification link in the email first.";

                return;
            }


            /*
             * Success!
             */

            verificationMessage.textContent =
                "Email verified successfully!";


            checkVerificationButton.classList.add(
                "hidden"
            );

            resendVerificationButton.classList.add(
                "hidden"
            );


            /*
             * Give the user a moment to see
             * the success message.
             */

            setTimeout(
                () => {

                    showUsernameScreen();

                },
                700
            );


        } catch (error) {

            console.error(
                "Verification check error:",
                error
            );


            verificationMessage.textContent =
                "We couldn't check your verification status. Please try again.";

        } finally {

            checkVerificationButton.disabled =
                false;
        }
    }
);


// ========================================
// RESEND VERIFICATION
// ========================================

resendVerificationButton.addEventListener(
    "click",
    async () => {

        verificationMessage.textContent =
            "Sending another verification email...";

        resendVerificationButton.disabled =
            true;


        try {

            await resendVerificationEmail();


            verificationMessage.textContent =
                "Verification email sent. Check your inbox and your Spam/Junk folder.";

        } catch (error) {

            console.error(
                "Resend error:",
                error
            );


            if (
                error.code ===
                "auth/too-many-requests"
            ) {

                verificationMessage.textContent =
                    "Too many emails have been requested. Please wait a while before trying again.";

            } else {

                verificationMessage.textContent =
                    error.message ||
                    "Unable to send the verification email.";
            }

        } finally {

            /*
             * Don't leave the button permanently
             * disabled.
             */

            setTimeout(
                () => {

                    resendVerificationButton.disabled =
                        false;

                },
                3000
            );
        }
    }
);


// ========================================
// VERIFICATION LOGOUT
// ========================================

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
// USERNAME SCREEN
// ========================================

function showUsernameScreen() {

    hideAllScreens();

    verificationSection.classList.remove(
        "hidden"
    );


    verificationMessage.textContent =
        "Your email has been verified! Now choose your username.";


    checkVerificationButton.classList.add(
        "hidden"
    );

    resendVerificationButton.classList.add(
        "hidden"
    );


    usernameSetup.classList.remove(
        "hidden"
    );


    verifiedUsername.focus();
}


// ========================================
// CLAIM USERNAME
// ========================================

claimUsernameButton.addEventListener(
    "click",
    async () => {

        usernameError.textContent = "";

        const username =
            verifiedUsername.value.trim();


        const validationError =
            validateUsername(
                username
            );


        if (validationError) {

            usernameError.textContent =
                validationError;

            return;
        }


        const user =
            auth.currentUser;


        if (!user) {

            usernameError.textContent =
                "You are not logged in.";

            return;
        }


        /*
         * Double-check verification before
         * touching the database.
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
             * Username successfully created.
             */

            showSocialScreen(
                user,
                {
                    username:
                        username
                }
            );


        } catch (error) {

            console.error(
                "Username error:",
                error
            );


            usernameError.textContent =
                error.message ||
                "Unable to create your username.";

        } finally {

            claimUsernameButton.disabled =
                false;
        }
    }
);


// ========================================
// SOCIAL SCREEN
// ========================================

function showSocialScreen(
    user,
    userData
) {

    hideAllScreens();

    socialSection.classList.remove(
        "hidden"
    );

    logoutButton.classList.remove(
        "hidden"
    );


    currentUser.textContent =
        "@" +
        userData.username;


    startFeed();
}


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


// ========================================
// HIDE ALL SCREENS
// ========================================

function hideAllScreens() {

    authSection.classList.add(
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
}


// ========================================
// AUTH SCREEN
// ========================================

function showAuthScreen() {

    hideAllScreens();

    authSection.classList.remove(
        "hidden"
    );


    authError.textContent = "";

    verificationMessage.textContent = "";

    usernameError.textContent = "";

    verifiedUsername.value = "";

    feed.innerHTML = "";


    if (unsubscribePosts) {

        unsubscribePosts();

        unsubscribePosts = null;
    }
}


// ========================================
// POST CHARACTER COUNT
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

        postError.textContent = "";


        if (
            !currentAuthUser ||
            !currentAuthUser.emailVerified
        ) {

            postError.textContent =
                "You must verify your email first.";

            return;
        }


        postButton.disabled = true;


        try {

            await createPost(
                postText.value
            );


            postText.value = "";

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

            postButton.disabled = false;
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

function renderFeed(posts) {

    feed.innerHTML = "";


    for (
        const post of posts
    ) {

        renderPost(post);
    }
}


// ========================================
// RENDER POST
// ========================================

function renderPost(post) {

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
     * Author.
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
     * Never use innerHTML for user posts.
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


            likeButton.disabled = true;


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

                likeButton.disabled = false;
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

function formatTime(timestamp) {

    return new Date(
        timestamp
    ).toLocaleString();
}
