# Firebase Extended Reference

Extended examples and detailed patterns moved from SKILL.md.

---

## Extended TypeScript SDK Examples

### Complete CRUD with Error Handling

```typescript
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Create with error handling
async function createPostWithValidation(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'posts'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Document written with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating document:', error);
    throw new Error('Failed to create post');
  }
}

// Read with caching strategy
async function getPostWithCache(postId: string): Promise<Post | null> {
  try {
    const docRef = doc(db, 'posts', postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log('No such document!');
      return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() } as Post;
  } catch (error) {
    console.error('Error reading document:', error);
    throw error;
  }
}

// Advanced query with multiple filters
async function getFilteredPosts(
  authorId: string,
  status: 'draft' | 'published',
  tags: string[],
  pageSize = 10
) {
  let q = query(
    collection(db, 'posts'),
    where('authorId', '==', authorId),
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
}

// Cursor-based pagination for large datasets
async function paginatePosts(
  lastDoc: DocumentSnapshot | null,
  pageSize = 10
): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

  return { posts, lastDoc: newLastDoc };
}
```

### Advanced Real-time Listeners

```typescript
import { 
  onSnapshot, 
  QuerySnapshot, 
  DocumentSnapshot,
  DocumentChange 
} from 'firebase/firestore';

// Optimized listener with change tracking
function subscribeToPostsOptimized(
  authorId: string,
  callbacks: {
    onAdded: (posts: Post[]) => void;
    onModified: (posts: Post[]) => void;
    onRemoved: (postIds: string[]) => void;
    onError: (error: Error) => void;
  }
) {
  const q = query(
    collection(db, 'posts'),
    where('authorId', '==', authorId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot: QuerySnapshot) => {
      const added: Post[] = [];
      const modified: Post[] = [];
      const removed: string[] = [];

      snapshot.docChanges().forEach((change: DocumentChange) => {
        const post = { id: change.doc.id, ...change.doc.data() } as Post;
        
        switch (change.type) {
          case 'added':
            added.push(post);
            break;
          case 'modified':
            modified.push(post);
            break;
          case 'removed':
            removed.push(change.doc.id);
            break;
        }
      });

      if (added.length) callbacks.onAdded(added);
      if (modified.length) callbacks.onModified(modified);
      if (removed.length) callbacks.onRemoved(removed);
    },
    callbacks.onError
  );
}

// React hook with optimistic updates
function useOptimisticPosts(userId: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const optimisticUpdates = useRef<Map<string, Partial<Post>>>(new Map());

  useEffect(() => {
    const unsubscribe = subscribeToPostsOptimized(
      userId,
      {
        onAdded: (newPosts) => {
          setPosts(prev => [...newPosts, ...prev].filter(
            (p, i, arr) => arr.findIndex(t => t.id === p.id) === i
          ));
          setLoading(false);
        },
        onModified: (modifiedPosts) => {
          setPosts(prev => prev.map(p => {
            const modified = modifiedPosts.find(m => m.id === p.id);
            return modified ? { ...p, ...modified } : p;
          }));
        },
        onRemoved: (removedIds) => {
          setPosts(prev => prev.filter(p => !removedIds.includes(p.id)));
        },
        onError: (err) => {
          setError(err);
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, [userId]);

  return { posts, loading, error };
}
```

### Offline Persistence Deep Dive

```typescript
import { 
  enableIndexedDbPersistence, 
  enableMultiTabIndexedDbPersistence,
  waitForPendingWrites,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';

// Multi-tab persistence (recommended for most apps)
async function setupMultiTabPersistence() {
  try {
    await enableMultiTabIndexedDbPersistence(db);
    console.log('Multi-tab persistence enabled');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence can only be enabled in one tab at a time');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support persistence');
    }
  }
}

// Manual network control
async function goOffline() {
  await disableNetwork(db);
  console.log('Network disabled - working offline');
}

async function goOnline() {
  await enableNetwork(db);
  console.log('Network enabled');
}

// Wait for pending writes before navigation
async function waitForSync() {
  try {
    await waitForPendingWrites(db);
    console.log('All pending writes synced');
  } catch (error) {
    console.error('Error waiting for pending writes:', error);
  }
}

// Monitor sync state
function monitorSyncState(docRef: DocumentReference) {
  return onSnapshot(docRef, {
    includeMetadataChanges: true
  }, (snapshot) => {
    if (!snapshot.metadata.fromCache) {
      console.log('Data synced with server');
    }
    if (snapshot.metadata.hasPendingWrites) {
      console.log('Local changes pending...');
    }
  });
}
```

---

## Extended Security Rules

### Complex Validation Patterns

```javascript
// firestore.rules - Extended Examples
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============ Helper Functions ============
    
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function isAdmin() {
      return request.auth.token.admin == true;
    }

    function isModerator() {
      return request.auth.token.moderator == true;
    }

    function isEmailVerified() {
      return request.auth.token.email_verified == true;
    }

    // ============ Validation Helpers ============

    function isValidString(field, minLen, maxLen) {
      return field is string 
        && field.size() >= minLen 
        && field.size() <= maxLen;
    }

    function isValidEmail(email) {
      return email is string
        && email.matches('^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$');
    }

    function isValidTimestamp(field) {
      return field is timestamp || field == null;
    }

    function isValidUrl(url) {
      return url is string
        && url.matches('^https?://.+');
    }

    function isValidTags(tags, maxTags) {
      return tags is list
        && tags.size() <= maxTags
        && tags.hasAll([tag is string && tag.size() <= 30 for tag in tags]);
    }

    // ============ Collection Rules ============

    // Posts with comprehensive validation
    match /posts/{postId} {
      function isValidPost() {
        let data = request.resource.data;
        return isValidString(data.title, 3, 100)
          && isValidString(data.content, 1, 50000)
          && data.authorId == request.auth.uid
          && (data.status == null || data.status in ['draft', 'published', 'archived'])
          && isValidTags(data.tags, 10)
          && isValidTimestamp(data.createdAt)
          && isValidTimestamp(data.updatedAt);
      }

      function canUpdatePost() {
        let data = request.resource.data;
        // Can't change author
        return data.authorId == resource.data.authorId
          // Can't edit archived posts
          && resource.data.status != 'archived'
          // Only admins can change to/from published
          && (data.status == resource.data.status || isAdmin());
      }

      allow read: if resource.data.status == 'published' 
        || (isAuthenticated() && isOwner(resource.data.authorId));
      
      allow create: if isAuthenticated() 
        && isValidPost()
        && (!request.resource.data.status.hasAny(['published']) || isEmailVerified());
      
      allow update: if isAuthenticated() 
        && isOwner(resource.data.authorId)
        && isValidPost()
        && canUpdatePost();
      
      allow delete: if isAuthenticated() 
        && (isOwner(resource.data.authorId) || isAdmin());

      // Comments subcollection
      match /comments/{commentId} {
        function isValidComment() {
          let data = request.resource.data;
          return isValidString(data.text, 1, 2000)
            && data.authorId == request.auth.uid
            && data.postId == postId;
        }

        allow read: if true;
        allow create: if isAuthenticated() && isValidComment();
        allow update: if isAuthenticated() 
          && isOwner(resource.data.authorId)
          && request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['text', 'updatedAt', 'edited']);
        allow delete: if isAuthenticated() 
          && (isOwner(resource.data.authorId) || isAdmin() || isModerator());
      }

      // Likes subcollection
      match /likes/{userId} {
        allow read: if true;
        allow create: if isAuthenticated() && userId == request.auth.uid;
        allow delete: if isAuthenticated() && userId == request.auth.uid;
      }
    }

    // User profiles with tiered access
    match /users/{userId} {
      function isValidUser() {
        let data = request.resource.data;
        return isValidString(data.displayName, 1, 50)
          && (data.bio == null || isValidString(data.bio, 0, 500))
          && (data.photoURL == null || isValidUrl(data.photoURL));
      }

      allow read: if true;
      allow create: if isAuthenticated() 
        && isOwner(userId)
        && isValidUser()
        && request.resource.data.createdAt == request.time;
      allow update: if isAuthenticated() 
        && isOwner(userId)
        && isValidUser()
        && (!request.resource.data.keys().hasAny(['role', 'admin', 'moderator']) || isAdmin());
      allow delete: if isAdmin();
    }

    // Private user data - owner only
    match /users/{userId}/private/{document=**} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }

    // Settings - owner only
    match /users/{userId}/settings/{document=**} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }

    // Organizations
    match /organizations/{orgId} {
      allow read: if isAuthenticated() 
        && (resource.data.members[request.auth.uid] != null || isAdmin());
      
      allow create: if isAuthenticated() 
        && request.resource.data.owner == request.auth.uid
        && request.resource.data.members[request.auth.uid] == 'owner';
      
      allow update: if isAuthenticated() 
        && (resource.data.members[request.auth.uid] in ['owner', 'admin'] || isAdmin());
      
      allow delete: if isAuthenticated() 
        && (resource.data.owner == request.auth.uid || isAdmin());
    }

    // Rate limiting document
    match /rateLimits/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow write: if false; // Written only by server
    }
  }
}
```

### Security Rules Testing

```typescript
// tests/firestore.rules.test.ts - Extended Test Suite
import { 
  assertFails, 
  assertSucceeds, 
  initializeTestEnvironment,
  RulesTestEnvironment,
  RulesTestContext
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import * as fs from 'fs';

describe('Firestore Security Rules - Extended', () => {
  let testEnv: RulesTestEnvironment;
  let unauthedDb: RulesTestContext;
  let aliceDb: RulesTestContext;
  let bobDb: RulesTestContext;
  let adminDb: RulesTestContext;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: { 
        rules: fs.readFileSync('firestore.rules', 'utf8'),
        host: 'localhost',
        port: 8080
      }
    });

    unauthedDb = testEnv.unauthenticatedContext();
    aliceDb = testEnv.authenticatedContext('alice', { email_verified: true });
    bobDb = testEnv.authenticatedContext('bob');
    adminDb = testEnv.authenticatedContext('admin', { admin: true });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('Posts', () => {
    test('unauthenticated users cannot create posts', async () => {
      await assertFails(
        setDoc(doc(unauthedDb.firestore(), 'posts/test'), {
          title: 'Test Post',
          content: 'Content',
          authorId: 'alice'
        })
      );
    });

    test('authenticated users can create valid posts', async () => {
      await assertSucceeds(
        setDoc(doc(aliceDb.firestore(), 'posts/alice-post'), {
          title: 'My Post',
          content: 'Post content',
          authorId: 'alice',
          status: 'draft',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        })
      );
    });

    test('users cannot create posts with invalid data', async () => {
      // Title too short
      await assertFails(
        setDoc(doc(aliceDb.firestore(), 'posts/bad-post'), {
          title: 'Hi',
          content: 'Content',
          authorId: 'alice'
        })
      );

      // Wrong author
      await assertFails(
        setDoc(doc(aliceDb.firestore(), 'posts/spoofed'), {
          title: 'Valid Title',
          content: 'Content',
          authorId: 'bob' // Not alice!
        })
      );

      // Too many tags
      await assertFails(
        setDoc(doc(aliceDb.firestore(), 'posts/too-many-tags'), {
          title: 'Valid Title',
          content: 'Content',
          authorId: 'alice',
          tags: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
        })
      );
    });

    test('only author or admin can delete posts', async () => {
      // Alice creates a post
      await setDoc(doc(aliceDb.firestore(), 'posts/to-delete'), {
        title: 'Delete Me',
        content: 'Content',
        authorId: 'alice'
      });

      // Bob cannot delete
      await assertFails(
        deleteDoc(doc(bobDb.firestore(), 'posts/to-delete'))
      );

      // Admin can delete
      await assertSucceeds(
        deleteDoc(doc(adminDb.firestore(), 'posts/to-delete'))
      );
    });
  });

  describe('Comments', () => {
    beforeEach(async () => {
      // Create parent post
      await setDoc(doc(aliceDb.firestore(), 'posts/parent-post'), {
        title: 'Parent',
        content: 'Content',
        authorId: 'alice',
        status: 'published'
      });
    });

    test('anyone can read comments', async () => {
      await assertSucceeds(
        getDoc(doc(unauthedDb.firestore(), 'posts/parent-post/comments/comment1'))
      );
    });

    test('authenticated users can add comments', async () => {
      await assertSucceeds(
        setDoc(doc(bobDb.firestore(), 'posts/parent-post/comments/bob-comment'), {
          text: 'Great post!',
          authorId: 'bob',
          postId: 'parent-post',
          createdAt: new Date()
        })
      );
    });
  });

  describe('User Profiles', () => {
    test('users can only update their own profile', async () => {
      // Alice creates her profile
      await setDoc(doc(aliceDb.firestore(), 'users/alice'), {
        displayName: 'Alice',
        bio: 'Hello',
        createdAt: new Date()
      });

      // Bob cannot edit Alice's profile
      await assertFails(
        updateDoc(doc(bobDb.firestore(), 'users/alice'), {
          bio: 'Hacked!'
        })
      );

      // Alice can edit her own
      await assertSucceeds(
        updateDoc(doc(aliceDb.firestore(), 'users/alice'), {
          bio: 'Updated bio'
        })
      );
    });

    test('only admins can modify role fields', async () => {
      await setDoc(doc(aliceDb.firestore(), 'users/alice'), {
        displayName: 'Alice',
        role: 'user'
      });

      // Alice cannot make herself admin
      await assertFails(
        updateDoc(doc(aliceDb.firestore(), 'users/alice'), {
          role: 'admin'
        })
      );

      // Admin can change roles
      await assertSucceeds(
        updateDoc(doc(adminDb.firestore(), 'users/alice'), {
          role: 'moderator'
        })
      );
    });
  });
});
```

---

## Extended Cloud Functions

### Firestore Triggers

```typescript
// functions/src/triggers.ts
import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

// On post created - update author's stats
export const onPostCreated = onDocumentCreated('posts/{postId}', async (event) => {
  const post = event.data?.data();
  if (!post) return;

  const authorRef = db.doc(`users/${post.authorId}`);
  
  await authorRef.update({
    postCount: FieldValue.increment(1),
    lastPostAt: FieldValue.serverTimestamp()
  });

  // Create activity log
  await db.collection('activities').add({
    type: 'post_created',
    userId: post.authorId,
    postId: event.params.postId,
    createdAt: FieldValue.serverTimestamp()
  });
});

// On post updated - handle status changes
export const onPostUpdated = onDocumentUpdated('posts/{postId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  
  if (!before || !after) return;

  // Handle publish event
  if (before.status !== 'published' && after.status === 'published') {
    // Notify followers
    const followers = await db.collection(`users/${after.authorId}/followers`).get();
    
    const notifications = followers.docs.map(follower => ({
      userId: follower.id,
      type: 'new_post',
      postId: event.params.postId,
      authorId: after.authorId,
      createdAt: FieldValue.serverTimestamp()
    }));

    // Batch write notifications
    const batch = db.batch();
    notifications.forEach(notification => {
      const ref = db.collection('notifications').doc();
      batch.set(ref, notification);
    });
    
    await batch.commit();
  }
});

// On post deleted - cleanup related data
export const onPostDeleted = onDocumentDeleted('posts/{postId}', async (event) => {
  const post = event.data?.data();
  if (!post) return;

  const batch = db.batch();
  const postId = event.params.postId;

  // Delete all comments
  const comments = await db.collection(`posts/${postId}/comments`).get();
  comments.docs.forEach(doc => batch.delete(doc.ref));

  // Delete all likes
  const likes = await db.collection(`posts/${postId}/likes`).get();
  likes.docs.forEach(doc => batch.delete(doc.ref));

  // Update author stats
  batch.update(db.doc(`users/${post.authorId}`), {
    postCount: FieldValue.increment(-1)
  });

  await batch.commit();
});
```

### Scheduled Functions

```typescript
// functions/src/scheduled.ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

// Daily cleanup of expired data
export const dailyCleanup = onSchedule('0 2 * * *', async (event) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  // Delete old notifications
  const oldNotifications = await db
    .collection('notifications')
    .where('createdAt', '<', cutoff)
    .limit(500)
    .get();

  const batch = db.batch();
  oldNotifications.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  console.log(`Deleted ${oldNotifications.size} old notifications`);
});

// Weekly analytics aggregation
export const weeklyAnalytics = onSchedule('0 3 * * 0', async (event) => {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  weekStart.setHours(0, 0, 0, 0);

  // Aggregate post statistics
  const postsSnapshot = await db
    .collection('posts')
    .where('createdAt', '>=', weekStart)
    .get();

  const stats = {
    totalPosts: postsSnapshot.size,
    totalLikes: 0,
    totalComments: 0,
    weekStart: weekStart,
    createdAt: new Date()
  };

  for (const postDoc of postsSnapshot.docs) {
    const likes = await db.collection(`posts/${postDoc.id}/likes`).count().get();
    const comments = await db.collection(`posts/${postDoc.id}/comments`).count().get();
    
    stats.totalLikes += likes.data().count;
    stats.totalComments += comments.data().count;
  }

  await db.collection('analytics').add(stats);
});
```

---

## Extended Authentication Patterns

### Email/Password with Full Flow

```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth } from './firebase';

// Sign up with profile
async function signUpWithProfile(
  email: string, 
  password: string, 
  displayName: string
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Update profile
  await updateProfile(user, { displayName });

  // Send verification email
  await sendEmailVerification(user);

  return user;
}

// Change password (requires reauth)
async function changePassword(
  currentPassword: string, 
  newPassword: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No authenticated user');

  // Reauthenticate
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // Update password
  await updatePassword(user, newPassword);
}

// Password reset
async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// React auth hook with loading states
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        setError(error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { user, loading, error };
}
```

### OAuth with Account Linking

```typescript
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  linkWithPopup,
  unlink
} from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');

async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Check if this is a new user
    const isNewUser = result.additionalUserInfo?.isNewUser;
    
    if (isNewUser) {
      // Create user profile in Firestore
      await createUserProfile(result.user);
    }
    
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/account-exists-with-different-credential') {
      // Handle account linking
      const pendingCred = GoogleAuthProvider.credentialFromError(error);
      const email = error.customData?.email;
      
      // Get existing providers for this email
      // Prompt user to link accounts
      throw new Error('Account exists with different provider. Please sign in with that provider first.');
    }
    throw error;
  }
}

// Link Google to existing account
async function linkGoogleAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const result = await linkWithPopup(user, googleProvider);
    console.log('Account linked:', result);
  } catch (error) {
    console.error('Linking failed:', error);
    throw error;
  }
}

// Unlink provider
async function unlinkProvider(providerId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await unlink(user, providerId);
}
```

---

## Firebase Admin SDK Patterns

### Admin Initialization

```typescript
// lib/firebase-admin.ts
import admin from 'firebase-admin';

// Initialize with service account
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();

// Admin auth operations
export async function getUserByPhone(phoneNumber: string) {
  try {
    return await auth.getUserByPhoneNumber(phoneNumber);
  } catch (error) {
    return null;
  }
}

export async function createUser(data: {
  phoneNumber?: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}) {
  return auth.createUser(data);
}

export async function setCustomClaims(uid: string, claims: object) {
  await auth.setCustomUserClaims(uid, claims);
}
```

### Admin Firestore Operations

```typescript
// Batch operations with admin SDK
import { FieldValue } from 'firebase-admin/firestore';

async function adminBatchUpdate(
  collection: string,
  updates: { id: string; data: any }[]
) {
  const batch = db.batch();
  
  updates.forEach(({ id, data }) => {
    const ref = db.collection(collection).doc(id);
    batch.update(ref, {
      ...data,
      updatedAt: FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
}

// Collection group queries
async function findAllCommentsByUser(userId: string) {
  const snapshot = await db
    .collectionGroup('comments')
    .where('authorId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    path: doc.ref.path,
    ...doc.data()
  }));
}

// Aggregate queries
async function getUserStats(userId: string) {
  const postsCount = await db
    .collection('posts')
    .where('authorId', '==', userId)
    .count()
    .get();

  const commentsCount = await db
    .collectionGroup('comments')
    .where('authorId', '==', userId)
    .count()
    .get();

  return {
    posts: postsCount.data().count,
    comments: commentsCount.data().count
  };
}
```

---

## Performance Optimization

### Query Optimization

```typescript
// Use field masks to reduce data transfer
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Bad: Reads entire document
const badSnapshot = await getDoc(doc(db, 'users', userId));

// Good: Use Firestore Lite for read-only data
import { initializeFirestore, getFirestore, doc, getDoc } from 'firebase/firestore/lite';

const liteDb = initializeFirestore(app, {
  localCache: undefined // No persistence for truly read-only
});

// Better: Structure data for query patterns
interface PostSummary {
  id: string;
  title: string;
  authorName: string;
  likeCount: number;
  createdAt: Timestamp;
}

// Separate summary from details
// /posts/{postId} - minimal data for lists
// /posts/{postId}/content - full content

// Compound queries with indexes
async function getFilteredPostsOptimized(
  category: string,
  tags: string[],
  limit = 20
) {
  // Single field index on category
  // Composite index on (category ASC, createdAt DESC)
  // Array index on tags
  
  const q = query(
    collection(db, 'posts'),
    where('category', '==', category),
    where('tags', 'array-contains-any', tags.slice(0, 10)),
    orderBy('createdAt', 'desc'),
    limit(limit)
  );

  return getDocs(q);
}
```

### Caching Strategies

```typescript
// Custom cache layer
class FirestoreCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(pattern?: RegExp) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new FirestoreCache();

// Usage with stale-while-revalidate
async function getCachedPost(postId: string): Promise<Post> {
  const cacheKey = `post:${postId}`;
  const cached = cache.get(cacheKey);

  // Return cached immediately if available
  if (cached) {
    // Trigger background refresh
    refreshPost(postId);
    return cached;
  }

  // Fetch fresh data
  const post = await getPost(postId);
  cache.set(cacheKey, post);
  return post;
}

async function refreshPost(postId: string) {
  const post = await getPost(postId);
  cache.set(`post:${postId}`, post);
}
```

---

*See [SKILL.md](../SKILL.md) for core Firebase patterns and quick reference.*
