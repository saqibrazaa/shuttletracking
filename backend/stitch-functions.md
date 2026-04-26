# Atlas App Services (Stitch) Functions

## Update Shuttle Location
```js
exports = async function(payload) {
  const collection = context.services
    .get("mongodb-atlas")
    .db("shuttleDB")
    .collection("LiveLocations");
  return collection.insertOne(payload);
};
```

## Get Nearby Shuttles
```js
exports = async function() {
  return context.services
    .get("mongodb-atlas")
    .db("shuttleDB")
    .collection("LiveLocations")
    .find()
    .toArray();
};
```

## Notes
- Add these as Functions in Atlas App Services UI
- Set up authentication (email/password, Google optional)
- Enable Device Sync for real-time updates
