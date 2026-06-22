import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, User, Phone, Mail, Camera, Shield, Zap, Activity } from "lucide-react";
import { getAccountProfile } from "../../services/accountApi";
import { tokenStorage } from "../../storage/tokenStorage";

export const UserProfile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    firstName: "Admin",
    lastName: "System",
    phoneNumber: "0123456789",
    email: "admin@gmail.com",
    status: "ACTIVE",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const account = tokenStorage.getAccount();
        if (account?.id) {
          const data = await getAccountProfile(account.id);
          setProfileData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            phoneNumber: data.phoneNumber || "",
            email: data.email || "",
            status: data.status || "ACTIVE",
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate save
    alert("Profile configurations synchronized.");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--mf-bg-deep, #0c0714)",
      backgroundImage: "linear-gradient(rgba(255, 45, 115, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 45, 115, 0.05) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
      backgroundPosition: "center center",
      color: "var(--mf-text, #ffffff)",
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background Glows */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(0, 229, 255, 0.15) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "50%", height: "50%", background: "radial-gradient(circle, rgba(255, 45, 115, 0.1) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
        {/* Header */}
        <button 
          onClick={() => navigate(-1)}
          style={{
            display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: "var(--mf-cyan, #00E5FF)", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", marginBottom: 30, textTransform: "uppercase"
          }}
        >
          <ArrowLeft size={16} /> Return to Workspace
        </button>

        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg, var(--mf-magenta, #FF2D73), var(--mf-cyan, #00E5FF))", marginBottom: 16, boxShadow: "0 0 20px rgba(0, 229, 255, 0.4)" }}>
            <Shield size={30} color="#fff" />
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", margin: 0, textShadow: "0 0 10px rgba(255,255,255,0.2)" }}>System Identity</h1>
          <p style={{ color: "var(--mf-text-muted, #8a849b)", fontSize: 14, marginTop: 8 }}>Manage your core access parameters and communication channels.</p>
        </div>

        {/* Glassmorphic Card */}
        <div style={{
          background: "rgba(20, 12, 28, 0.6)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(0, 229, 255, 0.15)",
          borderRadius: 24,
          padding: "40px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)"
        }}>
          <form id="profile-form" onSubmit={handleSave}>
            
            <div style={{ display: "flex", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
              
              {/* Avatar Section */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: 140 }}>
                <div style={{
                  position: "relative", width: 120, height: 120, borderRadius: "50%", padding: 4,
                  background: "linear-gradient(135deg, var(--mf-magenta, #FF2D73) 0%, var(--mf-cyan, #00E5FF) 100%)",
                  boxShadow: "0 0 30px rgba(255, 45, 115, 0.3)"
                }}>
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", background: "var(--mf-bg-deep, #0F0914)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: "var(--mf-text, #fff)" }}>
                      {profileData.firstName[0]}{profileData.lastName[0]}
                    </span>
                  </div>
                  <button type="button" style={{
                    position: "absolute", bottom: 0, right: 0, width: 36, height: 36, borderRadius: "50%",
                    background: "var(--mf-cyan, #00E5FF)", border: "3px solid var(--mf-bg-deep, #0F0914)",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    boxShadow: "0 0 10px rgba(0, 229, 255, 0.5)"
                  }}>
                    <Camera size={16} color="#000" />
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "var(--mf-text-muted, #8a849b)", textAlign: "center", fontWeight: 600, letterSpacing: "0.05em" }}>CLEARANCE: LEVEL 5</div>
              </div>

              {/* Form Fields */}
              <div style={{ flex: 1, minWidth: 280, display: "flex", flexDirection: "column", gap: 24 }}>
                
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 130 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--mf-cyan, #00E5FF)", letterSpacing: "0.05em", marginBottom: 8 }}>
                      <User size={12} /> FIRST NAME
                    </label>
                    <input
                      name="firstName"
                      value={profileData.firstName}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%", boxSizing: "border-box", padding: "14px 16px",
                        background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12, color: "white", fontSize: 15, outline: "none",
                        transition: "all 0.2s"
                      }}
                      onFocus={e => { e.target.style.borderColor = "var(--mf-cyan, #00E5FF)"; e.target.style.boxShadow = "0 0 10px rgba(0, 229, 255, 0.2)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 130 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--mf-cyan, #00E5FF)", letterSpacing: "0.05em", marginBottom: 8 }}>
                      <label style={{visibility: 'hidden'}}><User size={12} /></label> LAST NAME
                    </label>
                    <input
                      name="lastName"
                      value={profileData.lastName}
                      onChange={handleChange}
                      required
                      style={{
                        width: "100%", boxSizing: "border-box", padding: "14px 16px",
                        background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12, color: "white", fontSize: 15, outline: "none",
                        transition: "all 0.2s"
                      }}
                      onFocus={e => { e.target.style.borderColor = "var(--mf-cyan, #00E5FF)"; e.target.style.boxShadow = "0 0 10px rgba(0, 229, 255, 0.2)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--mf-magenta, #FF2D73)", letterSpacing: "0.05em", marginBottom: 8 }}>
                    <Mail size={12} /> SECURE EMAIL
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "14px 16px",
                      background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12, color: "white", fontSize: 15, outline: "none",
                      transition: "all 0.2s"
                    }}
                    onFocus={e => { e.target.style.borderColor = "var(--mf-magenta, #FF2D73)"; e.target.style.boxShadow = "0 0 10px rgba(255, 45, 115, 0.2)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--mf-magenta, #FF2D73)", letterSpacing: "0.05em", marginBottom: 8 }}>
                    <Phone size={12} /> COMM_LINK (PHONE)
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={profileData.phoneNumber}
                    onChange={handleChange}
                    style={{
                      width: "100%", boxSizing: "border-box", padding: "14px 16px",
                      background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12, color: "white", fontSize: 15, outline: "none",
                      transition: "all 0.2s"
                    }}
                    onFocus={e => { e.target.style.borderColor = "var(--mf-magenta, #FF2D73)"; e.target.style.boxShadow = "0 0 10px rgba(255, 45, 115, 0.2)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                  />
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "var(--mf-cyan, #00E5FF)", letterSpacing: "0.05em", marginBottom: 8 }}>
                    <Activity size={12} /> ACCOUNT STATUS
                  </label>
                  <div style={{
                    width: "100%", padding: "14px 16px", background: "rgba(0, 229, 255, 0.05)", 
                    border: "1px solid rgba(0, 229, 255, 0.2)", borderRadius: 12, 
                    color: "var(--mf-cyan, #00E5FF)", fontSize: 15, fontWeight: 800,
                    display: "flex", alignItems: "center", gap: 10, boxSizing: "border-box"
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: profileData.status === "ACTIVE" ? "var(--mf-cyan, #00E5FF)" : "rgba(255, 255, 255, 0.5)", boxShadow: profileData.status === "ACTIVE" ? "0 0 10px var(--mf-cyan, #00E5FF)" : "none" }} />
                    {profileData.status}
                  </div>
                </div>

              </div>
            </div>

            <div style={{ marginTop: 40, paddingTop: 30, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "flex-end", gap: 16 }}>
              <button type="button" onClick={() => setProfileData({
                firstName: "Admin", lastName: "System", phoneNumber: "0123456789", email: "admin@gmail.com", status: "ACTIVE"
              })} style={{
                padding: "14px 24px", background: "transparent", border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 12, color: "var(--mf-text-secondary, #b4acc6)", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "white"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "var(--mf-text-secondary, #b4acc6)"; }}
              >
                RESET OVERRIDE
              </button>
              <button type="submit" style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "14px 32px", background: "var(--mf-magenta, #FF2D73)", border: "none",
                borderRadius: 12, color: "white", fontSize: 14, fontWeight: 800, letterSpacing: "0.05em",
                cursor: "pointer", boxShadow: "0 0 20px rgba(255, 45, 115, 0.4)", transition: "all 0.2s"
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 30px rgba(255, 45, 115, 0.7)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 45, 115, 0.4)"}
              >
                <Zap size={16} /> INITIALIZE UPDATE
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
