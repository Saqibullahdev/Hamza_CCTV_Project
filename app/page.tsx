import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Shield, Camera, BarChart3, Clock, Phone, Mail, MapPin, CheckCircle2, ArrowRight, Cctv, Store, Package, QrCode, FileText } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Header */}
      <header className="px-4 lg:px-6 h-20 flex items-center border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <Cctv className="h-8 w-8 text-primary" />
          <span className="text-xl font-black tracking-tighter uppercase italic">HK TRADER</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-bold uppercase hover:text-primary transition-colors" href="#services">
            Services
          </Link>
          <Link className="text-sm font-bold uppercase hover:text-primary transition-colors" href="#rules">
            Rules
          </Link>
          <Link className="text-sm font-bold uppercase hover:text-primary transition-colors" href="#contact">
            Contact
          </Link>
          <Button asChild size="sm" className="font-bold uppercase rounded-full px-6 active:scale-95 transition-transform">
            <Link href="/dashboard">
              Dashboard
            </Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-48 overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* Background glow effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
          </div>
          <div className="container relative z-10 px-4 md:px-6 mx-auto">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary w-fit">
                  <Shield className="mr-1 h-3.5 w-3.5" /> Premium Security Solutions
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-black tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl uppercase leading-none">
                    ELEVATE YOUR <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">SURVEILLANCE</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl font-medium">
                    Professional inventory management and advanced analytics for the modern security shop. HK TRADER provides cutting-edge tools to track, manage, and scale your business.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
                  <Button asChild size="lg" className="font-black uppercase tracking-tight py-7 px-8 rounded-xl gap-2 text-lg shadow-[0_0_20px_rgba(var(--primary),0.3)] active:scale-95 transition-transform">
                    <Link href="/dashboard">
                      Go to Dashboard <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Link href="#services">
                    <Button variant="outline" size="lg" className="font-black uppercase tracking-tight py-7 px-8 rounded-xl text-lg backdrop-blur-sm">
                      Explore Services
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative aspect-square lg:aspect-auto h-full min-h-[400px] flex items-center justify-center">
                <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                  <Image
                    src="/cctv_premium_hero.png"
                    alt="Premium Surveillance"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30 relative">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tighter sm:text-5xl uppercase">OUR SERVICES</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl font-medium">
                  We provide a comprehensive range of security solutions tailored for your protection.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Wifi Camera Solutions",
                  description: "State-of-the-art wireless surveillance cameras with AI-powered detection and remote smartphone monitoring.",
                  icon: Camera,
                },
                {
                  title: "Computer Networking",
                  description: "Professional network infrastructure setup, including routers, switches, and secure wired/wireless connectivity.",
                  icon: Cctv,
                },
                {
                  title: "Biometric Access Control",
                  description: "Advanced finger-print and facial recognition systems to secure your premises with modern access management.",
                  icon: Shield,
                },
                {
                  title: "Smart CCTV Systems",
                  description: "High-definition multi-channel DVR/NVR surveillance setups with professional installation services.",
                  icon: Cctv,
                },
                {
                  title: "Inventory Management",
                  description: "Advanced tracking for security hardware, ensuring precise stock control for your growing business.",
                  icon: Package,
                },
                {
                  title: "Digital Invoicing",
                  description: "Professional PDF invoices and digital receipt management for all client transactions.",
                  icon: FileText,
                },
              ].map((service, i) => (
                <Card key={i} className="bg-card/50 border-white/5 backdrop-blur-sm hover:border-primary/20 transition-all duration-300 group">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-black uppercase tracking-tight">{service.title}</CardTitle>
                    <CardDescription className="font-medium text-muted-foreground leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Rules & Policies Section */}
        <section id="rules" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src="/security_surveillance_premium.png"
                  alt="Security Policy"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-black tracking-tighter sm:text-5xl uppercase">RULES & POLICIES</h2>
                  <p className="text-muted-foreground md:text-xl font-medium leading-relaxed">
                    Operating with integrity and transparency is our core foundation. Below are our key operational guidelines.
                  </p>
                </div>
                <ul className="space-y-4">
                  {[
                    "Prices are subject to change without prior notice.",
                    "Payment is due within 30 days of invoice date.",
                    "Warranty is provided as per manufacturer's terms.",
                    "Installation charges may apply.",
                    "All security data is handled with strict confidentiality.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-white/5">
                      <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                      <span className="font-bold text-sm tracking-wide">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <h2 className="text-3xl font-black tracking-tighter sm:text-5xl uppercase">CONNECT WITH US</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl font-medium">
                Visit our physical store or reach out through digital channels.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center p-8 rounded-3xl bg-card border border-white/5 space-y-4 text-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-black uppercase tracking-tight">Main Outlet</h3>
                <p className="text-muted-foreground font-medium">Shop On 1st Floor B Block<br />New Spinzer IT Tower<br />University Road Peshawar</p>
              </div>
              <div className="flex flex-col items-center p-8 rounded-3xl bg-card border border-white/5 space-y-4 text-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-black uppercase tracking-tight">Contact Support</h3>
                <p className="text-muted-foreground font-medium">0312 0191921<br />Available 10 AM - 8 PM</p>
              </div>
              <div className="flex flex-col items-center p-8 rounded-3xl bg-card border border-white/5 space-y-4 text-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-black uppercase tracking-tight">Business Inquiry</h3>
                <p className="text-muted-foreground font-medium">khalilhamza2727@gmail.com</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 bg-background border-t border-white/5">
        <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-medium italic uppercase tracking-widest">
            © 2024 HK TRADER. ALL RIGHTS RESERVED.
          </p>
          <nav className="flex gap-4 sm:gap-6">
            <Link className="text-xs font-bold uppercase hover:underline underline-offset-4" href="#">
              Terms of Service
            </Link>
            <Link className="text-xs font-bold uppercase hover:underline underline-offset-4" href="#">
              Privacy Policy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
