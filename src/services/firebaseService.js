import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';

class FirebaseService {
  // Check if company ID exists in Firestore
  static async validateCompanyId(companyId) {
    try {
      const docRef = doc(db, 'companies', companyId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (e) {
      console.error('Error validating company ID:', e);
      return false;
    }
  }

  // Create user account with company ID validation
  static async createUserAccount({
    email,
    password,
    employeeId,
    companyId,
    homeLocation,
    officeLocation,
    distance,
  }) {
    try {
      // First, validate company ID
      const isValidCompany = await this.validateCompanyId(companyId);

      if (!isValidCompany) {
        throw new Error('Company ID not found. Please contact your administrator.');
      }

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Save additional user data to Firestore under the company
      await setDoc(
        doc(db, 'companies', companyId, 'users', userCredential.user.uid),
        {
          email: email,
          employeeId: employeeId,
          companyId: companyId,
          homeLocation: homeLocation,
          officeLocation: officeLocation,
          distance: distance, // Distance in kilometers
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        }
      );

      return userCredential;
    } catch (e) {
      console.error('Error creating user account:', e);
      throw e;
    }
  }

  // Sign in user with company ID validation
  static async signInUser({
    email,
    password,
    employeeId,
    companyId,
  }) {
    try {
      // First, validate company ID
      const isValidCompany = await this.validateCompanyId(companyId);

      if (!isValidCompany) {
        throw new Error('Company ID not found. Please contact your administrator.');
      }

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Verify user exists in the company's user collection
      const userDocRef = doc(db, 'companies', companyId, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await signOut(auth);
        throw new Error('User not found in this company. Please check your credentials.');
      }

      // Verify employee ID matches
      const userData = userDoc.data();
      if (userData.employeeId !== employeeId) {
        await signOut(auth);
        throw new Error('Employee ID does not match. Please check your credentials.');
      }

      // Update last login time
      await updateDoc(userDocRef, {
        lastLogin: serverTimestamp(),
      });

      return userCredential;
    } catch (e) {
      console.error('Error signing in user:', e);
      throw e;
    }
  }

  // Reset password with company ID validation
  static async resetPassword({
    email,
    employeeId,
    companyId,
  }) {
    try {
      // First, validate company ID
      const isValidCompany = await this.validateCompanyId(companyId);

      if (!isValidCompany) {
        throw new Error('Company ID not found. Please contact your administrator.');
      }

      // Find user in the company's user collection
      const usersRef = collection(db, 'companies', companyId, 'users');
      const q = query(
        usersRef,
        where('email', '==', email),
        where('employeeId', '==', employeeId)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('User not found in this company. Please check your credentials.');
      }

      // Send password reset email
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      console.error('Error resetting password:', e);
      throw e;
    }
  }

  // Get current user data from Firestore
  static async getCurrentUserData() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;

      console.log('Getting current user data for user:', currentUser.uid);

      // Find user in any company's user collection
      const companiesQuery = await getDocs(collection(db, 'companies'));

      for (const companyDoc of companiesQuery.docs) {
        const userDocRef = doc(db, 'companies', companyDoc.id, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('Found user data in company:', companyDoc.id, userData);
          return userData;
        }
      }

      console.log('User not found in any company');
      return null;
    } catch (e) {
      console.error('Error getting current user data:', e);
      return null;
    }
  }

  // Sign out user
  static async signOut() {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Error signing out:', e);
      throw e;
    }
  }

  // Check if user is signed in
  static isUserSignedIn() {
    return auth.currentUser !== null;
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Get authentication state listener
  static onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Update user profile data
  static async updateUserProfile({
    email,
    employeeId,
    companyId,
    homeLocation,
    officeLocation,
    distance,
  }) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      console.log('Updating user profile for user:', currentUser.uid);
      console.log('Update data:', { email, employeeId, companyId, homeLocation, officeLocation, distance });

      // Find user in any company's user collection
      const companiesQuery = await getDocs(collection(db, 'companies'));

      for (const companyDoc of companiesQuery.docs) {
        const userDocRef = doc(db, 'companies', companyDoc.id, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          console.log('Found user in company:', companyDoc.id);
          
          // Prepare update data
          const updateData = {
            lastUpdated: serverTimestamp(),
          };

          // Only update fields that are provided
          if (email !== undefined) updateData.email = email;
          if (employeeId !== undefined) updateData.employeeId = employeeId;
          if (companyId !== undefined) updateData.companyId = companyId;
          if (homeLocation !== undefined) updateData.homeLocation = homeLocation;
          if (officeLocation !== undefined) updateData.officeLocation = officeLocation;
          if (distance !== undefined) updateData.distance = distance;

          console.log('Final update data:', updateData);

          // Update user data
          await updateDoc(userDocRef, updateData);

          console.log('Profile updated successfully');

          return {
            success: true,
            message: 'Profile updated successfully'
          };
        }
      }

      throw new Error('User not found in any company');
    } catch (e) {
      console.error('Error updating user profile:', e);
      throw e;
    }
  }

  // Update user location data (for backward compatibility)
  static async updateUserLocation({
    homeLocation,
    officeLocation,
    distance,
  }) {
    return this.updateUserProfile({
      homeLocation,
      officeLocation,
      distance,
    });
  }

  // Save pending business travel
  static async savePendingBusinessTravel(pendingTravel) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      // Find user's company
      const companiesQuery = await getDocs(collection(db, 'companies'));
      let userCompanyId = null;

      for (const companyDoc of companiesQuery.docs) {
        const userDocRef = doc(db, 'companies', companyDoc.id, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          userCompanyId = companyDoc.id;
          break;
        }
      }

      if (!userCompanyId) {
        throw new Error('User not found in any company');
      }

      // Save pending travel to user's pendingTravel collection
      const pendingTravelRef = doc(db, 'companies', userCompanyId, 'users', currentUser.uid, 'pendingTravel', 'current');
      await setDoc(pendingTravelRef, {
        ...pendingTravel,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (e) {
      console.error('Error saving pending business travel:', e);
      throw e;
    }
  }

  // Load pending business travel
  static async loadPendingBusinessTravel() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return null;
      }

      // Find user's company
      const companiesQuery = await getDocs(collection(db, 'companies'));
      let userCompanyId = null;

      for (const companyDoc of companiesQuery.docs) {
        const userDocRef = doc(db, 'companies', companyDoc.id, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          userCompanyId = companyDoc.id;
          break;
        }
      }

      if (!userCompanyId) {
        return null;
      }

      // Load pending travel from user's pendingTravel collection
      const pendingTravelRef = doc(db, 'companies', userCompanyId, 'users', currentUser.uid, 'pendingTravel', 'current');
      const pendingTravelDoc = await getDoc(pendingTravelRef);

      if (pendingTravelDoc.exists()) {
        return pendingTravelDoc.data();
      }

      return null;
    } catch (e) {
      console.error('Error loading pending business travel:', e);
      return null;
    }
  }

  // Submit completed business travel and save to user data
  static async submitCompletedBusinessTravel(completedTravel) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      // Find user's company
      const companiesQuery = await getDocs(collection(db, 'companies'));
      let userCompanyId = null;

      for (const companyDoc of companiesQuery.docs) {
        const userDocRef = doc(db, 'companies', companyDoc.id, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          userCompanyId = companyDoc.id;
          break;
        }
      }

      if (!userCompanyId) {
        throw new Error('User not found in any company');
      }

      // Save completed travel to user's businessTravel collection
      const businessTravelRef = doc(db, 'companies', userCompanyId, 'users', currentUser.uid, 'businessTravel', completedTravel.id.toString());
      await setDoc(businessTravelRef, {
        ...completedTravel,
        submittedAt: serverTimestamp(),
      });

      // Clear pending travel
      const pendingTravelRef = doc(db, 'companies', userCompanyId, 'users', currentUser.uid, 'pendingTravel', 'current');
      await setDoc(pendingTravelRef, { deleted: true });

      return { success: true };
    } catch (e) {
      console.error('Error submitting completed business travel:', e);
      throw e;
    }
  }

  // Load completed business travel records
  static async loadCompletedBusinessTravel() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return [];
      }

      // Find user's company
      const companiesQuery = await getDocs(collection(db, 'companies'));
      let userCompanyId = null;

      for (const companyDoc of companiesQuery.docs) {
        const userDocRef = doc(db, 'companies', companyDoc.id, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          userCompanyId = companyDoc.id;
          break;
        }
      }

      if (!userCompanyId) {
        return [];
      }

      // Load completed business travel records
      const businessTravelRef = collection(db, 'companies', userCompanyId, 'users', currentUser.uid, 'businessTravel');
      const businessTravelQuery = await getDocs(businessTravelRef);

      const completedTravel = [];
      businessTravelQuery.forEach((doc) => {
        if (doc.exists() && !doc.data().deleted) {
          completedTravel.push(doc.data());
        }
      });

      return completedTravel;
    } catch (e) {
      console.error('Error loading completed business travel:', e);
      return [];
    }
  }

  // Delete business travel record
  static async deleteBusinessTravelRecord(recordId) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      // Find user's company
      const companiesQuery = await getDocs(collection(db, 'companies'));
      let userCompanyId = null;

      for (const companyDoc of companiesQuery.docs) {
        const userDocRef = doc(db, 'companies', companyDoc.id, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          userCompanyId = companyDoc.id;
          break;
        }
      }

      if (!userCompanyId) {
        throw new Error('User not found in any company');
      }

      // Mark record as deleted
      const businessTravelRef = doc(db, 'companies', userCompanyId, 'users', currentUser.uid, 'businessTravel', recordId.toString());
      await updateDoc(businessTravelRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (e) {
      console.error('Error deleting business travel record:', e);
      throw e;
    }
  }

  // Save employee commuting record
  static async saveEmployeeCommutingRecord(commutingRecord) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      // Find user's company
      const companiesQuery = await getDocs(collection(db, 'companies'));
      let userCompanyId = null;

      for (const companyDoc of companiesQuery.docs) {
        const userDocRef = doc(db, 'companies', companyDoc.id, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          userCompanyId = companyDoc.id;
          break;
        }
      }

      if (!userCompanyId) {
        throw new Error('User not found in any company');
      }

      // Save commuting record to user's employeeCommuting collection
      const commutingRef = doc(db, 'companies', userCompanyId, 'users', currentUser.uid, 'employeeCommuting', commutingRecord.id.toString());
      await setDoc(commutingRef, {
        ...commutingRecord,
        createdAt: serverTimestamp(),
      });

      return { success: true };
    } catch (e) {
      console.error('Error saving employee commuting record:', e);
      throw e;
    }
  }

  // Load employee commuting records
  static async loadEmployeeCommutingRecords() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return [];
      }

      // Find user's company
      const companiesQuery = await getDocs(collection(db, 'companies'));
      let userCompanyId = null;

      for (const companyDoc of companiesQuery.docs) {
        const userDocRef = doc(db, 'companies', companyDoc.id, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          userCompanyId = companyDoc.id;
          break;
        }
      }

      if (!userCompanyId) {
        return [];
      }

      // Load employee commuting records
      const commutingRef = collection(db, 'companies', userCompanyId, 'users', currentUser.uid, 'employeeCommuting');
      const commutingQuery = await getDocs(commutingRef);

      const commutingRecords = [];
      commutingQuery.forEach((doc) => {
        if (doc.exists() && !doc.data().deleted) {
          commutingRecords.push(doc.data());
        }
      });

      // Sort by date and time (newest first)
      return commutingRecords.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.checkInTime || '00:00'}`);
        const dateB = new Date(`${b.date} ${b.checkInTime || '00:00'}`);
        return dateB - dateA;
      });
    } catch (e) {
      console.error('Error loading employee commuting records:', e);
      return [];
    }
  }

  // Delete employee commuting record
  static async deleteEmployeeCommutingRecord(recordId) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      // Find user's company
      const companiesQuery = await getDocs(collection(db, 'companies'));
      let userCompanyId = null;

      for (const companyDoc of companiesQuery.docs) {
        const userDocRef = doc(db, 'companies', companyDoc.id, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          userCompanyId = companyDoc.id;
          break;
        }
      }

      if (!userCompanyId) {
        throw new Error('User not found in any company');
      }

      // Mark record as deleted
      const commutingRef = doc(db, 'companies', userCompanyId, 'users', currentUser.uid, 'employeeCommuting', recordId.toString());
      await updateDoc(commutingRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (e) {
      console.error('Error deleting employee commuting record:', e);
      throw e;
    }
  }
}

export default FirebaseService; 