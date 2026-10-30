import express from "express"
import 'dotenv/config'
const app = express()
const port = process.env.PORT


app.get("/" , (req,res)=>{
    console.log("hello")
    res.send("hello")
})


















app.listen(port, ()=>{
    console.log(`server is running at http://localhost:${port}/`)
})