'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, BarChart3, Globe, Shield, Truck, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#000D42] text-white selection:bg-blue-500/30 relative overflow-hidden">
      {/* Noise Texture */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 border-b border-white/5 bg-[#000D42]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 overflow-hidden rounded-xl border border-white/10 shadow-lg shadow-blue-500/20">
              <Image src="/logos/star-logo.jpg" alt="Star CRM" fill className="object-cover" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white/90">Star CRM</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/login" className="text-sm font-medium text-blue-200/80 hover:text-white transition-colors">
              Soporte
            </Link>
            <Link
              href="/login"
              className="relative px-5 py-2 overflow-hidden rounded-full group"
            >
              <div className="absolute inset-0 w-full h-full transition-all duration-300 pointer-events-none bg-gradient-to-r from-blue-600 to-blue-500 opacity-20 group-hover:opacity-100 blur"></div>
              <div className="absolute inset-0 w-full h-full bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative border border-blue-500/50 rounded-full px-5 py-2 backdrop-blur-sm group-hover:border-transparent transition-colors">
                <span className="text-sm font-semibold text-blue-100 group-hover:text-white relative z-10 transition-colors">Iniciar Sesión</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-24 lg:pt-48 lg:pb-40 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] -z-10 mix-blend-screen pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 -z-20"></div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold tracking-wide uppercase mb-8 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Logistics Management System v2.0
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-white max-w-5xl mx-auto leading-[1.05]"
          >
            El Futuro de la <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-200 to-blue-400 inline-block relative py-1">
              Logística Inteligente
              <div className="absolute -bottom-1 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-blue-100/60 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
          >
            Optimiza operaciones, gestiona clientes y trackea envíos en tiempo real con una plataforma diseñada para la excelencia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link
              href="/login"
              className="group relative min-w-[180px] h-12 flex items-center justify-center rounded-full bg-white text-[#000D42] font-bold text-base transition-all hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-white to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10">Comenzar Ahora</span>
            </Link>
            <Link
              href="/login"
              className="min-w-[180px] h-12 flex items-center justify-center rounded-full border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white font-semibold text-base transition-all"
            >
              Solicitar Demo
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 relative z-10 bg-[#00092e]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Truck, title: "Gestión de Flotas", desc: "Control total sobre tus unidades. Asignación inteligente y monitoreo en tiempo real.", color: "blue" },
              { icon: BarChart3, title: "Analítica Avanzada", desc: "Dashboards interactivos con KPIs cruciales para la toma de decisiones.", color: "purple" },
              { icon: Shield, title: "Seguridad Total", desc: "Protección de datos nivel empresarial con encriptación de punta a punta.", color: "emerald" }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-${feature.color}-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}></div>
                <div className="relative z-10">
                  <div className={`w-12 h-12 bg-${feature.color}-500/10 rounded-2xl flex items-center justify-center mb-6 text-${feature.color}-400 group-hover:scale-110 transition-transform duration-300 border border-${feature.color}-500/20`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-200 transition-colors">{feature.title}</h3>
                  <p className="text-blue-200/50 leading-relaxed text-sm">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#00051a]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
            <div className="w-5 h-5 bg-white/10 rounded-full"></div>
            <span className="text-xs font-medium">Star CRM © 2026</span>
          </div>
          <div className="flex gap-8 text-xs font-medium text-blue-200/40">
            <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-white transition-colors">Términos</Link>
            <Link href="#" className="hover:text-white transition-colors">Contacto</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}