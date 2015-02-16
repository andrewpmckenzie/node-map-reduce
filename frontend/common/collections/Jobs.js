Jobs = new Mongo.Collection("jobs");

if (Meteor.isServer) {
  // Start with a fresh DB
  Jobs.remove({});
}
