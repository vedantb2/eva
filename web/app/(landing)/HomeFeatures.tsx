"use client";

import { Users, FileText, BarChart3, ChevronRight } from "lucide-react";

const features = [
  {
    title: "Contact management",
    description:
      "Organise and manage your contacts efficiently with advanced filtering and tagging.",
    icon: Users,
    color: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-500",
    bgGlow: "bg-blue-500/5",
  },
  {
    title: "Invoice management",
    description:
      "Create and track professional invoices, manage payments, and automate reminders.",
    icon: FileText,
    color: "from-green-500/20 to-green-600/5",
    iconColor: "text-green-500",
    bgGlow: "bg-green-500/5",
  },
  {
    title: "Business analytics",
    description:
      "Get insights into your business performance with detailed reports and analytics.",
    icon: BarChart3,
    color: "from-purple-500/20 to-purple-600/5",
    iconColor: "text-purple-500",
    bgGlow: "bg-purple-500/5",
  },
];

export function HomeFeatures() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <div
          key={index}
          className="group relative p-8 rounded-2xl bg-card/10 border border-border/20 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-1 backdrop-blur-md overflow-hidden"
        >
          {/* Background effect */}
          <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-all duration-500`} />
          
          {/* 3D Card effect - edges highlight */}
          <div className="absolute inset-px rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
          
          {/* Shadow effects for depth */}
          <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/30 to-primary/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl" />
          <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full ${feature.bgGlow} blur-3xl opacity-0 group-hover:opacity-70 transition-all duration-700 delay-100`} />
          
          <div className="relative">
            {/* Icon container with highlight effects */}
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/5 mb-6 group-hover:scale-110 transition-all duration-500 overflow-hidden">
              {/* Icon highlight glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100" />
              
              {/* Icon with shimmer effect */}
              <div className="relative z-10 p-3 rounded-xl backdrop-blur-sm">
                <feature.icon className={`h-10 w-10 ${feature.iconColor} group-hover:text-primary transition-colors duration-500`} />
              </div>
              
              {/* Bottom highlight for 3D effect */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover:opacity-80 transition-all duration-500" />
            </div>
            
            {/* Content with hover effects */}
            <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
            <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors duration-500">{feature.description}</p>
            
            {/* Interactive button */}
            <div className="mt-6 flex items-center gap-2">
              <div className="relative overflow-hidden w-8 h-8 rounded-full flex items-center justify-center bg-background/50 border border-border/30 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-500">
                <ChevronRight className="h-4 w-4 text-primary transform translate-x-0 group-hover:translate-x-5 transition-transform duration-500" />
                <ChevronRight className="h-4 w-4 text-primary absolute -left-5 transform group-hover:translate-x-5 transition-transform duration-500" />
              </div>
              <span className="text-sm font-medium text-muted-foreground opacity-0 transform -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">Learn more</span>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-300" />
            <div className="absolute top-4 right-8 w-1.5 h-1.5 rounded-full bg-primary/15 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200" />
            <div className="absolute top-4 right-12 w-1 h-1 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100" />
          </div>
        </div>
      ))}
    </div>
  );
} 
