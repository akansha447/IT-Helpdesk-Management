require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const changeRequestRoutes = require('./routes/changeRequestRoutes');
const knowledgeBaseRoutes = require('./routes/knowledgeBaseRoutes');
const exportRoutes = require('./routes/exportRoutes');
const activityRoutes = require('./routes/activityRoutes');
const cabAuthorizerRoutes = require('./routes/cabAuthorizerRoutes');
const { isEmailConfigured } = require('./utils/email');

connectDB();

if (!isEmailConfigured()) {
	console.warn('Ticket email notifications are disabled. Configure SMTP_HOST, SMTP_USER and SMTP_PASS in server/.env.');
}

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/change-requests', changeRequestRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/cab-authorizers', cabAuthorizerRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
