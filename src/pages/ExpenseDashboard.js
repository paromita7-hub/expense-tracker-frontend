const API_BASE = 'https://expense-tracker-backend-uuht.onrender.com';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F'];

const ExpenseDashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const totalFiltered = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [editId, setEditId] = useState(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [searchCategory, setSearchCategory] = useState('');
  const [searchDate, setSearchDate] = useState(null);
  const navigate = useNavigate();


  const fetchExpenses = useCallback(async () => {
  try {
    const token = localStorage.getItem("token");

    const [expensesRes, totalRes] = await Promise.all([
      axios.get(`${API_BASE}/api/expenses`, { headers: { Authorization: `Bearer ${token}` } }),

      axios.get(`${API_BASE}/api/expenses`, { headers: { Authorization: `Bearer ${token}` } })

    ]);

    setExpenses(expensesRes.data);
    setFilteredExpenses(expensesRes.data);
    setTotalExpense(totalRes.data.totalExpense || 0);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  }
}, [navigate]);


  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Inside handleDelete:
const handleDelete = async (id) => {
  try {
    const token = localStorage.getItem("token");
    await axios.delete(`${API_BASE}/api/expenses/${id}`, {
  headers: { Authorization: `Bearer ${token}` },
});

    await fetchExpenses(); // await ensures UI refreshes after deletion
  } catch (error) {
    console.error("Error deleting expense:", error);
  }
};


  const handleEdit = (expense) => {
    setEditId(expense._id);
    setAmount(expense.amount);
    setCategory(expense.category);
    setDescription(expense.description);
    setDate(new Date(expense.date));
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE}/api/expenses/${editId}`, {
  amount,
  category,
  description,
  date,
}, {
  headers: { Authorization: `Bearer ${token}` },
});

      setEditId(null);
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date());
      fetchExpenses();
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const handleSearch = () => {
    let result = [...expenses];
    if (searchCategory) {
      result = result.filter(exp => exp.category === searchCategory);
    }
    if (searchDate) {
      const selectedDate = format(searchDate, 'yyyy-MM-dd');
      result = result.filter(exp => format(new Date(exp.date), 'yyyy-MM-dd') === selectedDate);
    }
    setFilteredExpenses(result);
  };

  const handleAddExpense = async () => {
  if (!description || !amount || !category || !date) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    await axios.post(`${API_BASE}/api/expenses`, {

        description,
        amount: parseFloat(amount), // ensure number
        category,
        date,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json", // ✅ added this line
        },
      }
    );

    setDescription('');
    setAmount('');
    setCategory('');
    setDate(new Date());

    await fetchExpenses(); // refresh after adding
  } catch (error) {
  console.error("Error adding expense:", error);

  if (error.response) {
    console.error("Response status:", error.response.status);
    console.error("Response data:", error.response.data);
    alert("Error: " + JSON.stringify(error.response.data));
  } else {
    alert("Unknown error occurred.");
    }
  }
};





  const handleClearFilters = () => {
    setSearchCategory('');
    setSearchDate(null);
    setFilteredExpenses(expenses);
  };

 const handleLogout = () => {
  localStorage.removeItem("token");
  navigate("/login");
};


  const chartData = Object.values(filteredExpenses.reduce((acc, curr) => {
    acc[curr.category] = acc[curr.category] || { category: curr.category, amount: 0 };
    acc[curr.category].amount += Number(curr.amount);
    return acc;
  }, {}));

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Expense Dashboard</h2>
      <div className="alert alert-info text-center fw-bold fs-5">
  Total Expense: ₹{totalExpense}
</div>
      <div className="alert alert-warning text-center fw-bold fs-6">
  Filtered Total: ₹{totalFiltered}
</div>

      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <label>Filter by Category</label>
          
<select
  className="form-control"
  value={searchCategory}
  onChange={(e) => setSearchCategory(e.target.value)}
>
  <option value="">All</option>
  <option value="Basic">Basic</option>
  <option value="Essential">Essential</option>
  <option value="Conditionally Essential">Conditionally Essential</option>
  <option value="Non-Essential">Non-Essential</option>
</select>

        </div>
        <div className="col-md-4">
          <label>Filter by Date</label>
          <DatePicker
            selected={searchDate}
            onChange={date => setSearchDate(date)}
            className="form-control"
            dateFormat="yyyy-MM-dd"
            placeholderText="Select a date"
          />
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <button className="btn btn-primary me-2" onClick={handleSearch}>Search</button>
          <button className="btn btn-secondary" onClick={handleClearFilters}>Clear</button>
        </div>
      </div>

      <h4 className="mt-4">Add New Expense</h4>
      <div className="row mb-4">
        <div className="col-md-3">
          <input
            type="text"
            className="form-control"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <input
            type="number"
            className="form-control"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="col-md-2">
        
<select
  className="form-control"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
>
  <option value="">Select Category</option>
  <option value="Basic">Basic</option>
  <option value="Essential">Essential</option>
  <option value="Conditionally Essential">Conditionally Essential</option>
  <option value="Non-Essential">Non-Essential</option>
</select>

        </div>
        <div className="col-md-3">
          <DatePicker
            selected={date}
            onChange={(date) => setDate(date)}
            className="form-control"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-success w-100" onClick={handleAddExpense}>Add Expense</button>
        </div>
      </div>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredExpenses.map(expense => (
            <tr key={expense._id}>
              <td>
                {editId === expense._id ? (
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-control"
                  />
                ) : (
                  expense.description
                )}
              </td>
              <td>
                {editId === expense._id ? (
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="form-control"
                  />
                ) : (
                  expense.amount
                )}
              </td>
              <td>
                {editId === expense._id ? (
                  // Edit Expense - category dropdown
<select
  className="form-control"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
>
  <option value="Basic">Basic</option>
  <option value="Essential">Essential</option>
  <option value="Conditionally Essential">Conditionally Essential</option>
  <option value="Non-Essential">Non-Essential</option>
</select>

                ) : (
                  expense.category
                )}
              </td>
              <td>
                {editId === expense._id ? (
                  <DatePicker
                    selected={date}
                    onChange={date => setDate(date)}
                    className="form-control"
                    dateFormat="yyyy-MM-dd"
                  />
                ) : (
                  format(new Date(expense.date), 'yyyy-MM-dd')
                )}
              </td>
              <td>
                {editId === expense._id ? (
                  <button className="btn btn-success btn-sm me-2" onClick={handleUpdate}>Save</button>
                ) : (
                  <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(expense)}>Edit</button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(expense._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 className="mt-5">Pie Chart - Expenses by Category</h4>
      <PieChart width={400} height={300}>
        <Pie
          data={chartData}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          label
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>

      <h4 className="mt-4">Bar Chart - Expenses by Category</h4>
      <BarChart width={500} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="amount" fill="#82ca9d" />
      </BarChart>
    </div>
  );
};

export default ExpenseDashboard;
