import { Link } from "react-router";
import logo from "../../assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`} aria-label="Platforma eMIP, pagina principală">
      <img src={logo} alt="" width={36} height={36} className="size-9" />
      <span className="text-xl font-bold tracking-tight text-white">
        eMIP<sup className="ml-0.5 text-[0.55em] font-medium text-brand-400">®</sup>
      </span>
    </Link>
  );
}
