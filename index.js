const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zrv8k.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);
async function run() {
    try {
        await client.connect();
        const userCollection = client.db('E-tools').collection('users');
        const productCollection = client.db('E-tools').collection('products');

        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
        });
        app.get('/products', async (req, res) => {
            const products = await productCollection.find().toArray();
            res.send(products);
        })
        // app.get('/available', async (req, res) => {
        //     const date = req.query.date;

        //     // step 1:  get all services
        //     const services = await serviceCollection.find().toArray();

        //     // step 2: get the booking of that day. output: [{}, {}, {}, {}, {}, {}]
        //     const query = { date: date };
        //     const bookings = await bookingCollection.find(query).toArray();

        //     // step 3: for each service
        //     services.forEach(service => {
        //         // step 4: find bookings for that service. output: [{}, {}, {}, {}]
        //         const serviceBookings = bookings.filter(book => book.treatment === service.name);
        //         // step 5: select slots for the service Bookings: ['', '', '', '']
        //         const bookedSlots = serviceBookings.map(book => book.slot);
        //         // step 6: select those slots that are not in bookedSlots
        //         const available = service.slots.filter(slot => !bookedSlots.includes(slot));
        //         //step 7: set available to slots to make it easier 
        //         service.slots = available;
        //     });

    }
    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Server is Started')
})

app.listen(port, () => {
    console.log(`E-tools is listening on port ${port}`)
})
