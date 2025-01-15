import Datastore from '@seald-io/nedb';

const userDb = new Datastore({ filename: 'users.db', autoload: true });
userDb.setAutocompactionInterval(60000); // compacts every 60 seconds

export { userDb };