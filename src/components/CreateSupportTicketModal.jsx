// src/components/CreateSupportTicketModal.jsx
import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";
import emailjs from "emailjs-com";

export default function CreateSupportTicketModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("general");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPriority, setTicketPriority] = useState("normal");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTicketId, setLastTicketId] = useState("");

  if (!isOpen) return null;

  const resetForm = () => {
    setTicketSubject("");
    setTicketCategory("general");
    setTicketMessage("");
    setTicketPriority("normal");
    setShowSuccess(false);
    setLastTicketId("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const submitTicket = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to submit a support ticket.");
      return;
    }

    if (!firebaseInitialized || !db) {
      alert("Firebase is not configured. Please set up your .env file first.");
      return;
    }

    setTicketSubmitting(true);
    try {
      const ticketData = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email,
        subject: ticketSubject,
        category: ticketCategory,
        message: ticketMessage,
        priority: ticketPriority,
        status: "open",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const ticketRef = await addDoc(collection(db, "supportTickets"), ticketData);
      setLastTicketId(ticketRef.id);

      // Send email notification
      try {
        await emailjs.send(
          "growthwithcoding",
          "template_rbwljrc",
          {
            user_name: user.displayName || user.email,
            user_email: user.email,
            message: `Support Ticket #${Date.now()}\n\nCategory: ${ticketCategory}\nPriority: ${ticketPriority}\nSubject: ${ticketSubject}\n\n${ticketMessage}`,
          },
          "kUx5fdVefCjNVQZUS"
        );
      } catch (emailErr) {
        console.error("Failed to send ticket email:", emailErr);
      }

      setShowSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Failed to submit ticket:", err);
      alert("Failed to submit ticket. Please try again.");
    } finally {
      setTicketSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={handleClose}>
      <div className="modal" style={{ maxWidth: 720, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        {!showSuccess ? (
          <>
            <h2 style={{ marginTop: 0 }}>Create Support Ticket</h2>
            <p className="meta" style={{ marginBottom: 20 }}>
              Our support team typically responds within 24 hours. For urgent matters, please call us directly.
            </p>

            <form className="grid" style={{ gap: 12 }} onSubmit={submitTicket}>
              <label className="field">
                <div className="meta" style={{ fontWeight: 600 }}>Subject *</div>
                <input
                  className="input"
                  type="text"
                  placeholder="Brief description of your issue"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  required
                  autoFocus
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label className="field">
                  <div className="meta" style={{ fontWeight: 600 }}>Category *</div>
                  <select
                    className="select"
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    required
                  >
                    <option value="general">General Inquiry</option>
                    <option value="order">Order Issue</option>
                    <option value="shipping">Shipping & Delivery</option>
                    <option value="return">Returns & Refunds</option>
                    <option value="product">Product Question</option>
                    <option value="account">Account & Login</option>
                    <option value="payment">Payment Issue</option>
                    <option value="technical">Technical Support</option>
                  </select>
                </label>

                <label className="field">
                  <div className="meta" style={{ fontWeight: 600 }}>Priority</div>
                  <select
                    className="select"
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
              </div>

              <label className="field">
                <div className="meta" style={{ fontWeight: 600 }}>Message *</div>
                <textarea
                  className="textarea"
                  rows="6"
                  placeholder="Please provide as much detail as possible about your issue..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  required
                />
              </label>

              <div className="actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                  disabled={ticketSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={ticketSubmitting}
                >
                  {ticketSubmitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h3 style={{ margin: "0 0 8px" }}>Ticket Submitted Successfully!</h3>
              <p className="meta" style={{ marginBottom: 16 }}>
                Your support ticket has been created. We'll respond within 24 hours.
              </p>
              <div className="card" style={{ padding: 12, background: "#f9fafb", marginBottom: 16 }}>
                <div className="meta" style={{ fontSize: 12 }}>Ticket ID</div>
                <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600 }}>
                  {lastTicketId.slice(0, 8).toUpperCase()}
                </div>
              </div>
              <p className="meta" style={{ fontSize: 12 }}>
                You can view and track your ticket in the "Support Tickets" section below.
              </p>
            </div>
            <div className="actions" style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button 
                className="btn btn-primary" 
                onClick={handleClose}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
