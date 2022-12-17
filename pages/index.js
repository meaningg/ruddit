import styles from "../styles/Home.module.scss";
import { useState } from "react";
import { AceBaseClient } from "acebase-client";
import { useEffect } from "react";
import { uuid } from "uuidv4";

export default function Home() {
  const initialPostsCount = 10;

  const [newPostModalIsOpen, setNewPostModalIsOpen] = useState(false);
  const [changePostModalIsOpen, setChangePostModalIsOpen] = useState(false);
  const [postsIsLoading, setPostsIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [db, setDb] = useState();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [postsCount, setPostsCount] = useState(0);
  const [postsLazyCount, setPostsLazyCount] = useState(initialPostsCount);
  const [postData, setPostData] = useState({});

  // TODO Разделить все на компоненты

  // Подключение к бд при загрузке страницы, первичное получение постов и их кол-ва
  useEffect(() => {
    return () => {
      const db = new AceBaseClient({
        host: "localhost",
        port: 5757,
        dbname: "mydb",
        https: false,
      });
      getPostsCount(db);
      getPostsList(db);
      setDb(db);

      db.ready((dbRef) => {
        db.ref("postsTest")
          .on("child_added")
          .subscribe((postSnapshot) => {
            getMorePosts(db, 0);
            getPostsCount(db);
          });
        db.ref("postsTest")
          .on("child_removed")
          .subscribe((postSnapshot) => {
            getMorePosts(db, 0);
            getPostsCount(db);
          });
        db.ref("postsTest")
          .on("child_changed")
          .subscribe((postSnapshot) => {
            getMorePosts(db, 0);
          });
        // db.ref("postsTest")
        //   .on("value", false)
        //   .subscribe((postSnapshot) => {
        //     getMorePosts(db);
        //     getPostsCount(db);
        //   });
      });
    };
  }, []);

  // получение кол-ва постов
  function getPostsCount(db) {
    db.ref("postsTest")
      .count()
      .then((countRef) => {
        setPostsCount(countRef);
      });
  }

  // подгрузить дополнительные посты
  const getMorePosts = (db, initialPostsCount) => {
    db.query("postsTest")
      .take(initialPostsCount + postsLazyCount)
      .sort("date", false)
      .get()
      .then((snap) => {
        setPosts(snap.getValues());
        console.log(snap);
      });
  };

  // Получение начального списка постов с сортировкой по самым новым
  function getPostsList(db) {
    db.query("postsTest")
      .take(10)
      .sort("date", false)
      .get()
      .then((snap) => {
        setPosts(snap.getValues());
        setPostsIsLoading(false);
        console.log(snap);
      });
  }

  // Добавление поста
  const handleSubmitAddPost = (event) => {
    event.preventDefault();
    const uid = uuid();
    db.ref(`postsTest/${uid}`)
      .set({
        id: uid,
        title: title,
        text: text,
        date: Date.now(),
      })
      .then((postRef) => {
        setNewPostModalIsOpen(false);
        setTitle("");
        setText("");
      });
  };
  // Добавление тестового поста TODO: делитнуть в релизе
  const handleAddTestPost = () => {
    for (let i = 0; i < 10; i++) {
      const uid = uuid();
      db.ref(`postsTest/${uid}`)
        .set({
          id: uid,
          title: "Тест",
          text: "Это тестовый пост, который был создан кнопкой.",
          date: Date.now(),
        })
        .then((postRef) => {});
    }
  };
  // Изменение поста
  const handleSubmitChangePost = (event) => {
    event.preventDefault();
    db.ref(`postsTest/${postData.id}`)
      .update({
        title: title,
        text: text,
        date: postData.date,
        updated: true,
        updateDate: Date.now(),
      })
      .then((postRef) => {
        setChangePostModalIsOpen(false);
        setTitle("");
        setText("");
        setPostData({});
      });
  };
  // Удаление поста
  const handleDeletePost = async (id, event) => {
    event.preventDefault();
    await db.query("postsTest").filter("id", "==", id).remove();
  };

  // Отчистка БД TODO: делитнуть в релизе
  const clearDB = () => {
    db.ref("postsTest").remove();
  };

  // Загрузить больше постов
  const handleLoadMorePosts = (event) => {
    event.preventDefault();
    if (postsLazyCount < postsCount) {
      setPostsLazyCount((prevCount) => prevCount + initialPostsCount);
      getMorePosts(db, initialPostsCount);
    }
  };

  return (
    <div className={styles.container}>
      <div
        className={changePostModalIsOpen ? styles.changePostModal : "hidden"}
      >
        <div className={styles.changePostModal_header}>Изменить пост</div>

        <form
          className={styles.changePostModal_body}
          onSubmit={(event) => {
            handleSubmitChangePost(event);
          }}
        >
          <input
            onChange={() => {
              setTitle(event.target.value);
            }}
            placeholder={postData.title}
            type="text"
            value={title}
          />
          <input
            onChange={() => {
              setText(event.target.value);
            }}
            placeholder={postData.text}
            type="text"
            value={text}
          />
          <button type="submit">Изменить</button>
        </form>
      </div>
      <div
        className={
          newPostModalIsOpen ? styles.newPostModal : styles.newPostModal_hidden
        }
      >
        <div className={styles.newPostModal_header}>Новый пост</div>

        <form
          className={styles.newPostModal_body}
          onSubmit={handleSubmitAddPost}
        >
          <input
            onChange={() => {
              setTitle(event.target.value);
            }}
            placeholder="Заголовок"
            type="text"
            value={title}
          />
          <input
            onChange={() => {
              setText(event.target.value);
            }}
            placeholder="Текст"
            type="text"
            value={text}
          />
          <button type="submit">Создать</button>
        </form>
      </div>

      <div className={styles.sideBar_left}></div>
      <div className={styles.content}>
        <div className={styles.content_header}>
          <button
            onClick={() => {
              setNewPostModalIsOpen(true);
            }}
          >
            Добавить пост
          </button>
          <button
            onClick={() => {
              clearDB();
            }}
          >
            Отчистить БД
          </button>
          <button
            onClick={() => {
              handleAddTestPost();
            }}
          >
            Тестовый пост x10
          </button>
        </div>
        <div className={styles.postCounter}>
          Всего постов:
          <div className={styles.postCounter_num}>{postsCount}</div>; Постов на
          странице:
          <div className={styles.postCounter_num}>{posts.length};</div>
          Должно быть постов:
          <div className={styles.postCounter_num}>{postsLazyCount};</div>
        </div>
        <div className={styles.content_postsList}>
          {postsIsLoading ? (
            <>Loading</>
          ) : (
            posts.map((data) => (
              <div key={data.id} className={styles.post}>
                <div className={styles.post_header}>{data.title}</div>
                <div className={styles.post_body}>{data.text}</div>
                <div className={styles.post_buttons}>
                  <button
                    onClick={() => {
                      setChangePostModalIsOpen(true);
                      setTitle(data.title);
                      setText(data.text);
                      setPostData(data);
                    }}
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => {
                      handleDeletePost(data.id, event);
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className={styles.content_moreButton}>
          <button
            onClick={(event) => {
              handleLoadMorePosts(event);
            }}
          >
            Загрузить больше
          </button>
        </div>
      </div>
      <div className={styles.sideBar_right}></div>
    </div>
  );
}
