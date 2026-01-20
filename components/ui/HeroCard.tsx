interface HeroCardProps {
  username: string;
  email: string;
  variant?: "light" | "dark";
}

export function HeroCard({ username, email, variant = "light" }: HeroCardProps) {
  const containerClasses =
    variant === "dark"
      ? "bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-zinc-950/40 px-4 py-2.5"
      : "bg-gradient-to-br from-white via-white to-zinc-50 rounded-2xl border border-zinc-200 hover:border-zinc-300 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-zinc-950/10 px-4 py-2.5";
  const avatarClasses =
    variant === "dark"
      ? "w-8 h-8 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-300 flex items-center justify-center flex-shrink-0"
      : "w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-600 flex items-center justify-center flex-shrink-0";
  const initialClasses =
    variant === "dark"
      ? "text-zinc-900 font-medium text-sm"
      : "text-white font-medium text-sm";
  const nameClasses =
    variant === "dark"
      ? "text-zinc-100 font-medium truncate text-sm"
      : "text-zinc-900 font-medium truncate text-sm";
  const emailClasses =
    variant === "dark"
      ? "text-zinc-400 text-xs truncate"
      : "text-zinc-500 text-xs truncate";

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={avatarClasses}>
          <span className={initialClasses}>
            {username.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className={nameClasses}>{username}</h3>
          {email && <p className={emailClasses}>{email}</p>}
        </div>
      </div>
    </div>
  );
}
