const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/arvirium', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Успешное подключение к локальной MongoDB');
    } catch (err) {
        console.error('Ошибка подключения к базе данных:', err);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
}; 