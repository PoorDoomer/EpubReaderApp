import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('userData.db');

export const initializeDatabase = () => {
  db.transaction((tx) => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS user_data (book_id TEXT PRIMARY KEY NOT NULL, last_location TEXT, bookmarks TEXT);'
    );
  });
};

export const saveLastLocation = (bookId, lastLocation) => {
  db.transaction((tx) => {
    tx.executeSql(
      'INSERT OR REPLACE INTO user_data (book_id, last_location) VALUES (?, ?);',
      [bookId, lastLocation]
    );
  });
};

export const getLastLocation = (bookId, callback) => {
  db.transaction((tx) => {
    tx.executeSql(
      'SELECT last_location FROM user_data WHERE book_id = ?;',
      [bookId],
      (_, { rows }) => {
        if (rows.length > 0) {
          callback(rows.item(0).last_location);
        } else {
          callback(null);
        }
      }
    );
  });
};

export const addBookmark = (bookId, cfi) => {
  db.transaction((tx) => {
    tx.executeSql(
      'SELECT bookmarks FROM user_data WHERE book_id = ?;',
      [bookId],
      (_, { rows }) => {
        let bookmarks = [];
        if (rows.length > 0 && rows.item(0).bookmarks) {
          bookmarks = JSON.parse(rows.item(0).bookmarks);
        }
        if (!bookmarks.includes(cfi)) {
          bookmarks.push(cfi);
          tx.executeSql(
            'INSERT OR REPLACE INTO user_data (book_id, bookmarks) VALUES (?, ?);',
            [bookId, JSON.stringify(bookmarks)]
          );
        }
      }
    );
  });
};

export const getBookmarks = (bookId, callback) => {
  db.transaction((tx) => {
    tx.executeSql(
      'SELECT bookmarks FROM user_data WHERE book_id = ?;',
      [bookId],
      (_, { rows }) => {
        if (rows.length > 0 && rows.item(0).bookmarks) {
          const bookmarks = JSON.parse(rows.item(0).bookmarks);
          callback(bookmarks);
        } else {
          callback([]);
        }
      }
    );
  });
};
