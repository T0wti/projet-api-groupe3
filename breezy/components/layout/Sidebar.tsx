import Link from 'next/link';

export default function Sidebar() {
  const navItems = [
    { name: 'Home', icon: '🏠', href: '/' },
    { name: 'Explore', icon: '🔍', href: '#' },
    { name: 'Notifications', icon: '🔔', href: '#' },
    { name: 'Messages', icon: '✉️', href: '#' },
    { name: 'Profile', icon: '👤', href: '#' },
    { name: 'More', icon: '⋯', href: '#' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-20 lg:w-62.5 h-screen sticky top-0 px-2 lg:px-6 py-4 border-r border-gray-200">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8 p-3 hover:bg-gray-100 rounded-full w-max">
        <span className="font-black text-2xl text-teal-700 tracking-tighter hidden lg:block">CHIRP</span>
        <span className="font-black text-2xl text-teal-700 block lg:hidden">C</span>
      </Link>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.href}
            className="flex items-center gap-4 text-xl p-3 hover:bg-gray-100 rounded-full transition-colors w-max lg:w-full"
          >
            <span>{item.icon}</span>
            <span className="hidden lg:block font-semibold">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Primary Action Button */}
      <button className="mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-full w-12.5 h-12.5 lg:w-full lg:h-auto flex items-center justify-center transition-colors">
        <span className="hidden lg:block">Post</span>
        <span className="block lg:hidden">+</span>
      </button>

      {/* User Mini Profile at bottom (Placeholder) */}
      <div className="mt-auto flex items-center gap-3 p-3 hover:bg-gray-100 rounded-full cursor-pointer w-max lg:w-full transition-colors">
        <img src="https://i.pravatar.cc/150?u=current" alt="Avatar" className="w-10 h-10 rounded-full" />
        <div className="hidden lg:block">
          <p className="font-bold text-sm">VibrantLife</p>
          <p className="text-gray-500 text-sm">@vibrantlife</p>
        </div>
      </div>
    </aside>
  );
}