// src/pages/Contact.jsx - Now a comprehensive Help page
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from "emailjs-com";
import { useAuth } from "../auth/useAuth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, firebaseInitialized } from "../lib/firebase";
import BreadcrumbNav from '../components/BreadcrumbNav';
import { useTotalHeaderHeight } from '../hooks/useTotalHeaderHeight';;
import { watchSettings } from "../services/settingsService";
import { getUserOpenTickets } from "../services/ticketService";
import { useNavbarHeight } from "../hooks/useNavbarHeight";

export default function Contact() {
  const totalHeaderHeight = useTotalHeaderHeight();
  const { user } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef();
  const [activeTab, setActiveTab] = useState("faq");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [storeSettings, setStoreSettings] = useState({ supportPhone: "", supportHours: null, email: "" });
  const navbarHeight = useNavbarHeight();
  
  // Watch store settings for real-time updates
  useEffect(() => {
    const unsubscribe = watchSettings((settings) => {
      setStoreSettings({
        supportPhone: settings.store?.supportPhone || "",
        supportHours: settings.store?.supportHours || null,
        email: settings.store?.email || "",
      });
    });
    return () => unsubscribe();
  }, []);

  // Scroll to top when tab changes (just like navigation)
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [activeTab]);

  // Load user's open tickets when tab is active and user is logged in
  useEffect(() => {
    let alive = true;
    async function loadTickets() {
      if (!user || activeTab !== "ticket") {
        return;
      }

      setLoadingTickets(true);
      try {
        const tickets = await getUserOpenTickets(user.uid);
        if (!alive) return;
        setOpenTickets(tickets);
      } catch (err) {
        console.error("Failed to load tickets:", err);
      } finally {
        if (alive) {
          setLoadingTickets(false);
        }
      }
    }
    loadTickets();
    return () => { alive = false; };
  }, [user, activeTab]);
  
  // Support ticket state
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("general");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPriority, setTicketPriority] = useState("normal");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccessModal, setTicketSuccessModal] = useState(false);
  const [lastTicketId, setLastTicketId] = useState("");
  const [openTickets, setOpenTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const faqs = [
    {
      id: 1,
      question: "How do I track my order?",
      answer: "Once your order ships, you'll receive a tracking number via email. You can also view your order status in your account dashboard under 'Orders'."
    },
    {
      id: 2,
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for most items. Products must be unused and in original packaging. To initiate a return, go to your Orders page and select the order you'd like to return."
    },
    {
      id: 3,
      question: "How long does shipping take?",
      answer: "Standard shipping typically takes 5-7 business days. Express shipping (2-3 days) is available at checkout. Free shipping is offered on orders over $50."
    },
    {
      id: 4,
      question: "Do you ship internationally?",
      answer: "Yes! We ship to most countries worldwide. International shipping rates and times vary by location. You'll see the exact cost and estimated delivery time at checkout."
    },
    {
      id: 5,
      question: "How can I apply a discount code?",
      answer: "During checkout, you'll see a 'Coupon Code' field. Enter your code and click 'Apply'. The discount will be reflected in your order total before you place your order."
    },
    {
      id: 6,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express, Discover), PayPal, and in some regions, Cash on Delivery (COD). Payment options available to you will be shown at checkout."
    },
    {
      id: 7,
      question: "Can I modify or cancel my order?",
      answer: "Orders can be modified or cancelled within 1 hour of placement. After that, the order enters processing and cannot be changed. Contact support immediately if you need to make changes."
    },
    {
      id: 8,
      question: "How do I create an account?",
      answer: "Click 'Sign In' in the navigation bar, then select 'Create Account'. You'll need to provide an email address and create a password. Having an account lets you track orders, save addresses, and checkout faster."
    },
    {
      id: 9,
      question: "Are my payment details secure?",
      answer: "Absolutely. We use industry-standard encryption to protect your payment information. We never store your full credit card details on our servers. All transactions are processed through secure payment gateways."
    },
    {
      id: 10,
      question: "What if an item is out of stock?",
      answer: "Out of stock items will show as unavailable. You can sign up for email notifications to be alerted when the item is back in stock. We restock popular items regularly."
    }
  ];

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.sendForm(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      formRef.current,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    ).then(
      () => {
        alert("Message sent successfully!");
        formRef.current.reset();
      },
      (error) => {
        alert("Oops! Something went wrong.");
        console.error(error);
      }
    );
  };

  const submitTicket = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to submit a support ticket.");
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
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (!firebaseInitialized || !db) {
        throw new Error("Firebase is not initialized");
      }

      const ticketRef = await addDoc(collection(db, "supportTickets"), ticketData);
      setLastTicketId(ticketRef.id);

      // Send email notification
      try {
        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          {
            user_name: user.displayName || user.email,
            user_email: user.email,
            message: `Support Ticket #${Date.now()}\n\nCategory: ${ticketCategory}\nPriority: ${ticketPriority}\nSubject: ${ticketSubject}\n\n${ticketMessage}`,
          },
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
      } catch (emailErr) {
        console.error("Failed to send ticket email:", emailErr);
      }

      setTicketSuccessModal(true);
      setTicketSubject("");
      setTicketCategory("general");
      setTicketMessage("");
      setTicketPriority("normal");
    } catch (err) {
      console.error("Failed to submit ticket:", err);
      alert("Failed to submit ticket. Please try again or use the contact form.");
    } finally {
      setTicketSubmitting(false);
    }
  };

  return (
    <>
      <BreadcrumbNav
        currentPage="Help Center & Contact"
        backButton={{ label: "Home", path: "/" }}
      />
      <div className="container-xl" style={{ paddingTop: 16, paddingBottom: 48 }}>
      <div className="hero-headline" style={{ marginBottom: 24 }}>
        <div>
          <div className="kicker">Customer Support</div>
          <h1 style={{ margin: 0 }}>Help Center & Contact</h1>
          <div className="meta" style={{ marginTop: 8 }}>
            Find answers, submit support tickets, or get in touch with our team.
          </div>
        </div>
      </div>

      {/* Main Layout: Sidebar + Content */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }}>
        
        {/* Left Sidebar - Contact Info (Always Visible) */}
        <div className="card" style={{ padding: 16, position: "sticky", top: navbarHeight + 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Other Ways to Reach Us</h3>
          
          <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            <div>
              <div className="meta" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Email</div>
              <div style={{ fontSize: 14 }}>{storeSettings.email || "Not available"}</div>
            </div>
            
            <div>
              <div className="meta" style={{ fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Phone</div>
              <div style={{ fontSize: 14 }}>{storeSettings.supportPhone || "Not available"}</div>
            </div>
          </div>

          {storeSettings.supportHours && (
            <div>
              <div className="meta" style={{ fontSize: 11, marginBottom: 8, fontWeight: 600 }}>Support Hours</div>
              <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
                {Object.entries(storeSettings.supportHours).map(([day, hours]) => (
                  <div key={day} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ textTransform: "capitalize", fontWeight: hours.isOpen ? 500 : 400 }}>
                      {day}:
                    </span>
                    <span className="meta" style={{ fontSize: 12 }}>
                      {hours.isOpen 
                        ? `${hours.open} - ${hours.close}`
                        : "Closed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Content Area - Tabs */}
        <div>
          {/* Tab Navigation */}
          <div className="card" style={{ padding: 0, marginBottom: 16 }}>
            <div style={{ display: "flex", borderBottom: "2px solid var(--border)" }}>
              <button
                onClick={() => setActiveTab("faq")}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  border: "none",
                  background: activeTab === "faq" ? "#fff" : "transparent",
                  borderBottom: activeTab === "faq" ? "3px solid var(--primary)" : "none",
                  fontWeight: activeTab === "faq" ? 700 : 400,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                📚 FAQs
              </button>
              <button
                onClick={() => setActiveTab("ticket")}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  border: "none",
                  background: activeTab === "ticket" ? "#fff" : "transparent",
                  borderBottom: activeTab === "ticket" ? "3px solid var(--primary)" : "none",
                  fontWeight: activeTab === "ticket" ? 700 : 400,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                🎫 Support Ticket
              </button>
              <button
                onClick={() => setActiveTab("contact")}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  border: "none",
                  background: activeTab === "contact" ? "#fff" : "transparent",
                  borderBottom: activeTab === "contact" ? "3px solid var(--primary)" : "none",
                  fontWeight: activeTab === "contact" ? 700 : 400,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ✉️ Contact Us
              </button>
            </div>
          </div>

          {/* FAQ Tab */}
          {activeTab === "faq" && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Frequently Asked Questions</h2>
          <p className="meta" style={{ marginBottom: 20 }}>
            Find quick answers to common questions about orders, shipping, returns, and more.
          </p>

          <div style={{ display: "grid", gap: 12 }}>
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="card"
                style={{
                  padding: 16,
                  cursor: "pointer",
                  border: "1px solid var(--border)",
                  background: expandedFaq === faq.id ? "#f9fafb" : "#fff",
                }}
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0, flex: 1 }}>{faq.question}</h4>
                  <span style={{ fontSize: 20, marginLeft: 12 }}>
                    {expandedFaq === faq.id ? "−" : "+"}
                  </span>
                </div>
                {expandedFaq === faq.id && (
                  <p style={{ marginTop: 12, marginBottom: 0, color: "#4b5563" }}>
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, padding: 16, background: "#eaf4ff", borderRadius: 8 }}>
            <p style={{ margin: 0, fontWeight: 600 }}>
              Can't find what you're looking for? <span style={{ cursor: "pointer", color: "var(--primary)", textDecoration: "underline" }} onClick={() => setActiveTab("ticket")}>Submit a support ticket</span> or <span style={{ cursor: "pointer", color: "var(--primary)", textDecoration: "underline" }} onClick={() => setActiveTab("contact")}>contact us directly</span>.
            </p>
          </div>
        </div>
      )}

          {/* Support Ticket Tab */}
          {activeTab === "ticket" && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Submit a Support Ticket</h2>
          {!user ? (
            <div style={{ padding: 20, background: "#fff7e6", borderRadius: 8, marginBottom: 16 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>
                Please sign in to submit a support ticket. This helps us track your request and respond faster.
              </p>
            </div>
          ) : (
            <>
              <p className="meta" style={{ marginBottom: 20 }}>
                Our support team typically responds within 24 hours. For urgent matters, please call us directly.
              </p>

              {/* Display Open Tickets */}
              {loadingTickets ? (
                <div style={{ padding: 20, textAlign: "center", background: "#f9fafb", borderRadius: 8, marginBottom: 20 }}>
                  <p className="meta">Loading your tickets...</p>
                </div>
              ) : openTickets.length > 0 ? (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 18, marginBottom: 12 }}>Your Open Tickets</h3>
                  <div style={{ display: "grid", gap: 12 }}>
                    {openTickets.map((ticket) => {
                      const status = ticket.status || "open";
                      const statusColors = {
                        open: { bg: "#eaf4ff", border: "#bfdbfe", text: "#1e3a8a", indicator: "#3b82f6" },
                        in_progress: { bg: "#fff7e6", border: "#ffd8a8", text: "#8a5a00", indicator: "#f59e0b" },
                        resolved: { bg: "#eaf8f0", border: "#d1fae5", text: "#065f46", indicator: "#10b981" },
                        closed: { bg: "#f3f4f6", border: "#e5e7eb", text: "#374151", indicator: "#6b7280" },
                      };
                      const statusStyle = statusColors[status] || statusColors.open;
                      
                      return (
                        <div
                          key={ticket.id}
                          className="card"
                          style={{
                            padding: 16,
                            border: "1px solid var(--border)",
                            background: ticket.isRead === false ? "#f0f9ff" : "#fff",
                            cursor: "pointer",
                          }}
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                <span 
                                  style={{ 
                                    display: "inline-block",
                                    width: 12, 
                                    height: 12, 
                                    borderRadius: "50%", 
                                    background: statusStyle.indicator,
                                    border: "2px solid #fff",
                                    boxShadow: "0 0 0 1px rgba(0,0,0,0.1)"
                                  }}
                                  title={status.replace('_', ' ')}
                                />
                                {ticket.isRead === false && (
                                  <span 
                                    style={{ 
                                      display: "inline-block",
                                      width: 8, 
                                      height: 8, 
                                      borderRadius: "50%", 
                                      background: "#3b82f6",
                                      flexShrink: 0,
                                      animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                                    }}
                                    title="Unread"
                                  />
                                )}
                                <h4 style={{ margin: 0, fontSize: 16, fontWeight: ticket.isRead === false ? 700 : 600 }}>{ticket.subject}</h4>
                                {ticket.readBy && ticket.readBy.some(userId => userId !== ticket.userId) && (
                                  <span 
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "2px 8px",
                                      background: "#E8F5F2",
                                      color: "#067D62",
                                      borderRadius: 3,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      border: "1px solid #067D6220"
                                    }}
                                    title="A support team member has reviewed your ticket"
                                  >
                                    ✓ Reviewed
                                  </span>
                                )}
                              </div>
                              <div className="meta" style={{ fontSize: 12 }}>
                                Ticket ID: {ticket.id.slice(0, 8).toUpperCase()}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                              <span
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 4,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: ticket.priority === "urgent" ? "#fee" : ticket.priority === "high" ? "#fff4e6" : "#f0f9ff",
                                  color: ticket.priority === "urgent" ? "#c00" : ticket.priority === "high" ? "#ea580c" : "#0284c7",
                                }}
                              >
                                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                              </span>
                              <span
                                className="pill"
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: 4,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: statusStyle.bg,
                                  borderColor: statusStyle.border,
                                  color: statusStyle.text,
                                }}
                              >
                                {status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <p style={{ margin: "8px 0", color: "#4b5563", fontSize: 14 }}>
                            {ticket.message.length > 100 ? ticket.message.substring(0, 100) + "..." : ticket.message}
                          </p>
                          <div className="meta" style={{ fontSize: 12 }}>
                            Category: {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1).replace(/([A-Z])/g, " $1")} • 
                            Submitted: {ticket.createdAt?.toDate ? new Date(ticket.createdAt.toDate()).toLocaleDateString() : "Recently"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 16, padding: 16, background: "#f9fafb", borderRadius: 8 }}>
                    <p className="meta" style={{ margin: 0, fontSize: 13 }}>
                      💡 You have {openTickets.length} open ticket{openTickets.length !== 1 ? "s" : ""}. Our support team is working on your requests.
                    </p>
                  </div>
                </div>
              ) : null}
            </>
          )}

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
                disabled={!user}
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
                  disabled={!user}
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
                  disabled={!user}
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
                disabled={!user}
              />
            </label>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={!user || ticketSubmitting}
            >
              {ticketSubmitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </div>
      )}

          {/* Contact Form Tab */}
          {activeTab === "contact" && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Contact Us</h2>
          <p className="meta" style={{ marginBottom: 20 }}>
            Have feedback or want to collaborate? Send us a message below.
          </p>

          <form ref={formRef} className="grid" style={{ gap: 12 }} onSubmit={sendEmail}>
            <input
              className="input"
              type="text"
              name="user_name"
              placeholder="Full name"
              required
            />

            <input
              className="input"
              type="email"
              name="user_email"
              placeholder="Email"
              required
            />

            <textarea
              className="textarea"
              rows="5"
              name="message"
              placeholder="Message"
              required
            />

            <button className="btn btn-primary" type="submit">
              Send Message
            </button>
          </form>

          <div style={{ marginTop: 24, padding: 16, background: "#f9fafb", borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#4b5563" }}>
              💡 Need help faster? Check out our contact information in the sidebar or submit a support ticket for detailed assistance.
            </p>
          </div>
        </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {ticketSuccessModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 480, width: "100%" }}>
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
                You can view and track your ticket in your Dashboard under "Support Tickets".
              </p>
            </div>
            <div className="actions" style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setTicketSuccessModal(false)}
              >
                Close
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => window.location.href = "/dashboard"}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
