// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from 'firebase/app';

// Add the Firebase products and methods that you want to use
import {
  getAuth,
  EmailAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc, 
  setDoc,
  where
} from 'firebase/firestore';

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.querySelector('#startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

let rsvpListener = null;
let guestbookListener = null;

let db, auth;

async function main() {
  // Add Firebase project configuration object here
  const firebaseConfig = {
    apiKey: 'AIzaSyBasAr96a5XmP2yazn6ca73Yoc2n9Vt8Uc',
    authDomain: 'fir-web-codelab-55b31.firebaseapp.com',
    projectId: 'fir-web-codelab-55b31',
    storageBucket: 'fir-web-codelab-55b31.appspot.com',
    messagingSenderId: '738165279561',
    appId: '1:738165279561:web:61c4e005c9b889321fe898',
  };

  initializeApp(firebaseConfig);
  auth = getAuth();
  db = getFirestore();

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      },
    },
  };

  const ui = new firebaseui.auth.AuthUI(auth);

  startRsvpButton.addEventListener('click', () => {
    if (auth.currentUser) {
      // User is signed in; allows user to sign out
      signOut(auth);
    } else {
      // No user is signed in; allows user to sign in
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      startRsvpButton.textContent = 'LOGOUT';
      guestbookContainer.style.display = 'block';
      subscribeGuestbook();
      subscribeCurrentRSVP(user);
    } else {
      startRsvpButton.textContent = 'RSVP';
      guestbookContainer.style.display = 'none';
      unsubscribeGuestbook();
      unsubscribeCurrentRSVP();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    addDoc(collection(db, 'guestbook'), {
      text: input.value,
      timeStamp: Date.now(),
      name: auth.currentUser.displayName,
      userId: auth.currentUser.uid,
    });
    input.value = '';
    return false;
  });

  function subscribeGuestbook() {
    const q = query(collection(db, 'guestbook'), orderBy('timeStamp', 'desc'));
    guestbooklistener = onSnapshot(q, (snaps) => {
      guestbook.innerHTML = '';
      snaps.forEach((doc) => {
        const entry = document.createElement('p');
        entry.textContent = doc.data().name + ': ' + doc.data().text;
        guestbook.appendChild(entry);
      });
    });
  }

  function unsubscribeGuestbook() {
    if (guestbookListener != null) {
      guestbookListener();
      guestbookListener = null;
    }
  }

  rsvpYes.onclick = async () => {

    const userRef = doc(db, 'attendees', auth.currentUser.uid);

    try {
      await setDoc(userRef, {
        attending: true,
      });
    } catch (e) {
      console.error(e);
    }
    
  };
  rsvpNo.onclick = async () => {
    const userRef = doc(db, 'attendees', auth.currentUser.uid);

    try {
      await setDoc(userRef, {
        attending: false,
      });
    } catch (e) {
      console.error(e);
    }
    
  };

  const attendingQuery = query(
    collection(db, 'attendees'),
    where('attending', '==', true)
  );

  const unsubcribe = onSnapshot(attendingQuery, snap => {
    const newAttendeeCount = snap.docs.length;
  numberAttending.innerHTML = newAttendeeCount + ' people going';  
});

function subscribeCurrentRSVP(user) {
  const ref = doc(db, 'attendees', user.uid);
  rsvpListener = onSnapshot(ref, doc => {
    if (doc && doc.data()) {
      const attendingResponse = doc.data().attending;

      if (attendingResponse) {
        rsvpYes.className = 'clicked';
        rsvpNo.className = '';
      } else {
        rsvpYes.className = 'clicked';
        rsvpNo.className = '';
      }
    }
  })
}

function unsubscribeCurrentRSVP() {
  if (rsvpListener != null) {
    rsvpListener();
    rsvpListener = null;
  }
  rsvpYes.className = '';
  rsvpNo.className = '';
}

}

main();
