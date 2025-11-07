# 💳 VaultX — Next-Gen Online Banking Platform

## 🏫 Capstone Project (50 Marks)

### **Project Overview**
**VaultX** is a modern, secure, and fully responsive **online banking application** built using **Next.js (frontend + backend)** with **Neon.tech (PostgreSQL)** as the database and **shadcn/ui** for the UI.  
The system simulates essential banking functionalities — from account management to fund transfers — providing a **sleek, dark, professional banking experience**.  

The app is designed for **real-world practicality** and **enterprise-level structure**, making it ideal for full-stack web development evaluation.

---

## ⚙️ **Tech Stack**

| Layer | Technology | Description |
|--------|-------------|-------------|
| **Frontend** | **Next.js 15 (App Router + TypeScript)** | For full-stack web development (UI + APIs) |
| **UI Components** | **shadcn/ui** | Elegant, accessible UI components |
| **Styling** | **TailwindCSS** | Utility-first responsive design |
| **Theme** | **Pure Black (#000)** | Minimal, professional dark mode only |
| **Animation** | **Framer Motion** | Smooth transitions and micro-interactions |
| **Database** | **Neon.tech (PostgreSQL)** | Serverless PostgreSQL for scalability |
| **ORM** | **Prisma** | Type-safe schema and database queries |
| **Authentication** | **Clerk** | User sign-up, login, and session management |
| **Charts** | **Recharts / Chart.js** | Visual analytics and insights |
| **State Management** | **Zustand / Context API** | For global app state control |
| **Deployment** | **Vercel** | Seamless CI/CD and production hosting |

---

## 🧱 **Core Modules and Features**

### 👤 1. Authentication
- User registration and login via **Clerk**
- Secure session management
- Password reset, logout, and profile protection

### 🏦 2. Dashboard
- Displays **total balance**, **income**, and **expenses**
- Card layout with responsive design
- Shows recent transactions in a table format

### 💸 3. Transactions
- **Transfer funds** between accounts  
- Add **new beneficiaries** and **validate balance**
- Transaction success/failure notifications
- **Server-side validation** using Prisma + Neon

### 💳 4. Cards
- View all user cards with masked numbers
- Add or remove cards
- **Freeze/unfreeze toggle** for each card

### 📊 5. Analytics
- Spending analysis using **charts and graphs**
- Monthly or category-wise insights
- Completely **dark-themed visuals**

### ⚙️ 6. Settings
- Update profile info (name, email)
- Change password
- Manage notifications and privacy settings

### 🧾 7. Admin Dashboard (Bonus Feature)
- View all users and their accounts
- Manage or delete suspicious transactions
- Monitor total funds, users, and system status

---

## 🧩 **Database Design (Prisma Schema)**

```prisma
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  accounts      Account[]
  transactions  Transaction[]
  createdAt     DateTime  @default(now())
}

model Account {
  id            String    @id @default(cuid())
  accountNumber String    @unique
  balance       Float     @default(0.0)
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  cards         Card[]
}

model Transaction {
  id            String    @id @default(cuid())
  senderId      String
  receiverId    String
  amount        Float
  status        String
  createdAt     DateTime  @default(now())
}

model Card {
  id            String    @id @default(cuid())
  cardNumber    String
  expiry        String
  isFrozen      Boolean   @default(false)
  accountId     String
  account       Account   @relation(fields: [accountId], references: [id])
}
```

---

## 🗂️ **Folder Structure**

```
vaultx/
├── app/
│   ├── (auth)/            # Clerk authentication pages
│   ├── dashboard/         # User dashboard
│   ├── transactions/      # Fund transfers and transaction logs
│   ├── cards/             # Card management interface
│   ├── analytics/         # Data visualizations
│   ├── settings/          # User settings
│   ├── admin/             # Admin dashboard (bonus)
│   ├── api/
│   │   ├── users/
│   │   ├── transactions/
│   │   └── cards/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                # shadcn components
│   ├── dashboard/
│   ├── transactions/
│   ├── charts/
│   └── forms/
├── lib/
│   ├── prisma.ts          # Prisma client
│   ├── auth.ts            # Clerk helper
│   └── utils.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

---

## 💯 **Capstone Evaluation Criteria (50 Marks Total)**

| Criteria | Marks | Description |
|-----------|-------|-------------|
| **UI & UX Design** | 10 | Pure black theme, responsive layout, smooth navigation |
| **Functionality (CRUD)** | 15 | Accounts, transactions, cards, analytics |
| **Database Integration** | 10 | Neon + Prisma integration working correctly |
| **Authentication & Security** | 5 | Clerk setup with protected routes |
| **Code Structure & Maintainability** | 5 | Clean modular architecture |
| **Bonus Features** | 5 | Admin dashboard or analytics graphs |
