# Models

## Schema

```
User {
  name:string:pk
  email:string
  createdAt:date
  updatedAt:date
}

Bikeshed {
  id:string:pk,
  description:string
  status:string
  createdAt:date
  updatedAt:date

  username:string
}

Bike {
  id:string:pk
  name:string
  size:number
  type:string
  createdAt:date
  updatedAt:date
  status:string

  bikeshedId:string
}

Vote {
  id:string:pk
  createdAt:date
  updatedAt:date

  username:string
  bikeshedId:string
}

Rating {
  id:string:pk
  value:number
  createdAt:date
  updatedAt:date

  bikeId:string
  voteId:string
}
```

## Relations

* User has many bikesheds
* User has many votes
* Bikeshed belongs to user
* Bikeshed has many bikes
* Bikeshed has many votes
* Bike belongs to bikeshed
* Bike has many ratings
* Vote belongs to bikeshed
* Vote belongs to user
* Vote has many ratings
* Rating belongs to bike
* Rating belongs to vote
