const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.createClientAccount = functions.database.ref('/userProfile/{userId}/clientList/{clientId}')
  .onWrite( event => {

  return admin.auth().createUser({
    uid: event.params.clientId, 
    email: event.data.val().email,
    password: "123456789",
    displayName: event.data.val().fullName 
  }).then( (userRecord) => {
    admin.database().ref(`/userProfile/${userRecord.uid}`).set({
      fullName: userRecord.displayName,
      email: userRecord.email,
      coachId: event.params.userId,
      admin: false,
      startingWeight: event.data.val().startingWeight
    });
  }).catch((error) => {
    console.log("Error creating new user:", error);
  });
    
});

exports.sendWeightUpdate = functions.database.ref('/userProfile/{userId}/weightTrack/{weightId}')
  .onWrite(event => {

    const clientId = event.params.userId;
    const weight = event.data.val().weight;

    return admin.database().ref(`/userProfile/${clientId}/`).once('value', clientProfileSnapshot => {
      const coachId = clientProfileSnapshot.val().coachId;
      const clientName = clientProfileSnapshot.val().fullName;
      const clientStartingWeight = clientProfileSnapshot.val().startingWeight;

      return admin.database().ref(`/userProfile/${coachId}/`).once('value', profileSnapshot => {
        // Notification details.
        const payload = {
          "notification":{
            "title": `${clientName} just shared a weight update`,
            "body": `${clientName} started at ${clientStartingWeight} and just updated to ${weight}`,
            "sound":"default",
            "click_action":"FCM_PLUGIN_ACTIVITY"
          },
          "data":{ "clientId": clientId }
        };
        return admin.messaging().sendToDevice(profileSnapshot.val().token, payload);
      });
    });
});