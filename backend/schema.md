# MongoDB Collections Schema

## Users
```
{
  "_id": "",
  "name": "Saqib",
  "role": "student | driver | admin",
  "email": "",
  "password": ""
}
```

## Shuttles
```
{
  "_id": "",
  "name": "Shuttle 1",
  "driverId": "",
  "routeId": ""
}
```

## Routes
```
{
  "_id": "",
  "name": "Route A",
  "stops": [
    { "name": "Stop 1", "lat": "", "lng": "" }
  ]
}
```

## LiveLocations
```
{
  "shuttleId": "",
  "lat": "",
  "lng": "",
  "timestamp": ""
}
```

## Notifications
```
{
  "userId": "",
  "message": "",
  "type": "",
  "time": ""
}
```
