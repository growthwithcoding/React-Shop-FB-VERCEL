// src/pages/TicketDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useNavbarHeight } from "../hooks/useNavbarHeight";
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, addDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, firebaseInitialized } from "../lib/firebase";
import { Clock, User, AlertCircle, ArrowLeft, Send, Paperclip, X, Download, CheckCircle, MessageSquare, Shield, Package, Info, StickyNote, Users } from "lucide-react";
import ActionModal from "../components/ActionModal";

export default function TicketDetail() {
  const { ticketId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const navbarHeight = useNavbarHeight();
  
  const [ticket, setTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Form state
  const [replyMessage, setReplyMessage] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "confirm",
    variant: "default",
    title: "",
    message: "",
    confirmText: "Confirm",
    showInput: false,
    inputValue: "",
    onConfirm: null,
  });
  
  const openModal = (config) => {
    setModalState({ ...modalState, isOpen: true, ...config });
  };
  
  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false, inputValue: "" });
  };
  
  const isAdmin = user?.role === "admin";
  const isAgent = user?.role === "agent";
  const isStaff = isAdmin || isAgent;
  
  // Check if ticket has been read by staff
  const hasBeenReadByStaff = ticket?.readBy?.some(userId => 
    userId !== ticket?.userId
  );
  
  // Load ticket and replies
  useEffect(() => {
    async function loadTicket() {
      if (!firebaseInitialized || !db || !ticketId) {
        setError("Firebase not initialized");
        setLoading(false);
        return;
      }
      
      try {
        // Get ticket
        const ticketRef = doc(db, "supportTickets", ticketId);
        const ticketSnap = await getDoc(ticketRef);
        
        if (!ticketSnap.exists()) {
          setError("Ticket not found");
          setLoading(false);
          return;
        }
        
        const ticketData = { id: ticketSnap.id, ...ticketSnap.data() };
        setTicket(ticketData);
        
        // Load replies
        const repliesQuery = query(
          collection(db, "ticketReplies"),
          where("ticketId", "==", ticketId),
          orderBy("createdAt", "asc")
        );
        const repliesSnap = await getDocs(repliesQuery);
        const repliesData = repliesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReplies(repliesData);
        
        // Mark as read by current user if staff
        if (isStaff && !ticketData.readBy?.includes(user.uid)) {
          await updateDoc(ticketRef, {
            readBy: arrayUnion(user.uid),
            isRead: true,
            readAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setTicket(prev => ({
            ...prev,
            readBy: [...(prev.readBy || []), user.uid],
            isRead: true
          }));
        }
        
      } catch (err) {
        console.error("Error loading ticket:", err);
        setError(err.message || "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    }
    
    loadTicket();
  }, [ticketId, user, isStaff]);
  
  // Handle file upload
  const handleFileUpload = async (files) => {
    if (!storage) {
      throw new Error("Storage not initialized");
    }
    
    const uploadedFiles = [];
    
    for (const file of files) {
      const fileRef = ref(storage, `tickets/${ticketId}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      uploadedFiles.push({
        name: file.name,
        url,
        size: file.size,
        type: file.type,
      });
    }
    
    return uploadedFiles;
  };
  
  // Handle reply submission
  const handleReply = async (e) => {
    e.preventDefault();
    
    if (!replyMessage.trim() && replyFiles.length === 0) {
      setError("Please enter a message or attach files");
      return;
    }
    
    setSubmitting(true);
    setError("");
    
    try {
      // Upload files if any
      let attachments = [];
      if (replyFiles.length > 0) {
        attachments = await handleFileUpload(replyFiles);
      }
      
      // Create reply
      const replyData = {
        ticketId,
        userId: user.uid,
        userName: user.displayName || user.email,
        userEmail: user.email,
        userRole: user.role || "customer",
        message: replyMessage.trim(),
        attachments,
        createdAt: serverTimestamp(),
      };
      
      const replyRef = await addDoc(collection(db, "ticketReplies"), replyData);
      
      // Update ticket
      await updateDoc(doc(db, "supportTickets", ticketId), {
        updatedAt: serverTimestamp(),
        lastReplyAt: serverTimestamp(),
        lastReplyBy: user.uid,
      });
      
      // Add reply to local state
      setReplies(prev => [...prev, { id: replyRef.id, ...replyData }]);
      setReplyMessage("");
      setReplyFiles([]);
      
    } catch (err) {
      console.error("Error adding reply:", err);
      setError(err.message || "Failed to add reply");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle status change
  const handleStatusChange = async (newStatus) => {
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "supportTickets", ticketId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      setTicket(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div style={{ maxWidth: 1500, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
          <p style={{ color: "#565959", fontSize: 14 }}>Loading ticket details...</p>
        </div>
      </div>
    );
  }
  
  if (error && !ticket) {
    return (
      <div style={{ maxWidth: 1500, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ 
          background: "#fff", 
          border: "1px solid #ddd", 
          borderRadius: 8, 
          padding: 48,
          textAlign: "center" 
        }}>
          <AlertCircle style={{ width: 48, height: 48, margin: "0 auto 16px", color: "#c7511f" }} />
          <h2 style={{ fontSize: 24, marginBottom: 8, color: "#0F1111" }}>Unable to Load Ticket</h2>
          <p style={{ color: "#565959", marginBottom: 24, fontSize: 14 }}>{error}</p>
          <button 
            onClick={() => navigate(-1)}
            style={{
              background: "#FFD814",
              border: "1px solid #FCD200",
              borderRadius: 8,
              padding: "8px 24px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              color: "#0F1111"
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  const statusConfig = {
    open: { 
      label: "Open", 
      color: "#007185", 
      bg: "#E6F2F5",
      icon: <Package className="w-4 h-4" />
    },
    in_progress: { 
      label: "In Progress", 
      color: "#F08804", 
      bg: "#FEF5E7",
      icon: <Clock className="w-4 h-4" />
    },
    resolved: { 
      label: "Resolved", 
      color: "#067D62", 
      bg: "#E8F5F2",
      icon: <CheckCircle className="w-4 h-4" />
    },
    closed: { 
      label: "Closed", 
      color: "#565959", 
      bg: "#F3F3F3",
      icon: <Shield className="w-4 h-4" />
    },
  };
  
  const priorityConfig = {
    low: { label: "Low Priority", color: "#007185", bg: "#E6F2F5" },
    normal: { label: "Normal Priority", color: "#067D62", bg: "#E8F5F2" },
    high: { label: "High Priority", color: "#F08804", bg: "#FEF5E7" },
    urgent: { label: "Urgent Priority", color: "#c7511f", bg: "#FCE9E6" },
  };
  
  const currentStatus = statusConfig[ticket.status] || statusConfig.open;
  const currentPriority = priorityConfig[ticket.priority] || priorityConfig.normal;
  
  return (
    <>
      {/* Breadcrumb Navigation */}
      <div 
        data-breadcrumb-nav
        style={{ 
          background: "#EAEDED", 
          borderBottom: "1px solid #D5D9D9", 
          position: "sticky", 
          top: `${navbarHeight}px`,
          zIndex: 50
        }}
      >
        <div style={{ maxWidth: 1500, margin: "0 auto", padding: "12px 24px" }}>
          <button 
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              color: "#007185",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: 0,
              fontWeight: 400
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Back to Support Dashboard
          </button>
        </div>
      </div>
      
      <div style={{ background: "#F7F8F8", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1500, margin: "0 auto", padding: "24px 24px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 24 }}>
          {/* Main Content */}
          <div>
            {/* Ticket Header Card */}
            <div style={{ 
              background: "#fff", 
              border: "1px solid #D5D9D9", 
              borderRadius: 8,
              padding: 24,
              marginBottom: 16
            }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: currentStatus.bg,
                  color: currentStatus.color,
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${currentStatus.color}20`
                }}>
                  {currentStatus.icon}
                  {currentStatus.label}
                </span>
                
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 12px",
                  background: currentPriority.bg,
                  color: currentPriority.color,
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  border: `1px solid ${currentPriority.color}20`
                }}>
                  {currentPriority.label}
                </span>
                
                {hasBeenReadByStaff && (
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    background: "#E8F5F2",
                    color: "#067D62",
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 600,
                    border: "1px solid #067D6220"
                  }}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Reviewed by Support
                  </span>
                )}
              </div>
              
              <h1 style={{ 
                fontSize: 28,
                fontWeight: 400,
                color: "#0F1111",
                marginBottom: 12,
                lineHeight: 1.3
              }}>
                {ticket.subject}
              </h1>
              
              <div style={{ 
                display: "flex", 
                gap: 12, 
                fontSize: 14, 
                color: "#565959",
                flexWrap: "wrap",
                alignItems: "center"
              }}>
                <span>Ticket #{ticket.id.slice(0, 8).toUpperCase()}</span>
                <span style={{ color: "#D5D9D9" }}>|</span>
                <span>{ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}</span>
                <span style={{ color: "#D5D9D9" }}>|</span>
                <span>
                  {ticket.createdAt?.toDate ? 
                    new Date(ticket.createdAt.toDate()).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    }) : 
                    "Recently"}
                </span>
              </div>
            </div>
            
            {/* Customer Information Card */}
            <div style={{ 
              background: "#fff", 
              border: "1px solid #D5D9D9", 
              borderRadius: 8,
              padding: 20,
              marginBottom: 16
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#EAEDED",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#565959",
                  fontSize: 18,
                  fontWeight: 600
                }}>
                  {ticket.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#0F1111", marginBottom: 2 }}>
                    {ticket.userName}
                  </div>
                  <div style={{ fontSize: 13, color: "#565959" }}>
                    {ticket.userEmail}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Original Message Card */}
            <div style={{ 
              background: "#fff", 
              border: "1px solid #D5D9D9", 
              borderRadius: 8,
              padding: 24,
              marginBottom: 16
            }}>
              <div style={{ 
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: "1px solid #E7E7E7"
              }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0F1111", margin: 0 }}>
                  Original Request
                </h2>
              </div>
              
              <p style={{ 
                whiteSpace: "pre-wrap", 
                color: "#0F1111",
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 0
              }}>
                {ticket.message}
              </p>
            </div>
            
            {/* Conversation Thread */}
            {replies.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ 
                  fontSize: 18, 
                  fontWeight: 600, 
                  color: "#0F1111", 
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  <MessageSquare className="w-5 h-5" />
                  Conversation ({replies.length})
                </h2>
                {replies.map((reply) => {
                  const isStaffReply = reply.userRole === "admin" || reply.userRole === "agent";
                  return (
                    <div 
                      key={reply.id}
                      style={{ 
                        background: "#fff",
                        border: "1px solid #D5D9D9",
                        borderRadius: 8,
                        padding: 20,
                        marginBottom: 12,
                        borderLeft: isStaffReply ? "4px solid #FF9900" : "4px solid #E7E7E7"
                      }}
                    >
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "start",
                        marginBottom: 12,
                        paddingBottom: 12,
                        borderBottom: "1px solid #E7E7E7"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: isStaffReply ? "#FF9900" : "#EAEDED",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isStaffReply ? "#fff" : "#565959",
                            fontSize: 16,
                            fontWeight: 600
                          }}>
                            {reply.userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ 
                              fontSize: 14, 
                              fontWeight: 600, 
                              color: "#0F1111",
                              marginBottom: 2,
                              display: "flex",
                              alignItems: "center",
                              gap: 8
                            }}>
                              {reply.userName}
                              {isStaffReply && (
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "2px 8px",
                                  background: "#FF9900",
                                  color: "#fff",
                                  borderRadius: 3,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  textTransform: "uppercase"
                                }}>
                                  {reply.userRole}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: "#565959" }}>
                              {reply.createdAt?.toDate ? 
                                new Date(reply.createdAt.toDate()).toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  day: 'numeric', 
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                }) : 
                                "Just now"}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p style={{ 
                        whiteSpace: "pre-wrap",
                        color: "#0F1111",
                        fontSize: 14,
                        lineHeight: 1.6,
                        marginBottom: reply.attachments?.length > 0 ? 16 : 0
                      }}>
                        {reply.message}
                      </p>
                      
                      {/* Attachments */}
                      {reply.attachments?.length > 0 && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {reply.attachments.map((file, idx) => (
                            <a
                              key={idx}
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 12px",
                                background: "#F7F8F8",
                                border: "1px solid #D5D9D9",
                                borderRadius: 4,
                                fontSize: 13,
                                color: "#007185",
                                textDecoration: "none",
                                fontWeight: 500
                              }}
                            >
                              <Download style={{ width: 14, height: 14 }} />
                              {file.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Reply Form */}
            {ticket.status !== "closed" && (
              <div style={{ 
                background: "#fff", 
                border: "1px solid #D5D9D9", 
                borderRadius: 8,
                padding: 24
              }}>
                <h2 style={{ 
                  fontSize: 18, 
                  fontWeight: 600, 
                  color: "#0F1111",
                  marginTop: 0,
                  marginBottom: 16
                }}>
                  {hasBeenReadByStaff ? "Add Additional Information" : "Add a Response"}
                </h2>
                
                {error && (
                  <div style={{
                    padding: 12,
                    background: "#FCE9E6",
                    border: "1px solid #c7511f",
                    borderRadius: 4,
                    marginBottom: 16,
                    fontSize: 13,
                    color: "#c7511f",
                    display: "flex",
                    gap: 8
                  }}>
                    <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>{error}</span>
                  </div>
                )}
                
                <form onSubmit={handleReply}>
                  <textarea
                    placeholder="Type your message here..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    disabled={submitting}
                    rows="6"
                    style={{
                      width: "100%",
                      padding: 12,
                      border: "1px solid #888C8C",
                      borderRadius: 4,
                      fontSize: 14,
                      fontFamily: "inherit",
                      marginBottom: 12,
                      resize: "vertical",
                      boxSizing: "border-box"
                    }}
                  />
                  
                  {/* File Upload and Send Button Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <label 
                      style={{ 
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px",
                        background: "#fff",
                        border: "1px solid #D5D9D9",
                        borderRadius: 8,
                        fontSize: 13,
                        color: "#0F1111",
                        fontWeight: 500
                      }}
                    >
                      <Paperclip style={{ width: 16, height: 16 }} />
                      Attach Files
                      <input
                        type="file"
                        multiple
                        onChange={(e) => setReplyFiles(Array.from(e.target.files))}
                        style={{ display: "none" }}
                        disabled={submitting}
                      />
                    </label>
                    
                    <button 
                      type="submit"
                      disabled={submitting || (!replyMessage.trim() && replyFiles.length === 0)}
                      style={{
                        background: "#FF9900",
                        border: "1px solid #E88B00",
                        borderRadius: 8,
                        padding: "10px 24px",
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: (submitting || (!replyMessage.trim() && replyFiles.length === 0)) ? "not-allowed" : "pointer",
                        color: "#fff",
                        opacity: (submitting || (!replyMessage.trim() && replyFiles.length === 0)) ? 0.6 : 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                      }}
                    >
                      <Send style={{ width: 16, height: 16 }} />
                      {submitting ? "Sending..." : "Send Response"}
                    </button>
                  </div>
                  
                  {/* Attached Files Display */}
                  {replyFiles.length > 0 && (
                    <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {replyFiles.map((file, idx) => (
                        <div 
                          key={idx}
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: 8,
                            padding: "6px 10px",
                            background: "#F7F8F8",
                            border: "1px solid #D5D9D9",
                            borderRadius: 4,
                            fontSize: 12
                          }}
                        >
                          <span>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => setReplyFiles(files => files.filter((_, i) => i !== idx))}
                            style={{ 
                              border: "none", 
                              background: "none", 
                              cursor: "pointer",
                              padding: 0,
                              display: "flex",
                              color: "#565959"
                            }}
                          >
                            <X style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </div>
            )}
            
            {ticket.status === "closed" && (
              <div style={{ 
                background: "#fff", 
                border: "1px solid #D5D9D9", 
                borderRadius: 8,
                padding: 24,
                textAlign: "center"
              }}>
                <Shield style={{ width: 32, height: 32, margin: "0 auto 12px", color: "#565959" }} />
                <p style={{ margin: 0, color: "#565959", fontSize: 14 }}>
                  This ticket has been closed. If you need further assistance, please create a new support ticket.
                </p>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div>
            {/* Ticket Actions */}
            {isStaff && (
              <div style={{ 
                background: "#fff", 
                border: "1px solid #D5D9D9", 
                borderRadius: 8,
                padding: 20,
                marginBottom: 16
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0F1111", marginTop: 0, marginBottom: 16 }}>
                  Ticket Actions
                </h3>
                
                <div style={{ marginBottom: 12 }}>
                  <label style={{ 
                    display: "block", 
                    fontSize: 13, 
                    fontWeight: 600, 
                    color: "#0F1111",
                    marginBottom: 6
                  }}>
                    Status
                  </label>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={submitting}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #D5D9D9",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#0F1111",
                      background: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Quick Actions */}
            {isStaff && (
              <div style={{ 
                background: "#fff", 
                border: "1px solid #D5D9D9", 
                borderRadius: 8,
                padding: 20,
                marginBottom: 16
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0F1111", marginTop: 0, marginBottom: 16 }}>
                  Quick Actions
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ticket.category === "order" && (
                    <>
                      <button
                        onClick={() => {
                          openModal({
                            type: "confirm",
                            variant: "danger",
                            title: "Cancel Order",
                            message: "Are you sure you want to cancel this order? This action cannot be undone.",
                            confirmText: "Cancel Order",
                            onConfirm: () => {
                              closeModal();
                              openModal({
                                type: "alert",
                                variant: "success",
                                title: "Order Cancelled",
                                message: "Order cancellation initiated. (Demo mode - no actual changes made)",
                                confirmText: "OK"
                              });
                            }
                          });
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          background: "#fff",
                          border: "1px solid #D5D9D9",
                          borderRadius: 8,
                          color: "#c7511f",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#FCE9E6";
                          e.currentTarget.style.borderColor = "#c7511f";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fff";
                          e.currentTarget.style.borderColor = "#D5D9D9";
                        }}
                      >
                        🚫 Cancel Order
                      </button>
                      
                      <button
                        onClick={() => {
                          openModal({
                            type: "confirm",
                            variant: "warning",
                            title: "Process Refund",
                            message: "Process a refund for this order?",
                            confirmText: "Process Refund",
                            onConfirm: () => {
                              closeModal();
                              openModal({
                                type: "alert",
                                variant: "success",
                                title: "Refund Processed",
                                message: "Refund processing initiated. (Demo mode - no actual changes made)",
                                confirmText: "OK"
                              });
                            }
                          });
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          background: "#fff",
                          border: "1px solid #D5D9D9",
                          borderRadius: 8,
                          color: "#0F1111",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#F7F8F8";
                          e.currentTarget.style.borderColor = "#888C8C";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fff";
                          e.currentTarget.style.borderColor = "#D5D9D9";
                        }}
                      >
                        💰 Process Refund
                      </button>
                      
                      <button
                        onClick={() => {
                          openModal({
                            type: "alert",
                            variant: "success",
                            title: "Replace Item",
                            message: "Replacement order initiated. (Demo mode - no actual changes made)",
                            confirmText: "OK"
                          });
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          background: "#fff",
                          border: "1px solid #D5D9D9",
                          borderRadius: 8,
                          color: "#0F1111",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#F7F8F8";
                          e.currentTarget.style.borderColor = "#888C8C";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fff";
                          e.currentTarget.style.borderColor = "#D5D9D9";
                        }}
                      >
                        🔄 Replace Item
                      </button>
                      
                      <button
                        onClick={() => {
                          openModal({
                            type: "prompt",
                            variant: "default",
                            title: "Issue Store Credit",
                            message: "Enter the store credit amount to issue:",
                            confirmText: "Issue Credit",
                            showInput: true,
                            inputPlaceholder: "Enter amount (e.g., 50.00)",
                            onConfirm: () => {
                              const amount = modalState.inputValue;
                              closeModal();
                              openModal({
                                type: "alert",
                                variant: "success",
                                title: "Store Credit Issued",
                                message: `Store credit of $${amount} issued. (Demo mode - no actual changes made)`,
                                confirmText: "OK"
                              });
                            }
                          });
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          fontSize: 13,
                          fontWeight: 600,
                          background: "#fff",
                          border: "1px solid #D5D9D9",
                          borderRadius: 8,
                          color: "#0F1111",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#F7F8F8";
                          e.currentTarget.style.borderColor = "#888C8C";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fff";
                          e.currentTarget.style.borderColor = "#D5D9D9";
                        }}
                      >
                        🎁 Issue Store Credit
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => {
                      if (ticket.priority === "urgent") {
                        openModal({
                          type: "alert",
                          variant: "info",
                          title: "Already Urgent",
                          message: "This ticket is already at the highest priority level.",
                          confirmText: "OK"
                        });
                      } else {
                        openModal({
                          type: "confirm",
                          variant: "warning",
                          title: "Escalate Ticket",
                          message: "Escalate this ticket to urgent priority? The support team will be immediately notified.",
                          confirmText: "Escalate",
                          onConfirm: () => {
                            handleStatusChange(ticket.status);
                            closeModal();
                            openModal({
                              type: "alert",
                              variant: "success",
                              title: "Ticket Escalated",
                              message: "Ticket escalated to urgent priority. (Demo mode - priority not actually changed)",
                              confirmText: "OK"
                            });
                          }
                        });
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      background: "#fff",
                      border: "1px solid #D5D9D9",
                      borderRadius: 8,
                      color: "#F08804",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#FEF5E7";
                      e.currentTarget.style.borderColor = "#F08804";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderColor = "#D5D9D9";
                    }}
                  >
                    ⚠️ Escalate Ticket
                  </button>
                  
                  {ticket.status !== "closed" && (
                    <button
                      onClick={() => {
                        openModal({
                          type: "confirm",
                          variant: "success",
                          title: "Close Ticket",
                          message: "Close this ticket? The customer will be notified that their issue has been resolved.",
                          confirmText: "Close Ticket",
                          onConfirm: () => {
                            handleStatusChange("closed");
                            closeModal();
                          }
                        });
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        background: "#fff",
                        border: "1px solid #D5D9D9",
                        borderRadius: 8,
                        color: "#067D62",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#E8F5F2";
                        e.currentTarget.style.borderColor = "#067D62";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                        e.currentTarget.style.borderColor = "#D5D9D9";
                      }}
                    >
                      ✅ Close Ticket
                    </button>
                  )}
                  
                  {/* Divider */}
                  <div style={{ height: 1, background: "#D5D9D9", margin: "8px 0" }} />
                  
                  {/* Add Account Note */}
                  <button
                    onClick={() => {
                      const note = prompt("Add internal note about this customer's account:");
                      if (note && note.trim()) {
                        alert(`Note saved: "${note}"\n(Demo mode - note not actually saved)`);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      background: "#fff",
                      border: "1px solid #D5D9D9",
                      borderRadius: 8,
                      color: "#0F1111",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#F7F8F8";
                      e.currentTarget.style.borderColor = "#888C8C";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderColor = "#D5D9D9";
                    }}
                  >
                    <StickyNote style={{ width: 14, height: 14 }} />
                    Add Account Note
                  </button>
                  
                  {/* View Customer Profile */}
                  <button
                    onClick={() => {
                      const route = isAdmin ? '/admin/users' : '/agent/users';
                      navigate(route);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      background: "#fff",
                      border: "1px solid #D5D9D9",
                      borderRadius: 8,
                      color: "#0F1111",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#F7F8F8";
                      e.currentTarget.style.borderColor = "#888C8C";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.borderColor = "#D5D9D9";
                    }}
                  >
                    <Users style={{ width: 14, height: 14 }} />
                    View Customer Profile
                  </button>
                  
                </div>
              </div>
            )}
            
            {/* Ticket Details */}
            <div style={{ 
              background: "#fff", 
              border: "1px solid #D5D9D9", 
              borderRadius: 8,
              padding: 20,
              marginBottom: 16
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0F1111", marginTop: 0, marginBottom: 16 }}>
                Ticket Details
              </h3>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#565959", marginBottom: 4 }}>ID</div>
                <div style={{ fontSize: 13, color: "#0F1111", fontWeight: 500, fontFamily: "monospace" }}>
                  {ticket.id}
                </div>
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#565959", marginBottom: 4 }}>Created</div>
                <div style={{ fontSize: 13, color: "#0F1111" }}>
                  {ticket.createdAt?.toDate ? 
                    new Date(ticket.createdAt.toDate()).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    }) : 
                    "Recently"}
                </div>
              </div>
              
              {ticket.updatedAt && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "#565959", marginBottom: 4 }}>Last Updated</div>
                  <div style={{ fontSize: 13, color: "#0F1111" }}>
                    {ticket.updatedAt?.toDate ? 
                      new Date(ticket.updatedAt.toDate()).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      }) : 
                      "Recently"}
                  </div>
                </div>
              )}
              
              <div>
                <div style={{ fontSize: 12, color: "#565959", marginBottom: 4 }}>Category</div>
                <div style={{ fontSize: 13, color: "#0F1111" }}>
                  {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                </div>
              </div>
            </div>
            
            {/* Support Info */}
            <div style={{ 
              background: "#E6F2F5", 
              border: "1px solid #C0E3ED", 
              borderRadius: 8,
              padding: 16
            }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <Info style={{ width: 20, height: 20, color: "#007185", flexShrink: 0 }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F1111", margin: 0 }}>
                  Need More Help?
                </h3>
              </div>
              <p style={{ fontSize: 13, color: "#0F1111", lineHeight: 1.5, margin: "8px 0 0 0" }}>
                Our support team typically responds within 24 hours. For urgent issues, please indicate high priority when creating a ticket.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
      
      {/* Action Modal */}
      <ActionModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        variant={modalState.variant}
        confirmText={modalState.confirmText}
        showInput={modalState.showInput}
        inputValue={modalState.inputValue}
        onInputChange={(value) => setModalState({ ...modalState, inputValue: value })}
        inputPlaceholder={modalState.inputPlaceholder}
      />
    </>
  );
}
