import { useBranding } from "../services/BrandingContext";

// ponytail: single shared icon markup instead of the 3 copy-pasted inline <svg> blocks
// that used to live in AdminDashboard/ClientPortal — same visual, one place to change.
export default function Logo({ size = "w-9 h-9", iconSize = "w-5 h-5" }) {
  const { logoUrl } = useBranding();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Logo"
        className={`${size} rounded-xl object-cover shrink-0`}
      />
    );
  }

  return (
    <div className={`${size} bg-brand-600 rounded-xl flex items-center justify-center shrink-0`}>
      <svg className={`${iconSize} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.297A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    </div>
  );
}
