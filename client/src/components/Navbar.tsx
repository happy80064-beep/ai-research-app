import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Menu, X, Brain, ChevronDown, Globe } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const productLinks = [
    { href: "/studies/new", label: t("nav.products"), description: t("nav.productsDesc") },
  ];

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/case-studies", label: t("nav.caseStudies") },
    { href: "/pricing", label: t("nav.pricing") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-soft">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              ResearchAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {/* Products Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground gap-1">
                  {t("nav.products")}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {productLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className="flex flex-col items-start gap-1 p-3">
                      <span className="font-medium">{link.label}</span>
                      <span className="text-xs text-muted-foreground">{link.description}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className={`${
                    location === link.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Auth & Language Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">{language === "zh" ? "中文" : "EN"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLanguage("zh")}>
                  简体中文
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage("en")}>
                  English
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {loading ? (
              <div className="w-20 h-9 bg-muted animate-pulse rounded-lg" />
            ) : isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    {t("nav.dashboard")}
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 rounded-full">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">
                          {user?.name?.charAt(0) || "U"}
                        </span>
                      </div>
                      {user?.name || "User"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">{t("nav.myStudies")}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => logout()}>
                      {t("nav.signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    {t("nav.signIn")}
                  </Button>
                </a>
                <Link href="/studies/new">
                  <Button className="btn-neon">
                    {t("hero.cta")}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              
              <div className="h-px bg-border my-2" />
              
              {/* Language Switcher Mobile */}
              <div className="flex items-center gap-2 px-3 py-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <button
                  onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {language === "zh" ? "Switch to English" : "切换到中文"}
                </button>
              </div>
              
              <div className="h-px bg-border my-2" />
              
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t("nav.dashboard")}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    {t("nav.signOut")}
                  </Button>
                </>
              ) : (
                <>
                  <a href={getLoginUrl()}>
                    <Button variant="ghost" className="w-full justify-start">
                      {t("nav.signIn")}
                    </Button>
                  </a>
                  <Link href="/studies/new">
                    <Button className="w-full btn-neon" onClick={() => setMobileMenuOpen(false)}>
                      {t("hero.cta")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
