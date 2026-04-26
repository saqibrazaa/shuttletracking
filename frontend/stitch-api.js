import * as Realm from "realm-web";

const app = new Realm.App({ id: "your-app-id" });

export async function login(email, password) {
  const user = await app.logIn(
    Realm.Credentials.emailPassword(email, password)
  );
  return user;
}

export async function fetchShuttles(user) {
  const mongodb = user.mongoClient("mongodb-atlas");
  return await mongodb.db("shuttleDB").collection("Shuttles").find();
}

// Add more API functions as needed for routes, live locations, notifications, etc.
