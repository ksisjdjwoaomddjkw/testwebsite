import {
    ref,
    set,
    push,
    onValue,
    remove,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";

import {
    auth,
    database
} from "./firebase.js";


// ========================================
// CREATE POST
// ========================================

export async function createPost(
    text
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


    text =
        text.trim();


    if (!text) {

        throw new Error(
            "Write something first."
        );
    }


    if (text.length > 280) {

        throw new Error(
            "Your post is too long."
        );
    }


    const postRef =
        push(
            ref(
                database,
                "posts"
            )
        );


    await set(
        postRef,
        {
            authorUid:
                user.uid,

            text:
                text,

            timestamp:
                serverTimestamp()
        }
    );
}


// ========================================
// LISTEN TO POSTS
// ========================================

export function listenToPosts(
    callback
) {

    const postsRef =
        ref(
            database,
            "posts"
        );


    return onValue(
        postsRef,
        (snapshot) => {

            const posts = [];


            snapshot.forEach(
                (child) => {

                    posts.push({

                        id:
                            child.key,

                        ...child.val()

                    });

                }
            );


            /*
             * Newest posts first.
             */

            posts.sort(
                (a, b) =>
                    (b.timestamp || 0) -
                    (a.timestamp || 0)
            );


            /*
             * Only display the newest 50.
             */

            callback(
                posts.slice(
                    0,
                    50
                )
            );
        }
    );
}


// ========================================
// LISTEN TO LIKES
// ========================================

export function listenToLikes(
    postId,
    callback
) {

    const likesRef =
        ref(
            database,
            `likes/${postId}`
        );


    return onValue(
        likesRef,
        (snapshot) => {

            callback(
                snapshot.val() || {}
            );

        }
    );
}


// ========================================
// TOGGLE LIKE
// ========================================

export async function toggleLike(
    postId
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


    const likeRef =
        ref(
            database,
            `likes/${postId}/${user.uid}`
        );


    /*
     * Read the current like state once.
     */

    await new Promise(
        (resolve, reject) => {

            onValue(
                likeRef,

                async (snapshot) => {

                    try {

                        if (
                            snapshot.exists()
                        ) {

                            await remove(
                                likeRef
                            );

                        } else {

                            await set(
                                likeRef,
                                true
                            );
                        }


                        resolve();

                    } catch (error) {

                        reject(error);
                    }

                },

                {
                    onlyOnce: true
                }
            );
        }
    );
}
