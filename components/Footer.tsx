'use client';

import { motion } from 'motion/react';
import { Scissors, MapPin, Phone, Mail, Clock, Share2, Camera, MessageCircle, ArrowUpRight, ChevronRight } from 'lucide-react';

export function Footer() {
  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'About', href: '#about' },
    { name: 'Testimonials', href: '#testimonials' },
    { name: 'Contact', href: '#contact' },
  ];

  const services = [
    'Classic Haircut',
    'Beard Trim',
    'Hot Towel Shave',
    'Hair Coloring',
    'Styling',
  ];

  const socialLinks = [
    { icon: Share2, href: '#', label: 'Facebook' },
    { icon: Camera, href: '#', label: 'Instagram' },
    { icon: MessageCircle, href: '#', label: 'Twitter' },
  ];

  const contactItems = [
    { icon: MapPin, lines: ['123 Luxury Street, Downtown', 'District, NY 10001'] },
    { icon: Phone, lines: ['+1 (555) 123-4567'] },
    { icon: Mail, lines: ['hello@sahilcutzz.com'] },
    { icon: Clock, lines: ['Mon–Fri: 9:00 AM – 8:00 PM', 'Sat–Sun: 10:00 AM – 6:00 PM'] },
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
          <motion.a
            href="#booking"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow duration-300"
          >
            Book Appointment
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </motion.a>
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
                Sahil Cutzz
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

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-4"
          >
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-4 h-px bg-primary inline-block" />
              Services
            </h3>
            <ul className="space-y-2.5">
              {services.map((service, i) => (
                <motion.li
                  key={service}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 + i * 0.06, duration: 0.4 }}
                >
                  <a
                    href="#services"
                    className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                    {service}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-4"
          >
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-4 h-px bg-primary inline-block" />
              Contact Info
            </h3>
            <ul className="space-y-4">
              {contactItems.map(({ icon: Icon, lines }, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35 + i * 0.08, duration: 0.4 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
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
          </motion.div>
        </div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="border-t border-border pt-8 pb-8"
        >
          <div className="bg-card/50 backdrop-blur-xl rounded-2xl p-6 border border-border/60 flex flex-col md:flex-row items-center gap-6">
            {/* Left */}
            <div className="flex-shrink-0">
              <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1">Newsletter</p>
              <h4 className="text-base font-bold text-foreground">Exclusive Offers & Grooming Tips</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Join our list — no spam, ever.</p>
            </div>

            {/* Input */}
            <div className="flex gap-2 flex-1 w-full md:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-300"
              />
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-md shadow-primary/20 hover:shadow-primary/40 transition-shadow duration-300 whitespace-nowrap"
              >
                Subscribe
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="py-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Sahil Cutzz. All rights reserved.
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