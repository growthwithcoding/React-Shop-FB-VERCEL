// src/services/ticketService.js
import { collection, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";

// Helper to get collection reference (delayed evaluation)
const getTicketsCol = () => {
  if (!firebaseInitialized || !db) {
    throw new Error("Firebase is not initialized");
  }
  return collection(db, "supportTickets");
};

/**
 * Fetch all tickets for a specific user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of ticket objects
 */
export async function getUserTickets(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const ticketsRef = getTicketsCol();
    const q = query(
      ticketsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    const tickets = [];
    
    snapshot.forEach((doc) => {
      tickets.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return tickets;
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    throw error;
  }
}

/**
 * Fetch only open or in-progress tickets for a specific user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of open/in-progress ticket objects
 */
export async function getUserOpenTickets(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const ticketsRef = getTicketsCol();
    // Fetch all tickets and filter in memory to avoid composite index
    const q = query(
      ticketsRef,
      where("userId", "==", userId)
    );
    
    const snapshot = await getDocs(q);
    const tickets = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Only include open and in_progress tickets
      if (data.status === "open" || data.status === "in_progress") {
        tickets.push({
          id: doc.id,
          ...data,
        });
      }
    });
    
    // Sort by creation date descending
    tickets.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
    
    return tickets;
  } catch (error) {
    console.error("Error fetching user open tickets:", error);
    throw error;
  }
}

/**
 * Update a support ticket
 * @param {string} ticketId - The ticket's ID
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<void>}
 */
export async function updateTicket(ticketId, updates) {
  if (!ticketId) {
    throw new Error("Ticket ID is required");
  }

  try {
    const ticketRef = doc(db, "supportTickets", ticketId);
    await updateDoc(ticketRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    throw error;
  }
}

/**
 * Mark a ticket as read
 * @param {string} ticketId - The ticket's ID
 * @returns {Promise<void>}
 */
export async function markTicketAsRead(ticketId) {
  if (!ticketId) {
    throw new Error("Ticket ID is required");
  }

  try {
    const ticketRef = doc(db, "supportTickets", ticketId);
    await updateDoc(ticketRef, {
      isRead: true,
      readAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error marking ticket as read:", error);
    throw error;
  }
}

/**
 * Mark a ticket as unread
 * @param {string} ticketId - The ticket's ID
 * @returns {Promise<void>}
 */
export async function markTicketAsUnread(ticketId) {
  if (!ticketId) {
    throw new Error("Ticket ID is required");
  }

  try {
    const ticketRef = doc(db, "supportTickets", ticketId);
    await updateDoc(ticketRef, {
      isRead: false,
      readAt: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error marking ticket as unread:", error);
    throw error;
  }
}
