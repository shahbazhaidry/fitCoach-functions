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
          "data":{
            "clientId": clientId
          }
        };

        return admin.messaging().sendToDevice(profileSnapshot.val().token, payload);

      });

      
      
    });


/*
    // Get inside the user's profile 

  admin.database().ref(`/userProfile/${userId}/`).once('value', profileSnapshot => {
    const coachTokenPromise = admin.database()
      .ref(`/userProfile/${profileSnapshot.val().coachId}/notificationToken`).once('value');

    const 
    
  });

  const clientProfilePromise = admin.database
  // Get the follower profile.
  const getFollowerProfilePromise = admin.auth().getUser(followerUid);

  return Promise.all([getDeviceTokensPromise, getFollowerProfilePromise]).then(results => {
    const tokensSnapshot = results[0];
    const follower = results[1];

    // Check if there are any device tokens.
    if (!tokensSnapshot.hasChildren()) {
      return console.log('There are no notification tokens to send to.');
    }
    console.log('There are', tokensSnapshot.numChildren(), 'tokens to send notifications to.');
    console.log('Fetched follower profile', follower);

    // Notification details.
    const payload = {
      notification: {
        title: 'You have a new follower!',
        body: `${follower.displayName} is now following you.`,
        icon: follower.photoURL
      }
    };

    // Listing all tokens.
    const tokens = Object.keys(tokensSnapshot.val());

    // Send notifications to all tokens.
    return admin.messaging().sendToDevice(tokens, payload).then(response => {
      // For each message check if there was an error.
      const tokensToRemove = [];
      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          console.error('Failure sending notification to', tokens[index], error);
          // Cleanup the tokens who are not registered anymore.
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            tokensToRemove.push(tokensSnapshot.ref.child(tokens[index]).remove());
          }
        }
      });
      return Promise.all(tokensToRemove);
    });
  });*/

});