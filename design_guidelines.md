# Design Guidelines: Sistema Financeiro - Landing Page

## Design Approach
**Reference-Based Approach**: Apple-inspired minimalist design with superior execution to Contas Online. Focus on elegance, clean typography, intelligent whitespace, and premium user experience.

## Core Design Principles
- **Mobile-First**: All design decisions prioritize mobile experience, scaling up gracefully to desktop
- **Minimalist Premium**: Sophisticated simplicity with subtle depth and refinement
- **Intuitive Navigation**: Clear hierarchy and effortless user flow
- **Subtle Motion**: Purposeful animations that enhance, never distract

## Color Palette

### Primary Colors
- **Blue**: 220 100% 40% - Primary CTAs, highlights, important titles
- **Dark Gray**: 0 0% 11% - Main text, navigation, section backgrounds
- **Light Gray**: 0 0% 96% - Secondary backgrounds, subtle details
- **White**: 0 0% 100% - Primary background, breathing space

### Accent Usage
- Blue gradients for hero elements and primary buttons
- Soft shadows and depth using gray variations
- High contrast for readability and accessibility

## Typography

**Font Family**: SF Pro Display (Apple system fonts fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)

### Type Scale
- **Hero Title**: 2.5rem mobile / 4rem desktop, font-weight 700, tight line-height (1.1)
- **Section Headers**: 1.75rem mobile / 2.5rem desktop, font-weight 600
- **Body Text**: 1rem mobile / 1.125rem desktop, font-weight 400, line-height 1.6
- **Small Text**: 0.875rem, font-weight 400, footer and captions
- **Button Text**: 1rem, font-weight 500, letter-spacing subtle

## Layout System

**Spacing Units**: Tailwind scale - primarily use 4, 8, 12, 16, 20, 24, 32 units
- Mobile padding: px-4 to px-6, py-12 to py-16
- Desktop padding: px-8 to px-12, py-20 to py-32
- Component spacing: gap-4 to gap-8
- Section breaks: mb-16 to mb-24 mobile, mb-24 to mb-32 desktop

**Container**: max-w-7xl centered, responsive padding

**Breakpoints**:
- Mobile: base (< 640px)
- Tablet: md (768px)
- Desktop: lg (1024px)
- Large Desktop: xl (1280px)

## Page Structure

### 1. Header (Sticky)
- **Mobile**: Glassmorphism effect, hamburger menu, logo left, "Criar Conta" button right
- **Desktop**: Full horizontal navigation with items: Para Você, Para Empresas, Recursos, Planos, Contato
- **Actions**: "Acessar Conta" (outline) and "Criar Conta Grátis" (solid blue)
- **Scroll Effect**: Background blur increases, subtle shadow appears

### 2. Hero Section
- **Layout**: Single column mobile, 60/40 split desktop (text left, visual right)
- **Title**: Bold gradient text with impactful value proposition
- **Subtitle**: 2-3 lines explaining core benefits, max-w-2xl
- **CTA**: Primary button "Experimente Grátis por 7 Dias" with arrow icon
- **Visual**: Modern dashboard mockup with 3D depth, soft shadows, floating UI elements showing graphs/transactions
- **Animation**: Parallax scroll effect on mockup, fade-in on load

### 3. Features Section
**Grid Layout**: 1 column mobile, 2 columns tablet, 3 columns desktop

**6 Feature Cards**:
1. **Controle de Receitas e Despesas** - Categorization icon
2. **Multi-Contas e Bancos** - Integration icon
3. **Relatórios e Gráficos** - Analytics icon
4. **Metas Financeiras** - Target icon
5. **Segurança de Dados** - Shield icon
6. **Acesso Multi-Plataforma** - Devices icon

**Card Design**:
- White background with subtle border
- Icon: 48px blue circular background
- Title: font-weight 600
- Description: 2-3 lines, gray text
- "Saiba Mais" link with arrow
- Hover: slight lift (translateY -4px), shadow increase

### 4. Depoimentos (Social Proof)
**Carousel Design**:
- **Mobile**: Single card, swipe gesture, dot indicators
- **Desktop**: 3 cards visible, auto-rotate every 5s, navigation arrows

**Testimonial Card**:
- Quoted text in larger font
- User photo: 64px circular
- Name and role
- 5-star rating visual
- Soft background with border

### 5. Secondary CTA Section
- Full-width blue gradient background
- White text, centered content
- Large heading + supporting text
- Dual CTAs: "Começar Agora" (white) + "Ver Planos" (outline white)

### 6. Footer
**Grid Layout**: 1 column mobile, 4 columns desktop

**Columns**:
- Company (Sobre, Blog, Carreiras)
- Product (Recursos, Planos, Segurança)
- Support (FAQ, Contato, Documentação)
- Legal (Termos, Privacidade, Cookies)

**Bottom Bar**:
- Social icons (LinkedIn, Twitter, Instagram)
- Copyright text
- Language selector (PT/EN)

## Component Library

### Buttons
**Primary**: Blue background, white text, px-6 py-3, rounded-lg, shadow-md, hover shadow-lg + brightness increase
**Outline**: Border 2px blue, blue text, transparent bg, hover blue bg + white text
**Ghost**: No border, blue text, hover light blue background

### Modal (Login)
- **Trigger**: "Acessar Conta" button
- **Design**: Centered card, max-w-md, glassmorphism backdrop blur
- **Content**: Logo, title, email/password fields, "Entrar" button, "Esqueci senha" link
- **Animation**: Fade + scale-up entrance (300ms ease-out)
- **Close**: X button top-right + click outside to dismiss

### Icons
**Library**: Heroicons (via CDN)
**Style**: Outline for features, solid for actions
**Size**: 24px standard, 32px for feature cards

## Animations & Interactions

### Scroll Animations (Intersection Observer)
- Fade-in: Opacity 0→1, translateY 20px→0
- Stagger: Each card delays 100ms
- Threshold: 0.2 (trigger when 20% visible)

### Hover Effects
- Buttons: Transform scale(1.02), shadow increase, 200ms
- Cards: translateY -4px, shadow-lg, 300ms
- Links: Color shift, underline slide-in, 200ms

### Page Load
- Hero elements: Stagger fade-in (title→subtitle→CTA→visual)
- No heavy animations, optimize for performance

## Images

### Hero Mockup
**Description**: Modern financial dashboard showing:
- Clean graph trending upward
- Transaction list with categorization
- Balance cards for multiple accounts
- Color scheme matching brand (blue accents)
**Style**: 3D perspective, floating with soft shadow, light gradient background
**Placement**: Right side desktop, below CTA on mobile

### Feature Icons
Use Heroicons CDN - specific icons:
- ChartBarIcon (Controle)
- BuildingLibraryIcon (Multi-Contas)
- ChartPieIcon (Relatórios)
- FlagIcon (Metas)
- ShieldCheckIcon (Segurança)
- DevicePhoneMobileIcon (Multi-Plataforma)

### Testimonial Photos
**Style**: Professional headshots, 64px circular, subtle border, grayscale with color on hover

## Accessibility & Responsiveness

- **Color Contrast**: Minimum WCAG AA (4.5:1 for text)
- **Touch Targets**: Minimum 44px mobile
- **Keyboard Navigation**: Full support, visible focus states
- **Screen Readers**: Semantic HTML, ARIA labels where needed
- **Responsive Images**: srcset for hero mockup, lazy loading

## Performance Targets
- First Contentful Paint: < 1.5s
- GPU-accelerated animations (transform, opacity only)
- Minimize layout shifts
- Optimize font loading (font-display: swap)