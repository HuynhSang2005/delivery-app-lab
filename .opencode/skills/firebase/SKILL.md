---
name: firebase
description: Firebase Firestore, Auth, Storage, real-time listeners, security rules
---

# Firebase Skill

*Load with: base.md + security.md*

Firebase/Firestore patterns for web and mobile applications with real-time data, offline support, and security rules.

**Sources:** [Firebase Docs](https://firebase.google.com/docs) | [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices) | [Security Rules](https://firebase.google.com/docs/rules)

---

## Core Principle

**Denormalize with purpose, secure with rules, scale horizontally.**

Firestore is a document database - embrace denormalization for read efficiency. Security rules are your server-side validation. Design for your access patterns.

---

## Firebase Stack

| Service | Purpose |
|---------|---------|
| **Firestore** | NoSQL document database with real-time sync |
| **Authentication** | User auth, OAuth, anonymous sessions |
| **Storage** | File uploads with security rules |
| **Functions** | Serverless backend (Node.js) |
| **Hosting** | Static site + CDN |
| **Extensions** | Pre-built solutions (Stripe, Algolia, etc.) |

---

## Project Setup

```bash
# Install Firebase CLI
bun add -g firebase-tools

# Login and initialize
firebase login
firebase init
firebase emulators:start  # Start local development
```

---

## Firestore Data Modeling

### Document Structure
```typescript
interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;      // Denormalized for display
  authorAvatar: string;    // Denormalized
  tags: string[];
  likeCount: number;       // Aggregated counter
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Data Model Patterns
```typescript
// Pattern 1: Embedded data (bounded, always needed)
interface User {
  id: string;
  email: string;
  profile: { displayName: string; bio: string; avatar: string };
  settings: { notifications: boolean; theme: 'light' | 'dark' };
}

// Pattern 2: Reference with denormalization
interface Order {
  id: string;
  userId: string;
  userEmail: string;  // Denormalized
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid' | 'shipped';
}

// Pattern 3: Aggregation documents
interface Channel {
  id: string;
  name: string;
  memberCount: number;
  messageCount: number;
}
```

---

## TypeScript SDK (Modular v9+)

### Initialize Firebase
```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... other config
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

### CRUD Operations
```typescript
import { collection, doc, addDoc, getDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';

// Create
const docRef = await addDoc(collection(db, 'posts'), {
  title: 'My Post',
  authorId: userId,
  createdAt: serverTimestamp()
});

// Read
const docSnap = await getDoc(doc(db, 'posts', postId));
const post = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;

// Query
const q = query(collection(db, 'posts'), where('authorId', '==', userId), orderBy('createdAt', 'desc'), limit(10));
const snapshot = await getDocs(q);

// Update
await updateDoc(doc(db, 'posts', postId), { title: 'Updated', updatedAt: serverTimestamp() });

// Delete
await deleteDoc(doc(db, 'posts', postId));
```

### Real-time Listeners
```typescript
import { onSnapshot } from 'firebase/firestore';

function subscribeToPost(postId: string, onData: (post: Post | null) => void) {
  return onSnapshot(doc(db, 'posts', postId), (snapshot) => {
    onData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as Post : null);
  });
}

// React hook example
function usePost(postId: string) {
  const [post, setPost] = useState<Post | null>(null);
  useEffect(() => subscribeToPost(postId, setPost), [postId]);
  return post;
}
```

---

## Security Rules

### Basic Rules Structure
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return request.auth.uid == userId; }
    function isAdmin() { return request.auth.token.admin == true; }

    match /posts/{postId} {
      allow read: if resource.data.status == 'published';
      allow create: if isAuthenticated() && request.resource.data.authorId == request.auth.uid;
      allow update: if isOwner(resource.data.authorId);
      allow delete: if isOwner(resource.data.authorId) || isAdmin();
    }

    match /users/{userId} {
      allow read: if true;
      allow write: if isAuthenticated() && isOwner(userId);
    }

    match /users/{userId}/private/{document=**} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

---

## Authentication

### Phone OTP Authentication (Primary Auth Method)

This project uses Firebase Phone OTP exclusively (no JWT, no email/password).

**Client-side (Expo/React Native):**
```typescript
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

// Send OTP to phone number
async function sendOTP(phoneNumber: string, recaptchaVerifier: any) {
  const provider = new PhoneAuthProvider(auth);
  const verificationId = await provider.verifyPhoneNumber(
    phoneNumber,
    recaptchaVerifier
  );
  return verificationId;
}

// Verify OTP code
async function verifyOTP(verificationId: string, code: string) {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}
```

**Server-side (NestJS with Firebase Admin):**
```typescript
import admin from 'firebase-admin';

// Verify phone OTP token from client
async function verifyPhoneToken(idToken: string) {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  // decodedToken.phone_number contains the verified phone number
  return decodedToken;
}

// Get or create user by phone
async function getOrCreateUserByPhone(phoneNumber: string) {
  try {
    return await admin.auth().getUserByPhoneNumber(phoneNumber);
  } catch (error) {
    // Create new user if not exists
    return admin.auth().createUser({ phoneNumber });
  }
}
```

### Email/Password Auth
```typescript
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const credential = await signInWithEmailAndPassword(auth, email, password);
await signOut(auth);
```

### OAuth Providers
```typescript
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
```

---

## Cloud Functions

```typescript
import { onRequest, onDocumentCreated } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

// HTTP endpoint
export const helloWorld = onRequest((request, response) => {
  response.json({ message: 'Hello!' });
});

// Firestore trigger
export const onPostCreated = onDocumentCreated('posts/{postId}', async (event) => {
  const post = event.data?.data();
  if (!post) return;
  await db.doc(`users/${post.authorId}`).update({
    postCount: FieldValue.increment(1)
  });
});

// Callable function
export const createPost = onCall(async (request) => {
  if (!request.auth) throw new Error('Unauthenticated');
  const postRef = await db.collection('posts').add({
    ...request.data,
    authorId: request.auth.uid,
    created
