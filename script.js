
const transactionForm = document.getElementById("transaction-form");
const transactionList = document.getElementById("transaction-list");
const transactionFilter = document.getElementById("transaction-filter");
const monthlyBudgetInput = document.getElementById("monthly-budget");
const saveBudgetButton = document.getElementById("save-budget");
const budgetAmount = document.getElementById("budget-amount");
const budgetSpent = document.getElementById("budget-spent");
const budgetRemaining = document.getElementById("budget-remaining");
const budgetCategory = document.getElementById("budget-category");
const categoryBudgetInput = document.getElementById("category-budget-amount");
const saveCategoryBudgetButton = document.getElementById("save-category-budget");
const categoryBudgetList = document.getElementById("category-budget-list");
const monthlyBudgetWarning = document.getElementById("monthly-budget-warning");
const exportCSVButton = document.getElementById("export-csv");

const totalIncome = document.getElementById("total-income");
const totalExpenses = document.getElementById("total-expenses");
const currentBalance = document.getElementById("current-balance");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;
let categoryBudgets = JSON.parse(
    localStorage.getItem("categoryBudgets")
) || {};

function displayBudget() {
    budgetAmount.textContent = monthlyBudget;
    monthlyBudgetInput.value = monthlyBudget;
}

saveBudgetButton.addEventListener("click", function () {
    const enteredBudget = Number(monthlyBudgetInput.value);

    if (!Number.isFinite(enteredBudget) || enteredBudget <= 0) {
        alert("Please enter a valid budget greater than zero.");
        return;
    }

    monthlyBudget = enteredBudget;
    localStorage.setItem("monthlyBudget", monthlyBudget);

    displayBudget();
    updateBudgetSummary();


    alert("Monthly budget saved successfully!");
});

displayBudget();
function displayCategoryBudgets() {
    categoryBudgetList.innerHTML = "";

    const categories = Object.keys(categoryBudgets);

    if (categories.length === 0) {
        categoryBudgetList.innerHTML =
            "<p>No category budgets set yet.</p>";
        return;
    }

    categories.forEach(function (category) {
        const limit = categoryBudgets[category];
        const today = new Date();

        const spent = transactions.reduce(function (total, item) {
            if (item.type !== "expense" || item.category !== category) {
                return total;
            }

            const transactionDate = new Date(item.date + "T00:00:00");

            if (
                transactionDate.getMonth() === today.getMonth() &&
                transactionDate.getFullYear() === today.getFullYear()
            ) {
                return total + Number(item.amount);
            }

            return total;
        }, 0);

        const remaining = limit - spent;
        const categoryName =
            category.charAt(0).toUpperCase() + category.slice(1);

        let warningMessage = "";

        if (spent > limit) {
            warningMessage = "Warning: You have exceeded this category budget!";
        } else if (spent >= limit) {
            warningMessage = "Budget limit reached! You have used 100% of this budget.";
        } else if (spent >= limit * 0.8) {
            warningMessage = "Warning: You have used 80% or more of this category budget.";
        }

        const budgetItem = document.createElement("div");

        budgetItem.innerHTML = `
    <h3>${categoryName}</h3>
    <p>Monthly Limit: ₹${limit.toFixed(2)}</p>
    <p>Spent This Month: ₹${spent.toFixed(2)}</p>
    <p>Remaining Budget: ₹${remaining.toFixed(2)}</p>
    ${warningMessage ? `<p>${warningMessage}</p>` : ""}
    <hr>
`;

        categoryBudgetList.appendChild(budgetItem);
    });
}

saveCategoryBudgetButton.addEventListener("click", function () {
    const category = budgetCategory.value;
    const amount = Number(categoryBudgetInput.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid category budget greater than zero.");
        return;
    }

    categoryBudgets[category] = amount;

    localStorage.setItem(
        "categoryBudgets",
        JSON.stringify(categoryBudgets)
    );

    displayCategoryBudgets();

    alert("Category budget saved successfully!");
});

displayCategoryBudgets();
let editingIndex = null;
function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function updateSummary() {
    let income = 0;
    let expenses = 0;

    transactions.forEach(function (item) {
        if (item.type === "income") {
            income += Number(item.amount);
        } else if (item.type === "expense") {
            expenses += Number(item.amount);
        }
    });

    totalIncome.textContent = income.toFixed(2);
    totalExpenses.textContent = expenses.toFixed(2);
    currentBalance.textContent = (income - expenses).toFixed(2);
}

function updateBudgetSummary() {
    const today = new Date();

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let monthlyExpenses = 0;

    transactions.forEach(function (item) {
        if (item.type === "expense") {
            const transactionDate = new Date(item.date + "T00:00:00");

            if (
                transactionDate.getMonth() === currentMonth &&
                transactionDate.getFullYear() === currentYear
            ) {
                monthlyExpenses += Number(item.amount);
            }
        }
    });

    const remaining = monthlyBudget - monthlyExpenses;

    let warningMessage = "";

    if (monthlyBudget > 0) {
        if (monthlyExpenses > monthlyBudget) {
            warningMessage = "Warning: You have exceeded your monthly budget!";
        } else if (monthlyExpenses >= monthlyBudget) {
            warningMessage = "Monthly budget limit reached!";
        } else if (monthlyExpenses >= monthlyBudget * 0.8) {
            warningMessage = "Warning: You have used 80% or more of your monthly budget.";
        }
    }

    budgetSpent.textContent = monthlyExpenses.toFixed(2);
    budgetRemaining.textContent = remaining.toFixed(2);
    monthlyBudgetWarning.textContent = warningMessage;
}
function updateWeeklyMonthlySummary() {
    const today = new Date();

    // Find Monday of the current week
    const startOfWeek = new Date(today);
    const day = today.getDay();

    const daysFromMonday = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(today.getDate() - daysFromMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // Find the start of next week
    const startOfNextWeek = new Date(startOfWeek);
    startOfNextWeek.setDate(startOfWeek.getDate() + 7);

    // Calculate the start of the current month
    const startOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

    let weeklyExpenses = 0;
    let monthlyExpenses = 0;

    transactions.forEach(function (item) {
        if (item.type !== "expense") {
            return;
        }

        const transactionDate = new Date(item.date + "T00:00:00");
        const amount = Number(item.amount);

        if (
            transactionDate >= startOfWeek &&
            transactionDate <= today
        ) {
            weeklyExpenses += amount;
        }

        if (
            transactionDate >= startOfMonth &&
            transactionDate <= today
        ) {
            monthlyExpenses += amount;
        }
    });

    document.getElementById("weekly-expenses").textContent =
        weeklyExpenses.toFixed(2);

    document.getElementById("monthly-expenses").textContent =
        monthlyExpenses.toFixed(2);

    const dateOptions = {
        day: "numeric",
        month: "short"
    };

    const weeklyEnd = new Date(startOfNextWeek);
    weeklyEnd.setDate(weeklyEnd.getDate() - 1);

    document.getElementById("weekly-date-range").textContent =
        startOfWeek.toLocaleDateString("en-IN", dateOptions) +
        " – " +
        weeklyEnd.toLocaleDateString("en-IN", dateOptions);

    document.getElementById("monthly-date-range").textContent =
        startOfMonth.toLocaleDateString("en-IN", dateOptions) +
        " – " +
        today.toLocaleDateString("en-IN", dateOptions);


}


let expenseChart = null;
function updateExpenseChart() {
    const categoryTotals = {};

    const today = new Date();

    const startOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

    const startOfNextMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        1
    );

    transactions.forEach(function (item) {
        if (item.type === "expense") {
            const transactionDate = new Date(item.date + "T00:00:00");

            if (
                transactionDate >= startOfMonth &&
                transactionDate < startOfNextMonth
            ) {
                if (!categoryTotals[item.category]) {
                    categoryTotals[item.category] = 0;
                }

                categoryTotals[item.category] += Number(item.amount);
            }
        }
    });
    const canvas = document.getElementById("expense-chart");

    if (expenseChart !== null) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
                label: "Expenses by Category",
                data: Object.values(categoryTotals)
            }]
        },
        options: {
            responsive: true
        }
    });
}

function displayTransactions() {
    transactionList.innerHTML = "";

    const filter = transactionFilter.value;
    const today = new Date();

    // Find Monday of the current week
    const startOfWeek = new Date(today);
    const day = today.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;

    startOfWeek.setDate(today.getDate() - daysFromMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    // Find the start of the current month
    const startOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

    // Filter transactions according to the dropdown
    const filteredTransactions = transactions
        .map(function (item, index) {
            return {
                ...item,
                originalIndex: index
            };
        })
        .filter(function (item) {
            if (filter === "all") {
                return true;
            }

            const transactionDate = new Date(
                item.date + "T00:00:00"
            );

            if (filter === "week") {
                return (
                    transactionDate >= startOfWeek &&
                    transactionDate <= today
                );
            }

            if (filter === "month") {
                return (
                    transactionDate >= startOfMonth &&
                    transactionDate <= today
                );
            }

            return true;
        });

    // Show a message if no transactions match
    if (filteredTransactions.length === 0) {
        transactionList.innerHTML =
            "<p>No transactions found for this period.</p>";
        return;
    }

    // Display the filtered transactions
    filteredTransactions.forEach(function (item) {
        transactionList.innerHTML += `
            <div>
                <p>Amount: ₹${item.amount}</p>
                <p>Type: ${item.type}</p>
                <p>Category: ${item.category}</p>
                <p>Date: ${item.date}</p>
                <p>Description: ${item.description}</p>

                <button class="edit-button"
                    data-index="${item.originalIndex}">
                    Edit
                </button>

                <button class="delete-button"
                    data-index="${item.originalIndex}">
                    Delete
                </button>
            </div>
            <hr>
        `;
    });
} transactionFilter.addEventListener("change", function () {
    displayTransactions();
});

transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const amount = Number(document.getElementById("amount").value);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter an amount greater than 0.");
        return;
    }



    const transaction = {
        amount: amount,
        type: document.getElementById("type").value,
        category: document.getElementById("category").value,
        date: document.getElementById("date").value,
        description: document.getElementById("description").value
    };

    if (editingIndex === null) {
        transactions.push(transaction);
    } else {
        transactions[editingIndex] = transaction;
        editingIndex = null;
    }
    saveTransactions();

    displayTransactions();
    updateSummary();
    updateExpenseChart();
    updateWeeklyMonthlySummary();
    updateBudgetSummary();
    displayCategoryBudgets();


    transactionForm.reset();

    const submitButton = transactionForm.querySelector(
        'button[type="submit"]'
    );

    if (submitButton) {
        submitButton.textContent = "Add Transaction";
    }
});

transactionList.addEventListener("click", function (event) {
    const index = Number(event.target.dataset.index);

    if (event.target.classList.contains("delete-button")) {
        transactions.splice(index, 1);
        saveTransactions();

        if (editingIndex === index) {
            editingIndex = null;
            transactionForm.reset();
        } else if (editingIndex !== null && editingIndex > index) {
            editingIndex--;
        }

        displayTransactions();
        updateSummary();
        updateExpenseChart();
        updateWeeklyMonthlySummary();
        updateBudgetSummary();
        displayCategoryBudgets();

    }

    if (event.target.classList.contains("edit-button")) {
        const item = transactions[index];

        document.getElementById("amount").value = item.amount;
        document.getElementById("type").value = item.type;
        document.getElementById("category").value = item.category;
        document.getElementById("date").value = item.date;
        document.getElementById("description").value = item.description;

        editingIndex = index;

        const submitButton = transactionForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.textContent = "Update Transaction";
        }
    }
});

saveTransactions();
displayTransactions();
updateSummary();
updateExpenseChart();
updateWeeklyMonthlySummary();
updateBudgetSummary();
displayCategoryBudgets();

exportCSVButton.addEventListener("click", function () {
    if (transactions.length === 0) {
        alert("No transactions available to export.");
        return;
    }

    const headers = [
        "Amount",
        "Type",
        "Category",
        "Date",
        "Description"
    ];

    const rows = transactions.map(function (item) {
        return [
            item.amount,
            item.type,
            item.category,
            item.date,
            item.description
        ];
    });

    const csvContent = [headers, ...rows]
        .map(function (row) {
            return row.map(function (value) {
                const safeValue = String(value ?? "");
                return '"' + safeValue.replace(/"/g, '""') + '"';
            }).join(",");
        })
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "spendwise-transactions.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
});