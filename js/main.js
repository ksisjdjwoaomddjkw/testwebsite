import {
    listenForAuth,
    login,
    signup,
    logout,
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


let loginMode = true;

let unsubscribePosts = null;


/*
 * LOGIN / SIGNUP SWITCH
 */

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


/*
 * LOGIN / SIGNUP
 */

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


        try {

            if (loginMode) {

                await login(
                    email,
                    password
                );

            } else {

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

            console.error(error);


            if (
                error.message ===
                "That username is already taken."
            ) {

                authError.textContent =
                    error.message;

            } else if (error.message?.startsWith(
                "Username"
            )) {

                authError.textContent =
                    error.message;

            } else {

                authError.textContent =
                    getAuthError(error);

            }

        }

    }
);


/*
 * LOGOUT
 */

logoutButton.addEventListener(
    "click",
    async () => {

        await logout();

    }
);


/*
 * AUTH STATE
 */

listenForAuth(
    (user) => {

        if (user) {

            authSection.classList.add(
                "hidden"
            );

            socialSection.classList.remove(
                "hidden"
            );

            logoutButton.classList.remove(
                "hidden"
            );


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
                            user.email ||
                            "";

                    }

                }
            );


            startFeed();


        } else {

            authSection.classList.remove(
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

    }
);


/*
 * CHARACTER COUNTER
 */

postText.addEventListener(
    "input",
    () => {

        characterCount.textContent =
            `${postText.value.length} / 280`;

    }
);


/*
 * CREATE POST
 */

postButton.addEventListener(
    "click",
    async () => {

        postError.textContent =
            "";


        try {

            await createPost(
                postText.value
            );


            postText.value =
                "";

            characterCount.textContent =
                "0 / 280";


        } catch (error) {

            postError.textContent =
                error.message;

        }

    }
);


/*
 * START FEED
 */

function startFeed() {

    if (unsubscribePosts) {

        unsubscribePosts();

    }


    unsubscribePosts =
        listenToPosts(
            renderFeed
        );

}


/*
 * RENDER FEED
 */

function renderFeed(posts) {

    feed.innerHTML =
        "";


    for (const post of posts) {

        renderPost(post);

    }

}


/*
 * RENDER SINGLE POST
 */

function renderPost(post) {

    const clone =
        postTemplate.content.cloneNode(
            true
        );


    const article =
        clone.querySelector(".post");

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
     * Load author profile
     */

    listenToUser(
        post.authorUid,
        (userData) => {

            username.textContent =
                userData?.username
                    ? "@" +
                      userData.username
                    : "Unknown user";

        }
    );


    /*
     * Content
     */

    content.textContent =
        post.text;


    /*
     * Timestamp
     */

    if (post.timestamp) {

        time.textContent =
            formatTime(
                post.timestamp
            );

    }


    /*
     * Likes
     */

    listenToLikes(
        post.id,
        (likes) => {

            const count =
                Object.keys(likes).length;


            likeCount.textContent =
                count;


            const user =
                window.firebaseCurrentUser;


            if (
                user &&
                likes[user.uid]
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
     * Like button
     */

    likeButton.addEventListener(
        "click",
        async () => {

            try {

                await toggleLike(
                    post.id
                );

            } catch (error) {

                console.error(error);

            }

        }
    );


    feed.appendChild(
        article
    );

}


/*
 * CURRENT USER
 *
 * This lets the UI know which
 * account is currently logged in.
 */

import {
    auth
} from "./firebase.js";


auth.onAuthStateChanged =
    undefined;


/*
 * Firebase's onAuthStateChanged
 * is already handled in auth.js.
 *
 * We only need this value for
 * displaying the correct like icon.
 */

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


onAuthStateChanged(
    auth,
    (user) => {

        window.firebaseCurrentUser =
            user;

    }
);


/*
 * TIME FORMAT
 */

function formatTime(timestamp) {

    const date =
        new Date(timestamp);


    return date.toLocaleString();

}
