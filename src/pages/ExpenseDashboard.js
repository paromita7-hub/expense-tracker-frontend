import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import 'bootstrap/dist/css/bootstrap.min.css';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ExpenseDashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Basic');
  const [date, setDate] = useState('');
  const [total, setTotal] = useState(0);
  const [editId, setEditId] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/expenses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sorted = res.data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(sorted);
      calculateTotal(sorted);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const calculateTotal = (data) => {
    const totalAmount = data.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    setTotal(totalAmount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const expenseData = { amount, description, category, date };
    const token = localStorage.getItem('token');

    try {
      if (editId) {
        const res = await axios.put(`http://localhost:5000/api/expenses/${editId}`, expenseData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updated = expenses.map((e) => (e._id === editId ? res.data : e));
        setExpenses(updated);
        setEditId(null);
        calculateTotal(updated);
      } else {
        const res = await axios.post('http://localhost:5000/api/expenses', expenseData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newExpenses = [res.data, ...expenses];
        setExpenses(newExpenses);
        calculateTotal(newExpenses);
      }
      setAmount('');
      setDescription('');
      setCategory('Basic');
      setDate('');
    } catch (err) {
      console.error('Error saving expense:', err);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filtered = expenses.filter((e) => e._id !== id);
      setExpenses(filtered);
      calculateTotal(filtered);
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleEdit = (expense) => {
    setAmount(expense.amount);
    setDescription(expense.description);
    setCategory(expense.category);
    setDate(expense.date ? new Date(expense.date).toISOString().split('T')[0] : '');
    setEditId(expense._id);
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchDate = filterDate ? new Date(exp.date).toISOString().split('T')[0] === filterDate : true;
    const matchCategory = filterCategory ? exp.category === filterCategory : true;
    return matchDate && matchCategory;
  });

  const pieChartLabels = [...new Set(filteredExpenses.map((e) => e.category))];
  const pieChartData = pieChartLabels.map((label) =>
    filteredExpenses
      .filter((e) => e.category === label)
      .reduce((sum, e) => sum + Number(e.amount), 0)
  );

  const pieData = {
    labels: pieChartLabels,
    datasets: [
      {
        label: 'Amount by Category',
        data: pieChartData,
        backgroundColor: ['#f54291', '#42f5b9', '#f5c542', '#4287f5', '#9b59b6'],
      },
    ],
  };

  const barData = {
    labels: filteredExpenses.map((e) => e.description),
    datasets: [
      {
        label: 'Amount',
        data: filteredExpenses.map((e) => e.amount),
        backgroundColor: '#4287f5',
      },
    ],
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>💸 Expense Dashboard</h2>
        <button
          className="btn btn-danger"
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/';
          }}
        >
          Logout
        </button>
      </div>

      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-3">
          <input type="text" className="form-control" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>
        <div className="col-md-2">
          <input type="number" className="form-control" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="col-md-3">
          <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="Basic">Basic</option>
            <option value="Essential">Essential</option>
            <option value="Conditionally Essential">Conditionally Essential</option>
            <option value="Non-Essential">Non-Essential</option>
          </select>
        </div>
        <div className="col-md-2">
          <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" type="submit">
            {editId ? 'Update' : 'Add'}
          </button>
        </div>
      </form>

      <div className="mt-4 d-flex gap-3">
        <input className="form-control w-25" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
        <select className="form-select w-25" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Basic">Basic</option>
          <option value="Essential">Essential</option>
          <option value="Conditionally Essential">Conditionally Essential</option>
          <option value="Non-Essential">Non-Essential</option>
        </select>
      </div>

      <h4 className="mt-4">Total Expense: ₹{total}</h4>

      <ul className="list-group mt-3">
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((exp) => (
            <li key={exp._id} className="list-group-item d-flex justify-content-between align-items-center">
              {exp.description} | ₹{exp.amount} | {exp.category || 'No Category'} | {new Date(exp.date).toLocaleDateString()}
              <div>
                <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(exp)}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(exp._id)}>Delete</button>
              </div>
            </li>
          ))
        ) : (
          <li className="list-group-item">No expenses to show</li>
        )}
      </ul>

      <div className="row mt-5">
        <div className="col-md-6">
          <h5>Pie Chart</h5>
          <Pie data={pieData} />
        </div>
        <div className="col-md-6">
          <h5>Bar Chart</h5>
          <Bar data={barData} />
        </div>
      </div>
    </div>
  );
};

export default ExpenseDashboard;
