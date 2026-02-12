'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate, Variants } from 'framer-motion'
import { ArrowRight, Globe, ShieldCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }
  }
}

const navVariants: Variants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: "easeOut" }
  }
}

const clipReveal: Variants = {
  hidden: { clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" },
  visible: {
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] as const, delay: 0.4 }
  }
}

export default function LandingPage() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const xPoint = (clientX - left) / width;
    const yPoint = (clientY - top) / height;

    mouseX.set(xPoint);
    mouseY.set(yPoint);
  }

  const rotateX = useTransform(mouseY, [0, 1], [5, -5]);
  const rotateY = useTransform(mouseX, [0, 1], [-5, 5]);

  return (
    <div
      className="min-h-screen bg-white overflow-x-hidden"
      onMouseMove={handleMouseMove}
    >

      <motion.nav
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all"
      >
        <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-32 h-8">
              <Image src="/logos/star-logo.jpg" alt="Star Cargo" fill className="object-contain object-left" priority />
            </div>
          </div>

          <div className="flex items-center gap-8">
            <Link href="https://starcargoservice.com" target="_blank" className="hidden md:block text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors">
              Sitio web
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/login"
                className="px-6 py-2.5 rounded-full bg-base-900 text-white text-sm font-bold hover:bg-blue-600 transition-all shadow-glow"
              >
                Acceder al portal
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      <main className="pt-20 lg:pt-0 min-h-screen flex items-center relative">
        <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 h-full">

          <div className="lg:col-span-5 flex flex-col justify-center px-6 lg:pl-20 lg:pr-12 py-20 z-10 bg-white">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.span
                variants={fadeInUp}
                className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wider mb-6 uppercase"
              >
                Sistema de Gestión Logística v2.0
              </motion.span>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl lg:text-[64px] leading-[1.1] font-black text-base-900 mb-6 tracking-tight"
              >
                Logística <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400 relative inline-block">
                  Inteligente.
                  <motion.span
                    className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }}
                  />
                </span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg text-gray-500 leading-relaxed mb-10 max-w-md font-medium"
              >
                Gestione sus operaciones de importación y exportación con la precisión que su negocio merece.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="group flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-base-900 transition-all shadow-soft"
                >
                  Ingresar al portal
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="flex items-center gap-2 px-4 text-sm font-semibold text-gray-400">
                  <ShieldCheck className="w-4 h-4" />
                  Plataforma segura
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="lg:col-span-7 relative min-h-[50vh] lg:h-auto lg:min-h-screen">
            <div className="absolute inset-0 bg-base-900 lg:bg-transparent"></div>

            <motion.div
              className="absolute inset-0 w-full h-full clip-diagonal overflow-hidden"
              variants={clipReveal}
              initial="hidden"
              animate="visible"
            >
              <div className="absolute inset-0 bg-base-900/30 z-10 mix-blend-multiply"></div>
              <motion.div
                className="relative w-full h-full"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 1.5 }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1494412574643-35d324698428?q=80&w=2000&auto=format&fit=crop"
                  alt="Logística Global"
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            </motion.div>

            <motion.div
              style={{ rotateX, rotateY, perspective: 1000 }}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 1, type: "spring" }}
              className="hidden lg:block absolute bottom-20 right-20 z-20"
            >
              <div className="bg-white/95 backdrop-blur shadow-2xl p-6 rounded-2xl border border-white/40 max-w-xs transform hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Cobertura Global</p>
                    <p className="text-base-900 font-bold text-lg">Rastreo en tiempo real</p>
                    <div className="w-full h-1 bg-gray-100 mt-3 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "66%" }}
                        transition={{ delay: 1.5, duration: 1.5, ease: "circOut" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  )
}