# Satyfinance

Satyfinance is a personal finance workspace designed to track daily expenses, visualize monthly cashflow, and calculate the true cost of items that last across multiple months.

---

## What This Website Does

### 1. Expense Tracking & Quick Input
* Add and manage daily expenses across categories like Groceries, Food & Dining, Bills, Electronics, and Personal Care.
* **Quick Add Bar:** Quickly enter expenses using natural text (e.g. `Coffee 150 Groceries` or `Electricity bill ₹1850`), and the app automatically extracts the amount and category.

### 2. Product Lifespan & Amortization (Key Feature)
* Most expense apps record the entire price of an item in the month you buy it, which distorts your monthly budget.
* This feature lets you track items that last multiple months (such as personal care products, supplements, or annual subscriptions) to see their **real monthly cost** (e.g., a ₹600 item lasting 3 months = ₹200/month) and daily burn rate with active progress bars.

### 3. Budget & Monthly Outflow
* Set your target monthly budget.
* View total outflow, settled payments vs scheduled dues, headroom left, and average daily spend.

### 4. Interactive Calendar View
* View your expenses organized on a monthly calendar.
* See scheduled payments vs settled expenses day-by-day.
* Click on any date to view details or add an expense directly on that day.

### 5. Analytics & Spending Charts
* Visual charts showing category-wise spending distributions and month-to-month trends.

### 6. Offline & Privacy-First
* All data is stored directly in your browser via `localStorage`.
* No account, signup, or external server needed.
* Includes one-click JSON/CSV export and import to backup or transfer your data.

---

## How to Run Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open in your browser:**
   Go to [http://localhost:3000](http://localhost:3000).

---

## Built With

* **Next.js 14** (App Router)
* **React 18**
* **TypeScript**
* **Tailwind CSS**
* **Tabler Icons**
