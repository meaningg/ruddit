import styles from "../styles/Home.module.scss";
import { useState } from "react";
import { AceBaseClient } from "acebase-client";
import { useEffect } from "react";
import { uuid } from "uuidv4";
export default function Home() {
  const [newPostModalIsOpen, setNewPostModalIsOpen] = useState(false);
  const [changePostModalIsOpen, setChangePostModalIsOpen] = useState(false);
  const [postsIsLoading, setPostsIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [db, setDb] = useState();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [postsCount, setPostsCount] = useState(0);
  const [postsLazyCount, setPostsLazyCount] = useState(2);

  // TODO Разделить все на компоненты

  // получение кол-ва постов
  function getPostsCount(db) {
    db.ref("postsTest")
      .count()
      .then((countRef) => {
        setPostsCount(countRef);
      });
  }

  // Получение списка постов
  function getPostsList(db) {
    db.ref("postsTest")
      .get()
      .then((snap) => {
        const posts = [];
        const data = snap.val();
        for (let i in data) {
          posts.push(data[i]);
        }
        setPosts(posts);
        setPostsIsLoading(false);
      });

    // Заготовка под lazy load постов. Ограничение кол-ва запрашиваемых постов с помощью состояния postsLazyCount
    // db.query("postsTest")
    //     .take(postsLazyCount)
    //     .get()
    //     .then((snap) => {
    //         setPosts(snap.getValues());
    //         setPostsIsLoading(false);
    //     });
  }

  // Подключение к бд при загрузке страницы и первичное получение постов и их кол-ва
  useEffect(() => {
    return () => {
      const db = new AceBaseClient({
        host: "localhost",
        port: 5757,
        dbname: "mydb",
        https: false,
      });

      db.ready((dbRef) => {
        setDb(db);
      });

      db.ref("postsTest")
        .on("value", true)
        .subscribe((postSnapshot) => {
          getPostsList(db);
          getPostsCount(db);
        });
    };
  }, []);

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
  // Изменение поста TODO: Сделать изменение поста
  const handleSubmitChangePost = (event) => {
    event.preventDefault();
    setChangePostModalIsOpen(false);
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
    // setPostsLazyCount(postsLazyCount + 2);
    // getPostsList(db);
  };

  return (
    <div className={styles.container}>
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
      <div
        className={
          changePostModalIsOpen
            ? styles.newPostModal
            : styles.newPostModal_hidden
        }
      >
        <div className={styles.newPostModal_header}>Новый пост</div>

        <form
          className={styles.newPostModal_body}
          onSubmit={handleSubmitChangePost}
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
            Тестовый пост
          </button>
        </div>
        <div className={styles.postCounter}>
          Всего постов:
          <div className={styles.postCounter_num}>{postsCount}</div>; Постов на
          странице:
          <div className={styles.postCounter_num}>{postsLazyCount}</div> - он
          пиздит, функционал закомменчен;
        </div>
        <div className={styles.content_postsList}>
          {postsIsLoading ? (
            <>Loading</>
          ) : (
            posts.map((data) => (
              <div id={data.id} className={styles.post}>
                <div className={styles.post_header}>{data.title}</div>
                <div className={styles.post_body}>{data.text}</div>
                <div className={styles.post_buttons}>
                  <button
                    onClick={() => {
                      setChangePostModalIsOpen(true);
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
            onClick={() => {
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
