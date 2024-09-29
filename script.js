// Initialize data
let expenses = [];
let categories = ['Food', 'Transportation', 'Utilities', 'Entertainment', 'Health', 'Education', 'Miscellaneous'];
let monthlyBudget = 0;

// Load data from localStorage
if (localStorage.getItem('expenses')) {
    expenses = JSON.parse(localStorage.getItem('expenses'));
}

if (localStorage.getItem('monthlyBudget')) {
    monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget'));
}

// DOM elements
const expenseForm = document.getElementById('expense-form');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const saveExpenseButton = document.getElementById('save-expense');

const expensesTableBody = document.getElementById('expenses-table-body');

const filterWeek = document.getElementById('filter-week');
const filterMonth = document.getElementById('filter-month');
const filterCategory = document.getElementById('filter-category');
const searchBar = document.getElementById('search-bar');

const totalExpensesElement = document.getElementById('total-expenses');

const alertMessage = document.getElementById('alert-message');
const budgetAlert = document.getElementById('budget-alert');
const monthlyBudgetInput = document.getElementById('monthly-budget');

const exportCsvButton = document.getElementById('export-csv');

// Initialize charts
let weeklyChart;
let monthlyChart;
let categoryChart;

// On page load
window.onload = function() {
    populateCategories();
    populateCategoryFilter();
    updateExpensesTable();
    populateWeekFilter();
    populateMonthFilter();
    if (monthlyBudget > 0) {
        monthlyBudgetInput.value = monthlyBudget;
    }
};

// Event listener for saving expense
saveExpenseButton.addEventListener('click', function() {
    if (!expenseForm.checkValidity()) {
        expenseForm.classList.add('was-validated');
        return;
    }

    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    if (amount <= 0 || !category || !date) {
        showAlert('Please fill in all required fields with valid data.', 'danger');
        return;
    }

    const expense = {
        id: Date.now(),
        amount: amount,
        category: category,
        date: date,
        description: description,
        week: getWeekNumber(new Date(date)),
        month: new Date(date).getMonth() + 1,
    };

    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));

    expenseForm.reset();
    expenseForm.classList.remove('was-validated');

    const addExpenseModal = bootstrap.Modal.getInstance(document.getElementById('addExpenseModal'));
    addExpenseModal.hide();

    showAlert('Expense added successfully!', 'success');

    updateExpensesTable();
});

// Function to get ISO week number
function getWeekNumber(date) {
    const tempDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayNum = tempDate.getDay() || 7;
    tempDate.setDate(tempDate.getDate() + 4 - dayNum);
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    return Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
}

// Function to update the expenses table
function updateExpensesTable() {
    expensesTableBody.innerHTML = '';

    const selectedWeekValue = filterWeek.value;
    const selectedMonthValue = filterMonth.value;
    const selectedCategoryValue = filterCategory.value;
    const searchQuery = searchBar.value.toLowerCase();

    let filteredExpenses = expenses;

    if (selectedWeekValue && selectedWeekValue !== 'all') {
        filteredExpenses = filteredExpenses.filter(expense => expense.week == selectedWeekValue);
    }

    if (selectedMonthValue && selectedMonthValue !== 'all') {
        filteredExpenses = filteredExpenses.filter(expense => expense.month == selectedMonthValue);
    }

    if (selectedCategoryValue && selectedCategoryValue !== 'all') {
        filteredExpenses = filteredExpenses.filter(expense => expense.category === selectedCategoryValue);
    }

    if (searchQuery) {
        filteredExpenses = filteredExpenses.filter(expense =>
            expense.description.toLowerCase().includes(searchQuery) ||
            expense.category.toLowerCase().includes(searchQuery)
        );
    }

    filteredExpenses.forEach(function(expense) {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>€${expense.amount.toFixed(2)}</td>
            <td>${expense.category}</td>
            <td>${new Date(expense.date).toLocaleDateString()}</td>
            <td>${expense.description}</td>
            <td>
                <button class="btn btn-sm btn-outline-secondary edit-expense icon-button" data-id="${expense.id}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger delete-expense icon-button" data-id="${expense.id}"><i class="fas fa-trash-alt"></i></button>
            </td>
        `;

        expensesTableBody.appendChild(row);
    });

    const totalExpenses = filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
    totalExpensesElement.textContent = `Total Expenses: €${totalExpenses.toFixed(2)}`;

    updateBudgetAlert();
    createWeeklyChart();
    createMonthlyChart();
    createCategoryChart();

    addExpenseTableEventListeners();
}

// Function to add event listeners to expense table buttons
function addExpenseTableEventListeners() {
    const editButtons = document.querySelectorAll('.edit-expense');
    const deleteButtons = document.querySelectorAll('.delete-expense');

    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const expenseId = parseInt(this.getAttribute('data-id'));
            editExpense(expenseId);
        });
    });

    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const expenseId = parseInt(this.getAttribute('data-id'));
            deleteExpense(expenseId);
        });
    });
}

// Function to edit an expense
function editExpense(id) {
    const expense = expenses.find(exp => exp.id === id);
    if (expense) {
        // Pre-fill form with expense data
        amountInput.value = expense.amount;
        categoryInput.value = expense.category;
        dateInput.value = expense.date;
        descriptionInput.value = expense.description;

        // Remove existing expense
        expenses = expenses.filter(exp => exp.id !== id);
        localStorage.setItem('expenses', JSON.stringify(expenses));

        // Show the modal
        const addExpenseModal = new bootstrap.Modal(document.getElementById('addExpenseModal'));
        addExpenseModal.show();
    }
}

// Function to delete an expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(expense => expense.id !== id);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        updateExpensesTable();
        showAlert('Expense deleted successfully!', 'success');
    }
}

// Function to populate predefined categories
function populateCategories() {
    categoryInput.innerHTML = '<option value="" disabled selected>Select a category</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryInput.appendChild(option);
    });
}

// Function to populate category filter
function populateCategoryFilter() {
    filterCategory.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterCategory.appendChild(option);
    });
}

// Function to populate week filter
function populateWeekFilter() {
    const weeks = [...new Set(expenses.map(expense => expense.week))].sort((a, b) => a - b);
    filterWeek.innerHTML = '<option value="all">All Weeks</option>';
    weeks.forEach(week => {
        const option = document.createElement('option');
        option.value = week;
        option.textContent = 'Week ' + week;
        filterWeek.appendChild(option);
    });
}

// Function to populate month filter
function populateMonthFilter() {
    const months = [...new Set(expenses.map(expense => expense.month))].sort((a, b) => a - b);
    filterMonth.innerHTML = '<option value="all">All Months</option>';
    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = 'Month ' + month;
        filterMonth.appendChild(option);
    });
}

// Function to create the weekly expenses chart
function createWeeklyChart() {
    const weeklyTotals = getWeeklyExpenses();
    const weeks = Object.keys(weeklyTotals).sort((a, b) => a - b);
    const totals = weeks.map(week => weeklyTotals[week]);

    const ctx = document.getElementById('weekly-expense-chart').getContext('2d');

    if (weeklyChart) {
        weeklyChart.destroy();
    }

    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weeks.map(week => 'Week ' + week),
            datasets: [{
                label: 'Weekly Expenses',
                data: totals,
                backgroundColor: '#0d6efd',
                borderColor: '#0b5ed7',
                borderWidth: 1,
                hoverBackgroundColor: '#0b5ed7',
                hoverBorderColor: '#0a58ca',
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Total: €${context.parsed.y.toFixed(2)}`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: { title: { display: true, text: 'Week Number' } },
                y: { title: { display: true, text: 'Total Expenses (€)' } }
            }
        }
    });
}

// Function to create the monthly expenses chart
function createMonthlyChart() {
    const monthlyTotals = getMonthlyExpenses();
    const months = Object.keys(monthlyTotals).sort((a, b) => a - b);
    const totals = months.map(month => monthlyTotals[month]);

    const ctx = document.getElementById('monthly-expense-chart').getContext('2d');

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(month => 'Month ' + month),
            datasets: [{
                label: 'Monthly Expenses',
                data: totals,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Total: €${context.parsed.y.toFixed(2)}`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: { title: { display: true, text: 'Month' } },
                y: { title: { display: true, text: 'Total Expenses (€)' } }
            }
        }
    });
}

// Function to create the category expenses chart
function createCategoryChart() {
    const categoryTotals = {};
    expenses.forEach(expense => {
        if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += expense.amount;
        } else {
            categoryTotals[expense.category] = expense.amount;
        }
    });

    const categoriesList = Object.keys(categoryTotals);
    const totals = categoriesList.map(category => categoryTotals[category]);

    const ctx = document.getElementById('category-expense-chart').getContext('2d');

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categoriesList,
            datasets: [{
                data: totals,
                backgroundColor: [
                    '#0d6efd',
                    '#198754',
                    '#ffc107',
                    '#dc3545',
                    '#6f42c1',
                    '#fd7e14',
                    '#20c997',
                ],
                borderWidth: 1,
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: €${context.parsed.toFixed(2)}`;
                        }
                    }
                },
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// Function to get weekly expenses
function getWeeklyExpenses() {
    const weeklyTotals = {};
    expenses.forEach(expense => {
        const week = expense.week;
        if (weeklyTotals[week]) {
            weeklyTotals[week] += expense.amount;
        } else {
            weeklyTotals[week] = expense.amount;
        }
    });
    return weeklyTotals;
}

// Function to get monthly expenses
function getMonthlyExpenses() {
    const monthlyTotals = {};
    expenses.forEach(expense => {
        const month = expense.month;
        if (monthlyTotals[month]) {
            monthlyTotals[month] += expense.amount;
        } else {
            monthlyTotals[month] = expense.amount;
        }
    });
    return monthlyTotals;
}

// Function to show alert messages
function showAlert(message, type) {
    alertMessage.textContent = message;
    alertMessage.className = `alert alert-${type} fade show`;
    alertMessage.style.display = 'block';
    setTimeout(() => {
        alertMessage.style.display = 'none';
    }, 3000);
}

// Function to update budget alert
function updateBudgetAlert() {
    if (monthlyBudget > 0) {
        const currentMonth = new Date().getMonth() + 1;
        const monthlyExpenses = expenses.filter(expense => expense.month === currentMonth);
        const total = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        if (total >= monthlyBudget) {
            budgetAlert.textContent = 'You have exceeded your monthly budget!';
            budgetAlert.className = 'alert alert-danger fade show';
            budgetAlert.style.display = 'block';
        } else if (total >= monthlyBudget * 0.8) {
            budgetAlert.textContent = 'You are nearing your monthly budget limit.';
            budgetAlert.className = 'alert alert-warning fade show';
            budgetAlert.style.display = 'block';
        } else {
            budgetAlert.style.display = 'none';
        }
    } else {
        budgetAlert.style.display = 'none';
    }
}

// Event listener for budget input
monthlyBudgetInput.addEventListener('change', function() {
    monthlyBudget = parseFloat(monthlyBudgetInput.value);
    if (monthlyBudget >= 0) {
        localStorage.setItem('monthlyBudget', monthlyBudget);
        updateBudgetAlert();
        showAlert('Monthly budget updated!', 'success');
    } else {
        showAlert('Please enter a valid budget amount.', 'danger');
    }
});

// Event listener for exporting data to CSV
exportCsvButton.addEventListener('click', function() {
    exportToCsv();
});

// Function to export data to CSV
function exportToCsv() {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Amount (€),Category,Date,Description\n';

    expenses.forEach(expense => {
        const row = [
            expense.amount.toFixed(2),
            expense.category,
            new Date(expense.date).toLocaleDateString(),
            expense.description
        ].join(',');
        csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'expenses.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
