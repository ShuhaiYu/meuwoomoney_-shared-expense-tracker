import { Cat, PawPrint, Fish, Home, ShoppingBag, Car, Zap, DollarSign, Clapperboard } from "lucide-react";
import type { Category } from "@/lib/types";

export const CategoryIcon = ({ category, className }: { category: Category; className?: string }) => {
  switch (category) {
    case "Food": return <Fish className={className} />;
    case "Rent": return <Home className={className} />;
    case "Cats": return <Cat className={className} />;
    case "Shopping": return <ShoppingBag className={className} />;
    case "Transport": return <Car className={className} />;
    case "Utilities": return <Zap className={className} />;
    case "Entertainment": return <Clapperboard className={className} />;
    default: return <DollarSign className={className} />;
  }
};

export const PawIcon = ({ className }: { className?: string }) => (
  <PawPrint className={className} />
);
