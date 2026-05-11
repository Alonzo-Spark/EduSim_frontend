import { createFileRoute, Link } from "@tanstack/react-router";
import { PageWrapper } from "@/components/Card";
import { useSavedSimulations } from "@/hooks/useSavedSimulations";
import { Heart, Rocket, Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { simulations, toggleFavorite } = useSavedSimulations();
  const favorites = simulations.filter(s => s.favorite);

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="glass-strong rounded-3xl p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gradient mb-2 text-gradient-heart flex items-center gap-3">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
            Favorite Simulations
          </h1>
          <p className="text-sm text-muted-foreground">
            Quickly access your most important experiments and discoveries.
          </p>
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((sim) => (
              <div key={sim.id} className="glass-strong rounded-3xl p-6 group hover:border-primary/50 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-2xl bg-secondary group-hover:bg-primary/10 group-hover:scale-110 transition-all">
                    <Rocket className="w-6 h-6 text-primary" />
                  </div>
                  <button 
                    onClick={() => toggleFavorite(sim.id)}
                    className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                  >
                    <Heart className="w-5 h-5 fill-rose-500" />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-1">{sim.title}</h3>
                <p className="text-xs text-muted-foreground mb-4 font-bold uppercase tracking-widest">{sim.subject}</p>
                
                <div className="flex items-center justify-between gap-2 mt-auto">
                  <span className="text-[10px] text-muted-foreground">{new Date(sim.createdAt).toLocaleDateString()}</span>
                  <Link to="/my-simulations">
                    <Button size="sm" variant="ghost" className="text-accent hover:bg-accent/10 gap-2">
                      Launch <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6 border border-border shadow-2xl">
              <Heart className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No Favorites Yet</h2>
            <p className="text-muted-foreground max-w-sm mb-8">
              Star your best simulations in the library to see them here for quick access.
            </p>
            <Link to="/my-simulations">
              <Button className="rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold px-8 py-6 h-auto hover:scale-105 transition-transform shadow-lg shadow-rose-500/20">
                Explore Library
              </Button>
            </Link>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
