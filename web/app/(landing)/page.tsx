import { MainButtons } from "./HomeButtons";
import { HomeFeatures } from "./HomeFeatures";
import { Navbar } from "./components/Navbar";
import { HeroGraphic } from "./components/HeroGraphic";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/90 to-muted/80">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-white bg-[size:36px_36px] opacity-15" />
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-background/90 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

      {/* Decorative elements */}
      <div
        className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-30 animate-pulse"
        style={{ animationDuration: "8s" }}
      />
      <div
        className="absolute bottom-20 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl opacity-20 animate-pulse"
        style={{ animationDuration: "10s" }}
      />
      <div
        className="absolute top-1/2 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl opacity-20 animate-pulse"
        style={{ animationDuration: "12s" }}
      />
      <div
        className="absolute bottom-1/3 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl opacity-20 animate-pulse"
        style={{ animationDuration: "15s" }}
      />

      {/* Floating elements */}
      <div
        className="absolute top-1/4 right-1/3 w-6 h-6 rounded-full bg-primary/30 animate-float"
        style={{ animationDuration: "7s" }}
      />
      <div
        className="absolute bottom-1/4 left-1/3 w-4 h-4 rounded-full bg-primary/20 animate-float"
        style={{ animationDuration: "9s" }}
      />

      <Navbar />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <main className="mt-32">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div
              className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20 text-sm font-medium text-primary animate-float"
              style={{ animationDuration: "5s" }}
            >
              Introducing Vense CRM
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/90 to-primary/80 leading-tight">
              Streamline Your Business Operations
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Manage contacts, track invoices, and grow your business with
              Vense&apos;s all-in-one CRM solution.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mb-8">
              <MainButtons />
            </div>

            {/* Interactive 3D-like hero graphic */}
            <HeroGraphic />

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
              <div className="text-sm text-muted-foreground flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>99.9% Uptime</span>
              </div>
              <div className="text-sm text-muted-foreground flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Enterprise-grade Security</span>
              </div>
              <div className="text-sm text-muted-foreground flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
                </svg>
                <span>10K+ Active Users</span>
              </div>
            </div>
          </div>

          <div className="mt-32 animate-fade-in-delayed">
            <div className="flex items-center justify-center mb-12">
              <div className="h-px w-12 bg-primary/30 mr-4"></div>
              <h2 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                What you&apos;ll get
              </h2>
              <div className="h-px w-12 bg-primary/30 ml-4"></div>
            </div>
            <HomeFeatures />
          </div>
        </main>
      </div>
    </div>
  );
}
