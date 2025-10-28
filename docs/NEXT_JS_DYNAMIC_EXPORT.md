# Next.js `export const dynamic` - Usage Guide

## ❌ Common Mistake

You encountered this issue where `export const dynamic = 'force-dynamic'` was commented out in API routes.

## ✅ Correct Usage

### When to Use

#### 1. **API Routes** (`app/api/**/route.ts`)
For API routes, dynamic behavior is usually automatic, but you can be explicit:

```typescript
// app/api/inventory/items/route.ts
export const dynamic = 'force-dynamic' // Optional for API routes
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // Your API logic
}
```

**Note:** For API routes with database connections, this is usually **NOT needed** as they're inherently dynamic.

#### 2. **Page Components** (`app/**/page.tsx`)
For pages that should always be dynamically rendered:

```typescript
// app/dashboard/page.tsx
export const dynamic = 'force-dynamic' // ✅ Good for pages

export default function DashboardPage() {
  // Your page component
}
```

#### 3. **Layout Components** (`app/**/layout.tsx`)
Similar to pages:

```typescript
// app/layout.tsx
export const dynamic = 'force-dynamic' // ✅ Can be used here

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

### When NOT to Use

#### ❌ In Regular Components
```typescript
// components/MyComponent.tsx
export const dynamic = 'force-dynamic' // ❌ WRONG - Not a route segment

export function MyComponent() {
  return <div>Hello</div>
}
```

#### ❌ In Utility Files
```typescript
// lib/utils/helper.ts
export const dynamic = 'force-dynamic' // ❌ WRONG - Not a Next.js route

export function myHelper() {
  // utility logic
}
```

## 📚 Route Segment Config Options

### Available Options

```typescript
// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Force static rendering (build time)
export const dynamic = 'force-static'

// Auto (Next.js decides)
export const dynamic = 'auto'

// Error if dynamic rendering is used
export const dynamic = 'error'
```

### Other Route Segment Configs

```typescript
// Choose runtime
export const runtime = 'nodejs' // or 'edge'

// Set revalidation time
export const revalidate = 3600 // seconds

// Control dynamic params behavior
export const dynamicParams = true // or false

// Set fetch cache behavior
export const fetchCache = 'force-cache' // or other options
```

## 🔧 Your Project - What We Did

### Fixed in API Routes
We commented out `export const dynamic = 'force-dynamic'` in:
- `app/api/auth/login/route.ts` ✅

**Reason:** API routes are already dynamic by nature when they:
- Connect to databases
- Use request objects
- Perform authentication
- Handle POST/PUT/DELETE operations

### Where It's Actually Useful

If you want to ensure a **page** always fetches fresh data:

```typescript
// app/inventory/items/page.tsx
'use client'

// If this was a server component, you could use:
// export const dynamic = 'force-dynamic'

export default function InventoryItemsPage() {
  // Client component using React Query
  // No need for dynamic export here
}
```

## 🎯 Best Practices

### 1. For API Routes
```typescript
// Usually NOT needed
// export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  await connectDB() // Already makes it dynamic
  // ...
}
```

### 2. For Server Components Fetching Data
```typescript
// Use when you want to prevent static generation
export const dynamic = 'force-dynamic'

async function getData() {
  const res = await fetch('...', { cache: 'no-store' })
  return res.json()
}

export default async function Page() {
  const data = await getData()
  return <div>{/* render data */}</div>
}
```

### 3. For Client Components (like yours)
```typescript
'use client'

// No need for dynamic export
// Client components are already dynamic
export default function MyPage() {
  const { data } = useQuery(...)
  return <div>{/* render */}</div>
}
```

## 📖 Summary

- ✅ Use in **page.tsx** or **layout.tsx** when you need server-side dynamic rendering
- ✅ Can use in **route.ts** (API routes) but usually not necessary
- ❌ Don't use in regular **components**
- ❌ Don't use in **client components** (`'use client'`)
- ❌ Don't use in **utility files**

## 🔗 Resources

- [Next.js Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [Dynamic Rendering](https://nextjs.org/docs/app/building-your-application/rendering/server-components#dynamic-rendering)
