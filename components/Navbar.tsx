"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Scissors, Phone, Calendar, ChevronRight, LogOut, User, LogIn } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import { ThemeToggle } from "./ThemeToggle";
import { getSession, clearSession, getAdminToken, clearAdminToken } from "@/lib/auth";
import type { AuthSession } from "@/lib/types";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 40);
  });

  useEffect(() => {
    // Check session on component mount
    const userSession = getSession();
    setSession(userSession);
    // Check if user is admin by checking session role or admin token
    const adminStatus = userSession?.user.role === 'admin' || getAdminToken() === 'admin_verified';
    setIsAdmin(adminStatus);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    clearSession();
    clearAdminToken();
    setSession(null);
    setIsAdmin(false);
    setIsMobileMenuOpen(false);
    router.push("/");
  };

  const navLinks = [
    { name: "Home", href: "#home", icon: "✦" },
    { name: "Services", href: "#services", icon: "✂" },
    { name: "About", href: "#about", icon: "◈" },
    { name: "Testimonials", href: "#testimonials", icon: "★" },
    { name: "Contact", href: "#contact", icon: "◉" },
  ];

  return (
    <>
      {/* ── DESKTOP + TABLET NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: isScrolled ? "80%" : "100%",
            transition:
              "width 0.5s cubic-bezier(0.22,1,0.36,1), border-radius 0.5s cubic-bezier(0.22,1,0.36,1), top 0.5s cubic-bezier(0.22,1,0.36,1)",
            borderRadius: isScrolled ? "999px" : "0px",
            marginTop: isScrolled ? "14px" : "0px",
          }}
          className={`
            pointer-events-auto
            hidden md:flex flex-col
            ${
              isScrolled
                ? "bg-background/70 backdrop-blur-2xl border border-border/60 rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.18)]"
                : "bg-background/0 backdrop-blur-none border-b border-transparent"
            }
          `}
        >
          <div className="max-w-7xl mx-auto w-full px-6 lg:px-10">
            <div className="flex items-center justify-between h-[68px]">
              {/* Logo */}
              <motion.a
                href="#home"
                className="flex items-center gap-3 group"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                  }}
                >
                  <Scissors className="w-5 h-5 text-primary-foreground" />
                </div>
                <span
                  className="text-[1.35rem] font-black tracking-tight bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                  }}
                >
                  Sahil Cutz
                </span>
              </motion.a>

              {/* Center links */}
              <div className="flex items-center gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setActiveLink(link.name)}
                    className="relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 group"
                    style={{
                      color:
                        activeLink === link.name
                          ? "var(--color-primary)"
                          : "var(--color-muted-foreground)",
                    }}
                  >
                    {activeLink === link.name && (
                      <motion.span
                        layoutId="pill"
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background:
                            "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                        }}
                      />
                    )}
                    <span className="relative z-10">{link.name}</span>
                  </a>
                ))}
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-3">
                {/* <ThemeToggle /> */}
                {session ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/60 bg-card/50">
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium text-foreground">
                        {isAdmin ? "Admin" : session.user.full_name?.split(" ")[0] || "User"}
                      </span>
                    </div>
                    {isAdmin ? (
                      <Link href="/admin/dashboard">
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/60 text-sm font-bold text-primary-foreground shadow-lg"
                          style={{
                            background:
                              "linear-gradient(135deg, #ef4444, #dc2626)",
                          }}
                        >
                          <span>Dashboard</span>
                        </motion.button>
                      </Link>
                    ) : (
                      <Link href="/customer/dashboard">
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/60 text-sm font-bold text-primary-foreground shadow-lg"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                          }}
                        >
                          <Calendar className="w-4 h-4" />
                          Dashboard
                        </motion.button>
                      </Link>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-destructive/30 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </motion.button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/60 text-sm font-bold text-foreground hover:bg-card/50 transition-colors"
                      >
                        <LogIn className="w-4 h-4" />
                        Login
                      </motion.button>
                    </Link>
                    <Link href="/booking-new">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border/60 text-sm font-bold text-primary-foreground shadow-lg"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                        }}
                      >
                        <Calendar className="w-4 h-4" />
                        Book Now
                      </motion.button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.nav>
      </div>

      {/* ── MOBILE NAV ── */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="md:hidden fixed top-0 left-0 right-0 z-50"
      >
        {/* Top bar */}
        <div
          className={`flex items-center justify-between px-4 h-16 transition-all duration-300 ${
            isScrolled
              ? "bg-background/85 backdrop-blur-xl border-b  border-border/50 shadow-md"
              : "bg-background/0"
          }`}
        >
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
              }}
            >
              <Scissors className="w-4 h-4 text-primary-foreground" />
            </div>
            <span
              className="text-lg font-black tracking-tight bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
              }}
            >
              Sahil Cutz
            </span>
          </a>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-border/60 bg-card/80 backdrop-blur-sm text-foreground"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isMobileMenuOpen ? (
                  <motion.span
                    key="x"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <X size={18} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Menu size={18} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Full-screen mobile drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              key="drawer"
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 top-16 bg-background/97 backdrop-blur-2xl flex flex-col overflow-y-auto"
              style={{ zIndex: 49 }}
            >
              {/* Decorative gradient blob */}
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle, var(--color-primary), var(--color-accent))",
                }}
              />

              <div className="flex flex-col flex-1 px-6 pt-8 pb-10 gap-2">
                {/* Nav links */}
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.name}
                    href={link.href}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setActiveLink(link.name);
                    }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: i * 0.06,
                      duration: 0.3,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-200 group"
                    style={{
                      background:
                        activeLink === link.name
                          ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
                          : "transparent",
                      borderColor:
                        activeLink === link.name
                          ? "color-mix(in srgb, var(--color-primary) 30%, transparent)"
                          : "var(--color-border)",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                        style={{
                          background:
                            activeLink === link.name
                              ? "linear-gradient(135deg, var(--color-primary), var(--color-accent))"
                              : "var(--color-muted)",
                          color:
                            activeLink === link.name
                              ? "var(--color-primary-foreground)"
                              : "var(--color-muted-foreground)",
                        }}
                      >
                        {link.icon}
                      </span>
                      <span
                        className="text-base font-semibold"
                        style={{
                          color:
                            activeLink === link.name
                              ? "var(--color-primary)"
                              : "var(--color-foreground)",
                        }}
                      >
                        {link.name}
                      </span>
                    </div>
                    <ChevronRight
                      size={16}
                      style={{
                        color:
                          activeLink === link.name
                            ? "var(--color-primary)"
                            : "var(--color-muted-foreground)",
                      }}
                    />
                  </motion.a>
                ))}

                {/* Divider */}
                <div className="my-4 h-px bg-border/60" />

                {/* CTA buttons */}
                {session ? (
                  <>
                    <div className="px-5 py-3 rounded-2xl bg-card/50 border border-border/60">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Logged in as
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {isAdmin ? "Admin" : session.user.full_name}
                      </p>
                    </div>

                    {isAdmin ? (
                      <motion.a
                        href="/admin/dashboard"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.34, duration: 0.32 }}
                        className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-primary-foreground font-bold text-base shadow-xl"
                        style={{
                          background:
                            "linear-gradient(135deg, #ef4444, #dc2626)",
                        }}
                      >
                        <span>Admin Dashboard</span>
                      </motion.a>
                    ) : (
                      <motion.a
                        href="/customer/dashboard"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.34, duration: 0.32 }}
                        className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-primary-foreground font-bold text-base shadow-xl"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                        }}
                      >
                        <Calendar className="w-5 h-5" />
                        My Dashboard
                      </motion.a>
                    )}

                    <motion.button
                      onClick={handleLogout}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.32 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center justify-center gap-3 px-6 py-4 rounded-lg border border-destructive/30 font-bold text-base text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.a
                      href="tel:+1234567890"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.34, duration: 0.32 }}
                      className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border border-border/60 bg-card/80 text-foreground font-semibold"
                    >
                      <Phone
                        className="w-4 h-4"
                        style={{ color: "var(--color-primary)" }}
                      />
                      Call Us
                    </motion.a>

                    <motion.a
                      href="/auth/login"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.37, duration: 0.32 }}
                      className="flex items-center justify-center gap-3 px-6 py-4 rounded-lg border border-border/60 font-bold text-base text-foreground hover:bg-card transition-colors"
                    >
                      <LogIn className="w-5 h-5" />
                      Customer Login
                    </motion.a>

                    <motion.a
                      href="/booking-new"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.32 }}
                      className="flex items-center justify-center gap-3 px-6 py-4 rounded-lg text-primary-foreground font-bold text-base shadow-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                      }}
                    >
                      <Calendar className="w-5 h-5" />
                      Book Now
                    </motion.a>

                    <motion.a
                      href="/admin/login"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.43, duration: 0.32 }}
                      className="flex items-center justify-center gap-3 px-6 py-4 rounded-lg border border-red-500/30 font-bold text-base text-red-600 hover:bg-red-500/10 transition-colors"
                    >
                      <span>Admin Access</span>
                    </motion.a>
                  </>
                )}
              </div>

              {/* Footer inside drawer */}
              <p className="text-center text-xs text-muted-foreground pb-8 opacity-50">
                © {new Date().getFullYear()} Sahil Cutz
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
