import { cn } from "../../lib/cn.js";

export default function Card({ className, children, ...props }) {
  return (
    <div className={cn("bg-surface border border-hairline rounded-2xl", className)} {...props}>
      {children}
    </div>
  );
}
