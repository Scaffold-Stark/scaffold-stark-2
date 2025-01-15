import { userDb } from '../db.js';

const createUser = async (userData) => {
  const newUser = { ...userData };
  return new Promise((resolve, reject) => {
    userDb.insert(newUser, (err, doc) => {
      if (err) reject(err);
      resolve(doc);
    });
  });
};

const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    userDb.findOne({ email }, (err, doc) => {
      if (err) reject(err);
      resolve(doc);
    });
  });
};

const updateUserByEmail = async (email, update) => {
  return new Promise((resolve, reject) => {
    userDb.update({ email }, { $set: update }, {}, (err, numAffected, affectedDocuments, upsert) => {
      if (err) reject(err);
      resolve(affectedDocuments);
    });
  });
};

export { createUser, findUserByEmail, updateUserByEmail };
