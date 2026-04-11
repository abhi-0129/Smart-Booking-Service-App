// ✅ Allowed origins - environment se bhi lo
const allowedOrigins = [
  'http://localhost:3000',
  'https://smart-booking-frontend-flame.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Postman/mobile apps ke liye (no origin)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      return callback(null, true); // ← temporarily sab allow karo
    }
  },
  credentials: true,
}));