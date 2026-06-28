'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Phone, Mail, Clock, Scissors, Send } from 'lucide-react';

const contactItems = [
  { icon: MapPin, label: 'Address', lines: ['123 Luxury Street, Downtown', 'District, NY 10001'] },
  { icon: Phone, label: 'Phone', lines: ['+1 (555) 123-4567'] },
  { icon: Mail, label: 'Email', lines: ['hello@sahilcutzz.com'] },
  { icon: Clock, label: 'Hours', lines: ['Mon–Fri: 9:00 AM – 8:00 PM', 'Sat–Sun: 10:00 AM – 6:00 PM'] },
];

export default function ContactPage() {
  return (
    <main className="relative bg-background min-h-screen overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-primary rounded-full blur-[120px] opacity-[0.05]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-accent rounded-full blur-[100px] opacity-[0.05]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">

        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 no-underline mb-10">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }} className="mb-12 text-center md:text-left">
          <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
            <div className="w-11 h-11 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xs text-primary font-semibold uppercase tracking-widest">Get In Touch</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-3">Contact Us</h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mx-auto md:mx-0">
            Questions about a booking, a service, or anything else? Reach us directly, or send a message below.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Contact details */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border/60 p-6 md:p-8 space-y-6"
          >
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <span className="w-4 h-px bg-primary inline-block" />
              Business Details
            </h2>
            <ul className="space-y-5">
              {contactItems.map(({ icon: Icon, label, lines }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
                    {lines.map((line, j) => (
                      <p key={j} className="text-sm text-foreground leading-snug">{line}</p>
                    ))}
                  </div>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-border/60">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Registered business name: <span className="text-foreground">Sahil Cutzz</span>. For payment or refund support, please include your booking reference.
              </p>
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border/60 p-6 md:p-8"
          >
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2 mb-6">
              <span className="w-4 h-px bg-primary inline-block" />
              Send a Message
            </h2>
            <form className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-300"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Email or Phone</label>
                <input
                  type="text"
                  placeholder="How can we reach you?"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-300"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Message</label>
                <textarea
                  rows={4}
                  placeholder="How can we help?"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors duration-300 resize-none"
                />
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow duration-300"
              >
                Send Message
                <Send className="w-4 h-4" />
              </motion.button>
            </form>
          </motion.div>
        </div>
      </div>
    </main>
  );
}