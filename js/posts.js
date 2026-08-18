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


export async function createPost(text) {

    const user =
        auth.currentUser;


    if (!user) {
        throw new Error("You must be logged in.");
    }


    text =
        text.trim();


    if (!text) {
        throw new Error("Write something first.");
    }


    if (text.length > 280) {
        throw new Error("Your post is too long.");
    }


    const postRef =
        push(ref(database, "posts"));


    await set(
        postRef,
        {
            authorUid: user.uid,
            text: text,
            timestamp: serverTimestamp()
        }
    );
}


export function listenToPosts(callback) {

    const postsRef =
        ref(database, "posts");


    return onValue(
        postsRef,
        async (snapshot) => {

            const posts = [];


            snapshot.forEach(
                (child) => {

                    posts.push({

                        id: child.key,

                        ...child.val()

                    });

                }
            );


            posts.sort(
                (a, b) =>
                    (b.timestamp || 0) -
                    (a.timestamp || 0)
            );


            callback(
                posts.slice(0, 50)
            );

        }
    );
}


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


export async function toggleLike(
    postId
) {

    const user =
        auth.currentUser;


    if (!user) {
        return;
    }


    const likeRef =
        ref(
            database,
            `likes/${postId}/${user.uid}`
        );


    await new Promise(
        (resolve, reject) => {

            onValue(
                likeRef,

                async (snapshot) => {

                    try {

                        if (snapshot.exists()) {

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
