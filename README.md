# Brian's Portfolio

A modern, interactive portfolio application built with React, TypeScript, and Supabase. Features dynamic content management, case study presentations, and a fully customizable admin interface.

## 🚀 Live Demo

[View Live Portfolio](https://portfolio-three-ochre-48.vercel.app/) <!-- Replace with your actual URL -->

## ✨ Features

- **Dynamic Content Management** - Edit content directly through the UI
- **Case Study Presentations** - Detailed project showcases with image galleries
- **Real-time Data Persistence** - Supabase integration for data storage
- **Responsive Design** - Optimized for all device sizes
- **Dark/Light Theme** - Toggle between themes
- **Admin Authentication** - Secure content editing
- **Image Management** - Upload and manage project images
- **SEO Optimization** - Built-in SEO tools and meta management

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Backend**: Supabase (Database, Auth, Storage)
- **State Management**: React Hooks
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/noserub/Portfolio.git
   cd Portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000` (or the port shown in terminal)

## 🗄️ Database Setup

This project uses Supabase for data persistence. You'll need to:

1. Create a Supabase project
2. Run the database migrations (see `supabase/migrations/`)
3. Set up the required tables: `projects`, `profiles`, `app_settings`
4. Configure Row Level Security (RLS) policies

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, cards, etc.)
│   └── ...             # Feature-specific components
├── pages/              # Main application pages
│   ├── Home.tsx        # Landing page
│   ├── About.tsx       # About page
│   ├── Contact.tsx     # Contact page
│   └── ProjectDetail.tsx # Case study details
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── styles/             # Global styles
```

## 🎨 Customization

### Adding New Case Studies
1. Go to the Home page in edit mode
2. Click "New from Template" under Case Studies
3. Fill in the project details
4. Add images and content
5. Save to persist to Supabase

### Managing Content
- **About Page**: Edit bio, skills, and highlights
- **Contact**: Update email and contact information
- **SEO**: Use the SEO Editor for meta tags and descriptions

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Connect repository and add build settings
- **GitHub Pages**: Use GitHub Actions for deployment

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Brian Bureson**
- Portfolio: [your-portfolio-url.com](https://www.bureson.com)
- LinkedIn: [Your LinkedIn]([https://linkedin.com/in/yourprofile](https://www.linkedin.com/in/bureson/))
- Email: brian.bureson@gmail.com

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for backend services
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Lucide](https://lucide.dev) for icons
- [Cursor](https://cursor.com/) for AI coding

---

⭐ **Star this repository if you found it helpful!**# Force deployment Mon Oct 20 23:23:52 MDT 2025
