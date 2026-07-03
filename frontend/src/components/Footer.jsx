import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="border-t border-gray-800/50 px-6 py-6 mt-12">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <p className="text-gray-500 text-sm">
          HireReady AI © 2024 All rights reserved.
        </p>
        <div className="flex gap-6">
          <span className="text-gray-500 text-sm cursor-pointer hover:text-gray-300 transition">Gizlilik Politikası</span>
          <span className="text-gray-500 text-sm cursor-pointer hover:text-gray-300 transition">Kullanım Şartları</span>
          <span className="text-gray-500 text-sm cursor-pointer hover:text-gray-300 transition">Destek</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer