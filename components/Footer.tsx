'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Scissors, MapPin, Phone, Mail, Clock, Share2, Camera, MessageCircle, ArrowUpRight, ChevronRight } from 'lucide-react';

export function Footer() {
  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Contact', href: '#contact' },
  ];

  const legalLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms & Conditions', href: '/terms-and-conditions' },
    { name: 'Refund & Cancellation Policy', href: '/refund-policy' },
  ];

  const socialLinks = [
    { icon: Share2, href: '#', label: 'Facebook' },
    { icon: Camera, href: '#', label: 'Instagram' },
    { icon: MessageCircle, href: '#', label: 'Twitter' },
  ];

  const contactItems = [
    { icon: MapPin, lines: ['P 1024/4 USMAN PLAZA GROUND FLOOR, MIAN ASGHAR MALL ROAD RAWALPINDI, Rawalpindi,'] },
    { icon: Phone, lines: ['+92 342 1480405'] },
    { icon: Mail, lines: ['sahilcutzz@gmail.com'] },
    // { icon: Clock, lines: ['Mon–Fri: 9:00 AM – 8:00 PM', 'Sat–Sun: 10:00 AM – 6:00 PM'] },
  ];

  return (
    <footer id="contact" className="relative bg-background border-t border-border overflow-hidden">

      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-primary rounded-full blur-[120px] opacity-[0.05]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-accent rounded-full blur-[100px] opacity-[0.05]" />
      </div>

      {/* Thin top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="py-10 border-b border-border flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1">Ready for a fresh look?</p>
            <h3 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              Book Your Session Today
            </h3>
          </div>
          <Link href="/booking" className="group inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow duration-300 no-underline">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full h-full flex items-center gap-2"
            >
              Book Appointment
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </motion.div>
          </Link>
        </motion.div>

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 py-14">

          {/* Brand col */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-5 lg:col-span-1"
          >
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <Scissors className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">
                Sahil Cutz
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium grooming for the modern gentleman. Luxury barbering at its finest — where craft meets comfort.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social, i) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-9 h-9 bg-card border border-border rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary-foreground hover:bg-primary hover:border-primary transition-all duration-300 shadow-sm"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>

            {/* Open badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-semibold text-primary uppercase tracking-widest">Open Today</span>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="space-y-4"
          >
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-4 h-px bg-primary inline-block" />
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link, i) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
                >
                  <a
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Legal — required for payment gateway approval (privacy, terms, refund policy, etc.) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-4"
          >
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-4 h-px bg-primary inline-block" />
              Legal
            </h3>
            <ul className="space-y-2.5">
              {legalLinks.map((link, i) => (
                <motion.li
                  key={link.name}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
                >
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 no-underline"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                    {link.name}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="space-y-4"
          >
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-4 h-px bg-primary inline-block" />
              Find Us
            </h3>
            <div className="rounded-2xl border border-border/70 bg-card/60 p-2 shadow-sm shadow-black/5">
              <iframe
                src="https://www.google.com/maps?q=P%201024%2F4%20USMAN%20PLAZA%20GROUND%20FLOOR%20MIAN%20ASGHAR%20MALL%20ROAD%20RAWALPINDI&z=15&output=embed"
                title="Sahil Cutz location"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-44 w-full rounded-xl border-0"
              />
              <a
                href="https://www.google.com/maps/search/?api=1&query=P%201024%2F4%20USMAN%20PLAZA%20GROUND%20FLOOR%20MIAN%20ASGHAR%20MALL%20ROAD%20RAWALPINDI"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80"
              >
                Open in Google Maps →
              </a>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="border-t border-border/70 pt-8 pb-4"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                <span className="w-4 h-px bg-primary inline-block" />
                Contact Info
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Visit us at P 1024/4 Usman Plaza, Ground Floor, Mian Asghar Mall Road, Rawalpindi.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contactItems.map(({ icon: Icon, lines }, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35 + i * 0.08, duration: 0.4 }}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/50 px-4 py-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    {lines.map((line, j) => (
                      <p key={j} className="text-sm text-muted-foreground leading-snug">{line}</p>
                    ))}
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Newsletter */}
       

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="py-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Sahil Cutz. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Crafted with</span>
            <span className="text-primary">✦</span>
            <span>excellence for modern gentlemen.</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
