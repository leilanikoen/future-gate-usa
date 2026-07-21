import Logo from "../ui/Logo.jsx";

/**
 * Split auth layout: a violet gradient panel (branding) beside the form.
 * The panel is hidden below lg; on small screens only the form shows, with a
 * compact logo on top.
 */
export default function AuthLayout({ panelEyebrow, panelHeadline, panelFoot, children }) {
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="mx-auto max-w-6xl min-h-[calc(100vh-3rem)] grid lg:grid-cols-2 gap-6 items-stretch">
        {/* gradient brand panel */}
        <div className="hidden lg:flex relative rounded-3xl overflow-hidden p-8 flex-col justify-between text-white
                        bg-gradient-to-br from-sky-400 via-brand-500 to-brand-800">
          <Logo />
          <div>
            {panelEyebrow && <div className="text-white/70 text-sm mb-2">{panelEyebrow}</div>}
            <h2 className="text-4xl font-bold leading-tight tracking-tight">{panelHeadline}</h2>
            {panelFoot && <p className="text-white/80 mt-4 max-w-sm">{panelFoot}</p>}
            <div className="mt-6 h-px w-2/3 bg-white/30" />
          </div>
        </div>

        {/* form side */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8"><Logo /></div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
