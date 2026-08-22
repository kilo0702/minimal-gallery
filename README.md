# Minimal Gallery

A sleek, modern photography portfolio and moments feed built with **Next.js 16 (App Router)**, **Prisma**, and **SQLite**. Features a glassmorphic UI, waterfall masonry grid, swipeable lightbox modal, and a fully responsive admin dashboard.

---

## ✨ Features

- **📸 Photo Albums & Text Posts**: Support for multi-image albums, video formats (`.mp4`, `.mov`, etc.), and formatted text notes.
- **📌 Pinned Posts & Categorization**: Pin featured moments to the top and filter by years, custom tags, or post types.
- **🖼️ Interactive Lightbox Modal**: Smooth multi-image carousel with swipe gestures and drag-to-scroll thumbnail strip.
- **⚡ Dynamic Marquee Announcement**: Customizable broadcast banner for announcements and news.
- **📱 Responsive Admin Dashboard**: Complete content management system optimized for both desktop and mobile portrait screens.
- **🎨 Live Branding Customization**: Change site name, hero titles, favicon, and hero wallpaper directly from the admin panel.
- **🛡️ Safe Data Isolation**: Pre-configured `.gitignore` keeps your SQLite database (`dev.db`) and uploaded media (`/public/uploads/`) untouched during UI updates.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kilo0702/minimal-gallery.git
   cd minimal-gallery
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Initialize the database:**
   ```bash
   npx prisma db push
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   - **Frontend Gallery**: [http://localhost:3000](http://localhost:3000)
   - **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 🔄 Updating an Existing Project

If you already have a running instance with your own photos and database, you can safely update the UI features without losing any data:

```bash
git pull origin main
npm install
npx prisma db push
npm run build
```

> **Note**: Your database (`dev.db`) and uploaded photos (`/public/uploads/`) are protected and will never be overwritten.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: SQLite with [Prisma ORM](https://www.prisma.io/)
- **Styling**: Modern CSS Modules (Glassmorphism & Responsive Flex/Grid)
- **Icons**: [FontAwesome 6](https://fontawesome.com/)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

