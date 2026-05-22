import React from "react";
import { motion } from "framer-motion";
import { Play, Heart, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useSimulationStore } from "@/store/useSimulationStore";
import { toast } from "sonner";

interface SimulationCardProps {
  id: string;
  title: string;
  topic: string;
  date: string;
  thumbnail?: string;
  isFavorite?: boolean;
}

export function SimulationCard({ id, title, topic, date, thumbnail, isFavorite: initialFavorite = false }: SimulationCardProps) {
  const { toggleFavorite, favorites } = useSimulationStore();
  const isFavorite = favorites.includes(id);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
    if (!isFavorite) {
      toast.success(`"${title}" added to favorites`);
    } else {
      toast.info(`"${title}" removed from favorites`);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-strong rounded-3xl overflow-hidden border border-border hover:border-primary/50 transition-all group"
    >
      <div className="aspect-video bg-secondary relative overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <Play className="w-12 h-12 text-muted-foreground/20 group-hover:text-primary/50 transition-colors" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Button 
            onClick={handleToggleFavorite}
            variant="ghost" 
            size="icon" 
            className={`rounded-xl h-9 w-9 glass-strong ${isFavorite ? "text-rose-500" : "text-muted-foreground"}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-lg bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider">
            {topic}
          </span>
        </div>
        <h3 className="font-bold text-lg text-foreground mb-3 line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {date}
          </div>
          <Link to="/simulation/$topic" params={{ topic: id }}>
             <Button variant="ghost" size="sm" className="rounded-xl group/btn hover:text-accent">
                Open <ArrowRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
             </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
