# EasySplit Design Guidelines

## Design Approach
**System Selected:** Material Design-inspired approach  
**Rationale:** Utility-focused mobile app requiring clear information hierarchy, touch-friendly interactions, and efficient form handling. Material Design's principles align perfectly with mobile-first bill-splitting functionality.

## Typography System
- **Primary Font:** Inter or Roboto via Google Fonts CDN
- **Hierarchy:**
  - App Title/Headers: 600 weight, text-2xl to text-3xl
  - Section Headers: 600 weight, text-xl
  - Body/Labels: 400 weight, text-base
  - Buttons: 500 weight, text-base
  - Small Text (hints/totals): 400 weight, text-sm
  - Results/Numbers: 600 weight for emphasis on totals

## Layout System
**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 for consistency
- Component padding: p-4 to p-6
- Section spacing: mb-6 to mb-8
- Button/input spacing: px-6 py-3
- Card/container padding: p-6
- Max-width container: max-w-2xl (optimized for mobile/tablet reading)

## Component Library

### Navigation
- **Fixed Top Bar:** Sticky header with app name and back/home navigation
- Height: h-16 with px-4 padding
- Mobile hamburger menu for secondary actions (if needed)

### Buttons
**Primary Action Buttons (Home CTAs):**
- Large touch targets: min-h-20, full width on mobile
- Rounded corners: rounded-xl
- Icon + Text layout with generous padding (p-6)
- Heroicons for icons (outline style)

**Secondary Buttons:**
- Standard height: h-12, rounded-lg
- Icon + text combinations where helpful
- Full width on mobile, auto on desktop

**Small Action Buttons (+/- controls):**
- Touch-friendly: w-10 h-10 minimum
- Rounded: rounded-lg
- Clear tap feedback

### Forms & Inputs
**Text Inputs:**
- Height: h-12 for comfortable tapping
- Rounded: rounded-lg
- Padding: px-4
- Clear labels above inputs (text-sm, mb-2)
- Placeholder text for guidance

**Textarea (Menu Paste):**
- Minimum height: h-40
- Monospace font for menu parsing clarity
- Clear parsing instructions above

**Number Inputs (Service/Tip %):**
- Compact inline layout with labels
- Width: w-20 for percentage inputs
- Clear unit indicators (%, £, etc.)

### Cards & Containers
**Menu Item Cards:**
- Rounded: rounded-lg
- Padding: p-4
- Flex layout: item name left, price right
- Edit/delete icons on right (mobile: swipe or tap)

**Person Chips/Tags:**
- Inline-flex layout with flex-wrap
- Rounded: rounded-full
- Padding: px-4 py-2
- Small close icon (×) on right
- Gap: gap-2 between chips

**Results Cards:**
- Rounded: rounded-xl
- Padding: p-6
- Clear visual separation between people
- Hierarchy: Person name (bold) > Subtotal > Service > Tip > Final Total (emphasized)

### Data Display
**Menu Items List:**
- Simple list with dividers between items
- Each item: flex justify-between
- Person quantity controls inline: [-] [0] [+] pattern

**Results Breakdown:**
- Per-person sections with clear dividers
- Tabular data alignment for amounts
- Grand total: prominently displayed at bottom (text-xl, 700 weight)
- "Copy breakdown" button: secondary style, icon included

**Summary Stats:**
- Inline labels and values
- Right-aligned numbers for scanning
- Monospace font for numerical alignment

### Overlays
**Menu Code Display:**
- Modal or prominent card after menu creation
- Large, copyable code (text-3xl, monospace, letter-spacing-wide)
- Share link prominently displayed
- Copy button with success feedback

## Responsive Behavior
- **Mobile (base):** Single column, full-width components, stacked layouts
- **Tablet (md:):** Max-width containers (max-w-2xl), maintained single column for simplicity
- **Desktop (lg:):** Centered layout with max-w-2xl, generous margins

## Interaction Patterns
- **Tap Feedback:** All interactive elements show clear active states
- **Form Validation:** Inline validation messages below inputs
- **Loading States:** Simple spinner or "Calculating..." text for operations
- **Success Feedback:** Toast/banner messages for actions (menu saved, copied to clipboard)
- **Empty States:** Helpful prompts when no items/people added yet

## Animations
**Minimal, Purposeful Motion:**
- Smooth transitions on button states (150ms)
- List item additions: simple fade-in
- Modal/overlay appearances: fade + slight scale (200ms)
- No scroll-driven or decorative animations

## Accessibility
- Minimum touch targets: 44x44px for all interactive elements
- Clear focus states for keyboard navigation
- Semantic HTML with proper labels
- High contrast maintained throughout
- Clear error messaging

## Icons
**Library:** Heroicons (outline style) via CDN
- Plus/minus: for quantity controls
- User/person: for people chips
- Document: for menu
- Share: for code sharing
- Copy: for clipboard actions
- Check: for success states

---

**No Hero Images:** This is a utility app—launch directly into functionality with prominent action buttons on the home page. Focus on clarity and speed of use over visual marketing.