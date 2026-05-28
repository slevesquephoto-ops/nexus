const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const parcoursRoutes = require('./routes/parcours');
const tracksRoutes = require('./routes/tracks');
const modulesRoutes = require('./routes/modules');
const tasksRoutes = require('./routes/tasks');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(helmet());
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000']

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'nexus-backend' }));

app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/parcours', parcoursRoutes);
app.use('/api/tracks', tracksRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;
