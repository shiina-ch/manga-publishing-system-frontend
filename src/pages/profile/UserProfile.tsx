import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, User, Phone, Mail, Camera, Shield, Zap, Activity, Clock, BarChart3 } from "lucide-react";
import { getAccountProfile } from "../../services/accountApi";
import { tokenStorage } from "../../storage/tokenStorage";
import "../../styles/UserProfile.css";

export const UserProfile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    firstName: "Admin",
    lastName: "System",
    phoneNumber: "0123456789",
    email: "admin@gmail.com",
    status: "ACTIVE",
    joinedAt: "Unknown",
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
            joinedAt: data.approvedAt ? new Date(data.approvedAt).toLocaleDateString() : "Unknown",
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
    alert("Profile configurations synchronized.");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--mf-bg-deep, #0c0714)",
      color: "var(--mf-text, #ffffff)",
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "32px 24px",
      position: "relative",
      overflow: "hidden",
    }}>



      {/* Ambient glows */}
      <div style={{ position: "absolute", top: "-15%", left: "-5%", width: "40%", height: "50%", background: "radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 65%)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-15%", right: "-5%", width: "35%", height: "45%", background: "radial-gradient(circle, rgba(255,45,115,0.05) 0%, transparent 65%)", filter: "blur(80px)", pointerEvents: "none" }} />

      {/* ── BACK BUTTON (outside frame) ── */}
      <div className="up-back" style={{ width: "100%", maxWidth: 1100, marginBottom: 20, zIndex: 1 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "transparent", border: "none",
            color: "var(--mf-text-muted, #8a849b)", fontSize: 13, fontWeight: 600,
            cursor: "pointer", padding: 0,
            transition: "color 0.2s", fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--mf-cyan, #00E5FF)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--mf-text-muted, #8a849b)"}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* ── MAIN LAYOUT: Left Info + Right Frame ── */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 1100,
        display: "flex", gap: 28,
        alignItems: "flex-start",
        flex: 1,
      }}>

        {/* ── LEFT COLUMN: Profile Card + Stats ── */}
        <div className="up-left" style={{
          width: 280, flexShrink: 0,
          display: "flex", flexDirection: "column", gap: 16,
          alignSelf: "stretch",
        }}>

          {/* Profile Card */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: "28px 20px",
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <div className="up-avatar" style={{
              position: "relative", width: 88, height: 88, borderRadius: "50%", padding: 3,
              background: "linear-gradient(135deg, var(--mf-cyan, #00E5FF), var(--mf-magenta, #FF2D73))",
              marginBottom: 16,
            }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                background: "var(--mf-bg-deep, #0c0714)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 26, fontWeight: 800 }}>
                  {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                </span>
              </div>
              <button type="button" style={{
                position: "absolute", bottom: 2, right: 0, width: 28, height: 28, borderRadius: "50%",
                background: "var(--mf-cyan, #00E5FF)", border: "2px solid var(--mf-bg-deep, #0c0714)",
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                transition: "transform 0.2s",
              }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.15)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <Camera size={12} color="#000" />
              </button>
            </div>

            <h2 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700, textAlign: "center" }}>
              {profileData.firstName} {profileData.lastName}
            </h2>
            <span style={{ fontSize: 12, color: "var(--mf-text-muted, #8a849b)", marginBottom: 16 }}>
              {profileData.email}
            </span>

            {/* Status badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 10,
              background: "rgba(0,229,255,0.05)",
              border: "1px solid rgba(0,229,255,0.12)",
              width: "100%", boxSizing: "border-box",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: profileData.status === "ACTIVE" ? "var(--mf-cyan, #00E5FF)" : "rgba(255,255,255,0.4)",
                boxShadow: profileData.status === "ACTIVE" ? "0 0 8px var(--mf-cyan, #00E5FF)" : "none",
                animation: profileData.status === "ACTIVE" ? "pulseDot 2s ease-in-out infinite" : "none",
              }} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{profileData.status}</span>
            </div>

            {/* Joined info */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 10,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              width: "100%", boxSizing: "border-box",
              marginTop: 10,
            }}>
              <Clock size={14} color="var(--mf-text-muted, #8a849b)" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mf-text-muted, #8a849b)" }}>Joined: {profileData.joinedAt}</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: FORM FRAME ── */}
        <div className="up-frame" style={{
          flex: 1,
          background: "rgba(12, 7, 20, 0.55)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20,
          boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "32px 36px",
          }}>
            {/* Title */}
            <div className="up-s1" style={{ marginBottom: 20 }}>
              <h1 className="up-title-gradient" style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px 0", letterSpacing: "-0.02em" }}>
                Personal Information
              </h1>
            </div>

            <form onSubmit={handleSave}>
              {/* Basic Details */}
              <div className="up-s1" style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 12, padding: "22px 24px", marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(0,229,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={14} color="var(--mf-cyan, #00E5FF)" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Basic Details</h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--mf-text-muted, #8a849b)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      First Name
                    </label>
                    <input name="firstName" value={profileData.firstName} onChange={handleChange} required className="up-field c" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--mf-text-muted, #8a849b)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Last Name
                    </label>
                    <input name="lastName" value={profileData.lastName} onChange={handleChange} required className="up-field c" />
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="up-s2" style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 12, padding: "22px 24px", marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,45,115,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mail size={14} color="var(--mf-magenta, #FF2D73)" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Contact</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--mf-text-muted, #8a849b)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Email Address
                    </label>
                    <input type="email" name="email" value={profileData.email} onChange={handleChange} required className="up-field m" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--mf-text-muted, #8a849b)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Phone Number
                    </label>
                    <input type="tel" name="phoneNumber" value={profileData.phoneNumber} onChange={handleChange} className="up-field m" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="up-s3" style={{
                display: "flex", justifyContent: "flex-end", gap: 10,
                paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.05)",
              }}>
                <button type="button" className="up-reset" onClick={() => setProfileData({
                  firstName: "Admin", lastName: "System", phoneNumber: "0123456789", email: "admin@gmail.com", status: "ACTIVE", joinedAt: "Unknown",
                })}>
                  Reset
                </button>
                <button type="submit" className="up-save">
                  <Zap size={14} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
