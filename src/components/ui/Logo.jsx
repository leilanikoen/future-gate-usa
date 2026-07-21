import { GraduationCap } from "lucide-react";
import { cn } from "../../lib/cn.js";

export default function Logo({ compact = false, className }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid place-items-center w-9 h-9 rounded-xl shadow-sm shrink-0
                       bg-gradient-to-br from-sky-400 to-brand-600">
        <GraduationCap className="w-[18px] h-[18px] text-white" />
      </span>
      {!compact && (
        <span className="font-bold text-[15px] tracking-tight">
          Future Gate <span className="text-brand-600">USA</span>
        </span>
      )}
    </div>
  );
}
